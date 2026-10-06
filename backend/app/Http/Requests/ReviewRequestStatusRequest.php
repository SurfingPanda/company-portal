<?php

namespace App\Http\Requests;

use App\Enums\RequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Staff status change. Authorisation (HR for HR requests, administrators for all) is the policy's `review` ability. */
class ReviewRequestStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Staff move a request forward; drafts, submissions and cancellations belong to the employee.
            'status' => ['required', Rule::in([RequestStatus::UnderReview->value, RequestStatus::Approved->value, RequestStatus::Rejected->value, RequestStatus::Completed->value])],
            'comment' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'internal' => ['sometimes', 'boolean'],
        ];
    }
}
