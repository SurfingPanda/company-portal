<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Enums\ContentStatus;
use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Models\CompanyLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Company locations as HR approves them for display (address and contact details come from HR, never invented). */
class AdminLocationController extends AdminCrudController
{
    protected function model(): string
    {
        return CompanyLocation::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'LOCATION';
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
        return ['sort_order' => 'sort_order', 'name' => 'name', 'status' => 'status', 'updated_at' => 'updated_at'];
    }

    protected function defaultSort(): string
    {
        return 'sort_order';
    }

    protected function searchColumns(): array
    {
        return ['name', 'address', 'description'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)]];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:160', Rule::unique('company_locations', 'name')->ignore($model?->getKey())],
            'address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[0-9+()\-\s.ext]{5,40}$/i'],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'operating_info' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var CompanyLocation $model */
        $model->fill(array_intersect_key($data, array_flip(['name', 'address', 'phone', 'email', 'description', 'operating_info', 'sort_order'])));
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
        /** @var CompanyLocation $model */
        return [
            'id' => $model->id, 'name' => $model->name, 'address' => $model->address, 'phone' => $model->phone, 'email' => $model->email,
            'description' => $model->description, 'operating_info' => $model->operating_info, 'sort_order' => $model->sort_order, 'status' => $model->status->value,
            'entries_count' => $model->entries()->count(), 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }
}
