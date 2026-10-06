<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One timeline entry. The actor is shown as "You", "System" or "Portal staff", never as an account, so no personal data
 * about staff is exposed to the requester.
 *
 * @mixin \App\Models\RequestHistory
 */
class RequestHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'comment' => $this->comment,
            'actor' => match (true) {
                $this->user_id === null => 'System',
                $this->user_id === $request->user()?->getKey() => 'You',
                default => 'Portal staff',
            },
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
