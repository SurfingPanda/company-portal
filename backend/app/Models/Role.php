<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A system role (employee, manager, hr, it, admin). Not a job title. Assigned server-side only. */
class Role extends Model
{
    protected $fillable = ['name', 'label'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')->withTimestamps();
    }
}
