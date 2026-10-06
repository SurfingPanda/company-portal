<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The only fields an employee may change themselves (Phase 16). HR-maintained facts (employee ID, job title, department,
 * manager, status, date joined…) are not in the rules, so `validated()` can never contain them even if they are sent.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('profile.edit') === true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'preferred_name' => ['sometimes', 'nullable', 'string', 'max:80'],
            'personal_email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'mobile_number' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]{7,30}$/'],
            'avatar_url' => ['sometimes', 'nullable', 'url:https', 'max:500'],
        ];
    }
}
