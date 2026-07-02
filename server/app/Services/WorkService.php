<?php

namespace App\Services;

use App\Models\Work;
use App\Repositories\WorkRepository;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class WorkService
{
    public function __construct(private WorkRepository $repo) {}

    public function getUserWorks($user): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getByUser($user);
    }

    public function createWork($user, array $validated, Request $request): Work
    {
        $validated['slug'] = Work::generateSlug($validated['title']);

        if ($request->hasFile('cover')) {
            $validated['cover'] = $this->storeImageWithThumbnail($request->file('cover'), 'covers');
        }

        if ($request->hasFile('banner')) {
            $validated['banner'] = $this->storeImageWithThumbnail($request->file('banner'), 'banners');
        }

        return $this->repo->create($user, $validated);
    }

    public function updateWork(Work $work, array $validated, Request $request): Work
    {
        if (isset($validated['title'])) {
            $validated['slug'] = Work::generateSlug($validated['title'], $work->id);
        }

        if ($request->hasFile('cover')) {
            if ($work->cover) {
                $this->deleteImageWithThumbnail($work->cover);
            }
            $validated['cover'] = $this->storeImageWithThumbnail($request->file('cover'), 'covers');
        } else {
            unset($validated['cover']);
        }

        if ($request->hasFile('banner')) {
            if ($work->banner) {
                $this->deleteImageWithThumbnail($work->banner);
            }
            $validated['banner'] = $this->storeImageWithThumbnail($request->file('banner'), 'banners');
        } else {
            unset($validated['banner']);
        }

        return $this->repo->update($work, $validated);
    }

    public function deleteWork(Work $work): void
    {
        // Snapshot all earning transactions for this work's chapters before deletion
        $work->loadMissing('chapters');

        $chapterIds = $work->chapters->pluck('id');

        if ($chapterIds->isNotEmpty()) {
            \App\Models\EarningTransaction::whereIn('chapter_id', $chapterIds)
                ->with('chapter:id,title')
                ->get()
                ->each(function ($tx) use ($work) {
                    \App\Models\EarningSnapshot::create([
                        'storyteller_id'    => $tx->storyteller_id,
                        'work_title'        => $work->title,
                        'chapter_title'     => $tx->chapter?->title ?? 'Deleted Chapter',
                        'chapter_id'        => $tx->chapter_id,
                        'credits_spent'     => $tx->credits_spent,
                        'platform_cut'      => $tx->platform_cut,
                        'storyteller_cut'   => $tx->storyteller_cut,
                        'platform_php'      => $tx->platform_php,
                        'storyteller_php'   => $tx->storyteller_php,
                        'credit_to_php_rate'=> $tx->credit_to_php_rate,
                        'earned_at'         => $tx->created_at,
                    ]);
                });
        }

        if ($work->cover) {
            $this->deleteImageWithThumbnail($work->cover);
        }
        if ($work->banner) {
            $this->deleteImageWithThumbnail($work->banner);
        }

        $this->repo->delete($work);
    }

    // ── Private Helpers ───────────────────────────────────────────

    private function storeImageWithThumbnail(UploadedFile $file, string $folder): string
    {
        $path = $file->store($folder, 'public');

        $manager = new ImageManager(new Driver());
        $thumb = $manager->read(storage_path('app/public/' . $path));
        $thumb->scale(width: 700);

        $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        $thumb->save(storage_path('app/public/' . $smPath));

        return $path;
    }

    private function deleteImageWithThumbnail(string $path): void
    {
        \Storage::disk('public')->delete($path);
        $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        \Storage::disk('public')->delete($smPath);
    }
}