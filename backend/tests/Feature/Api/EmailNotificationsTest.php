<?php

namespace Tests\Feature\Api;

use App\Enums\NotificationType;
use App\Enums\UserStatus;
use App\Mail\DailyDigestMail;
use App\Mail\FirstSignInCodeMail;
use App\Mail\NotificationMail;
use App\Mail\PasswordLinkMail;
use App\Models\Policy;
use App\Models\User;
use App\Services\DigestBuilder;
use App\Services\MailGuard;
use App\Services\PortalEvents;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

/** Email notifications (instant) and the daily summary, and the shape of the emails. */
class EmailNotificationsTest extends ApiTestCase
{
    private function person(string $mode, array $user = [], array $prefs = []): User
    {
        $u = $this->makeUser('employee', ['email' => 'person'.uniqid().'@eljincorp.com', ...$user]);
        $u->preferences()->create(['email_mode' => $mode, ...$prefs]);

        return $u->fresh();
    }

    public function test_reserved_and_invalid_addresses_are_never_emailed(): void
    {
        foreach (['someone@eljincorp.com', 'a.b@gmail.com', 'x@mail.example.org.ph'] as $ok) {
            $this->assertTrue(MailGuard::deliverable($ok), $ok);
        }
        foreach (['x@eljin.example', 'x@example.com', 'x@foo.test', 'x@localhost', 'x@host.invalid', 'x@box.local', 'nope', '', null] as $bad) {
            $this->assertFalse(MailGuard::deliverable($bad), (string) $bad);
        }
    }

    public function test_an_instant_email_goes_only_to_people_who_chose_it(): void
    {
        Mail::fake();
        $instant = $this->person('instant');
        $daily = $this->person('daily');
        $off = $this->person('off');
        $noPrefs = $this->makeUser('employee', ['email' => 'plain@eljincorp.com']);

        foreach ([$instant, $daily, $off, $noPrefs] as $u) {
            PortalEvents::notify($u, NotificationType::Announcement, 'Holiday schedule', 'The office is closed on Monday.', '/announcements/4');
        }

        Mail::assertSent(NotificationMail::class, 1);
        Mail::assertSent(NotificationMail::class, fn (NotificationMail $m) => $m->hasTo($instant->email) && $m->notification->title === 'Holiday schedule');
        $this->assertSame(4, \App\Models\PortalNotification::count(), 'the portal notification is created for everyone either way');
    }

    public function test_no_email_for_a_category_switched_off_a_disabled_account_or_a_sample_address(): void
    {
        Mail::fake();
        $categoryOff = $this->person('instant', [], ['notify_hr' => false]);
        $disabled = $this->person('instant', ['status' => UserStatus::Suspended]);
        $sample = $this->person('instant', ['email' => 'demo@eljin.example']);

        PortalEvents::notify($categoryOff, NotificationType::Hr, 'HR notice', 'Message');
        PortalEvents::notify($categoryOff, NotificationType::System, 'System notice', 'Always delivered');
        PortalEvents::notify($disabled, NotificationType::System, 'Notice', 'Message');
        PortalEvents::notify($sample, NotificationType::System, 'Notice', 'Message');

        Mail::assertSent(NotificationMail::class, 1);
        Mail::assertSent(NotificationMail::class, fn (NotificationMail $m) => $m->notification->title === 'System notice');
    }

    public function test_every_email_renders_with_the_brand_layout_and_escapes_what_it_shows(): void
    {
        $user = $this->person('instant');
        $note = PortalEvents::notify($user, NotificationType::Request, '<script>alert(1)</script> Leave approved', 'Your <b>leave</b> request was approved.', '/requests/REQ-1');

        $html = (new NotificationMail($note))->render();
        $this->assertStringContainsString('ELJIN CORPORATION', $html);
        $this->assertStringContainsString('Employee Portal', $html);
        $this->assertStringNotContainsString('<script>alert(1)', $html, 'titles are escaped');
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringContainsString(rtrim((string) config('app.frontend_url'), '/').'/requests/REQ-1', $html);
        $this->assertStringContainsString('Open in the portal', $html);
        $this->assertStringContainsString('prefers-color-scheme: dark', $html);

        // A link that is not a plain in-portal route is never made clickable.
        $odd = PortalEvents::notify($user, NotificationType::System, 'Odd', 'Link test', 'https://evil.example/phish');
        $this->assertStringNotContainsString('evil.example', (new NotificationMail($odd))->render());

        $link = (new PasswordLinkMail('activation', 'EMP-1', 'https://portal.test/set-password?token=abc', 72))->render();
        $this->assertStringContainsString('Choose my password', $link);
        $this->assertStringContainsString('set-password?token=abc', $link);
        $code = (new FirstSignInCodeMail('EMP-1', '482913', 15))->render();
        $this->assertStringContainsString('482913', $code);
        $this->assertStringContainsString('ELJIN CORPORATION', $code);
    }

    public function test_the_digest_collects_what_needs_the_person_and_skips_what_does_not(): void
    {
        $user = $this->person('daily');
        $policy = new Policy;
        $policy->forceFill(['title' => 'Code of Conduct', 'body' => 'x', 'status' => 'published', 'audience' => 'all', 'version' => 1, 'due_date' => now()->subDay()->toDateString(), 'version_published_at' => now()])->save();
        PortalEvents::notify($user, NotificationType::Announcement, 'New benefit', 'Details inside.', '/benefits');
        $read = PortalEvents::notify($user, NotificationType::Announcement, 'Already read', 'x');
        $read->forceFill(['read_at' => now()])->save();

        $digest = DigestBuilder::for($user);
        $this->assertSame(['Code of Conduct'], array_column($digest['policies'], 'title'));
        $this->assertTrue($digest['policies'][0]['overdue']);
        $this->assertSame(['New benefit'], array_column($digest['notifications'], 'title'));
        $this->assertSame(1, $digest['notifications_total']);
        $this->assertFalse(DigestBuilder::isEmpty($digest));
        $this->assertSame('You have 1 policy to read and 1 new notification.', DigestBuilder::summary($digest));

        $html = (new DailyDigestMail($user, $digest))->render();
        foreach (['Needs your attention', 'Code of Conduct', 'New in your portal', 'New benefit', 'Good morning'] as $text) {
            $this->assertStringContainsString($text, $html);
        }
        $this->assertStringNotContainsString('Already read', $html);

        Policy::query()->update(['status' => 'archived']);
        $empty = DigestBuilder::for($this->person('daily'));
        $this->assertTrue(DigestBuilder::isEmpty($empty));
        $this->assertStringContainsString('Nothing new', (new DailyDigestMail($user, $empty))->render());
    }

    public function test_the_command_sends_one_summary_to_people_who_chose_daily_and_have_something_new(): void
    {
        Mail::fake();
        $daily = $this->person('daily');
        $dailyEmpty = $this->person('daily');
        $instant = $this->person('instant');
        $off = $this->person('off');
        $sample = $this->person('daily', ['email' => 'demo@eljin.example']);
        foreach ([$daily, $instant, $off, $sample] as $u) {
            PortalEvents::notify($u, NotificationType::System, 'Hello', 'Something new.');
        }

        $this->artisan('portal:send-digests --dry-run')->expectsOutputToContain('Would send: 1')->assertSuccessful();
        Mail::assertNotSent(DailyDigestMail::class);

        $this->artisan('portal:send-digests')->expectsOutputToContain('Sent: 1')->assertSuccessful();
        Mail::assertSent(DailyDigestMail::class, 1);
        Mail::assertSent(DailyDigestMail::class, fn (DailyDigestMail $m) => $m->hasTo($daily->email));
        $this->assertTrue($daily->preferences()->first()->last_digest_at->isToday());
        $this->assertNull($dailyEmpty->preferences()->first()->last_digest_at, 'nothing to say: nothing sent, nothing recorded');

        // Not twice in one day, unless forced; a new day (and something new) sends again.
        $this->artisan('portal:send-digests')->expectsOutputToContain('Sent: 0')->assertSuccessful();
        PortalEvents::notify($daily, NotificationType::System, 'Later', 'More news.');
        $this->artisan('portal:send-digests')->expectsOutputToContain('Sent: 0')->assertSuccessful();
        $this->artisan('portal:send-digests --user='.$daily->employee_id.' --force')->expectsOutputToContain('Sent: 1')->assertSuccessful();
        Mail::assertSent(DailyDigestMail::class, 2);
        $daily->preferences()->update(['last_digest_at' => now()->subDay()]);
        PortalEvents::notify($daily, NotificationType::System, 'Next day', 'News.');
        $this->artisan('portal:send-digests')->expectsOutputToContain('Sent: 1')->assertSuccessful();
        Mail::assertSent(DailyDigestMail::class, 3);
    }

    public function test_the_summary_is_scheduled_every_morning(): void
    {
        Artisan::call('schedule:list');
        $output = Artisan::output();
        $this->assertStringContainsString('portal:send-digests', $output);
        $this->assertStringContainsString('30 23 * * *', $output, '07:30 Manila time, shown in UTC');
    }

    public function test_a_person_can_send_themselves_a_sample_summary(): void
    {
        Mail::fake();
        $me = $this->person('off');
        $this->actingAs($me);

        $this->postJson('/api/account/email-preview')->assertOk()->assertJsonPath('data.sent_to', 'p***@eljincorp.com');
        Mail::assertSent(DailyDigestMail::class, fn (DailyDigestMail $m) => $m->hasTo($me->email) && $m->preview === true);
        $this->assertSame('[Preview] Your daily summary', (new DailyDigestMail($me, DigestBuilder::for($me), true))->envelope()->subject);

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/account/email-preview')->assertOk();
        }
        $this->postJson('/api/account/email-preview')->assertStatus(429);
    }

    public function test_a_sample_cannot_go_to_an_address_that_cannot_receive_mail_or_to_a_visitor(): void
    {
        Mail::fake();
        $this->postJson('/api/account/email-preview')->assertStatus(401);
        $this->actingAs($this->makeUser('employee', ['email' => 'demo@eljin.example']));
        $this->postJson('/api/account/email-preview')->assertStatus(422)->assertJsonValidationErrors('email');
        Mail::assertNothingSent();
    }

    public function test_the_email_choice_is_a_preference_with_a_daily_default(): void
    {
        $this->actingAs($this->makeUser());
        $this->getJson('/api/account/preferences')->assertOk()->assertJsonPath('data.email_mode', 'daily');
        $this->putJson('/api/account/preferences', ['email_mode' => 'instant'])->assertOk()->assertJsonPath('data.email_mode', 'instant');
        $this->putJson('/api/account/preferences', ['email_mode' => 'hourly'])->assertStatus(422)->assertJsonValidationErrors('email_mode');
        $this->putJson('/api/account/preferences', ['theme' => 'dark'])->assertOk()->assertJsonPath('data.email_mode', 'instant');
        $this->postJson('/api/account/preferences/reset')->assertOk()->assertJsonPath('data.email_mode', 'daily');
    }
}
