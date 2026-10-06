<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PortalPreference */
class PortalPreferencesResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'dashboard_start_page' => $this->dashboard_start_page,
            'resource_view' => $this->resource_view,
            'remember_search_history' => $this->remember_search_history,
            'notify_announcements' => $this->notify_announcements,
            'notify_hr' => $this->notify_hr,
            'notify_it' => $this->notify_it,
            'notify_requests' => $this->notify_requests,
            'notify_events' => $this->notify_events,
            'notify_documents' => $this->notify_documents,
            'email_mode' => $this->email_mode,
            'reduce_motion' => $this->reduce_motion,
            'text_size' => $this->text_size,
            'high_contrast' => $this->high_contrast,
            'theme' => $this->theme,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
