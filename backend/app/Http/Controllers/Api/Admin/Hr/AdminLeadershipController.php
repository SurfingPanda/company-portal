<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Enums\ContentStatus;
use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Models\LeadershipProfile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Leadership profiles with approved names, titles and biographies. A profile may reference a directory entry (display only);
 * the official title and name remain whatever HR approves here, never inferred. No photo upload exists yet.
 */
class AdminLeadershipController extends AdminCrudController
{
    protected function model(): string
    {
        return LeadershipProfile::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'LEADERSHIP';
    }

    protected function label(Model $model): string
    {
        return $model->name;
    }

    protected function publishPermission(): ?string
    {
        return 'hr.company.publish';
    }

    protected function sorts(): array
    {
        return ['sort_order' => 'sort_order', 'name' => 'name', 'status' => 'status'];
    }

    protected function defaultSort(): string
    {
        return 'sort_order';
    }

    protected function searchColumns(): array
    {
        return ['name', 'title', 'area'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)]];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:160'],
            'title' => [$required, 'string', 'max:160'],
            'area' => ['sometimes', 'nullable', 'string', 'max:120'],
            'biography' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'directory_entry_id' => ['sometimes', 'nullable', 'integer', Rule::exists('directory_entries', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var LeadershipProfile $model */
        $model->fill(array_intersect_key($data, array_flip(['name', 'title', 'area', 'biography', 'sort_order'])));
        if (array_key_exists('directory_entry_id', $data)) {
            $model->directory_entry_id = $data['directory_entry_id'];
        }
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
        /** @var LeadershipProfile $model */
        return ['id' => $model->id, 'name' => $model->name, 'title' => $model->title, 'area' => $model->area, 'biography' => $model->biography, 'directory_entry_id' => $model->directory_entry_id, 'sort_order' => $model->sort_order, 'status' => $model->status->value, 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample];
    }
}
