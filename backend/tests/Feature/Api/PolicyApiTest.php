<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\Policy;
use App\Models\PolicyAcknowledgement;
use App\Models\User;

/** Policy acknowledgements: HR publishes, employees confirm, HR sees who has not. */
class PolicyApiTest extends ApiTestCase
{
    private function person(string $role = 'employee', ?Department $dept = null, array $user = []): User
    {
        static $n = 0;
        $n++;
        $u = $this->makeUser($role, $user);
        DirectoryEntry::query()->forceCreate([
            'employee_id' => $u->employee_id, 'user_id' => $u->id, 'display_name' => "Person {$n}", 'department_id' => $dept?->id, 'company_email' => $u->email,
            'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified',
        ]);

        return $u;
    }

    private function dept(string $name): Department
    {
        return Department::query()->forceCreate(['name' => $name, 'status' => 'published']);
    }

    private function policy(array $attributes = [], array $departments = []): Policy
    {
        $p = new Policy;
        $p->forceFill(['title' => 'Code of Conduct', 'body' => "Be kind.\nBe honest.", 'status' => 'published', 'audience' => 'all', 'version' => 1, 'published_at' => now(), 'version_published_at' => now(), ...$attributes])->save();
        $p->departments()->sync(array_map(fn ($d) => $d->id, $departments));

        return $p;
    }

    private function hr(): User
    {
        $hr = $this->makeUser('hr');
        $this->actingAs($hr);

        return $hr;
    }

    public function test_employees_see_only_published_policies_meant_for_them(): void
    {
        $finance = $this->dept('Finance');
        $sales = $this->dept('Sales');
        $everyone = $this->policy(['title' => 'For everyone']);
        $this->policy(['title' => 'Draft', 'status' => 'draft']);
        $this->policy(['title' => 'Archived', 'status' => 'archived']);
        $this->policy(['title' => 'Finance only', 'audience' => 'departments'], [$finance]);
        $this->policy(['title' => 'Managers only', 'audience' => 'managers']);

        $analyst = $this->person('employee', $finance);
        $this->actingAs($analyst);
        $titles = fn () => collect($this->getJson('/api/policies')->assertOk()->json('data'))->pluck('title')->all();
        $this->assertEqualsCanonicalizing(['For everyone', 'Finance only'], $titles());
        $this->assertSame('For everyone', $this->getJson("/api/policies/{$everyone->id}")->assertOk()->json('data.title'));

        $this->actingAs($this->person('employee', $sales));
        $this->assertSame(['For everyone'], $titles());
        $finOnly = Policy::where('title', 'Finance only')->value('id');
        $this->getJson("/api/policies/{$finOnly}")->assertStatus(404);
        $this->postJson("/api/policies/{$finOnly}/acknowledge", ['version' => 1, 'confirm' => true])->assertStatus(404);

        $this->actingAs($this->person('manager', $sales));
        $this->assertEqualsCanonicalizing(['For everyone', 'Managers only'], $titles());
        $this->assertSame(404, $this->getJson('/api/policies/'.Policy::where('title', 'Draft')->value('id'))->status());
    }

    public function test_acknowledging_records_the_version_once_and_refuses_a_stale_version(): void
    {
        $policy = $this->policy(['due_date' => now()->addDays(3)->toDateString()]);
        $user = $this->person();
        $this->actingAs($user);

        $this->getJson("/api/policies/{$policy->id}")->assertOk()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.body', "Be kind.\nBe honest.");
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1])->assertStatus(422)->assertJsonValidationErrors('confirm');
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => false])->assertStatus(422);
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 7, 'confirm' => true])->assertStatus(409);
        $this->assertSame(0, PolicyAcknowledgement::count());

        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk()->assertJsonPath('data.status', 'acknowledged');
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk(); // idempotent
        $this->assertSame(1, PolicyAcknowledgement::count());
        $ack = PolicyAcknowledgement::firstOrFail();
        $this->assertSame([$policy->id, $user->id, 1], [$ack->policy_id, $ack->user_id, $ack->version]);
        $this->assertDatabaseHas('activity_logs', ['user_id' => $user->id, 'activity_type' => 'policy_acknowledged']);
        $this->assertSame(0, $this->getJson('/api/policies')->json('meta.pending'));

        // Someone else's acknowledgement is not mine.
        $this->actingAs($this->person());
        $this->assertSame('pending', $this->getJson("/api/policies/{$policy->id}")->json('data.status'));
        $this->assertSame(1, $this->getJson('/api/policies')->json('meta.pending'));
    }

    public function test_overdue_status_and_ordering(): void
    {
        $late = $this->policy(['title' => 'Late', 'due_date' => now()->subDay()->toDateString()]);
        $this->policy(['title' => 'Soon', 'due_date' => now()->addWeek()->toDateString()]);
        $done = $this->policy(['title' => 'Done']);
        $user = $this->person();
        $this->actingAs($user);
        $this->postJson("/api/policies/{$done->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk();

        $rows = $this->getJson('/api/policies')->json('data');
        $this->assertSame(['Late', 'Soon', 'Done'], array_column($rows, 'title'));
        $this->assertSame(['overdue', 'pending', 'acknowledged'], array_column($rows, 'status'));
        $this->assertSame(['Late', 'Soon'], array_column($this->getJson('/api/policies?status=pending')->json('data'), 'title'));
        $this->assertSame(['Done'], array_column($this->getJson('/api/policies?status=acknowledged')->json('data'), 'title'));
        $this->getJson('/api/policies?status=bogus')->assertStatus(422);
        $this->assertNotNull($late);
    }

    public function test_a_new_version_asks_everyone_again(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $policy = $this->policy();
        $reader = $this->person();
        $this->actingAs($reader);
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk();

        $hr = $this->hr();
        $this->postJson("/api/admin/policies/{$policy->id}/new-version", ['due_date' => now()->addDays(10)->toDateString()])->assertOk()->assertJsonPath('data.version', 2);
        $this->assertDatabaseHas('audit_logs', ['action' => 'POLICY_NEW_VERSION', 'actor_user_id' => $hr->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $reader->id, 'title' => 'Policy updated']);

        $this->actingAs($reader);
        $this->getJson("/api/policies/{$policy->id}")->assertJsonPath('data.status', 'pending')->assertJsonPath('data.version', 2)->assertJsonPath('data.previously_acknowledged_version', 1);
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertStatus(409); // the old version cannot be confirmed any more
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 2, 'confirm' => true])->assertOk()->assertJsonPath('data.status', 'acknowledged');
        $this->assertSame(2, PolicyAcknowledgement::count(), 'both versions stay on record');

        // Only a published policy has versions.
        $draft = $this->policy(['status' => 'draft']);
        $this->hr();
        $this->postJson("/api/admin/policies/{$draft->id}/new-version")->assertStatus(422);
    }

    public function test_hr_creates_publishes_edits_and_archives_policies_and_departments_are_validated(): void
    {
        $finance = $this->dept('Finance');
        $this->hr();
        $base = ['title' => 'Remote Work Policy', 'body' => 'Work from home on Fridays.', 'summary' => 'Short version.'];

        $this->postJson('/api/admin/policies', [...$base, 'audience' => 'departments'])->assertStatus(422)->assertJsonValidationErrors('department_ids');
        $this->postJson('/api/admin/policies', [...$base, 'audience' => 'departments', 'department_ids' => [99999]])->assertStatus(422);
        $this->postJson('/api/admin/policies', [...$base, 'audience' => 'everyone'])->assertStatus(422)->assertJsonValidationErrors('audience');
        $this->postJson('/api/admin/policies', ['title' => 'No body'])->assertStatus(422)->assertJsonValidationErrors('body');

        $id = $this->postJson('/api/admin/policies', [...$base, 'audience' => 'departments', 'department_ids' => [$finance->id], 'due_date' => now()->addWeek()->toDateString()])
            ->assertCreated()->assertJsonPath('data.status', 'draft')->assertJsonPath('data.version', 1)->assertJsonPath('data.departments', ['Finance'])->assertJsonPath('data.progress', null)->json('data.id');
        $this->assertDatabaseHas('audit_logs', ['action' => 'POLICY_CREATED']);

        // A draft reaches nobody; publishing it notifies the audience.
        $inFinance = $this->person('employee', $finance);
        $elsewhere = $this->person();
        $this->actingAs($inFinance);
        $this->assertSame([], $this->getJson('/api/policies')->json('data'));
        $this->hr();
        $this->putJson("/api/admin/policies/{$id}", ['status' => 'published'])->assertOk()->assertJsonPath('data.status', 'published')->assertJsonPath('data.progress.required', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $inFinance->id, 'title' => 'New policy to read']);
        $this->assertDatabaseMissing('notifications', ['user_id' => $elsewhere->id, 'title' => 'New policy to read']);
        $this->assertNotNull(Policy::find($id)->published_at);

        // A fix to the text keeps the version; widening the audience changes who is asked.
        $this->putJson("/api/admin/policies/{$id}", ['body' => 'Work from home on Thursdays.'])->assertOk()->assertJsonPath('data.version', 1);
        $this->putJson("/api/admin/policies/{$id}", ['audience' => 'all'])->assertOk()->assertJsonPath('data.departments', []);
        $this->putJson("/api/admin/policies/{$id}", ['status' => 'archived'])->assertOk();
        $this->actingAs($inFinance);
        $this->assertSame([], $this->getJson('/api/policies')->json('data'));
        $this->hr();
        $this->deleteJson("/api/admin/policies/{$id}")->assertStatus(405);
        $this->getJson('/api/admin/policies?status=archived')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_the_report_lists_who_has_not_read_it_with_filters_and_totals(): void
    {
        $finance = $this->dept('Finance');
        $sales = $this->dept('Sales');
        $policy = $this->policy();
        $a = $this->person('employee', $finance);
        $b = $this->person('employee', $finance);
        $c = $this->person('employee', $sales);
        $newHire = $this->person('employee', $sales, ['status' => UserStatus::Pending]);
        $gone = $this->person('employee', $sales, ['status' => UserStatus::Inactive]);
        $suspended = $this->person('employee', $sales, ['status' => UserStatus::Suspended]);
        foreach ([$a, $c] as $reader) {
            $this->actingAs($reader);
            $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk();
        }

        $this->hr();
        $hrUser = User::where('id', '!=', $a->id)->latest('id')->first();
        $report = $this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?per_page=100")->assertOk();
        $pending = collect($report->json('data'))->pluck('employee_id')->all();
        $this->assertEqualsCanonicalizing([$b->employee_id, $newHire->employee_id, $hrUser->employee_id], $pending, 'outstanding by default; disabled and inactive accounts are not asked');
        $this->assertNotContains($gone->employee_id, $pending);
        $this->assertNotContains($suspended->employee_id, $pending);
        $this->assertSame(['required' => 5, 'acknowledged' => 2, 'outstanding' => 3, 'percent' => 40], array_intersect_key($report->json('summary'), array_flip(['required', 'acknowledged', 'outstanding', 'percent'])));

        $acknowledged = collect($this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?status=acknowledged")->json('data'));
        $this->assertEqualsCanonicalizing([$a->employee_id, $c->employee_id], $acknowledged->pluck('employee_id')->all());
        $this->assertNotNull($acknowledged->first()['acknowledged_at']);
        $this->assertSame(5, $this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?status=all")->json('meta.total'));
        $this->assertSame([$newHire->employee_id], collect($this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?department_id={$sales->id}")->json('data'))->pluck('employee_id')->all());
        $this->assertSame([$b->employee_id], collect($this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?search=".urlencode($b->email))->json('data'))->pluck('employee_id')->all());
        $row = collect($report->json('data'))->firstWhere('employee_id', $newHire->employee_id);
        $this->assertSame(['pending', 'Sales'], [$row['account_status'], $row['department']]);
        $this->getJson("/api/admin/policies/{$policy->id}/acknowledgements?status=bogus")->assertStatus(422);
    }

    public function test_audience_rules_decide_who_is_required(): void
    {
        $finance = $this->dept('Finance');
        $inFinance = $this->person('employee', $finance);
        $manager = $this->person('manager');
        $other = $this->person();
        $onlyFinance = $this->policy(['audience' => 'departments'], [$finance]);
        $managers = $this->policy(['audience' => 'managers']);

        $this->assertSame([$inFinance->id], $onlyFinance->requiredUsers()->pluck('id')->all());
        $this->assertSame([$manager->id], $managers->requiredUsers()->pluck('id')->all());
        $this->assertNotContains($other->id, $onlyFinance->requiredUsers()->pluck('id')->all());
    }

    public function test_reminders_go_to_the_outstanding_only_and_at_most_once_a_day(): void
    {
        $policy = $this->policy(['title' => 'Safety']);
        $done = $this->person();
        $waiting = $this->person();
        $this->actingAs($done);
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertOk();

        $hr = $this->hr();
        $this->postJson("/api/admin/policies/{$policy->id}/remind")->assertOk()->assertJsonPath('data.notified', 2); // the waiting employee and HR itself
        $this->assertDatabaseHas('notifications', ['user_id' => $waiting->id, 'title' => 'Reminder: policy to read']);
        $this->assertDatabaseMissing('notifications', ['user_id' => $done->id, 'title' => 'Reminder: policy to read']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'POLICY_REMINDED', 'actor_user_id' => $hr->id]);
        $this->postJson("/api/admin/policies/{$policy->id}/remind")->assertStatus(422)->assertJsonValidationErrors('remind');

        Policy::whereKey($policy->id)->update(['last_reminded_at' => now()->subHours(25)]);
        $this->postJson("/api/admin/policies/{$policy->id}/remind")->assertOk();
        $draft = $this->policy(['status' => 'draft']);
        $this->postJson("/api/admin/policies/{$draft->id}/remind")->assertStatus(422);
    }

    public function test_permissions_employees_read_hr_and_admin_manage(): void
    {
        $policy = $this->policy();
        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/policies')->assertStatus(403);
            $this->postJson('/api/admin/policies', ['title' => 'x', 'body' => 'y'])->assertStatus(403);
            $this->getJson("/api/admin/policies/{$policy->id}/acknowledgements")->assertStatus(403);
            $this->postJson("/api/admin/policies/{$policy->id}/remind")->assertStatus(403);
            $this->postJson("/api/admin/policies/{$policy->id}/new-version")->assertStatus(403);
            $this->getJson('/api/policies')->assertOk();
        }
        foreach (['hr', 'admin'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/policies')->assertOk();
        }
    }

    public function test_signed_out_visitors_get_nothing(): void
    {
        $policy = $this->policy();
        $this->getJson('/api/policies')->assertStatus(401);
        $this->getJson("/api/policies/{$policy->id}")->assertStatus(401);
        $this->postJson("/api/policies/{$policy->id}/acknowledge", ['version' => 1, 'confirm' => true])->assertStatus(401);
        $this->getJson('/api/admin/policies')->assertStatus(401);
    }
}
