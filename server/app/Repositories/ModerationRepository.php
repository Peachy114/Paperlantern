<?php

namespace App\Repositories;

use App\Models\Chapter;
use App\Models\StickyNote;
use App\Models\Violation;
use App\Models\Work;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ModerationRepository
{
    // ── Chapters ──────────────────────────────────────────────────

    public function getPendingChapters(): Collection
    {
        return Chapter::where('moderation_status', 'pending_review')
            ->with([
                'work:id,title,cover,type,user_id',
                'work.user:id,name,username,strike_count',
            ])
            ->latest()
            ->get(['id','slug', 'work_id', 'title', 'order', 'status', 'moderation_status', 'created_at']);
    }

    public function getChapterForReview(Chapter $chapter): Chapter
    {
        return $chapter->load([
            'images',
            'work:id,title,cover,type,user_id',
            'work.user:id,name,username,email,strike_count,is_banned',
        ]);
    }

    public function approveChapter(Chapter $chapter): Chapter
    {
        $chapter->update(['moderation_status' => 'approved']);
        return $chapter->fresh();
    }

    public function violateChapter(Chapter $chapter, string $reason, int $adminId): Violation
    {
        $chapter->update(['moderation_status' => 'violated']);
        return $this->recordViolation($chapter, $reason, $adminId);
    }

    // ── Works ─────────────────────────────────────────────────────

    public function getPendingWorks(): Collection
    {
        return Work::where('moderation_status', 'pending_review')
            ->with(['user:id,name,username,strike_count'])
            ->latest()
            ->get(['id', 'slug', 'title', 'cover', 'type', 'user_id', 'moderation_status', 'created_at']);
    }

    public function getWorkForReview(Work $work): Work
    {
        return $work->load([
            'user:id,name,username,email,strike_count,is_banned',
            'chapters:id,work_id,title,order,status',
        ]);
    }

    public function approveWork(Work $work): Work
    {
        $work->update(['moderation_status' => 'approved']);
        return $work->fresh();
    }

    public function violateWork(Work $work, string $reason, int $adminId): Violation
    {
        $work->update(['moderation_status' => 'violated']);
        return $this->recordViolation($work, $reason, $adminId);
    }

    // ── Sticky Notes ──────────────────────────────────────────────

    public function getPendingStickyNotes(): Collection
    {
        return StickyNote::where('moderation_status', 'pending_review')
            ->with(['user:id,name,username,strike_count'])
            ->latest()
            ->get(['id', 'text', 'color', 'type', 'user_id', 'moderation_status', 'created_at']);
    }

    public function getStickyNoteForReview(StickyNote $note): StickyNote
    {
        return $note->load([
            'user:id,name,username,email,strike_count,is_banned',
        ]);
    }

    public function approveStickyNote(StickyNote $note): StickyNote
    {
        $note->update(['moderation_status' => 'approved']);
        return $note->fresh();
    }

    public function violateStickyNote(StickyNote $note, string $reason, int $adminId): Violation
    {
        $note->update(['moderation_status' => 'violated']);
        return $this->recordViolation($note, $reason, $adminId);
    }

    // ── Shared ────────────────────────────────────────────────────

   private function recordViolation(Model $target, string $reason, int $adminId): Violation
    {
        if ($target instanceof Chapter) {
            $target->loadMissing('work.user');
            $user = $target->work->user;
        } else {
            $user = $target->user;
        }

        // Don't increment if user is already banned
        if (!$user->is_banned) {
            $user->increment('strike_count');
            $user->refresh();
        }

        $strikeCount = $user->strike_count;
        $resulted_in_ban = $strikeCount >= 3;

        if ($resulted_in_ban) {
            $user->update(['is_banned' => true]);
        }

        return Violation::create([
            'user_id'         => $user->id,
            'admin_id'        => $adminId,
            'target_type'     => get_class($target),
            'target_id'       => $target->id,
            'reason'          => $reason,
            'strike_number'   => $strikeCount,
            'resulted_in_ban' => $resulted_in_ban,
        ]);
    }

    // ── Stats ─────────────────────────────────────────────────────

    public function getPendingCount(): int
    {
        return Chapter::where('moderation_status', 'pending_review')->count()
             + Work::where('moderation_status', 'pending_review')->count()
             + StickyNote::where('moderation_status', 'pending_review')->count();
    }

    public function getViolations(): Collection
    {
        return Violation::with([
            'user:id,name,username,strike_count',
            'admin:id,name,username',
        ])
        ->latest()
        ->get();
    }

    public function getUserViolations(User $user): Collection
    {
        return Violation::where('user_id', $user->id)
            ->with(['admin:id,name'])
            ->latest()
            ->get();
    }
}