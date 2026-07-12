<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\StickyNote;
use App\Models\User;
use App\Models\Violation;
use App\Models\Work;
use App\Repositories\ModerationRepository;
use App\Repositories\SuperAdminRepository;
use Illuminate\Database\Eloquent\Collection;

class ModerationService
{
    public function __construct(
        private ModerationRepository $repo,
        private SuperAdminRepository $adminRepo,
    ) {}

    // ── Chapters ──────────────────────────────────────────────────

    public function getPendingChapters(): Collection
    {
        return $this->repo->getPendingChapters();
    }

    public function getChapterForReview(Chapter $chapter): Chapter
    {
        return $this->repo->getChapterForReview($chapter);
    }

    public function approveChapter(string $adminId, Chapter $chapter): array
    {
        $chapter = $this->repo->approveChapter($chapter);
        $this->adminRepo->log($adminId, 'approved_chapter', 'chapter', $chapter->id);

        return ['message' => 'Chapter approved and published.', 'chapter' => $chapter];
    }

    public function violateChapter(string $adminId, Chapter $chapter, string $reason): array
    {
        $violation   = $this->repo->violateChapter($chapter, $reason, $adminId);
        $user        = $chapter->work->user->fresh();
        $strikeCount = $user->strike_count;

        $this->adminRepo->log($adminId, 'violated_chapter', 'chapter', $chapter->id, "Strike {$strikeCount}: {$reason}");

        return [
            'message'   => $this->strikeMessage($violation, $strikeCount),
            'strike'    => $strikeCount,
            'suspended' => $strikeCount >= 3,
            'violation' => $violation,
        ];
    }

    // ── Works ─────────────────────────────────────────────────────

    public function getPendingWorks(): Collection
    {
        return $this->repo->getPendingWorks();
    }

    public function getWorkForReview(Work $work): Work
    {
        return $this->repo->getWorkForReview($work);
    }

    public function approveWork(string $adminId, Work $work): array
    {
        $work = $this->repo->approveWork($work);
        $this->adminRepo->log($adminId, 'approved_work', 'work', $work->id);

        return ['message' => 'Work approved and published.', 'work' => $work];
    }

    public function violateWork(string $adminId, Work $work, string $reason): array
    {
        $violation   = $this->repo->violateWork($work, $reason, $adminId);
        $user        = $work->user->fresh();
        $strikeCount = $user->strike_count;

        $this->adminRepo->log($adminId, 'violated_work', 'work', $work->id, "Strike {$strikeCount}: {$reason}");

        return [
            'message'   => $this->strikeMessage($violation, $strikeCount),
            'strike'    => $strikeCount,
            'suspended' => $strikeCount >= 3,
            'violation' => $violation,
        ];
    }

    // ── Sticky Notes ──────────────────────────────────────────────

    public function getPendingStickyNotes(): Collection
    {
        return $this->repo->getPendingStickyNotes();
    }

    public function getStickyNoteForReview(StickyNote $note): StickyNote
    {
        return $this->repo->getStickyNoteForReview($note);
    }

    public function approveStickyNote(string $adminId, StickyNote $note): array
    {
        $note = $this->repo->approveStickyNote($note);
        $this->adminRepo->log($adminId, 'approved_sticky_note', 'sticky_note', $note->id);

        return ['message' => 'Sticky note approved.', 'sticky_note' => $note];
    }

    public function violateStickyNote(string $adminId, StickyNote $note, string $reason): array
    {
        $violation   = $this->repo->violateStickyNote($note, $reason, $adminId);
        $user        = $note->user->fresh();
        $strikeCount = $user->strike_count;

        $this->adminRepo->log($adminId, 'violated_sticky_note', 'sticky_note', $note->id, "Strike {$strikeCount}: {$reason}");

        return [
            'message'   => $this->strikeMessage($violation, $strikeCount),
            'strike'    => $strikeCount,
            'suspended' => $strikeCount >= 3,
            'violation' => $violation,
        ];
    }

    // ── Violations ────────────────────────────────────────────────

    public function getPendingCount(): int
    {
        return $this->repo->getPendingCount();
    }

    public function getViolations(): Collection
    {
        return $this->repo->getViolations();
    }

    public function getUserViolations(User $user): array
    {
        $violations  = $this->repo->getUserViolations($user);
        $strikeCount = $user->strike_count;

        return [
            'strike_count' => $strikeCount,
            'is_banned'    => $user->is_banned,
            'is_suspended' => (bool) ($user->is_suspended ?? false),
            'at_risk'      => $user->isAtRisk(),
            'violations'   => $violations,
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function strikeMessage(Violation $violation, int $strikeCount): string
    {
        return match(true) {
            $strikeCount >= 3           => 'User has been suspended after 3 strikes.',
            $strikeCount === 2          => 'Final warning — next violation bans the user.',
            default                     => 'Warning issued. ',
        };
    }
}
