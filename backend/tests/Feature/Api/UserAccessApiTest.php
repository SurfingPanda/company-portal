<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;

/** An administrator grants extra permissions to one person with check boxes; the server enforces them. */
class UserAccessApiTest extends ApiTestCase
{
    public function test_a_granted_permission_lets_an_employee_do_what_it_covers_and_nothing_more(): void
    {
        $employee = $this->makeUser('employee');
        $this->actingAs($employee)->getJson('/api/admin/policies')->assertForbidden();

        $admin = $this->makeUser('admin');
        $this->actingAs($admin)->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['policies.manage']])
            ->assertOk()->assertJsonPath('data.granted', ['policies.manage']);

        $this->actingAs($employee->fresh())->getJson('/api/admin/policies')->assertOk();
        $this->getJson('/api/admin/dashboard')->assertOk();
        $this->getJson('/api/admin/users')->assertForbidden();
        $this->assertContains('policies.manage', $this->getJson('/api/auth/me')->json('data.permissions') ?? $this->getJson('/api/auth/me')->json('permissions'));
        $this->assertTrue(AuditLog::where('action', 'ACCESS_UPDATED')->exists());
    }

    public function test_unchecking_removes_the_access_again(): void
    {
        $employee = $this->makeUser('employee');
        $admin = $this->makeUser('admin');
        $this->actingAs($admin)->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['policies.manage', 'reports.view']])->assertOk();
        $this->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['reports.view']])->assertOk()->assertJsonPath('data.granted', ['reports.view']);

        $this->actingAs($employee->fresh())->getJson('/api/admin/policies')->assertForbidden();
    }

    public function test_administration_powers_cannot_be_granted_by_a_check_box(): void
    {
        $employee = $this->makeUser('employee');
        $this->actingAs($this->makeUser('admin'));
        foreach (['users.manage', 'admin.access', 'settings.manage', 'audit.view', 'roles.view', 'made.up'] as $permission) {
            $this->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => [$permission]])->assertStatus(422);
        }
        $this->assertSame([], $employee->fresh()->grantedPermissionNames());
    }

    public function test_only_administrators_open_the_access_screen_and_nobody_edits_their_own(): void
    {
        $employee = $this->makeUser('employee');
        $other = $this->makeUser('employee');
        $this->actingAs($employee)->getJson("/api/admin/users/{$other->id}/access")->assertForbidden();
        $this->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['policies.manage']])->assertForbidden();

        $admin = $this->makeUser('admin');
        $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}/access", ['permissions' => ['reports.view']])->assertStatus(422);
        $this->getJson("/api/admin/users/{$other->id}/access")->assertOk()->assertJsonStructure(['data' => ['user', 'from_roles', 'granted', 'catalog']]);
    }

    public function test_a_disabled_account_keeps_no_access_even_with_grants(): void
    {
        $employee = $this->makeUser('employee');
        $this->actingAs($this->makeUser('admin'))->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['policies.manage']])->assertOk();
        $employee->forceFill(['status' => 'suspended'])->save();
        $this->assertFalse($employee->fresh()->hasPermission('policies.manage'));
    }
}
