<?php

namespace App\Models;

use App\Enums\AnnouncementCategory;
use App\Enums\AnnouncementPriority;
use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

    /** Status, publishing and sample flags are set by the application, not by request input. */
    protected $fillable = ['title', 'slug', 'summary', 'content', 'category', 'priority', 'is_pinned', 'expires_at'];

    protected function casts(): array
    {
        return [
            'category' => AnnouncementCategory::class,
            'priority' => AnnouncementPriority::class,
            'status' => ContentStatus::class,
            'is_pinned' => 'boolean',
            'is_sample' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }

    /** Published, already live and not expired: what an employee may see. */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('status', ContentStatus::Published->value)
            ->where('published_at', '<=', now())
            ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
