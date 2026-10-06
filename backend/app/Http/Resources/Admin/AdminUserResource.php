<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * A portal account as administrators see it. Only portal facts: no password, no hash, no remember token, no HR data
 * (name, department, title…). `display_name` is the employee's own preferred name, or built from the email.
 *
 * @mixin \App\Models\User
 */
class AdminUserResource extends JsonResource
{
    /** @var list<array<string, string>>|null */
    private ?array $history = null;

    /** @param  list<array<string, string>>  $history */
    public function withDetails(array $history): static
    {
        $this->history = $history;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'email' => $this->email,
            'display_name' => $this->profile?->preferred_name ?: Str::of(Str::before($this->email, '@'))->replaceMatches('/[._\-]+/', ' ')->title()->toString(),
            'status' => $this->status->value,
            'roles' => $this->roles->pluck('name')->values(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'is_sample' => (bool) $this->is_sample,
            // Detail view only.
            'permissions' => $this->when($this->history !== null, fn () => $this->permissions()),
            'activity' => $this->when($this->history !== null, fn () => $this->history),
        ];
    }
}
