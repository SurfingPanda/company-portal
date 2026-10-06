<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ResourceFaq */
class ResourceFaqResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'answer' => $this->answer,
            'category' => $this->category,
            'related_route' => $this->related_route,
            'is_sample' => $this->is_sample,
        ];
    }
}
