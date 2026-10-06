<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Who reviews requests filed by people in a department (optionally for one request type). Maintained by HR. The approver is a
 * directory entry; to act, that entry must be linked to an active portal account that holds `requests.team-review`.
 */
class RequestApprovalRoute extends Model
{
    protected $fillable = ['department_id', 'request_type_id', 'approver_directory_entry_id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(DirectoryEntry::class, 'approver_directory_entry_id');
    }
}
