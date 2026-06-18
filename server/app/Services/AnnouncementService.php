<?php

namespace App\Services;

use App\Models\Announcement;
use App\Repositories\AnnouncementRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;

class AnnouncementService
{
    public function __construct(private AnnouncementRepository $repo) {}

    public function getAll(): Collection
    {
        return $this->repo->getAll();
    }

    public function create(int $adminId, array $data, ?UploadedFile $image = null): Announcement
    {
        if ($image) {
            $data['image'] = $image->store('announcements', 'public');
        }

        return $this->repo->create($adminId, $data);
    }

    public function update(Announcement $announcement, array $data, ?UploadedFile $image = null): Announcement
    {
        if ($image) {
            // Delete old image if exists
            if ($announcement->image) {
                \Storage::disk('public')->delete($announcement->image);
            }
            $data['image'] = $image->store('announcements', 'public');
        }

        return $this->repo->update($announcement, $data);
    }

    public function delete(Announcement $announcement): void
    {
        $this->repo->delete($announcement);
    }

    public function getByAudience(string $audience): Collection
    {
        return $this->repo->getByAudience($audience);
    }
}