<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An employee-facing leadership profile (approved name, title and short biography). No photo storage exists yet. */
class LeadershipProfile extends Model
{
    protected $fillable = ['name', 'title', 'area', 'biography', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'sort_order' => 'integer', 'is_sample' => 'boolean'];
    }

    public function directoryEntry(): BelongsTo
    {
        return $this->belongsTo(DirectoryEntry::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value)->orderBy('sort_order')->orderBy('name');
    }
}
