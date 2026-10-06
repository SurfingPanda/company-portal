<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentCategory extends Model
{
    protected $fillable = ['slug', 'name', 'description', 'sort_order'];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
