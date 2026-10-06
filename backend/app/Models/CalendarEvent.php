<?php

namespace App\Models;

use App\Enums\EventCategory;
use App\Enums\EventStatus;
use App\Enums\EventVisibility;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CalendarEvent extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'description', 'category', 'location', 'starts_at', 'ends_at', 'is_all_day'];

    protected function casts(): array
    {
        return [
            'category' => EventCategory::class,
            'status' => EventStatus::class,
            'visibility' => EventVisibility::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_all_day' => 'boolean',
            'is_sample' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
