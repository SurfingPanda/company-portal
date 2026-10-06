<?php

namespace App\Services;

use App\Models\EmergencyContact;
use App\Models\User;

/** Reads the personal details and emergency contacts of one employee in the one shape the API returns them in. */
final class PersonalInfo
{
    public const CIVIL_STATUSES = ['single', 'married', 'widowed', 'separated', 'divorced'];

    public const MAX_CONTACTS = 5;

    /** @return array<string, mixed> */
    public static function for(User $user): array
    {
        $profile = $user->profile;

        return [
            'date_of_birth' => $profile?->date_of_birth?->toDateString(),
            'civil_status' => $profile?->civil_status,
            'share_birthday' => (bool) ($profile?->share_birthday ?? false),
            'share_anniversary' => (bool) ($profile?->share_anniversary ?? true),
            'address_line' => $profile?->address_line,
            'city' => $profile?->city,
            'province' => $profile?->province,
            'postal_code' => $profile?->postal_code,
            'emergency_contacts' => $user->emergencyContacts()->get()->map(fn (EmergencyContact $c) => [
                'name' => $c->name, 'relationship' => $c->relationship, 'phone' => $c->phone, 'alternate_phone' => $c->alternate_phone, 'email' => $c->email,
            ])->values()->all(),
        ];
    }
}
