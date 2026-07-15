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
            'title'            => ['required', 'string', 'max:100'],
            'content'          => ['nullable', 'string'],
            'artist_note'      => ['nullable', 'string', 'max:2000'],
            'order'            => ['sometimes', 'integer'],
            'status'           => ['sometimes', 'in:draft,scheduled,published'],
            'cover'            => ['nullable', 'image', 'max:2048'],
            'scheduled_at'     => ['required_if:status,scheduled', 'nullable', 'date', 'after:now'],
            'is_locked'        => ['sometimes', 'boolean'],
            'lock_type'        => ['sometimes', 'in:free,early_access,premium'],
            'defer_images'     => ['sometimes', 'boolean'],
            'credits_required' => [
                'sometimes',
                'integer',
                'min:0',
                'max:20',
                function ($attribute, $value, $fail) use ($request) {
                    $lockType = $request->input('lock_type', 'free');

                    if (in_array($lockType, ['early_access', 'premium']) && $value < 3) {
                        $fail('Credits required must be at least 3 for early access or premium chapters.');
                    }

                    if ($lockType === 'free' && (int) $value !== 0) {
                        $fail('Credits required must be 0 for free chapters.');
                    }
                },
            ],
            'images'           => ['sometimes', 'array'],
            'images.*'         => ['image', 'max:20480'],
        ]);

        if (isset($validated['content'])) {
            $validated['content'] = strip_tags($validated['content']);
        }

        $chapter = $this->chapterService->createChapter($work, $validated, $request);

        return response()->json($chapter, 201);
    }




    public function update(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'                => ['sometimes', 'string', 'max:50'],
            'content'              => ['nullable', 'string'],
            'artist_note'          => ['nullable', 'string', 'max:2000'],
            'order'                => ['sometimes', 'integer'],
            'status'               => ['sometimes', 'in:draft,scheduled,published'],
            'cover'                => ['nullable', 'image', 'max:2048'],
            'scheduled_at'         => ['required_if:status,scheduled', 'nullable', 'date', 'after:now'],
            'lock_type'            => ['sometimes', 'in:free,early_access,premium'],
            'credits_required'     => [
                'sometimes',
                'integer',
                'min:0',
                'max:20',
                function ($attribute, $value, $fail) use ($request, $chapter) {
                    $lockType = $request->input('lock_type', $chapter->lock_type ?? 'free');

                    if (in_array($lockType, ['early_access', 'premium']) && $value < 3) {
                        $fail('Credits required must be at least 3 for early access or premium chapters.');
                    }

                    if ($lockType === 'free' && (int) $value !== 0) {
                        $fail('Credits required must be 0 for free chapters.');
                    }
                },
            ],
            'images'               => ['sometimes', 'array'],
            'images.*'             => ['image', 'max:20480'],
            'replace_images'       => ['sometimes', 'boolean'],
            'existing_image_ids'   => ['sometimes', 'array'],
            'existing_image_ids.*' => ['nullable', 'string'],
        ]);

        if (isset($validated['content'])) {
            $validated['content'] = strip_tags($validated['content']);
        }

        $chapter = $this->chapterService->updateChapter($chapter, $validated, $request);

        return response()->json($chapter);
    }

    public function storeImages(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id || $chapter->work_id !== $work->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'images'   => ['required', 'array', 'min:1', 'max:5'],
            'images.*' => ['required', 'image', 'max:20480'],
        ]);

        $chapter = $this->chapterService->appendImages($chapter, $request);

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

    public function trash(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        if ($work->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $chapter->delete(); // soft delete — sets deleted_at, keeps images

        return response()->json(['message' => 'Chapter moved to trash.']);
    }
}
