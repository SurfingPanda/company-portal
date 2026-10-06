<?php

namespace App\Models;

use App\Enums\RequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One row per status change: the data behind the request timeline. */
class RequestHistory extends Model
{
    protected $table = 'request_history';

    protected $fillable = ['status', 'comment'];

    /** Internal (staff-only) entries are hidden from the requesting employee. */
    public function scopeVisibleToEmployee($query)
    {
        return $query->where('is_internal', false);
    }

    protected function casts(): array
    {
        return ['status' => RequestStatus::class, 'is_internal' => 'boolean'];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(EmployeeRequest::class, 'employee_request_id');
    }

    /** Who made the change (null = the system). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
