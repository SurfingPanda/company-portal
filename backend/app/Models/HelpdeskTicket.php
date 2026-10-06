<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** An employee's IT support ticket. Owned by the requester; IT staff access is granted by HelpdeskTicketPolicy. */
class HelpdeskTicket extends Model
{
    use HasFactory;

    protected $fillable = ['category', 'type', 'subject', 'description', 'location', 'device', 'operating_system', 'asset_tag', 'priority'];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(HelpdeskReply::class)->orderBy('created_at')->orderBy('id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(HelpdeskAttachment::class);
    }
}
