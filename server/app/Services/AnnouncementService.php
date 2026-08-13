<?php

namespace App\Services;

use App\Models\Announcement;
use App\Repositories\AnnouncementRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class AnnouncementService
{
    public function __construct(private AnnouncementRepository $repo) {}

    public function getAll(): Collection
    {
        return $this->repo->getAll();
    }

    public function create(string $adminId, array $data, ?UploadedFile $image = null, array $galleryImages = []): Announcement
    {
        $data = $this->normalizeType($data);
        $data['body_html'] = $this->sanitizeRichText($data['body_html'] ?? null);
        if ($image) {
            $data['image'] = $this->storeWithThumbnail($image);
        }
        $data['gallery_images'] = $this->storeGallery($galleryImages);

        return $this->repo->create($adminId, $data);
    }

    public function update(Announcement $announcement, array $data, ?UploadedFile $image = null, array $galleryImages = []): Announcement
    {
        $data = $this->normalizeType($data, $announcement);
        if (array_key_exists('body_html', $data)) {
            $data['body_html'] = $this->sanitizeRichText($data['body_html']);
        }
        if ($image) {
            if ($announcement->image) {
                $this->deleteWithThumbnail($announcement->image);
            }
            $data['image'] = $this->storeWithThumbnail($image);
        }
        if ($galleryImages !== []) {
            foreach ($announcement->gallery_images ?? [] as $path) {
                Storage::disk('public')->delete($path);
            }
            $data['gallery_images'] = $this->storeGallery($galleryImages);
        }

        return $this->repo->update($announcement, $data);
    }

    public function delete(Announcement $announcement): void
    {
        if ($announcement->image) {
            $this->deleteWithThumbnail($announcement->image);
        }
        foreach ($announcement->gallery_images ?? [] as $path) {
            Storage::disk('public')->delete($path);
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
        $thumb = $manager->read(Storage::disk('public')->path($path));
        $thumb->scale(width: 700);

        $smallPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        $thumb->save(Storage::disk('public')->path($smallPath));

        return $path;
    }

    private function deleteWithThumbnail(string $path): void
    {
        \Storage::disk('public')->delete($path);

        $smallPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        \Storage::disk('public')->delete($smallPath);
    }

    private function storeGallery(array $images): array
    {
        return collect($images)
            ->filter(fn ($image) => $image instanceof UploadedFile)
            ->map(fn (UploadedFile $image) => $image->store('announcements/gallery', 'public'))
            ->values()
            ->all();
    }

    private function sanitizeRichText(?string $html): ?string
    {
        if (! $html) return null;

        $clean = strip_tags($html, '<p><br><h2><h3><h4><strong><b><em><i><u><ul><ol><li><blockquote><a>');
        $clean = preg_replace('/\s+on\w+\s*=\s*(["\']).*?\1/iu', '', $clean);
        $clean = preg_replace('/javascript\s*:/iu', '', $clean);

        return trim($clean);
    }

    private function normalizeType(array $data, ?Announcement $announcement = null): array
    {
        $tag = $data['tag'] ?? $announcement?->tag ?? 'update';
        $requestedEvent = array_key_exists('is_event', $data)
            ? (bool) $data['is_event']
            : (bool) ($announcement?->is_event ?? false);

        $data['is_event'] = $tag === 'event' || $requestedEvent;
        if ($data['is_event']) {
            $data['tag'] = 'event';
        }

        return $data;
    }
}
