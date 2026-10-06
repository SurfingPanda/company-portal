<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The resume path is hidden on the model and never returned. No scoring or recruiter notes exist to expose. @mixin \App\Models\JobApplication */
class JobApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_number' => $this->application_number,
            'job' => $this->whenLoaded('job', fn () => ['id' => $this->job->id, 'title' => $this->job->title, 'department' => $this->job->department]),
            'job_id' => $this->job_id,
            'applicant_name' => $this->applicant_name,
            'email' => $this->email,
            'mobile' => $this->mobile,
            'cover_letter' => $this->cover_letter,
            'skills' => $this->skills,
            'experience_summary' => $this->experience_summary,
            'status' => $this->status->value,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'is_sample' => $this->is_sample,
        ];
    }
}
