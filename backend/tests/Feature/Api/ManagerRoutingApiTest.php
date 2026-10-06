<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\ApprovalFallback;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\RequestApprovalRoute;
use App\Models\RequestType;
use App\Models\User;
use App\Services\ApprovalRouting;

/** Approval routing follows the manager on the employee record (manager_id), with HR routes as the exception. */
class ManagerRoutingApiTest extends ApiTestCase
{
    private Department $dept;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dept = Department::query()->forceCreate(['name' => 'Operations', 'status' => 'published']);
    }

    /** @return array{0: User, 1: DirectoryEntry} */
    private function person(string $role, ?DirectoryEntry $manager = null, array $user = []): array
    {
        static $n = 0;
        $n++;
        $u = $this->makeUser($role, $user);
        $e = DirectoryEntry::query()->forceCreate([
            'employee_id' => $u->employee_id, 'user_id' => $u->id, 'display_name' => "Person {$n}", 'department_id' => $this->dept->id,
            'manager_id' => $manager?->id, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified',
        ]);

        return [$u, $e];
    }

    private function fileRequest(User $owner, ?RequestType $type = null, string $subject = 'Please review'): int
    {
        $this->actingAs($owner);

        return $this->postJson('/api/requests', ['request_type_id' => ($type ?? RequestType::factory()->create())->id, 'subject' => $subject])->assertCreated()->json('data.id');
    }

    private function reviewList(User $user): array
    {
        $this->actingAs($user);

        return collect($this->getJson('/api/requests?scope=review')->assertOk()->json('data'))->pluck('subject')->all();
    }

    private function whoReviews(User $requester): ?int
    {
        return app(ApprovalRouting::class)->explain($requester)['approver']?->id;
    }

    public function test_requests_go_to_the_employees_own_manager_and_to_nobody_elses_queue(): void
    {
        [$boss, $bossEntry] = $this->person('manager');
        [$otherBoss] = $this->person('manager');
        [$worker] = $this->person('employee', $bossEntry);

        $this->fileRequest($worker, null, 'Leave please');

        $this->assertSame(['Leave please'], $this->reviewList($boss));
        $this->assertSame([], $this->reviewList($otherBoss), 'another manager does not see it');
        $this->assertSame([$boss->id, 'manager'], [app(ApprovalRouting::class)->explain($worker)['approver']->id, app(ApprovalRouting::class)->explain($worker)['via']]);
    }

    public function test_it_skips_a_manager_who_cannot_act_and_goes_up_the_chain(): void
    {
        [$director, $directorEntry] = $this->person('manager');
        [$noRole, $noRoleEntry] = $this->person('employee', $directorEntry);             // a "manager" without the manager role
        [$disabled, $disabledEntry] = $this->person('manager', $noRoleEntry, ['status' => UserStatus::Inactive]);
        [$worker] = $this->person('employee', $disabledEntry);

        $this->assertSame($director->id, $this->whoReviews($worker));
        $this->fileRequest($worker, null, 'Escalated');
        $this->assertSame(['Escalated'], $this->reviewList($director));
        $this->assertSame([], $this->reviewList($this->makeUser('manager')));
    }

    public function test_hr_routes_override_the_manager_and_an_unusable_route_falls_back_to_the_manager(): void
    {
        [$boss, $bossEntry] = $this->person('manager');
        [$hrApprover, $hrApproverEntry] = $this->person('manager');
        [$worker] = $this->person('employee', $bossEntry);
        $typeA = RequestType::factory()->create();
        $typeB = RequestType::factory()->create();
        RequestApprovalRoute::query()->forceCreate(['department_id' => $this->dept->id, 'request_type_id' => $typeA->id, 'approver_directory_entry_id' => $hrApproverEntry->id, 'is_active' => true]);

        $this->fileRequest($worker, $typeA, 'Special type');
        $this->fileRequest($worker, $typeB, 'Normal type');
        $this->assertSame(['Special type'], $this->reviewList($hrApprover));
        $this->assertSame(['Normal type'], $this->reviewList($boss));

        // The route's approver can no longer act: the manager takes the type back.
        $hrApprover->forceFill(['status' => UserStatus::Suspended->value])->save();
        $this->assertEqualsCanonicalizing(['Special type', 'Normal type'], $this->reviewList($boss));
    }

    public function test_without_a_usable_manager_it_uses_the_department_head_then_the_fallback(): void
    {
        [$head, $headEntry] = $this->person('manager');
        $this->dept->forceFill(['head_directory_entry_id' => $headEntry->id])->save();
        [$fallback, $fallbackEntry] = $this->person('manager');
        ApprovalFallback::query()->forceCreate(['priority' => 1, 'approver_directory_entry_id' => $fallbackEntry->id]);

        [$noManager] = $this->person('employee');
        [$weakManager, $weakEntry] = $this->person('employee');          // cannot act
        [$underWeak] = $this->person('employee', $weakEntry);
        $this->assertSame($head->id, $this->whoReviews($noManager));
        $this->assertSame($head->id, $this->whoReviews($underWeak));
        $this->assertSame('head', app(ApprovalRouting::class)->explain($noManager)['via']);

        // The head's own requests, and people with no employee record, go to the fallback.
        $this->assertSame($fallback->id, $this->whoReviews($head));
        $this->assertSame($fallback->id, $this->whoReviews($this->makeUser('employee')));
        $this->assertSame('fallback', app(ApprovalRouting::class)->explain($head)['via']);

        $this->fileRequest($noManager, null, 'Head decides');
        $this->fileRequest($head, null, 'Head asks');
        $this->assertSame(['Head decides'], $this->reviewList($head));
        $this->assertSame(['Head asks'], $this->reviewList($fallback));
    }

    public function test_a_reporting_loop_in_the_data_cannot_hang_routing_and_nobody_approves_themselves(): void
    {
        [$a, $aEntry] = $this->person('manager');
        [$b, $bEntry] = $this->person('manager', $aEntry);
        $aEntry->forceFill(['manager_id' => $bEntry->id])->save();                // A and B report to each other

        $this->assertSame($b->id, $this->whoReviews($a));
        $this->assertSame($a->id, $this->whoReviews($b));
        $selfManaged = $this->person('manager');
        $selfManaged[1]->forceFill(['manager_id' => $selfManaged[1]->id])->save();
        $this->assertNotSame($selfManaged[0]->id, $this->whoReviews($selfManaged[0]));

        $this->fileRequest($a, null, 'A asks');
        $this->assertSame([], $this->reviewList($a));
        $this->assertSame(['A asks'], $this->reviewList($b));
    }

    public function test_review_lists_scale_by_resolving_each_requester_once(): void
    {
        [$boss, $bossEntry] = $this->person('manager');
        $type = RequestType::factory()->create();
        $workers = [];
        for ($i = 0; $i < 12; $i++) {
            [$w] = $this->person('employee', $bossEntry);
            $this->fileRequest($w, $type, "Req {$i}");
            $workers[] = $w;
        }
        [$stranger] = $this->person('employee');
        $this->fileRequest($stranger, $type, 'Not mine');

        $this->actingAs($boss);
        \Illuminate\Support\Facades\DB::enableQueryLog();
        $subjects = collect($this->getJson('/api/requests?scope=review&per_page=50')->assertOk()->json('data'))->pluck('subject');
        $queries = count(\Illuminate\Support\Facades\DB::getQueryLog());
        $this->assertCount(12, $subjects);
        $this->assertNotContains('Not mine', $subjects->all());
        $this->assertLessThan(60, $queries, 'routing must not query once per person');
    }

    public function test_the_manager_change_on_the_employee_record_changes_where_requests_go(): void
    {
        [$first, $firstEntry] = $this->person('manager');
        [$second, $secondEntry] = $this->person('manager');
        [$worker, $workerEntry] = $this->person('employee', $firstEntry);
        $this->fileRequest($worker, null, 'Moving');
        $this->assertSame(['Moving'], $this->reviewList($first));

        $this->actingAs($this->makeUser('hr'));
        $this->putJson("/api/admin/hr/employees/{$workerEntry->id}", ['manager_id' => $secondEntry->id])->assertOk();

        $this->assertSame([], $this->reviewList($first));
        $this->assertSame(['Moving'], $this->reviewList($second));
    }

    public function test_the_organization_chart_data_follows_managers_skips_hidden_and_inactive_people_and_cuts_loops(): void
    {
        $ceo = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-001', 'display_name' => 'Chief', 'job_title' => 'CEO', 'department_id' => $this->dept->id, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified']);
        $hidden = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-002', 'display_name' => 'Hidden Boss', 'manager_id' => $ceo->id, 'is_visible' => false, 'source' => 'manual', 'verification' => 'unverified']);
        $gone = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-003', 'display_name' => 'Left Company', 'manager_id' => $hidden->id, 'employment_status' => 'inactive', 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified']);
        $worker = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-004', 'display_name' => 'Worker', 'job_title' => 'Analyst', 'manager_id' => $gone->id, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified']);
        $a = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-005', 'display_name' => 'Loop A', 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified']);
        $b = DirectoryEntry::query()->forceCreate(['employee_id' => 'ORG-006', 'display_name' => 'Loop B', 'manager_id' => $a->id, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified']);
        $a->forceFill(['manager_id' => $b->id])->save();

        $this->actingAs($this->makeUser('employee'));
        $response = $this->getJson('/api/directory/organization')->assertOk();
        $rows = collect($response->json('data'))->keyBy('employee_id');

        $this->assertEqualsCanonicalizing(['ORG-001', 'ORG-004', 'ORG-005', 'ORG-006'], $rows->keys()->all(), 'hidden and inactive people are not in the chart');
        $this->assertSame('ORG-001', $rows['ORG-004']['manager_employee_id'], 'the line skips the hidden and inactive managers');
        $this->assertNull($rows['ORG-001']['manager_employee_id']);
        $this->assertSame(1, collect([$rows['ORG-005']['manager_employee_id'], $rows['ORG-006']['manager_employee_id']])->filter(fn ($m) => $m === null)->count(), 'a loop is cut in exactly one place');
        $this->assertSame(['employee_id', 'display_name', 'job_title', 'department', 'manager_employee_id'], array_keys($rows['ORG-004']));
        $this->assertFalse($response->json('meta.truncated'));
    }
}
