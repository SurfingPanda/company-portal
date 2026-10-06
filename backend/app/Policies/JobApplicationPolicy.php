<?php

namespace App\Policies;

use App\Models\JobApplication;
use App\Models\User;

/** An application is visible to the applicant; recruitment staff (`recruitment.manage`) may also view. Other employees may not. */
class JobApplicationPolicy
{
    public function view(User $user, JobApplication $application): bool
    {
        return $application->user_id === $user->getKey() || $user->hasPermission('recruitment.manage');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('recruitment.apply');
    }
}
