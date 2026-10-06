<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** One company history milestone. HR supplies approved wording and dates; nothing here is invented. */
class CompanyHistoryEntry extends Model
{
    protected $fillable = ['year', 'title', 'description', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'sort_order' => 'integer', 'is_sample' => 'boolean'];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value)->orderBy('sort_order')->orderBy('year')->orderBy('id');
    }
}
