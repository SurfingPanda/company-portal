<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Role;
use Illuminate\Database\Seeder;

/** The five system roles. Safe in every environment (no demo data). */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $labels = [
            RoleName::Employee->value => 'Regular Employee',
            RoleName::Manager->value => 'Manager',
            RoleName::Hr->value => 'HR Staff',
            RoleName::It->value => 'IT Staff',
            RoleName::Admin->value => 'Administrator',
        ];

        foreach ($labels as $name => $label) {
            Role::query()->updateOrCreate(['name' => $name], ['label' => $label]);
        }
    }
}
