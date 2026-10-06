<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Benefits are informational. `eligibility` is HR-published wording; nothing here is calculated per employee.
 *
 * @mixin \App\Models\Benefit
 */
class BenefitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'eligibility' => $this->eligibility,
            'category' => $this->category,
            'status' => $this->status->value,
            'is_featured' => $this->is_featured,
            'faqs' => BenefitFaqResource::collection($this->whenLoaded('faqs')),
            'is_sample' => $this->is_sample,
        ];
    }
}
