<?php

namespace App\Http\Controllers\Api\Admin;

use App\Authorization\RolePermissions;
use App\Http\Controllers\Api\ApiController;
use App\Models\AccessTemplate;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Reusable access templates (`users.manage`). Only grantable permissions can be put in one. Changing a template does not change anyone's saved access. */
class AccessTemplateController extends ApiController
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => AccessTemplate::query()->orderBy('name')->get()->map(fn (AccessTemplate $t) => $this->present($t)),
            'catalog' => RolePermissions::grantableCatalog(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $template = AccessTemplate::query()->create($this->validated($request));
        Audit::record($request->user(), 'ACCESS_TEMPLATE_CREATED', 'users', $template, $template->name, 'success', ['permissions' => $template->permissions]);

        return response()->json(['data' => $this->present($template)], 201);
    }

    public function update(Request $request, int $template): JsonResponse
    {
        $model = AccessTemplate::query()->findOrFail($template);
        $model->update($this->validated($request, $model));
        Audit::record($request->user(), 'ACCESS_TEMPLATE_UPDATED', 'users', $model, $model->name, 'success', ['permissions' => $model->permissions]);

        return response()->json(['data' => $this->present($model)]);
    }

    public function destroy(Request $request, int $template): JsonResponse
    {
        $model = AccessTemplate::query()->findOrFail($template);
        $model->delete();
        Audit::record($request->user(), 'ACCESS_TEMPLATE_DELETED', 'users', $model, $model->name, 'success');

        return response()->json(null, 204);
    }

    /** @return array{name: string, description: ?string, permissions: list<string>} */
    private function validated(Request $request, ?AccessTemplate $current = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', Rule::unique('access_templates', 'name')->ignore($current?->getKey())],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['present', 'array', 'max:80'],
            'permissions.*' => ['string', Rule::in(RolePermissions::grantable())],
        ]);
        $data['permissions'] = array_values(array_unique($data['permissions']));

        return $data;
    }

    private function present(AccessTemplate $t): array
    {
        return ['id' => $t->id, 'name' => $t->name, 'description' => $t->description, 'permissions' => $t->grantablePermissions()];
    }
}
