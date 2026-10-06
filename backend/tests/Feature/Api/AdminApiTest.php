<?php

namespace Tests\Feature\Api;

use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Models\AdminSetting;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\DocumentCategory;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\PortalNotification;
use App\Models\RecruitmentJob;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Phase 29: administration API. Authorization per role, user/role safety rules, content management, auditing. */
class AdminApiTest extends ApiTestCase
{
    private function admin(): User
    {
        $admin = $this->makeUser('admin');
        $this->actingAs($admin);

        return $admin;
    }

    // --- Authorization -------------------------------------------------------------------------------------------------

    public function test_unauthenticated_and_ordinary_roles_cannot_reach_admin_endpoints(): void
    {
        $paths = ['dashboard', 'users', 'roles', 'permissions', 'activity-log', 'settings', 'notifications', 'documents', 'document-categories', 'forms', 'request-types', 'benefits', 'resources', 'recruitment/jobs', 'recruitment/applications', 'recruitment/referrals'];

        foreach ($paths as $path) {
            $this->getJson("/api/admin/{$path}")->assertStatus(401);
        }
        foreach (['employee', 'manager'] as $role) {
            $this->actingAs($this->makeUser($role));
            // A manager may open the dashboard (it shows only requests routed to them); every other module is closed.
            foreach (array_filter($paths, fn ($p) => ! ($role === 'manager' && $p === 'dashboard')) as $path) {
                $this->getJson("/api/admin/{$path}")->assertStatus(403);
            }
            $this->postJson('/api/admin/users', ['employee_id' => 'EMP-9001', 'email' => 'x@eljin.example', 'role' => 'admin', 'status' => 'active'])->assertStatus(403);
            $this->patchJson('/api/helpdesk/tickets/1', ['status' => 'closed'])->assertStatus(403);
        }
        $this->assertSame(0, AuditLog::count());
    }

    public function test_hr_it_and_admin_reach_only_their_modules(): void
    {
        $allowed = ['hr' => ['dashboard', 'benefits', 'recruitment/jobs', 'recruitment/applications', 'documents'], 'it' => ['dashboard', 'resources', 'documents'], 'admin' => ['dashboard', 'users', 'roles', 'permissions', 'activity-log', 'settings', 'notifications', 'documents', 'forms', 'request-types', 'benefits', 'resources', 'recruitment/jobs']];
        $forbidden = ['hr' => ['users', 'roles', 'permissions', 'settings', 'activity-log', 'notifications', 'forms', 'request-types', 'resources'], 'it' => ['users', 'settings', 'activity-log', 'notifications', 'forms', 'request-types', 'benefits', 'recruitment/jobs']];

        foreach ($allowed as $role => $paths) {
            $this->actingAs($this->makeUser($role));
            foreach ($paths as $path) {
                $this->getJson("/api/admin/{$path}")->assertOk();
            }
            foreach ($forbidden[$role] ?? [] as $path) {
                $this->getJson("/api/admin/{$path}")->assertStatus(403);
            }
        }
    }

    // --- User management -------------------------------------------------------------------------------------------------

    public function test_admin_creates_a_pending_account_with_no_usable_password(): void
    {
        $admin = $this->admin();

        $response = $this->postJson('/api/admin/users', ['employee_id' => 'EMP-9100', 'email' => 'New.Person@Eljin.example', 'role' => 'it', 'status' => 'pending'])->assertCreated();

        $response->assertJsonPath('data.employee_id', 'EMP-9100')->assertJsonPath('data.email', 'new.person@eljin.example')->assertJsonPath('data.status', 'pending')->assertJsonPath('data.roles', ['it']);
        $this->assertStringNotContainsString('password', strtolower($response->getContent()));
        $user = User::where('employee_id', 'EMP-9100')->firstOrFail();
        $this->assertFalse($user->is_sample);
        $this->assertNotEmpty($user->password);
        // Nobody knows the generated password, so no sign-in works until an activation step sets one.
        foreach (['', 'password', 'DemoOnly123!', 'EMP-9100'] as $guess) {
            $this->assertFalse(\Hash::check($guess, $user->password));
        }
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_CREATED', 'actor_user_id' => $admin->id, 'target_label' => 'EMP-9100']);
    }

    public function test_duplicates_invalid_values_and_smuggled_fields_are_rejected(): void
    {
        $this->admin();
        $this->makeUser('employee', ['employee_id' => 'EMP-9200', 'email' => 'taken@eljin.example']);
        $ok = ['employee_id' => 'EMP-9201', 'email' => 'fresh@eljin.example', 'role' => 'employee', 'status' => 'active'];

        $this->postJson('/api/admin/users', [...$ok, 'employee_id' => 'EMP-9200'])->assertStatus(422)->assertJsonValidationErrors('employee_id');
        $this->postJson('/api/admin/users', [...$ok, 'email' => 'TAKEN@eljin.example'])->assertStatus(422)->assertJsonValidationErrors('email');
        $this->postJson('/api/admin/users', [...$ok, 'role' => 'superadmin'])->assertStatus(422)->assertJsonValidationErrors('role');
        $this->postJson('/api/admin/users', [...$ok, 'status' => 'deleted'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->postJson('/api/admin/users', [...$ok, 'employee_id' => 'bad id!'])->assertStatus(422)->assertJsonValidationErrors('employee_id');
        $this->postJson('/api/admin/users', [...$ok, 'email' => 'nope'])->assertStatus(422);
        $this->postJson('/api/admin/users', [])->assertStatus(422)->assertJsonValidationErrors(['employee_id', 'email', 'role', 'status']);

        // Extra fields (a chosen password, HR data, flags) are ignored, not stored.
        $this->postJson('/api/admin/users', [...$ok, 'password' => 'ChosenPassword123', 'is_sample' => true, 'department' => 'Finance', 'salary' => 1, 'id' => 1])->assertCreated();
        $user = User::where('employee_id', 'EMP-9201')->firstOrFail();
        $this->assertFalse(\Hash::check('ChosenPassword123', $user->password));
        $this->assertFalse($user->is_sample);
        $this->assertNotSame(1, $user->id);
    }

    public function test_user_list_filters_search_sort_and_validation(): void
    {
        $this->admin();
        $this->makeUser('hr', ['employee_id' => 'EMP-9300', 'email' => 'hr.person@eljin.example']);
        $suspended = $this->makeUser('employee', ['employee_id' => 'EMP-9301', 'email' => 'sus@eljin.example']);
        $suspended->forceFill(['status' => 'suspended'])->save();

        $ids = fn (string $q) => collect($this->getJson("/api/admin/users{$q}")->assertOk()->json('data'))->pluck('employee_id')->all();

        $this->assertSame(['EMP-9301'], $ids('?status=suspended'));
        $this->assertSame(['EMP-9300'], $ids('?role=hr'));
        $this->assertSame(['EMP-9300'], $ids('?search=hr.person'));
        $this->assertSame(['EMP-9300', 'EMP-9301'], array_values(array_intersect($ids('?sort=employee_id&direction=asc'), ['EMP-9300', 'EMP-9301'])));
        $this->getJson('/api/admin/users?sort=password')->assertStatus(422);
        $this->getJson('/api/admin/users?status=pwned')->assertStatus(422);
        $this->getJson('/api/admin/users?per_page=500')->assertStatus(422);
        $body = $this->getJson('/api/admin/users')->getContent();
        foreach (['password', 'remember_token', 'department', 'job_title', 'salary'] as $leak) {
            $this->assertStringNotContainsString($leak, $body);
        }
    }

    public function test_user_detail_shows_access_summary_and_account_activity(): void
    {
        $this->admin();
        $target = $this->makeUser('hr', ['employee_id' => 'EMP-9400']);
        $target->activityLogs()->forceCreate(['user_id' => $target->id, 'activity_type' => 'login', 'description' => 'Signed in to the portal']);

        $response = $this->getJson("/api/admin/users/{$target->id}")->assertOk();

        $this->assertContains('hr.manage', $response->json('data.permissions'));
        $this->assertSame('login', $response->json('data.activity.0.action'));
        $this->getJson('/api/admin/users/99999')->assertStatus(404);
        $this->getJson('/api/admin/users/abc')->assertStatus(404);
    }

    public function test_status_changes_are_enforced_on_sign_in_and_end_sessions(): void
    {
        $this->admin();
        $target = $this->makeUser('employee', ['employee_id' => 'EMP-9500']);
        DB::table('sessions')->insert(['id' => 'abc', 'user_id' => $target->id, 'payload' => '', 'last_activity' => time()]);

        foreach (['suspended', 'inactive', 'pending'] as $status) {
            $this->patchJson("/api/admin/users/{$target->id}/status", ['status' => $status])->assertOk()->assertJsonPath('data.status', $status);
            $this->postJson('/api/auth/login', ['identifier' => 'EMP-9500', 'password' => 'DemoOnly123!'])->assertStatus(403);
            $this->assertFalse($target->fresh()->hasPermission('portal.view'));
        }
        $this->assertSame(0, DB::table('sessions')->where('user_id', $target->id)->count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_DISABLED', 'target_label' => 'EMP-9500']);

        $this->patchJson("/api/admin/users/{$target->id}/status", ['status' => 'active'])->assertOk();
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-9500', 'password' => 'DemoOnly123!'])->assertOk();
        $this->actingAs($this->makeUser('admin'));
        $this->patchJson("/api/admin/users/{$target->id}/status", ['status' => 'banned'])->assertStatus(422);
    }

    public function test_roles_are_assigned_and_removed_with_audit_and_validation(): void
    {
        $this->admin();
        $target = $this->makeUser('employee');

        $this->postJson("/api/admin/users/{$target->id}/roles", ['role' => 'it'])->assertOk()->assertJsonPath('data.roles', ['employee', 'it']);
        $this->assertTrue($target->fresh()->hasPermission('helpdesk.manage'));
        $this->postJson("/api/admin/users/{$target->id}/roles", ['role' => 'it'])->assertOk(); // idempotent
        $this->deleteJson("/api/admin/users/{$target->id}/roles/it")->assertOk()->assertJsonPath('data.roles', ['employee']);
        $this->assertFalse($target->fresh()->hasPermission('helpdesk.manage'));
        $this->deleteJson("/api/admin/users/{$target->id}/roles/employee")->assertStatus(422)->assertJsonValidationErrors('roles'); // keeps one role

        $this->postJson("/api/admin/users/{$target->id}/roles", ['role' => 'root'])->assertStatus(422);
        $this->postJson("/api/admin/users/{$target->id}/roles", [])->assertStatus(422);
        $this->deleteJson("/api/admin/users/{$target->id}/roles/root")->assertStatus(422);
        $this->assertSame(['ROLE_ASSIGNED', 'ROLE_REMOVED'], AuditLog::whereIn('action', ['ROLE_ASSIGNED', 'ROLE_REMOVED'])->orderBy('id')->pluck('action')->all());
    }

    // --- Privilege escalation and self-protection ------------------------------------------------------------------------

    public function test_non_admins_cannot_assign_roles_or_escalate_themselves(): void
    {
        $hr = $this->makeUser('hr');
        $other = $this->makeUser('employee');
        $this->actingAs($hr);

        $this->postJson("/api/admin/users/{$hr->id}/roles", ['role' => 'admin'])->assertStatus(403);
        $this->postJson("/api/admin/users/{$other->id}/roles", ['role' => 'admin'])->assertStatus(403);
        $this->patchJson("/api/admin/users/{$other->id}/status", ['status' => 'suspended'])->assertStatus(403);
        $this->putJson("/api/admin/users/{$hr->id}", ['email' => 'x@eljin.example', 'roles' => ['admin']])->assertStatus(403);
        $this->assertSame(['hr'], $hr->fresh()->roleNames());
    }

    public function test_an_administrator_cannot_change_their_own_roles_or_status(): void
    {
        $other = $this->makeUser('admin');
        $me = $this->admin();

        $this->patchJson("/api/admin/users/{$me->id}/status", ['status' => 'suspended'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->deleteJson("/api/admin/users/{$me->id}/roles/admin")->assertStatus(422)->assertJsonValidationErrors('roles');
        $this->postJson("/api/admin/users/{$me->id}/roles", ['role' => 'hr'])->assertStatus(422);
        $this->assertTrue($me->fresh()->isActive());
        $this->assertTrue($other->fresh()->isActive());
    }

    public function test_the_last_active_administrator_can_never_be_disabled_or_demoted(): void
    {
        $solo = $this->makeUser('admin');
        $actor = $this->makeUser('admin');
        $this->actingAs($actor);
        // Two admins: one may act on the other...
        $this->patchJson("/api/admin/users/{$solo->id}/status", ['status' => 'inactive'])->assertOk();
        // ...but now `$actor` is the only active administrator left. Another admin who is not active cannot rescue the rule:
        $inactive = $solo->fresh();
        $this->assertFalse($inactive->isActive());
        $third = $this->makeUser('admin');
        $this->actingAs($third);
        $this->patchJson("/api/admin/users/{$actor->id}/status", ['status' => 'suspended'])->assertOk(); // two actives (actor, third): allowed
        $this->actingAs($this->makeUser('admin'));
        $this->patchJson("/api/admin/users/{$third->id}/status", ['status' => 'suspended'])->assertOk();
        // Active admins now: only the one acting. Nobody else can be the target of a demotion that leaves zero:
        $lastTwo = User::query()->where('status', 'active')->whereHas('roles', fn ($q) => $q->where('name', 'admin'))->get();
        $this->assertCount(1, $lastTwo);
        $last = $lastTwo->first();
        $helper = $this->makeUser('hr');
        $helper->roles()->attach(\App\Models\Role::where('name', 'admin')->first()); // second admin role holder, but suspended -> not counted
        $helper->forceFill(['status' => 'suspended'])->save();
        $this->actingAs($helper->fresh());
        $this->patchJson("/api/admin/users/{$last->id}/status", ['status' => 'inactive'])->assertStatus(403); // suspended admin has no permissions
        $this->assertTrue($last->fresh()->isActive());
    }

    public function test_removing_the_final_admin_role_from_the_final_admin_is_blocked_by_the_service(): void
    {
        $service = app(\App\Services\UserAdminService::class);
        $onlyAdmin = $this->makeUser('admin');
        $caller = $this->makeUser('hr'); // not an admin: the service is the last line of defence even if a route were misconfigured

        foreach ([fn () => $service->removeRole($caller, $onlyAdmin, 'admin'), fn () => $service->setStatus($caller, $onlyAdmin, \App\Enums\UserStatus::Suspended)] as $attempt) {
            try {
                $attempt();
                $this->fail('the last administrator was changed');
            } catch (\Illuminate\Validation\ValidationException $e) {
                $this->assertStringContainsString('last active administrator', json_encode($e->errors()));
            }
        }
        $this->assertTrue($onlyAdmin->fresh()->isActive());
        $this->assertSame(['admin'], $onlyAdmin->fresh()->roleNames());
    }

    public function test_email_update_is_validated_and_the_employee_id_is_immutable(): void
    {
        $this->admin();
        $target = $this->makeUser('employee', ['employee_id' => 'EMP-9600']);
        $this->makeUser('employee', ['email' => 'busy@eljin.example']);

        $this->putJson("/api/admin/users/{$target->id}", ['email' => 'Changed@Eljin.example', 'employee_id' => 'EMP-0000', 'status' => 'suspended', 'roles' => ['admin']])->assertOk()->assertJsonPath('data.email', 'changed@eljin.example');
        $fresh = $target->fresh();
        $this->assertSame('EMP-9600', $fresh->employee_id);
        $this->assertTrue($fresh->isActive());
        $this->assertSame(['employee'], $fresh->roleNames());
        $this->putJson("/api/admin/users/{$target->id}", ['email' => 'BUSY@eljin.example'])->assertStatus(422)->assertJsonValidationErrors('email');
        $this->putJson("/api/admin/users/{$target->id}", ['email' => 'not-an-email'])->assertStatus(422);
    }

    // --- Roles and permissions catalogue -----------------------------------------------------------------------------------

    public function test_roles_and_permissions_are_a_read_only_catalogue(): void
    {
        $this->admin();
        $this->makeUser('hr');

        $roles = collect($this->getJson('/api/admin/roles')->assertOk()->json('data'))->keyBy('name');
        $this->assertSame(['employee', 'manager', 'hr', 'it', 'admin'], $roles->keys()->all());
        $this->assertSame(1, $roles['hr']['users_count']);
        $this->assertContains('users.manage', $roles['admin']['permissions']);
        $this->assertNotContains('users.manage', $roles['hr']['permissions']);
        $this->assertNotEmpty($roles['admin']['description']);
        $this->getJson('/api/admin/roles/'.$roles['it']['id'])->assertOk()->assertJsonPath('data.name', 'it');

        $groups = collect($this->getJson('/api/admin/permissions')->assertOk()->json('data'))->keyBy('module');
        $this->assertTrue($groups->has('users') && $groups->has('announcements') && $groups->has('settings'));
        $this->assertSame(['admin'], collect($groups['users']['permissions'])->firstWhere('name', 'users.manage')['roles']);
        // Nothing can create, change or delete roles or permissions.
        $this->postJson('/api/admin/permissions', ['name' => 'x.y'])->assertStatus(405);
        $this->postJson('/api/admin/roles', ['name' => 'root'])->assertStatus(405);
        $this->putJson('/api/admin/roles/1', ['name' => 'root'])->assertStatus(405);
    }

    // --- Audit log -------------------------------------------------------------------------------------------------------

    public function test_audit_entries_are_append_only_and_searchable(): void
    {
        $admin = $this->admin();
        $target = $this->makeUser('employee', ['employee_id' => 'EMP-9700']);
        $this->postJson("/api/admin/users/{$target->id}/roles", ['role' => 'it'])->assertOk();
        $this->postJson('/api/admin/users', ['employee_id' => 'EMP-9701', 'email' => 'a97@eljin.example', 'role' => 'employee', 'status' => 'pending'])->assertCreated();

        $log = $this->getJson('/api/admin/activity-log')->assertOk();
        $this->assertSame(['USER_CREATED', 'ROLE_ASSIGNED'], collect($log->json('data'))->pluck('action')->all());
        $first = $log->json('data.0');
        $this->assertSame($admin->employee_id, $first['actor']);
        $this->assertSame('users', $first['module']);
        $this->assertSame('success', $first['result']);
        $this->assertNotNull($first['ip_address']);
        $this->assertSame(['ROLE_ASSIGNED'], collect($this->getJson('/api/admin/activity-log?action=ROLE_ASSIGNED')->json('data'))->pluck('action')->all());
        $this->assertCount(2, $this->getJson('/api/admin/activity-log?module=users')->json('data'));
        $this->assertCount(1, $this->getJson('/api/admin/activity-log?search=EMP-9701')->json('data'));
        $this->assertCount(0, $this->getJson('/api/admin/activity-log?from='.now()->addDay()->toDateString())->json('data'));
        $this->getJson('/api/admin/activity-log?result=weird')->assertStatus(422);
        $this->getJson('/api/admin/activity-log?sort=actor_label')->assertStatus(422);

        // No HTTP verb can change or remove an audit record, and the model itself refuses.
        $id = $first['id'];
        foreach (['put', 'patch', 'delete'] as $verb) {
            $this->{$verb.'Json'}("/api/admin/activity-log/{$id}")->assertStatus(404);
        }
        $record = AuditLog::findOrFail($id);
        $this->expectException(\LogicException::class);
        $record->update(['action' => 'FORGED']);
    }

    public function test_audit_records_cannot_be_deleted_through_the_model(): void
    {
        $record = \App\Services\Audit::record(null, 'SETTING_CHANGED', 'settings');

        try {
            $record->delete();
            $this->fail('deleted');
        } catch (\LogicException) {
            $this->assertDatabaseHas('audit_logs', ['id' => $record->id]);
        }
    }

    // --- Content management ------------------------------------------------------------------------------------------------

    public function test_announcements_are_created_published_pinned_archived_and_audited(): void
    {
        $this->actingAs($this->makeUser('hr'));

        $id = $this->postJson('/api/announcements', ['title' => 'Draft memo', 'summary' => 'S', 'content' => 'C', 'category' => 'hr'])->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');
        $this->assertSame(0, \count($this->actingAs($this->makeUser('employee'))->getJson('/api/announcements')->json('data')), 'drafts are invisible to employees');

        $this->actingAs($this->makeUser('hr'));
        $this->putJson("/api/announcements/{$id}", ['status' => 'published', 'is_pinned' => true, 'priority' => 'important'])->assertOk()->assertJsonPath('data.status', 'published');
        $this->assertCount(1, $this->actingAs($this->makeUser('employee'))->getJson('/api/announcements')->json('data'));

        $this->actingAs($this->makeUser('hr'));
        $this->putJson("/api/announcements/{$id}", ['status' => 'archived'])->assertOk();
        $this->assertCount(0, $this->actingAs($this->makeUser('employee'))->getJson('/api/announcements')->json('data'));
        $this->assertEqualsCanonicalizing(['ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_PUBLISHED', 'ANNOUNCEMENT_UPDATED'], AuditLog::pluck('action')->all());
    }

    public function test_calendar_events_can_be_created_postponed_and_deleted_by_admins_only(): void
    {
        $this->actingAs($this->makeUser('hr'));
        $this->postJson('/api/calendar/events', ['title' => 'Town hall', 'starts_at' => '2026-12-01 09:00:00'])->assertStatus(403);

        $this->admin();
        $id = $this->postJson('/api/calendar/events', ['title' => 'Town hall', 'starts_at' => '2026-12-01 09:00:00', 'category' => 'company-event', 'visibility' => 'all'])->assertCreated()->json('data.id');
        $this->putJson("/api/calendar/events/{$id}", ['status' => 'postponed'])->assertOk()->assertJsonPath('data.status', 'postponed');
        $this->deleteJson("/api/calendar/events/{$id}")->assertNoContent();
        $this->assertSame(['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED'], AuditLog::orderBy('id')->pluck('action')->all());
    }

    public function test_documents_are_managed_as_metadata_by_document_managers(): void
    {
        $category = DocumentCategory::query()->create(['slug' => 'policies', 'name' => 'Policies']);
        $this->actingAs($this->makeUser('hr'));

        $created = $this->postJson('/api/admin/documents', ['title' => 'Leave policy', 'document_category_id' => $category->id, 'file_type' => 'PDF', 'access_level' => 'all', 'status' => 'published', 'is_sample' => true, 'storage_path' => '/etc/passwd', 'created_by' => 99])->assertCreated();
        $id = $created->json('data.id');
        $created->assertJsonPath('data.status', 'published');
        $document = \App\Models\Document::findOrFail($id);
        $this->assertFalse($document->is_sample);
        $this->assertNull($document->storage_path, 'storage paths are never client-controlled');
        $this->assertNotSame(99, $document->created_by);
        $this->assertNotNull($document->published_at);
        $this->assertStringNotContainsString('storage', json_encode($created->json()));

        $this->putJson("/api/admin/documents/{$id}", ['status' => 'archived', 'access_level' => 'restricted'])->assertOk()->assertJsonPath('data.access_level', 'restricted');
        $this->postJson('/api/admin/documents', ['title' => 'x', 'document_category_id' => 9999])->assertStatus(422)->assertJsonValidationErrors('document_category_id');
        $this->postJson('/api/admin/documents', ['title' => 'x', 'document_category_id' => $category->id, 'file_type' => 'EXE'])->assertStatus(422);
        $this->getJson('/api/admin/documents?status=archived')->assertOk()->assertJsonCount(1, 'data');
        $this->actingAs($this->makeUser('employee'));
        $this->getJson("/api/documents/{$id}")->assertStatus(404);
        $this->actingAs($this->makeUser('hr'));
        $this->deleteJson("/api/admin/documents/{$id}")->assertNoContent();
        $this->assertSame(['DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED'], AuditLog::orderBy('id')->pluck('action')->all());
    }

    public function test_benefits_resources_forms_jobs_and_request_types_are_managed_by_the_right_roles(): void
    {
        $hr = $this->makeUser('hr');
        $this->actingAs($hr);
        $benefit = $this->postJson('/api/admin/benefits', ['name' => 'Wellness information', 'short_description' => 'Info', 'description' => 'Details', 'category' => 'health', 'status' => 'information-only'])->assertCreated()->json('data.id');
        $this->putJson("/api/admin/benefits/{$benefit}", ['is_featured' => true, 'eligibility' => 'See HR'])->assertOk()->assertJsonPath('data.is_featured', true);
        $this->postJson('/api/admin/benefits', ['name' => 'x', 'short_description' => 'x', 'description' => 'x', 'amount' => 5000, 'balance' => 10])->assertCreated();
        $this->assertArrayNotHasKey('amount', \App\Models\Benefit::latest('id')->first()->getAttributes());

        $job = $this->postJson('/api/admin/recruitment/jobs', ['title' => 'Sample Analyst', 'department' => 'Finance', 'location' => 'Sample', 'employment_type' => 'full-time', 'description' => 'Duties', 'status' => 'open'])->assertCreated();
        $jobId = $job->json('data.id');
        $job->assertJsonPath('data.status', 'open');
        $this->assertNotNull($job->json('data.published_at'));
        $this->putJson("/api/admin/recruitment/jobs/{$jobId}", ['status' => 'closed'])->assertOk()->assertJsonPath('data.status', 'closed');
        $this->postJson('/api/admin/recruitment/jobs', ['title' => 'x', 'department' => 'y', 'location' => 'z', 'employment_type' => 'forever', 'description' => 'd'])->assertStatus(422);
        \App\Models\JobApplication::factory()->create(['job_id' => $jobId]);
        $this->deleteJson("/api/admin/recruitment/jobs/{$jobId}")->assertStatus(409); // has applications: close, do not delete
        $apps = $this->getJson('/api/admin/recruitment/applications')->assertOk();
        $this->assertStringNotContainsString('resume_path', $apps->getContent());
        $this->getJson('/api/admin/recruitment/referrals')->assertOk();
        $this->postJson('/api/admin/forms', ['title' => 'x'])->assertStatus(403);
        $this->postJson('/api/admin/resources', ['title' => 'x'])->assertStatus(403);

        $this->actingAs($this->makeUser('it'));
        $resource = $this->postJson('/api/admin/resources', ['title' => 'IT guide', 'category' => 'it', 'resource_type' => 'page', 'target_url' => '/helpdesk', 'status' => 'published'])->assertCreated();
        $this->postJson('/api/admin/resources', ['title' => 'Bad link', 'target_url' => 'javascript:alert(1)'])->assertStatus(422)->assertJsonValidationErrors('target_url');
        $this->postJson('/api/admin/resources', ['title' => 'Bad link', 'target_url' => 'http://insecure.example'])->assertStatus(422);
        $this->postJson('/api/admin/resources', ['title' => 'Ext', 'target_url' => 'https://example.com/page'])->assertCreated();
        $this->deleteJson('/api/admin/resources/'.$resource->json('data.id'))->assertNoContent();

        $this->admin();
        $form = $this->postJson('/api/admin/forms', ['title' => 'Online inquiry', 'category' => 'hr', 'form_type' => 'online', 'status' => 'published'])->assertCreated();
        $this->putJson('/api/admin/forms/'.$form->json('data.id'), ['status' => 'draft'])->assertOk();

        $type = $this->postJson('/api/admin/request-types', [
            'request_code' => 'rt-sample-new', 'name' => 'Sample new request', 'category' => 'hr', 'reference_prefix' => 'SN',
            'fields' => [['id' => 'reason', 'label' => 'Reason', 'type' => 'textarea', 'required' => true], ['id' => 'kind', 'label' => 'Kind', 'type' => 'select', 'options' => ['A', 'B']]],
        ])->assertCreated();
        $typeId = $type->json('data.id');
        $this->postJson('/api/admin/request-types', ['request_code' => 'rt-sample-new', 'name' => 'dup'])->assertStatus(422)->assertJsonValidationErrors('request_code');
        $this->postJson('/api/admin/request-types', ['request_code' => 'rt-bad-field', 'name' => 'x', 'fields' => [['id' => 'a b', 'label' => 'x', 'type' => 'script']]])->assertStatus(422);
        $this->postJson('/api/admin/request-types', ['request_code' => 'rt-dup-field', 'name' => 'x', 'fields' => [['id' => 'a', 'label' => 'x', 'type' => 'text'], ['id' => 'a', 'label' => 'y', 'type' => 'text']]])->assertStatus(422);
        $this->putJson("/api/admin/request-types/{$typeId}", ['is_active' => false, 'request_code' => 'rt-changed'])->assertStatus(422);
        $this->putJson("/api/admin/request-types/{$typeId}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->deleteJson("/api/admin/request-types/{$typeId}")->assertStatus(405);
        // Deactivating removes it from the employee catalogue immediately.
        $this->actingAs($this->makeUser('employee'));
        $this->getJson("/api/request-types/{$typeId}")->assertStatus(404);
    }

    // --- Requests and helpdesk administration ------------------------------------------------------------------------------

    public function test_staff_review_lists_filter_by_category_requester_and_status_with_role_limits(): void
    {
        $alice = $this->makeUser('employee', ['employee_id' => 'EMP-9800']);
        $bob = $this->makeUser('employee', ['employee_id' => 'EMP-9801']);
        $hrType = RequestType::factory()->create(['category' => RequestCategory::Hr]);
        $itType = RequestType::factory()->create(['category' => RequestCategory::It]);
        $a = EmployeeRequest::factory()->forUser($alice)->create(['request_type_id' => $hrType->id, 'subject' => 'HR one']);
        EmployeeRequest::factory()->forUser($bob)->create(['request_type_id' => $itType->id, 'subject' => 'IT one', 'status' => RequestStatus::UnderReview]);

        $this->actingAs($this->makeUser('hr'));
        $subjects = fn (string $q) => collect($this->getJson("/api/requests?scope=review{$q}")->assertOk()->json('data'))->pluck('subject')->all();
        $this->assertSame(['HR one'], $subjects(''), 'HR sees only HR-type requests');
        $this->assertSame(['HR one'], $subjects('&requester=EMP-9800'));
        $this->assertSame([], $subjects('&requester=EMP-9801'));
        $first = $this->getJson('/api/requests?scope=review')->json('data.0');
        $this->assertSame('EMP-9800', $first['requester']);

        $this->actingAs($this->makeUser('admin'));
        $this->assertEqualsCanonicalizing(['HR one', 'IT one'], $subjects(''));
        $this->assertSame(['IT one'], $subjects('&category=it'));
        $this->assertSame(['IT one'], $subjects('&status=under-review'));
        $this->assertSame(['HR one'], $subjects('&search=HR'));
        $this->getJson('/api/requests?scope=review&category=nonsense')->assertStatus(422);
        $this->postJson("/api/requests/{$a->id}/status", ['status' => 'approved', 'comment' => 'Looks fine'])->assertOk();
        $this->assertContains('REQUEST_STATUS_CHANGED', AuditLog::pluck('action')->all());

        // The employee list never exposes the requester field to the owner.
        $this->actingAs($alice);
        $this->assertArrayNotHasKey('requester', $this->getJson('/api/requests')->json('data.0'));
        $this->actingAs($bob);
        $this->getJson("/api/requests/{$a->id}")->assertStatus(404);
    }

    public function test_it_staff_assign_and_update_tickets_and_the_requester_is_told(): void
    {
        $owner = $this->makeUser('employee', ['employee_id' => 'EMP-9900']);
        $ticket = HelpdeskTicket::factory()->forUser($owner)->create();
        $it = $this->makeUser('it', ['employee_id' => 'EMP-9901']);
        $this->actingAs($it);

        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['assigned_to' => 'EMP-9901', 'priority' => 'high', 'status' => 'open'])->assertOk()
            ->assertJsonPath('data.assigned_to', 'EMP-9901')->assertJsonPath('data.priority', 'high')->assertJsonPath('data.status', 'open')->assertJsonPath('data.requester', 'EMP-9900');
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'resolved'])->assertOk();
        $this->assertNotNull($ticket->fresh()->resolved_at);
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'open'])->assertOk(); // reopen
        $this->assertNull($ticket->fresh()->resolved_at);
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'exploded'])->assertStatus(422);
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['assigned_to' => 'EMP-9900'])->assertStatus(422)->assertJsonValidationErrors('assigned_to'); // an employee cannot be assignee
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['assigned_to' => 'EMP-NOPE'])->assertStatus(422);
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['subject' => 'Hijacked', 'user_id' => $it->id])->assertOk();
        $fresh = $ticket->fresh();
        $this->assertSame('Sample ticket', $fresh->subject);
        $this->assertSame($owner->id, $fresh->user_id);
        $this->assertTrue(PortalNotification::where('user_id', $owner->id)->where('message', 'like', '%resolved%')->exists());
        $this->assertEqualsCanonicalizing(['HELPDESK_TICKET_ASSIGNED', 'HELPDESK_TICKET_UPDATED'], AuditLog::distinct()->pluck('action')->all());

        $this->actingAs($this->makeUser('hr'));
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'closed'])->assertStatus(403);
        $this->actingAs($owner);
        $this->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'closed'])->assertStatus(403);
        $this->assertArrayNotHasKey('assigned_to', $this->getJson("/api/helpdesk/tickets/{$ticket->id}")->json('data'), 'staff-only field');
    }

    // --- Notifications, dashboard, settings --------------------------------------------------------------------------------

    public function test_admin_sends_in_portal_notifications_to_an_audience(): void
    {
        $this->admin();
        $employee = $this->makeUser('employee', ['employee_id' => 'EMP-9950']);
        $hr = $this->makeUser('hr');
        $suspended = $this->makeUser('hr');
        $suspended->forceFill(['status' => 'suspended'])->save();

        $this->postJson('/api/admin/notifications', ['type' => 'hr', 'title' => 'HR memo', 'message' => 'Please read.', 'link' => '/announcements/1', 'audience' => 'role', 'role' => 'hr'])->assertCreated()->assertJsonPath('data.delivered', 1);
        $this->assertSame(1, PortalNotification::where('user_id', $hr->id)->count());
        $this->assertSame(0, PortalNotification::where('user_id', $suspended->id)->count(), 'only active accounts');
        $this->postJson('/api/admin/notifications', ['type' => 'system', 'title' => 'Hello', 'message' => 'Everyone', 'audience' => 'all'])->assertCreated();
        $this->assertSame(1, PortalNotification::where('user_id', $employee->id)->count());
        $this->postJson('/api/admin/notifications', ['type' => 'system', 'title' => 'One', 'message' => 'Just you', 'audience' => 'user', 'employee_id' => 'EMP-9950'])->assertCreated()->assertJsonPath('data.delivered', 1);

        $this->postJson('/api/admin/notifications', ['type' => 'system', 'title' => 'x', 'message' => 'y', 'audience' => 'user', 'employee_id' => 'EMP-NOPE'])->assertStatus(422)->assertJsonValidationErrors('employee_id');
        foreach (['https://evil.example', '//evil.example', 'javascript:alert(1)', 'announcements/1'] as $link) {
            $this->postJson('/api/admin/notifications', ['type' => 'system', 'title' => 'x', 'message' => 'y', 'audience' => 'all', 'link' => $link])->assertStatus(422)->assertJsonValidationErrors('link');
        }
        $this->postJson('/api/admin/notifications', ['type' => 'sms', 'title' => 'x', 'message' => 'y', 'audience' => 'all'])->assertStatus(422);
        $this->postJson('/api/admin/notifications', ['type' => 'system', 'title' => 'x', 'message' => 'y', 'audience' => 'role'])->assertStatus(422)->assertJsonValidationErrors('role');
        $this->assertCount(3, $this->getJson('/api/admin/notifications')->json('data'));
        $this->assertSame(3, AuditLog::where('action', 'NOTIFICATION_SENT')->count());
    }

    public function test_notification_preferences_still_apply_to_admin_notifications(): void
    {
        $this->admin();
        $employee = $this->makeUser('employee');
        $employee->preferences()->create(['notify_hr' => false]);

        $this->postJson('/api/admin/notifications', ['type' => 'hr', 'title' => 'HR', 'message' => 'x', 'audience' => 'user', 'employee_id' => $employee->employee_id])->assertCreated()->assertJsonPath('data.delivered', 0);
    }

    public function test_dashboard_shows_real_counts_limited_to_what_the_role_manages(): void
    {
        $admin = $this->admin();
        $pending = $this->makeUser('employee');
        $pending->forceFill(['status' => 'pending'])->save();
        $type = RequestType::factory()->create();
        EmployeeRequest::factory()->forUser($pending)->count(2)->create(['request_type_id' => $type->id]);
        EmployeeRequest::factory()->forUser($pending)->create(['request_type_id' => $type->id, 'status' => RequestStatus::Completed]);
        HelpdeskTicket::factory()->forUser($pending)->create();
        Announcement::query()->forceCreate(['title' => 'D', 'slug' => 'd', 'summary' => 's', 'content' => 'c', 'status' => 'draft']);
        RecruitmentJob::factory()->create();

        $data = $this->getJson('/api/admin/dashboard')->assertOk()->json('data');

        $this->assertSame(['total' => 2, 'active' => 1, 'pending' => 1], $data['users']);
        $this->assertSame(2, $data['requests']['pending']);
        $this->assertSame(1, $data['helpdesk']['open']);
        $this->assertSame(1, $data['announcements']['drafts']);
        $this->assertSame(0, $data['recruitment']['open_applications']);
        $this->assertNotNull($admin);

        $this->actingAs($this->makeUser('it'));
        $it = $this->getJson('/api/admin/dashboard')->assertOk()->json('data');
        $this->assertArrayHasKey('helpdesk', $it);
        $this->assertArrayNotHasKey('users', $it);
        $this->assertSame(0, $it['requests']['pending'], 'IT counts only IT-type requests (none here), not the HR ones');
    }

    public function test_settings_are_whitelisted_validated_audited_and_never_secrets(): void
    {
        $this->admin();

        $this->getJson('/api/admin/settings')->assertOk()->assertJsonPath('data.portal_name', 'ELJIN Employee Portal');
        $this->putJson('/api/admin/settings', ['portal_name' => 'Portal X', 'default_page_size' => 25, 'db_password' => 'hunter2', 'app_key' => 'base64:abc'])->assertOk()
            ->assertJsonPath('data.portal_name', 'Portal X');
        $this->assertSame(['default_page_size', 'portal_name'], AdminSetting::orderBy('key')->pluck('key')->all(), 'unknown keys are never stored');
        $this->assertSame(2, AuditLog::where('action', 'SETTING_CHANGED')->count());
        $this->assertStringNotContainsString('hunter2', json_encode(AuditLog::all()));

        $this->putJson('/api/admin/settings', ['default_page_size' => 1000])->assertStatus(422);
        $this->putJson('/api/admin/settings', ['support_email' => 'nope'])->assertStatus(422);
        $this->putJson('/api/admin/settings', ['portal_name' => str_repeat('x', 81)])->assertStatus(422);
        $this->putJson('/api/admin/settings', ['portal_name' => 'Portal X'])->assertOk(); // unchanged value: no new audit entry
        $this->assertSame(2, AuditLog::where('action', 'SETTING_CHANGED')->count());
    }

    public function test_admin_list_endpoints_validate_sort_and_pagination(): void
    {
        $this->admin();
        foreach (['users', 'documents', 'forms', 'request-types', 'benefits', 'resources', 'recruitment/jobs', 'activity-log'] as $path) {
            $this->getJson("/api/admin/{$path}?sort=id;DROP")->assertStatus(422);
            $this->getJson("/api/admin/{$path}?per_page=101")->assertStatus(422);
            $this->getJson("/api/admin/{$path}?direction=up")->assertStatus(422);
            $this->getJson("/api/admin/{$path}?search=".str_repeat('a', 101))->assertStatus(422);
            $this->getJson("/api/admin/{$path}?search=".urlencode("' OR 1=1 --"))->assertOk();
        }
        $this->getJson('/api/admin/documents/99999')->assertStatus(404);
        $this->putJson('/api/admin/benefits/99999', ['name' => 'x'])->assertStatus(404);
    }

    // --- First administrator bootstrap ---------------------------------------------------------------------------------------

    public function test_create_admin_command_needs_a_terminal_and_has_no_defaults(): void
    {
        $this->artisan('portal:create-admin', ['--no-interaction' => true])->assertFailed();
        $this->assertSame(0, User::count(), 'no default account is ever created');
    }

    public function test_create_admin_command_prompts_for_everything_and_hashes_the_password(): void
    {
        $this->artisan('portal:create-admin')
            ->expectsQuestion('Employee ID', 'EMP-7777')
            ->expectsQuestion('Company email', 'First.Admin@Eljin.example')
            ->expectsQuestion('Password (at least 12 characters; hidden)', 'A-Long-Passphrase-1')
            ->expectsQuestion('Repeat the password', 'A-Long-Passphrase-1')
            ->assertSuccessful();

        $user = User::where('employee_id', 'EMP-7777')->firstOrFail();
        $this->assertSame(['admin'], $user->roleNames());
        $this->assertTrue($user->isActive());
        $this->assertSame('first.admin@eljin.example', $user->email);
        $this->assertTrue(\Hash::check('A-Long-Passphrase-1', $user->password));
        $this->assertStringNotContainsString('A-Long-Passphrase', json_encode(AuditLog::all()));
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-7777', 'password' => 'A-Long-Passphrase-1'])->assertOk()->assertJsonPath('data.roles', ['admin']);
    }

    public function test_create_admin_command_rejects_short_or_mismatched_passwords_and_duplicates(): void
    {
        $this->artisan('portal:create-admin')->expectsQuestion('Employee ID', 'EMP-7778')->expectsQuestion('Company email', 'a@eljin.example')
            ->expectsQuestion('Password (at least 12 characters; hidden)', 'short')->assertFailed();
        $this->artisan('portal:create-admin')->expectsQuestion('Employee ID', 'EMP-7778')->expectsQuestion('Company email', 'a@eljin.example')
            ->expectsQuestion('Password (at least 12 characters; hidden)', 'A-Long-Passphrase-1')->expectsQuestion('Repeat the password', 'different-passphrase')->assertFailed();
        $this->makeUser('employee', ['employee_id' => 'EMP-7779']);
        $this->artisan('portal:create-admin', ['employee_id' => 'EMP-7779', 'email' => 'b@eljin.example'])->assertFailed();
        $this->assertSame(1, User::count());
    }
}
