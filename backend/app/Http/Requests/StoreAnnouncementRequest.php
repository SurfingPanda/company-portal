<?php

namespace App\Http\Requests;

use App\Enums\AnnouncementCategory;
use App\Enums\AnnouncementPriority;
use App\Enums\ContentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Create or update an announcement. Used behind `permission:announcements.*` middleware, so only managers reach it. */
class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('announcements.manage') === true || $this->user()?->hasPermission('announcements.hr-manage') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'summary' => [$required, 'string', 'max:500'],
            'content' => [$required, 'string', 'max:20000'],
            'category' => ['sometimes', Rule::enum(AnnouncementCategory::class)],
            'priority' => ['sometimes', Rule::enum(AnnouncementPriority::class)],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'is_pinned' => ['sometimes', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:published_at'],
        ];
    }
}
