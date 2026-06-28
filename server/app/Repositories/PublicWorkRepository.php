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
            ->has('chapters')  // ← add
            ->orderByDesc('views')
            ->limit(5)
            ->get(['id', 'slug', 'title', 'cover', 'banner', 'type', 'genres', 'views', 'likes', 'description', 'status']);
    }

    public function getWeeklyChart(): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->has('chapters') 
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
            ->has('chapters') 
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'slug', 'title', 'cover', 'type', 'genres', 'likes', 'created_at']);
    }

    public function getLatestChapters(): \Illuminate\Database\Eloquent\Collection
    {
        return Chapter::where('status', '!=', 'draft')
            ->where('created_at', '>=', now()->subDays(7))
            ->whereHas('work', fn($q) => $q->where('status', '!=', 'draft'))
            ->orderByDesc('created_at')
            ->with(['work:id,slug,title,cover,type,user_id'])  // ← add user_id
            ->limit(50)  // ← fetch more so dedup has enough to work with
            ->get(['id', 'work_id', 'title', 'cover', 'order', 'created_at'])
            ->unique(fn($chapter) => $chapter->work?->user_id)  // ← one per user
            ->take(10)
            ->values();
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
            ->get(['id', 'slug', 'title', 'order', 'lock_type', 'unlocks_at', 'likes', 'credits_required', 'created_at', 'cover']);
    }

    public function searchWorks(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return Work::where('status', '!=', 'draft')
            ->where('title', 'like', "%{$query}%")
            ->limit(8)
            ->get(['id', 'slug', 'title', 'cover', 'type']);
    }

    public function getComics(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $type  = $request->query('type', 'webtoon');
        $query = Work::where('status', '!=', 'draft')
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
            $query->orderByDesc('views');
        } else {
            $query->latest();
        }

        return $query->paginate(20, ['id', 'slug', 'title', 'cover', 'type', 'genres', 'views', 'likes', 'status', 'created_at']);
    }

    public function hasViewed(Chapter $chapter, ?string $userId, string $ip): bool
    {
        return \App\Models\ChapterView::where('chapter_id', $chapter->id)
            ->when($userId,
                fn($q) => $q->where('user_id', $userId),
                fn($q) => $q->where('ip_address', $ip)
            )
            ->exists();
    }

    public function recordView(Chapter $chapter, Work $work, ?string $userId, string $ip): int
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

    public function getLike(Chapter $chapter, string $userId): ?\App\Models\ChapterLike
    {
        return ChapterLike::where('chapter_id', $chapter->id)
            ->where('user_id', $userId)
            ->first();
    }

    public function createLike(Chapter $chapter, string $userId): void
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

    public function getLikeStatus(Chapter $chapter, ?string $userId): array
    {
        $liked = $userId
            ? ChapterLike::where('chapter_id', $chapter->id)->where('user_id', $userId)->exists()
            : false;

        return ['liked' => $liked, 'likes' => $chapter->likes];
    }
}