<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Document metadata. The storage disk and path are never exposed, and there is no file URL: files are not stored yet.
 *
 * @mixin \App\Models\Document
 */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->whenLoaded('category', fn () => new DocumentCategoryResource($this->category)),
            'department' => $this->department,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'version' => $this->version,
            'owner' => $this->owner,
            'access_level' => $this->access_level->value,
            'published_at' => $this->published_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'file_available' => false,
            'is_sample' => $this->is_sample,
        ];
    }
}
