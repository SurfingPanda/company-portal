<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\JobApplication;
use App\Models\RecruitmentJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<JobApplication> */
class JobApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'application_number' => 'APP-2026-'.fake()->unique()->numerify('####'),
            'job_id' => RecruitmentJob::factory(),
            'user_id' => User::factory(),
            'applicant_name' => 'Sample Applicant',
            'email' => 'applicant.sample@example.com',
            'status' => ApplicationStatus::Submitted,
            'submitted_at' => now(),
            'is_sample' => true,
        ];
    }
}
