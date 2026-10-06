<?php

namespace App\Http\Controllers\Api\Admin;

use App\Authorization\RolePermissions;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Http\Controllers\Api\ApiController;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\UserAdminService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Portal account management (`users.manage`, administrators only). A portal user is only a login linked to the HR employee record by
 * `employee_id`: names, departments and job titles live on the directory entry (HR Management) and are not editable here.
 * There is no hard delete: an account is disabled (status), so request/ticket history stays intact.
 */
class AdminUserController extends ApiController
{
    private const SORTS = ['employee_id' => 'employee_id', 'email' => 'email', 'created_at' => 'created_at', 'last_login_at' => 'last_login_at', 'status' => 'status'];

    public function __construct(private readonly UserAdminService $users) {}

    /** Email the user a fresh activation (pending) or password reset (active) link. Disabled accounts get none. */
    public function sendPasswordLink(Request $request, User $user, \App\Services\PasswordLinks $links): JsonResponse
    {
        abort_unless(in_array($user->status, [UserStatus::Pending, UserStatus::Active], true), 409);
        if (! $links->send($user)) {
            return response()->json(['message' => 'The email could not be sent. Check the mail settings and try again.', 'errors' => (object) []], 502);
        }
        \App\Services\Audit::record($request->user(), 'USER_PASSWORD_LINK_SENT', 'users', $user, $user->employee_id, 'success', ['purpose' => $user->status === UserStatus::Pending ? 'activation' : 'reset']);

        return response()->json(['message' => 'Email sent to '.$user->email.'.']);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'status' => ['sometimes', Rule::enum(UserStatus::class)],
            'role' => ['sometimes', Rule::enum(RoleName::class)],
        ], array_keys(self::SORTS));

        $query = User::query()->with('roles', 'profile')
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($input['role'] ?? null, fn (Builder $q, $v) => $q->whereHas('roles', fn (Builder $r) => $r->where('name', $v)))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['employee_id', 'email']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'created_at'), $request, \App\Http\Resources\Admin\AdminUserResource::class);
    }

    public function show(int $user): \App\Http\Resources\Admin\AdminUserResource
    {
        $model = User::query()->with('roles', 'profile')->findOrFail($user);

        return (new \App\Http\Resources\Admin\AdminUserResource($model))->withDetails($this->history($model));
    }

    public function store(\App\Http\Requests\Admin\StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create($request->user(), $request->validated());

        return $this->created(new \App\Http\Resources\Admin\AdminUserResource($user));
    }

    /** Portal email only. Status and roles have their own endpoints so each change is validated and audited separately. */
    public function update(\App\Http\Requests\Admin\UpdateUserRequest $request, int $user): \App\Http\Resources\Admin\AdminUserResource
    {
        $target = User::query()->findOrFail($user);

        return new \App\Http\Resources\Admin\AdminUserResource($this->users->updateEmail($request->user(), $target, $request->validated()));
    }

    public function status(Request $request, int $user): \App\Http\Resources\Admin\AdminUserResource
    {
        $data = $request->validate(['status' => ['required', Rule::enum(UserStatus::class)]]);
        $target = User::query()->findOrFail($user);

        return new \App\Http\Resources\Admin\AdminUserResource($this->users->setStatus($request->user(), $target, UserStatus::from($data['status'])));
    }

    public function addRole(Request $request, int $user): \App\Http\Resources\Admin\AdminUserResource
    {
        $data = $request->validate(['role' => ['required', Rule::enum(RoleName::class)]]);

        return new \App\Http\Resources\Admin\AdminUserResource($this->users->addRole($request->user(), User::query()->findOrFail($user), $data['role']));
    }

    public function removeRole(Request $request, int $user, string $role): \App\Http\Resources\Admin\AdminUserResource
    {
        validator(['role' => $role], ['role' => [Rule::enum(RoleName::class)]])->validate();

        return new \App\Http\Resources\Admin\AdminUserResource($this->users->removeRole($request->user(), User::query()->findOrFail($user), $role));
    }

    /** The access screen: what the person's roles already give, what was granted on top, and every permission that can be granted. */
    public function access(int $user): JsonResponse
    {
        return response()->json(['data' => $this->accessPayload(User::query()->with('roles', 'grantedPermissions')->findOrFail($user))]);
    }

    public function updateAccess(Request $request, int $user): JsonResponse
    {
        $data = $request->validate(['permissions' => ['present', 'array', 'max:80'], 'permissions.*' => ['string', 'max:60']]);
        $target = $this->users->setAccess($request->user(), User::query()->findOrFail($user), $data['permissions']);

        return response()->json(['data' => $this->accessPayload($target)]);
    }

    private function accessPayload(User $user): array
    {
        return [
            'user' => ['id' => $user->id, 'employee_id' => $user->employee_id, 'email' => $user->email, 'roles' => $user->roleNames(), 'status' => $user->status->value],
            'from_roles' => RolePermissions::forRoles($user->roleNames()),
            'granted' => $user->grantedPermissionNames(),
            'catalog' => RolePermissions::grantableCatalog(),
        ];
    }

    /** Recent account activity: the employee's own sign-in/profile events and administrative changes made to the account. */
    private function history(User $user): array
    {
        $own = $user->activityLogs()->whereIn('activity_type', ['login', 'logout', 'profile_updated'])->latest('created_at')->limit(10)
            ->get()->map(fn ($a) => ['at' => $a->created_at->toIso8601String(), 'action' => $a->activity_type, 'description' => $a->description, 'source' => 'account']);
        $admin = AuditLog::query()->where('target_type', 'User')->where('target_id', $user->getKey())->latest('created_at')->latest('id')->limit(10)
            ->get()->map(fn ($a) => ['at' => $a->created_at->toIso8601String(), 'action' => $a->action, 'description' => $a->details ? json_encode($a->details) : '', 'source' => 'admin']);

        return $own->concat($admin)->sortByDesc('at')->values()->take(15)->all();
    }
}
