<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Self-service profile fields an employee may edit. Never holds HR-maintained facts (those live on App\Models\DirectoryEntry). */
class UserProfile extends Model
{
    /** `user_id` is never fillable: the owner always comes from the authenticated session. */
    protected $fillable = ['preferred_name', 'personal_email', 'mobile_number', 'avatar_url'];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date:Y-m-d', 'share_birthday' => 'boolean', 'share_anniversary' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
