<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

class AuthApiTest extends ApiTestCase
{
    public function test_login_with_employee_id_returns_the_user_without_secrets(): void
    {
        $user = $this->makeUser('hr', ['employee_id' => 'EMP-7001', 'email' => 'grace.ramos@eljin.example']);

        $response = $this->postJson('/api/auth/login', ['identifier' => 'EMP-7001', 'password' => 'DemoOnly123!', 'remember' => true]);

        $response->assertOk()
            ->assertJsonPath('data.employee_id', 'EMP-7001')
            ->assertJsonPath('data.display_name', 'Grace Ramos')
            ->assertJsonPath('data.roles', ['hr'])
            ->assertJsonPath('data.account_status', 'active')
            ->assertJsonPath('data.official.connected', false)
            ->assertJsonPath('data.official.job_title', null);
        $this->assertContains('hr.manage', $response->json('data.permissions'));
        $this->assertStringNotContainsString('password', strtolower($response->getContent()));
        $this->assertStringNotContainsString('remember_token', $response->getContent());
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_with_company_email_is_case_insensitive(): void
    {
        $this->makeUser('employee', ['email' => 'sample.person@eljin.example']);

        $this->postJson('/api/auth/login', ['identifier' => 'Sample.Person@ELJIN.example', 'password' => 'DemoOnly123!'])->assertOk();
    }

    public function test_invalid_credentials_are_a_generic_401(): void
    {
        $this->makeUser('employee', ['employee_id' => 'EMP-7002']);

        $wrongPassword = $this->postJson('/api/auth/login', ['identifier' => 'EMP-7002', 'password' => 'wrong']);
        $unknownUser = $this->postJson('/api/auth/login', ['identifier' => 'EMP-0000', 'password' => 'wrong']);

        $wrongPassword->assertStatus(401);
        $unknownUser->assertStatus(401);
        // Identical bodies: nothing reveals whether the account exists.
        $this->assertSame($wrongPassword->json(), $unknownUser->json());
        $this->assertGuest();
    }

    public function test_inactive_account_cannot_sign_in(): void
    {
        $user = $this->makeUser('employee', ['employee_id' => 'EMP-7003']);
        $user->forceFill(['status' => 'inactive'])->save();

        $this->postJson('/api/auth/login', ['identifier' => 'EMP-7003', 'password' => 'DemoOnly123!'])->assertStatus(403);
        $this->assertGuest();
    }

    public function test_login_validates_the_payload_with_422(): void
    {
        $this->postJson('/api/auth/login', [])->assertStatus(422)->assertJsonValidationErrors(['identifier', 'password']);
    }

    public function test_login_is_rate_limited(): void
    {
        $this->makeUser('employee', ['employee_id' => 'EMP-7004']);
        RateLimiter::clear('login:emp-7004|127.0.0.1');

        foreach (range(1, 5) as $i) {
            $this->postJson('/api/auth/login', ['identifier' => 'EMP-7004', 'password' => 'wrong'])->assertStatus(401);
        }

        // Even the correct password is refused once the limit is hit.
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-7004', 'password' => 'DemoOnly123!'])->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_me_requires_authentication_and_returns_the_current_user(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401)->assertJsonPath('message', 'Authentication is required.');

        $user = $this->signIn('manager');
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonPath('data.roles', ['manager']);
    }

    public function test_logout_ends_the_session(): void
    {
        $this->signIn();

        $this->postJson('/api/auth/logout')->assertNoContent();
        // The session guard is cleared (the sanctum guard object caches the user only inside this one test process).
        $this->assertGuest('web');
    }

    public function test_display_name_prefers_the_preferred_name_and_never_exposes_hris_fields_it_does_not_have(): void
    {
        $user = $this->signIn();
        $user->profile()->create(['preferred_name' => 'Avi']);

        $this->getJson('/api/auth/me')->assertJsonPath('data.display_name', 'Avi')->assertJsonPath('data.official.department', null);
    }

    public function test_protected_routes_reject_signed_out_visitors(): void
    {
        foreach (['/api/announcements', '/api/documents', '/api/requests', '/api/notifications', '/api/helpdesk/tickets', '/api/recruitment/applications', '/api/account/preferences', '/api/profile', '/api/search?q=test'] as $path) {
            $this->getJson($path)->assertStatus(401);
        }
        $this->assertSame(0, User::count());
    }
}
