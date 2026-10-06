<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One portal-level setting (key/value). Only keys listed in App\Services\PortalSettings may be stored. */
class AdminSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];
}
