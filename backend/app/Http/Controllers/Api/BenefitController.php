<?php

namespace App\Http\Controllers\Api;

use App\Enums\BenefitStatus;
use App\Http\Resources\BenefitFaqResource;
use App\Http\Resources\BenefitResource;
use App\Models\Benefit;
use App\Models\BenefitFaq;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Benefits are INFORMATION ONLY, published by HR. Nothing here calculates eligibility, amounts, claims, reimbursements,
 * payroll deductions or government contributions; those are handled by HR. People who need help use the request system.
 */
class BenefitController extends ApiController
{
    private const SORTS = ['name' => 'name', 'category' => 'category'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', 'string', 'max:30'],
            'status' => ['sometimes', Rule::enum(BenefitStatus::class)],
        ], array_keys(self::SORTS));

        $query = Benefit::query()
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v));
        $this->searched($query, $input['search'] ?? null, ['name', 'short_description', 'description']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'name', 'asc'), $request, BenefitResource::class);
    }

    public function show(int $benefit): BenefitResource
    {
        return new BenefitResource(Benefit::query()->with('faqs')->findOrFail($benefit));
    }

    public function categories(): JsonResponse
    {
        $categories = Benefit::query()->select('category')->distinct()->orderBy('category')->pluck('category')
            ->map(fn (string $slug) => ['slug' => $slug, 'name' => ucwords(str_replace('-', ' ', $slug))])->values();

        return response()->json(['data' => $categories]);
    }

    public function featured(): AnonymousResourceCollection
    {
        return BenefitResource::collection(Benefit::query()->where('is_featured', true)->orderBy('name')->get());
    }

    public function faq(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, ['benefit_id' => ['sometimes', 'integer']]);

        $query = BenefitFaq::query()->when($input['benefit_id'] ?? null, fn (Builder $q, $v) => $q->where('benefit_id', $v));
        $this->searched($query, $input['search'] ?? null, ['question', 'answer']);

        return $this->paginated($query->orderBy('sort_order')->orderBy('id'), $request, BenefitFaqResource::class);
    }
}
