<?php

namespace App\Services;

use App\Models\Art;
use App\Models\ArtDownload;
use App\Models\User;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class ArtDownloadService
{
    public function __construct(
        private WalletRepository $wallets,
        private CommissionService $commissions,
    ) {}

    public function unlockedFor(?User $user, Art $art): bool
    {
        if ($user && $art->user_id === $user->id) {
            return false;
        }

        if ($art->download_policy === 'free') {
            return true;
        }

        if (! $user) {
            return false;
        }

        return ArtDownload::where('user_id', $user->id)
            ->where('art_id', $art->id)
            ->exists();
    }

    public function purchase(User $user, Art $art): array
    {
        if ($art->download_policy !== 'paid') {
            return [
                'success' => $art->download_policy === 'free',
                'message' => $art->download_policy === 'free'
                    ? 'This art is free to download.'
                    : 'Downloads are disabled for this art.',
                'unlocked' => $art->download_policy === 'free',
            ];
        }

        if ($art->user_id === $user->id) {
            return [
                'success' => false,
                'message' => 'You cannot buy or download your own art from the public page.',
                'unlocked' => false,
                'owner_blocked' => true,
            ];
        }

        $existing = ArtDownload::where('user_id', $user->id)
            ->where('art_id', $art->id)
            ->first();

        if ($existing) {
            return [
                'success' => true,
                'message' => 'Download already unlocked.',
                'unlocked' => true,
            ];
        }

        $cost = max(1, (int) $art->download_credits);
        $wallet = $this->wallets->findOrCreateByUser($user->id);

        if ($wallet->balance < $cost) {
            return [
                'success' => false,
                'message' => 'Insufficient credits.',
                'balance' => $wallet->balance,
                'requires_top_up' => true,
            ];
        }

        return DB::transaction(function () use ($user, $art, $cost, $wallet) {
            $transaction = $this->wallets->debit($wallet, $cost, [
                'source' => 'art_download',
                'description' => "Downloaded original art - {$art->title}",
                'meta' => ['art_id' => $art->id, 'cost' => $cost],
            ]);

            if ($transaction === false) {
                return [
                    'success' => false,
                    'message' => 'Insufficient credits.',
                    'balance' => $wallet->fresh()->balance,
                    'requires_top_up' => true,
                ];
            }

            ArtDownload::create([
                'user_id' => $user->id,
                'art_id' => $art->id,
                'credit_cost' => $cost,
            ]);

            $art->loadMissing('user');
            if ($art->user) {
                $this->commissions->recordEarning($user, $art->user, $cost, 'art_download', $art);
            }

            return [
                'success' => true,
                'message' => 'Original art download unlocked.',
                'balance' => $transaction->balance_after,
                'unlocked' => true,
            ];
        });
    }
}
