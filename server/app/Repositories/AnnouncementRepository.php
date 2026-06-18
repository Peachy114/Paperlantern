<?php

namespace App\Repositories;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Collection;

class AnnouncementRepository
{
    // ── Admin ─────────────────────────────────────────────────────

    public function getAll(): Collection
    {
        return Announcement::with('creator:id,name,username')
            ->latest('is_pinned')
            ->latest()
            ->get();
    }

    public function create(int $adminId, array $data): Announcement
    {
        return Announcement::create([
            'created_by' => $adminId,
            ...$data,
        ]);
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $announcement->update($data);
        return $announcement->fresh();
    }

    public function delete(Announcement $announcement): void
    {
        if ($announcement->image) {
            \Storage::disk('public')->delete($announcement->image);
        }
        $announcement->delete();
    }

    // ── Public / Studio ───────────────────────────────────────────

    public function getByAudience(string $audience): Collection
    {
        return Announcement::where('audience', $audience)
            ->latest('is_pinned')
            ->latest()
            ->get();
    }
}