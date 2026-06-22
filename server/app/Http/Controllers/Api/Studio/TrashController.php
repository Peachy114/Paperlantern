<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\Work;
use App\Models\Chapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TrashController extends Controller
{
    // ── Works ─────────────────────────────────────────────────────────────────

    public function works(Request $request): JsonResponse
    {
        $works = Work::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->select('slug', 'title', 'type', 'cover', 'deleted_at')
            ->orderByDesc('deleted_at')
            ->get();

        return response()->json($works);
    }

    public function restoreWork(Request $request, string $slug): JsonResponse
    {
        $work = Work::onlyTrashed()
            ->where('slug', $slug)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $work->restore();

        return response()->json(['message' => 'Work restored.']);
    }

    public function forceDeleteWork(Request $request, string $slug): JsonResponse
    {
        $work = Work::onlyTrashed()
            ->where('slug', $slug)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $work->forceDelete(); // observer handles images + chapters

        return response()->json(['message' => 'Work permanently deleted.']);
    }

    // ── Chapters ──────────────────────────────────────────────────────────────

    public function chapters(Request $request): JsonResponse
    {
        $chapters = Chapter::onlyTrashed()
            ->whereHas('work', fn($q) => $q->where('user_id', $request->user()->id))
            ->with('work:id,title')
            ->select('slug', 'title', 'cover', 'deleted_at', 'work_id')
            ->orderByDesc('deleted_at')
            ->get()
            ->map(fn($c) => [
                'slug'       => $c->slug,
                'title'      => $c->title,
                'cover'      => $c->cover,
                'work_title' => $c->work->title,
                'deleted_at' => $c->deleted_at,
            ]);

        return response()->json($chapters);
    }

    public function restoreChapter(Request $request, string $slug): JsonResponse
    {
        $chapter = Chapter::onlyTrashed()
            ->where('slug', $slug)
            ->whereHas('work', fn($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();

        $chapter->restore();

        return response()->json(['message' => 'Chapter restored.']);
    }

    public function forceDeleteChapter(Request $request, string $slug): JsonResponse
    {
        $chapter = Chapter::onlyTrashed()
            ->where('slug', $slug)
            ->whereHas('work', fn($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();

        $chapter->forceDelete(); // observer handles images

        return response()->json(['message' => 'Chapter permanently deleted.']);
    }
}