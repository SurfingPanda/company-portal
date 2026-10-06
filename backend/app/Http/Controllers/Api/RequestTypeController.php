<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestCategory;
use App\Http\Resources\RequestTypeResource;
use App\Models\RequestType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Request types available to the signed-in employee: active types only. Role-specific types can be added later by
 * narrowing {@see availableTo()} (it is the single place that decides availability), without changing the endpoints.
 */
class RequestTypeController extends ApiController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', Rule::enum(RequestCategory::class)],
            'active' => ['sometimes', 'in:true,false,1,0'],
        ], ['name']);

        $query = $this->availableTo($request)
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            // Only request managers may look at inactive types; everyone else is always limited to active ones.
            ->when($request->has('active') && $request->user()->hasPermission('requests.manage'), fn (Builder $q) => $q->where('is_active', $request->boolean('active')));
        $this->searched($query, $input['search'] ?? null, ['name', 'description']);

        return $this->paginated($this->sorted($query, $request, ['name' => 'name'], 'name', 'asc'), $request, RequestTypeResource::class);
    }

    public function show(Request $request, int $requestType): RequestTypeResource
    {
        return new RequestTypeResource($this->availableTo($request)->findOrFail($requestType));
    }

    private function availableTo(Request $request): Builder
    {
        $query = RequestType::query();

        return $request->user()->hasPermission('requests.manage') ? $query : $query->where('is_active', true);
    }
}
