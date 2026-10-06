<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use App\Models\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Document METADATA management (create, edit, categorise, publish/unpublish, archive, access level). File storage for documents
 * does not exist yet, so there is no upload here; `file_type` is descriptive metadata only.
 *
 * @extends AdminCrudController
 */
class AdminDocumentController extends AdminCrudController
{
    private const FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'];

    protected function model(): string
    {
        return Document::class;
    }

    protected function module(): string
    {
        return 'documents';
    }

    protected function entity(): string
    {
        return 'DOCUMENT';
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'title' => 'title', 'published_at' => 'published_at', 'status' => 'status'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'description', 'owner'];
    }

    protected function filters(): array
    {
        return [
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'access_level' => ['sometimes', Rule::enum(DocumentAccessLevel::class)],
            'document_category_id' => ['sometimes', 'integer'],
        ];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'document_category_id' => [$required, 'integer', Rule::exists('document_categories', 'id')],
            'department' => ['sometimes', 'nullable', 'string', 'max:80'],
            'file_type' => ['sometimes', 'nullable', Rule::in(self::FILE_TYPES)],
            'version' => ['sometimes', 'nullable', 'string', 'max:20'],
            'owner' => ['sometimes', 'nullable', 'string', 'max:255'],
            'access_level' => ['sometimes', Rule::enum(DocumentAccessLevel::class)],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var Document $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'description', 'document_category_id', 'department', 'version', 'owner'])));
        if (! $model->exists) {
            $model->slug = $this->uniqueSlug($data['title']);
            $model->created_by = $request->user()->getKey();
        }
        $model->updated_by = $request->user()->getKey();
        foreach (['file_type', 'access_level', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $model->{$field} = $data[$field];
            }
        }
        if (($data['status'] ?? null) === ContentStatus::Published->value && $model->published_at === null) {
            $model->published_at = now();
        }
        $model->is_sample = $model->exists ? $model->is_sample : false;
    }

    protected function present(Model $model): array
    {
        /** @var Document $model */
        return [
            'id' => $model->id, 'title' => $model->title, 'description' => $model->description, 'document_category_id' => $model->document_category_id,
            'department' => $model->department, 'file_type' => $model->file_type, 'version' => $model->version, 'owner' => $model->owner,
            'access_level' => $model->access_level->value, 'status' => $model->status->value,
            'published_at' => $model->published_at?->toIso8601String(), 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'document';
        $slug = $base;
        for ($i = 2; Document::withTrashed()->where('slug', $slug)->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }
}
