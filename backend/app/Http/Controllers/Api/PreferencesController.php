<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UpdatePortalPreferencesRequest;
use App\Http\Resources\PortalPreferencesResource;
use App\Models\PortalPreference;
use Illuminate\Http\Request;

/**
 * Portal preferences of the SIGNED-IN user. There is no id in any of these URLs on purpose: the record is always
 * `$request->user()->preferences`, so one employee can never read or change another's.
 */
class PreferencesController extends ApiController
{
    public function show(Request $request): PortalPreferencesResource
    {
        return new PortalPreferencesResource($this->mine($request));
    }

    public function update(UpdatePortalPreferencesRequest $request): PortalPreferencesResource
    {
        $preferences = $this->mine($request);
        $preferences->update($request->validated());

        return new PortalPreferencesResource($preferences);
    }

    public function reset(Request $request): PortalPreferencesResource
    {
        $preferences = $this->mine($request);
        $preferences->update(PortalPreference::DEFAULTS);

        return new PortalPreferencesResource($preferences);
    }

    private function mine(Request $request): PortalPreference
    {
        return $request->user()->preferences()->firstOrCreate([])->fresh(); // fresh(): loads DB defaults and avoids a 201 "recently created" status
    }
}
