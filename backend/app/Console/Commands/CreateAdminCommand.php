<?php

namespace App\Console\Commands;

use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * Bootstrap the FIRST administrator on a new deployment. Everything is entered by the operator at the prompt: there is no
 * default account, no default password and no way to run it without typing a password (never pass one as an argument: it would
 * end up in shell history and process lists).
 *
 *   php artisan portal:create-admin
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'portal:create-admin {employee_id? : Employee ID of the administrator} {email? : company email}';

    protected $description = 'Create a portal administrator account (prompts for the password; no defaults).';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('This command needs an interactive terminal: the password is typed at a hidden prompt.');

            return self::FAILURE;
        }

        $employeeId = $this->argument('employee_id') ?: $this->ask('Employee ID');
        $email = strtolower((string) ($this->argument('email') ?: $this->ask('Company email')));

        $validator = Validator::make(['employee_id' => $employeeId, 'email' => $email], [
            'employee_id' => ['required', 'regex:/^[A-Za-z0-9][A-Za-z0-9_\-]{2,31}$/', 'unique:users,employee_id'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (at least 12 characters; hidden)');
        if (strlen($password) < 12) {
            $this->error('The password must be at least 12 characters.');

            return self::FAILURE;
        }
        if ($password !== (string) $this->secret('Repeat the password')) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        (new RoleSeeder)->run(); // roles only; safe in every environment

        DB::transaction(function () use ($employeeId, $email, $password) {
            $user = new User(['email' => $email]);
            $user->forceFill(['employee_id' => $employeeId, 'password' => Hash::make($password), 'status' => 'active', 'is_sample' => false])->save();
            $user->roles()->sync([Role::where('name', RoleName::Admin->value)->value('id')]);
            Audit::record(null, 'USER_CREATED', 'users', $user, $employeeId, 'success', ['role' => 'admin', 'via' => 'artisan portal:create-admin']);
        });

        $this->info("Administrator {$employeeId} created. Sign in with the employee ID or company email and the password you just set.");

        return self::SUCCESS;
    }
}
