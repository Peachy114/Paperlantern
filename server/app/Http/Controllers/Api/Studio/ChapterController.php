<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\Work;
use App\Models\Chapter;
use App\Services\ChapterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    public function __construct(private ChapterService $chapterService) {}

    public function index(Request $request, Work $work): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($work->chapters()->orderBy('order')->get());
    }


    
    public function show(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $chapter->load('images');
        $chapter->work_type = $work->type;

        return response()->json($chapter);
    }




    public function store(Request $request, Work $work): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'content'          => ['nullable', 'string'],
            'order'            => ['sometimes', 'integer'],
            'status'           => ['sometimes', 'in:draft,scheduled,published'],
            'cover'            => ['nullable', 'image', 'max:2048'],
            'scheduled_at'     => ['nullable', 'date'],
            'is_locked'        => ['sometimes', 'boolean'],
            'credits_required' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'lock_type'        => ['sometimes', 'in:free,early_access,premium'],
            'images'           => ['sometimes', 'array'],
            'images.*'         => ['image', 'max:5120'],
        ]);

        $chapter = $this->chapterService->createChapter($work, $validated, $request);

        return response()->json($chapter, 201);
    }




    public function update(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'                => ['sometimes', 'string', 'max:255'],
            'content'              => ['nullable', 'string'],
            'order'                => ['sometimes', 'integer'],
            'status'               => ['sometimes', 'in:draft,scheduled,published'],
            'cover'                => ['nullable', 'image', 'max:2048'],
            'scheduled_at'         => ['nullable', 'date'],
            'credits_required'     => ['sometimes', 'numeric', 'min:1', 'max:20'],
            'lock_type'            => ['sometimes', 'in:free,early_access,premium'],
            'images'               => ['sometimes', 'array'],
            'images.*'             => ['image', 'max:5120'],
            'existing_image_ids'   => ['sometimes', 'array'],
            'existing_image_ids.*' => ['nullable', 'integer'],
        ]);

        $chapter = $this->chapterService->updateChapter($chapter, $validated, $request);

        return response()->json($chapter);
    }




    public function destroy(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $this->chapterService->deleteChapter($chapter);

        return response()->json(['message' => 'Chapter deleted.']);
    }
}