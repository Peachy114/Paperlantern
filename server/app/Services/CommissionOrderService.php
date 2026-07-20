<?php

namespace App\Services;

use App\Models\CommissionOrder;
use App\Models\User;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class CommissionOrderService
{
    public function __construct(
        private WalletRepository $wallets,
        private CommissionService $earnings,
    ) {}

    public function release(CommissionOrder $order): CommissionOrder
    {
        return DB::transaction(function () use ($order) {
            $order = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with(['artist', 'customer'])
                ->firstOrFail();

            if ($order->status === 'completed') {
                return $order;
            }

            abort_if(
                (int) $order->escrow_credits < (int) $order->quote_credits,
                402,
                'Pay the full commission amount before approving final delivery.'
            );

            $remaining = max(0, (int) $order->escrow_credits - (int) $order->released_credits - (int) $order->refunded_credits);

            if ($remaining > 0 && $order->artist && $order->customer) {
                $this->earnings->recordEarning(
                    $order->customer,
                    $order->artist,
                    $remaining,
                    'commission_release',
                    $order,
                );
            }

            $order->update([
                'status' => 'completed',
                'released_credits' => (int) $order->released_credits + $remaining,
                'completed_at' => now(),
                'auto_release_at' => null,
            ]);

            return $order->fresh(['service', 'artist', 'customer']);
        });
    }

    public function refund(CommissionOrder $order, ?float $rate = null): CommissionOrder
    {
        return DB::transaction(function () use ($order, $rate) {
            $order = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with('customer')
                ->firstOrFail();

            if ($order->status === 'cancelled') {
                return $order;
            }

            $remaining = max(0, (int) $order->escrow_credits - (int) $order->released_credits - (int) $order->refunded_credits);
            $refundRate = $rate ?? (in_array($order->status, ['requested', 'awaiting_payment'], true) ? 1.0 : 0.5);
            $refundCredits = (int) floor($remaining * max(0, min(1, $refundRate)));

            if ($refundCredits > 0 && $order->customer) {
                $wallet = $this->wallets->findOrCreateByUser($order->customer_id);
                $this->wallets->credit($wallet, $refundCredits, [
                    'source' => 'commission_refund',
                    'description' => 'Commission refund',
                    'meta' => [
                        'commission_order_id' => $order->id,
                        'refund_rate' => $refundRate,
                    ],
                ]);
            }

            $order->update([
                'status' => 'cancelled',
                'refunded_credits' => (int) $order->refunded_credits + $refundCredits,
                'cancelled_at' => now(),
                'auto_release_at' => null,
            ]);

            return $order->fresh(['service', 'artist', 'customer']);
        });
    }

    public function sendQuote(
        CommissionOrder $order,
        User $artist,
        int $quoteCredits,
        array $flow,
        ?string $quoteNote = null,
    ): CommissionOrder {
        abort_unless($order->artist_id === $artist->id, 404);
        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'This commission can no longer be quoted.');

        $order->update([
            'status' => 'quoted',
            'quote_credits' => $quoteCredits,
            'credits_checked' => $quoteCredits,
            'quote_note' => $quoteNote,
            'flow_snapshot' => count($flow) > 0 ? array_values($flow) : ($order->flow_snapshot ?? []),
            'paid_steps' => [],
            'stage_notes' => [],
            'stage_attempts_used' => [],
            'current_step_index' => 0,
            'payment_due_at' => null,
            'auto_release_at' => null,
        ]);

        return $order->fresh(['service', 'artist', 'customer']);
    }

    public function acceptQuote(CommissionOrder $order, User $customer): CommissionOrder
    {
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless($order->status === 'quoted', 422, 'Only quoted commissions can be accepted.');

        $wallet = $this->wallets->findOrCreateByUser($customer->id);
        $remainingTotal = max(0, (int) $order->quote_credits - (int) $order->escrow_credits);
        abort_if($wallet->balance < $remainingTotal, 402, 'Add enough credits for the full quoted amount before accepting.');

        $order->update([
            'status' => 'in_progress',
            'quote_accepted_at' => now(),
            'accepted_at' => $order->accepted_at ?? now(),
            'auto_pay_agreed' => true,
        ]);

        return $this->collectNextPayment($order->fresh(), $customer, true);
    }

    public function collectNextPayment(CommissionOrder $order, User $customer, bool $allowNoDue = false): CommissionOrder
    {
        abort_unless($order->customer_id === $customer->id, 404);

        return DB::transaction(function () use ($order, $customer, $allowNoDue) {
            $order = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $next = $this->nextPayStep($order);
            if (! $next) {
                abort_unless($allowNoDue, 422, 'No unpaid payment stage is available.');
                return $order->fresh(['service', 'artist', 'customer']);
            }

            $amount = $this->stepAmount($order, $next['step']);
            if ($amount <= 0) {
                $this->markPaidStep($order, $next['index']);
                return $order->fresh(['service', 'artist', 'customer']);
            }

            $wallet = $this->wallets->findOrCreateByUser($customer->id);
            $transaction = $this->wallets->debit($wallet, $amount, [
                'source' => 'commission_escrow',
                'description' => "Commission payment stage - {$order->service?->title}",
                'meta' => [
                    'commission_order_id' => $order->id,
                    'step_index' => $next['index'],
                    'step_label' => $next['step']['label'] ?? 'Payment',
                    'credits' => $amount,
                ],
            ]);

            abort_if($transaction === false, 402, 'Insufficient credits for this payment stage.');

            $paidSteps = $this->paidSteps($order);
            $paidSteps[] = $next['index'];
            sort($paidSteps);

            $order->update([
                'status' => 'in_progress',
                'escrow_credits' => (int) $order->escrow_credits + $amount,
                'paid_steps' => array_values(array_unique($paidSteps)),
                'current_step_index' => max((int) $order->current_step_index, $next['index'] + 1),
                'payment_due_at' => null,
            ]);

            return $order->fresh(['service', 'artist', 'customer']);
        });
    }

    public function advanceStage(CommissionOrder $order, User $artist, int $stepIndex, ?string $note = null): CommissionOrder
    {
        abort_unless($order->artist_id === $artist->id, 404);
        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'This commission can no longer be updated.');

        return $this->moveToStage($order, $stepIndex, $note);
    }

    public function requestCreativeAttempt(
        CommissionOrder $order,
        User $customer,
        int $stepIndex,
        ?string $note = null,
        bool $payExtra = false,
    ): array {
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless(in_array($order->status, ['in_progress', 'delivered'], true), 422, 'Creative changes can only be requested while work is active or delivered.');

        return DB::transaction(function () use ($order, $customer, $stepIndex, $note, $payExtra) {
            $order = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $flow = $order->flow_snapshot ?? [];
            abort_unless(isset($flow[$stepIndex]), 422, 'Unknown commission stage.');

            $step = $flow[$stepIndex];
            abort_unless($this->isCreativeStage($step), 422, 'Only sketch, revision, draft, or custom creative stages can be requested again.');

            $limit = max(0, (int) ($step['rounds'] ?? 0));
            $attempts = $order->stage_attempts_used ?? [];
            $used = (int) ($attempts[(string) $stepIndex] ?? 0);
            $extraCredits = 0;

            if ($limit > 0 && $used >= $limit) {
                abort_unless($payExtra, 402, 'This stage has used all included attempts. Pay for an extra attempt or continue the original flow.');
                $extraCredits = $this->extraAttemptCredits($order);
                $wallet = $this->wallets->findOrCreateByUser($customer->id);
                $transaction = $this->wallets->debit($wallet, $extraCredits, [
                    'source' => 'commission_escrow',
                    'description' => "Extra commission attempt - {$step['label']}",
                    'meta' => [
                        'commission_order_id' => $order->id,
                        'step_index' => $stepIndex,
                        'step_label' => $step['label'] ?? 'Creative stage',
                        'credits' => $extraCredits,
                    ],
                ]);

                abort_if($transaction === false, 402, 'Insufficient credits for the extra attempt.');
                $order->increment('escrow_credits', $extraCredits);
                $order->refresh();
            }

            $attempts[(string) $stepIndex] = $used + 1;
            $notes = $order->stage_notes ?? [];
            $notes[(string) $stepIndex] = [
                'note' => trim((string) $note),
                'at' => now()->toISOString(),
                'requested_by' => $customer->id,
            ];

            $order->update([
                'status' => 'in_progress',
                'current_step_index' => $stepIndex,
                'stage_attempts_used' => $attempts,
                'stage_notes' => $notes,
                'auto_release_at' => null,
                'payment_due_at' => null,
            ]);

            return [
                'order' => $order->fresh(['service', 'artist', 'customer']),
                'step' => $step,
                'attempts_used' => $attempts[(string) $stepIndex],
                'attempt_limit' => $limit,
                'extra_credits' => $extraCredits,
            ];
        });
    }

    public function continueFromCurrentStage(CommissionOrder $order, User $customer): CommissionOrder
    {
        abort_unless($order->customer_id === $customer->id, 404);
        abort_if(in_array($order->status, ['completed', 'cancelled'], true), 422, 'This commission can no longer be updated.');

        $nextIndex = min(count($order->flow_snapshot ?? []) - 1, ((int) $order->current_step_index) + 1);
        abort_if($nextIndex < 0, 422, 'This commission does not have a stage flow.');

        return $this->moveToStage($order, $nextIndex, 'Client approved this step and continued the original flow.');
    }

    public function payFinalAndRelease(CommissionOrder $order, User $customer): array
    {
        abort_unless($order->customer_id === $customer->id, 404);
        abort_unless($order->status === 'delivered', 422, 'Final delivery can only be paid after artist delivery.');

        return DB::transaction(function () use ($order, $customer) {
            $order = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with(['artist', 'customer'])
                ->firstOrFail();

            $amount = max(0, (int) $order->quote_credits - (int) $order->escrow_credits);
            if ($amount > 0) {
                $wallet = $this->wallets->findOrCreateByUser($customer->id);
                abort_if(
                    (int) $wallet->fresh()->balance < $amount,
                    402,
                    "You need {$amount} credits to pay the final delivery."
                );

                $transaction = $this->wallets->debit($wallet, $amount, [
                    'source' => 'commission_escrow',
                    'description' => 'Commission final payment',
                    'meta' => [
                        'commission_order_id' => $order->id,
                        'credits' => $amount,
                    ],
                ]);

                abort_if($transaction === false, 402, 'Insufficient credits to pay the final delivery.');
                $order->increment('escrow_credits', $amount);
                $order->refresh();
            }

            $order->update(['final_payment_paid_at' => now()]);

            return [
                'order' => $this->release($order->fresh()),
                'amount' => $amount,
            ];
        });
    }

    public function archive(CommissionOrder $order, User $artist): CommissionOrder
    {
        abort_unless($order->artist_id === $artist->id, 404);
        abort_unless($order->status === 'completed', 422, 'Only completed commissions can be archived.');

        $order->update(['archived_at' => now()]);

        return $order->fresh(['service', 'artist', 'customer']);
    }

    public function extraAttemptCredits(CommissionOrder $order): int
    {
        return max(1, (int) ceil(max(1, (int) $order->quote_credits) * 0.10));
    }

    private function moveToStage(CommissionOrder $order, int $stepIndex, ?string $note = null): CommissionOrder
    {
        $flow = $order->flow_snapshot ?? [];
        abort_unless(isset($flow[$stepIndex]), 422, 'Unknown commission stage.');

        $step = $flow[$stepIndex];
        $notes = $order->stage_notes ?? [];
        if ($note !== null && trim($note) !== '') {
            $notes[(string) $stepIndex] = [
                'note' => trim($note),
                'at' => now()->toISOString(),
            ];
        }

        $updates = [
            'current_step_index' => $stepIndex,
            'stage_notes' => $notes,
            'status' => $order->status === 'quoted' ? 'in_progress' : $order->status,
        ];

        if (($step['type'] ?? null) === 'pay' && ! in_array($stepIndex, $this->paidSteps($order), true)) {
            $updates['status'] = 'awaiting_payment';
            $updates['payment_due_at'] = now()->addDays(5);
        } else {
            $updates['payment_due_at'] = null;
            if ($order->status === 'awaiting_payment') {
                $updates['status'] = 'in_progress';
            }
        }

        $order->update($updates);

        return $order->fresh(['service', 'artist', 'customer']);
    }

    private function isCreativeStage(array $step): bool
    {
        return in_array($step['type'] ?? null, ['sketch', 'revision', 'draft', 'add'], true);
    }

    public function releaseDueOrders(?string $participantId = null): int
    {
        $this->collectDueStagePayments($participantId);

        $query = CommissionOrder::query()
            ->where('status', 'delivered')
            ->whereNotNull('auto_release_at')
            ->where('auto_release_at', '<=', now());

        if ($participantId) {
            $query->where(function ($q) use ($participantId) {
                $q->where('artist_id', $participantId)->orWhere('customer_id', $participantId);
            });
        }

        $released = 0;
        $query->get()->each(function (CommissionOrder $order) use (&$released) {
            if ((int) $order->escrow_credits >= (int) $order->quote_credits) {
                $this->release($order);
                $released++;
            }
        });

        return $released;
    }

    public function collectDueStagePayments(?string $participantId = null): int
    {
        $query = CommissionOrder::query()
            ->where('status', 'awaiting_payment')
            ->where('auto_pay_agreed', true)
            ->whereNotNull('payment_due_at')
            ->where('payment_due_at', '<=', now());

        if ($participantId) {
            $query->where(function ($q) use ($participantId) {
                $q->where('artist_id', $participantId)->orWhere('customer_id', $participantId);
            });
        }

        $collected = 0;
        $query->with('customer')->get()->each(function (CommissionOrder $order) use (&$collected) {
            try {
                if ($order->customer) {
                    $this->collectNextPayment($order, $order->customer);
                    $collected++;
                }
            } catch (\Throwable) {
                $order->update([
                    'status' => 'disputed',
                    'disputed_at' => now(),
                ]);
            }
        });

        return $collected;
    }

    private function nextPayStep(CommissionOrder $order): ?array
    {
        $paid = $this->paidSteps($order);
        foreach (($order->flow_snapshot ?? []) as $index => $step) {
            if (($step['type'] ?? null) === 'pay' && ! in_array((int) $index, $paid, true)) {
                return ['index' => (int) $index, 'step' => $step];
            }
        }

        return null;
    }

    private function stepAmount(CommissionOrder $order, array $step): int
    {
        $percent = max(0, min(100, (int) ($step['percent'] ?? 0)));
        return (int) ceil(((int) $order->quote_credits) * ($percent / 100));
    }

    private function paidSteps(CommissionOrder $order): array
    {
        return array_values(array_map('intval', $order->paid_steps ?? []));
    }

    private function markPaidStep(CommissionOrder $order, int $stepIndex): void
    {
        $paidSteps = $this->paidSteps($order);
        $paidSteps[] = $stepIndex;
        $order->update(['paid_steps' => array_values(array_unique($paidSteps))]);
    }
}
