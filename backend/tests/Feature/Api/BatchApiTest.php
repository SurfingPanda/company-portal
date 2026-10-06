<?php

namespace Tests\Feature\Api;

use App\Models\Announcement;
use App\Models\User;

/** One request that answers several reads, each exactly as if it had been asked on its own. */
class BatchApiTest extends ApiTestCase
{
    private function batch(array $paths)
    {
        return $this->getJson('/api/batch?'.http_build_query(['paths' => $paths]));
    }

    public function test_each_answer_is_exactly_what_the_single_request_would_give(): void
    {
        $user = $this->signIn();
        \App\Services\PortalEvents::notify($user, \App\Enums\NotificationType::System, 'Hello', 'A message.', '/profile');
        $paths = ['/api/notifications?per_page=4', '/api/requests?per_page=5&sort=created_at&direction=desc', '/api/celebrations?days=30', '/api/policies?status=pending', '/api/profile/personal', '/api/account/preferences'];

        $results = $this->batch($paths)->assertOk()->json('results');

        $this->assertSame($paths, array_keys($results));
        foreach ($paths as $path) {
            $single = $this->getJson($path);
            $this->assertSame($single->status(), $results[$path]['status'], $path);
            $this->assertEquals($single->json(), $results[$path]['body'], $path);
        }
        $this->assertSame('Hello', $results['/api/notifications?per_page=4']['body']['data'][0]['title']);
    }

    public function test_every_path_keeps_its_own_permissions_and_errors(): void
    {
        $this->signIn('employee');
        $results = $this->batch(['/api/notifications', '/api/admin/policies', '/api/admin/users', '/api/policies/99999', '/api/does-not-exist'])->assertOk()->json('results');

        $this->assertSame(200, $results['/api/notifications']['status']);
        $this->assertSame(403, $results['/api/admin/policies']['status'], 'an employee gets nothing from the admin endpoints, even in a batch');
        $this->assertSame(403, $results['/api/admin/users']['status']);
        $this->assertSame(404, $results['/api/policies/99999']['status']);
        $this->assertSame(404, $results['/api/does-not-exist']['status']);
        $this->assertStringNotContainsString('"data"', json_encode($results['/api/admin/users']['body']));
    }

    public function test_it_answers_as_the_signed_in_person_and_never_as_someone_else(): void
    {
        $other = $this->makeUser();
        \App\Services\PortalEvents::notify($other, \App\Enums\NotificationType::System, 'Private to other', 'x');
        $me = $this->signIn();
        \App\Services\PortalEvents::notify($me, \App\Enums\NotificationType::System, 'Mine', 'x');

        $titles = collect($this->batch(['/api/notifications'])->json('results./api/notifications.body.data'))->pluck('title')->all();
        $this->assertSame(['Mine'], $titles);
    }

    public function test_admin_paths_work_for_people_who_may_read_them(): void
    {
        $this->actingAs($this->makeUser('hr'));
        $results = $this->batch(['/api/admin/policies', '/api/admin/hr/employees'])->assertOk()->json('results');
        $this->assertSame([200, 200], [$results['/api/admin/policies']['status'], $results['/api/admin/hr/employees']['status']]);
    }

    public function test_only_plain_get_paths_under_api_are_accepted(): void
    {
        $this->signIn();
        foreach ([
            ['/api/batch?paths[]=x'], ['/api/auth/me'], ['/api/auth/login'], ['/sanctum/csrf-cookie'], ['https://evil.example/api/x'], ['//evil.example/api/x'],
            ['/api/../.env'], ['/api/notifications<script>'], ['api/notifications'], ["/api/notifications\nX-Evil: 1"], [str_repeat('/api/a', 200)],
        ] as [$bad]) {
            $this->batch([$bad])->assertStatus(422);
        }
        $this->getJson('/api/batch')->assertStatus(422);
        $this->batch([])->assertStatus(422);
        $this->batch(array_map(fn ($i) => "/api/policies?x={$i}", range(1, 26)))->assertStatus(422);
        $this->assertSame(25, count($this->batch(array_map(fn ($i) => "/api/policies?x={$i}", range(1, 25)))->assertOk()->json('results')));
    }

    public function test_a_batch_cannot_run_writes(): void
    {
        $this->signIn();
        // The endpoint itself is GET only, and every sub-request is dispatched as a GET: a POST-only route answers 405.
        $this->postJson('/api/batch', ['paths' => ['/api/notifications']])->assertStatus(405);
        $results = $this->batch(['/api/account/password', '/api/profile/personal'])->assertOk()->json('results');
        $this->assertSame(405, $results['/api/account/password']['status']);
        $this->assertSame(200, $results['/api/profile/personal']['status']);
    }

    public function test_signed_out_visitors_get_nothing(): void
    {
        $this->batch(['/api/notifications'])->assertStatus(401);
    }

    public function test_the_request_is_restored_and_duplicates_are_answered_once(): void
    {
        $this->signIn();
        $response = $this->batch(['/api/policies', '/api/policies', '/api/celebrations'])->assertOk();
        $this->assertSame(['/api/policies', '/api/celebrations'], array_keys($response->json('results')));
        // A normal request right afterwards still sees itself (the shared "current request" was put back).
        $this->getJson('/api/profile/personal')->assertOk();
        $this->assertInstanceOf(User::class, auth()->user());
        $this->assertNotNull(Announcement::query()->getModel());
    }
}
