<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\BenefitFaq */
class BenefitFaqResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'benefit_id' => $this->benefit_id,
            'question' => $this->question,
            'answer' => $this->answer,
            'category' => $this->category,
            'is_sample' => $this->is_sample,
        ];
    }
}
