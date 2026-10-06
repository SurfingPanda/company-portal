<?php

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use App\Models\Document;
use App\Models\DocumentCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Document> */
class DocumentFactory extends Factory
{
    public function definition(): array
    {
        $title = 'Sample '.fake()->unique()->words(3, true);

        return [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'description' => 'Sample document record. No file exists.',
            'document_category_id' => DocumentCategory::query()->firstOrCreate(['slug' => 'policies'], ['name' => 'Policies & Guidelines'])->getKey(),
            'department' => 'Human Resources',
            'file_type' => 'PDF',
            'access_level' => DocumentAccessLevel::All,
            'status' => ContentStatus::Published,
            'published_at' => now(),
            'is_sample' => true,
        ];
    }
}
