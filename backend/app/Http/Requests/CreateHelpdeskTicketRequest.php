<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** New IT ticket. Number, status, requester and assignee are server-controlled and never accepted from the client. */
class CreateHelpdeskTicketRequest extends FormRequest
{
    public const TYPES = ['incident', 'service-request', 'access-request', 'question', 'other'];

    public const CATEGORIES = ['hardware', 'software', 'network', 'account', 'email', 'printer', 'security', 'other'];

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('helpdesk.create') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(self::TYPES)],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(TicketPriority::class)],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'device' => ['sometimes', 'nullable', 'string', 'max:255'],
            'operating_system' => ['sometimes', 'nullable', 'string', 'max:255'],
            'asset_tag' => ['sometimes', 'nullable', 'string', 'max:60'],
        ];
    }
}
