<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Portal display/notification preferences. The record is chosen by the session, never by an id in the request. */
class UpdatePortalPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'dashboard_start_page' => ['sometimes', Rule::in(['dashboard'])],
            'resource_view' => ['sometimes', Rule::in(['cards', 'list'])],
            'remember_search_history' => ['sometimes', 'boolean'],
            'notify_announcements' => ['sometimes', 'boolean'],
            'notify_hr' => ['sometimes', 'boolean'],
            'notify_it' => ['sometimes', 'boolean'],
            'notify_requests' => ['sometimes', 'boolean'],
            'notify_events' => ['sometimes', 'boolean'],
            'notify_documents' => ['sometimes', 'boolean'],
            'email_mode' => ['sometimes', Rule::in(['instant', 'daily', 'off'])],
            'reduce_motion' => ['sometimes', 'boolean'],
            'text_size' => ['sometimes', Rule::in(['default', 'large'])],
            'high_contrast' => ['sometimes', 'boolean'],
            'theme' => ['sometimes', Rule::in(['system', 'light', 'dark'])],
        ];
    }
}
