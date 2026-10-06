<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Lightweight activity feed entry. Not an audit trail. Never put sensitive data in `description`. */
class ActivityLog extends Model
{
    /** Only `created_at` exists. */
    public const UPDATED_AT = null;

    protected $fillable = ['activity_type', 'description', 'entity_type', 'entity_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
