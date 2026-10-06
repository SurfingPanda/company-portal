<?php

namespace App\Http\Requests;

use App\Enums\RequestPriority;
use App\Models\EmployeeRequest;
use App\Services\RequestFormData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Edit an owner's DRAFT (and optionally submit it). The request type cannot be changed, status is never accepted and the
 * ownership/draft rule is enforced by EmployeeRequestPolicy::update in the controller.
 */
class UpdateRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('requests.submit') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $existing = $this->user()?->requests()->with('requestType')->find((int) $this->route('requestId'));

        return [
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(RequestPriority::class)],
            'submit' => ['sometimes', 'boolean'],
            'form_data' => ['sometimes', 'nullable', 'array', 'max:60'],
            ...RequestFormData::rules($existing instanceof EmployeeRequest ? $existing->requestType : null, $this->boolean('submit')),
        ];
    }
}
