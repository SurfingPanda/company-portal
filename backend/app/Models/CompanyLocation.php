<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A company location as HR approves it for display. Addresses and contact details are entered by HR, never invented. */
class CompanyLocation extends Model
{
    protected $fillable = ['name', 'address', 'phone', 'email', 'description', 'operating_info', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'sort_order' => 'integer', 'is_sample' => 'boolean'];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DirectoryEntry::class, 'location_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value)->orderBy('sort_order')->orderBy('name');
    }
}
