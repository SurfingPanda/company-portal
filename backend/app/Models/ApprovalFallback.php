<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A company-wide fallback approver (priority 1 = primary, 2 = secondary). See the migration for the rules. */
class ApprovalFallback extends Model
{
    protected $fillable = ['priority', 'approver_directory_entry_id'];

    public function approver(): BelongsTo
    {
        return $this->belongsTo(DirectoryEntry::class, 'approver_directory_entry_id');
    }
}
