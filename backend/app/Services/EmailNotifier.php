<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\PortalNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * The email side of a portal notification. Called for every notification the portal creates (PortalEvents::notify): the person
 * gets an email at once only if they chose "instant". "Daily" waits for the morning summary and "off" sends nothing. Disabled
 * accounts and addresses that can never receive mail (MailGuard) are skipped. A failed send is logged, never allowed to break
 * the action that created the notification.
 */
final class EmailNotifier
{
    public static function instant(User $user, PortalNotification $notification): void
    {
        if (($user->preferences?->email_mode ?? 'daily') !== 'instant' || ! $user->isActive() || ! MailGuard::deliverable($user->email)) {
            return;
        }

        $send = function () use ($user, $notification) {
            try {
                Mail::to($user->email)->send(new NotificationMail($notification));
            } catch (\Throwable $e) {
                Log::warning('Notification email failed', ['employee_id' => $user->employee_id, 'error' => $e->getMessage()]);
            }
        };
        // In a web request the email goes out after the response, so the person using the portal never waits for the mail server.
        app()->runningInConsole() ? $send() : defer($send);
    }
}
