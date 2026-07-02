<?php

namespace App\Services;

use App\Models\Work;
use App\Models\Chapter;
use App\Repositories\ChapterRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ChapterService
{
    public function __construct(private ChapterRepository $repo) {}

    public function createChapter(Work $work, array $data, Request $request): Chapter
    {
        $data['slug'] = Chapter::generateSlug($data['title'], $work->id);

        if ($request->hasFile('cover')) {
            $data['cover'] = $this->storeCoverWithThumbnail($request->file('cover'));
        }

        if (isset($data['status']) && $data['status'] === 'published') {
            $data['moderation_status'] = 'pending_review';
        } else {
            $data['moderation_status'] = 'draft';
        }

        if (!isset($data['order'])) {
            $data['order'] = $this->repo->getMaxOrder($work);
        }

        $chapter = $this->repo->create($work, $data);
        $chapter = $this->applyLockType($chapter, $request);

        if ($request->hasFile('images')) {
            $this->repo->saveImages($chapter, $request->file('images'));
        }

        return $chapter->load('images');
    }

    public function updateChapter(Chapter $chapter, array $data, Request $request): Chapter
    {
        if (isset($data['title'])) {
            $data['slug'] = Chapter::generateSlug($data['title'], $chapter->work_id, $chapter->id);
        }

        if ($request->hasFile('cover')) {
            if ($chapter->cover) {
                $this->deleteCoverWithThumbnail($chapter->cover);
            }
            $data['cover'] = $this->storeCoverWithThumbnail($request->file('cover'));
        }

        if (
            isset($data['status']) &&
            $data['status'] === 'published' &&
            in_array($chapter->moderation_status, ['draft', 'violated', null])
        ) {
            $data['moderation_status'] = 'pending_review';
        }

        $chapter = $this->repo->update($chapter, $data);
        $chapter = $this->applyLockType($chapter, $request);

        if ($request->hasFile('images')) {
            $this->repo->deleteImages($chapter);
            $this->repo->saveImages($chapter, $request->file('images'));
        } elseif ($request->has('existing_image_ids')) {
            $this->repo->reorderImages($chapter, $request->existing_image_ids);
        } else {
            $this->repo->deleteImages($chapter);
        }

        return $chapter->load('images');
    }

    public function deleteChapter(Chapter $chapter): void
    {
        if ($chapter->cover) {
            $this->deleteCoverWithThumbnail($chapter->cover);
        }
        $this->repo->delete($chapter);
    }

    // ── Private Helpers ───────────────────────────────────────────

    private function storeCoverWithThumbnail(UploadedFile $cover): string
    {
        $path = $cover->store('chapter-covers', 'public');

        $manager = new ImageManager(new Driver());
        $thumb = $manager->read(storage_path('app/public/' . $path));
        $thumb->scale(width: 700);

        $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        $thumb->save(storage_path('app/public/' . $smPath));

        return $path;
    }

    private function deleteCoverWithThumbnail(string $path): void
    {
        \Storage::disk('public')->delete($path);
        $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        \Storage::disk('public')->delete($smPath);
    }

    private function applyLockType(Chapter $chapter, Request $request): Chapter
    {
        $lockType = $request->input('lock_type', $chapter->lock_type ?? 'free');
        $status   = $request->input('status', $chapter->status ?? 'draft');

        $this->repo->update($chapter, [
            'lock_type'        => $lockType,
            'is_locked'        => $lockType !== 'free',
            'credits_required' => in_array($lockType, ['early_access', 'premium'])
                ? $request->input('credits_required', 0)
                : 0,
            'unlocks_at'       => $this->resolveUnlocksAt($lockType, $status, $chapter),
        ]);

        return $chapter->fresh();
    }

    private function resolveUnlocksAt(string $lockType, string $status, ?Chapter $chapter = null): ?Carbon
    {
        if ($lockType === 'early_access' && $status === 'published') {
            if ($chapter && $chapter->unlocks_at) {
                return $chapter->unlocks_at;
            }
            return now()->addDays(7);
        }
        return null;
    }
}