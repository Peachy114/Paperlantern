<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\Chapter;
use App\Models\ChapterLike;
use App\Models\ChapterUnlock;
use App\Models\ChapterView;
use App\Models\Comment;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Models\Work;
use App\Models\WorkFavorite;
use App\Services\ArtistProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountLibraryController extends Controller
{
    public function __construct(private ArtistProfileService $profiles) {}

    public function favorites(Request $request): JsonResponse
    {
        $favorites = WorkFavorite::query()
            ->where('user_id', $request->user()->id)
            ->with(['work.user:id,name,username'])
            ->latest()
            ->get()
            ->filter(fn(WorkFavorite $favorite) => $favorite->work)
            ->map(fn(WorkFavorite $favorite) => [
                'id' => $favorite->id,
                'created_at' => $favorite->created_at,
                'work' => $this->formatWork($favorite->work),
            ])
            ->values();

        return response()->json(['data' => $favorites]);
    }

    public function comments(Request $request): JsonResponse
    {
        $comments = Comment::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'visible')
            ->with(['sticker', 'commentable'])
            ->latest()
            ->paginate((int) $request->query('per_page', 30));

        $comments->getCollection()->transform(fn(Comment $comment) => $this->formatComment($comment));

        return response()->json($comments);
    }

    public function toggleCommentHighlight(Request $request, Comment $comment): JsonResponse
    {
        abort_unless($comment->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'public_highlight' => ['required', 'boolean'],
        ]);

        $comment->update(['public_highlight' => $validated['public_highlight']]);

        return response()->json($this->formatComment($comment->fresh(['sticker', 'commentable'])));
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $read = ChapterView::query()
            ->where('user_id', $user->id)
            ->with('chapter.work:id,slug,title,type,cover')
            ->latest()
            ->limit(50)
            ->get()
            ->filter(fn(ChapterView $view) => $view->chapter?->work)
            ->map(fn(ChapterView $view) => $this->formatChapterEvent('read', $view->chapter, $view->created_at))
            ->values();

        $liked = ChapterLike::query()
            ->where('user_id', $user->id)
            ->with('chapter.work:id,slug,title,type,cover')
            ->latest()
            ->limit(50)
            ->get()
            ->filter(fn(ChapterLike $like) => $like->chapter?->work)
            ->map(fn(ChapterLike $like) => $this->formatChapterEvent('liked', $like->chapter, $like->created_at))
            ->values();

        $boughtChapters = ChapterUnlock::query()
            ->where('user_id', $user->id)
            ->with('chapter.work:id,slug,title,type,cover')
            ->latest()
            ->limit(50)
            ->get()
            ->filter(fn(ChapterUnlock $unlock) => $unlock->chapter?->work)
            ->map(fn(ChapterUnlock $unlock) => $this->formatChapterEvent('bought', $unlock->chapter, $unlock->created_at))
            ->values();

        $transactions = WalletTransaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn(WalletTransaction $tx) => [
                'id' => $tx->id,
                'type' => 'transaction',
                'source' => $tx->source,
                'description' => $tx->description,
                'amount' => $tx->amount,
                'created_at' => $tx->created_at,
            ]);

        $commented = Comment::query()
            ->where('user_id', $user->id)
            ->where('status', 'visible')
            ->with(['sticker', 'commentable'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn(Comment $comment) => $this->formatComment($comment))
            ->values();

        return response()->json([
            'read' => $read,
            'liked' => $liked,
            'commented' => $commented,
            'bought' => [
                'chapters' => $boughtChapters,
                'transactions' => $transactions,
            ],
        ]);
    }

    public function publicProfile(string $username): JsonResponse
    {
        return response()->json($this->profiles->show($username));
    }

    private function formatComment(Comment $comment): array
    {
        $target = $comment->commentable;

        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'public_highlight' => (bool) $comment->public_highlight,
            'super_likes_count' => (int) $comment->super_likes_count,
            'created_at' => $comment->created_at,
            'origin' => $this->formatOrigin($target),
            'sticker' => $comment->sticker ? [
                'id' => $comment->sticker->id,
                'name' => $comment->sticker->name,
                'image_path' => $comment->sticker->image_path,
            ] : null,
        ];
    }

    private function formatOrigin(mixed $target): array
    {
        if ($target instanceof Work) {
            return [
                'type' => 'work',
                'title' => $target->title,
                'subtitle' => $target->type === 'wattpad' ? 'Novel' : 'Webtoon',
                'href' => "/works/{$target->slug}",
            ];
        }

        if ($target instanceof Chapter) {
            $target->loadMissing('work:id,slug,title,type');

            return [
                'type' => 'chapter',
                'title' => $target->title,
                'subtitle' => $target->work?->title,
                'href' => $target->work ? "/works/{$target->work->slug}/chapters/{$target->slug}" : null,
            ];
        }

        if ($target instanceof Art) {
            return [
                'type' => 'art',
                'title' => $target->title,
                'subtitle' => 'Art',
                'href' => '/explore/arts',
            ];
        }

        if ($target instanceof Comment) {
            return [
                'type' => 'comment',
                'title' => 'Comment reply',
                'subtitle' => null,
                'href' => null,
            ];
        }

        return [
            'type' => 'unknown',
            'title' => 'Unknown',
            'subtitle' => null,
            'href' => null,
        ];
    }

    private function formatChapterEvent(string $type, Chapter $chapter, mixed $createdAt): array
    {
        return [
            'id' => "{$type}-{$chapter->id}-{$createdAt?->timestamp}",
            'type' => $type,
            'chapter' => [
                'id' => $chapter->id,
                'slug' => $chapter->slug,
                'title' => $chapter->title,
                'order' => $chapter->order,
            ],
            'work' => $this->formatWork($chapter->work),
            'href' => "/works/{$chapter->work->slug}/chapters/{$chapter->slug}",
            'created_at' => $createdAt,
        ];
    }

    private function formatWork(Work $work): array
    {
        return [
            'id' => $work->id,
            'slug' => $work->slug,
            'title' => $work->title,
            'type' => $work->type,
            'cover' => $work->cover,
            'views' => (int) $work->views,
            'likes' => (int) $work->likes,
            'favorites_count' => (int) ($work->favorites_count ?? 0),
            'author' => $work->relationLoaded('user') && $work->user ? [
                'id' => $work->user->id,
                'name' => $work->user->name,
                'username' => $work->user->username,
            ] : null,
        ];
    }
}
