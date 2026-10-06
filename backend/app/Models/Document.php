<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Document METADATA. The file itself is not in the database; `storage_path` is only a reference for a future private disk
 * and is never exposed in API responses.
 */
class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'slug', 'description', 'document_category_id', 'department', 'version', 'owner'];

    /** Internal storage details are not serialised. */
    protected $hidden = ['storage_disk', 'storage_path'];

    protected function casts(): array
    {
        return [
            'access_level' => DocumentAccessLevel::class,
            'status' => ContentStatus::class,
            'published_at' => 'datetime',
            'file_size' => 'integer',
            'is_sample' => 'boolean',
        ];
    }

    /**
     * The documents `$user` may see. SQL twin of App\Policies\DocumentPolicy::view (a test keeps the two in step), used so
     * list endpoints never load, count or paginate documents the user cannot open.
     */
    public function scopeAccessibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasPermission('documents.manage') || $user->hasPermission('documents.hr-manage') || $user->hasPermission('documents.it-manage')) {
            return $query;
        }
        if (! $user->hasPermission('documents.view')) {
            return $query->whereRaw('1 = 0');
        }
        $department = $user->directoryEntry?->department?->name;

        return $query->where('status', ContentStatus::Published->value)->where(function (Builder $q) use ($user, $department) {
            $q->where('access_level', DocumentAccessLevel::All->value);
            if ($department !== null) {
                $q->orWhere(fn (Builder $d) => $d->where('access_level', DocumentAccessLevel::Department->value)->whereNotNull('department')->whereRaw('lower(department) = ?', [strtolower($department)]));
            }
            if ($user->hasRole('manager', 'admin')) {
                $q->orWhere('access_level', DocumentAccessLevel::Manager->value);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class, 'document_category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
