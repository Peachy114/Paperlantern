<?php

namespace App\Services;

use App\Models\ArtistSticker;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\SuperLike;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
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
            ->whereNull('parent_id')
            ->where('status', 'visible')
            ->with([
                'user:id,name,username,avatar,role,artist_verified',
                'sticker:id,user_id,name,image_path',
                'replies' => fn($query) => $query
                    ->where('status', 'visible')
                    ->oldest()
                    ->with(['user:id,name,username,avatar,role,artist_verified', 'sticker:id,user_id,name,image_path']),
            ]);

        $query->orderByDesc('is_pinned');

        match ($sort) {
            'popular' => $query->orderByDesc('likes_count')->orderByDesc('super_likes_count')->latest(),
            'latest' => $query->latest(),
            default => $query->latest(),
        };

        return $query->paginate(20)->through(fn(Comment $comment) => $this->format($comment));
    }

    public function create(User $user, string $type, string $id, array $data, Request $request): array
    {
        $target = $this->resolver->resolve($type, $id);
        $body = trim((string) ($data['body'] ?? ''));
        $stickerId = $data['artist_sticker_id'] ?? null;
        $parentId = $data['parent_id'] ?? null;
        $reactionEmoji = trim((string) ($data['reaction_emoji'] ?? ''));
        $gifUrl = trim((string) ($data['gif_url'] ?? ''));
        $imageUrl = trim((string) ($data['image_url'] ?? ''));
        $isSpoiler = (bool) ($data['is_spoiler'] ?? false);
        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store("comment-images/{$user->id}", 'public')
            : null;

        if ($body === '' && ! $stickerId && $reactionEmoji === '' && $gifUrl === '' && $imageUrl === '' && ! $imagePath) {
            abort(422, 'Write a comment, choose a sticker, or add a reaction.');
        }

        if ($stickerId) {
            $this->assertCanUseSticker($user, $stickerId);
        }

        $parent = null;
        if ($parentId) {
            $parent = Comment::where('status', 'visible')->findOrFail($parentId);
            abort_unless(
                $parent->commentable_type === $target::class && $parent->commentable_id === $target->getKey(),
                422,
                'Reply target does not belong to this comment thread.'
            );
        }

        $comment = DB::transaction(function () use ($user, $target, $parent, $body, $stickerId, $reactionEmoji, $gifUrl, $imageUrl, $imagePath, $isSpoiler) {
            $comment = Comment::create([
                'user_id' => $user->id,
                'parent_id' => $parent?->id,
                'commentable_type' => $target::class,
                'commentable_id' => $target->getKey(),
                'body' => $body !== '' ? $body : null,
                'artist_sticker_id' => $stickerId,
                'reaction_emoji' => $reactionEmoji !== '' ? $reactionEmoji : null,
                'gif_url' => $gifUrl !== '' ? $gifUrl : null,
                'image_url' => $imageUrl !== '' ? $imageUrl : null,
                'image_path' => $imagePath,
                'image_moderation_status' => $imagePath ? 'pending' : null,
                'is_spoiler' => $isSpoiler,
                'status' => 'visible',
            ]);

            if ($parent) {
                $parent->increment('replies_count');
            }

            if (array_key_exists('comments_count', $target->getAttributes())) {
                $target->increment('comments_count');
            }

            return $comment;
        });

        return $this->format($comment->load(['user:id,name,username,avatar,role,artist_verified', 'sticker:id,user_id,name,image_path', 'parent.user:id,name,username']));
    }

    public function toggleLike(User $user, Comment $comment): array
    {
        $liked = false;

        DB::transaction(function () use ($user, $comment, &$liked) {
            $existing = CommentLike::where('comment_id', $comment->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $comment->update(['likes_count' => max(0, ((int) $comment->likes_count) - 1)]);
                $liked = false;
                return;
            }

            CommentLike::create([
                'comment_id' => $comment->id,
                'user_id' => $user->id,
            ]);
            $comment->increment('likes_count');
            $liked = true;
        });

        return [
            'liked' => $liked,
            'likes_count' => (int) $comment->fresh()->likes_count,
        ];
    }

    public function remove(User $user, Comment $comment): array
    {
        $comment->loadMissing('commentable');
        $owner = $this->resolver->owner($comment->commentable);
        $canRemove = $user->role === 'super_admin'
            || $comment->user_id === $user->id
            || $owner?->id === $user->id;

        abort_unless($canRemove, 403, 'You cannot remove this comment.');

        DB::transaction(function () use ($comment) {
            $comment->update(['status' => 'removed']);

            if ($comment->parent_id) {
                $comment->parent?->decrement('replies_count');
            }

            $target = $comment->commentable;
            if ($target && array_key_exists('comments_count', $target->getAttributes())) {
                $target->decrement('comments_count');
            }
        });

        return ['message' => 'Comment removed.'];
    }

    public function pin(User $user, Comment $comment, bool $isPinned): array
    {
        $comment->loadMissing('commentable');
        $owner = $this->resolver->owner($comment->commentable);
        $canPin = $user->role === 'super_admin'
            || $comment->user_id === $user->id
            || $owner?->id === $user->id;

        abort_unless($canPin, 403, 'You cannot pin this comment.');

        $comment->update(['is_pinned' => $isPinned]);

        return $this->format($comment->fresh(['user:id,name,username,avatar,role,artist_verified', 'sticker:id,user_id,name,image_path']));
    }

    public function format(Comment $comment): array
    {
        $likedByMe = auth('sanctum')->check()
            ? $comment->likes()->where('user_id', auth('sanctum')->id())->exists()
            : false;
        $imagePath = $comment->image_moderation_status === 'suspended' ? null : $comment->image_path;

        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'body' => $comment->body,
            'reaction_emoji' => $comment->reaction_emoji,
            'gif_url' => $comment->gif_url,
            'image_url' => $comment->image_url,
            'image_path' => $imagePath,
            'image_moderation_status' => $comment->image_moderation_status,
            'is_spoiler' => (bool) $comment->is_spoiler,
            'is_pinned' => (bool) $comment->is_pinned,
            'likes_count' => (int) $comment->likes_count,
            'liked_by_me' => $likedByMe,
            'replies_count' => (int) $comment->replies_count,
            'super_likes_count' => $comment->super_likes_count,
            'super_like_credits' => (float) $comment->super_like_credits,
            'awards' => $this->awardSummary($comment),
            'created_at' => $comment->created_at?->toIso8601String(),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'username' => $comment->user->username,
                'avatar' => $comment->user->avatar,
                'role' => $comment->user->role,
                'artist_verified' => (bool) ($comment->user->artist_verified ?? false),
            ] : null,
            'parent' => $comment->parent ? [
                'id' => $comment->parent->id,
                'body' => $comment->parent->body,
                'user' => $comment->parent->user ? [
                    'name' => $comment->parent->user->name,
                    'username' => $comment->parent->user->username,
                ] : null,
            ] : null,
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies->map(fn(Comment $reply) => $this->format($reply))->values()
                : [],
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

    private function awardSummary(Comment $comment): array
    {
        return SuperLike::query()
            ->where('super_likeable_type', $comment::class)
            ->where('super_likeable_id', $comment->id)
            ->with('award:id,name,icon,credit_cost')
            ->get()
            ->groupBy('super_like_award_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'id' => $first->award?->id,
                    'name' => $first->award?->name ?? 'Super Like',
                    'icon' => $first->award?->icon ?? 'star',
                    'credit_cost' => (int) ($first->award?->credit_cost ?? 1),
                    'count' => $items->count(),
                ];
            })
            ->values()
            ->all();
    }
}
