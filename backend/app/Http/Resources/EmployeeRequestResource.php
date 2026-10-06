<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\EmployeeRequest */
class EmployeeRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_number' => $this->reference_number,
            'request_type_id' => $this->request_type_id,
            'request_type' => $this->whenLoaded('requestType', fn () => [
                'id' => $this->requestType->id,
                'code' => $this->requestType->request_code,
                'name' => $this->requestType->name,
                'category' => $this->requestType->category->value,
                'requires_approval' => $this->requestType->requires_approval,
            ]),
            // Staff reviewing someone else's request see who filed it (employee ID only); the owner already knows.
            'requester' => $this->when($request->user() !== null && $request->user()->getKey() !== $this->user_id, fn () => $this->user?->employee_id),
            'subject' => $this->subject,
            'description' => $this->description,
            'form_data' => $this->form_data ?? (object) [],
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'history' => RequestHistoryResource::collection($this->whenLoaded('history')),
            'attachments' => RequestAttachmentResource::collection($this->whenLoaded('attachments')),
            'is_sample' => $this->is_sample,
        ];
    }
}
