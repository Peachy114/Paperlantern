<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\ContentSuspension;
use App\Models\StickyNote;
use App\Models\User;
use App\Models\Work;
use App\Services\ContentSuspensionService;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function __construct(
        private ModerationService $service,
        private ContentSuspensionService $contentSuspensions,
    ) {}

    // GET /api/admin/moderation
    public function index(): JsonResponse
    {
        return response()->json([
            'chapters'      => $this->service->getPendingChapters(),
            'works'         => $this->service->getPendingWorks(),
            'sticky_notes'  => $this->service->getPendingStickyNotes(),
            'pending_count' => $this->service->getPendingCount(),
            'review'        => $this->contentSuspensions->reviewQueue(),
        ]);
    }

    public function suspendContent(Request $request, string $type, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
            'field' => ['nullable', 'string', 'max:80'],
        ]);

        return response()->json(
            $this->contentSuspensions->suspendByType(
                $type,
                $id,
                $validated['field'] ?? null,
                $validated['reason'],
                $request->user()
            )
        );
    }

    public function restoreSuspension(Request $request, ContentSuspension $suspension): JsonResponse
    {
        return response()->json(
            $this->contentSuspensions->restore($suspension, $request->user())
        );
    }

    // ── Chapters ──────────────────────────────────────────────────

    public function approveCommentImage(Request $request, Comment $comment): JsonResponse
    {
        abort_unless($comment->image_path, 422, 'This comment does not have an uploaded image.');

        $comment->update(['image_moderation_status' => 'approved']);

        return response()->json([
            'message' => 'Comment image approved.',
            'comment' => $comment->fresh(['user:id,name,username,strike_count,is_suspended']),
        ]);
    }

    public function suspendCommentImage(Request $request, Comment $comment): JsonResponse
    {
        abort_unless($comment->image_path, 422, 'This comment does not have an uploaded image.');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $result = $this->contentSuspensions->suspend(
            $comment,
            $request->user(),
            $validated['reason'],
            'image_path'
        );

        $comment->update(['image_moderation_status' => 'suspended']);

        return response()->json([
            ...$result,
            'comment' => $comment->fresh(['user:id,name,username,strike_count,is_suspended']),
        ]);
    }

    // GET /api/admin/moderation/chapters/{chapter}
    public function show(Chapter $chapter): JsonResponse
    {
        return response()->json(
            $this->service->getChapterForReview($chapter)
        );
    }

    // PUT /api/admin/moderation/chapters/{chapter}/approve
    public function approve(Request $request, Chapter $chapter): JsonResponse
    {
        if ($chapter->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Chapter is not pending review.'], 422);
        }

        return response()->json(
            $this->service->approveChapter($request->user()->id, $chapter)
        );
    }

    // PUT /api/admin/moderation/chapters/{chapter}/violate
    public function violate(Request $request, Chapter $chapter): JsonResponse
    {
        if ($chapter->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Chapter is not pending review.'], 422);
        }

        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);

        return response()->json(
            $this->service->violateChapter($request->user()->id, $chapter, $validated['reason'])
        );
    }

    // ── Works ─────────────────────────────────────────────────────

    // GET /api/admin/moderation/works/{work}
    public function showWork(Work $work): JsonResponse
    {
        return response()->json(
            $this->service->getWorkForReview($work)
        );
    }

    // PUT /api/admin/moderation/works/{work}/approve
    public function approveWork(Request $request, Work $work): JsonResponse
    {
        if ($work->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Work is not pending review.'], 422);
        }

        return response()->json(
            $this->service->approveWork($request->user()->id, $work)
        );
    }

    // PUT /api/admin/moderation/works/{work}/violate
    public function violateWork(Request $request, Work $work): JsonResponse
    {
        if ($work->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Work is not pending review.'], 422);
        }

        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);

        return response()->json(
            $this->service->violateWork($request->user()->id, $work, $validated['reason'])
        );
    }

    // ── Sticky Notes ──────────────────────────────────────────────

    // GET /api/admin/moderation/sticky-notes/{note}
    public function showStickyNote(StickyNote $note): JsonResponse
    {
        return response()->json(
            $this->service->getStickyNoteForReview($note)
        );
    }

    // PUT /api/admin/moderation/sticky-notes/{note}/approve
    public function approveStickyNote(Request $request, StickyNote $note): JsonResponse
    {
        if ($note->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Sticky note is not pending review.'], 422);
        }

        return response()->json(
            $this->service->approveStickyNote($request->user()->id, $note)
        );
    }

    // PUT /api/admin/moderation/sticky-notes/{note}/violate
    public function violateStickyNote(Request $request, StickyNote $note): JsonResponse
    {
        if ($note->moderation_status !== 'pending_review') {
            return response()->json(['message' => 'Sticky note is not pending review.'], 422);
        }

        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);

        return response()->json(
            $this->service->violateStickyNote($request->user()->id, $note, $validated['reason'])
        );
    }

    // ── Violations ────────────────────────────────────────────────

    // GET /api/admin/moderation/violations
    public function violations(): JsonResponse
    {
        return response()->json($this->service->getViolations());
    }

    // GET /api/admin/moderation/users/{user}/violations
    public function userViolations(User $user): JsonResponse
    {
        return response()->json($this->service->getUserViolations($user));
    }
}
