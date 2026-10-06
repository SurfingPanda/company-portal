<?php

namespace App\Policies;

use App\Models\JobReferral;
use App\Models\User;

class JobReferralPolicy
{
    public function view(User $user, JobReferral $referral): bool
    {
        return $referral->referring_user_id === $user->getKey() || $user->hasPermission('recruitment.manage');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('recruitment.apply');
    }
}
