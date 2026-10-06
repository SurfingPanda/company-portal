<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\ActivityLog;
use App\Models\PortalNotification;
use App\Models\User;

/**
 * The server records activity and notifications when it processes an action (request submitted, ticket created…).
 * The browser never creates either. Call these INSIDE the caller's transaction so a failure leaves nothing half-written.
 * Notifications honour the employee's own notification preferences.
 */
final class PortalEvents
{
    /** Notification type -> the preference column that can switch it off. `system` is always delivered. */
    private const PREFERENCE = [
        'announcement' => 'notify_announcements',
        'request' => 'notify_requests',
        'event' => 'notify_events',
        'document' => 'notify_documents',
        'hr' => 'notify_hr',
        'it' => 'notify_it',
    ];

    public static function activity(User $user, string $type, string $description, ?string $entityType = null, ?int $entityId = null): ActivityLog
    {
        return $user->activityLogs()->forceCreate([
            'user_id' => $user->getKey(),
            'activity_type' => $type,
            'description' => $description,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }

    public static function notify(User $user, NotificationType $type, string $title, string $message, ?string $link = null): ?PortalNotification
    {
        $column = self::PREFERENCE[$type->value] ?? null;
        if ($column !== null && $user->preferences?->{$column} === false) {
            return null;
        }

        $notification = $user->notifications()->forceCreate([
            'user_id' => $user->getKey(),
            'type' => $type->value,
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
        EmailNotifier::instant($user, $notification);

        return $notification;
    }
}
