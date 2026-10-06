<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\PolicyAudience;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A company policy employees must confirm they have read. Only PUBLISHED policies reach employees. An acknowledgement belongs to
 * one `version`: publishing a new version asks everyone in the audience again.
 */
class Policy extends Model
{
    protected $fillable = ['title', 'summary', 'body', 'effective_date', 'due_date'];

    protected function casts(): array
    {
        return [
            'status' => ContentStatus::class,
            'audience' => PolicyAudience::class,
            'effective_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'published_at' => 'datetime',
            'version_published_at' => 'datetime',
            'last_reminded_at' => 'datetime',
        ];
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'policy_department');
    }

    public function acknowledgements(): HasMany
    {
        return $this->hasMany(PolicyAcknowledgement::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value);
    }

    /** Published policies `$user` has to read (their audience includes them). */
    public function scopeFor(Builder $query, User $user): Builder
    {
        $departmentId = $user->directoryEntry?->department_id;
        $isManager = $user->hasRole(RoleName::Manager->value);

        return $query->published()->where(function (Builder $q) use ($departmentId, $isManager) {
            $q->where('audience', PolicyAudience::All->value);
            if ($isManager) {
                $q->orWhere('audience', PolicyAudience::Managers->value);
            }
            if ($departmentId !== null) {
                $q->orWhere(fn (Builder $d) => $d->where('audience', PolicyAudience::Departments->value)
                    ->whereExists(fn ($e) => $e->selectRaw('1')->from('policy_department')->whereColumn('policy_department.policy_id', 'policies.id')->where('policy_department.department_id', $departmentId)));
            }
        });
    }

    /**
     * The people who must acknowledge this policy: accounts that are active (or still waiting for their first sign-in) and in the
     * audience. Disabled and inactive accounts are not asked.
     */
    public function requiredUsers(): Builder
    {
        $query = User::query()->whereIn('status', [UserStatus::Active->value, UserStatus::Pending->value]);

        return match ($this->audience) {
            PolicyAudience::Managers => $query->whereHas('roles', fn (Builder $r) => $r->where('name', RoleName::Manager->value)),
            PolicyAudience::Departments => $query->whereHas('directoryEntry', fn (Builder $e) => $e->whereIn('department_id', $this->departments()->pluck('departments.id'))),
            default => $query,
        };
    }

    /** Restrict a users query to those who HAVE acknowledged the current version. */
    public function acknowledgedBy(Builder $users, bool $has = true): Builder
    {
        $method = $has ? 'whereExists' : 'whereNotExists';

        return $users->{$method}(fn ($q) => $q->selectRaw('1')->from('policy_acknowledgements')
            ->whereColumn('policy_acknowledgements.user_id', 'users.id')->where('policy_acknowledgements.policy_id', $this->getKey())->where('policy_acknowledgements.version', $this->version));
    }

    /** @return array{required: int, acknowledged: int, outstanding: int, percent: int} */
    public function progress(): array
    {
        $required = $this->requiredUsers()->count();
        $acknowledged = $this->acknowledgedBy($this->requiredUsers())->count();

        return ['required' => $required, 'acknowledged' => $acknowledged, 'outstanding' => $required - $acknowledged, 'percent' => $required === 0 ? 0 : (int) floor($acknowledged * 100 / $required)];
    }
}
