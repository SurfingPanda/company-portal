<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HelpdeskTicket */
class HelpdeskTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'requester' => $this->when($request->user() !== null && $request->user()->getKey() !== $this->user_id, fn () => $this->user?->employee_id),
            'assigned_to' => $this->when($request->user()?->hasPermission('helpdesk.manage'), fn () => $this->assignee?->employee_id),
            'category' => $this->category,
            'type' => $this->type,
            'subject' => $this->subject,
            'description' => $this->description,
            'location' => $this->location,
            'device' => $this->device,
            'operating_system' => $this->operating_system,
            'asset_tag' => $this->asset_tag,
            'priority' => $this->priority->value,
            'status' => $this->status->value,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'replies' => $this->whenLoaded('replies', fn () => $this->replies->map(fn ($reply) => [
                'id' => $reply->id,
                // "You" for the viewer's own replies; staff are not identified by account.
                'author' => $reply->user_id === $request->user()?->getKey() ? 'You' : 'IT support',
                'message' => $reply->message,
                'created_at' => $reply->created_at->toIso8601String(),
            ])->values()),
            'attachments' => RequestAttachmentResource::collection($this->whenLoaded('attachments')),
            'is_sample' => $this->is_sample,
        ];
    }
}
