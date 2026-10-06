<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Enums\ContentStatus;
use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Models\CompanyHistoryEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Company history milestones. Drafts stay hidden from employees until someone with `hr.company.publish` publishes them. */
class AdminHistoryController extends AdminCrudController
{
    protected function model(): string
    {
        return CompanyHistoryEntry::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'HISTORY_ENTRY';
    }

    protected function publishPermission(): ?string
    {
        return 'hr.company.publish';
    }

    protected function sorts(): array
    {
        return ['sort_order' => 'sort_order', 'year' => 'year', 'title' => 'title', 'status' => 'status'];
    }

    protected function defaultSort(): string
    {
        return 'sort_order';
    }

    protected function searchColumns(): array
    {
        return ['title', 'description', 'year'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)]];
    }

    protected function rules(?Model $model): array
    {
        return [
            'title' => [$model === null ? 'required' : 'sometimes', 'string', 'max:255'],
            'year' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$/'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var CompanyHistoryEntry $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'year', 'description', 'sort_order'])));
        if (array_key_exists('status', $data)) {
            $model->status = $data['status'];
        } elseif (! $model->exists) {
            $model->status = ContentStatus::Draft;
        }
        if (! $model->exists) {
            $model->is_sample = false;
        }
    }

    protected function present(Model $model): array
    {
        /** @var CompanyHistoryEntry $model */
        return ['id' => $model->id, 'year' => $model->year, 'title' => $model->title, 'description' => $model->description, 'sort_order' => $model->sort_order, 'status' => $model->status->value, 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample];
    }
}
