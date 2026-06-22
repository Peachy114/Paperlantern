<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Work;
use App\Models\Chapter;
use Illuminate\Support\Str;

class BackfillSlugs extends Command
{
    protected $signature = 'backfill:slugs';
    protected $description = 'Backfill slugs for works and chapters';

    public function handle()
    {
        // Backfill Works
        Work::whereNull('slug')->orWhere('slug', '')->each(function ($work) {
            $work->slug = Work::generateSlug($work->title, $work->id);
            $work->saveQuietly();
            $this->info("Work: {$work->title} → {$work->slug}");
        });

        // Backfill Chapters
        Chapter::whereNull('slug')->orWhere('slug', '')->each(function ($chapter) {
            $chapter->slug = Chapter::generateSlug($chapter->title, $chapter->work_id, $chapter->id);
            $chapter->saveQuietly();
            $this->info("Chapter: {$chapter->title} → {$chapter->slug}");
        });

        $this->info('Done!');
    }
}