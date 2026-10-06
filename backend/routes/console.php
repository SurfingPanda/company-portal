<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// The morning summary email. The scheduler itself must run: `php artisan schedule:work` locally, or a cron entry that runs
// `php artisan schedule:run` every minute on the server.
// Tickets and replies that could not reach Hubly the first time are retried here.
Schedule::command('portal:sync-hubly')->everyMinute()->withoutOverlapping();
Schedule::command('portal:send-digests')->dailyAt('07:30')->timezone('Asia/Manila')->withoutOverlapping();
