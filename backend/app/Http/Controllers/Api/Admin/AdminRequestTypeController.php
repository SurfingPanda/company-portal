<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\RequestCategory;
use App\Models\RequestType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Request type management (name, category, availability and the dynamic field definitions). Request types are never deleted
 * (requests refer to them): they are deactivated. Field definitions are validated structurally, so a malformed or oversized
 * definition cannot be stored.
 */
class AdminRequestTypeController extends AdminCrudController
{
    private const FIELD_TYPES = ['text', 'textarea', 'select', 'date', 'time', 'number', 'file', 'checkbox', 'email'];

    protected function model(): string
    {
        return RequestType::class;
    }

    protected function module(): string
    {
        return 'requests';
    }

    protected function entity(): string
    {
        return 'REQUEST_TYPE';
    }

    protected function label(Model $model): string
    {
        return $model->name;
    }

    protected function sorts(): array
    {
        return ['name' => 'name', 'category' => 'category', 'updated_at' => 'updated_at'];
    }

    protected function defaultSort(): string
    {
        return 'name';
    }

    protected function searchColumns(): array
    {
        return ['name', 'request_code', 'description'];
    }

    protected function filters(): array
    {
        return ['category' => ['sometimes', Rule::enum(RequestCategory::class)], 'is_active' => ['sometimes', 'in:0,1']];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'request_code' => $model === null ? ['required', 'string', 'regex:/^[a-z0-9][a-z0-9\-]{2,38}$/', Rule::unique('request_types', 'request_code')] : ['prohibited'],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => ['sometimes', Rule::enum(RequestCategory::class)],
            'reference_prefix' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Z]{2,8}$/'],
            'requires_attachment' => ['sometimes', 'boolean'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'fields' => ['sometimes', 'nullable', 'array', 'max:40'],
            'fields.*.id' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{1,60}$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:120'],
            'fields.*.type' => ['required', Rule::in(self::FIELD_TYPES)],
            'fields.*.required' => ['sometimes', 'boolean'],
            'fields.*.options' => ['sometimes', 'array', 'max:50'],
            'fields.*.options.*' => ['string', 'max:120'],
            'fields.*.min' => ['sometimes', 'numeric'],
            'fields.*.placeholder' => ['sometimes', 'nullable', 'string', 'max:200'],
            'fields.*.helpText' => ['sometimes', 'nullable', 'string', 'max:300'],
            'fields.*.notBeforeField' => ['sometimes', 'nullable', 'string', 'max:60'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var RequestType $model */
        $model->fill(array_intersect_key($data, array_flip(['name', 'description', 'category', 'reference_prefix', 'requires_attachment', 'requires_approval', 'is_active', 'fields'])));
        if (! $model->exists) {
            $model->request_code = $data['request_code'];
            $model->is_sample = false;
        }
    }

    protected function present(Model $model): array
    {
        /** @var RequestType $model */
        return [
            'id' => $model->id, 'request_code' => $model->request_code, 'name' => $model->name, 'description' => $model->description, 'category' => $model->category->value,
            'reference_prefix' => $model->reference_prefix, 'requires_attachment' => $model->requires_attachment, 'requires_approval' => $model->requires_approval,
            'is_active' => $model->is_active, 'fields' => $model->fields ?? [], 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }

    /** Request types are history-bearing: deactivate instead of deleting. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        abort(405);
    }
}
