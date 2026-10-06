<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\RecruitmentJob */
class JobOpeningResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'department' => $this->department,
            'location' => $this->location,
            'employment_type' => $this->employment_type,
            'work_arrangement' => $this->work_arrangement,
            'summary' => $this->summary,
            'description' => $this->description,
            // One requirement per line in the database; a list for the client.
            'requirements' => array_values(array_filter(array_map('trim', explode("\n", (string) $this->requirements)))),
            'status' => $this->status->value,
            'application_enabled' => $this->application_enabled,
            'referral_enabled' => $this->referral_enabled,
            'published_at' => $this->published_at?->toIso8601String(),
            'closing_at' => $this->closing_at?->toIso8601String(),
            'is_sample' => $this->is_sample,
        ];
    }
}
