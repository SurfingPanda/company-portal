<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContentStatus;
use App\Enums\NotificationType;
use App\Enums\PolicyAudience;
use App\Models\Department;
use App\Models\Policy;
use App\Models\PolicyAcknowledgement;
use App\Services\Audit;
use App\Services\PortalEvents;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * HR management of policies and the record of who has read them. Policies are never deleted (acknowledgements are evidence):
 * they are archived. Editing a published policy fixes it in place; "new version" asks everyone in the audience to read it again.
 *
 * @extends AdminCrudController
 */
class AdminPolicyController extends AdminCrudController
{
    protected function model(): string
    {
        return Policy::class;
    }

    protected function module(): string
    {
        return 'policies';
    }

    protected function entity(): string
    {
        return 'POLICY';
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'title' => 'title', 'status' => 'status', 'due_date' => 'due_date'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'summary'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(ContentStatus::class)]];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';
        $audience = fn () => request()->input('audience', $model?->audience->value);

        return [
            'title' => [$required, 'string', 'max:255'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'body' => [$required, 'string', 'max:60000'],
            'audience' => ['sometimes', Rule::enum(PolicyAudience::class)],
            'department_ids' => [Rule::requiredIf(fn () => $audience() === PolicyAudience::Departments->value && ($model === null || request()->has('audience'))), 'array', 'max:100'],
            'department_ids.*' => ['integer', 'distinct', Rule::exists('departments', 'id')],
            'effective_date' => ['sometimes', 'nullable', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var Policy $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'summary', 'body', 'effective_date', 'due_date'])));
        if (! $model->exists) {
            $model->created_by = $request->user()->getKey();
            $model->version = 1;
        }
        $model->updated_by = $request->user()->getKey();
        foreach (['audience', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $model->{$field} = $data[$field];
            }
        }
        if (($data['status'] ?? null) === ContentStatus::Published->value && $model->published_at === null) {
            $model->published_at = now();
            $model->version_published_at = now();
        }
    }

    protected function afterCreate(Model $model, Request $request): void
    {
        /** @var Policy $model */
        $this->syncDepartments($model, $request);
        if ($model->status === ContentStatus::Published) {
            $this->notifyAudience($model, 'New policy to read', "Please read \"{$model->title}\" and confirm you have read it.");
        }
    }

    protected function afterUpdate(Model $model, Request $request, array $data): void
    {
        /** @var Policy $model */
        $this->syncDepartments($model, $request);
        if ($model->wasChanged('status') && $model->status === ContentStatus::Published) {
            $this->notifyAudience($model, 'New policy to read', "Please read \"{$model->title}\" and confirm you have read it.");
        }
    }

    protected function present(Model $model): array
    {
        /** @var Policy $model */
        $published = $model->status === ContentStatus::Published;

        return [
            'id' => $model->id, 'title' => $model->title, 'summary' => $model->summary, 'body' => $model->body, 'version' => $model->version,
            'status' => $model->status->value, 'audience' => $model->audience->value,
            'department_ids' => $model->departments()->pluck('departments.id')->all(), 'departments' => $model->departments()->orderBy('name')->pluck('departments.name')->all(),
            'effective_date' => $model->effective_date?->toDateString(), 'due_date' => $model->due_date?->toDateString(),
            'published_at' => $model->published_at?->toIso8601String(), 'version_published_at' => $model->version_published_at?->toIso8601String(),
            'last_reminded_at' => $model->last_reminded_at?->toIso8601String(), 'updated_at' => $model->updated_at?->toIso8601String(),
            'progress' => $published ? $model->progress() : null,
        ];
    }

    /** Publish a new version: everyone in the audience has to read and confirm again. */
    public function newVersion(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['due_date' => ['sometimes', 'nullable', 'date'], 'effective_date' => ['sometimes', 'nullable', 'date']]);
        $policy = Policy::query()->findOrFail($id);
        if ($policy->status !== ContentStatus::Published) {
            throw ValidationException::withMessages(['status' => ['Only a published policy can have a new version. Publish it first.']]);
        }

        $policy->forceFill([...$data, 'version' => $policy->version + 1, 'version_published_at' => now(), 'last_reminded_at' => null, 'updated_by' => $request->user()->getKey()])->save();
        Audit::record($request->user(), 'POLICY_NEW_VERSION', 'policies', $policy, $this->label($policy), 'success', ['version' => $policy->version]);
        $this->notifyAudience($policy, 'Policy updated', "\"{$policy->title}\" has a new version. Please read it and confirm again.");

        return response()->json(['data' => $this->present($policy->refresh())]);
    }

    /** Notify the people who still have to confirm. At most once a day per policy, so nobody is nagged. */
    public function remind(Request $request, int $id): JsonResponse
    {
        $policy = Policy::query()->findOrFail($id);
        if ($policy->status !== ContentStatus::Published) {
            throw ValidationException::withMessages(['status' => ['Only a published policy can be reminded.']]);
        }
        if ($policy->last_reminded_at !== null && $policy->last_reminded_at->isAfter(now()->subDay())) {
            throw ValidationException::withMessages(['remind' => ['A reminder was already sent in the last 24 hours.']]);
        }

        $outstanding = $policy->acknowledgedBy($policy->requiredUsers(), false)->with('preferences')->get();
        foreach ($outstanding as $user) {
            PortalEvents::notify($user, NotificationType::System, 'Reminder: policy to read', "Please read \"{$policy->title}\" and confirm you have read it.".($policy->due_date ? ' Due '.$policy->due_date->format('M j, Y').'.' : ''), '/policies/'.$policy->id);
        }
        $policy->forceFill(['last_reminded_at' => now()])->save();
        Audit::record($request->user(), 'POLICY_REMINDED', 'policies', $policy, $this->label($policy), 'success', ['notified' => $outstanding->count()]);

        return response()->json(['data' => ['notified' => $outstanding->count()]]);
    }

    /**
     * Who has and has not confirmed the CURRENT version: everyone the policy applies to, with the date for those who have.
     * Filters: `status` (pending, acknowledged, all), `department_id`, `search`. Includes the totals.
     */
    public function acknowledgements(Request $request, int $id): JsonResponse
    {
        $policy = Policy::query()->findOrFail($id);
        $input = $this->listInput($request, [
            'status' => ['sometimes', Rule::in(['pending', 'acknowledged', 'all'])],
            'department_id' => ['sometimes', 'integer'],
        ], ['employee_id', 'email']);

        $users = $policy->requiredUsers()->with(['directoryEntry.department', 'directoryEntry.manager']);
        match ($input['status'] ?? 'pending') {
            'pending' => $policy->acknowledgedBy($users, false),
            'acknowledged' => $policy->acknowledgedBy($users, true),
            default => $users,
        };
        if (isset($input['department_id'])) {
            $users->whereHas('directoryEntry', fn ($e) => $e->where('department_id', $input['department_id']));
        }
        if (($term = trim((string) ($input['search'] ?? ''))) !== '') {
            $users->where(function ($q) use ($term) {
                $this->searched($q, $term, ['users.employee_id', 'users.email']);
                $q->orWhereHas('directoryEntry', fn ($e) => $this->searched($e, $term, ['display_name']));
            });
        }
        $page = $this->sorted($users, $request, ['employee_id' => 'users.employee_id', 'email' => 'users.email'], 'employee_id', 'asc')->paginate($this->perPage($request));

        $acks = PolicyAcknowledgement::query()->where('policy_id', $policy->getKey())->whereIn('user_id', $page->pluck('id'))->get()->groupBy('user_id');
        $rows = $page->getCollection()->map(function ($user) use ($acks, $policy) {
            $mine = $acks->get($user->id, collect());
            $current = $mine->firstWhere('version', $policy->version);
            $entry = $user->directoryEntry;

            return [
                'employee_id' => $user->employee_id, 'display_name' => $entry?->display_name, 'email' => $user->email, 'job_title' => $entry?->job_title,
                'department' => $entry?->department?->name, 'manager' => $entry?->manager?->display_name, 'account_status' => $user->status->value,
                'acknowledged_at' => $current?->acknowledged_at->toIso8601String(), 'previously_acknowledged_version' => $mine->where('version', '<', $policy->version)->max('version'),
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
            'summary' => $policy->progress() + ['version' => $policy->version, 'due_date' => $policy->due_date?->toDateString(), 'status' => $policy->status->value],
        ]);
    }

    private function syncDepartments(Policy $policy, Request $request): void
    {
        if ($policy->audience !== PolicyAudience::Departments) {
            $policy->departments()->detach();

            return;
        }
        if ($request->has('department_ids')) {
            $policy->departments()->sync(Department::query()->whereIn('id', (array) $request->input('department_ids'))->pluck('id')->all());
        }
    }

    private function notifyAudience(Policy $policy, string $title, string $message): void
    {
        foreach ($policy->requiredUsers()->with('preferences')->get() as $user) {
            PortalEvents::notify($user, NotificationType::Hr, $title, $message, '/policies/'.$policy->id);
        }
    }
}
