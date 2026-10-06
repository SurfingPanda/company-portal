<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContentStatus;
use App\Enums\ResourceType;
use App\Models\Resource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Resource Center entries. They point at a document, form, benefit, service key or a portal path/https address. */
class AdminResourceController extends AdminCrudController
{
    protected function model(): string
    {
        return Resource::class;
    }

    protected function module(): string
    {
        return 'resources';
    }

    protected function entity(): string
    {
        return 'RESOURCE';
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'title' => 'title', 'category' => 'category'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'description'];
    }

    protected function filters(): array
    {
        return [
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'category' => ['sometimes', 'string', 'max:30'],
            'resource_type' => ['sometimes', Rule::enum(ResourceType::class)],
        ];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => ['sometimes', 'string', 'regex:/^[a-z][a-z\-]{1,29}$/'],
            'resource_type' => ['sometimes', Rule::enum(ResourceType::class)],
            // An in-portal path ("/resources/hr") or an https address. No other scheme (no javascript:, data:, http:).
            'target_url' => ['sometimes', 'nullable', 'string', 'max:500', 'regex:/^(\/(?!\/)[A-Za-z0-9\/_\-.?=&%#]*|https:\/\/[^\s<>"\']+)$/'],
            'document_id' => ['sometimes', 'nullable', 'integer', Rule::exists('documents', 'id')],
            'form_id' => ['sometimes', 'nullable', 'integer', Rule::exists('employee_forms', 'id')],
            'benefit_id' => ['sometimes', 'nullable', 'integer', Rule::exists('benefits', 'id')],
            'service_key' => ['sometimes', 'nullable', 'string', 'max:60'],
            'is_featured' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var Resource $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'description', 'category', 'target_url', 'document_id', 'form_id', 'service_key', 'benefit_id', 'is_featured'])));
        foreach (['resource_type', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $model->{$field} = $data[$field];
            }
        }
        if (! $model->exists) {
            $model->is_sample = false;
        }
    }

    protected function present(Model $model): array
    {
        /** @var Resource $model */
        return [
            'id' => $model->id, 'title' => $model->title, 'description' => $model->description, 'category' => $model->category, 'resource_type' => $model->resource_type->value,
            'target_url' => $model->target_url, 'document_id' => $model->document_id, 'form_id' => $model->form_id, 'benefit_id' => $model->benefit_id,
            'service_key' => $model->service_key, 'is_featured' => $model->is_featured, 'status' => $model->status->value,
            'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }
}
