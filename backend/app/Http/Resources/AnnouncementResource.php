<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Announcement */
class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $manages = $user !== null && ($user->hasPermission('announcements.manage') || $user->hasPermission('announcements.hr-manage'));

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'content' => $this->content,
            'category' => $this->category->value,
            'priority' => $this->priority->value,
            'is_pinned' => $this->is_pinned,
            'published_at' => $this->published_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            // Workflow state is only meaningful to people who manage announcements.
            'status' => $this->when($manages, fn () => $this->status->value),
            'is_sample' => $this->is_sample,
        ];
    }
}
