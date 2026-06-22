<?php

namespace App\Console\Commands;

use App\Models\Chapter;
use Illuminate\Console\Command;

class PublishScheduledChapters extends Command
{
    protected $signature   = 'chapters:publish-scheduled';
    protected $description = 'Publish chapters whose scheduled_at time has passed';

    public function handle(): void
    {
        $count = Chapter::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->update(['status' => 'published']);

        $this->info("Published {$count} chapter(s).");
    }
}