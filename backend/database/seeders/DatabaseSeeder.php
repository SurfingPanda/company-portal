<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Roles are always seeded. Demo users and sample content are DEVELOPMENT/TEST ONLY: they are fictional, flagged
     * `is_sample`, and are refused in production so demo accounts can never reach a real database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        if (app()->isProduction()) {
            $this->command?->warn('Production environment: demo users and sample content were NOT seeded.');

            return;
        }

        $this->call([DemoUserSeeder::class, DemoContentSeeder::class, DemoActivitySeeder::class, DemoHrContentSeeder::class]);
    }
}
