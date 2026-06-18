<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\EarningTransaction;
use App\Models\StorytellerEarning;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    // Platform takes 20%, storyteller gets 80%
    const PLATFORM_RATE    = 0.20;
    const STORYTELLER_RATE = 0.80;

    // Minimum withdrawal in PHP
    const MIN_WITHDRAWAL_PHP = 200.00;

    // Credit to PHP conversion rate (average across packages)
    // ₱29 / 20 credits = ₱1.45 per credit
    const CREDIT_TO_PHP_RATE = 1.45;

    /**
     * Split credits between platform and storyteller after a chapter unlock.
     * Called from ChapterUnlockController after successful debit.
     */
    public function splitEarnings(
        User    $reader,
        Chapter $chapter,
        int     $creditsSpent
    ): void {
        $storyteller = $chapter->work->user; // chapter → work → storyteller

        if (! $storyteller) {
            Log::error("CommissionService: no storyteller found for chapter {$chapter->id}");
            return;
        }

        // Calculate split (floor to avoid fractions, platform gets remainder)
        $storytellerCut = (int) floor($creditsSpent * self::STORYTELLER_RATE);
        $platformCut    = $creditsSpent - $storytellerCut;

        $storytellerPhp = round($storytellerCut * self::CREDIT_TO_PHP_RATE, 2);
        $platformPhp    = round($platformCut    * self::CREDIT_TO_PHP_RATE, 2);

        DB::transaction(function () use (
            $reader, $chapter, $storyteller,
            $creditsSpent, $storytellerCut, $platformCut,
            $storytellerPhp, $platformPhp
        ) {
            // 1. Credit storyteller earnings
            $earning = StorytellerEarning::firstOrCreate(
                ['user_id' => $storyteller->id],
                ['balance' => 0, 'php_balance' => 0]
            );

            $earning->increment('balance', $storytellerCut);
            $earning->increment('php_balance', $storytellerPhp);

            // 2. Record the transaction
            EarningTransaction::create([
                'storyteller_id'    => $storyteller->id,
                'reader_id'         => $reader->id,
                'chapter_id'        => $chapter->id,
                'credits_spent'     => $creditsSpent,
                'platform_cut'      => $platformCut,
                'storyteller_cut'   => $storytellerCut,
                'platform_php'      => $platformPhp,
                'storyteller_php'   => $storytellerPhp,
                'credit_to_php_rate'=> self::CREDIT_TO_PHP_RATE,
            ]);
        });

        Log::info("CommissionService: {$creditsSpent} credits split — storyteller {$storyteller->id} gets {$storytellerCut} (₱{$storytellerPhp}), platform gets {$platformCut} (₱{$platformPhp})");
    }

    /**
     * Get storyteller's current earnings.
     */
    public function getEarnings(User $user): StorytellerEarning
    {
        return StorytellerEarning::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0, 'php_balance' => 0]
        );
    }

    /**
     * Get storyteller's earning transaction history.
     */
    public function getEarningHistory(User $user, int $perPage = 15)
    {
        return EarningTransaction::where('storyteller_id', $user->id)
            ->with(['reader:id,name', 'chapter:id,title'])
            ->latest()
            ->paginate($perPage);
    }


    /**
     * Get the storyteller's most recent withdrawal request (if any).
     */
    public function getLatestWithdrawal(User $user): ?WithdrawalRequest
    {
        return WithdrawalRequest::where('user_id', $user->id)
            ->latest()
            ->first();
    }

    /**
     * Submit a withdrawal request.
     */
    public function requestWithdrawal(User $user, array $data): array
    {
        $earning = $this->getEarnings($user);

        if ($earning->php_balance < self::MIN_WITHDRAWAL_PHP) {
            return [
                'success' => false,
                'message' => 'Minimum withdrawal is ₱' . number_format(self::MIN_WITHDRAWAL_PHP, 2),
                'balance' => $earning->php_balance,
            ];
        }

        // Check no pending withdrawal exists
        $hasPending = WithdrawalRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return [
                'success' => false,
                'message' => 'You already have a pending withdrawal request.',
            ];
        }

        $amountPhp     = (float) $data['amount_php'];
        $creditsToRedeem = (int) ceil($amountPhp / self::CREDIT_TO_PHP_RATE);

        if ($amountPhp > $earning->php_balance) {
            return [
                'success' => false,
                'message' => 'Insufficient earnings balance.',
                'balance' => $earning->php_balance,
            ];
        }

        DB::transaction(function () use ($user, $earning, $amountPhp, $creditsToRedeem, $data) {
            // Deduct from earnings
            $earning->decrement('php_balance', $amountPhp);
            $earning->decrement('balance', $creditsToRedeem);

            // Create request
            WithdrawalRequest::create([
                'user_id'        => $user->id,
                'amount_php'     => $amountPhp,
                'credits_redeemed' => $creditsToRedeem,
                'status'         => 'pending',
                'payout_method'  => $data['payout_method'],
                'payout_details' => $data['payout_details'],
            ]);
        });

        return [
            'success' => true,
            'message' => 'Withdrawal request submitted. Processing within 3–5 business days.',
        ];
    }

    /**
     * Admin: approve/reject/mark paid a withdrawal request.
     */
    public function processWithdrawal(WithdrawalRequest $request, string $status, ?string $notes = null): void
    {
        // If rejected, refund the earnings
        if ($status === 'rejected') {
            $earning = StorytellerEarning::where('user_id', $request->user_id)->first();
            if ($earning) {
                $earning->increment('php_balance', $request->amount_php);
                $earning->increment('balance', $request->credits_redeemed);
            }
        }

        $request->update([
            'status'       => $status,
            'admin_notes'  => $notes,
            'processed_at' => now(),
        ]);
    }
}