<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ChapterRevision;
use App\Models\Work;
use App\Services\ChapterRevisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterRevisionController extends Controller
{
    public function __construct(private ChapterRevisionService $revisions) {}

    public function index(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        // revision list ----
        $this->authorizeOwner($request, $work, $chapter);

        return response()->json([
            'data' => $chapter->revisions()
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn(ChapterRevision $revision) => [
                    'id' => $revision->id,
                    'source' => $revision->source,
                    'title' => $revision->title,
                    'word_count' => $revision->word_count,
                    'created_at' => $revision->created_at,
                ]),
        ]);
    }

    public function autosave(Request $request, Work $work, Chapter $chapter): JsonResponse
    {
        // autosave draft ----
        $this->authorizeOwner($request, $work, $chapter);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:100'],
            'content' => ['nullable', 'string'],
            'artist_note' => ['nullable', 'string', 'max:2000'],
        ]);

        if (array_key_exists('content', $validated)) {
            $validated['content'] = $this->sanitizeChapterHtml((string) $validated['content']);
        }

        $this->revisions->snapshot($chapter, $request->user(), 'autosave');
        $chapter->update($validated);

        return response()->json([
            'message' => 'Draft autosaved.',
            'saved_at' => now()->toIso8601String(),
        ]);
    }

    public function restore(Request $request, Work $work, Chapter $chapter, ChapterRevision $revision): JsonResponse
    {
        // restore revision ----
        $this->authorizeOwner($request, $work, $chapter);
        abort_unless($revision->chapter_id === $chapter->id, 404);

        $this->revisions->snapshot($chapter, $request->user(), 'before_restore');

        $chapter->update([
            'title' => $revision->title ?? $chapter->title,
            'content' => $revision->content,
            'artist_note' => $revision->artist_note,
        ]);

        return response()->json($chapter->fresh());
    }

    private function authorizeOwner(Request $request, Work $work, Chapter $chapter): void
    {
        // owner guard ----
        abort_unless($work->user_id === $request->user()->id && $chapter->work_id === $work->id, 403);
    }

    private function sanitizeChapterHtml(string $content): string
    {
        // allowed writing editor tags ----
        $allowed = '<p><br><strong><b><em><i><u><s><strike><a><ol><ul><li><blockquote><hr><h2><h3><div><span>';
        $clean = strip_tags($content, $allowed);

        return preg_replace('/\s(on\w+|style)=("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $clean) ?? $clean;
    }
}
