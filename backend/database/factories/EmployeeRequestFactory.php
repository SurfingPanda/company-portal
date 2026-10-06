<?php

namespace Database\Factories;

use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use App\Models\EmployeeRequest;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EmployeeRequest> */
class EmployeeRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference_number' => 'REQ-2026-'.fake()->unique()->numerify('####'),
            'request_type_id' => RequestType::factory(),
            'user_id' => User::factory(),
            'subject' => 'Sample request',
            'description' => 'Sample request for development.',
            'status' => RequestStatus::Submitted,
            'priority' => RequestPriority::Normal,
            'submitted_at' => now(),
            'is_sample' => true,
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(['user_id' => $user->getKey()]);
    }
}
