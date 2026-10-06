<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * What an employee sees of a directory entry: business information ONLY. There is deliberately no personal email, personal
 * mobile, salary, government ID, bank, medical, performance or disciplinary field anywhere in the directory tables, and the
 * linked portal account (user id, status, roles) is never exposed here. The same shape is used for the HR "preview".
 *
 * @mixin \App\Models\DirectoryEntry
 */
class DirectoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'employee_id' => $this->employee_id,
            'display_name' => $this->display_name,
            'job_title' => $this->job_title,
            'department' => $this->department?->name,
            'location' => $this->location?->name,
            'company_email' => $this->company_email,
            'employment_status' => $this->employment_status,
            'phone' => $this->phone,
            'description' => $this->description,
        ];
    }
}
