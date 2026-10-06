<?php

namespace App\Http\Requests;

use App\Enums\EventCategory;
use App\Enums\EventStatus;
use App\Enums\EventVisibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Create or update a calendar event (no recurrence engine). Only `calendar.manage` holders pass authorize(). */
class StoreCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('calendar.manage') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'category' => ['sometimes', Rule::enum(EventCategory::class)],
            'status' => ['sometimes', Rule::enum(EventStatus::class)],
            'visibility' => ['sometimes', Rule::enum(EventVisibility::class)],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'starts_at' => [$required, 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
            'is_all_day' => ['sometimes', 'boolean'],
        ];
    }
}
