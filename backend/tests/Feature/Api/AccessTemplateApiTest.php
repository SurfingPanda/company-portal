<?php

namespace Tests\Feature\Api;

use App\Models\AccessTemplate;

/** Reusable access templates: administrators only, grantable permissions only. */
class AccessTemplateApiTest extends ApiTestCase
{
    public function test_starter_templates_exist_and_only_hold_grantable_permissions(): void
    {
        $this->actingAs($this->makeUser('admin'));
        $data = $this->getJson('/api/admin/access-templates')->assertOk()->json('data');
        $this->assertContains('Policy Officer', array_column($data, 'name'));
        foreach ($data as $template) {
            $this->assertSame([], array_diff($template['permissions'], \App\Authorization\RolePermissions::grantable()), $template['name']);
        }
    }

    public function test_an_administrator_creates_edits_and_deletes_a_template(): void
    {
        $this->actingAs($this->makeUser('admin'));
        $id = $this->postJson('/api/admin/access-templates', ['name' => 'Payroll Clerk', 'permissions' => ['reports.view']])->assertCreated()->json('data.id');
        $this->putJson("/api/admin/access-templates/{$id}", ['name' => 'Payroll Clerk', 'description' => 'Reads reports', 'permissions' => ['reports.view', 'documents.hr-manage']])
            ->assertOk()->assertJsonPath('data.permissions', ['reports.view', 'documents.hr-manage']);
        $this->deleteJson("/api/admin/access-templates/{$id}")->assertNoContent();
        $this->assertNull(AccessTemplate::find($id));
    }

    public function test_a_template_cannot_carry_an_administration_power_or_a_duplicate_name(): void
    {
        $this->actingAs($this->makeUser('admin'));
        $this->postJson('/api/admin/access-templates', ['name' => 'Sneaky', 'permissions' => ['users.manage']])->assertStatus(422);
        $this->postJson('/api/admin/access-templates', ['name' => 'Policy Officer', 'permissions' => []])->assertStatus(422);
    }

    public function test_everyone_else_is_refused(): void
    {
        foreach (['employee', 'hr', 'manager'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/access-templates')->assertForbidden();
            $this->postJson('/api/admin/access-templates', ['name' => 'X', 'permissions' => []])->assertForbidden();
        }
    }
}
