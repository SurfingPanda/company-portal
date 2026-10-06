<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Attachment metadata for a ticket (or one of its replies). The storage reference is never serialised. */
class HelpdeskAttachment extends Model
{
    protected $fillable = ['original_filename', 'mime_type', 'file_size'];

    protected $hidden = ['storage_path', 'disk'];

    protected function casts(): array
    {
        return ['file_size' => 'integer'];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(HelpdeskTicket::class, 'helpdesk_ticket_id');
    }

    public function reply(): BelongsTo
    {
        return $this->belongsTo(HelpdeskReply::class, 'helpdesk_reply_id');
    }
}
