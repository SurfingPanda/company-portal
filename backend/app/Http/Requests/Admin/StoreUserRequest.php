<?php

namespace App\Http\Requests\Admin;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create a portal account. The administrator supplies only the employee ID, the company email, a role and a
 * status. No password is accepted (the backend creates an unusable one; see App\Contracts\AccountActivation) and no HR data
 * (name, department, salary …) is requested or stored.
 */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('users.manage') === true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
        if (is_string($this->input('employee_id'))) {
            $this->merge(['employee_id' => trim($this->input('employee_id'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'string', 'regex:/^[A-Za-z0-9][A-Za-z0-9_\-]{2,31}$/', Rule::unique('users', 'employee_id')],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::enum(RoleName::class)],
            'status' => ['required', Rule::enum(UserStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.unique' => 'A portal account already exists for this employee ID.',
            'email.unique' => 'A portal account already uses this email address.',
            'employee_id.regex' => 'Use 3 to 32 letters, numbers, hyphens or underscores.',
        ];
    }
}
