<?php

namespace App\Services;

use App\Models\Art;
use App\Models\Work;
use App\Models\Chapter;
use App\Repositories\PublicWorkRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class PublicWorkService
{
    public function __construct(
        private PublicWorkRepository $repo,
        private ContentSuspensionService $contentSuspensions,
        private PageLayoutService $layouts,
    ) {}

    public function getHeroWorks(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getHeroWorks()
            ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work));
    }

    public function getHome(): array
    {
        $payload = Cache::remember('public_home_payload:v7', now()->addMinute(), fn () => [
            'hero' => $this->getHeroWorks(),
            'weeklyChart' => $this->getWeeklyChart(),
            'todayReleases' => $this->getTodayReleases(),
            'todayTopViews' => $this->getTodayTop('all', 'views'),
            'todayTopLikes' => $this->getTodayTop('all', 'likes'),
            'freshReleases' => $this->getFreshReleases(),
            'latestChapters' => $this->getLatestChapters(),
            'dailyWorks' => $this->getDailyWorks(),
            'popularWorks' => $this->getPopularWorks(),
            'topLikedWorks' => $this->getTopLikedWorks(),
        ]);

        $payload['layout'] = $this->layouts->get('home');

        return $payload;
    }

    public function getWeeklyChart(): Collection
    {
        return $this->homeItems(
            $this->repo->getWeeklyChart()
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            $this->artsForHome('weekly', 10)
        );
    }

    public function getFreshReleases(): Collection
    {
        return $this->homeItems(
            $this->repo->getFreshReleases()
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            $this->artsForHome('fresh', 24)
        );
    }

    public function getTodayReleases(string $type = 'all', int $limit = 12): Collection
    {
        return $this->releaseItems(
            $this->repo->getTodayReleaseChapters($type === 'art' ? 'all' : $type, $limit)
                ->map(fn(Chapter $chapter) => $this->contentSuspensions->maskChapter($chapter)),
            $this->artsForHome('today_release', $limit)
        )
            ->filter(fn(array $item) => $type === 'all' || $item['type'] === $type || ($type === 'novel' && $item['type'] === 'wattpad'))
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();
    }

    public function getTodayTop(string $type = 'all', string $metric = 'views', int $limit = 10): Collection
    {
        $metric = $metric === 'likes' ? 'likes' : 'views';

        return $this->releaseItems(
            $this->repo->getTodayTopChapters($type === 'art' ? 'all' : $type, $metric, $limit)
                ->map(fn(Chapter $chapter) => $this->contentSuspensions->maskChapter($chapter)),
            $this->artsForHome($metric === 'likes' ? 'today_top_likes' : 'today_top_views', $limit)
        )
            ->filter(fn(array $item) => $type === 'all' || $item['type'] === $type || ($type === 'novel' && $item['type'] === 'wattpad'))
            ->sortByDesc($metric === 'likes' ? 'period_likes' : 'period_views')
            ->take($limit)
            ->values();
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getLatestChapters()
            ->map(fn(Chapter $chapter) => $this->contentSuspensions->maskChapter($chapter));
    }

    public function getDailyWorks(string $type = 'all', int $limit = 12): Collection
    {
        return $this->homeItems(
            $this->repo->getDailyWorks($type === 'art' ? 'all' : $type, $limit)
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            $this->artsForHome('daily', $limit)
        );
    }

    public function getPopularWorks(string $type = 'all', int $limit = 12): Collection
    {
        return $this->homeItems(
            $this->repo->getPopularWorks($type === 'art' ? 'all' : $type, $limit)
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            $this->artsForHome('popular', $limit)
        );
    }

    public function getTopLikedWorks(string $type = 'all', int $limit = 10): Collection
    {
        return $this->homeItems(
            $this->repo->getTopLikedWorks($type === 'art' ? 'all' : $type, $limit)
                ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work)),
            $this->artsForHome('top_liker', $limit)
        );
    }

    private function homeItems(iterable $works, iterable $arts): Collection
    {
        return collect($works)
            ->map(fn(Work $work) => $this->formatWorkHomeItem($work))
            ->merge(collect($arts)->map(fn(Art $art) => $this->formatArtHomeItem($art)))
            ->values();
    }

    private function releaseItems(iterable $chapters, iterable $arts): Collection
    {
        return collect($chapters)
            ->map(fn(Chapter $chapter) => $this->formatChapterReleaseItem($chapter))
            ->merge(collect($arts)->map(fn(Art $art) => $this->formatArtReleaseItem($art)))
            ->values();
    }

    private function artsForHome(string $kind, int $limit): Collection
    {
        $query = Art::query()
            ->where('status', 'published')
            ->whereDoesntHave('activeContentSuspensions', fn($q) => $q->whereNull('target_field'))
            ->with(['activeContentSuspensions', 'images' => fn($q) => $q->orderBy('sort_order')]);

        match ($kind) {
            'today_release' => $query->where('created_at', '>=', now()->subDay())->orderByDesc('created_at'),
            'today_top_views' => $query
                ->withCount(['viewRecords as period_views' => fn($q) => $q->where('created_at', '>=', now()->subDay())])
                ->whereHas('viewRecords', fn($q) => $q->where('created_at', '>=', now()->subDay()))
                ->orderByDesc('period_views'),
            'today_top_likes' => $query
                ->withCount(['likedByUsers as period_likes' => fn($q) => $q->where('created_at', '>=', now()->subDay())])
                ->whereHas('likedByUsers', fn($q) => $q->where('created_at', '>=', now()->subDay()))
                ->orderByDesc('period_likes'),
            'daily' => $query
                ->withCount(['viewRecords as period_views' => fn($q) => $q->where('created_at', '>=', now()->subDay())])
                ->whereHas('viewRecords', fn($q) => $q->where('created_at', '>=', now()->subDay()))
                ->orderByDesc('period_views'),
            'weekly' => $query
                ->withCount(['viewRecords as period_views' => fn($q) => $q->where('created_at', '>=', now()->subDays(7))])
                ->whereHas('viewRecords', fn($q) => $q->where('created_at', '>=', now()->subDays(7)))
                ->orderByDesc('period_views'),
            'fresh' => $query->where('created_at', '>=', now()->subMonths(3))->orderByDesc('created_at'),
            'top_liker' => $query->orderByRaw('(likes + super_likes_count) DESC'),
            default => $query->orderByDesc('views'),
        };

        return $query->limit($limit)->get()->map(fn(Art $art) => $this->contentSuspensions->maskArt($art));
    }

    private function formatWorkHomeItem(Work $work): array
    {
        return [
            'id' => $work->id,
            'slug' => $work->slug,
            'title' => $work->title,
            'cover' => $work->cover,
            'banner' => $work->banner ?? null,
            'description' => $work->description ?? null,
            'type' => $work->type,
            'genres' => $work->genres ?? [],
            'views' => (int) ($work->views ?? 0),
            'likes' => (int) (($work->work_likes_count ?? 0) ?: ($work->likes ?? 0)),
            'super_likes_count' => (int) ($work->super_likes_count ?? 0),
            'created_at' => $work->created_at,
            'status' => $work->status,
        ];
    }

    private function formatArtHomeItem(Art $art): array
    {
        return [
            'id' => $art->id,
            'slug' => $art->slug,
            'title' => $art->title,
            'cover' => $art->images->first()?->image_path ?? $art->image_path,
            'banner' => null,
            'description' => $art->description,
            'type' => 'art',
            'genres' => $art->labels ?? [],
            'views' => (int) ($art->views ?? 0),
            'likes' => (int) ($art->likes ?? 0),
            'super_likes_count' => (int) ($art->super_likes_count ?? 0),
            'created_at' => $art->created_at,
            'status' => 'published',
        ];
    }

    private function formatChapterReleaseItem(Chapter $chapter): array
    {
        return [
            'id' => $chapter->id,
            'slug' => $chapter->work?->slug,
            'chapter_slug' => $chapter->slug,
            'title' => $chapter->work?->title ?? $chapter->title,
            'release_title' => $chapter->title,
            'cover' => $chapter->cover ?? $chapter->work?->cover,
            'banner' => null,
            'description' => null,
            'type' => $chapter->work?->type ?? 'webtoon',
            'content_type' => 'chapter',
            'genres' => [],
            'views' => (int) ($chapter->views ?? 0),
            'likes' => (int) ($chapter->likes ?? 0),
            'period_views' => (int) ($chapter->period_views ?? 0),
            'period_likes' => (int) ($chapter->period_likes ?? 0),
            'super_likes_count' => (int) ($chapter->super_likes_count ?? 0),
            'chapter_order' => (int) ($chapter->order ?? 0),
            'created_at' => $chapter->created_at,
            'status' => $chapter->status,
        ];
    }

    private function formatArtReleaseItem(Art $art): array
    {
        return array_merge($this->formatArtHomeItem($art), [
            'content_type' => 'art',
            'release_title' => null,
            'chapter_slug' => null,
            'chapter_order' => null,
            'period_views' => (int) ($art->period_views ?? 0),
            'period_likes' => (int) ($art->period_likes ?? 0),
        ]);
    }

    public function getWork(Work $work): Work
    {
        abort_if($this->contentSuspensions->isHidden($work), 404);

        return $this->contentSuspensions->maskWork($this->repo->getWork($work));
    }

    public function getChapters(Work $work, ?string $userId = null): \Illuminate\Support\Collection
    {
        $unlockedIds = $userId
            ? \App\Models\ChapterUnlock::where('user_id', $userId)
                ->pluck('chapter_id')
                ->toArray()
            : [];

        return $this->repo->getChapters($work)->map(function ($chapter) use ($unlockedIds) {
            $chapter = $this->contentSuspensions->maskChapter($chapter);
            $isLocked = match($chapter->lock_type) {
                'free'         => false,
                'early_access' => now()->lt($chapter->unlocks_at),
                'premium'      => true,
                default        => false,
            };

            // If user has unlocked it, override
            if (in_array($chapter->id, $unlockedIds)) {
                $isLocked = false;
            }

            return [
                'id'               => $chapter->id,
                'slug'             => $chapter->slug,
                'title'            => $chapter->title,
                'order'            => $chapter->order,
                'lock_type'        => $chapter->lock_type,
                'unlocks_at'       => $chapter->unlocks_at,
                'is_locked'        => $isLocked,
                'credits_required' => $chapter->credits_required,
                'likes'            => $chapter->likes,
                'comments_count'   => $chapter->comments_count,
                'super_likes_count' => $chapter->super_likes_count,
                'super_like_credits' => (float) $chapter->super_like_credits,
                'created_at'       => $chapter->created_at,
                'cover'            => $chapter->cover, 
            ];
        });
    }

    public function searchWorks(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->searchWorks($query)
            ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work));
    }

    public function getComics(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $paginator = $this->repo->getComics($request);

        $paginator->getCollection()->transform(
            fn(Work $work) => $this->contentSuspensions->maskWork($work)
        );

        return $paginator;
    }

    public function recordView(Request $request, Work $work, Chapter $chapter): int
    {
        $userId = auth('sanctum')->id();
        $ip     = $request->ip();

        if ($this->repo->hasViewed($chapter, $userId, $ip)) {
            return $chapter->views;
        }

        return $this->repo->recordView($chapter, $work, $userId, $ip);
    }

    public function toggleLike(Work $work, Chapter $chapter): array
    {
        $userId   = auth()->id();
        $existing = $this->repo->getLike($chapter, $userId);

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            $this->repo->createLike($chapter, $userId);
            $liked = true;
        }

        $likes = $this->repo->syncLikeCounts($chapter, $work);

        return ['liked' => $liked, 'likes' => $likes];
    }

    public function getLikeStatus(Chapter $chapter): array
    {
        return $this->repo->getLikeStatus($chapter, auth('sanctum')->id());
    }

    public function getWorkEngagementStatus(Work $work): array
    {
        return $this->repo->getWorkEngagementStatus($work, auth('sanctum')->id());
    }

    public function toggleWorkLike(Work $work): array
    {
        $userId = auth()->id();
        $existing = $this->repo->getWorkLike($work, $userId);

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            $this->repo->createWorkLike($work, $userId);
            $liked = true;
        }

        $count = $this->repo->syncWorkLikeCount($work);

        return ['liked' => $liked, 'work_likes_count' => $count];
    }

    public function toggleWorkFavorite(Work $work): array
    {
        $userId = auth()->id();
        $existing = $this->repo->getWorkFavorite($work, $userId);

        if ($existing) {
            $existing->delete();
            $favorited = false;
        } else {
            $this->repo->createWorkFavorite($work, $userId);
            $favorited = true;
        }

        $count = $this->repo->syncWorkFavoriteCount($work);

        return ['favorited' => $favorited, 'favorites_count' => $count];
    }
}
