<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContentStatus;
use App\Enums\FormCategory;
use App\Http\Resources\EmployeeFormResource;
use App\Models\EmployeeForm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Form listings reference their document by id (no duplicated metadata). Only published forms reach ordinary employees. */
class EmployeeFormController extends ApiController
{
    private const SORTS = ['title' => 'title', 'updated_at' => 'updated_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', Rule::enum(FormCategory::class)],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ], array_keys(self::SORTS));

        $query = $this->scopeFor($request)->with('document')
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($this->manages($request) ? ($input['status'] ?? null) : null, fn (Builder $q, $v) => $q->where('status', $v));
        $this->searched($query, $input['search'] ?? null, ['title', 'description']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'title', 'asc'), $request, EmployeeFormResource::class);
    }

    public function show(Request $request, int $form): EmployeeFormResource
    {
        return new EmployeeFormResource($this->scopeFor($request)->with('document')->findOrFail($form));
    }

    private function manages(Request $request): bool
    {
        return $request->user()->hasPermission('forms.manage');
    }

    private function scopeFor(Request $request): Builder
    {
        $query = EmployeeForm::query();

        return $this->manages($request) ? $query : $query->where('status', ContentStatus::Published->value);
    }
}
