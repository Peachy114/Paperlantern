<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use Illuminate\Console\Command;

class DeleteOldTickets extends Command
{
    protected $signature = 'tickets:delete-old';
    protected $description = 'Delete tickets older than 1 month';

    public function handle(): void
    {
        $count = Ticket::where('created_at', '<', now()->subMonth())->delete();
        $this->info("Deleted {$count} ticket(s) older than 1 month.");
    }
}