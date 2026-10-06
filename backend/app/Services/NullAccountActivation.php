<?php

namespace App\Services;

use App\Contracts\AccountActivation;
use App\Models\User;

/** Default: no activation channel exists yet. See App\Contracts\AccountActivation. */
final class NullAccountActivation implements AccountActivation
{
    public function accountCreated(User $user): void {}
}
