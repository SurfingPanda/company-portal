<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Sign-in with an employee ID or company email. Nothing else from the body is ever read. */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /** The password is never echoed back in validation responses. */
    public function messages(): array
    {
        return ['identifier.required' => 'Enter your employee ID or company email.', 'password.required' => 'Enter your password.'];
    }
}
