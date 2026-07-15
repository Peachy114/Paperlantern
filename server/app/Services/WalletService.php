<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\CreditPaymentSession;
use App\Models\User;
use App\Models\Wallet;
use App\Repositories\CreditPackageRepository;
use App\Repositories\WalletRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WalletService
{
    public function __construct(
        private WalletRepository $walletRepo,
        private CreditPackageRepository $packageRepo,
        private PayMongoService $payMongo,
    ) {}

    public function getWallet(User $user): Wallet
    {
        return $this->walletRepo->findOrCreateByUser($user->id);
    }

    public function getPackages(): array
    {
        return $this->packageRepo->allActive()->toArray();
    }

    public function getTransactionHistory(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->walletRepo->getTransactions($user->id, $perPage);
    }

    public function initiateCheckout(User $user, int $packageId): array
    {
        $package = $this->packageRepo->find($packageId);

        if (! $package || ! $package->isAvailableForPurchase()) {
            throw new \InvalidArgumentException('Credit package not found or inactive.');
        }

        $paymentId = (string) Str::uuid();
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $expiresAt = now()->addMinutes(30);
        $description = "Top up - {$package->credits} credits ({$package->name})";
        $metadata = [
            'payment_session_id' => $paymentId,
            'user_id' => $user->id,
            'package_id' => $package->id,
            'credits' => $package->credits,
        ];

        $checkout = $this->payMongo->createCheckoutLink([
            'amount' => (float) $package->price,
            'description' => $description,
            'success_url' => "{$frontendUrl}/credits/payment/{$paymentId}?status=success",
            'cancel_url' => "{$frontendUrl}/credits/payment/{$paymentId}?status=failed",
            'metadata' => $metadata,
        ]);

        $payment = CreditPaymentSession::create([
            'id' => $paymentId,
            'user_id' => $user->id,
            'credit_package_id' => $package->id,
            'provider' => 'paymongo',
            'provider_mode' => $this->payMongo->mode(),
            'reference_id' => $checkout['reference_id'],
            'checkout_url' => $checkout['checkout_url'],
            'status' => 'pending',
            'currency' => 'PHP',
            'amount' => $package->price,
            'credits' => $package->credits,
            'description' => $description,
            'expires_at' => $expiresAt,
            'meta' => $metadata,
        ]);

        return [
            'checkout_url' => $payment->checkout_url,
            'reference_id' => $payment->reference_id,
            'payment_id' => $payment->id,
            'payment_url' => "/credits/payment/{$payment->id}",
            'status' => $payment->status,
        ];
    }

    public function getPaymentSession(User $user, string $paymentId): CreditPaymentSession
    {
        $payment = CreditPaymentSession::with('package')
            ->where('user_id', $user->id)
            ->where('id', $paymentId)
            ->firstOrFail();

        if ($payment->status === 'pending' && $payment->expires_at && $payment->expires_at->isPast()) {
            $payment = $this->markPaymentStatus($payment, 'expired', [
                'reason' => 'local_expiry_check',
            ]);
        }

        return $payment->load('package');
    }

    public function simulatePayment(User $user, string $paymentId, string $status): CreditPaymentSession
    {
        if (! $this->payMongo->canSimulatePayments()) {
            throw new \RuntimeException('Payment simulation is only available in test mode.');
        }

        $payment = CreditPaymentSession::where('user_id', $user->id)
            ->where('id', $paymentId)
            ->firstOrFail();

        return match ($status) {
            'paid', 'success' => $this->completePaymentSession($payment, [
                'simulated' => true,
            ], $payment->reference_id ?? "simulated_{$payment->id}"),
            'failed' => $this->markPaymentStatus($payment, 'failed', [
                'reason' => 'simulated_failure',
            ]),
            'expired' => $this->markPaymentStatus($payment, 'expired', [
                'reason' => 'simulated_expiry',
            ]),
            default => throw new \InvalidArgumentException('Unsupported simulated payment status.'),
        };
    }

    public function handlePaymentSuccess(array $webhookData): void
    {
        $payment = $this->findPaymentFromWebhook($webhookData);

        if ($payment) {
            $this->completePaymentSession(
                $payment,
                $webhookData['metadata'] ?? [],
                $webhookData['reference_id'] ?? $payment->reference_id,
            );
            return;
        }

        $referenceId = $webhookData['reference_id'];
        $metadata = $webhookData['metadata'];

        if ($this->walletRepo->referenceExists($referenceId)) {
            Log::info("WalletService: duplicate webhook reference skipped [{$referenceId}]");
            return;
        }

        $userId = $metadata['user_id'] ?? null;
        $credits = (int) ($metadata['credits'] ?? 0);

        if (! $userId || ! $credits) {
            Log::error('WalletService: missing metadata in webhook', $webhookData);
            return;
        }

        $wallet = $this->walletRepo->findOrCreateByUser($userId);

        $this->walletRepo->credit($wallet, $credits, [
            'source' => 'purchase',
            'description' => "Purchased {$credits} credits via PayMongo",
            'reference_id' => $referenceId,
            'meta' => $metadata,
        ]);

        Log::info("WalletService: credited {$credits} credits to user {$userId}");
    }

    public function handlePaymentFailure(array $webhookData, string $status): void
    {
        $payment = $this->findPaymentFromWebhook($webhookData);

        if (! $payment) {
            Log::info("WalletService: {$status} webhook has no local payment session", $webhookData);
            return;
        }

        $this->markPaymentStatus($payment, $status, [
            'webhook_event' => $webhookData['event'] ?? null,
        ]);
    }

    public function completePaymentSession(
        CreditPaymentSession $payment,
        array $metadata = [],
        ?string $referenceId = null,
    ): CreditPaymentSession {
        return DB::transaction(function () use ($payment, $metadata, $referenceId) {
            $payment = CreditPaymentSession::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $referenceId = $referenceId ?: $payment->reference_id ?: "payment_{$payment->id}";

            if ($payment->status === 'paid') {
                return $payment->load('package');
            }

            if ($this->walletRepo->referenceExists($referenceId)) {
                $payment->forceFill([
                    'status' => 'paid',
                    'reference_id' => $referenceId,
                    'paid_at' => $payment->paid_at ?? now(),
                    'meta' => array_merge($payment->meta ?? [], $metadata),
                ])->save();

                return $payment->load('package');
            }

            $wallet = $this->walletRepo->findOrCreateByUser($payment->user_id);

            $this->walletRepo->credit($wallet, $payment->credits, [
                'source' => 'purchase',
                'description' => "Purchased {$payment->credits} credits via PayMongo",
                'reference_id' => $referenceId,
                'meta' => array_merge($payment->meta ?? [], $metadata, [
                    'payment_session_id' => $payment->id,
                    'provider' => $payment->provider,
                    'provider_mode' => $payment->provider_mode,
                ]),
            ]);

            $payment->forceFill([
                'status' => 'paid',
                'reference_id' => $referenceId,
                'paid_at' => now(),
                'failed_at' => null,
                'expired_at' => null,
                'meta' => array_merge($payment->meta ?? [], $metadata),
            ])->save();

            Log::info("WalletService: credited {$payment->credits} credits to user {$payment->user_id}");

            return $payment->load('package');
        });
    }

    public function spendCredits(User $user, Chapter $chapter, int $cost): array
    {
        $wallet = $this->walletRepo->findOrCreateByUser($user->id);

        if ($wallet->balance < $cost) {
            return [
                'success' => false,
                'balance' => $wallet->balance,
                'message' => 'Insufficient credits.',
            ];
        }

        $result = $this->walletRepo->debit($wallet, $cost, [
            'source' => 'chapter_unlock',
            'description' => "Unlocked chapter - {$chapter->title}",
            'meta' => ['chapter_id' => $chapter->id, 'cost' => $cost],
        ]);

        if ($result === false) {
            return [
                'success' => false,
                'balance' => $wallet->fresh()->balance,
                'message' => 'Insufficient credits.',
            ];
        }

        return [
            'success' => true,
            'balance' => $result->balance_after,
            'message' => 'Chapter unlocked successfully.',
        ];
    }

    private function markPaymentStatus(
        CreditPaymentSession $payment,
        string $status,
        array $meta = [],
    ): CreditPaymentSession {
        return DB::transaction(function () use ($payment, $status, $meta) {
            $payment = CreditPaymentSession::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            if ($payment->status === 'paid') {
                return $payment->load('package');
            }

            $timestamps = match ($status) {
                'failed' => ['failed_at' => now()],
                'expired' => ['expired_at' => now()],
                default => [],
            };

            $payment->forceFill(array_merge($timestamps, [
                'status' => $status,
                'meta' => array_merge($payment->meta ?? [], $meta),
            ]))->save();

            return $payment->load('package');
        });
    }

    private function findPaymentFromWebhook(array $webhookData): ?CreditPaymentSession
    {
        $metadata = $webhookData['metadata'] ?? [];
        $paymentId = $metadata['payment_session_id'] ?? null;
        $referenceId = $webhookData['reference_id'] ?? null;

        return CreditPaymentSession::query()
            ->when($paymentId, fn($query) => $query->where('id', $paymentId))
            ->when(! $paymentId && $referenceId, fn($query) => $query->where('reference_id', $referenceId))
            ->first();
    }
}
