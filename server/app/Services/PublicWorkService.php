<?php

namespace App\Services;

use App\Models\Work;
use App\Models\Chapter;
use App\Repositories\PublicWorkRepository;
use Illuminate\Http\Request;

class PublicWorkService
{
    public function __construct(private PublicWorkRepository $repo) {}

    public function getHeroWorks(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getHeroWorks();
    }

    public function getWeeklyChart(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getWeeklyChart();
    }

    public function getFreshReleases(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getFreshReleases();
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getLatestChapters();
    }

    public function getWork(Work $work): Work
    {
        return $this->repo->getWork($work);
    }

    public function getChapters(Work $work, ?string $userId = null): \Illuminate\Support\Collection
    {
        $unlockedIds = $userId
            ? \App\Models\ChapterUnlock::where('user_id', $userId)
                ->pluck('chapter_id')
                ->toArray()
            : [];

        return $this->repo->getChapters($work)->map(function ($chapter) use ($unlockedIds) {
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
                'created_at'       => $chapter->created_at,
                'cover'            => $chapter->cover, 
            ];
        });
    }

    public function searchWorks(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->searchWorks($query);
    }

    public function getComics(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repo->getComics($request);
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
}