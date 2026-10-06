<?php

namespace Tests\Feature\Api;

use App\Models\HelpdeskTicket;
use App\Models\PortalNotification;
use App\Services\Hubly;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/** The link to Hubly: tickets go out signed, updates come back signed, and only the requester is told. */
class HublyIntegrationTest extends ApiTestCase
{
    private const SECRET = 'a-shared-secret-that-is-at-least-32-characters-long';

    protected function setUp(): void
    {
        parent::setUp();
        config(['hubly.enabled' => true, 'hubly.url' => 'https://hubly.test/backend/api/integrations/portal', 'hubly.secret' => self::SECRET]);
    }

    private function ticketFor($user): HelpdeskTicket
    {
        $ticket = new HelpdeskTicket(['category' => 'hardware', 'type' => 'incident', 'subject' => 'Screen flickers', 'description' => 'It flickers.', 'priority' => 'normal']);
        $ticket->forceFill(['user_id' => $user->id, 'ticket_number' => 'INC-00001', 'status' => 'new'])->save();

        return $ticket;
    }

    private function fromHubly(array $payload, ?string $secret = null, ?int $time = null)
    {
        $body = json_encode($payload);
        $time = (string) ($time ?? time());
        $signature = hash_hmac('sha256', $time.'.'.$body, $secret ?? self::SECRET);

        return $this->call('POST', '/api/integrations/hubly/events', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'HTTP_X_HUBLY_TIMESTAMP' => $time, 'HTTP_X_HUBLY_SIGNATURE' => $signature,
        ], $body);
    }

    public function test_a_new_ticket_is_sent_to_hubly_signed_and_the_hubly_number_is_kept(): void
    {
        Http::fake(['hubly.test/*' => Http::response(['external_id' => 'WO00000042'], 201)]);
        $user = $this->makeUser('employee');
        $this->actingAs($user)->postJson('/api/helpdesk/tickets', ['category' => 'hardware', 'type' => 'incident', 'subject' => 'Screen flickers', 'description' => 'It flickers a lot.', 'priority' => 'high'])->assertCreated();

        Http::assertSent(function ($request) use ($user) {
            $timestamp = $request->header('X-Portal-Timestamp')[0];

            return $request->url() === config('hubly.url')
                && hash_equals(hash_hmac('sha256', $timestamp.'.'.$request->body(), self::SECRET), $request->header('X-Portal-Signature')[0])
                && $request['event'] === 'ticket.created' && $request['requester']['email'] === $user->email && $request['ticket']['priority'] === 'high';
        });
        $ticket = HelpdeskTicket::query()->firstOrFail();
        $this->assertSame('WO00000042', $ticket->external_id);
        $this->assertNotNull(DB::table('hubly_outbox')->value('sent_at'));
    }

    public function test_a_failed_delivery_is_kept_and_retried_later(): void
    {
        Http::fake(['hubly.test/*' => Http::sequence()->push('down', 503)->push(['external_id' => 'WO00000043'], 200)]);
        $user = $this->makeUser('employee');
        $this->actingAs($user)->postJson('/api/helpdesk/tickets', ['category' => 'hardware', 'type' => 'incident', 'subject' => 'Mouse', 'description' => 'It does not move.'])->assertCreated();

        $row = DB::table('hubly_outbox')->first();
        $this->assertNull($row->sent_at);
        $this->assertSame(1, $row->attempts);
        $this->assertNotNull($row->next_attempt_at, 'a retry is scheduled');

        $this->travel(5)->minutes();
        $this->assertSame(1, Hubly::deliverDue());
        $this->assertNotNull(DB::table('hubly_outbox')->value('sent_at'));
        $this->assertSame('WO00000043', HelpdeskTicket::query()->value('external_id'));
    }

    public function test_nothing_is_sent_while_the_link_is_off(): void
    {
        config(['hubly.enabled' => false]);
        Http::fake();
        $this->actingAs($this->makeUser('employee'))->postJson('/api/helpdesk/tickets', ['category' => 'hardware', 'type' => 'incident', 'subject' => 'Mouse', 'description' => 'It does not move.'])->assertCreated();
        Http::assertNothingSent();
        $this->assertSame(0, DB::table('hubly_outbox')->count());
    }

    public function test_a_status_change_and_public_note_from_hubly_update_the_ticket_and_notify_the_requester(): void
    {
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);

        $this->fromHubly(['event_id' => 'evt-1', 'type' => 'status_changed', 'ticket_number' => 'INC-00001', 'status' => 'in_progress', 'status_label' => 'In progress', 'assignee_name' => 'Maria Santos', 'external_id' => 'WO00000042'])
            ->assertOk()->assertJsonPath('applied', true);
        $this->fromHubly(['event_id' => 'evt-2', 'type' => 'note_added', 'ticket_number' => 'INC-00001', 'note' => 'We are replacing the cable.', 'visibility' => 'public', 'author_name' => 'Maria Santos'])->assertOk();

        $ticket->refresh();
        $this->assertSame('open', $ticket->status->value);
        $this->assertSame('In progress', $ticket->external_status);
        $this->assertSame('Maria Santos', $ticket->external_assignee);
        $this->assertSame('WO00000042', $ticket->external_id);
        $this->assertSame(['Ticket update', 'New note on your ticket'], PortalNotification::query()->where('user_id', $user->id)->orderBy('id')->pluck('title')->all());

        $shown = $this->actingAs($user)->getJson("/api/helpdesk/tickets/{$ticket->id}")->assertOk();
        $shown->assertJsonPath('data.status_label', 'In progress')->assertJsonPath('data.handled_by', 'Maria Santos');
        $this->assertSame('Maria Santos (IT support)', $shown->json('data.replies.0.author'));
    }

    public function test_resolving_in_hubly_resolves_the_ticket_here(): void
    {
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);
        $this->fromHubly(['event_id' => 'evt-9', 'type' => 'status_changed', 'ticket_number' => 'INC-00001', 'status' => 'resolved', 'status_label' => 'Resolved'])->assertOk();
        $this->assertSame('resolved', $ticket->refresh()->status->value);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_internal_notes_never_reach_the_employee_and_a_repeat_delivery_is_applied_once(): void
    {
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);
        $this->fromHubly(['event_id' => 'evt-3', 'type' => 'note_added', 'ticket_number' => 'INC-00001', 'note' => 'Escalate this one quietly.', 'visibility' => 'internal'])->assertOk();
        $this->assertSame(0, $ticket->replies()->count());
        $this->assertSame(0, PortalNotification::query()->where('user_id', $user->id)->count());

        $payload = ['event_id' => 'evt-4', 'type' => 'note_added', 'ticket_number' => 'INC-00001', 'note' => 'Fixed.', 'visibility' => 'public'];
        $this->fromHubly($payload)->assertOk()->assertJsonPath('duplicate', false);
        $this->fromHubly($payload)->assertOk()->assertJsonPath('duplicate', true);
        $this->assertSame(1, $ticket->replies()->count());
        $this->assertSame(1, PortalNotification::query()->where('user_id', $user->id)->count());
    }

    public function test_unsigned_forged_stale_or_disabled_calls_are_refused(): void
    {
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);
        $payload = ['event_id' => 'evt-5', 'type' => 'status_changed', 'ticket_number' => 'INC-00001', 'status' => 'closed'];

        $this->postJson('/api/integrations/hubly/events', $payload)->assertStatus(401);
        $this->fromHubly($payload, 'a-different-secret-that-is-also-32-chars-long')->assertStatus(401);
        $this->fromHubly($payload, null, time() - 3600)->assertStatus(401);
        $this->assertSame('new', $ticket->refresh()->status->value);

        config(['hubly.enabled' => false]);
        $this->fromHubly($payload)->assertStatus(404);
    }

    public function test_bad_events_are_rejected_without_changing_anything(): void
    {
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);
        $this->fromHubly(['event_id' => 'e1', 'type' => 'status_changed', 'ticket_number' => 'INC-00001', 'status' => 'exploded'])->assertStatus(422);
        $this->fromHubly(['event_id' => 'e2', 'type' => 'drop_tables', 'ticket_number' => 'INC-00001'])->assertStatus(422);
        $this->fromHubly(['event_id' => 'e3', 'type' => 'status_changed', 'ticket_number' => 'INC-99999', 'status' => 'closed'])->assertStatus(404);
        $this->assertSame('new', $ticket->refresh()->status->value);
    }

    public function test_it_staff_cannot_edit_in_the_portal_while_hubly_is_the_master_but_the_requester_can_reply(): void
    {
        Http::fake(['hubly.test/*' => Http::response(['external_id' => 'WO1'], 200)]);
        $user = $this->makeUser('employee');
        $ticket = $this->ticketFor($user);
        $staff = $this->makeUser('it');

        $this->actingAs($staff)->patchJson("/api/helpdesk/tickets/{$ticket->id}", ['status' => 'resolved'])->assertStatus(409);
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/claim")->assertStatus(409);
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'On it'])->assertStatus(409);

        $this->actingAs($user)->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'Still flickering'])->assertCreated();
        Http::assertSent(fn ($r) => $r['event'] === 'ticket.reply' && $r['reply']['message'] === 'Still flickering');
    }

    public function test_staff_can_see_the_link_status_and_everyone_else_cannot(): void
    {
        $this->actingAs($this->makeUser('employee'))->getJson('/api/admin/hubly/status')->assertForbidden();
        $this->actingAs($this->makeUser('it'))->getJson('/api/admin/hubly/status')->assertOk()->assertJsonPath('data.enabled', true);
    }
}
