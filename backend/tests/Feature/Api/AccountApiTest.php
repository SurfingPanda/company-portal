<?php

namespace Tests\Feature\Api;

class AccountApiTest extends ApiTestCase
{
    public function test_a_new_account_is_flagged_for_onboarding_until_it_completes_the_setup(): void
    {
        $this->postJson('/api/auth/onboarding/complete')->assertStatus(401);

        $me = $this->makeUser('employee', ['onboarded_at' => null]);
        $this->actingAs($me);
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.onboarding_completed', false);

        $this->putJson('/api/profile/personal', ['emergency_contacts' => [['name' => 'Maria Santos', 'relationship' => 'Spouse', 'phone' => '0917 123 4567']]])->assertOk();
        $this->postJson('/api/auth/onboarding/complete')->assertOk()->assertJsonPath('data.onboarding_completed', true);
        $stamp = $me->fresh()->onboarded_at;
        $this->assertNotNull($stamp);
        $this->postJson('/api/auth/onboarding/complete')->assertOk(); // idempotent: the first completion time is kept
        $this->assertTrue($stamp->equalTo($me->fresh()->onboarded_at));
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.onboarding_completed', true);
        $this->assertDatabaseHas('activity_logs', ['user_id' => $me->id, 'activity_type' => 'onboarding_completed']);
    }

    public function test_preferences_are_read_updated_and_reset_for_the_signed_in_user_only(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();
        $other->preferences()->create(['theme' => 'dark']);

        $this->getJson('/api/account/preferences')->assertOk()->assertJsonPath('data.theme', 'system')->assertJsonPath('data.notify_hr', true);

        $this->putJson('/api/account/preferences', ['theme' => 'dark', 'notify_hr' => false, 'user_id' => $other->id, 'text_size' => 'large'])
            ->assertOk()->assertJsonPath('data.theme', 'dark')->assertJsonPath('data.notify_hr', false)->assertJsonPath('data.text_size', 'large');
        $this->assertSame($me->id, $me->preferences()->first()->user_id);
        $this->assertSame('dark', $other->preferences()->first()->theme, 'the other user is untouched');

        $this->postJson('/api/account/preferences/reset')->assertOk()->assertJsonPath('data.theme', 'system')->assertJsonPath('data.notify_hr', true);
        $this->assertSame(1, $me->preferences()->count());

        $this->putJson('/api/account/preferences', ['theme' => 'neon'])->assertStatus(422)->assertJsonValidationErrors('theme');
        $this->putJson('/api/account/preferences/'.$other->id, ['theme' => 'light'])->assertStatus(404);
    }

    public function test_profile_only_accepts_self_service_fields(): void
    {
        $me = $this->signIn();

        $response = $this->putJson('/api/profile', [
            'preferred_name' => 'Avi', 'personal_email' => 'avi@example.com', 'mobile_number' => '+63 900 111 2222',
            'employee_id' => 'EMP-9999', 'job_title' => 'CEO', 'department' => 'Executive', 'email' => 'ceo@eljin.example', 'status' => 'suspended', 'roles' => ['admin'],
        ])->assertOk();

        $response->assertJsonPath('data.profile.preferred_name', 'Avi')->assertJsonPath('data.display_name', 'Avi');
        $fresh = $me->fresh();
        $this->assertSame($me->employee_id, $fresh->employee_id);
        $this->assertSame($me->email, $fresh->email);
        $this->assertSame(['employee'], $fresh->roleNames());
        $this->assertNull($response->json('data.official.job_title'), 'employment fields come from the HR directory entry, never from the profile');

        $this->putJson('/api/profile', ['personal_email' => 'nope'])->assertStatus(422)->assertJsonValidationErrors('personal_email');
        $this->putJson('/api/profile', ['mobile_number' => 'abc'])->assertStatus(422);
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.profile.mobile_number', '+63 900 111 2222');
    }

    public function test_employee_information_comes_from_the_linked_directory_entry_and_is_never_invented(): void
    {
        $me = $this->signIn();

        $response = $this->getJson('/api/hr/employee-information')->assertOk();
        $response->assertJsonPath('data.employee', null)->assertJsonPath('meta.connected', false)->assertJsonPath('meta.source', 'portal');

        $dept = \App\Models\Department::query()->forceCreate(['name' => 'Finance', 'status' => 'published']);
        \App\Models\DirectoryEntry::query()->forceCreate(['employee_id' => $me->employee_id, 'user_id' => $me->id, 'display_name' => 'Sample Person', 'job_title' => 'Analyst', 'department_id' => $dept->id, 'employment_status' => 'on_leave', 'employment_type' => 'regular', 'date_joined' => '2024-01-15', 'source' => 'manual', 'verification' => 'unverified']);
        $me->unsetRelation('directoryEntry');
        $this->getJson('/api/hr/employee-information')->assertOk()->assertJsonPath('meta.connected', true)
            ->assertJsonPath('data.employee.job_title', 'Analyst')->assertJsonPath('data.employee.department', 'Finance')
            ->assertJsonPath('data.employee.status', 'on_leave')->assertJsonPath('data.employee.date_joined', '2024-01-15');
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('data.official.employment_status', 'on_leave')->assertJsonPath('data.official.employment_type', 'regular')->assertJsonPath('data.official.date_joined', '2024-01-15');
        $this->getJson('/api/hr/services')->assertOk()->assertJsonStructure(['data']);
    }

    public function test_errors_use_one_safe_shape(): void
    {
        $this->signIn();

        $this->getJson('/api/does-not-exist')->assertStatus(404)->assertExactJson(['message' => 'The requested resource could not be found.', 'errors' => []]);
        $this->getJson('/api/requests/99999')->assertStatus(404)->assertJsonPath('message', 'The requested resource could not be found.');
        $this->deleteJson('/api/requests')->assertStatus(405)->assertJsonStructure(['message', 'errors']);
        $this->postJson('/api/helpdesk/tickets', [])->assertStatus(422)->assertJsonStructure(['message', 'errors' => ['subject']]);
        $this->getJson('/api/requests/abc')->assertStatus(404);
    }
}
