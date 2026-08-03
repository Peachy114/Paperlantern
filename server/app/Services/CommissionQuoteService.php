<?php

namespace App\Services;

use App\Models\CommissionMessage;
use App\Models\CommissionOrder;
use App\Models\CommissionQuote;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CommissionQuoteService
{
    public function __construct(private CommissionOrderService $orders) {}

    public function sendQuote(
        CommissionOrder $order,
        User $artist,
        int $quoteCredits,
        array $flow,
        ?string $quoteNote = null,
    ): array {
        return DB::transaction(function () use (
            $order,
            $artist,
            $quoteCredits,
            $flow,
            $quoteNote,
        ) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->id)
                ->with('service')
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedOrder->artist_id === $artist->id, 404);
            abort_unless(
                in_array($lockedOrder->status, ['requested', 'quoted'], true),
                422,
                'The quote can only be created or changed before it is accepted.'
            );

            $hadQuote = $lockedOrder->quotes()->exists();
            $version = ((int) $lockedOrder->quotes()->max('version')) + 1;

            $lockedOrder->quotes()
                ->whereIn('status', [
                    CommissionQuote::STATUS_PENDING,
                    CommissionQuote::STATUS_RENEGOTIATION_REQUESTED,
                ])
                ->update([
                    'status' => CommissionQuote::STATUS_SUPERSEDED,
                    'superseded_at' => now(),
                    'updated_at' => now(),
                ]);

            $updatedOrder = $this->orders->sendQuote(
                $lockedOrder,
                $artist,
                $quoteCredits,
                $flow,
                $quoteNote,
            );

            $quote = CommissionQuote::create([
                'commission_order_id' => $updatedOrder->id,
                'created_by' => $artist->id,
                'version' => $version,
                'quote_credits' => $quoteCredits,
                'quote_note' => $quoteNote,
                'flow_snapshot' => $updatedOrder->flow_snapshot ?? [],
                'status' => CommissionQuote::STATUS_PENDING,
            ]);

            $this->createSystemMessage(
                $updatedOrder,
                $artist,
                $hadQuote
                    ? "Artist sent changed Commission Quote Version {$version}: {$quoteCredits} credits."
                    : "Artist sent Commission Quote Version {$version}: {$quoteCredits} credits."
            );

            return [
                'order' => $this->freshOrder($updatedOrder),
                'quote' => $quote->fresh('creator'),
            ];
        });
    }

    public function requestNewQuote(
        CommissionOrder $order,
        User $customer,
        string $quoteId,
        string $reason,
        ?int $preferredCredits = null,
        ?string $requestedChanges = null,
    ): array {
        return DB::transaction(function () use (
            $order,
            $customer,
            $quoteId,
            $reason,
            $preferredCredits,
            $requestedChanges,
        ) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedOrder->customer_id === $customer->id, 404);
            abort_unless($lockedOrder->status === 'quoted', 422, 'There is no active quote to renegotiate.');

            $quote = $lockedOrder->quotes()
                ->whereKey($quoteId)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $quote->status === CommissionQuote::STATUS_PENDING,
                422,
                'Only the current pending quote can be renegotiated.'
            );

            $quote->update([
                'status' => CommissionQuote::STATUS_RENEGOTIATION_REQUESTED,
                'renegotiation_reason' => trim($reason),
                'preferred_credits' => $preferredCredits,
                'requested_changes' => $requestedChanges !== null
                    ? trim($requestedChanges)
                    : null,
                'renegotiation_requested_at' => now(),
            ]);

            $lockedOrder->update([
                'status' => 'requested',
                'payment_due_at' => null,
            ]);

            $details = ['Wanderer requested a new quote.'];
            if ($preferredCredits !== null) {
                $details[] = "Preferred budget: {$preferredCredits} credits";
            }
            $details[] = 'Reason: ' . trim($reason);
            if ($requestedChanges !== null && trim($requestedChanges) !== '') {
                $details[] = 'Requested changes: ' . trim($requestedChanges);
            }

            $this->createSystemMessage(
                $lockedOrder,
                $customer,
                implode("\n", $details)
            );

            return [
                'order' => $this->freshOrder($lockedOrder),
                'quote' => $quote->fresh('creator'),
            ];
        });
    }

    public function rejectQuote(
        CommissionOrder $order,
        User $customer,
        string $quoteId,
        ?string $reason = null,
    ): array {
        return DB::transaction(function () use (
            $order,
            $customer,
            $quoteId,
            $reason,
        ) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedOrder->customer_id === $customer->id, 404);
            abort_unless($lockedOrder->status === 'quoted', 422, 'There is no active quote to reject.');

            $quote = $lockedOrder->quotes()
                ->whereKey($quoteId)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $quote->status === CommissionQuote::STATUS_PENDING,
                422,
                'Only the current pending quote can be rejected.'
            );

            $quote->update([
                'status' => CommissionQuote::STATUS_REJECTED,
                'rejected_at' => now(),
                'rejection_reason' => $reason !== null && trim($reason) !== ''
                    ? trim($reason)
                    : null,
            ]);

            $lockedOrder->update([
                'status' => 'requested',
                'payment_due_at' => null,
            ]);

            $body = 'Commission Quote Rejected.';
            if ($reason !== null && trim($reason) !== '') {
                $body .= "\nReason: " . trim($reason);
            }

            $this->createSystemMessage($lockedOrder, $customer, $body);

            return [
                'order' => $this->freshOrder($lockedOrder),
                'quote' => $quote->fresh('creator'),
            ];
        });
    }

    public function acceptQuote(
        CommissionOrder $order,
        User $customer,
        ?string $quoteId = null,
    ): array {
        return DB::transaction(function () use ($order, $customer, $quoteId) {
            $lockedOrder = CommissionOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedOrder->customer_id === $customer->id, 404);

            $quoteQuery = $lockedOrder->quotes()
                ->where('status', CommissionQuote::STATUS_PENDING)
                ->reorder()
                ->orderByDesc('version')
                ->lockForUpdate();

            $quote = $quoteId
                ? $quoteQuery->whereKey($quoteId)->first()
                : $quoteQuery->latest('version')->first();

            abort_unless($quote, 422, 'There is no pending quote to accept.');

            $lockedOrder->update([
                'status' => 'quoted',
                'quote_credits' => $quote->quote_credits,
                'credits_checked' => $quote->quote_credits,
                'quote_note' => $quote->quote_note,
                'flow_snapshot' => $quote->flow_snapshot ?? [],
            ]);

            $acceptedOrder = $this->orders->acceptQuote(
                $lockedOrder->fresh(),
                $customer,
            );

            $quote->update([
                'status' => CommissionQuote::STATUS_ACCEPTED,
                'accepted_at' => now(),
            ]);

            $acceptedOrder->quotes()
                ->where('id', '!=', $quote->id)
                ->whereIn('status', [
                    CommissionQuote::STATUS_PENDING,
                    CommissionQuote::STATUS_RENEGOTIATION_REQUESTED,
                ])
                ->update([
                    'status' => CommissionQuote::STATUS_SUPERSEDED,
                    'superseded_at' => now(),
                    'updated_at' => now(),
                ]);

            $this->createSystemMessage(
                $acceptedOrder,
                $customer,
                "Commission Quote Accepted.\n{$quote->quote_credits} credits"
            );

            return [
                'order' => $this->freshOrder($acceptedOrder),
                'quote' => $quote->fresh('creator'),
            ];
        });
    }

    public static function formatQuote(CommissionQuote $quote): array
    {
        return [
            'id' => $quote->id,
            'version' => (int) $quote->version,
            'quote_credits' => (int) $quote->quote_credits,
            'quote_note' => $quote->quote_note,
            'flow_snapshot' => $quote->flow_snapshot ?? [],
            'status' => $quote->status,
            'renegotiation_reason' => $quote->renegotiation_reason,
            'preferred_credits' => $quote->preferred_credits !== null
                ? (int) $quote->preferred_credits
                : null,
            'requested_changes' => $quote->requested_changes,
            'renegotiation_requested_at' => $quote->renegotiation_requested_at,
            'accepted_at' => $quote->accepted_at,
            'rejected_at' => $quote->rejected_at,
            'rejection_reason' => $quote->rejection_reason,
            'superseded_at' => $quote->superseded_at,
            'created_at' => $quote->created_at,
            'updated_at' => $quote->updated_at,
            'creator' => $quote->creator ? [
                'id' => $quote->creator->id,
                'name' => $quote->creator->name,
                'username' => $quote->creator->username,
                'avatar' => $quote->creator->avatar,
            ] : null,
        ];
    }

    private function freshOrder(CommissionOrder $order): CommissionOrder
    {
        return $order->fresh([
            'service:id,title,slug,image_path,delivery_days,base_price_credits',
            'artist:id,name,username,avatar,artist_verified',
            'customer:id,name,username,avatar',
            'quotes.creator:id,name,username,avatar',
            'revisions.requester:id,name,username,avatar',
            'deliveryFiles.uploader:id,name,username,avatar',
        ]);
    }

    private function createSystemMessage(
        CommissionOrder $order,
        User $sender,
        string $body,
    ): void {
        CommissionMessage::create([
            'commission_order_id' => $order->id,
            'sender_id' => $sender->id,
            'body' => $body,
            'kind' => 'system',
            'upload_type' => null,
            'stage_index' => null,
            'approval_status' => null,
            'delivery_file_id' => null,
            'image_path' => null,
            'image_moderation_status' => 'approved',
        ]);

        $order->touch();
    }
}
