<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CalendarEvent */
class CalendarEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category->value,
            'status' => $this->status->value,
            'visibility' => $this->visibility->value,
            'location' => $this->location,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'is_all_day' => $this->is_all_day,
            'is_sample' => $this->is_sample,
        ];
    }
}
