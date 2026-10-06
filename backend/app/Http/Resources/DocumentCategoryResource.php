<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DocumentCategory */
class DocumentCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            // Only present on the categories listing: how many documents the viewer may open in it.
            'documents_count' => $this->whenCounted('documents'),
        ];
    }
}
