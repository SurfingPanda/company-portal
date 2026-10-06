<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * The signed-in portal user (GET /api/auth/me, POST /api/auth/login). Employee facts come from the directory entry HR linked
 * to the account, and are null until HR links one. Nothing is invented, and no password, hash, token or remember token is ever included.
 *
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $official = $this->directoryEntry;
        $profile = $this->profile;

        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'email' => $this->email,
            'display_name' => $profile?->preferred_name ?: $official?->display_name ?: $this->nameFromEmail(),
            'account_status' => $this->status->value,
            'onboarding_completed' => $this->onboarded_at !== null,
            'roles' => $this->roleNames(),
            'permissions' => $this->permissions(),
            // Self-service fields (portal database).
            'profile' => [
                'preferred_name' => $profile?->preferred_name,
                'personal_email' => $profile?->personal_email,
                'mobile_number' => $profile?->mobile_number,
                'avatar_url' => $profile?->avatar_url,
                'updated_at' => $profile?->updated_at?->toIso8601String(),
            ],
            // Employment fields, maintained by HR in the portal. Null until HR links a directory entry to this account.
            'official' => [
                'source' => 'portal',
                'connected' => $official !== null,
                'full_name' => $official?->display_name,
                'job_title' => $official?->job_title,
                'department' => $official?->department?->name,
                'location' => $official?->location?->name,
                'employment_status' => $official?->employment_status,
                'employment_type' => $official?->employment_type,
                'date_joined' => $official?->date_joined?->toDateString(),
                'manager' => $official?->manager?->display_name,
            ],
            'is_sample' => (bool) $this->is_sample,
        ];
    }

    /** "arvin.leano@eljin.example" becomes "Arvin Leano": a display fallback built from the portal account's own email. */
    private function nameFromEmail(): string
    {
        return Str::of(Str::before($this->email, '@'))->replaceMatches('/[._\-]+/', ' ')->title()->toString();
    }
}
