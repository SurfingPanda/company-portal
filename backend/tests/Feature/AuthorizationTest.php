<?php

namespace Tests\Feature;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Models\Document;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\PortalNotification;
use App\Models\PortalPreference;
use App\Models\RequestType;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', $role)->first());

        return $user->fresh();
    }

    private function can(User $user, string $ability, mixed $arguments = []): bool
    {
        return Gate::forUser($user)->allows($ability, $arguments);
    }

    // --- Requests ----------------------------------------------------------------------------------------------------

    public function test_employee_can_view_own_requests_but_not_another_employees(): void
    {
        $alice = $this->userWithRole('employee');
        $bob = $this->userWithRole('employee');
        $alicesRequest = EmployeeRequest::factory()->forUser($alice)->create();
        $bobsRequest = EmployeeRequest::factory()->forUser($bob)->create();

        $this->assertTrue($this->can($alice, 'view', $alicesRequest));
        $this->assertFalse($this->can($alice, 'view', $bobsRequest));
        // Scoped queries (what a controller must use) never even return the other record.
        $this->assertSame([$alicesRequest->id], EmployeeRequest::ownedBy($alice)->pluck('id')->all());
        $this->assertNull($alice->requests()->find($bobsRequest->id));
    }

    public function test_only_drafts_can_be_edited_and_only_open_requests_cancelled(): void
    {
        $user = $this->userWithRole('employee');
        $draft = EmployeeRequest::factory()->forUser($user)->create(['status' => RequestStatus::Draft]);
        $done = EmployeeRequest::factory()->forUser($user)->create(['status' => RequestStatus::Completed]);

        $this->assertTrue($this->can($user, 'update', $draft));
        $this->assertFalse($this->can($user, 'update', $done));
        $this->assertTrue($this->can($user, 'cancel', $draft));
        $this->assertFalse($this->can($user, 'cancel', $done));
    }

    public function test_hr_reviews_hr_requests_only_and_manager_has_no_team_access_yet(): void
    {
        $hr = $this->userWithRole('hr');
        $manager = $this->userWithRole('manager');
        $admin = $this->userWithRole('admin');
        $owner = $this->userWithRole('employee');
        $hrRequest = EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => RequestType::factory()->create(['category' => RequestCategory::Hr])->id]);
        $itRequest = EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => RequestType::factory()->create(['category' => RequestCategory::It])->id]);

        $this->assertTrue($this->can($hr, 'view', $hrRequest));
        $this->assertFalse($this->can($hr, 'view', $itRequest));
        $this->assertFalse($this->can($manager, 'view', $hrRequest), 'team access needs the department head / reporting line');
        $this->assertTrue($this->can($admin, 'view', $itRequest));
    }

    // --- Notifications / preferences / tickets / applications -----------------------------------------------------------

    public function test_notifications_are_private_to_their_owner_even_from_admins(): void
    {
        $alice = $this->userWithRole('employee');
        $admin = $this->userWithRole('admin');
        $notification = PortalNotification::factory()->forUser($alice)->create();

        $this->assertTrue($this->can($alice, 'view', $notification));
        $this->assertTrue($this->can($alice, 'update', $notification));
        $this->assertFalse($this->can($admin, 'view', $notification));
        $this->assertFalse($this->can($this->userWithRole('employee'), 'update', $notification));
        $this->assertCount(0, PortalNotification::ownedBy($admin)->get());
    }

    public function test_preferences_belong_to_one_user(): void
    {
        $alice = $this->userWithRole('employee');
        $bob = $this->userWithRole('employee');
        $preference = $alice->preferences()->create([]);
        $this->assertInstanceOf(PortalPreference::class, $preference);

        $this->assertTrue($this->can($alice, 'view', $preference));
        $this->assertFalse($this->can($bob, 'update', $preference));
    }

    public function test_helpdesk_tickets_are_visible_to_the_requester_and_it_staff_only(): void
    {
        $alice = $this->userWithRole('employee');
        $ticket = HelpdeskTicket::factory()->forUser($alice)->create();

        $this->assertTrue($this->can($alice, 'view', $ticket));
        $this->assertFalse($this->can($this->userWithRole('employee'), 'view', $ticket));
        $this->assertFalse($this->can($this->userWithRole('hr'), 'view', $ticket));
        $this->assertTrue($this->can($this->userWithRole('it'), 'view', $ticket));
        $this->assertFalse($this->can($this->userWithRole('employee'), 'reply', $ticket));
    }

    public function test_applications_are_visible_to_the_applicant_and_recruitment_staff_only(): void
    {
        $applicant = $this->userWithRole('employee');
        $application = JobApplication::factory()->create(['user_id' => $applicant->id]);

        $this->assertTrue($this->can($applicant, 'view', $application));
        $this->assertFalse($this->can($this->userWithRole('employee'), 'view', $application));
        $this->assertFalse($this->can($this->userWithRole('it'), 'view', $application));
        $this->assertTrue($this->can($this->userWithRole('hr'), 'view', $application));
    }

    // --- Documents -----------------------------------------------------------------------------------------------------

    public function test_document_access_levels(): void
    {
        $employee = $this->userWithRole('employee');
        $manager = $this->userWithRole('manager');
        $hr = $this->userWithRole('hr');
        $all = Document::factory()->create();
        $managerOnly = Document::factory()->create(['access_level' => DocumentAccessLevel::Manager]);
        $restricted = Document::factory()->create(['access_level' => DocumentAccessLevel::Restricted]);
        $draft = Document::factory()->create(['status' => ContentStatus::Draft]);

        $this->assertTrue($this->can($employee, 'view', $all));
        $this->assertFalse($this->can($employee, 'view', $managerOnly));
        $this->assertTrue($this->can($manager, 'view', $managerOnly));
        $this->assertFalse($this->can($manager, 'view', $restricted));
        $this->assertTrue($this->can($hr, 'view', $restricted), 'document managers can see restricted documents');
        $this->assertFalse($this->can($employee, 'view', $draft));
    }

    public function test_department_documents_need_a_matching_directory_department(): void
    {
        $employee = $this->userWithRole('employee');
        $document = Document::factory()->create(['access_level' => DocumentAccessLevel::Department, 'department' => 'Finance']);

        // No directory entry: unknown department means denied.
        $this->assertFalse($this->can($employee, 'view', $document));

        $dept = \App\Models\Department::query()->forceCreate(['name' => 'Finance', 'status' => 'published']);
        \App\Models\DirectoryEntry::query()->forceCreate(['employee_id' => $employee->employee_id, 'user_id' => $employee->id, 'display_name' => 'Sample Person', 'department_id' => $dept->id, 'source' => 'manual', 'verification' => 'unverified']);
        $employee = $employee->fresh();
        $this->assertTrue($this->can($employee, 'view', $document));
    }

    // --- Roles, permissions, middleware ---------------------------------------------------------------------------------

    public function test_role_permissions(): void
    {
        $employee = $this->userWithRole('employee');
        foreach (['portal.view', 'requests.submit', 'profile.edit', 'hr.view', 'helpdesk.create'] as $permission) {
            $this->assertTrue($employee->hasPermission($permission), $permission);
        }
        foreach (['hr.manage', 'it.manage', 'documents.manage', 'announcements.manage', 'recruitment.manage', 'admin.access'] as $permission) {
            $this->assertFalse($employee->hasPermission($permission), "employee must not have {$permission}");
        }

        $this->assertTrue($this->userWithRole('hr')->hasPermission('hr.manage'));
        $this->assertTrue($this->userWithRole('it')->hasPermission('helpdesk.manage'));
        $this->assertTrue($this->userWithRole('manager')->hasPermission('requests.team-review'));
        $this->assertTrue($this->userWithRole('admin')->hasPermission('admin.access'));
        $this->assertFalse($this->userWithRole('hr')->hasPermission('admin.access'));
    }

    public function test_multiple_roles_combine_and_inactive_users_have_nothing(): void
    {
        $user = $this->userWithRole('hr');
        $user->roles()->attach(Role::where('name', 'it')->first());
        $user = $user->fresh();

        $this->assertTrue($user->hasPermission('hr.manage') && $user->hasPermission('it.manage'));
        $this->assertFalse($user->hasPermission('admin.access'));

        $user->forceFill(['status' => 'inactive'])->save();
        $this->assertFalse($user->fresh()->hasPermission('portal.view'));
    }

    public function test_gates_are_registered_for_every_permission(): void
    {
        $admin = $this->userWithRole('admin');
        $employee = $this->userWithRole('employee');

        $this->assertTrue($this->can($admin, 'admin.access'));
        $this->assertFalse($this->can($employee, 'admin.access'));
        $this->assertTrue($employee->can('portal.view'));
    }

    public function test_permission_middleware_returns_401_then_403_then_200(): void
    {
        Route::middleware(['web', 'permission:admin.access'])->get('/_probe/admin', fn () => response()->json(['ok' => true]));

        $this->getJson('/_probe/admin')->assertStatus(401);
        $this->actingAs($this->userWithRole('employee'))->getJson('/_probe/admin')->assertStatus(403);
        $this->actingAs($this->userWithRole('admin'))->getJson('/_probe/admin')->assertOk();
    }

    // --- Phase 22 authentication compatibility -------------------------------------------------------------------------

    public function test_sign_in_identifier_matches_employee_id_or_email_and_password_is_verified(): void
    {
        $user = User::factory()->create(['employee_id' => 'EMP-4242', 'email' => 'sample.person@eljin.example']);

        $this->assertTrue(User::withIdentifier('EMP-4242')->first()->is($user));
        $this->assertTrue(User::withIdentifier('Sample.Person@ELJIN.example')->first()->is($user));
        $this->assertNull(User::withIdentifier('EMP-0000')->first());
        $this->assertTrue(Hash::check('DemoOnly123!', $user->password));
        $this->assertFalse(Hash::check('wrong', $user->password));
        $this->assertTrue(auth()->validate(['email' => 'sample.person@eljin.example', 'password' => 'DemoOnly123!']));
    }

    public function test_user_exposes_roles_and_permissions_for_the_auth_me_contract(): void
    {
        $user = $this->userWithRole('manager');

        $payload = ['roles' => $user->roleNames(), 'permissions' => $user->permissions()];

        $this->assertSame(['manager'], $payload['roles']);
        $this->assertContains('requests.team-view', $payload['permissions']);
        $this->assertContains('portal.view', $payload['permissions']);
    }
}
