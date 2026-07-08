<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Work;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    Work::onlyTrashed()
        ->where('deleted_at', '<', now()->subDays(15))
        ->forceDelete();
})->daily();

Schedule::command('chapters:publish-scheduled')->everyMinute();
Schedule::command('tickets:delete-old')->daily();