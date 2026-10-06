<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Http\Controllers\Api\Admin\AdminCrudController;
use App\Http\Resources\DirectoryResource;
use App\Enums\EmploymentStatus;
use App\Enums\EmploymentType;
use App\Models\DirectoryEntry;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use App\Services\EmployeeImporter;
use App\Services\PersonalInfo;
use App\Services\UserAdminService;
use App\Services\Audit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * HR management of the employee records (directory entries). HR enters and maintains everything here by hand; the portal
 * is the system of record. Creating an entry also creates the employee's login: the company email is the sign-in name, the
 * account starts `pending` with the role HR picks (Regular Employee or Manager only: department and administrator roles are
 * granted by an administrator under Users), and an emailed one-time link lets the employee choose their own password.
 *  - every field except the employee ID (chosen once, on creation) stays editable;
 *  - `source`, `verification`, `user_id` and `official_name` can never be sent by a client;
 *  - hiding an entry never changes the linked portal account.
 */
class AdminDirectoryController extends AdminCrudController
{
    /** The only roles HR can hand out. HR, IT and Administrator access is granted by an administrator under Users. */
    private const HR_ASSIGNABLE_ROLES = [RoleName::Employee->value, RoleName::Manager->value];

    /** Most logins created by one bulk run (each sends an email). */
    private const BATCH = 100;

    protected function model(): string
    {
        return DirectoryEntry::class;
    }

    protected function module(): string
    {
        return 'hr';
    }

    protected function entity(): string
    {
        return 'DIRECTORY_ENTRY';
    }

    protected function label(Model $model): string
    {
        return $model->employee_id.' '.$model->display_name;
    }

    protected function query(): Builder
    {
        return DirectoryEntry::query()->with('department', 'location', 'user', 'manager');
    }

    protected function sorts(): array
    {
        return ['display_name' => 'display_name', 'employee_id' => 'employee_id', 'job_title' => 'job_title', 'created_at' => 'created_at', 'updated_at' => 'updated_at'];
    }

    protected function defaultSort(): string
    {
        return 'display_name';
    }

    protected function searchColumns(): array
    {
        return ['display_name', 'employee_id', 'job_title', 'company_email'];
    }

    protected function filters(): array
    {
        return [
            'department_id' => ['sometimes', 'integer'],
            'location_id' => ['sometimes', 'integer'],
            'visibility' => ['sometimes', Rule::in(['visible', 'hidden'])],
            'employment_status' => ['sometimes', Rule::in(EmploymentStatus::values())],
            'account' => ['sometimes', Rule::in(['linked', 'unlinked'])],
        ];
    }

    protected function filterQuery(Builder $query, array $input): void
    {
        $query->when($input['department_id'] ?? null, fn (Builder $q, $v) => $q->where('department_id', $v))
            ->when($input['location_id'] ?? null, fn (Builder $q, $v) => $q->where('location_id', $v))
            ->when($input['employment_status'] ?? null, fn (Builder $q, $v) => $q->where('employment_status', $v))
            ->when($input['visibility'] ?? null, fn (Builder $q, $v) => $q->where('is_visible', $v === 'visible'))
            ->when($input['account'] ?? null, fn (Builder $q, $v) => $v === 'linked' ? $q->whereNotNull('user_id') : $q->whereNull('user_id'));
    }

    /** Search also covers the department name (a join-free sub-query), so "finance" finds people in that department. */
    protected function searchQuery(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }
        $like = '%'.strtr($term, ['!' => '!!', '%' => '!%', '_' => '!_']).'%';
        $query->where(function (Builder $q) use ($term, $like) {
            $this->searched($q, $term, $this->searchColumns());
            $q->orWhereHas('department', fn (Builder $d) => $d->whereRaw("name like ? escape '!'", [$like]));
        });
    }

    protected function rules(?Model $model): array
    {
        $creating = $model === null;
        /** @var DirectoryEntry|null $model */
        // The employee ID is the stable link and is chosen once, on creation.

        return [
            'employee_id' => $creating ? ['required', 'string', 'regex:/^[A-Za-z0-9][A-Za-z0-9_\-]{2,31}$/', Rule::unique('directory_entries', 'employee_id')] : ['prohibited'],
            'display_name' => [$creating ? 'required' : 'sometimes', 'string', 'max:120'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'department_id' => ['sometimes', 'nullable', 'integer', Rule::exists('departments', 'id')],
            // The company email is also the employee's login, so it is mandatory and must be free in both tables.
            'company_email' => [...($creating ? ['required'] : ($model?->user_id !== null ? ['sometimes', 'required'] : ['sometimes', 'nullable'])), 'email:rfc', 'max:255',
                Rule::unique('directory_entries', 'company_email')->ignore($model?->getKey()),
                Rule::unique('users', 'email')->where(fn ($q) => $q->where('employee_id', '!=', $model?->employee_id ?? request()->input('employee_id')))],
            'location_id' => ['sometimes', 'nullable', 'integer', Rule::exists('company_locations', 'id')],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[0-9+()\-\s.ext]{3,40}$/i'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'employment_status' => ['sometimes', Rule::in(EmploymentStatus::values())],
            'employment_type' => ['sometimes', 'nullable', Rule::in(EmploymentType::values())],
            'date_joined' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'manager_id' => ['sometimes', 'nullable', 'integer', Rule::exists('directory_entries', 'id'), function (string $attribute, mixed $value, \Closure $fail) use ($model) {
                // An employee cannot report to themselves, directly or through their own reports.
                for ($id = $value, $hops = 0; $id !== null && $hops < 50; $hops++) {
                    if ($model !== null && (int) $id === $model->getKey()) {
                        return $fail('An employee cannot report to themselves or to someone who reports to them.');
                    }
                    $id = DirectoryEntry::query()->whereKey($id)->value('manager_id');
                }
            }],
            'role' => ['sometimes', Rule::in(self::HR_ASSIGNABLE_ROLES)],
            'is_visible' => ['sometimes', 'boolean'],
            // Never accepted from a client.
            'official_name' => ['prohibited'], 'source' => ['prohibited'], 'verification' => ['prohibited'], 'user_id' => ['prohibited'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var DirectoryEntry $model */
        $model->fill(array_intersect_key($data, array_flip(['display_name', 'job_title', 'department_id', 'location_id', 'company_email', 'phone', 'description', 'employment_status', 'employment_type', 'date_joined'])));
        if (array_key_exists('manager_id', $data)) {
            $model->manager_id = $data['manager_id'];
        }
        if (! $model->exists) {
            $model->employee_id = $data['employee_id'];
            $model->source = DirectoryEntry::MANUAL;
            $model->is_sample = false;
            $model->is_visible = false;
        }
        if (array_key_exists('is_visible', $data)) {
            abort_unless($request->user()->hasPermission('hr.directory.visibility'), 403);
            $model->is_visible = (bool) $data['is_visible'];
        }
        if (isset($data['company_email'])) {
            $model->company_email = strtolower($data['company_email']);
            // The email is the login name: keep the linked account in step.
            if ($model->exists && $model->user !== null) {
                app(UserAdminService::class)->updateEmail($request->user(), $model->user, ['email' => $model->company_email]);
            }
        }
    }

    protected function present(Model $model): array
    {
        /** @var DirectoryEntry $model */
        return [
            'id' => $model->id, 'employee_id' => $model->employee_id, 'display_name' => $model->display_name, 'job_title' => $model->job_title,
            'department_id' => $model->department_id, 'department' => $model->department?->name, 'location_id' => $model->location_id, 'location' => $model->location?->name,
            'company_email' => $model->company_email, 'employment_status' => $model->employment_status, 'employment_type' => $model->employment_type,
            'date_joined' => $model->date_joined?->toDateString(), 'manager_id' => $model->manager_id, 'manager' => $model->manager?->display_name, 'phone' => $model->phone, 'description' => $model->description, 'is_visible' => $model->is_visible,
            
            // Account link status only: never credentials, tokens, roles or session data.
            'account' => ['linked' => $model->user_id !== null, 'status' => $model->user?->status->value],
            // The role HR can set from here; `role_locked` when the person holds HR/IT/Administrator access (an administrator manages those).
            'role' => $model->user === null ? null : (array_values(array_intersect($model->user->roleNames(), self::HR_ASSIGNABLE_ROLES))[0] ?? null),
            'login_disabled_by_hr' => $model->user !== null && $model->user->offboarded_from_status !== null,
            'role_locked' => $model->user !== null && array_diff($model->user->roleNames(), self::HR_ASSIGNABLE_ROLES) !== [],
            'preview' => (new DirectoryResource($model))->resolve(),
            'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }

    /** A new employee record gets its login at once (see the class comment). */
    protected function afterCreate(Model $model, Request $request): void
    {
        /** @var DirectoryEntry $model */
        // Someone who is already inactive has nothing to sign in to; their login is created if they are ever made active.
        if ($model instanceof DirectoryEntry && $model->employment_status !== EmploymentStatus::Inactive->value) {
            $this->provisionLogin($request->user(), $model, (string) $request->input('role', RoleName::Employee->value));
        }
    }

    /** Changing the role of an already linked account (Regular Employee <-> Manager only). */
    protected function afterUpdate(Model $model, Request $request, array $data): void
    {
        if ($model instanceof DirectoryEntry && $model->wasChanged('employment_status') && $model->user !== null) {
            $users = app(UserAdminService::class);
            if ($model->employment_status === EmploymentStatus::Inactive->value) {
                $users->offboard($request->user(), $model->user);
            } elseif ($model->user->offboarded_from_status !== null) {
                $users->reinstate($request->user(), $model->user);
            }
        }
        if (array_key_exists('role', $data) && $model instanceof DirectoryEntry && $model->user !== null) {
            $this->changeRole($request->user(), $model->user, $data['role']);
        }
    }

    private function changeRole(User $actor, User $target, string $role): void
    {
        if ($actor->is($target)) {
            throw ValidationException::withMessages(['role' => ['You cannot change your own role.']]);
        }
        $current = $target->roleNames();
        if (array_diff($current, self::HR_ASSIGNABLE_ROLES) !== []) {
            throw ValidationException::withMessages(['role' => ['This person has HR, IT or Administrator access. An administrator changes it under Users.']]);
        }
        if ($current === [$role]) {
            return;
        }
        $target->roles()->sync([Role::query()->where('name', $role)->firstOrFail()->getKey()]);
        Audit::record($actor, 'ROLE_ASSIGNED', 'hr', $target, $target->employee_id, 'success', ['role' => $role, 'via' => 'employee record']);
    }

    /**
     * Link the entry to the account with the same employee ID, creating a pending `employee` account (login = company email)
     * and sending the "choose your password" email when none exists yet.
     */
    private function provisionLogin(User $actor, DirectoryEntry $entry, string $role = RoleName::Employee->value): void
    {
        if ($entry->user_id !== null) {
            return;
        }
        if ($entry->employment_status === EmploymentStatus::Inactive->value) {
            throw ValidationException::withMessages(['employment_status' => ['This employee is inactive and cannot have a login. Set them to Active first.']]);
        }
        $user = User::query()->where('employee_id', $entry->employee_id)->first();
        if ($user === null) {
            if ($entry->company_email === null) {
                throw ValidationException::withMessages(['company_email' => ['Add a company email first: it becomes the employee login.']]);
            }
            $user = app(UserAdminService::class)->create($actor, [
                'employee_id' => $entry->employee_id, 'email' => $entry->company_email, 'role' => $role, 'status' => UserStatus::Pending->value,
            ]);
        }
        abort_if(DirectoryEntry::query()->where('user_id', $user->getKey())->exists(), 409);
        $entry->user_id = $user->getKey();
        $entry->save();
    }

    /** Hide or show an entry. Independent of the account: access, roles and sessions are untouched. */
    public function visibility(Request $request, int $id): JsonResponse
    {
        $entry = $this->query()->findOrFail($id);
        $data = $request->validate(['is_visible' => ['required', 'boolean']]);
        if ($entry->is_visible !== (bool) $data['is_visible']) {
            $entry->is_visible = (bool) $data['is_visible'];
            $entry->save();
            Audit::record($request->user(), 'DIRECTORY_VISIBILITY_CHANGED', 'hr', $entry, $this->label($entry), 'success', ['is_visible' => $entry->is_visible]);
        }

        return response()->json(['data' => $this->present($entry->refresh())]);
    }

    /** Link the entry to its portal account, creating the login (and emailing the password link) if the employee has none yet. */
    public function linkAccount(Request $request, int $id): JsonResponse
    {
        $entry = $this->query()->findOrFail($id);
        if ($entry->user_id === null) {
            DB::transaction(fn () => $this->provisionLogin($request->user(), $entry));
            Audit::record($request->user(), 'DIRECTORY_ACCOUNT_LINKED', 'hr', $entry, $this->label($entry));
        }

        return response()->json(['data' => $this->present($entry->refresh()->load('user'))]);
    }

    /**
     * Bulk version of "Create login": every entry without an account gets one (pending, `employee` role, login = company email)
     * and the "choose your password" email. Entries that cannot be done are skipped and reported, never guessed at. Each entry is
     * its own transaction, so one failure never undoes the others. At most BATCH entries per run; run again for the rest.
     */
    public function createLogins(Request $request): JsonResponse
    {
        $created = 0;
        $linked = 0;
        $skipped = [];
        $entries = DirectoryEntry::query()->whereNull('user_id')->orderBy('id')->limit(self::BATCH + 1)->get();
        $more = $entries->count() > self::BATCH;

        foreach ($entries->take(self::BATCH) as $entry) {
            if ($entry->employment_status === EmploymentStatus::Inactive->value) {
                $skipped[] = ['employee_id' => $entry->employee_id, 'display_name' => $entry->display_name, 'reason' => 'Employee is inactive'];
                continue;
            }
            if ($entry->company_email === null) {
                $skipped[] = ['employee_id' => $entry->employee_id, 'display_name' => $entry->display_name, 'reason' => 'No company email'];
                continue;
            }
            $existing = User::query()->where('employee_id', $entry->employee_id)->exists();
            $clash = User::query()->where('email', $entry->company_email)->where('employee_id', '!=', $entry->employee_id)->exists();
            if ($clash) {
                $skipped[] = ['employee_id' => $entry->employee_id, 'display_name' => $entry->display_name, 'reason' => 'Another account already uses this email'];
                continue;
            }
            try {
                DB::transaction(fn () => $this->provisionLogin($request->user(), $entry));
                $existing ? $linked++ : $created++;
            } catch (\Throwable $e) {
                $skipped[] = ['employee_id' => $entry->employee_id, 'display_name' => $entry->display_name, 'reason' => 'Could not create the login'];
            }
        }
        Audit::record($request->user(), 'DIRECTORY_LOGINS_CREATED', 'hr', null, 'Bulk create logins', 'success', ['created' => $created, 'linked' => $linked, 'skipped' => count($skipped)]);

        return response()->json(['data' => ['created' => $created, 'linked' => $linked, 'skipped' => $skipped, 'more_remaining' => $more]]);
    }

    /**
     * CSV import, step 1: check the file and report what would happen. Nothing is written.
     * Step 2 (`import`) takes the same file again, so the server keeps no copy between the two.
     */
    public function importPreview(Request $request, EmployeeImporter $importer): JsonResponse
    {
        $request->validate($this->importFileRules());
        $parsed = $importer->parse($request->file('file'));
        $result = $importer->validate($parsed['rows']);

        return response()->json(['data' => [
            'total' => count($parsed['rows']),
            'ready' => count($result['ready']),
            'ready_sample' => array_map(fn (array $r) => ['line' => $r['line'], 'employee_id' => $r['employee_id'], 'display_name' => $r['display_name'], 'company_email' => $r['company_email'], 'job_title' => $r['job_title'], 'department' => $r['department'], 'role' => $r['role']], array_slice($result['ready'], 0, 5)),
            'existing' => $result['existing'],
            'errors' => $result['errors'],
            'ignored_columns' => $parsed['ignored_columns'],
        ]]);
    }

    /** CSV import, step 2: create every row that passes validation, optionally with its login (and password email). */
    public function import(Request $request, EmployeeImporter $importer): JsonResponse
    {
        $request->validate($this->importFileRules() + ['create_logins' => ['sometimes', 'boolean'], 'make_visible' => ['sometimes', 'boolean']]);
        $visible = $request->boolean('make_visible');
        abort_if($visible && ! $request->user()->hasPermission('hr.directory.visibility'), 403);

        $parsed = $importer->parse($request->file('file'));
        $result = $importer->validate($parsed['rows']);
        $done = $importer->import($request->user(), $result['ready'], $request->boolean('create_logins', true), $visible);

        return response()->json(['data' => $done + ['skipped_existing' => count($result['existing']), 'errors' => $result['errors']]]);
    }

    /** @return array<string, list<string>> */
    private function importFileRules(): array
    {
        return ['file' => ['required', 'file', 'max:1024', 'extensions:csv,txt']];
    }

    /**
     * An employee's personal details and emergency contacts, for HR (for example to call someone's emergency contact). The employee
     * entered them; every look is written to the audit log. Null when the employee has no portal account yet.
     */
    public function personal(Request $request, int $id): JsonResponse
    {
        $entry = $this->query()->findOrFail($id);
        if ($entry->user === null) {
            return response()->json(['data' => null]);
        }
        Audit::record($request->user(), 'PERSONAL_DATA_VIEWED', 'hr', $entry, $this->label($entry));

        return response()->json(['data' => PersonalInfo::for($entry->user->load('profile'))]);
    }

    /** Portal accounts that have no directory entry yet (employee ID, email and status only). */
    public function unlinkedUsers(Request $request): JsonResponse
    {
        $this->listInput($request, [], ['employee_id']);
        $users = User::query()->whereNotIn('employee_id', DirectoryEntry::query()->select('employee_id'))->orderBy('employee_id')->limit(100)->get();

        return response()->json(['data' => $users->map(fn (User $u) => ['employee_id' => $u->employee_id, 'email' => $u->email, 'status' => $u->status->value])->values()]);
    }
}
