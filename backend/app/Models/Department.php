<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A PORTAL department: the label shown in the directory, filters and company pages. Whether an employee belongs to it is
 * maintained by HR in the directory; the portal never moves employees between departments and never cascades a department change into them.
 */
class Department extends Model
{
    protected $fillable = ['code', 'name', 'description', 'contact_email', 'head_display', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'sort_order' => 'integer', 'is_sample' => 'boolean'];
    }

    /** The department head chosen by HR (a directory entry). Display and routing only; not an official reporting line. */
    public function headEntry(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(DirectoryEntry::class, 'head_directory_entry_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DirectoryEntry::class);
    }

    /** Published departments, in display order: the only ones employees see. */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value)->orderBy('sort_order')->orderBy('name');
    }
}
