<?php

namespace App\Policies;

use App\Models\PortalPreference;
use App\Models\User;

class PortalPreferencePolicy
{
    public function view(User $user, PortalPreference $preference): bool
    {
        return $preference->user_id === $user->getKey();
    }

    public function update(User $user, PortalPreference $preference): bool
    {
        return $this->view($user, $preference);
    }
}
