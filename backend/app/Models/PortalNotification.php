<?php

namespace App\Models;

use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A portal notification, owned by one user. Table name is `notifications`. Not Laravel's DatabaseNotification. */
class PortalNotification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = ['type', 'title', 'message', 'link'];

    protected function casts(): array
    {
        return [
            'type' => NotificationType::class,
            'read_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOwnedBy(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->getKey());
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    public function markAsRead(): void
    {
        if ($this->read_at === null) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
}
