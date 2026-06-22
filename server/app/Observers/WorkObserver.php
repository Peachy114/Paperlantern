<?php

namespace App\Observers;

use App\Models\Work;
use Illuminate\Support\Facades\Storage;

class WorkObserver
{
    public function creating(Work $work): void
    {
        $work->moderation_status = 'pending_review';
    }
    /**
     * Handle the Work "created" event.
     */
    public function created(Work $work): void
    {
        //
    }

    /**
     * Handle the Work "updated" event.
     */
    public function updated(Work $work): void
    {
        //
    }

    /**
     * Handle the Work "deleted" event.
     */
    public function deleted(Work $work): void
    {
        // intentionally empty — images are kept until force delete
    }


    /**
     * Handle the Work "restored" event.
     */
    public function restored(Work $work): void
    {
        //
    }

    /**
     * Handle the Work "force deleted" event.
     */
    public function forceDeleted(Work $work): void
    {
        if ($work->cover) Storage::disk('public')->delete($work->cover);
        if ($work->banner) Storage::disk('public')->delete($work->banner);

        $work->chapters()->withTrashed()->each(function ($chapter) {
            $chapter->forceDelete(); // triggers ChapterObserver::forceDeleted
        });
    }
}
