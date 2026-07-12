<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\Work;
use App\Services\WorkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkController extends Controller
{
    public function __construct(private WorkService $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->getUserWorks($request->user()));
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeWorkRequest($request);

        $validated = $request->validate([
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['required', 'string', 'max:300'],
            'type'            => ['required', 'in:webtoon,wattpad'],
            'genres'          => ['required', 'array', 'min:1', 'max:5'],
            'genres.*'        => ['string', 'max:50'],
            'language'        => ['nullable', 'in:en,ko,id,th'],
            'cover'           => ['required', 'image', 'max:2048'],
            'banner'          => ['required', 'image', 'max:2048'], 
            'status'          => ['sometimes', 'in:draft,ongoing,completed,hiatus'],
            'schedule'        => ['nullable', 'string', 'max:20'],
            'schedule_time'   => ['nullable', 'date_format:H:i'],
            'next_chapter_at' => ['nullable', 'date'],
        ]);

        $work = $this->service->createWork($request->user(), $validated, $request);

        return response()->json($work, 201);
    }

    public function show(Request $request, Work $work): JsonResponse
    {
        if ($this->notOwner($request, $work)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $work->load('chapters');

        return response()->json($work);
    }

    public function update(Request $request, Work $work): JsonResponse
    {
        if ($this->notOwner($request, $work)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $this->normalizeWorkRequest($request);

        $validated = $request->validate([
            'title'           => ['sometimes', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'type'            => ['sometimes', 'in:webtoon,wattpad'],
            'genres'          => ['sometimes', 'array', 'min:1', 'max:5'],
            'genres.*'        => ['string', 'max:50'],
            'language'        => ['sometimes', 'in:en,ko,id,th'],
            'cover'           => ['nullable', 'image', 'max:2048'],
            'banner'          => ['nullable', 'image', 'max:2048'],
            'status'          => ['sometimes', 'in:draft,ongoing,completed,hiatus'],
            'schedule'        => ['nullable', 'string', 'max:20'],
            'schedule_time'   => ['nullable', 'date_format:H:i'],
            'next_chapter_at' => ['nullable', 'date'],
        ]);

        $work = $this->service->updateWork($work, $validated, $request);

        return response()->json($work);
    }

    public function destroy(Request $request, Work $work): JsonResponse
    {
        if ($this->notOwner($request, $work)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $this->service->deleteWork($work);

        return response()->json(['message' => 'Work deleted.']);
    }

    public function trash(Request $request, string $slug): JsonResponse
    {
        $work = Work::where('slug', $slug)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $work->delete(); // soft delete — sets deleted_at

        return response()->json(['message' => 'Moved to trash.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function notOwner(Request $request, Work $work): bool
    {
        return $work->user_id !== $request->user()->id;
    }

    private function normalizeWorkRequest(Request $request): void
    {
        if (! $request->has('schedule_time')) {
            return;
        }

        $request->merge([
            'schedule_time' => $this->normalizeScheduleTime($request->input('schedule_time')),
        ]);
    }

    private function normalizeScheduleTime(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);
        if ($value === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $value, $matches)) {
            return str_pad($matches[1], 2, '0', STR_PAD_LEFT) . ':' . $matches[2];
        }

        return $value;
    }
}
