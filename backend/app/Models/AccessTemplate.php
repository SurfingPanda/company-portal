<?php

namespace App\Models;

use App\Authorization\RolePermissions;
use Illuminate\Database\Eloquent\Model;

/** A named set of grantable permissions applied to people from the Access screen. */
class AccessTemplate extends Model
{
    protected $fillable = ['name', 'description', 'permissions'];

    protected function casts(): array
    {
        return ['permissions' => 'array'];
    }

    /** @return list<string> only what may still be granted (a template can never carry an administration power). */
    public function grantablePermissions(): array
    {
        return array_values(array_intersect($this->permissions ?? [], RolePermissions::grantable()));
    }
}
