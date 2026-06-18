<?php

namespace App\Repositories;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class WalletRepository
{
    /**
     * Get or create a wallet for a given user.
     */
    public function findOrCreateByUser(int $userId): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0]
        );
    }

    /**
     * Get wallet with balance for a user.
     */
    public function getByUser(int $userId): ?Wallet
    {
        return Wallet::where('user_id', $userId)->first();
    }

    /**
     * Add credits to a wallet (atomic).
     */
    public function credit(Wallet $wallet, int $amount, array $txData): WalletTransaction
    {
        return DB::transaction(function () use ($wallet, $amount, $txData) {
            $balanceBefore = $wallet->balance;
            $wallet->increment('balance', $amount);
            $wallet->refresh();

            return WalletTransaction::create(array_merge($txData, [
                'wallet_id'      => $wallet->id,
                'user_id'        => $wallet->user_id,
                'type'           => 'credit',
                'amount'         => $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $wallet->balance,
            ]));
        });
    }

    /**
     * Deduct credits from a wallet (atomic). Returns false if insufficient.
     */
    public function debit(Wallet $wallet, int $amount, array $txData): WalletTransaction|false
    {
        return DB::transaction(function () use ($wallet, $amount, $txData) {
            // Re-fetch with lock to prevent race conditions
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            if ($wallet->balance < $amount) {
                return false;
            }

            $balanceBefore = $wallet->balance;
            $wallet->decrement('balance', $amount);
            $wallet->refresh();

            return WalletTransaction::create(array_merge($txData, [
                'wallet_id'      => $wallet->id,
                'user_id'        => $wallet->user_id,
                'type'           => 'debit',
                'amount'         => $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $wallet->balance,
            ]));
        });
    }

    /**
     * Paginated transaction history for a user.
     */
    public function getTransactions(int $userId, int $perPage = 15)
    {
        return WalletTransaction::where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Check if a duplicate webhook reference already exists.
     */
    public function referenceExists(string $referenceId): bool
    {
        return WalletTransaction::where('reference_id', $referenceId)->exists();
    }
}