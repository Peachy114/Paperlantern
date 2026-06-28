<?php

namespace App\Services;

use App\Models\CreditPackage;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Repositories\CreditPackageRepository;
use App\Repositories\WalletRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use App\Models\Chapter;

class WalletService
{
    public function __construct(
        private WalletRepository        $walletRepo,
        private CreditPackageRepository $packageRepo,
        private PayMongoService         $payMongo,
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

        if (! $package || ! $package->is_active) {
            throw new \InvalidArgumentException('Credit package not found or inactive.');
        }

        return $this->payMongo->createCheckoutLink([
            'amount'      => (float) $package->price,
            'description' => "Top up – {$package->credits} credits ({$package->name})",
            'metadata'    => [
                'user_id'    => $user->id,
                'package_id' => $package->id,
                'credits'    => $package->credits,
            ],
        ]);
    }

    public function handlePaymentSuccess(array $webhookData): void
    {
        $referenceId = $webhookData['reference_id'];
        $metadata    = $webhookData['metadata'];

        if ($this->walletRepo->referenceExists($referenceId)) {
            Log::info("WalletService: duplicate webhook reference skipped [{$referenceId}]");
            return;
        }

        $userId  = $metadata['user_id'] ?? null;  // keep as string (UUID)
        $credits = (int) ($metadata['credits'] ?? 0);

        if (! $userId || ! $credits) {
            Log::error('WalletService: missing metadata in webhook', $webhookData);
            return;
        }

        $wallet = $this->walletRepo->findOrCreateByUser($userId);

        $this->walletRepo->credit($wallet, $credits, [
            'source'       => 'purchase',
            'description'  => "Purchased {$credits} credits via PayMongo",
            'reference_id' => $referenceId,
            'meta'         => $metadata,
        ]);

        Log::info("WalletService: credited {$credits} credits to user {$userId}");
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
            'source'      => 'chapter_unlock',
            'description' => "Unlocked chapter — {$chapter->title}",
            'meta'        => ['chapter_id' => $chapter->id, 'cost' => $cost],
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
}