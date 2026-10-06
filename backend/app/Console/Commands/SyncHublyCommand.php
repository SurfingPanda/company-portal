<?php

namespace App\Console\Commands;

use App\Services\Hubly;
use Illuminate\Console\Command;

/** Delivers tickets and replies that could not reach Hubly the first time (retried with a growing delay). Runs every minute. */
class SyncHublyCommand extends Command
{
    protected $signature = 'portal:sync-hubly';

    protected $description = 'Deliver queued tickets and replies to Hubly';

    public function handle(): int
    {
        if (! Hubly::enabled()) {
            return self::SUCCESS;
        }
        $sent = Hubly::deliverDue();
        $this->info("Delivered {$sent} to Hubly.");

        return self::SUCCESS;
    }
}
