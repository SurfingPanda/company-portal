<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Shared list behaviour so every collection endpoint paginates, validates, filters and sorts the same way:
 *   page, per_page (default 20, max 100), search, sort (whitelisted key), direction (asc|desc), from, to.
 * User input is validated and bound as parameters; it is never concatenated into SQL, and `sort` only ever selects from a
 * fixed map of columns.
 */
abstract class ApiController extends Controller
{
    protected const DEFAULT_PER_PAGE = 20;

    protected const MAX_PER_PAGE = 100;

    /**
     * Validate and return the common list parameters plus any endpoint-specific rules.
     *
     * @param  array<string, mixed>  $extraRules
     * @param  list<string>  $sorts  allowed `sort` keys
     * @return array<string, mixed> validated input
     */
    protected function listInput(Request $request, array $extraRules = [], array $sorts = []): array
    {
        return $request->validate([
            'page' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sort' => ['sometimes', 'string', Rule::in($sorts)],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'from' => ['sometimes', 'nullable', 'date'],
            'to' => ['sometimes', 'nullable', 'date', 'after_or_equal:from'],
            ...$extraRules,
        ]);
    }

    protected function perPage(Request $request): int
    {
        return max(1, min(self::MAX_PER_PAGE, (int) $request->query('per_page', self::DEFAULT_PER_PAGE)));
    }

    /**
     * Apply `sort`/`direction` from a fixed whitelist of `key => column`.
     *
     * @param  array<string, string>  $columns
     */
    protected function sorted(Builder $query, Request $request, array $columns, string $defaultKey, string $defaultDirection = 'desc'): Builder
    {
        $key = array_key_exists((string) $request->query('sort'), $columns) ? (string) $request->query('sort') : $defaultKey;
        $direction = $request->query('direction', $defaultDirection) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($columns[$key], $direction)->orderBy($query->getModel()->getQualifiedKeyName(), $direction);
    }

    /**
     * `search` across several columns with a parameter-bound LIKE. Wildcards typed by the user are escaped.
     *
     * @param  list<string>  $columns
     */
    protected function searched(Builder $query, ?string $term, array $columns): Builder
    {
        $term = trim((string) $term);
        if ($term === '') {
            return $query;
        }
        // `!` is the LIKE escape character (portable across MySQL and SQLite), so a typed % or _ matches itself.
        $like = '%'.strtr($term, ['!' => '!!', '%' => '!%', '_' => '!_']).'%';
        $grammar = $query->getQuery()->getGrammar();

        return $query->where(function (Builder $q) use ($columns, $like, $grammar) {
            foreach ($columns as $column) {
                $q->orWhereRaw($grammar->wrap($column)." like ? escape '!'", [$like]);
            }
        });
    }

    /** @param class-string<JsonResource> $resource */
    protected function paginated(Builder $query, Request $request, string $resource): AnonymousResourceCollection
    {
        return $resource::collection($query->paginate($this->perPage($request))->withQueryString());
    }

    /**
     * Authorise reading a record that belongs to someone. A record the user may not see is reported as 404, exactly like
     * one that does not exist, so ids cannot be probed (IDOR).
     */
    protected function mustView(Model $model): Model
    {
        abort_unless(Gate::allows('view', $model), 404);

        return $model;
    }

    protected function created(JsonResource $resource): JsonResponse
    {
        return $resource->response()->setStatusCode(201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }
}
