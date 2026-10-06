<?php

namespace App\Http\Controllers\Api;

use App\Services\PersonalInfo;
use App\Services\PortalEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * The employee's own personal details and emergency contacts. Only the signed-in person can read or change their own: there is no
 * id in the path. `emergency_contacts`, when sent, REPLACES the whole list (up to five, in the order to call).
 */
class PersonalInfoController extends ApiController
{
    private const PHONE = ['regex:/^[0-9+()\-\s.]{5,30}$/'];

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => PersonalInfo::for($request->user()->load('profile'))]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_of_birth' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before:today', 'after:1900-01-01'],
            'civil_status' => ['sometimes', 'nullable', Rule::in(PersonalInfo::CIVIL_STATUSES)],
            'share_birthday' => ['sometimes', 'boolean'],
            'share_anniversary' => ['sometimes', 'boolean'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'province' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9\- ]{2,20}$/'],
            'emergency_contacts' => ['sometimes', 'array', 'max:'.PersonalInfo::MAX_CONTACTS],
            'emergency_contacts.*.name' => ['required', 'string', 'max:120'],
            'emergency_contacts.*.relationship' => ['required', 'string', 'max:60'],
            'emergency_contacts.*.phone' => ['required', 'string', ...self::PHONE],
            'emergency_contacts.*.alternate_phone' => ['nullable', 'string', ...self::PHONE],
            'emergency_contacts.*.email' => ['nullable', 'email:rfc', 'max:255'],
        ], [
            'date_of_birth.date_format' => 'Enter the date as year-month-day.',
            'emergency_contacts.*.phone.regex' => 'Enter a phone number with digits, spaces and + ( ) - . only.',
            'emergency_contacts.*.alternate_phone.regex' => 'Enter a phone number with digits, spaces and + ( ) - . only.',
        ]);

        $user = $request->user();
        DB::transaction(function () use ($user, $data) {
            $details = array_intersect_key($data, array_flip(['date_of_birth', 'civil_status', 'share_birthday', 'share_anniversary', 'address_line', 'city', 'province', 'postal_code']));
            if ($details !== []) {
                $profile = $user->profile()->firstOrNew();
                $profile->forceFill($details)->save();
            }
            if (array_key_exists('emergency_contacts', $data)) {
                $user->emergencyContacts()->delete();
                foreach (array_values($data['emergency_contacts']) as $i => $contact) {
                    $user->emergencyContacts()->create([...$contact, 'sort_order' => $i]);
                }
            }
            PortalEvents::activity($user, 'personal_info_updated', 'Updated personal details and emergency contacts', 'profile', $user->getKey());
        });

        return response()->json(['data' => PersonalInfo::for($user->unsetRelation('profile')->load('profile'))]);
    }
}
