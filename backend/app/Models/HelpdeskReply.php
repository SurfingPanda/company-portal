<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HelpdeskReply extends Model
{
    protected $fillable = ['message'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(HelpdeskTicket::class, 'helpdesk_ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
