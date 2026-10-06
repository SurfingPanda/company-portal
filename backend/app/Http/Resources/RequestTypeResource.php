<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\RequestType */
class RequestTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->request_code,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category->value,
            'requires_attachment' => $this->requires_attachment,
            'requires_approval' => $this->requires_approval,
            'is_active' => $this->is_active,
            'fields' => $this->fields ?? [],
            'is_sample' => $this->is_sample,
        ];
    }
}
