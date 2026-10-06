<?php

namespace Database\Factories;

use App\Enums\JobStatus;
use App\Models\RecruitmentJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RecruitmentJob> */
class RecruitmentJobFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => 'Sample '.fake()->jobTitle(),
            'department' => 'IT / MIS',
            'location' => 'Sample Location A',
            'employment_type' => 'full-time',
            'description' => 'Sample position. Not a real vacancy.',
            'status' => JobStatus::Open,
            'published_at' => now(),
            'is_sample' => true,
        ];
    }
}
