<?php

namespace App\Services;

use App\Models\ArtistSticker;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CommentService
{
    public function __construct(private CommentTargetResolver $resolver) {}

    public function list(string $type, string $id, string $sort = 'all')
    {
        $target = $this->resolver->resolve($type, $id);

        $query = Comment::query()
            ->where('commentable_type', $target::class)
            ->where('commentable_id', $target->getKey())
            ->where('status', 'visible')
            ->with(['user:id,name,username,avatar', 'sticker:id,user_id,name,image_path']);

        match ($sort) {
            'popular' => $query->orderByDesc('super_likes_count')->latest(),
            'latest' => $query->latest(),
            default => $query->oldest(),
        };

        return $query->paginate(20)->through(fn(Comment $comment) => $this->format($comment));
    }

    public function create(User $user, string $type, string $id, array $data): array
    {
        $target = $this->resolver->resolve($type, $id);
        $body = trim((string) ($data['body'] ?? ''));
        $stickerId = $data['artist_sticker_id'] ?? null;

        if ($body === '' && ! $stickerId) {
            abort(422, 'Write a comment or choose a sticker.');
        }

        if ($stickerId) {
            $this->assertCanUseSticker($user, $stickerId);
        }

        $comment = DB::transaction(function () use ($user, $target, $body, $stickerId) {
            $comment = Comment::create([
                'user_id' => $user->id,
                'commentable_type' => $target::class,
                'commentable_id' => $target->getKey(),
                'body' => $body !== '' ? $body : null,
                'artist_sticker_id' => $stickerId,
                'status' => 'visible',
            ]);

            if (array_key_exists('comments_count', $target->getAttributes())) {
                $target->increment('comments_count');
            }

            return $comment;
        });

        return $this->format($comment->load(['user:id,name,username,avatar', 'sticker:id,user_id,name,image_path']));
    }

    public function format(Comment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'super_likes_count' => $comment->super_likes_count,
            'super_like_credits' => (float) $comment->super_like_credits,
            'created_at' => $comment->created_at?->toIso8601String(),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'username' => $comment->user->username,
                'avatar' => $comment->user->avatar,
            ] : null,
            'sticker' => $comment->sticker ? [
                'id' => $comment->sticker->id,
                'name' => $comment->sticker->name,
                'image_path' => $comment->sticker->image_path,
            ] : null,
        ];
    }

    public function canUseSticker(User $user, ArtistSticker $sticker): bool
    {
        if ($sticker->user_id === $user->id) {
            return true;
        }

        return $user->purchasedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists()
            || $user->subscribedArtistStickers()->where('artist_stickers.id', $sticker->id)->exists();
    }

    private function assertCanUseSticker(User $user, string $stickerId): ArtistSticker
    {
        $sticker = ArtistSticker::findOrFail($stickerId);

        abort_unless($this->canUseSticker($user, $sticker), 403, 'Buy or subscribe to this sticker before using it.');

        return $sticker;
    }
}
