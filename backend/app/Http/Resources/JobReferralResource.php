<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\JobReferral */
class JobReferralResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referral_number' => $this->referral_number,
            'job' => $this->whenLoaded('job', fn () => ['id' => $this->job->id, 'title' => $this->job->title, 'department' => $this->job->department]),
            'job_id' => $this->job_id,
            'referred_name' => $this->referred_name,
            'referred_email' => $this->referred_email,
            'referred_mobile' => $this->referred_mobile,
            'relationship' => $this->relationship,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'is_sample' => $this->is_sample,
        ];
    }
}
