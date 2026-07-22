<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Work;
use App\Models\Chapter;
use App\Services\ContentSuspensionService;
use App\Services\PublicWorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicWorkController extends Controller
{
    public function __construct(
        private PublicWorkService $service,
        private ContentSuspensionService $contentSuspensions,
    ) {}

    public function hero(): JsonResponse
    {
        return response()->json($this->service->getHeroWorks());
    }

    public function home(): JsonResponse
    {
        return response()->json($this->service->getHome());
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
        if ($this->publicWorkIsUnavailable($work)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($this->service->getWork($work));
    }



    public function showChapters(Work $work, Request $request): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $userId = auth('sanctum')->id(); // null for guests

        return response()->json($this->service->getChapters($work, $userId));
    }

    
    public function showChapter(Work $work, Chapter $chapter): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)
            || $chapter->work_id !== $work->id
            || $chapter->status === 'draft'
            || $this->contentSuspensions->isHidden($chapter)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $chapter->load([
            'activeContentSuspensions',
            'images',
            'work.user:id,name,username',
        ]);
        $chapter = $this->contentSuspensions->maskChapter($chapter);
        $chapter->setRelation('images', $chapter->images->values());
        $chapter->work_type = $work->type;
        $chapter->work_user_id = $work->user_id;
        $chapter->artist_username = $chapter->work?->user?->username;
        $chapter->artist_name = $chapter->work?->user?->name;
        $chapter->work_title = $work->title;

        return response()->json($chapter);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        return response()->json($this->service->searchContent($query));
    }



    public function comics(Request $request): JsonResponse
    {
        return response()->json($this->service->getComics($request));
    }



    public function recordView(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)
            || $chapter->work_id !== $work->id
            || $chapter->status === 'draft'
            || $this->contentSuspensions->isHidden($chapter)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $views = $this->service->recordView($request, $work, $chapter);

        return response()->json(['views' => $views]);
    }



    public function toggleLike(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)
            || $chapter->work_id !== $work->id
            || $chapter->status === 'draft'
            || $this->contentSuspensions->isHidden($chapter)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (!auth()->id()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->service->toggleLike($work, $chapter));
    }


    
    public function getLikeStatus(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)
            || $chapter->work_id !== $work->id
            || $chapter->status === 'draft'
            || $this->contentSuspensions->isHidden($chapter)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($this->service->getLikeStatus($chapter));
    }

    public function getWorkEngagementStatus(Request $request, Work $work): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($this->service->getWorkEngagementStatus($work));
    }

    public function toggleWorkLike(Request $request, Work $work): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! auth()->id()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->service->toggleWorkLike($work));
    }

    public function toggleWorkFavorite(Request $request, Work $work): JsonResponse
    {
        if ($this->publicWorkIsUnavailable($work)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! auth()->id()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->service->toggleWorkFavorite($work));
    }

    private function publicWorkIsUnavailable(Work $work): bool
    {
        return ! in_array($work->status, ['ongoing', 'completed'], true)
            || $this->contentSuspensions->isHidden($work);
    }
}
