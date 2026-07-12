<?php

namespace App\Repositories;

use App\Models\Chapter;
use App\Models\Work;
use Illuminate\Support\Facades\Storage;

class ChapterRepository
{
    public function getByWork(Work $work): \Illuminate\Database\Eloquent\Collection
    {
        return $work->chapters()->orderBy('order')->get();
    }

    public function create(Work $work, array $data): Chapter
    {
        return $work->chapters()->create($data);
    }

    public function update(Chapter $chapter, array $data): Chapter
    {
        $chapter->update($data);
        return $chapter->fresh();
    }

    public function delete(Chapter $chapter): void
    {
        $chapter->delete();
    }

    public function getMaxOrder(Work $work): int
    {
        return $work->chapters()->max('order') + 1;
    }

    public function saveImages(Chapter $chapter, array $files, int $startOrder = 0): void
    {
        foreach ($files as $index => $file) {
            $path = $file->store('chapter-images', 'public');
            $chapter->images()->create(['path' => $path, 'order' => $startOrder + $index]);
        }
    }

    public function appendImages(Chapter $chapter, array $files): void
    {
        $lastOrder = $chapter->images()->max('order');
        $this->saveImages($chapter, $files, $lastOrder === null ? 0 : ((int) $lastOrder) + 1);
    }

    public function deleteImages(Chapter $chapter): void
    {
        foreach ($chapter->images as $image) {
            Storage::disk('public')->delete($image->path);
        }
        $chapter->images()->delete();
    }

    public function reorderImages(Chapter $chapter, array $keepIds): void
    {
        $chapter->images()->whereNotIn('id', $keepIds)->each(function ($img) {
            Storage::disk('public')->delete($img->path);
            $img->delete();
        });

        foreach ($keepIds as $order => $imageId) {
            $chapter->images()->where('id', $imageId)->update(['order' => $order]);
        }
    }
}
