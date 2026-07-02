<?php

namespace App\Services;

use App\Models\Announcement;
use App\Repositories\AnnouncementRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class AnnouncementService
{
    public function __construct(private AnnouncementRepository $repo) {}

    public function getAll(): Collection
    {
        return $this->repo->getAll();
    }

    public function create(string $adminId, array $data, ?UploadedFile $image = null): Announcement
    {
        if ($image) {
            $data['image'] = $this->storeWithThumbnail($image);
        }

        return $this->repo->create($adminId, $data);
    }

    public function update(Announcement $announcement, array $data, ?UploadedFile $image = null): Announcement
    {
        if ($image) {
            if ($announcement->image) {
                $this->deleteWithThumbnail($announcement->image);
            }
            $data['image'] = $this->storeWithThumbnail($image);
        }

        return $this->repo->update($announcement, $data);
    }

    public function delete(Announcement $announcement): void
    {
        if ($announcement->image) {
            $this->deleteWithThumbnail($announcement->image);
        }
        $this->repo->delete($announcement);
    }

    public function getByAudience(string $audience): Collection
    {
        return $this->repo->getByAudience($audience);
    }

    /**
     * Store the original upload, then generate a resized "_sm" variant
     * for use as a card thumbnail (matches DESKTOP_CARD_WIDTH on frontend).
     */
    private function storeWithThumbnail(UploadedFile $image): string
    {
        $path = $image->store('announcements', 'public');

        $manager = new ImageManager(new Driver());
        $thumb = $manager->read(storage_path('app/public/' . $path));
        $thumb->scale(width: 700);

        $smallPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        $thumb->save(storage_path('app/public/' . $smallPath));

        return $path;
    }

    private function deleteWithThumbnail(string $path): void
    {
        \Storage::disk('public')->delete($path);

        $smallPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        \Storage::disk('public')->delete($smallPath);
    }
}