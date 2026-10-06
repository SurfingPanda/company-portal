<?php

namespace App\Console\Commands;

use App\Enums\UserStatus;
use App\Mail\DailyDigestMail;
use App\Models\User;
use App\Services\DigestBuilder;
use App\Services\MailGuard;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Sends each person who chose the daily summary one email with what needs them and what is new. Nothing to say means no email.
 * Runs every morning from the scheduler (`php artisan schedule:work` locally, or a cron entry running `schedule:run` each minute).
 */
class SendDailyDigests extends Command
{
    protected $signature = 'portal:send-digests {--user= : Only this employee ID} {--force : Send even if one already went today, or there is nothing new} {--dry-run : Show who would get one without sending}';

    protected $description = 'Email the daily summary to everyone who chose it';

    public function handle(): int
    {
        $query = User::query()->where('status', UserStatus::Active->value)->with(['preferences', 'profile', 'directoryEntry', 'roles']);
        if ($only = $this->option('user')) {
            $query->where('employee_id', $only);
        }

        $sent = $skipped = $failed = 0;
        $query->chunkById(100, function ($users) use (&$sent, &$skipped, &$failed) {
            foreach ($users as $user) {
                $prefs = $user->preferences;
                $mode = $prefs?->email_mode ?? 'daily';
                $already = $prefs?->last_digest_at?->isToday() ?? false;
                if ($mode !== 'daily' || ! MailGuard::deliverable($user->email) || ($already && ! $this->option('force'))) {
                    $skipped++;
                    continue;
                }

                $digest = DigestBuilder::for($user, $prefs?->last_digest_at ? CarbonImmutable::instance($prefs->last_digest_at) : null);
                if (DigestBuilder::isEmpty($digest) && ! $this->option('force')) {
                    $skipped++;
                    continue;
                }
                if ($this->option('dry-run')) {
                    $this->line("Would send to {$user->employee_id} ({$user->email}): ".DigestBuilder::summary($digest));
                    $sent++;
                    continue;
                }

                try {
                    Mail::to($user->email)->send(new DailyDigestMail($user, $digest));
                    $user->preferences()->firstOrCreate([])->forceFill(['last_digest_at' => now()])->save();
                    $sent++;
                } catch (\Throwable $e) {
                    Log::warning('Daily summary email failed', ['employee_id' => $user->employee_id, 'error' => $e->getMessage()]);
                    $failed++;
                }
            }
        });

        $this->info(($this->option('dry-run') ? 'Would send' : 'Sent').": {$sent}, skipped: {$skipped}, failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
