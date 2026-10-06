<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\DocumentCategory;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Document categories (small lookup list). Categories are not deleted: documents refer to them. */
class AdminDocumentCategoryController extends ApiController
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => DocumentCategory::query()->withCount('documents')->orderBy('sort_order')->orderBy('name')->get()
            ->map(fn (DocumentCategory $c) => ['id' => $c->id, 'slug' => $c->slug, 'name' => $c->name, 'description' => $c->description, 'sort_order' => $c->sort_order, 'documents_count' => $c->documents_count])]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'regex:/^[a-z][a-z0-9\-]{1,59}$/', Rule::unique('document_categories', 'slug')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
        ]);
        $category = DocumentCategory::query()->create($data);
        Audit::record($request->user(), 'DOCUMENT_CATEGORY_CREATED', 'documents', $category, $category->name);

        return response()->json(['data' => ['id' => $category->id, 'slug' => $category->slug, 'name' => $category->name]], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = DocumentCategory::query()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
        ]);
        $category->update($data);
        Audit::record($request->user(), 'DOCUMENT_CATEGORY_UPDATED', 'documents', $category, $category->name);

        return response()->json(['data' => ['id' => $category->id, 'slug' => $category->slug, 'name' => $category->name]]);
    }
}
