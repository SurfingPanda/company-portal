<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceFaq extends Model
{
    protected $fillable = ['question', 'answer', 'category', 'related_route', 'sort_order'];

    protected function casts(): array
    {
        return ['is_sample' => 'boolean'];
    }
}
