<?php

namespace App\Http\Requests;

use App\Enums\RequestPriority;
use App\Models\RequestType;
use App\Services\RequestFormData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create (and submit, unless `save_as_draft`) an employee request. Status, reference number and owner are NOT accepted from
 * the client: the server sets them. The answers in `form_data` are validated against the chosen request type's own field
 * definitions, and unknown keys are discarded.
 */
class CreateRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('requests.submit') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $type = $this->integer('request_type_id') > 0 ? RequestType::query()->where('is_active', true)->find($this->integer('request_type_id')) : null;

        return [
            'request_type_id' => ['required', 'integer', Rule::exists('request_types', 'id')->where('is_active', true)],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(RequestPriority::class)],
            'save_as_draft' => ['sometimes', 'boolean'],
            'form_data' => ['sometimes', 'nullable', 'array', 'max:60'],
            ...RequestFormData::rules($type, ! $this->boolean('save_as_draft')),
        ];
    }
}
