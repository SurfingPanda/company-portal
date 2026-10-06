<?php

namespace Tests\Feature\Api;

use App\Mail\PasswordLinkMail;
use App\Models\PasswordLink;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/** Emailed one-time links: account activation for new users and "forgot password". */
class PasswordLinkApiTest extends ApiTestCase
{
    private const NEW_PASSWORD = 'A-brand-new-passphrase-42';

    private function tokenSentTo(string $email): string
    {
        $sent = Mail::sent(PasswordLinkMail::class, fn (PasswordLinkMail $m) => $m->hasTo($email));
        $this->assertNotEmpty($sent, 'an email was sent');
        parse_str((string) parse_url($sent->last()->url, PHP_URL_QUERY), $query);

        return $query['token'];
    }

    private function createUser(string $status = 'pending'): User
    {
        $this->actingAs($this->makeUser('admin'));
        $this->postJson('/api/admin/users', ['employee_id' => 'EMP-0900', 'email' => 'new.person@eljin.example', 'role' => 'employee', 'status' => $status])->assertCreated();

        return User::where('employee_id', 'EMP-0900')->firstOrFail();
    }

    public function test_creating_a_user_emails_an_activation_link_that_sets_the_password_and_activates_the_account(): void
    {
        Mail::fake();
        $user = $this->createUser('pending');
        $this->assertSame('pending', $user->status->value);
        $token = $this->tokenSentTo('new.person@eljin.example');
        $this->assertDatabaseMissing('password_links', ['token_hash' => $token]);
        $this->assertTrue(Mail::sent(PasswordLinkMail::class)->first()->purpose === 'activation');

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertOk();

        $user->refresh();
        $this->assertSame('active', $user->status->value);
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $user->password));
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_ACTIVATED']);
        $this->assertSame(0, PasswordLink::count());

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-0900', 'password' => self::NEW_PASSWORD])->assertOk();
    }

    public function test_a_link_works_once_and_unknown_or_weak_input_is_refused(): void
    {
        Mail::fake();
        $this->createUser();
        $token = $this->tokenSentTo('new.person@eljin.example');
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => 'short', 'password_confirmation' => 'short'])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => 'different-one-123'])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson('/api/auth/set-password', ['token' => str_repeat('x', 64), 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertStatus(422)->assertJsonValidationErrors('token');

        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertOk();
        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => 'Another-passphrase-77', 'password_confirmation' => 'Another-passphrase-77'])->assertStatus(422)->assertJsonValidationErrors('token');
    }

    public function test_an_expired_link_is_refused_and_a_newer_link_replaces_the_older_one(): void
    {
        Mail::fake();
        $user = $this->createUser();
        $first = $this->tokenSentTo('new.person@eljin.example');
        $this->postJson('/api/admin/users/'.$user->id.'/password-link')->assertOk();
        $second = Mail::sent(PasswordLinkMail::class)->last()->url;
        parse_str((string) parse_url($second, PHP_URL_QUERY), $query);
        $this->assertNotSame($first, $query['token']);
        $this->assertSame(1, PasswordLink::count());

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/set-password', ['token' => $first, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertStatus(422);

        $this->travel(73)->hours();
        $this->postJson('/api/auth/set-password', ['token' => $query['token'], 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertStatus(422);
        $this->assertSame('pending', $user->fresh()->status->value);
    }

    public function test_forgot_password_answers_the_same_for_known_and_unknown_accounts_and_only_emails_real_ones(): void
    {
        Mail::fake();
        $user = $this->makeUser('employee');
        $unknown = $this->postJson('/api/auth/forgot-password', ['identifier' => 'EMP-9999'])->assertStatus(202)->json();
        Mail::assertNothingSent();

        $known = $this->postJson('/api/auth/forgot-password', ['identifier' => $user->email])->assertStatus(202)->json();
        $this->assertSame($unknown, $known);
        $token = $this->tokenSentTo($user->email);
        $this->assertSame('reset', Mail::sent(PasswordLinkMail::class)->first()->purpose);

        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertOk();
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $user->fresh()->password));
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_PASSWORD_RESET']);
    }

    public function test_a_reset_ends_the_accounts_sessions_and_disabled_accounts_get_nothing(): void
    {
        Mail::fake();
        $user = $this->makeUser('employee');
        \DB::table('sessions')->insert(['id' => 'abc', 'user_id' => $user->id, 'payload' => 'x', 'last_activity' => time()]);
        $this->postJson('/api/auth/forgot-password', ['identifier' => $user->employee_id])->assertStatus(202);
        $this->postJson('/api/auth/set-password', ['token' => $this->tokenSentTo($user->email), 'password' => self::NEW_PASSWORD, 'password_confirmation' => self::NEW_PASSWORD])->assertOk();
        $this->assertSame(0, \DB::table('sessions')->where('user_id', $user->id)->count());

        Mail::fake();
        $disabled = $this->makeUser('employee');
        $disabled->forceFill(['status' => 'suspended'])->save();
        $this->postJson('/api/auth/forgot-password', ['identifier' => $disabled->employee_id])->assertStatus(202);
        Mail::assertNothingSent();
    }

    public function test_the_link_is_never_in_an_api_response_and_forgot_is_throttled(): void
    {
        Mail::fake();
        $user = $this->makeUser('employee');
        $body = $this->postJson('/api/auth/forgot-password', ['identifier' => $user->email])->getContent();
        $this->assertStringNotContainsString('token', $body);
        $this->assertStringNotContainsString('set-password', $body);

        $codes = [];
        for ($i = 0; $i < 7; $i++) {
            $codes[] = $this->postJson('/api/auth/forgot-password', ['identifier' => 'EMP-9999'])->status();
        }
        $this->assertContains(429, $codes);
    }

    public function test_only_administrators_can_send_a_link_and_disabled_accounts_cannot_be_sent_one(): void
    {
        Mail::fake();
        $target = $this->makeUser('employee');
        foreach (['employee', 'hr', 'it', 'manager'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->postJson("/api/admin/users/{$target->id}/password-link")->assertStatus(403);
        }
        Mail::assertNothingSent();

        $this->actingAs($this->makeUser('admin'));
        $this->postJson("/api/admin/users/{$target->id}/password-link")->assertOk();
        Mail::assertSent(PasswordLinkMail::class, 1);
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_PASSWORD_LINK_SENT']);

        $target->forceFill(['status' => 'inactive'])->save();
        $this->postJson("/api/admin/users/{$target->id}/password-link")->assertStatus(409);
    }

    public function test_a_failing_mail_server_does_not_break_user_creation(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));
        $this->actingAs($this->makeUser('admin'));
        $this->postJson('/api/admin/users', ['employee_id' => 'EMP-0901', 'email' => 'x.y@eljin.example', 'role' => 'employee', 'status' => 'pending'])->assertCreated();
        $this->assertNotNull(User::where('employee_id', 'EMP-0901')->first());
    }
}
