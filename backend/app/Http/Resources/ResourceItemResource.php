<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * A portal resource points at the entity it is about (document, form, benefit or service key). It never copies their
 * content, and a document the viewer cannot open is not referenced.
 *
 * @mixin \App\Models\Resource
 */
class ResourceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $document = $this->document;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'resource_type' => $this->resource_type->value,
            'target_url' => $this->target_url,
            'document_id' => $document !== null && Gate::allows('view', $document) ? $document->id : null,
            'form_id' => $this->form_id,
            'benefit_id' => $this->benefit_id,
            'service_key' => $this->service_key,
            'is_featured' => $this->is_featured,
            'is_sample' => $this->is_sample,
        ];
    }
}
