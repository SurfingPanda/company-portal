<?php

namespace App\Http\Controllers\Api\Admin;

use App\Authorization\RolePermissions;
use App\Enums\ApplicationStatus;
use App\Enums\ContentStatus;
use App\Enums\EventStatus;
use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Enums\TicketStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Api\ApiController;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit;
use App\Services\PortalSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Administration: dashboard counts, the read-only role and permission catalogue, the audit log and portal settings.
 * Dashboard numbers are real counts, and only the groups the caller may manage are returned (nothing is fabricated).
 */
class AdminOverviewController extends ApiController
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $can = fn (string ...$permissions) => collect($permissions)->contains(fn ($p) => $user->hasPermission($p));
        $data = [];

        if ($can('users.manage')) {
            $data['users'] = [
                'total' => User::count(),
                'active' => User::where('status', UserStatus::Active->value)->count(),
                'pending' => User::where('status', UserStatus::Pending->value)->count(),
            ];
        }
        if ($can('requests.manage', 'requests.hr-review', 'requests.team-review', 'requests.it-review')) {
            $query = EmployeeRequest::query()->whereIn('status', [RequestStatus::Submitted->value, RequestStatus::UnderReview->value]);
            if (! $user->hasPermission('requests.manage')) {
                $routed = app(\App\Services\ApprovalRouting::class)->scopeFor(EmployeeRequest::query(), $user)->select('employee_requests.id');
                $query->where(function (Builder $q) use ($user, $routed) {
                    if ($user->hasPermission('requests.hr-review')) {
                        $q->whereHas('requestType', fn (Builder $t) => $t->whereIn('category', [RequestCategory::Hr->value, RequestCategory::Benefits->value, RequestCategory::Recruitment->value]));
                    }
                    if ($user->hasPermission('requests.it-review')) {
                        // IT also counts approved requests: they are waiting to be fulfilled.
                        $q->orWhere(fn (Builder $i) => $i->where('user_id', '!=', $user->getKey())->whereIn('status', [RequestStatus::Submitted->value, RequestStatus::UnderReview->value, RequestStatus::Approved->value])->whereHas('requestType', fn (Builder $t) => $t->where('category', RequestCategory::It->value)));
                    }
                    $q->orWhereIn('id', $routed);
                });
            }
            $data['requests'] = ['pending' => $query->count()];
        }
        if ($can('helpdesk.manage')) {
            $data['helpdesk'] = ['open' => HelpdeskTicket::whereIn('status', [TicketStatus::New->value, TicketStatus::Open->value, TicketStatus::Pending->value])->count()];
        }
        if ($can('announcements.manage', 'announcements.hr-manage')) {
            $data['announcements'] = ['drafts' => Announcement::where('status', ContentStatus::Draft->value)->count()];
        }
        if ($can('calendar.manage')) {
            $data['events'] = ['upcoming' => CalendarEvent::where('status', EventStatus::Scheduled->value)->where('starts_at', '>=', now())->count()];
        }
        if ($can('documents.manage', 'documents.hr-manage', 'documents.it-manage')) {
            $data['documents'] = ['published' => Document::where('status', ContentStatus::Published->value)->count()];
        }
        if ($can('recruitment.manage')) {
            $data['recruitment'] = ['open_applications' => JobApplication::whereIn('status', [ApplicationStatus::Submitted->value, ApplicationStatus::UnderReview->value])->count()];
        }

        return response()->json(['data' => $data]);
    }

    /** Roles with their description, member count and permissions. Roles are defined in code and cannot be edited here. */
    public function roles(): JsonResponse
    {
        $counts = Role::query()->withCount('users')->get()->keyBy('name');
        $map = RolePermissions::map();

        $roles = Role::query()->orderBy('id')->get()->map(fn (Role $role) => [
            'id' => $role->id,
            'name' => $role->name,
            'label' => $role->label,
            'description' => RolePermissions::DESCRIPTIONS[$role->name] ?? '',
            'users_count' => $counts[$role->name]->users_count ?? 0,
            'permissions' => $map[$role->name] ?? [],
        ]);

        return response()->json(['data' => $roles]);
    }

    public function role(int $role): JsonResponse
    {
        $model = Role::query()->withCount('users')->findOrFail($role);

        return response()->json(['data' => [
            'id' => $model->id,
            'name' => $model->name,
            'label' => $model->label,
            'description' => RolePermissions::DESCRIPTIONS[$model->name] ?? '',
            'users_count' => $model->users_count,
            'permissions' => RolePermissions::map()[$model->name] ?? [],
        ]]);
    }

    public function permissions(): JsonResponse
    {
        $map = RolePermissions::map();
        $catalog = collect(RolePermissions::catalog())->map(fn ($group) => [
            ...$group,
            'permissions' => collect($group['permissions'])->map(fn ($permission) => [
                'name' => $permission,
                'roles' => collect($map)->filter(fn ($list) => in_array($permission, $list, true))->keys()->values(),
            ])->all(),
        ]);

        return response()->json(['data' => $catalog]);
    }

    /** Append-only: this controller (and the model) offers no way to edit or delete audit records. */
    public function activityLog(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'module' => ['sometimes', 'string', 'max:40'],
            'action' => ['sometimes', 'string', 'max:60'],
            'actor' => ['sometimes', 'string', 'max:60'],
            'result' => ['sometimes', Rule::in(['success', 'denied', 'failed'])],
        ], ['created_at']);

        $query = AuditLog::query()
            ->when($input['module'] ?? null, fn (Builder $q, $v) => $q->where('module', $v))
            ->when($input['action'] ?? null, fn (Builder $q, $v) => $q->where('action', $v))
            ->when($input['actor'] ?? null, fn (Builder $q, $v) => $q->where('actor_label', $v))
            ->when($input['result'] ?? null, fn (Builder $q, $v) => $q->where('result', $v))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['action', 'target_label', 'actor_label']);

        return $this->paginated($this->sorted($query, $request, ['created_at' => 'created_at'], 'created_at'), $request, \App\Http\Resources\Admin\AuditLogResource::class);
    }

    public function settings(): JsonResponse
    {
        $groups = [];
        $values = PortalSettings::all();
        foreach (PortalSettings::DEFINITIONS as $key => $definition) {
            $groups[$definition['group']][] = ['key' => $key, 'label' => $definition['label'], 'value' => $values[$key]];
        }

        return response()->json(['data' => $values, 'meta' => ['groups' => $groups]]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate(PortalSettings::rules());
        $changes = PortalSettings::update($data, $request->user());
        foreach ($changes as $key => $change) {
            Audit::record($request->user(), 'SETTING_CHANGED', 'settings', null, $key, 'success', $change);
        }

        return $this->settings();
    }
}
