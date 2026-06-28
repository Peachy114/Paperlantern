<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Work;
use App\Models\Chapter;
use App\Models\AdminLog;

class SuperAdminRepository
{
    // ── Dashboard ─────────────────────────────────────────────────

    public function getStats(): array
    {
        return [
            'total_users'    => User::count(),
            'total_works'    => Work::count(),
            'total_chapters' => Chapter::count(),
            'banned_users'   => User::where('is_banned', true)->count(),
        ];
    }

    // ── Users ─────────────────────────────────────────────────────

    public function getAllUsers(): \Illuminate\Database\Eloquent\Collection
    {
        return User::withCount('works')
            ->latest()
            ->get(['id', 'name', 'username', 'email', 'role', 'is_banned', 'strike_count', 'created_at']);
    }

    public function getUserWithWorks(User $user): User
    {
        $user->load(['works' => function ($q) {
            $q->withCount('chapters')
              ->latest()
              ->get(['id', 'user_id', 'title', 'cover', 'type', 'status', 'views', 'likes', 'created_at']);
        }]);

        return $user;
    }

    public function banUser(User $user): User
    {
        $user->update(['is_banned' => true]);
        return $user->fresh();
    }

    public function unbanUser(User $user): User
    {
        $user->violations()->delete();
        $user->update([
            'is_banned'    => false,
            'strike_count' => 0,
        ]);
        return $user->fresh();
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }

    // ── Works ─────────────────────────────────────────────────────

    public function deleteWork(Work $work): void
    {
        $work->delete();
    }

    // ── Chapters ──────────────────────────────────────────────────

    public function getChapter(Chapter $chapter): Chapter
    {
        return $chapter->load('images');
    }

    public function deleteChapter(Chapter $chapter): void
    {
        $chapter->delete();
    }

    // ── Logs ──────────────────────────────────────────────────────

    public function log(string $adminId, string $action, string $targetType, string $targetId, ?string $notes = null): void
    {
        AdminLog::create([
            'admin_id'    => $adminId,
            'action'      => $action,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'notes'       => $notes,
        ]);
    }

    public function getLogs(int $page = 1, int $perPage = 10): \Illuminate\Pagination\LengthAwarePaginator
    {
        return AdminLog::with('admin:id,name,username')
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }
}