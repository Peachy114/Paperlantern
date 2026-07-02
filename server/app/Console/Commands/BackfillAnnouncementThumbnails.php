<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use Illuminate\Console\Command;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class BackfillAnnouncementThumbnails extends Command
{
    protected $signature = 'announcements:backfill-thumbnails';
    protected $description = 'Generate missing _sm thumbnail variants for existing announcement images';

    public function handle(): int
    {
        $manager = new ImageManager(new Driver());
        $announcements = Announcement::whereNotNull('image')->get();

        $created = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($announcements as $announcement) {
            $path = $announcement->image;
            $fullPath = storage_path('app/public/' . $path);
            $smPath = preg_replace('/(\.[^.]+)$/', '_sm$1', $path);
            $smFullPath = storage_path('app/public/' . $smPath);

            if (file_exists($smFullPath)) {
                $skipped++;
                continue;
            }

            if (!file_exists($fullPath)) {
                $this->warn("Missing original file for announcement #{$announcement->id}: {$path}");
                $failed++;
                continue;
            }

            try {
                $thumb = $manager->read($fullPath);
                $thumb->scale(width: 700);
                $thumb->save($smFullPath);
                $created++;
                $this->info("Created thumbnail for announcement #{$announcement->id}");
            } catch (\Throwable $e) {
                $this->error("Failed for announcement #{$announcement->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Done. Created: {$created}, Skipped (already existed): {$skipped}, Failed: {$failed}");

        return self::SUCCESS;
    }
}

// 
//php artisan announcements:backfill-thumbnails