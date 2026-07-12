<?php

namespace App\Services;

use App\Models\Art;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\SuperLike;
use App\Models\SuperLikeAward;
use App\Models\User;
use App\Models\Work;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class SuperLikeService
{
    public function __construct(
        private CommentTargetResolver $resolver,
        private WalletRepository $walletRepo,
        private CommissionService $commissionService,
    ) {}

    public function send(User $sender, string $type, string $id, ?string $awardId = null): array
    {
        $target = $this->resolver->resolve($type, $id);
        $receiver = $this->resolver->owner($target);
        $award = $this->resolveAward($awardId);
        $cost = $award->credit_cost;

        abort_unless($receiver, 404, 'Receiver not found.');
        abort_if($receiver->id === $sender->id, 422, 'Cannot Super Like your own content.');

        return DB::transaction(function () use ($sender, $target, $receiver, $type, $award, $cost) {
            $wallet = $this->walletRepo->findOrCreateByUser($sender->id);
            $debit = $this->walletRepo->debit($wallet, $cost, [
                'source' => 'bonus',
                'description' => "{$award->name} Super Like",
                'meta' => [
                    'kind' => 'super_like',
                    'award_id' => $award->id,
                    'award_name' => $award->name,
                    'target_type' => $type,
                    'target_id' => $target->getKey(),
                    'receiver_id' => $receiver->id,
                ],
            ]);

            if ($debit === false) {
                abort(402, 'Not enough credits for Super Like.');
            }

            $chapter = $target instanceof Chapter ? $target : null;
            $split = $this->commissionService->recordEarning(
                $sender,
                $receiver,
                $cost,
                'super_like',
                $target,
                $chapter,
            );

            SuperLike::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'super_like_award_id' => $award->id,
                'super_likeable_type' => $target::class,
                'super_likeable_id' => $target->getKey(),
                'credits_spent' => $cost,
                'receiver_cut' => $split['receiver_cut'],
                'platform_cut' => $split['platform_cut'],
            ]);

            $this->incrementTarget($target, $split['receiver_cut']);

            return [
                'message' => 'Super Like sent.',
                'wallet_balance' => $wallet->fresh()->balance,
                'super_likes_count' => (int) ($target->fresh()->super_likes_count ?? 0),
                'super_like_credits' => (float) ($target->fresh()->super_like_credits ?? 0),
                'award' => [
                    'id' => $award->id,
                    'name' => $award->name,
                    'icon' => $award->icon,
                    'credit_cost' => $award->credit_cost,
                ],
            ];
        });
    }

    private function resolveAward(?string $awardId): SuperLikeAward
    {
        $query = SuperLikeAward::query()->where('is_active', true);

        if ($awardId) {
            return $query->whereKey($awardId)->firstOrFail();
        }

        return $query->orderBy('credit_cost')->orderBy('sort_order')->firstOrFail();
    }

    private function incrementTarget(Work|Chapter|Art|Comment $target, float $receiverCut): void
    {
        $target->increment('super_likes_count');
        $target->increment('super_like_credits', $receiverCut);
    }
}
