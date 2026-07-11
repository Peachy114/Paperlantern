<?php

namespace App\Services;

use App\Models\Work;
use App\Models\Chapter;
use App\Repositories\PublicWorkRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PublicWorkService
{
    public function __construct(
        private PublicWorkRepository $repo,
        private ContentSuspensionService $contentSuspensions,
    ) {}

    public function getHeroWorks(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getHeroWorks()
            ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work));
    }

    public function getHome(): array
    {
        return Cache::remember('public_home_payload:v2', now()->addMinute(), fn () => [
            'hero' => $this->getHeroWorks(),
            'weeklyChart' => $this->getWeeklyChart(),
            'freshReleases' => $this->getFreshReleases(),
            'latestChapters' => $this->getLatestChapters(),
        ]);
    }

    public function getWeeklyChart(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getWeeklyChart()
            ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work));
    }

    public function getFreshReleases(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getFreshReleases()
            ->map(fn(Work $work) => $this->contentSuspensions->maskWork($work));
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getLatestChapters()
            ->map(fn(Chapter $chapter) => $this->contentSuspensions->maskChapter($chapter));
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
