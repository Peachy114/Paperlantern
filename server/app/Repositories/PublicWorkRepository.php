<?php

namespace App\Repositories;

use App\Models\Chapter;
use App\Models\ChapterLike;
use App\Models\ChapterView;
use App\Models\FeatureBoost;
use App\Models\Work;
use App\Models\WorkFavorite;
use App\Models\WorkLike;
use Illuminate\Http\Request;

class PublicWorkRepository
{
    public function getHeroWorks(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->orderByDesc('views')
            ->limit(5)
            ->get(['id', 'slug', 'title', 'cover', 'banner', 'type', 'genres', 'language', 'views', 'likes', 'comments_count', 'super_likes_count', 'super_like_credits', 'description', 'status']);
    }

    public function getWeeklyChart(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->withCount(['chapterViews as weekly_views' => function ($q) {
                $q->where('chapter_views.created_at', '>=', now()->subDays(7));
            }])
            ->orderByDesc('weekly_views')
            ->limit(10)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'language', 'views', 'likes', 'comments_count', 'super_likes_count', 'super_like_credits']);
    }

    public function getFreshReleases(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->where('created_at', '>=', now()->subMonths(3))
            ->orderByDesc('created_at')
            ->limit(24)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'genres', 'language', 'likes', 'comments_count', 'super_likes_count', 'super_like_credits', 'created_at']);
    }

    public function getDailyWorks(string $type = 'all', int $limit = 12): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->when($type !== 'all', fn($query) => $query->where('type', $type))
            ->where('created_at', '>=', now()->subDay())
            ->orderByDesc('views')
            ->limit($limit)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'genres', 'language', 'likes', 'work_likes_count', 'comments_count', 'super_likes_count', 'super_like_credits', 'created_at', 'status']);
    }

    public function getTodayReleaseChapters(string $type = 'all', int $limit = 12): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleChapters()
            ->where('created_at', '>=', now()->subDay())
            ->whereHas('work', fn($q) => $this->applyVisibleWorkConstraints($q)
                ->when($type !== 'all', fn($query) => $query->where('type', $type)))
            ->with(['activeContentSuspensions', 'work:id,slug,title,cover,type,user_id', 'work.activeContentSuspensions'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'work_id', 'title', 'slug', 'cover', 'order', 'views', 'likes', 'comments_count', 'super_likes_count', 'created_at', 'status']);
    }

    public function getTodayTopChapters(string $type = 'all', string $metric = 'views', int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        $metric = $metric === 'likes' ? 'likes' : 'views';
        $countRelation = $metric === 'likes' ? 'chapterLikes' : 'chapterViews';
        $countAlias = $metric === 'likes' ? 'period_likes' : 'period_views';

        return $this->visibleChapters()
            ->where('created_at', '>=', now()->subDay())
            ->whereHas('work', fn($q) => $this->applyVisibleWorkConstraints($q)
                ->when($type !== 'all', fn($query) => $query->where('type', $type)))
            ->withCount([$countRelation . ' as ' . $countAlias => fn($q) => $q->where('created_at', '>=', now()->subDay())])
            ->with(['activeContentSuspensions', 'work:id,slug,title,cover,type,user_id', 'work.activeContentSuspensions'])
            ->orderByDesc($countAlias)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'work_id', 'title', 'slug', 'cover', 'order', 'views', 'likes', 'comments_count', 'super_likes_count', 'created_at', 'status']);
    }

    public function getPopularWorks(string $type = 'all', int $limit = 12): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->when($type !== 'all', fn($query) => $query->where('type', $type))
            ->orderByDesc('views')
            ->orderByDesc('work_likes_count')
            ->limit($limit)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'genres', 'language', 'views', 'likes', 'work_likes_count', 'comments_count', 'super_likes_count', 'super_like_credits', 'created_at', 'status']);
    }

    public function getTopLikedWorks(string $type = 'all', int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->has('chapters')
            ->when($type !== 'all', fn($query) => $query->where('type', $type))
            ->orderByRaw('(work_likes_count + likes + super_likes_count) DESC')
            ->limit($limit)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'genres', 'language', 'views', 'likes', 'work_likes_count', 'comments_count', 'super_likes_count', 'super_like_credits', 'created_at', 'status']);
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleChapters()
            ->where('created_at', '>=', now()->subDays(7))
            ->whereHas('work', fn($q) => $this->applyVisibleWorkConstraints($q))
            ->orderByDesc('created_at')
            ->with(['activeContentSuspensions', 'work:id,slug,title,cover,type,user_id', 'work.activeContentSuspensions'])
            ->limit(50)
            ->get(['id', 'work_id', 'title', 'cover', 'order', 'created_at'])
            ->unique(fn($chapter) => $chapter->work?->user_id)
            ->take(10)
            ->values();
    }

    public function getWork(Work $work): Work
    {
        abort_if(
            ! in_array($work->status, ['ongoing', 'completed'], true)
                || $work->moderation_status === 'violated'
                || $work->hasActiveSuspension(),
            404
        );

        $work->load([
            'activeContentSuspensions',
            'user:id,name,username,twitter_url,instagram_url,tiktok_url',
        ]);

        $work->loadCount(['chapters as chapters_count' => function ($q) {
            $q->where('status', '!=', 'draft')
                ->where('moderation_status', '!=', 'violated')
                ->whereDoesntHave('activeContentSuspensions', fn($inner) => $inner->whereNull('target_field'));
        }]);

        return $work;
    }

    public function getChapters(Work $work): \Illuminate\Database\Eloquent\Collection
    {
        return $work->chapters()
            ->where('status', '!=', 'draft')
            ->where('moderation_status', '!=', 'violated')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->with('activeContentSuspensions')
            ->orderBy('order')
            ->get(['id', 'slug', 'title', 'order', 'lock_type', 'unlocks_at', 'likes', 'comments_count', 'super_likes_count', 'super_like_credits', 'credits_required', 'created_at', 'cover']);
    }

    public function searchWorks(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visibleWorks()
            ->where('title', 'like', "%{$query}%")
            ->limit(8)
            ->get(['id', 'slug', 'title', 'cover', 'type']);
    }

    public function getComics(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $type = $request->query('type', 'webtoon');
        $query = $this->visibleWorks()
            ->select('works.*')
            ->selectSub($this->activeWorkBoostSubquery(), 'boosted_until')
            ->where('type', $type)
            ->has('chapters');

        if ($request->has('day')) {
            $query->where('schedule', strtolower($request->day));
        }

        if ($request->status === 'completed') {
            $query->where('status', 'completed');
        }

        if ($request->has('genre')) {
            $query->whereJsonContains('genres', $request->genre);
        }

        if ($request->sort === 'rankings') {
            $query->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
                ->orderByDesc('boosted_until')
                ->orderByDesc('views');
        } else {
            $query->orderByRaw('CASE WHEN boosted_until IS NULL THEN 1 ELSE 0 END ASC')
                ->orderByDesc('boosted_until')
                ->latest();
        }

        return $query->paginate(20);
    }

    public function hasViewed(Chapter $chapter, ?string $userId, string $ip): bool
    {
        return ChapterView::where('chapter_id', $chapter->id)
            ->when(
                $userId,
                fn($q) => $q->where('user_id', $userId),
                fn($q) => $q->where('ip_address', $ip)
            )
            ->exists();
    }

    public function recordView(Chapter $chapter, Work $work, ?string $userId, string $ip): int
    {
        ChapterView::create([
            'chapter_id' => $chapter->id,
            'user_id' => $userId,
            'ip_address' => $userId ? null : $ip,
        ]);

        $chapterViews = ChapterView::where('chapter_id', $chapter->id)->count();
        $chapter->update(['views' => $chapterViews]);

        $workViews = Chapter::where('work_id', $work->id)->sum('views');
        $work->update(['views' => $workViews]);

        return $chapterViews;
    }

    public function getLike(Chapter $chapter, string $userId): ?ChapterLike
    {
        return ChapterLike::where('chapter_id', $chapter->id)
            ->where('user_id', $userId)
            ->first();
    }

    public function createLike(Chapter $chapter, string $userId): void
    {
        ChapterLike::create([
            'chapter_id' => $chapter->id,
            'user_id' => $userId,
        ]);
    }

    public function syncLikeCounts(Chapter $chapter, Work $work): int
    {
        $chapterLikes = ChapterLike::where('chapter_id', $chapter->id)->count();
        $chapter->update(['likes' => $chapterLikes]);

        $workLikes = Chapter::where('work_id', $work->id)->sum('likes');
        $work->update(['likes' => $workLikes]);

        return $chapterLikes;
    }

    public function getLikeStatus(Chapter $chapter, ?string $userId): array
    {
        $liked = $userId
            ? ChapterLike::where('chapter_id', $chapter->id)->where('user_id', $userId)->exists()
            : false;

        return ['liked' => $liked, 'likes' => $chapter->likes];
    }

    public function getWorkEngagementStatus(Work $work, ?string $userId): array
    {
        $liked = $userId
            ? WorkLike::where('work_id', $work->id)->where('user_id', $userId)->exists()
            : false;

        $favorited = $userId
            ? WorkFavorite::where('work_id', $work->id)->where('user_id', $userId)->exists()
            : false;

        return [
            'liked' => $liked,
            'favorited' => $favorited,
            'work_likes_count' => (int) ($work->work_likes_count ?? 0),
            'favorites_count' => (int) ($work->favorites_count ?? 0),
        ];
    }

    public function getWorkLike(Work $work, string $userId): ?WorkLike
    {
        return WorkLike::where('work_id', $work->id)
            ->where('user_id', $userId)
            ->first();
    }

    public function createWorkLike(Work $work, string $userId): void
    {
        WorkLike::create([
            'work_id' => $work->id,
            'user_id' => $userId,
        ]);
    }

    public function getWorkFavorite(Work $work, string $userId): ?WorkFavorite
    {
        return WorkFavorite::where('work_id', $work->id)
            ->where('user_id', $userId)
            ->first();
    }

    public function createWorkFavorite(Work $work, string $userId): void
    {
        WorkFavorite::create([
            'work_id' => $work->id,
            'user_id' => $userId,
        ]);
    }

    public function syncWorkLikeCount(Work $work): int
    {
        $count = WorkLike::where('work_id', $work->id)->count();
        $work->update(['work_likes_count' => $count]);

        return $count;
    }

    public function syncWorkFavoriteCount(Work $work): int
    {
        $count = WorkFavorite::where('work_id', $work->id)->count();
        $work->update(['favorites_count' => $count]);

        return $count;
    }

    private function visibleWorks()
    {
        return Work::query()
            ->whereIn('status', ['ongoing', 'completed'])
            ->where('moderation_status', '!=', 'violated')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->with('activeContentSuspensions');
    }

    private function visibleChapters()
    {
        return Chapter::query()
            ->where('status', '!=', 'draft')
            ->where('moderation_status', '!=', 'violated')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'));
    }

    private function applyVisibleWorkConstraints($query)
    {
        return $query
            ->whereIn('status', ['ongoing', 'completed'])
            ->where('moderation_status', '!=', 'violated')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'));
    }

    private function activeWorkBoostSubquery()
    {
        return FeatureBoost::query()
            ->selectRaw('MAX(ends_at)')
            ->whereColumn('target_id', 'works.id')
            ->where('target_type', 'work')
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }
}
