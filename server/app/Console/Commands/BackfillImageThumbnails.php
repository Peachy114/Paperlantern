<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use App\Models\Work;
use App\Models\Chapter;
use Illuminate\Console\Command;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class BackfillImageThumbnails extends Command
{
    protected $signature = 'images:backfill-thumbnails';
    protected $description = 'Generate missing _sm thumbnail variants for Announcement, Work, and Chapter images';

    private ImageManager $manager;
    private int $created = 0;
    private int $skipped = 0;
    private int $failed = 0;

    public function handle(): int
    {
        $this->manager = new ImageManager(new Driver());

        $this->info('Backfilling Announcement images...');
        Announcement::whereNotNull('image')->get()
            ->each(fn ($a) => $this->generateThumb($a->image, "Announcement #{$a->id}"));

        $this->info('Backfilling Work covers...');
        Work::whereNotNull('cover')->get()
            ->each(fn ($w) => $this->generateThumb($w->cover, "Work #{$w->id} (cover)"));

        $this->info('Backfilling Work banners...');
        Work::whereNotNull('banner')->get()
            ->each(fn ($w) => $this->generateThumb($w->banner, "Work #{$w->id} (banner)"));

        $this->info('Backfilling Chapter covers...');
        Chapter::whereNotNull('cover')->get()
            ->each(fn ($c) => $this->generateThumb($c->cover, "Chapter #{$c->id}"));

        $this->newLine();
        $this->info("Done. Created: {$this->created}, Skipped: {$this->skipped}, Failed: {$this->failed}");

        return self::SUCCESS;
    }

    private function generateThumb(string $path, string $label): void
    {
        $fullPath = storage_path('app/public/' . $path);
        $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
        $smFullPath = storage_path('app/public/' . $smPath);

        if (file_exists($smFullPath)) {
            $this->skipped++;
            return;
        }

        if (!file_exists($fullPath)) {
            $this->warn("Missing original for {$label}: {$path}");
            $this->failed++;
            return;
        }

        try {
            $thumb = $this->manager->read($fullPath);
            $thumb->scale(width: 700);
            $thumb->save($smFullPath);
            $this->created++;
            $this->info("Created thumbnail for {$label}");
        } catch (\Throwable $e) {
            $this->error("Failed for {$label}: {$e->getMessage()}");
            $this->failed++;
        }
    }
}

//php artisan images:backfill-thumbnails