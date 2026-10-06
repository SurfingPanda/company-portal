<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Models\DirectoryEntry;
use App\Models\RequestApprovalRoute;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * HR-maintained approval routing: who reviews requests filed by people in a department (optionally for one request type).
 * Portal data only. A route never grants a permission: the approver still needs an active account that holds
 * `requests.team-review`, and `can_act` in the response says whether that is currently true.
 */
class AdminApprovalRouteController extends AdminCrudController
{
    protected function model(): string
    {
        return RequestApprovalRoute::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'APPROVAL_ROUTE';
    }

    protected function query(): Builder
    {
        return RequestApprovalRoute::query()->with('department', 'requestType', 'approver.user');
    }

    protected function label(Model $model): string
    {
        return ($model->department?->name ?? 'Department').' → '.($model->approver?->display_name ?? 'approver');
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'created_at' => 'created_at'];
    }

    protected function searchColumns(): array
    {
        return [];
    }

    protected function filters(): array
    {
        return ['department_id' => ['sometimes', 'integer'], 'is_active' => ['sometimes', 'in:0,1']];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'department_id' => [$required, 'integer', Rule::exists('departments', 'id')],
            'request_type_id' => ['sometimes', 'nullable', 'integer', Rule::exists('request_types', 'id')],
            'approver_directory_entry_id' => [$required, 'integer', Rule::exists('directory_entries', 'id')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var RequestApprovalRoute $model */
        $model->fill(array_intersect_key($data, array_flip(['department_id', 'request_type_id', 'approver_directory_entry_id'])));
        if (array_key_exists('is_active', $data)) {
            $model->is_active = (bool) $data['is_active'];
        } elseif (! $model->exists) {
            $model->is_active = true;
        }

        $entry = DirectoryEntry::query()->findOrFail($model->approver_directory_entry_id);
        if ($entry->user_id === null) {
            throw ValidationException::withMessages(['approver_directory_entry_id' => ['The approver must be linked to a portal account. Link the account on the directory entry first.']]);
        }
        $duplicate = RequestApprovalRoute::query()->where('department_id', $model->department_id)->where('request_type_id', $model->request_type_id)
            ->when($model->exists, fn (Builder $q) => $q->whereKeyNot($model->getKey()))->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['request_type_id' => ['A route already exists for this department and request type. Edit it instead.']]);
        }
    }

    protected function present(Model $model): array
    {
        /** @var RequestApprovalRoute $model */
        $user = $model->approver?->user;

        return [
            'id' => $model->id, 'department_id' => $model->department_id, 'department' => $model->department?->name,
            'request_type_id' => $model->request_type_id, 'request_type' => $model->requestType?->name ?? 'All request types',
            'approver_directory_entry_id' => $model->approver_directory_entry_id, 'approver' => $model->approver?->display_name, 'approver_employee_id' => $model->approver?->employee_id,
            'is_active' => $model->is_active,
            // Whether the approver can actually review today: linked, active account holding the manager permission.
            'can_act' => $user !== null && $user->hasPermission('requests.team-review'),
            'updated_at' => $model->updated_at?->toIso8601String(),
        ];
    }
}
