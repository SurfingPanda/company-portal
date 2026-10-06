<?php

namespace Database\Factories;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    /** Portal accounts only: fictional demo identities. No name or HR data (those live on the HR directory entry). */
    public function definition(): array
    {
        return [
            'employee_id' => 'EMP-'.fake()->unique()->numerify('####'),
            'email' => fake()->unique()->userName().'@eljin.example',
            // Hashed once per run; the real value lives in the DemoSeeder (development only).
            'password' => static::$password ??= Hash::make('DemoOnly123!'),
            'remember_token' => null,
            'status' => UserStatus::Active,
            'onboarded_at' => now(),
            'is_sample' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => UserStatus::Inactive]);
    }
}
