<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The employee's own activity feed entry. There is no IP address, user agent or audit detail in this table to leak.
 *
 * @mixin \App\Models\ActivityLog
 */
class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->activity_type,
            'description' => $this->description,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
