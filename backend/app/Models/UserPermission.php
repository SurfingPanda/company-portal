<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One extra permission granted to one person by an administrator. */
class UserPermission extends Model
{
    protected $fillable = ['user_id', 'permission', 'granted_by'];
}
