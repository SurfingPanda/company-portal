<?php

namespace Tests\Feature\Api;

use App\Mail\PasswordChangedMail;
use App\Models\PasswordLink;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/** Changing your own password from Account Settings. */
class PasswordChangeApiTest extends ApiTestCase
{
    private const OLD = 'DemoOnly123!';

    private const NEW = 'A-brand-new-passphrase-9';

    private function me(array $attributes = []): User
    {
        $user = $this->makeUser('employee', ['email' => 'me@eljincorp.com', ...$attributes]);
        $this->actingAs($user);

        return $user;
    }

    private function change(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/account/password', ['current_password' => self::OLD, 'password' => self::NEW, 'password_confirmation' => self::NEW, ...$overrides]);
    }

    public function test_the_password_changes_other_devices_are_signed_out_and_a_notice_is_sent(): void
    {
        Mail::fake();
        $me = $this->me(['remember_token' => 'remember-me']);
        DB::table('sessions')->insert([
            ['id' => 'other-phone', 'user_id' => $me->id, 'ip_address' => '10.0.0.2', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time()],
            ['id' => 'someone-else', 'user_id' => $this->makeUser()->id, 'ip_address' => '10.0.0.3', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time()],
        ]);
        $link = new PasswordLink;
        $link->forceFill(['user_id' => $me->id, 'purpose' => 'reset', 'token_hash' => hash('sha256', 'abc'), 'expires_at' => now()->addHour()])->save();

        $this->change()->assertOk()->assertJsonPath('message', 'Your password was changed. Other devices were signed out.');

        $fresh = $me->fresh();
        $this->assertTrue(Hash::check(self::NEW, $fresh->password));
        $this->assertFalse(Hash::check(self::OLD, $fresh->password));
        $this->assertNull($fresh->remember_token);
        $this->assertSame(0, DB::table('sessions')->where('id', 'other-phone')->count(), 'other devices are signed out');
        $this->assertSame(1, DB::table('sessions')->where('id', 'someone-else')->count(), 'nobody else is touched');
        $this->assertSame(0, PasswordLink::where('user_id', $me->id)->count(), 'unused reset links die');
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_CHANGED', 'actor_user_id' => $me->id, 'result' => 'success']);
        $this->assertDatabaseHas('notifications', ['user_id' => $me->id, 'title' => 'Your password was changed']);
        Mail::assertSent(PasswordChangedMail::class, fn (PasswordChangedMail $m) => $m->hasTo('me@eljincorp.com') && $m->employeeId === $me->employee_id);
        $this->assertStringNotContainsString(self::NEW, json_encode(\App\Models\AuditLog::all()), 'no password is ever logged');

        // The new password signs in; the old one does not.
        $this->postJson('/api/auth/login', ['identifier' => $me->email, 'password' => self::OLD])->assertStatus(401);
        $this->postJson('/api/auth/login', ['identifier' => $me->email, 'password' => self::NEW])->assertOk();
    }

    public function test_a_wrong_current_password_changes_nothing(): void
    {
        Mail::fake();
        $me = $this->me();

        $this->change(['current_password' => 'not-my-password'])->assertStatus(422)->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check(self::OLD, $me->fresh()->password));
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_CHANGE_REFUSED', 'result' => 'failure']);
        Mail::assertNothingSent();
    }

    public function test_the_new_password_is_validated(): void
    {
        $me = $this->me();
        $this->change(['password' => 'Short1!', 'password_confirmation' => 'Short1!'])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->change(['password_confirmation' => 'something else entirely'])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->change(['password' => self::OLD, 'password_confirmation' => self::OLD])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->change(['password' => str_repeat('a', 129), 'password_confirmation' => str_repeat('a', 129)])->assertStatus(422);
        $this->postJson('/api/account/password', [])->assertStatus(422)->assertJsonValidationErrors(['current_password', 'password']);
        $this->assertTrue(Hash::check(self::OLD, $me->fresh()->password));
    }

    public function test_a_sample_address_still_changes_but_gets_no_email_and_visitors_are_refused(): void
    {
        Mail::fake();
        $this->me(['email' => 'demo@eljin.example']);
        $this->change()->assertOk();
        Mail::assertNothingSent();

    }

    public function test_signed_out_visitors_cannot_change_a_password(): void
    {
        $this->postJson('/api/account/password', ['current_password' => 'x', 'password' => self::NEW, 'password_confirmation' => self::NEW])->assertStatus(401);
    }

    public function test_guessing_the_current_password_is_rate_limited(): void
    {
        $this->me();
        for ($i = 0; $i < 5; $i++) {
            $this->change(['current_password' => "guess-{$i}"])->assertStatus(422);
        }
        $this->change(['current_password' => 'guess-6'])->assertStatus(429);
        $this->change()->assertStatus(429); // even the right password waits
    }

    public function test_the_notice_email_renders_in_the_brand_layout(): void
    {
        $html = (new PasswordChangedMail('EMP-0042'))->render();
        foreach (['ELJIN CORPORATION', 'Your password was changed', 'EMP-0042', 'Was this not you?', 'Go to the sign-in page'] as $text) {
            $this->assertStringContainsString($text, $html);
        }
    }
}
