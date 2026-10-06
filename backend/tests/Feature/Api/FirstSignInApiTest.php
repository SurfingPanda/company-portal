<?php

namespace Tests\Feature\Api;

use App\Enums\UserStatus;
use App\Mail\FirstSignInCodeMail;
use App\Models\PasswordLink;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/** Two-step sign-in: identify first (employee ID or email), then either ask for the password or run the first-time setup. */
class FirstSignInApiTest extends ApiTestCase
{
    private function pending(array $attributes = []): User
    {
        return $this->makeUser('employee', ['status' => UserStatus::Pending, 'onboarded_at' => null, 'email' => 'newbie@eljin.example', ...$attributes]);
    }

    private function sentCode(): string
    {
        $code = null;
        Mail::assertSent(FirstSignInCodeMail::class, function ($m) use (&$code) {
            $code = $m->code;

            return true;
        });

        return (string) $code;
    }

    public function test_identify_asks_for_the_password_unless_the_account_is_new(): void
    {
        Mail::fake();
        $active = $this->makeUser();
        $this->pending(['employee_id' => 'EMP-7001']);

        foreach ([$active->email, strtoupper($active->employee_id), 'nobody@eljin.example', 'EMP-0000'] as $identifier) {
            $this->postJson('/api/auth/identify', ['identifier' => $identifier])->assertOk()->assertExactJson(['data' => ['step' => 'password']]);
        }
        foreach ([$this->makeUser('employee', ['status' => UserStatus::Inactive])->email, $this->makeUser('employee', ['status' => UserStatus::Suspended])->email] as $identifier) {
            $this->postJson('/api/auth/identify', ['identifier' => $identifier])->assertOk()->assertJsonPath('data.step', 'password');
        }
        Mail::assertNothingSent();

        $this->postJson('/api/auth/identify', ['identifier' => 'EMP-7001'])->assertOk()
            ->assertJsonPath('data.step', 'setup')->assertJsonPath('data.email_hint', 'n***@eljin.example')->assertJsonPath('data.code_minutes', 15);
        $this->postJson('/api/auth/identify', ['identifier' => 'newbie@eljin.example'])->assertOk()->assertJsonPath('data.step', 'setup');
        Mail::assertSent(FirstSignInCodeMail::class, 1); // the second request within a minute does not send another
        $this->postJson('/api/auth/identify', [])->assertStatus(422)->assertJsonValidationErrors('identifier');
    }

    public function test_the_emailed_code_lets_a_new_employee_choose_a_password_and_signs_them_in(): void
    {
        Mail::fake();
        $user = $this->pending();
        $this->postJson('/api/auth/identify', ['identifier' => $user->email])->assertJsonPath('data.step', 'setup');
        $code = $this->sentCode();
        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
        $this->assertSame(1, PasswordLink::where('user_id', $user->id)->count());
        $this->assertStringNotContainsString($code, json_encode(PasswordLink::all()), 'only a hash of the code is stored');

        $good = ['identifier' => $user->email, 'code' => $code, 'password' => 'My-own-password-1', 'password_confirmation' => 'My-own-password-1'];
        $this->postJson('/api/auth/first-sign-in', [...$good, 'password_confirmation' => 'different'])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson('/api/auth/first-sign-in', [...$good, 'password' => 'short', 'password_confirmation' => 'short'])->assertStatus(422);

        $this->postJson('/api/auth/first-sign-in', $good)->assertOk()->assertJsonPath('data.email', $user->email)->assertJsonPath('data.onboarding_completed', false);
        $this->assertSame(UserStatus::Active, $user->fresh()->status);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('My-own-password-1', $user->fresh()->password));
        $this->assertSame(0, PasswordLink::where('user_id', $user->id)->count());
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.employee_id', $user->employee_id);
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_ACTIVATED', 'target_label' => $user->employee_id]);

        // The code is single use, and the account no longer counts as new.
        $this->postJson('/api/auth/first-sign-in', $good)->assertStatus(422);
        $this->postJson('/api/auth/identify', ['identifier' => $user->email])->assertJsonPath('data.step', 'password');
        $this->postJson('/api/auth/login', ['identifier' => $user->email, 'password' => 'My-own-password-1'])->assertOk();
    }

    public function test_a_wrong_code_is_counted_and_the_code_dies_after_five_attempts(): void
    {
        Mail::fake();
        $user = $this->pending();
        $this->postJson('/api/auth/identify', ['identifier' => $user->email]);
        $code = $this->sentCode();
        $wrong = $code === '000000' ? '111111' : '000000';
        $body = fn (string $c) => ['identifier' => $user->email, 'code' => $c, 'password' => 'My-own-password-1', 'password_confirmation' => 'My-own-password-1'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/first-sign-in', $body($wrong))->assertStatus(422)->assertJsonValidationErrors('code');
        }
        $this->postJson('/api/auth/first-sign-in', $body($code))->assertStatus(422); // too late: the right code no longer works
        $this->assertSame(UserStatus::Pending, $user->fresh()->status);
        $this->postJson('/api/auth/first-sign-in', [...$body($code), 'code' => '12ab'])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_an_expired_code_and_non_pending_or_unknown_accounts_are_refused_the_same_way(): void
    {
        Mail::fake();
        $user = $this->pending();
        $this->postJson('/api/auth/identify', ['identifier' => $user->email]);
        $code = $this->sentCode();
        PasswordLink::query()->update(['expires_at' => now()->subMinute()]);
        $body = fn (string $identifier, string $c) => ['identifier' => $identifier, 'code' => $c, 'password' => 'My-own-password-1', 'password_confirmation' => 'My-own-password-1'];

        $this->postJson('/api/auth/first-sign-in', $body($user->email, $code))->assertStatus(422)->assertJsonValidationErrors('code');
        $this->postJson('/api/auth/first-sign-in', $body('nobody@eljin.example', '123456'))->assertStatus(422)->assertJsonValidationErrors('code');
        $active = $this->makeUser();
        $this->postJson('/api/auth/first-sign-in', $body($active->email, '123456'))->assertStatus(422);
        $this->assertFalse(\Illuminate\Support\Facades\Hash::check('My-own-password-1', $active->fresh()->password));
    }
}
