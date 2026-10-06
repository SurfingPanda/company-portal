<?php

namespace App\Models;

use App\Authorization\RolePermissions;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * A PORTAL account: authentication and authorization only. Everything about the employee as a person or worker
 * (name, job title, department, pay, leave, attendance …) lives in the HR directory entry (App\Models\DirectoryEntry)
 * using `employee_id`. Deliberately does not use Laravel's Notifiable trait: portal notifications are PortalNotification.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    /** Mass assignment is limited: status, roles and sample flags are never set from request input. */
    protected $fillable = ['email'];

    /** Never serialised into API responses. */
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'status' => UserStatus::class,
            'last_login_at' => 'datetime',
            'onboarded_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    // --- Relationships ------------------------------------------------------------------------------------------------

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function requests(): HasMany
    {
        return $this->hasMany(EmployeeRequest::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(PortalNotification::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function helpdeskTickets(): HasMany
    {
        return $this->hasMany(HelpdeskTicket::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(JobReferral::class, 'referring_user_id');
    }

    public function preferences(): HasOne
    {
        return $this->hasOne(PortalPreference::class);
    }

    /** The directory display record linked to this account (if HR linked one). Source of the portal's department routing. */
    public function directoryEntry(): HasOne
    {
        return $this->hasOne(DirectoryEntry::class);
    }

    /** People to call in an emergency, in the order to call them. Entered by the employee. */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class)->orderBy('sort_order')->orderBy('id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /** Active accounts whose roles hold a permission (for notifying a team, e.g. everyone who reviews IT requests). */
    public function scopeHoldingPermission(Builder $query, string $permission): Builder
    {
        return $query->where('status', UserStatus::Active->value)->where(fn (Builder $q) => $q
            ->whereHas('roles', fn (Builder $r) => $r->whereIn('name', RolePermissions::rolesWith($permission)))
            ->orWhereHas('grantedPermissions', fn (Builder $g) => $g->where('permission', $permission)));
    }

    // --- Identity -----------------------------------------------------------------------------------------------------

    /** Matches the sign-in "Employee ID or company email" field. Case-insensitive. */
    public function scopeWithIdentifier(Builder $query, string $identifier): Builder
    {
        $identifier = trim($identifier);

        return $query->where(fn (Builder $q) => $q->where('employee_id', $identifier)->orWhere('email', strtolower($identifier)));
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    // --- Authorization --------------------------------------------------------------------------------------------------

    /** @return list<string> role names */
    public function roleNames(): array
    {
        return $this->roles->pluck('name')->all();
    }

    public function hasRole(string ...$roles): bool
    {
        return count(array_intersect($roles, $this->roleNames())) > 0;
    }

    /** Extra permissions an administrator granted this person (see the access screen). */
    public function grantedPermissions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserPermission::class);
    }

    /** @return list<string> permissions granted individually, limited to what may be granted at all. */
    public function grantedPermissionNames(): array
    {
        return array_values(array_intersect($this->grantedPermissions->pluck('permission')->all(), RolePermissions::grantable()));
    }

    /** @return list<string> what the roles give, plus anything granted to this person individually. */
    public function permissions(): array
    {
        return array_values(array_unique([...RolePermissions::forRoles($this->roleNames()), ...$this->grantedPermissionNames()]));
    }

    /** Inactive/suspended accounts hold no permissions, whatever their roles say. */
    public function hasPermission(string $permission): bool
    {
        return $this->isActive() && in_array($permission, $this->permissions(), true);
    }
}
