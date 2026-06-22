<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Work;
use App\Models\Chapter;
use App\Services\PublicWorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicWorkController extends Controller
{
    public function __construct(private PublicWorkService $service) {}

    public function hero(): JsonResponse
    {
        return response()->json($this->service->getHeroWorks());
    }

    public function weeklyChart(): JsonResponse
    {
        return response()->json($this->service->getWeeklyChart());
    }

    public function freshReleases(): JsonResponse
    {
        return response()->json($this->service->getFreshReleases());
    }

    public function latestChapters(): JsonResponse
    {
        return response()->json($this->service->getLatestChapters());
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function showWork(Work $work): JsonResponse
    {
        if ($work->status === 'draft') {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($this->service->getWork($work));
    }



    public function showChapters(Work $work, Request $request): JsonResponse
    {
        if ($work->status === 'draft') {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $userId = auth('sanctum')->id(); // null for guests

        return response()->json($this->service->getChapters($work, $userId));
    }

    
    public function showChapter(Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->status === 'draft') {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $chapter->load('images');
        $chapter->work_type = $work->type;

        return response()->json($chapter);
    }



    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        return response()->json($this->service->searchWorks($query));
    }



    public function comics(Request $request): JsonResponse
    {
        return response()->json($this->service->getComics($request));
    }



    public function recordView(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        $views = $this->service->recordView($request, $work, $chapter);

        return response()->json(['views' => $views]);
    }



    public function toggleLike(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if (!auth()->id()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->service->toggleLike($work, $chapter));
    }


    
    public function getLikeStatus(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        return response()->json($this->service->getLikeStatus($chapter));
    }
}