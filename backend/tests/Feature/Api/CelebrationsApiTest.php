<?php

namespace Tests\Feature\Api;

use App\Models\DirectoryEntry;
use App\Models\User;
use Carbon\CarbonImmutable;

/** Birthdays (only if the employee agreed, day and month only) and work anniversaries on the dashboard. */
class CelebrationsApiTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-10-06 09:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    /** @param array<string, mixed> $profile  @param array<string, mixed> $entry */
    private function person(string $name, array $profile = [], array $entry = [], array $user = []): User
    {
        static $n = 0;
        $n++;
        $u = $this->makeUser('employee', $user);
        DirectoryEntry::query()->forceCreate([
            'employee_id' => $u->employee_id, 'user_id' => $u->id, 'display_name' => $name, 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified', ...$entry,
        ]);
        if ($profile !== []) {
            $u->profile()->firstOrNew()->forceFill($profile)->save();
        }

        return $u;
    }

    private function celebrations(?int $days = null): array
    {
        return $this->getJson('/api/celebrations'.($days ? "?days={$days}" : ''))->assertOk()->json('data');
    }

    public function test_a_birthday_is_hidden_unless_the_employee_agreed_and_never_shows_the_year(): void
    {
        $this->person('Agreed Alice', ['date_of_birth' => '1990-10-10', 'share_birthday' => true]);
        $this->person('Private Pete', ['date_of_birth' => '1991-10-11', 'share_birthday' => false]);
        $this->person('No Profile Nora');
        $this->person('Agreed But No Date', ['share_birthday' => true]);
        $this->actingAs($this->makeUser());

        $response = $this->getJson('/api/celebrations')->assertOk();
        $names = array_column($response->json('data.birthdays'), 'display_name');
        $this->assertSame(['Agreed Alice'], $names);
        $row = $response->json('data.birthdays.0');
        $this->assertSame('2026-10-10', $row['date'], 'the date is the next occurrence, not the date of birth');
        $this->assertFalse($row['is_today']);
        $this->assertStringNotContainsString('1990', $response->getContent());
        $this->assertStringNotContainsString('1991', $response->getContent());
        $this->assertArrayNotHasKey('age', $row);
        $this->assertArrayNotHasKey('date_of_birth', $row);
        $this->assertSame(['employee_id', 'display_name', 'job_title', 'department', 'is_you', 'date', 'is_today'], array_keys($row));
    }

    public function test_the_window_today_and_year_rollover_work(): void
    {
        $this->person('Today Tom', ['date_of_birth' => '1985-10-06', 'share_birthday' => true]);
        $this->person('Edge Eve', ['date_of_birth' => '1985-11-05', 'share_birthday' => true]);      // day 30: inside
        $this->person('Beyond Ben', ['date_of_birth' => '1985-11-06', 'share_birthday' => true]);    // day 31: outside
        $this->person('Yesterday Yan', ['date_of_birth' => '1985-10-05', 'share_birthday' => true]); // next year
        $this->actingAs($this->makeUser());

        $birthdays = $this->celebrations()['birthdays'];
        $this->assertSame(['Today Tom', 'Edge Eve'], array_column($birthdays, 'display_name'));
        $this->assertSame([true, false], array_column($birthdays, 'is_today'));
        $this->assertSame(['Today Tom', 'Edge Eve', 'Beyond Ben'], array_column($this->celebrations(31)['birthdays'], 'display_name'));

        // December birthdays roll into January.
        CarbonImmutable::setTestNow('2026-12-20 09:00:00');
        $this->person('New Year Nia', ['date_of_birth' => '1999-01-03', 'share_birthday' => true]);
        $this->assertContains('2027-01-03', array_column($this->celebrations()['birthdays'], 'date'));
    }

    public function test_work_anniversaries_use_hr_dates_count_years_and_can_be_turned_off(): void
    {
        $this->person('Five Years Fran', [], ['date_joined' => '2021-10-12']);
        $this->person('First Day Fay', [], ['date_joined' => '2026-10-12']);                         // joined this year: not an anniversary
        $this->person('Hidden Hal', ['share_anniversary' => false], ['date_joined' => '2020-10-15']);
        $this->person('Visible Vic', ['share_anniversary' => true], ['date_joined' => '2016-10-06']); // today, 10 years
        $this->person('No Date Dan');
        $this->actingAs($this->makeUser());

        $anniversaries = $this->celebrations()['anniversaries'];
        $this->assertSame(['Visible Vic', 'Five Years Fran'], array_column($anniversaries, 'display_name'));
        $this->assertSame([10, 5], array_column($anniversaries, 'years'));
        $this->assertSame([true, false], array_column($anniversaries, 'is_today'));
    }

    public function test_hidden_and_departed_people_and_leap_days_are_handled(): void
    {
        $this->person('Hidden Hana', ['date_of_birth' => '1990-10-08', 'share_birthday' => true], ['is_visible' => false]);
        $this->person('Gone Gus', ['date_of_birth' => '1990-10-08', 'share_birthday' => true], ['employment_status' => 'inactive']);
        $this->person('On Leave Lia', ['date_of_birth' => '1990-10-08', 'share_birthday' => true], ['employment_status' => 'on_leave']);
        $this->actingAs($this->makeUser());
        $this->assertSame(['On Leave Lia'], array_column($this->celebrations()['birthdays'], 'display_name'));

        // 29 February is celebrated on 28 February in a year without one.
        CarbonImmutable::setTestNow('2027-02-20 09:00:00');
        $this->person('Leap Lou', ['date_of_birth' => '1992-02-29', 'share_birthday' => true], ['date_joined' => '2020-02-29']);
        $this->assertSame(['2027-02-28'], array_column(array_filter($this->celebrations()['birthdays'], fn ($b) => $b['display_name'] === 'Leap Lou'), 'date'));
        $this->assertSame(['2027-02-28'], array_column($this->celebrations()['anniversaries'], 'date'));
        CarbonImmutable::setTestNow('2028-02-20 09:00:00');
        $this->assertSame(['2028-02-29'], array_column(array_filter($this->celebrations()['birthdays'], fn ($b) => $b['display_name'] === 'Leap Lou'), 'date'));
    }

    public function test_you_are_marked_and_the_request_is_validated_and_needs_sign_in(): void
    {
        $me = $this->person('Me Myself', ['date_of_birth' => '1980-10-07', 'share_birthday' => true]);
        $this->actingAs($me);
        $row = $this->celebrations()['birthdays'][0];
        $this->assertTrue($row['is_you']);

        foreach (['days=0', 'days=61', 'days=abc'] as $bad) {
            $this->getJson("/api/celebrations?{$bad}")->assertStatus(422);
        }
        app('auth')->forgetGuards();
        $this->flushSession();
    }

    public function test_signed_out_visitors_get_nothing(): void
    {
        $this->getJson('/api/celebrations')->assertStatus(401);
    }

    public function test_the_employee_controls_both_switches_from_their_personal_information(): void
    {
        $me = $this->makeUser();
        $this->actingAs($me);
        $this->getJson('/api/profile/personal')->assertJsonPath('data.share_birthday', false)->assertJsonPath('data.share_anniversary', true);

        $this->putJson('/api/profile/personal', ['date_of_birth' => '1990-10-09', 'share_birthday' => true, 'share_anniversary' => false])->assertOk()
            ->assertJsonPath('data.share_birthday', true)->assertJsonPath('data.share_anniversary', false);
        $this->putJson('/api/profile/personal', ['share_birthday' => 'maybe'])->assertStatus(422);
        $this->putJson('/api/profile/personal', ['city' => 'Cebu'])->assertOk()->assertJsonPath('data.share_birthday', true); // unchanged by other edits

        DirectoryEntry::query()->forceCreate(['employee_id' => $me->employee_id, 'user_id' => $me->id, 'display_name' => 'Me', 'is_visible' => true, 'date_joined' => '2020-10-08', 'source' => 'manual', 'verification' => 'unverified']);
        $this->assertSame(['Me'], array_column($this->celebrations()['birthdays'], 'display_name'));
        $this->assertSame([], $this->celebrations()['anniversaries']);

        $this->putJson('/api/profile/personal', ['share_birthday' => false, 'share_anniversary' => true])->assertOk();
        $this->assertSame([], $this->celebrations()['birthdays']);
        $this->assertSame(['Me'], array_column($this->celebrations()['anniversaries'], 'display_name'));
    }
}
