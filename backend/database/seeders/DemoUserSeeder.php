<?php

namespace Database\Seeders;

use App\Models\PortalPreference;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * SAMPLE / DEMO / MOCK DATA. DEVELOPMENT ONLY: these are fictional accounts that mirror the React portal's mock-mode
 * accounts (EMP-0001 … EMP-0005, one per role). The shared password is a documented demo value, hashed here by Laravel;
 * it must never exist in a production database. Names and job titles are not stored: they belong to the HR directory entry.
 */
class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('DemoOnly123!');

        $accounts = [
            ['EMP-0001', 'arvin.leano@eljin.example', 'employee'],
            ['EMP-0002', 'ramon.aquino@eljin.example', 'manager'],
            ['EMP-0003', 'grace.ramos@eljin.example', 'hr'],
            ['EMP-0004', 'carlo.mendoza@eljin.example', 'it'],
            ['EMP-0005', 'portal.admin@eljin.example', 'admin'],
        ];

        foreach ($accounts as [$employeeId, $email, $role]) {
            $user = User::query()->where('employee_id', $employeeId)->first() ?? new User;
            $user->forceFill(['employee_id' => $employeeId, 'email' => $email, 'password' => $password, 'status' => 'active', 'is_sample' => true])->save();
            $user->roles()->sync([Role::query()->where('name', $role)->value('id')]);
            PortalPreference::query()->firstOrCreate(['user_id' => $user->getKey()]);
        }
    }
}
