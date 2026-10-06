<?php

namespace App\Contracts;

use App\Models\User;

/**
 * Extension point for account activation. When an administrator creates a portal account it has an UNUSABLE random password
 * and the status `pending`. A later phase binds an implementation here (for example one that sends a one-time activation or
 * password-setup link). Until then the default implementation does nothing, and an operator sets the first password with
 * `php artisan portal:set-password`. No password reset or email system is faked.
 */
interface AccountActivation
{
    public function accountCreated(User $user): void;
}
