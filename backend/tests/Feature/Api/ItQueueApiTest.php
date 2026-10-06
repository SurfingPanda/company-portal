<?php

namespace Tests\Feature\Api;

use App\Enums\RequestCategory;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\PortalNotification;
use App\Models\RequestType;
use App\Models\Role;
use App\Models\User;

/** The IT request queue (IT-type requests) and IT ownership of helpdesk tickets. */
class ItQueueApiTest extends ApiTestCase
{
    private function type(string $category, bool $approval = false, string $name = 'Type'): RequestType
    {
        return RequestType::factory()->create(['category' => $category, 'requires_approval' => $approval, 'name' => $name.' '.uniqid()]);
    }

    private function submit(User $owner, RequestType $type, string $subject): int
    {
        $this->actingAs($owner);

        return $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => $subject])->assertCreated()->json('data.id');
    }

    private function subjects(User $user): array
    {
        return collect($this->actingAs($user)->getJson('/api/requests?scope=review')->assertOk()->json('data'))->pluck('subject')->all();
    }

    // --- IT request queue -------------------------------------------------------------------------------------------------

    public function test_it_staff_see_only_it_type_requests_and_are_notified(): void
    {
        $it = $this->makeUser('it');
        $itSecond = $this->makeUser('it');
        $employee = $this->makeUser('employee');
        $itRequest = $this->submit($employee, $this->type('it'), 'Need a laptop');
        $hrRequest = $this->submit($employee, $this->type('hr'), 'Certificate please');
        $other = $this->submit($employee, $this->type('administration'), 'Office chair');

        $this->assertSame(['Need a laptop'], $this->subjects($it));
        $this->getJson("/api/requests/{$itRequest}")->assertOk();
        foreach ([$hrRequest, $other] as $id) {
            $this->getJson("/api/requests/{$id}")->assertStatus(404);
            $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertStatus(404);
        }
        foreach ([$it, $itSecond] as $staff) {
            $this->assertSame(1, PortalNotification::where('user_id', $staff->id)->where('title', 'New IT request')->count());
        }
        $this->assertSame(0, PortalNotification::where('user_id', $employee->id)->where('title', 'New IT request')->count());
        $this->assertSame(1, $this->actingAs($it)->getJson('/api/admin/dashboard')->json('data.requests.pending'));
    }

    public function test_it_staff_work_an_it_request_through_to_completion_without_an_approval_requirement(): void
    {
        $it = $this->makeUser('it');
        $employee = $this->makeUser('employee');
        $id = $this->submit($employee, $this->type('it', false), 'Printer setup');

        $this->actingAs($it);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'under-review', 'comment' => 'Looking'])->assertOk();
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertOk();
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed', 'comment' => 'Done', 'internal' => false])->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertTrue(PortalNotification::where('user_id', $employee->id)->where('message', 'like', '%completed%')->exists());
        $this->assertContains('REQUEST_STATUS_CHANGED', AuditLog::pluck('action')->all());
        $this->postJson("/api/requests/{$id}/status", ['status' => 'under-review'])->assertStatus(409);
    }

    public function test_when_approval_is_required_the_approver_decides_and_it_fulfils(): void
    {
        $dept = Department::query()->forceCreate(['name' => 'Operations', 'status' => 'published']);
        $manager = $this->makeUser('manager');
        $managerEntry = DirectoryEntry::query()->forceCreate(['employee_id' => $manager->employee_id, 'user_id' => $manager->id, 'display_name' => 'Dept Manager', 'department_id' => $dept->id, 'source' => 'manual', 'verification' => 'unverified']);
        $dept->forceFill(['head_directory_entry_id' => $managerEntry->id])->save();
        $employee = $this->makeUser('employee');
        DirectoryEntry::query()->forceCreate(['employee_id' => $employee->employee_id, 'user_id' => $employee->id, 'display_name' => 'Requester', 'department_id' => $dept->id, 'source' => 'manual', 'verification' => 'unverified']);
        $it = $this->makeUser('it');
        $id = $this->submit($employee, $this->type('it', true, 'IT Equipment'), 'Monitor please');

        // Needs approval and an approver exists: IT is not asked yet, the department manager is.
        $this->assertSame(0, PortalNotification::where('user_id', $it->id)->where('title', 'New IT request')->count());
        $this->assertSame(1, PortalNotification::where('user_id', $manager->id)->where('title', 'Request to review')->count());

        $this->actingAs($it);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->postJson("/api/requests/{$id}/status", ['status' => 'rejected'])->assertStatus(422);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed'])->assertStatus(422)->assertJsonValidationErrors('status');
        $this->postJson("/api/requests/{$id}/status", ['status' => 'under-review'])->assertOk();

        $this->actingAs($manager);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved', 'comment' => 'Yes'])->assertOk();
        $this->assertSame(1, PortalNotification::where('user_id', $it->id)->where('title', 'Approved IT request')->count(), 'IT is told once it is approved');

        $this->actingAs($it);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed', 'comment' => 'Delivered'])->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertSame('completed', EmployeeRequest::find($id)->status->value);
    }

    public function test_without_any_approver_it_decides_an_approval_type_request_itself(): void
    {
        $it = $this->makeUser('it');
        $employee = $this->makeUser('employee'); // no directory entry, no fallback: nobody can approve
        $id = $this->submit($employee, $this->type('it', true), 'Access please');

        $this->assertSame(1, PortalNotification::where('user_id', $it->id)->where('title', 'New IT request')->count());
        $this->actingAs($it);
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertOk();
        $this->postJson("/api/requests/{$id}/status", ['status' => 'completed'])->assertOk();
    }

    public function test_it_staff_never_review_their_own_requests_and_others_cannot_use_the_queue(): void
    {
        $it = $this->makeUser('it');
        $mine = $this->submit($it, $this->type('it'), 'My own');
        $this->assertSame([], $this->subjects($it));
        $this->postJson("/api/requests/{$mine}/status", ['status' => 'approved'])->assertStatus(403);
        $this->assertSame('submitted', EmployeeRequest::find($mine)->status->value);

        $other = $this->submit($this->makeUser('employee'), $this->type('it'), 'Someone else');
        foreach (['employee', 'hr', 'manager'] as $role) {
            $user = $this->makeUser($role);
            $this->actingAs($user);
            $this->getJson("/api/requests/{$other}")->assertStatus(404);
            $this->postJson("/api/requests/{$other}/status", ['status' => 'approved'])->assertStatus($role === 'employee' ? 403 : 404);
        }
    }

    public function test_hr_still_cannot_see_it_requests_and_admins_see_everything(): void
    {
        $employee = $this->makeUser('employee');
        $itId = $this->submit($employee, $this->type('it'), 'IT thing');
        $this->submit($employee, $this->type('hr'), 'HR thing');

        $this->assertSame(['HR thing'], $this->subjects($this->makeUser('hr')));
        $this->getJson("/api/requests/{$itId}")->assertStatus(404);
        $this->assertEqualsCanonicalizing(['IT thing', 'HR thing'], $this->subjects($this->makeUser('admin')));
        $this->assertSame(RequestCategory::It, EmployeeRequest::find($itId)->requestType->category);
    }

    // --- Helpdesk tickets: IT sees them and takes ownership -------------------------------------------------------------------

    private function ticket(User $owner, string $subject = 'Laptop broken'): int
    {
        $this->actingAs($owner);

        return $this->postJson('/api/helpdesk/tickets', ['type' => 'incident', 'category' => 'hardware', 'subject' => $subject, 'description' => 'It does not start.'])->assertCreated()->json('data.id');
    }

    public function test_it_staff_see_every_ticket_are_told_of_new_ones_and_can_take_ownership(): void
    {
        $it = $this->makeUser('it');
        $itSecond = $this->makeUser('it');
        $employee = $this->makeUser('employee');
        $id = $this->ticket($employee);

        foreach ([$it, $itSecond] as $staff) {
            $this->assertSame(1, PortalNotification::where('user_id', $staff->id)->where('title', 'New helpdesk ticket')->count());
        }
        $this->assertSame(0, PortalNotification::where('user_id', $employee->id)->where('title', 'New helpdesk ticket')->count());

        $this->actingAs($it);
        $this->assertSame(1, $this->getJson('/api/helpdesk/tickets?scope=all&assigned=unassigned')->assertOk()->json('meta.total'));
        $this->assertSame(0, $this->getJson('/api/helpdesk/tickets?scope=all&assigned=me')->json('meta.total'));
        $this->getJson("/api/helpdesk/tickets/{$id}")->assertOk()->assertJsonPath('data.assigned_to', null);

        $this->postJson("/api/helpdesk/tickets/{$id}/claim")->assertOk()->assertJsonPath('data.assigned_to', $it->employee_id)->assertJsonPath('data.status', 'open');
        $this->postJson("/api/helpdesk/tickets/{$id}/claim")->assertOk(); // idempotent for the owner
        $this->assertSame(1, $this->getJson('/api/helpdesk/tickets?scope=all&assigned=me')->json('meta.total'));
        $this->assertSame(0, $this->getJson('/api/helpdesk/tickets?scope=all&assigned=unassigned')->json('meta.total'));
        $this->assertTrue(PortalNotification::where('user_id', $employee->id)->where('message', 'like', '%taken it%')->exists());
        $this->assertDatabaseHas('audit_logs', ['action' => 'HELPDESK_TICKET_ASSIGNED', 'actor_user_id' => $it->id]);

        // A colleague cannot silently take it over, but can still see it, reply, and be assigned through the update endpoint.
        $this->actingAs($itSecond);
        $this->postJson("/api/helpdesk/tickets/{$id}/claim")->assertStatus(409);
        $this->getJson("/api/helpdesk/tickets/{$id}")->assertOk();
        $this->postJson("/api/helpdesk/tickets/{$id}/replies", ['message' => 'Can I help?'])->assertCreated();
        $this->patchJson("/api/helpdesk/tickets/{$id}", ['assigned_to' => $itSecond->employee_id])->assertOk()->assertJsonPath('data.assigned_to', $itSecond->employee_id);
    }

    public function test_only_it_staff_can_claim_and_closed_tickets_cannot_be_claimed(): void
    {
        $employee = $this->makeUser('employee');
        $id = $this->ticket($employee);
        foreach (['employee', 'hr', 'manager'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->postJson("/api/helpdesk/tickets/{$id}/claim")->assertStatus(403);
            $this->getJson("/api/helpdesk/tickets/{$id}")->assertStatus(404);
        }
        $this->assertNull(HelpdeskTicket::find($id)->assigned_to);

        $this->actingAs($employee);
        $this->postJson("/api/helpdesk/tickets/{$id}/cancel")->assertOk();
        $this->actingAs($this->makeUser('it'));
        $this->postJson("/api/helpdesk/tickets/{$id}/claim")->assertStatus(409);
        $this->postJson('/api/helpdesk/tickets/99999/claim')->assertStatus(404);
    }

    public function test_the_helpdesk_queue_filter_is_validated_and_ignored_outside_staff_scope(): void
    {
        $it = $this->makeUser('it');
        $this->ticket($this->makeUser('employee'));
        $this->actingAs($it);
        $this->getJson('/api/helpdesk/tickets?scope=all&assigned=everyone')->assertStatus(422);
        // Without scope=all the list is the staff member's own tickets, so the queue filter does not widen it.
        $this->assertSame(0, $this->getJson('/api/helpdesk/tickets?assigned=unassigned')->json('meta.total'));
        $this->assertNotNull(Role::where('name', 'it')->first());
    }
}
