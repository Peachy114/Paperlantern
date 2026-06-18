<?php

namespace App\Repositories;

use App\Models\Work;
use App\Models\Chapter;
use App\Models\ChapterView;
use App\Models\ChapterLike;
use Illuminate\Http\Request;

class PublicWorkRepository
{
    public function getHeroWorks(): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->orderByDesc('views')
            ->limit(5)
            ->get(['id', 'title', 'cover', 'banner', 'type', 'genres', 'views', 'likes', 'description']);
    }

    public function getWeeklyChart(): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->withSum(['chapters as weekly_views' => function ($q) {
                $q->where('created_at', '>=', now()->startOfWeek());
            }], 'views')
            ->orderByDesc('weekly_views')
            ->limit(10)
            ->get(['id', 'title', 'cover', 'type', 'views', 'likes']);
    }

    public function getFreshReleases(): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'title', 'cover', 'type', 'genres', 'likes', 'created_at']);
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return Chapter::where('status', '!=', 'draft')
            ->where('created_at', '>=', now()->subDays(7))
            ->whereHas('work', fn($q) => $q->where('status', '!=', 'draft'))
            ->orderByDesc('created_at')
            ->with(['work:id,title,cover,type'])
            ->limit(10)
            ->get(['id', 'work_id', 'title', 'cover', 'order', 'created_at']);
    }

    public function getWork(Work $work): Work
    {
        $work->load('user:id,name');
        $work->loadCount(['chapters as chapters_count' => function ($q) {
            $q->where('status', '!=', 'draft');
        }]);

        return $work;
    }

    public function getChapters(Work $work): \Illuminate\Database\Eloquent\Collection
    {
        return $work->chapters()
            ->where('status', '!=', 'draft')
            ->orderBy('order')
            ->get(['id', 'title', 'order', 'lock_type', 'unlocks_at', 'likes', 'credits_required', 'created_at']);
    }

    public function searchWorks(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->where('title', 'like', "%{$query}%")
            ->limit(8)
            ->get(['id', 'title', 'cover', 'type']);
    }

    public function getComics(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $type  = $request->query('type', 'webtoon');
        $query = Work::where('status', '!=', 'draft')->where('type', $type);

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
            $query->orderByDesc('views');
        } else {
            $query->latest();
        }

        return $query->paginate(20, ['id', 'title', 'cover', 'type', 'genres', 'views', 'likes', 'status', 'created_at']);
    }

    public function hasViewed(Chapter $chapter, ?int $userId, string $ip): bool
    {
        return \App\Models\ChapterView::where('chapter_id', $chapter->id)
            ->when($userId,
                fn($q) => $q->where('user_id', $userId),
                fn($q) => $q->where('ip_address', $ip)
            )
            ->exists();
    }

    public function recordView(Chapter $chapter, Work $work, ?int $userId, string $ip): int
    {
        ChapterView::create([
            'chapter_id' => $chapter->id,
            'user_id'    => $userId,
            'ip_address' => $userId ? null : $ip,
        ]);

        $chapterViews = ChapterView::where('chapter_id', $chapter->id)->count();
        $chapter->update(['views' => $chapterViews]);

        $workViews = Chapter::where('work_id', $work->id)->sum('views');
        $work->update(['views' => $workViews]);

        return $chapterViews;
    }

    public function getLike(Chapter $chapter, int $userId): ?\App\Models\ChapterLike
    {
        return ChapterLike::where('chapter_id', $chapter->id)
            ->where('user_id', $userId)
            ->first();
    }

    public function createLike(Chapter $chapter, int $userId): void
    {
        ChapterLike::create([
            'chapter_id' => $chapter->id,
            'user_id'    => $userId,
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

    public function getLikeStatus(Chapter $chapter, ?int $userId): array
    {
        $liked = $userId
            ? ChapterLike::where('chapter_id', $chapter->id)->where('user_id', $userId)->exists()
            : false;

        return ['liked' => $liked, 'likes' => $chapter->likes];
    }
}