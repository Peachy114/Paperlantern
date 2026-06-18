<?php

namespace App\Observers;

use App\Models\Chapter;
use Illuminate\Support\Facades\Storage;

class ChapterObserver
{
    /**
     * Handle the Chapter "creating" event.
     */
    public function creating(Chapter $chapter): void
    {
        $chapter->moderation_status = 'pending_review';
    }

    /**
     * Handle the Chapter "created" event.
     */
    public function created(Chapter $chapter): void
    {
        //
    }

    /**
     * Handle the Chapter "updated" event.
     */
    public function updated(Chapter $chapter): void
    {
        //
    }

    /**
     * Handle the Chapter "deleted" event.
     */
    public function deleted(Chapter $chapter): void
    {
        if ($chapter->cover) {
            Storage::disk('public')->delete($chapter->cover);
        }

        $chapter->loadMissing('images');
        
        foreach ($chapter->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $chapter->images()->delete();
    }

    /**
     * Handle the Chapter "restored" event.
     */
    public function restored(Chapter $chapter): void
    {
        //
    }

    /**
     * Handle the Chapter "force deleted" event.
     */
    public function forceDeleted(Chapter $chapter): void
    {
        //
    }
}