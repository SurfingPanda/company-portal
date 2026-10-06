<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Refer someone for a job. The referring employee is always the signed-in user. */
class CreateJobReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('recruitment.apply') === true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'referred_name' => ['required', 'string', 'max:255'],
            'referred_email' => ['required', 'email:rfc', 'max:255'],
            'referred_mobile' => ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[0-9+()\-\s]{7,40}$/'],
            'relationship' => ['sometimes', 'nullable', 'string', 'max:60'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
