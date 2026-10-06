<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContentStatus;
use App\Enums\ResourceType;
use App\Http\Resources\ResourceFaqResource;
use App\Http\Resources\ResourceItemResource;
use App\Models\Resource;
use App\Models\ResourceFaq;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Portal resources: curated links to documents, forms, benefits, services and pages. They reference those entities by id
 * and never duplicate them; a linked document the viewer cannot open is not referenced.
 */
class ResourceController extends ApiController
{
    private const SORTS = ['title' => 'title', 'updated_at' => 'updated_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', 'string', 'max:30'],
            'resource_type' => ['sometimes', Rule::enum(ResourceType::class)],
            'featured' => ['sometimes', 'in:true,false,1,0'],
        ], array_keys(self::SORTS));

        $query = $this->published()->with('document')
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($input['resource_type'] ?? null, fn (Builder $q, $v) => $q->where('resource_type', $v))
            ->when($request->has('featured'), fn (Builder $q) => $q->where('is_featured', $request->boolean('featured')));
        $this->searched($query, $input['search'] ?? null, ['title', 'description']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'title', 'asc'), $request, ResourceItemResource::class);
    }

    public function show(int $resource): ResourceItemResource
    {
        return new ResourceItemResource($this->published()->with('document')->findOrFail($resource));
    }

    public function categories(): JsonResponse
    {
        $categories = $this->published()->select('category')->distinct()->orderBy('category')->pluck('category')
            ->map(fn (string $slug) => ['slug' => $slug, 'name' => ucwords(str_replace('-', ' ', $slug))])->values();

        return response()->json(['data' => $categories]);
    }

    public function featured(): AnonymousResourceCollection
    {
        return ResourceItemResource::collection($this->published()->with('document')->where('is_featured', true)->orderBy('title')->get());
    }

    public function faq(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, ['category' => ['sometimes', 'string', 'max:30']]);

        $query = ResourceFaq::query()->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v));
        $this->searched($query, $input['search'] ?? null, ['question', 'answer']);

        return $this->paginated($query->orderBy('sort_order')->orderBy('id'), $request, ResourceFaqResource::class);
    }

    private function published(): Builder
    {
        return Resource::query()->where('status', ContentStatus::Published->value);
    }
}
