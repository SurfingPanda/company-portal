<?php

namespace App\Policies;

use App\Models\PortalNotification;
use App\Models\User;

/** A notification is private to its owner. Nobody else (including administrators) reads or changes it. */
class PortalNotificationPolicy
{
    public function view(User $user, PortalNotification $notification): bool
    {
        return $notification->user_id === $user->getKey();
    }

    public function update(User $user, PortalNotification $notification): bool
    {
        return $this->view($user, $notification);
    }

    public function delete(User $user, PortalNotification $notification): bool
    {
        return $this->view($user, $notification);
    }
}
