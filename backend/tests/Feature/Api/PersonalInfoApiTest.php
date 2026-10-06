<?php

namespace Tests\Feature\Api;

use App\Models\DirectoryEntry;
use App\Models\User;

/** Personal details and emergency contacts: entered by the employee, readable by HR (and audited), nobody else. */
class PersonalInfoApiTest extends ApiTestCase
{
    private function contact(array $overrides = []): array
    {
        return ['name' => 'Maria Santos', 'relationship' => 'Spouse', 'phone' => '0917 123 4567', 'alternate_phone' => null, 'email' => null, ...$overrides];
    }

    public function test_an_employee_saves_and_reads_their_details_and_ordered_contacts(): void
    {
        $me = $this->signIn();
        $this->getJson('/api/profile/personal')->assertOk()->assertJsonPath('data.date_of_birth', null)->assertJsonPath('data.emergency_contacts', []);

        $this->putJson('/api/profile/personal', [
            'date_of_birth' => '1990-04-12', 'civil_status' => 'married', 'address_line' => '12 Rizal St.', 'city' => 'Cebu City', 'province' => 'Cebu', 'postal_code' => '6000',
            'emergency_contacts' => [$this->contact(), $this->contact(['name' => 'Juan Santos', 'relationship' => 'Father', 'phone' => '+63 2 8123 4567', 'alternate_phone' => '0918 000 1111', 'email' => 'juan@example.com'])],
        ])->assertOk()
            ->assertJsonPath('data.date_of_birth', '1990-04-12')->assertJsonPath('data.civil_status', 'married')->assertJsonPath('data.city', 'Cebu City')
            ->assertJsonPath('data.emergency_contacts.0.name', 'Maria Santos')->assertJsonPath('data.emergency_contacts.1.name', 'Juan Santos')->assertJsonPath('data.emergency_contacts.1.email', 'juan@example.com');
        $this->assertSame(['Maria Santos', 'Juan Santos'], $me->emergencyContacts()->pluck('name')->all());
        $this->assertDatabaseHas('activity_logs', ['user_id' => $me->id, 'activity_type' => 'personal_info_updated']);

        // Details alone leave the contacts untouched; sending the list replaces it; an empty list clears it.
        $this->putJson('/api/profile/personal', ['city' => 'Mandaue'])->assertOk()->assertJsonPath('data.city', 'Mandaue')->assertJsonCount(2, 'data.emergency_contacts');
        $this->putJson('/api/profile/personal', ['emergency_contacts' => [$this->contact(['name' => 'Only One'])]])->assertOk()->assertJsonCount(1, 'data.emergency_contacts')->assertJsonPath('data.province', 'Cebu');
        $this->putJson('/api/profile/personal', ['date_of_birth' => null, 'emergency_contacts' => []])->assertOk()->assertJsonPath('data.date_of_birth', null)->assertJsonCount(0, 'data.emergency_contacts');
    }

    public function test_the_details_are_validated(): void
    {
        $this->signIn();
        $bad = [
            ['date_of_birth' => '2999-01-01'], ['date_of_birth' => '12/04/1990'], ['date_of_birth' => '1800-01-01'], ['civil_status' => 'complicated'], ['postal_code' => '<script>'],
            ['emergency_contacts' => [$this->contact(['name' => ''])]], ['emergency_contacts' => [$this->contact(['phone' => 'call me'])]],
            ['emergency_contacts' => [$this->contact(['relationship' => ''])]], ['emergency_contacts' => [$this->contact(['email' => 'nope'])]],
            ['emergency_contacts' => [$this->contact(['alternate_phone' => 'abc'])]], ['emergency_contacts' => array_fill(0, 6, $this->contact())],
        ];
        foreach ($bad as $i => $payload) {
            $this->putJson('/api/profile/personal', $payload)->assertStatus(422, "case {$i}");
        }
        $this->assertSame(0, \App\Models\EmergencyContact::count());
    }

    public function test_only_the_owner_can_touch_their_own_details(): void
    {
        $other = $this->makeUser();
        $other->emergencyContacts()->create($this->contact(['name' => 'Secret Person']));
        $me = $this->signIn();

        // There is no id to change, and a user_id in the body is ignored.
        $this->putJson('/api/profile/personal', ['user_id' => $other->id, 'emergency_contacts' => [$this->contact(['name' => 'Mine'])]])->assertOk();
        $this->assertSame(['Mine'], $me->emergencyContacts()->pluck('name')->all());
        $this->assertSame(['Secret Person'], $other->emergencyContacts()->pluck('name')->all());
        $this->assertStringNotContainsString('Secret Person', $this->getJson('/api/profile/personal')->getContent());
        $this->assertStringNotContainsString('Secret Person', $this->getJson('/api/profile')->getContent());
    }

    public function test_signed_out_visitors_get_nothing(): void
    {
        $this->getJson('/api/profile/personal')->assertStatus(401);
        $this->putJson('/api/profile/personal', [])->assertStatus(401);
    }

    public function test_hr_can_read_an_employees_details_and_every_look_is_audited(): void
    {
        $employee = $this->makeUser();
        $this->actingAs($employee);
        $this->putJson('/api/profile/personal', ['city' => 'Cebu City', 'emergency_contacts' => [$this->contact()]])->assertOk();
        $entry = DirectoryEntry::query()->forceCreate(['employee_id' => $employee->employee_id, 'user_id' => $employee->id, 'display_name' => 'Pat Doe', 'source' => 'manual', 'verification' => 'unverified']);
        $noAccount = DirectoryEntry::query()->forceCreate(['employee_id' => 'EMP-8001', 'display_name' => 'No Login', 'source' => 'manual', 'verification' => 'unverified']);

        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson("/api/admin/hr/employees/{$entry->id}/personal")->assertStatus(403);
        }
        $this->assertDatabaseMissing('audit_logs', ['action' => 'PERSONAL_DATA_VIEWED']);

        $hr = $this->makeUser('hr');
        $this->actingAs($hr);
        $this->getJson("/api/admin/hr/employees/{$entry->id}/personal")->assertOk()->assertJsonPath('data.city', 'Cebu City')->assertJsonPath('data.emergency_contacts.0.phone', '0917 123 4567');
        $this->assertDatabaseHas('audit_logs', ['action' => 'PERSONAL_DATA_VIEWED', 'actor_user_id' => $hr->id, 'target_label' => "{$employee->employee_id} Pat Doe"]);
        $this->getJson("/api/admin/hr/employees/{$noAccount->id}/personal")->assertOk()->assertJsonPath('data', null);
        $this->getJson('/api/admin/hr/employees/99999/personal')->assertStatus(404);

        // The directory and the list never carry them.
        $this->assertStringNotContainsString('Cebu City', $this->getJson("/api/admin/hr/employees/{$entry->id}")->getContent());
        $this->actingAs($employee);
        $this->assertStringNotContainsString('0917', $this->getJson('/api/directory')->getContent());
    }

    public function test_the_first_sign_in_setup_cannot_finish_without_an_emergency_contact(): void
    {
        $me = $this->makeUser('employee', ['onboarded_at' => null]);
        $this->actingAs($me);

        $this->postJson('/api/auth/onboarding/complete')->assertStatus(422)->assertJsonValidationErrors('emergency_contacts');
        $this->assertNull($me->fresh()->onboarded_at);

        $this->putJson('/api/profile/personal', ['emergency_contacts' => [$this->contact()]])->assertOk();
        $this->postJson('/api/auth/onboarding/complete')->assertOk()->assertJsonPath('data.onboarding_completed', true);
        $this->assertInstanceOf(User::class, $me);
    }
}
