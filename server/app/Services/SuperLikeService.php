<?php

namespace App\Services;

use App\Models\Art;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\SuperLike;
use App\Models\User;
use App\Models\Work;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\DB;

class SuperLikeService
{
    public const COST = 1;

    public function __construct(
        private CommentTargetResolver $resolver,
        private WalletRepository $walletRepo,
        private CommissionService $commissionService,
    ) {}

    public function send(User $sender, string $type, string $id): array
    {
        $target = $this->resolver->resolve($type, $id);
        $receiver = $this->resolver->owner($target);

        abort_unless($receiver, 404, 'Receiver not found.');
        abort_if($receiver->id === $sender->id, 422, 'Cannot Super Like your own content.');

        return DB::transaction(function () use ($sender, $target, $receiver, $type) {
            $wallet = $this->walletRepo->findOrCreateByUser($sender->id);
            $debit = $this->walletRepo->debit($wallet, self::COST, [
                'source' => 'bonus',
                'description' => 'Super Like',
                'meta' => [
                    'kind' => 'super_like',
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
                self::COST,
                'super_like',
                $target,
                $chapter,
            );

            SuperLike::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'super_likeable_type' => $target::class,
                'super_likeable_id' => $target->getKey(),
                'credits_spent' => self::COST,
                'receiver_cut' => $split['receiver_cut'],
                'platform_cut' => $split['platform_cut'],
            ]);

            $this->incrementTarget($target, $split['receiver_cut']);

            return [
                'message' => 'Super Like sent.',
                'wallet_balance' => $wallet->fresh()->balance,
                'super_likes_count' => (int) ($target->fresh()->super_likes_count ?? 0),
                'super_like_credits' => (float) ($target->fresh()->super_like_credits ?? 0),
            ];
        });
    }

    private function incrementTarget(Work|Chapter|Art|Comment $target, float $receiverCut): void
    {
        $target->increment('super_likes_count');
        $target->increment('super_like_credits', $receiverCut);
    }
}
