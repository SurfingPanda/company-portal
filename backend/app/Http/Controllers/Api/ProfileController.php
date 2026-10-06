<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\PortalEvents;
use Illuminate\Http\Request;

/**
 * Portal-safe profile. Only the four self-service fields can be written (see UpdateProfileRequest); everything official
 * (employee ID, job title, department, location) is maintained by HR in the directory entry and is read-only here. The response's
 * `official` block comes from the directory entry linked to the account, and is null until HR links one: nothing is invented.
 */
class ProfileController extends ApiController
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles', 'profile'));
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->profile()->updateOrCreate([], $request->validated());
        PortalEvents::activity($user, 'profile_updated', 'Updated profile details', 'profile', $user->getKey());

        return new UserResource($user->load('roles', 'profile'));
    }
}
