<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\EmployeeRequest;
use App\Models\PortalNotification;
use App\Models\RequestApprovalRoute;
use App\Models\RequestType;
use App\Models\User;

/** HR-maintained department heads and approval routing (portal data only). */
class ApprovalRoutingApiTest extends ApiTestCase
{
    private Department $dept;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dept = Department::query()->forceCreate(['name' => 'Operations', 'status' => 'published']);
    }

    /** A person with an account AND a linked directory entry in a department. */
    private function person(string $role, ?Department $dept = null, string $name = 'Person'): array
    {
        static $n = 0;
        $n++;
        $user = $this->makeUser($role);
        $entry = DirectoryEntry::query()->forceCreate([
            'employee_id' => $user->employee_id, 'user_id' => $user->id, 'display_name' => "{$name} {$n}", 'department_id' => ($dept ?? $this->dept)->id, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified',
        ]);

        return [$user, $entry];
    }

    private function request(User $owner, ?RequestType $type = null, string $subject = 'Please review'): int
    {
        $this->actingAs($owner);

        return $this->postJson('/api/requests', ['request_type_id' => ($type ?? RequestType::factory()->create())->id, 'subject' => $subject])->assertCreated()->json('data.id');
    }

    // --- Option 1: department head linked to a directory entry ---------------------------------------------------------

    public function test_hr_sets_the_department_head_from_the_directory(): void
    {
        [, $headEntry] = $this->person('manager', null, 'Head');
        $this->actingAs($this->makeUser('hr'));

        $this->putJson("/api/admin/hr/departments/{$this->dept->id}", ['head_directory_entry_id' => $headEntry->id, 'status' => 'published'])->assertOk()
            ->assertJsonPath('data.head', $headEntry->display_name)->assertJsonPath('data.head_directory_entry_id', $headEntry->id);
        $this->putJson("/api/admin/hr/departments/{$this->dept->id}", ['head_directory_entry_id' => 99999])->assertStatus(422)->assertJsonValidationErrors('head_directory_entry_id');

        $this->actingAs($this->makeUser('employee'));
        $this->assertSame($headEntry->display_name, collect($this->getJson('/api/company/departments')->json('data'))->firstWhere('name', 'Operations')['head']);

        $this->actingAs($this->makeUser('hr'));
        $this->putJson("/api/admin/hr/departments/{$this->dept->id}", ['head_directory_entry_id' => null, 'head_display' => 'Typed Name'])->assertOk()->assertJsonPath('data.head', 'Typed Name');
        $this->assertDatabaseHas('audit_logs', ['action' => 'DEPARTMENT_UPDATED']);
        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->putJson("/api/admin/hr/departments/{$this->dept->id}", ['head_directory_entry_id' => $headEntry->id])->assertStatus(403);
        }
    }

    // --- Approval route administration --------------------------------------------------------------------------------------

    public function test_only_hr_and_admin_manage_routes_and_the_data_is_validated(): void
    {
        [, $approver] = $this->person('manager', null, 'Approver');
        $unlinked = DirectoryEntry::query()->forceCreate(['employee_id' => 'EMP-7000', 'display_name' => 'No Account', 'source' => 'manual', 'verification' => 'unverified']);
        $payload = ['department_id' => $this->dept->id, 'approver_directory_entry_id' => $approver->id];

        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/hr/approval-routes')->assertStatus(403);
            $this->postJson('/api/admin/hr/approval-routes', $payload)->assertStatus(403);
        }

        $this->actingAs($this->makeUser('hr'));
        $created = $this->postJson('/api/admin/hr/approval-routes', $payload)->assertCreated();
        $created->assertJsonPath('data.request_type', 'All request types')->assertJsonPath('data.can_act', true)->assertJsonPath('data.is_active', true);
        $id = $created->json('data.id');
        $this->postJson('/api/admin/hr/approval-routes', $payload)->assertStatus(422)->assertJsonValidationErrors('request_type_id'); // duplicate (department, all types)
        $this->postJson('/api/admin/hr/approval-routes', [...$payload, 'approver_directory_entry_id' => $unlinked->id])->assertStatus(422)->assertJsonValidationErrors('approver_directory_entry_id');
        $this->postJson('/api/admin/hr/approval-routes', ['department_id' => 9999, 'approver_directory_entry_id' => $approver->id])->assertStatus(422)->assertJsonValidationErrors('department_id');
        $this->postJson('/api/admin/hr/approval-routes', [])->assertStatus(422);
        $this->putJson("/api/admin/hr/approval-routes/{$id}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertSame(1, $this->getJson('/api/admin/hr/approval-routes?department_id='.$this->dept->id)->json('meta.total'));
        $this->assertContains('APPROVAL_ROUTE_CREATED', AuditLog::pluck('action')->all());
        $this->deleteJson("/api/admin/hr/approval-routes/{$id}")->assertNoContent();
        $this->assertSame(0, RequestApprovalRoute::count());
        $this->assertContains('APPROVAL_ROUTE_DELETED', AuditLog::pluck('action')->all());
    }

    public function test_a_route_to_someone_without_the_manager_permission_is_flagged_and_does_nothing(): void
    {
        [$employeeApprover, $entry] = $this->person('employee', null, 'Plain Employee');
        $this->actingAs($this->makeUser('hr'));

        $this->postJson('/api/admin/hr/approval-routes', ['department_id' => $this->dept->id, 'approver_directory_entry_id' => $entry->id])->assertCreated()->assertJsonPath('data.can_act', false);

        [$requester] = $this->person('employee');
        $id = $this->request($requester);
        $this->actingAs($employeeApprover);
        $this->getJson("/api/requests/{$id}")->assertStatus(404);
        $this->getJson('/api/requests?scope=review')->assertStatus(403);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertStatus(403);
        $this->assertSame('submitted', EmployeeRequest::find($id)->status->value);
        $this->assertSame(0, PortalNotification::where('user_id', $employeeApprover->id)->count());
    }

    // --- Option 2: routing in action ------------------------------------------------------------------------------------------

    public function test_the_department_head_reviews_requests_from_their_department_only(): void
    {
        [$manager, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$requester] = $this->person('employee');
        $otherDept = Department::query()->forceCreate(['name' => 'Sales', 'status' => 'published']);
        [$outsider] = $this->person('employee', $otherDept);
        $mine = $this->request($requester, null, 'From my department');
        $theirs = $this->request($outsider, null, 'From another department');

        $this->actingAs($manager);
        $this->assertSame(['From my department'], collect($this->getJson('/api/requests?scope=review')->assertOk()->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$mine}")->assertOk()->assertJsonPath('data.subject', 'From my department');
        $this->getJson("/api/requests/{$theirs}")->assertStatus(404);
        $this->postJson("/api/requests/{$theirs}/status", ['status' => 'approved'])->assertStatus(404);
        $this->assertSame(1, PortalNotification::where('user_id', $manager->id)->where('title', 'Request to review')->count());
        $this->assertSame(1, $this->getJson('/api/admin/dashboard')->assertOk()->json('data.requests.pending'));
        $this->getJson('/api/admin/users')->assertStatus(403); // routing grants no other admin access
    }

    public function test_an_approver_can_move_a_request_forward_but_not_complete_it_and_the_requester_is_told(): void
    {
        [$manager, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$requester] = $this->person('employee');
        $id = $this->request($requester);

        $this->actingAs($manager);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'under-review', 'comment' => 'Checking'])->assertOk();
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved', 'comment' => 'Fine by me'])->assertOk()->assertJsonPath('data.status', 'approved');
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->assertSame('approved', EmployeeRequest::find($id)->status->value);
        $this->assertContains('REQUEST_STATUS_CHANGED', AuditLog::pluck('action')->all());
        $this->assertTrue(PortalNotification::where('user_id', $requester->id)->where('message', 'like', '%approved%')->exists());

        // HR or an administrator finishes it.
        $this->actingAs($this->makeUser('admin'));
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed'])->assertOk();
    }

    public function test_nobody_approves_their_own_request_and_unrouted_managers_see_nothing(): void
    {
        [$manager, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$otherManager] = $this->person('manager', null, 'Colleague');
        $own = $this->request($manager, null, 'My own request');
        [$requester] = $this->person('employee');
        $theirs = $this->request($requester);

        $this->actingAs($manager);
        $this->assertNotContains('My own request', collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->postJson("/api/requests/{$own}/status", ['status' => 'approved'])->assertStatus(403); // visible as the owner, but cannot review it
        $this->assertSame('submitted', EmployeeRequest::find($own)->status->value);

        $this->actingAs($otherManager);
        $this->assertCount(0, $this->getJson('/api/requests?scope=review')->assertOk()->json('data'));
        $this->getJson("/api/requests/{$theirs}")->assertStatus(404);
        $this->postJson("/api/requests/{$theirs}/status", ['status' => 'approved'])->assertStatus(404);
        $this->assertSame('submitted', EmployeeRequest::find($theirs)->status->value);
    }

    public function test_type_specific_routes_override_the_general_route_and_inactive_routes_are_ignored(): void
    {
        [$general, $generalEntry] = $this->person('manager', null, 'General');
        [$special, $specialEntry] = $this->person('manager', null, 'Special');
        [$requester] = $this->person('employee');
        $typeA = RequestType::factory()->create(['name' => 'Type A']);
        $typeB = RequestType::factory()->create(['name' => 'Type B']);
        RequestApprovalRoute::query()->forceCreate(['department_id' => $this->dept->id, 'request_type_id' => null, 'approver_directory_entry_id' => $generalEntry->id, 'is_active' => true]);
        RequestApprovalRoute::query()->forceCreate(['department_id' => $this->dept->id, 'request_type_id' => $typeA->id, 'approver_directory_entry_id' => $specialEntry->id, 'is_active' => true]);
        $a = $this->request($requester, $typeA, 'Needs special');
        $b = $this->request($requester, $typeB, 'Needs general');

        $subjects = fn (User $u) => collect($this->actingAs($u)->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all();
        $this->assertSame(['Needs general'], $subjects($general), 'the general approver does not get the type that has its own route');
        $this->assertSame(['Needs special'], $subjects($special));
        $this->getJson("/api/requests/{$a}")->assertOk();
        $this->getJson("/api/requests/{$b}")->assertStatus(404);
        $this->actingAs($general);
        $this->getJson("/api/requests/{$a}")->assertStatus(404);

        RequestApprovalRoute::query()->where('request_type_id', $typeA->id)->update(['is_active' => false]);
        $this->assertEqualsCanonicalizing(['Needs special', 'Needs general'], $subjects($general), 'with the special route off, the general approver gets both');
        $this->assertSame([], $subjects($special));
    }

    public function test_requesters_without_a_directory_entry_or_department_are_not_routed(): void
    {
        [$manager, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        $noEntry = $this->makeUser('employee');
        $noDept = $this->makeUser('employee');
        DirectoryEntry::query()->forceCreate(['employee_id' => $noDept->employee_id, 'user_id' => $noDept->id, 'display_name' => 'No Dept', 'source' => 'manual', 'verification' => 'unverified']);
        $a = $this->request($noEntry);
        $b = $this->request($noDept);

        $this->actingAs($manager);
        $this->assertCount(0, $this->getJson('/api/requests?scope=review')->json('data'));
        $this->getJson("/api/requests/{$a}")->assertStatus(404);
        $this->getJson("/api/requests/{$b}")->assertStatus(404);
        $this->assertSame(0, PortalNotification::where('user_id', $manager->id)->count());
    }

    public function test_a_suspended_approver_cannot_act(): void
    {
        [$manager, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$requester] = $this->person('employee');
        $id = $this->request($requester);

        $manager->forceFill(['status' => 'suspended'])->save();
        $this->actingAs($manager->fresh());
        $this->getJson('/api/requests?scope=review')->assertStatus(403);
        $this->getJson("/api/requests/{$id}")->assertStatus(403); // a suspended account holds no permissions at all
    }

    public function test_hr_still_sees_hr_requests_and_routing_does_not_widen_their_access(): void
    {
        [$requester] = $this->person('employee');
        $hrType = RequestType::factory()->create(['category' => 'hr']);
        $itType = RequestType::factory()->create(['category' => 'it']);
        $hrRequest = $this->request($requester, $hrType, 'HR matter');
        $itRequest = $this->request($requester, $itType, 'IT matter');

        $this->actingAs($this->makeUser('hr'));
        $this->assertSame(['HR matter'], collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$itRequest}")->assertStatus(404);
        $this->assertNotNull($hrRequest);
    }

    // --- Company-wide fallback approver --------------------------------------------------------------------------------------

    /** HR manager = hr + manager roles, linked directory entry in the HR department. */
    private function hrManager(): array
    {
        $hrDept = Department::query()->forceCreate(['name' => 'Human Resources', 'status' => 'published']);
        [$user, $entry] = $this->person('hr', $hrDept, 'HR Manager');
        $user->roles()->attach(\App\Models\Role::where('name', 'manager')->first());

        return [$user->fresh(), $entry];
    }

    private function setFallback(?int $primary, ?int $secondary = null): void
    {
        $this->actingAs($this->makeUser('hr'));
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => $primary, 'secondary_directory_entry_id' => $secondary])->assertOk();
    }

    public function test_a_department_without_a_manager_routes_to_the_fallback_approver(): void
    {
        [$hrManager, $hrEntry] = $this->hrManager();
        [$itStaff] = $this->person('employee', null, 'IT Staff'); // the IT department has no head and no route
        $leaveType = RequestType::factory()->create(['category' => 'hr', 'name' => 'Leave Request']);
        $equipmentType = RequestType::factory()->create(['category' => 'it', 'name' => 'IT Equipment']);

        $before = $this->request($itStaff, $equipmentType, 'Needs equipment');
        $this->actingAs($hrManager);
        $this->assertCount(0, collect($this->getJson('/api/requests?scope=review')->json('data'))->where('subject', 'Needs equipment'), 'no fallback yet: an IT-type request reaches nobody');
        $this->getJson("/api/requests/{$before}")->assertStatus(404);

        $this->setFallback($hrEntry->id);
        $leave = $this->request($itStaff, $leaveType, 'Leave please');
        $equipment = $this->request($itStaff, $equipmentType, 'More equipment');

        $this->actingAs($hrManager);
        $subjects = collect($this->getJson('/api/requests?scope=review')->assertOk()->json('data'))->pluck('subject')->all();
        $this->assertEqualsCanonicalizing(['Needs equipment', 'Leave please', 'More equipment'], $subjects);
        $this->getJson("/api/requests/{$equipment}")->assertOk();
        $this->postJson("/api/requests/{$equipment}/status", ['status' => 'approved', 'comment' => 'OK'])->assertOk()->assertJsonPath('data.status', 'approved');
        $this->postJson("/api/requests/{$leave}/status", ['status' => 'under-review'])->assertOk();
        $this->assertSame(2, PortalNotification::where('user_id', $hrManager->id)->where('title', 'Request to review')->count(), 'only requests filed after the fallback was set are notified');
        $this->assertTrue(PortalNotification::where('user_id', $itStaff->id)->where('message', 'like', '%approved%')->exists());
    }

    public function test_the_fallback_is_only_used_when_the_department_has_nobody_who_can_act(): void
    {
        [$hrManager, $hrEntry] = $this->hrManager();
        [$head, $headEntry] = $this->person('manager', null, 'Dept Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        $this->setFallback($hrEntry->id);
        [$staff] = $this->person('employee');
        $it = RequestType::factory()->create(['category' => 'it']); // an HR manager sees HR-type requests anyway; use a type only routing can reach
        $id = $this->request($staff, $it, 'Handled by head');

        $this->actingAs($head);
        $this->assertSame(['Handled by head'], collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->actingAs($hrManager);
        $this->assertNotContains('Handled by head', collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$id}")->assertStatus(404);

        // The head is the requester: nobody approves their own request, so it goes to the fallback.
        $own = $this->request($head, $it, 'Head asks');
        $this->actingAs($hrManager);
        $this->assertContains('Head asks', collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$own}")->assertOk();

        // The head loses the manager role: their department falls back too.
        $head->roles()->detach(\App\Models\Role::where('name', 'manager')->first());
        $this->actingAs($hrManager);
        $this->assertContains('Handled by head', collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$id}")->assertOk();
    }

    public function test_the_secondary_takes_over_when_the_primary_is_the_requester_or_cannot_act(): void
    {
        [$primary, $primaryEntry] = $this->person('manager', null, 'Primary');
        [$secondary, $secondaryEntry] = $this->person('manager', null, 'Secondary');
        $noDept = Department::query()->forceCreate(['name' => 'No Manager Dept', 'status' => 'published']);
        [$staff] = $this->person('employee', $noDept);
        $this->setFallback($primaryEntry->id, $secondaryEntry->id);

        $normal = $this->request($staff, null, 'Normal');
        $primaries = $this->request($primary, null, 'Primary asks');

        $subjects = fn (User $u) => collect($this->actingAs($u)->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all();
        $this->assertContains('Normal', $subjects($primary));
        $this->assertNotContains('Normal', $subjects($secondary), 'the secondary is not involved while the primary can act');
        $this->assertSame(['Primary asks'], array_values(array_filter($subjects($secondary), fn ($s) => $s !== 'Normal')));
        $this->actingAs($secondary);
        $this->getJson("/api/requests/{$primaries}")->assertOk();
        $this->getJson("/api/requests/{$normal}")->assertStatus(404);
        $this->postJson("/api/requests/{$primaries}/status", ['status' => 'approved'])->assertOk();

        // The primary stops being able to act: the secondary becomes the approver for everything.
        $primary->roles()->detach(\App\Models\Role::where('name', 'manager')->first());
        $this->assertEqualsCanonicalizing(['Normal', 'Primary asks'], $subjects($secondary));
    }

    public function test_requesters_without_a_directory_entry_use_the_fallback(): void
    {
        [$manager, $entry] = $this->person('manager', null, 'Fallback');
        $this->setFallback($entry->id);
        $noEntry = $this->makeUser('employee');
        $id = $this->request($noEntry, null, 'Nobody knows my department');

        $this->actingAs($manager);
        $this->assertSame(['Nobody knows my department'], collect($this->getJson('/api/requests?scope=review')->json('data'))->pluck('subject')->all());
        $this->getJson("/api/requests/{$id}")->assertOk();
    }

    public function test_an_ineligible_fallback_approver_does_nothing(): void
    {
        [$plain, $entry] = $this->person('employee', null, 'Not A Manager');
        $this->setFallback($entry->id);
        [$staff] = $this->person('employee');
        $id = $this->request($staff);

        $this->actingAs($plain);
        $this->getJson("/api/requests/{$id}")->assertStatus(404);
        $this->getJson('/api/requests?scope=review')->assertStatus(403);
        $this->assertSame(0, PortalNotification::where('user_id', $plain->id)->count());
        $this->actingAs($this->makeUser('hr'));
        $this->getJson('/api/admin/hr/approval-fallback')->assertOk()->assertJsonPath('data.primary.can_act', false);
    }

    public function test_only_hr_and_admin_configure_the_fallback_and_it_is_validated_and_audited(): void
    {
        [, $a] = $this->person('manager', null, 'A');
        [, $b] = $this->person('manager', null, 'B');
        $unlinked = DirectoryEntry::query()->forceCreate(['employee_id' => 'EMP-7100', 'display_name' => 'No Account', 'source' => 'manual', 'verification' => 'unverified']);

        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/hr/approval-fallback')->assertStatus(403);
            $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => $a->id])->assertStatus(403);
        }

        $this->actingAs($this->makeUser('hr'));
        $this->getJson('/api/admin/hr/approval-fallback')->assertOk()->assertJsonPath('data.primary', null)->assertJsonPath('data.secondary', null);
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => $a->id, 'secondary_directory_entry_id' => $b->id])->assertOk()
            ->assertJsonPath('data.primary.name', $a->display_name)->assertJsonPath('data.primary.can_act', true)->assertJsonPath('data.secondary.name', $b->display_name);
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => $a->id, 'secondary_directory_entry_id' => $a->id])->assertStatus(422)->assertJsonValidationErrors('secondary_directory_entry_id');
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => null, 'secondary_directory_entry_id' => $b->id])->assertStatus(422)->assertJsonValidationErrors('secondary_directory_entry_id');
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => $unlinked->id])->assertStatus(422)->assertJsonValidationErrors('primary_directory_entry_id');
        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => 99999])->assertStatus(422);
        $this->putJson('/api/admin/hr/approval-fallback', [])->assertStatus(422);
        $this->assertSame(2, \App\Models\ApprovalFallback::count(), 'failed updates change nothing');

        $this->putJson('/api/admin/hr/approval-fallback', ['primary_directory_entry_id' => null])->assertOk()->assertJsonPath('data.primary', null);
        $this->assertSame(0, \App\Models\ApprovalFallback::count());
        $this->assertSame(2, AuditLog::where('action', 'APPROVAL_FALLBACK_UPDATED')->count());
    }

    public function test_the_review_list_and_the_single_request_check_always_agree(): void
    {
        [$head, $headEntry] = $this->person('manager', null, 'Head');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$fallback, $fallbackEntry] = $this->person('manager', null, 'Fallback');
        [$secondary, $secondaryEntry] = $this->person('manager', null, 'Secondary');
        $special = Department::query()->forceCreate(['name' => 'Special', 'status' => 'published']);
        [$special1, $special1Entry] = $this->person('manager', $special, 'Special Head');
        $typeA = RequestType::factory()->create();
        $typeB = RequestType::factory()->create();
        RequestApprovalRoute::query()->forceCreate(['department_id' => $special->id, 'request_type_id' => $typeA->id, 'approver_directory_entry_id' => $special1Entry->id, 'is_active' => true]);
        $this->setFallback($fallbackEntry->id, $secondaryEntry->id);

        $people = [$head, $fallback, $secondary, $special1];
        [$a] = $this->person('employee');
        [$b] = $this->person('employee', $special);
        $requesters = [$a, $b, $head, $fallback, $special1, $this->makeUser('employee')];
        $ids = [];
        foreach ($requesters as $r) {
            foreach ([$typeA, $typeB] as $t) {
                $ids[] = $this->request($r, $t);
            }
        }

        $routing = app(\App\Services\ApprovalRouting::class);
        foreach ($people as $person) {
            $viaList = $routing->scopeFor(EmployeeRequest::query(), $person)->pluck('id')->sort()->values()->all();
            $viaCheck = collect($ids)->filter(fn ($id) => $routing->isApproverOf($person, EmployeeRequest::find($id)))->sort()->values()->all();
            $this->assertSame($viaCheck, $viaList, "list and check disagree for user {$person->employee_id}");
        }
        // Every request has exactly one approver (or none), never two.
        foreach ($ids as $id) {
            $this->assertLessThanOrEqual(1, collect($people)->filter(fn ($p) => $routing->isApproverOf($p, EmployeeRequest::find($id)))->count());
        }
    }
}
