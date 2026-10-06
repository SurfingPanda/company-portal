<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Operator tool to set a portal account's password until a self-service activation / reset flow exists (see
 * App\Contracts\AccountActivation). The password is typed at a hidden prompt, hashed by Laravel and never printed or logged.
 *
 *   php artisan portal:set-password EMP-0042
 */
class SetPasswordCommand extends Command
{
    protected $signature = 'portal:set-password {employee_id : Employee ID of the account}';

    protected $description = 'Set a portal account password (hidden prompt). Ends the account\'s existing sessions.';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('This command needs an interactive terminal.');

            return self::FAILURE;
        }

        $user = User::query()->where('employee_id', $this->argument('employee_id'))->first();
        if ($user === null) {
            $this->error('No portal account has that employee ID.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('New password (at least 12 characters; hidden)');
        if (strlen($password) < 12) {
            $this->error('The password must be at least 12 characters.');

            return self::FAILURE;
        }
        if ($password !== (string) $this->secret('Repeat the password')) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($user, $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            Audit::record(null, 'USER_UPDATED', 'users', $user, $user->employee_id, 'success', ['field' => 'password', 'via' => 'artisan portal:set-password']);
        });

        $this->info("Password updated for {$user->employee_id}. The account's status is unchanged: activate it in the admin area if it is still pending.");

        return self::SUCCESS;
    }
}
