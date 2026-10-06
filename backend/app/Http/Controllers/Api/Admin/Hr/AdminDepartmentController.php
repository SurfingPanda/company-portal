<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Enums\ContentStatus;
use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Models\Department;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Portal department labels. Archiving a department is the safe way to retire it (employees keep their directory entries and
 * history); deleting is refused while any directory entry still points at it. Employee membership is HR data and is never
 * changed from here.
 */
class AdminDepartmentController extends AdminCrudController
{
    protected function model(): string
    {
        return Department::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'DEPARTMENT';
    }

    protected function label(Model $model): string
    {
        return $model->name;
    }

    protected function sorts(): array
    {
        return ['sort_order' => 'sort_order', 'name' => 'name', 'status' => 'status', 'updated_at' => 'updated_at'];
    }

    protected function defaultSort(): string
    {
        return 'sort_order';
    }

    protected function searchColumns(): array
    {
        return ['name', 'code', 'description'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)]];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:120', Rule::unique('departments', 'name')->ignore($model?->getKey())],
            'code' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Za-z0-9\-]{1,20}$/', Rule::unique('departments', 'code')->ignore($model?->getKey())],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'contact_email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'head_display' => ['sometimes', 'nullable', 'string', 'max:120'],
            'head_directory_entry_id' => ['sometimes', 'nullable', 'integer', Rule::exists('directory_entries', 'id')],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var Department $model */
        $model->fill(array_intersect_key($data, array_flip(['name', 'code', 'description', 'contact_email', 'head_display', 'sort_order'])));
        if (array_key_exists('head_directory_entry_id', $data)) {
            $model->head_directory_entry_id = $data['head_directory_entry_id'];
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

    protected function guardDelete(Model $model): void
    {
        abort_if($model->entries()->exists(), 409);
    }

    protected function present(Model $model): array
    {
        /** @var Department $model */
        return [
            'id' => $model->id, 'code' => $model->code, 'name' => $model->name, 'description' => $model->description, 'contact_email' => $model->contact_email,
            'head_display' => $model->head_display, 'head_directory_entry_id' => $model->head_directory_entry_id, 'head' => $model->headEntry?->display_name ?? $model->head_display, 'sort_order' => $model->sort_order, 'status' => $model->status->value,
            'entries_count' => $model->entries()->count(), 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }
}
