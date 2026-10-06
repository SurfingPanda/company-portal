<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Base for API tests. Requests carry the SPA's Origin so Sanctum treats them as first-party (session cookie) requests,
 * exactly like the browser, and use `actingAs` for the signed-in user.
 */
abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('local');
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/', 'Accept' => 'application/json']);
    }

    protected function makeUser(string $role = 'employee', array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->roles()->attach(Role::where('name', $role)->firstOrFail());

        return $user->fresh();
    }

    protected function signIn(string $role = 'employee'): User
    {
        $user = $this->makeUser($role);
        $this->actingAs($user);

        return $user;
    }
}
