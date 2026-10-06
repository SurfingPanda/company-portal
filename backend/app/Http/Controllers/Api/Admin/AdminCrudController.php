<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Services\Audit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Shared behaviour of the content management endpoints (documents, forms, request types, benefits, resources, job postings).
 * Each subclass declares its model, validated fields, filters and sortable columns; this class provides list, show, create,
 * update and delete with:
 *   - route-level `permission:` middleware (see routes/api.php) so only the right roles reach it;
 *   - validated input only (never `$request->all()`), explicit field mapping, protected columns never mass-assigned;
 *   - whitelisted sort columns and bound search parameters;
 *   - an audit entry for every change.
 */
abstract class AdminCrudController extends ApiController
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    /** Module name used in the audit log. */
    abstract protected function module(): string;

    /** Upper-case entity name used in audit actions, e.g. `DOCUMENT` gives DOCUMENT_CREATED. */
    abstract protected function entity(): string;

    /**
     * Validation rules for create (`$model` null) or update.
     *
     * @return array<string, mixed>
     */
    abstract protected function rules(?Model $model): array;

    /**
     * Turn validated data into model attributes. Protected columns (author, status workflow, flags) are set here explicitly.
     *
     * @param  array<string, mixed>  $data
     */
    abstract protected function apply(Model $model, array $data, Request $request): void;

    /** @return array<string, mixed> JSON representation (only the fields the admin UI needs). */
    abstract protected function present(Model $model): array;

    /** @return array<string, string> sort key => column */
    abstract protected function sorts(): array;

    /** @return list<string> columns searched by `search` */
    abstract protected function searchColumns(): array;

    /** Apply the validated list filters. Default: each filter is an equality test on the column of the same name. */
    protected function filterQuery(Builder $query, array $input): void
    {
        foreach (array_keys($this->filters()) as $param) {
            if (isset($input[$param]) && $input[$param] !== '') {
                $query->where($param, $input[$param]);
            }
        }
    }

    protected function searchQuery(Builder $query, ?string $term): void
    {
        $this->searched($query, $term, $this->searchColumns());
    }

    /** @return array<string, mixed> extra list filter rules, `param => rules` (each param is also a column of the same name) */
    protected function filters(): array
    {
        return [];
    }

    /**
     * Permission needed to publish or archive (and to edit already-published content). Null = no separate publish step.
     * Without it a user may create and edit DRAFTS only, so unreviewed content cannot go live or be altered live.
     */
    protected function publishPermission(): ?string
    {
        return null;
    }

    /** @param  array<string, mixed>  $data */
    protected function guardPublication(Request $request, ?Model $model, array $data): void
    {
        $permission = $this->publishPermission();
        if ($permission === null || $request->user()->hasPermission($permission)) {
            return;
        }
        $current = $model === null ? null : ($model->status instanceof \BackedEnum ? $model->status->value : $model->status);
        $target = $data['status'] ?? $current;
        // No publish right: not even touching live content, and no status other than draft.
        if ($current === 'published' || ($target !== null && $target !== 'draft')) {
            abort(403);
        }
    }

    protected function defaultSort(): string
    {
        return 'updated_at';
    }

    protected function label(Model $model): string
    {
        return (string) ($model->title ?? $model->name ?? $model->getKey());
    }

    protected function query(): Builder
    {
        return $this->model()::query();
    }

    public function index(Request $request): JsonResponse
    {
        $input = $this->listInput($request, $this->filters(), array_keys($this->sorts()));
        $query = $this->query();
        $this->filterQuery($query, $input);
        $this->searchQuery($query, $input['search'] ?? null);
        $page = $this->sorted($query, $request, $this->sorts(), $this->defaultSort())->paginate($this->perPage($request));

        return response()->json([
            'data' => $page->getCollection()->map(fn (Model $m) => $this->present($m))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present($this->query()->findOrFail($id))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(null));
        $this->guardPublication($request, null, $data);
        /** @var Model $model */
        $model = new ($this->model());
        \Illuminate\Support\Facades\DB::transaction(function () use ($model, $data, $request) {
            $this->apply($model, $data, $request);
            $model->save();
            $this->afterCreate($model, $request);
            Audit::record($request->user(), $this->entity().'_CREATED', $this->module(), $model, $this->label($model));
        });

        return response()->json(['data' => $this->present($model->refresh())], 201);
    }

    /** Hook for modules that must do more when a record is updated (same transaction as the update). */
    protected function afterUpdate(Model $model, Request $request, array $data): void {}

    /** Hook for modules that must do more when a record is created (runs in the same transaction as the insert). */
    protected function afterCreate(Model $model, Request $request): void {}

    public function update(Request $request, int $id): JsonResponse
    {
        $model = $this->query()->findOrFail($id);
        $before = $this->publishedState($model);
        $data = $request->validate($this->rules($model));
        $this->guardPublication($request, $model, $data);
        \Illuminate\Support\Facades\DB::transaction(function () use ($model, $data, $request) {
            $this->apply($model, $data, $request);
            $model->save();
            $this->afterUpdate($model, $request, $data);
        });
        $action = (! $before && $this->publishedState($model)) ? $this->entity().'_PUBLISHED' : $this->entity().'_UPDATED';
        Audit::record($request->user(), $action, $this->module(), $model, $this->label($model), 'success', ['fields' => implode(',', array_keys($data))]);

        return response()->json(['data' => $this->present($model->refresh())]);
    }

    /** PATCH .../{id}/status: publish, unpublish or archive (guarded by the publish permission). */
    public function status(Request $request, int $id): JsonResponse
    {
        $model = $this->query()->findOrFail($id);
        $data = $request->validate(['status' => ['required', \Illuminate\Validation\Rule::enum(\App\Enums\ContentStatus::class)]]);
        $this->guardPublication($request, $model, $data);
        $before = $model->status->value;
        $model->status = $data['status'];
        $model->save();
        $action = $data['status'] === 'published' ? $this->entity().'_PUBLISHED' : ($data['status'] === 'archived' ? $this->entity().'_ARCHIVED' : $this->entity().'_UPDATED');
        Audit::record($request->user(), $action, $this->module(), $model, $this->label($model), 'success', ['status_from' => $before, 'status_to' => $data['status']]);

        return response()->json(['data' => $this->present($model->refresh())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $model = $this->query()->findOrFail($id);
        $this->guardDelete($model);
        $label = $this->label($model);
        try {
            $model->delete();
        } catch (QueryException) {
            // A foreign key still points at this record (for example a job with applications): never force it, ask for archiving.
            abort(409);
        }
        Audit::record($request->user(), $this->entity().'_DELETED', $this->module(), $model, $label);

        return $this->noContent();
    }

    /** Hook: refuse deletion of a record that is still in use (throw with abort(409)). */
    protected function guardDelete(Model $model): void {}

    /** Whether a record is currently live for employees (so the audit can distinguish "published" from a plain edit). */
    protected function publishedState(Model $model): bool
    {
        $status = $model->status ?? null;
        $value = $status instanceof \BackedEnum ? $status->value : $status;

        return in_array($value, ['published', 'open', 'available'], true);
    }
}
