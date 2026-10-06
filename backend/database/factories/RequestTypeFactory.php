<?php

namespace Database\Factories;

use App\Enums\RequestCategory;
use App\Models\RequestType;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RequestType> */
class RequestTypeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'request_code' => 'rt-'.fake()->unique()->slug(2),
            'name' => 'Sample '.fake()->words(2, true).' request',
            'description' => 'Sample request type for development.',
            'category' => RequestCategory::Hr,
            'requires_attachment' => false,
            'requires_approval' => false,
            'is_active' => true,
            'is_sample' => true,
        ];
    }
}
