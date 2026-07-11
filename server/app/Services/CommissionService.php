<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\EarningTransaction;
use App\Models\StorytellerEarning;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    public const PLATFORM_RATE = 0.20;
    public const STORYTELLER_RATE = 0.80;
    public const MIN_WITHDRAWAL_CREDITS = 10.00;
    public const MIN_WITHDRAWAL_PHP = 14.50;
    public const CREDIT_TO_PHP_RATE = 1.45;

    public function splitEarnings(User $reader, Chapter $chapter, int $creditsSpent): void
    {
        $chapter->loadMissing('work.user');
        $storyteller = $chapter->work?->user;

        if (! $storyteller) {
            Log::error("CommissionService: no storyteller found for chapter {$chapter->id}");
            return;
        }

        $this->recordEarning($reader, $storyteller, $creditsSpent, 'chapter_unlock', $chapter, $chapter);
    }

    public function recordEarning(
        User $reader,
        User $receiver,
        float $creditsSpent,
        string $source,
        ?Model $earnable = null,
        ?Chapter $chapter = null,
    ): array {
        $receiverCut = round($creditsSpent * self::STORYTELLER_RATE, 2);
        $platformCut = round($creditsSpent - $receiverCut, 2);
        $receiverPhp = round($receiverCut * self::CREDIT_TO_PHP_RATE, 2);
        $platformPhp = round($platformCut * self::CREDIT_TO_PHP_RATE, 2);

        DB::transaction(function () use (
            $reader,
            $receiver,
            $chapter,
            $earnable,
            $source,
            $creditsSpent,
            $receiverCut,
            $platformCut,
            $receiverPhp,
            $platformPhp
        ) {
            $earning = StorytellerEarning::firstOrCreate(
                ['user_id' => $receiver->id],
                ['balance' => 0, 'php_balance' => 0]
            );

            $earning->increment('balance', $receiverCut);
            $earning->increment('php_balance', $receiverPhp);

            EarningTransaction::create([
                'storyteller_id' => $receiver->id,
                'reader_id' => $reader->id,
                'source' => $source,
                'chapter_id' => $chapter?->id,
                'earnable_type' => $earnable ? $earnable::class : null,
                'earnable_id' => $earnable?->getKey(),
                'credits_spent' => $creditsSpent,
                'platform_cut' => $platformCut,
                'storyteller_cut' => $receiverCut,
                'platform_php' => $platformPhp,
                'storyteller_php' => $receiverPhp,
                'credit_to_php_rate' => self::CREDIT_TO_PHP_RATE,
            ]);
        });

        return [
            'receiver_cut' => $receiverCut,
            'platform_cut' => $platformCut,
            'receiver_php' => $receiverPhp,
            'platform_php' => $platformPhp,
        ];
    }

    public function getEarnings(User $user): StorytellerEarning
    {
        return StorytellerEarning::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0, 'php_balance' => 0]
        );
    }

    public function getEarningHistory(User $user, int $perPage = 15)
    {
        return EarningTransaction::where('storyteller_id', $user->id)
            ->with(['reader:id,name', 'chapter:id,title'])
            ->latest()
            ->paginate($perPage);
    }

    public function getLatestWithdrawal(User $user): ?WithdrawalRequest
    {
        return WithdrawalRequest::where('user_id', $user->id)
            ->latest()
            ->first();
    }

    public function requestWithdrawal(User $user, array $data): array
    {
        $earning = $this->getEarnings($user);

        if ((float) $earning->balance < self::MIN_WITHDRAWAL_CREDITS) {
            return [
                'success' => false,
                'message' => 'Minimum withdrawal is ' . number_format(self::MIN_WITHDRAWAL_CREDITS, 2) . ' credits.',
                'balance' => $earning->php_balance,
            ];
        }

        $hasPending = WithdrawalRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return [
                'success' => false,
                'message' => 'You already have a pending withdrawal request.',
            ];
        }

        $amountPhp = (float) $data['amount_php'];
        $creditsToRedeem = round($amountPhp / self::CREDIT_TO_PHP_RATE, 2);

        if ($amountPhp > (float) $earning->php_balance) {
            return [
                'success' => false,
                'message' => 'Insufficient earnings balance.',
                'balance' => $earning->php_balance,
            ];
        }

        if ($creditsToRedeem > (float) $earning->balance) {
            return [
                'success' => false,
                'message' => 'Insufficient credit earnings balance.',
                'balance' => $earning->balance,
            ];
        }

        DB::transaction(function () use ($user, $earning, $amountPhp, $creditsToRedeem, $data) {
            $earning->decrement('php_balance', $amountPhp);
            $earning->decrement('balance', $creditsToRedeem);

            WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount_php' => $amountPhp,
                'credits_redeemed' => $creditsToRedeem,
                'status' => 'pending',
                'payout_method' => $data['payout_method'],
                'payout_details' => $data['payout_details'],
            ]);
        });

        return [
            'success' => true,
            'message' => 'Withdrawal request submitted. Processing within 3-5 business days.',
        ];
    }

    public function processWithdrawal(WithdrawalRequest $request, string $status, ?string $notes = null): void
    {
        if ($status === 'rejected') {
            $earning = StorytellerEarning::where('user_id', $request->user_id)->first();
            if ($earning) {
                $earning->increment('php_balance', $request->amount_php);
                $earning->increment('balance', $request->credits_redeemed);
            }
        }

        $request->update([
            'status' => $status,
            'admin_notes' => $notes,
            'processed_at' => now(),
        ]);
    }
}
