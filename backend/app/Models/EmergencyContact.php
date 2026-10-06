<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A person to call in an emergency. Owned by the employee; `user_id` always comes from the signed-in session. */
class EmergencyContact extends Model
{
    protected $fillable = ['name', 'relationship', 'phone', 'alternate_phone', 'email', 'sort_order'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
