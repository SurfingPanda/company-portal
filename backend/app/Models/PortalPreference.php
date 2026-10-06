<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** UI preferences for one user. No credentials, tokens or HR data. Defaults mirror the React portal's defaults. */
class PortalPreference extends Model
{
    /** Same defaults as the table and the React portal. Used by "reset to defaults". */
    public const DEFAULTS = [
        'dashboard_start_page' => 'dashboard', 'resource_view' => 'cards', 'remember_search_history' => true,
        'notify_announcements' => true, 'notify_hr' => true, 'notify_it' => true, 'notify_requests' => true, 'notify_events' => true,
        'notify_documents' => true, 'email_mode' => 'daily', 'reduce_motion' => false, 'text_size' => 'default', 'high_contrast' => false, 'theme' => 'system',
    ];

    protected $fillable = [
        'dashboard_start_page', 'resource_view', 'remember_search_history',
        'notify_announcements', 'notify_hr', 'notify_it', 'notify_requests', 'notify_events', 'notify_documents', 'email_mode',
        'reduce_motion', 'text_size', 'high_contrast', 'theme',
    ];

    protected function casts(): array
    {
        return [
            'remember_search_history' => 'boolean',
            'notify_announcements' => 'boolean',
            'notify_hr' => 'boolean',
            'notify_it' => 'boolean',
            'notify_requests' => 'boolean',
            'notify_events' => 'boolean',
            'notify_documents' => 'boolean',
            'reduce_motion' => 'boolean',
            'high_contrast' => 'boolean',
            'last_digest_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
