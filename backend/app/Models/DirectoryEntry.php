<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An employee record, keyed by employee ID and maintained by HR directly in the portal (the portal is the system of
 * record; there is no external HR system). `source` is always `manual`; `verification` is a legacy column no longer used.
 * Hiding an entry (is_visible = false) never touches the linked portal account.
 */
class DirectoryEntry extends Model
{
    public const MANUAL = 'manual';

    /** Portal-managed on every entry. `employee_id`, `source`, `verification`, `official_name`, `user_id`, `is_visible` are set explicitly. */
    protected $fillable = ['display_name', 'job_title', 'department_id', 'location_id', 'company_email', 'phone', 'description', 'employment_status', 'employment_type', 'date_joined'];

    protected function casts(): array
    {
        return ['is_visible' => 'boolean', 'is_sample' => 'boolean', 'date_joined' => 'date:Y-m-d'];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(CompanyLocation::class, 'location_id');
    }

    /** The employee's manager (another employee record). Informational; approval routing is configured separately. */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Entries employees may see. Hidden entries never appear in any employee-facing response. */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('is_visible', true);
    }
}
