<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContentStatus;
use App\Enums\FormCategory;
use App\Enums\FormType;
use App\Models\EmployeeForm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Forms catalogue management. A form links to a document or a request type by id; it never copies their content. */
class AdminFormController extends AdminCrudController
{
    protected function model(): string
    {
        return EmployeeForm::class;
    }

    protected function module(): string
    {
        return 'forms';
    }

    protected function entity(): string
    {
        return 'FORM';
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'title' => 'title', 'status' => 'status'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'description'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)], 'category' => ['sometimes', Rule::enum(FormCategory::class)]];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => ['sometimes', Rule::enum(FormCategory::class)],
            'form_type' => ['sometimes', Rule::enum(FormType::class)],
            'document_id' => ['sometimes', 'nullable', 'integer', Rule::exists('documents', 'id')],
            'request_type_id' => ['sometimes', 'nullable', 'integer', Rule::exists('request_types', 'id')],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'instructions' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var EmployeeForm $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'description', 'category', 'form_type', 'document_id', 'request_type_id', 'instructions'])));
        if (array_key_exists('status', $data)) {
            $model->status = $data['status'];
        }
        if (! $model->exists) {
            $model->created_by = $request->user()->getKey();
            $model->is_sample = false;
        }
        $model->updated_by = $request->user()->getKey();
    }

    protected function present(Model $model): array
    {
        /** @var EmployeeForm $model */
        return [
            'id' => $model->id, 'title' => $model->title, 'description' => $model->description, 'category' => $model->category->value,
            'form_type' => $model->form_type->value, 'document_id' => $model->document_id, 'request_type_id' => $model->request_type_id,
            'status' => $model->status->value, 'instructions' => $model->instructions, 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }
}
