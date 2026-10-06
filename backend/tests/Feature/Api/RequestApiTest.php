<?php

namespace Tests\Feature\Api;

use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Models\ActivityLog;
use App\Models\EmployeeRequest;
use App\Models\PortalNotification;
use App\Models\RequestType;
use Illuminate\Http\UploadedFile;

class RequestApiTest extends ApiTestCase
{
    private function type(array $attributes = []): RequestType
    {
        return RequestType::factory()->create([
            'fields' => [
                ['id' => 'reason', 'label' => 'Reason', 'type' => 'textarea', 'required' => true],
                ['id' => 'days', 'label' => 'Days', 'type' => 'number', 'min' => 1],
                ['id' => 'kind', 'label' => 'Kind', 'type' => 'select', 'options' => ['Vacation', 'Sick']],
            ],
            ...$attributes,
        ]);
    }

    private function payload(RequestType $type, array $overrides = []): array
    {
        return ['request_type_id' => $type->id, 'subject' => 'Leave next week', 'form_data' => ['reason' => 'Family event', 'days' => 3, 'kind' => 'Vacation'], ...$overrides];
    }

    public function test_creating_a_request_generates_reference_history_activity_and_notification(): void
    {
        $user = $this->signIn();
        $type = $this->type(['reference_prefix' => 'LV']);

        $response = $this->postJson('/api/requests', $this->payload($type))->assertCreated();

        $reference = $response->json('data.reference_number');
        $this->assertMatchesRegularExpression('/^LV-'.now()->year.'-0001$/', $reference);
        $response->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.form_data.reason', 'Family event');
        $request = EmployeeRequest::where('reference_number', $reference)->firstOrFail();
        $this->assertSame($user->id, $request->user_id);
        $this->assertSame(['draft', 'submitted'], $request->history->pluck('status')->map->value->all());
        $this->assertNotNull($request->submitted_at);
        $this->assertSame(1, ActivityLog::where('user_id', $user->id)->where('activity_type', 'request_submitted')->count());
        $this->assertSame(1, PortalNotification::where('user_id', $user->id)->where('link', "/requests/{$reference}")->count());
    }

    public function test_references_are_unique_and_sequential_per_prefix(): void
    {
        $this->signIn();
        $generic = $this->type(['reference_prefix' => null]);

        $refs = collect(range(1, 3))->map(fn () => $this->postJson('/api/requests', $this->payload($generic))->assertCreated()->json('data.reference_number'));

        $year = now()->year;
        $this->assertSame(["REQ-{$year}-0001", "REQ-{$year}-0002", "REQ-{$year}-0003"], $refs->all());
        $this->assertCount(3, $refs->unique());
    }

    public function test_a_client_supplied_reference_status_or_owner_is_ignored(): void
    {
        $user = $this->signIn();
        $other = $this->makeUser();
        $type = $this->type();

        $response = $this->postJson('/api/requests', $this->payload($type, [
            'reference_number' => 'HACK-0001', 'status' => 'approved', 'user_id' => $other->id, 'employee_id' => $other->employee_id, 'role' => 'admin',
        ]))->assertCreated();

        $this->assertNotSame('HACK-0001', $response->json('data.reference_number'));
        $this->assertSame('submitted', $response->json('data.status'));
        $this->assertSame($user->id, EmployeeRequest::firstOrFail()->user_id);
        $this->assertSame(['employee'], $user->fresh()->roleNames());
    }

    public function test_drafts_can_be_saved_edited_and_submitted(): void
    {
        $this->signIn();
        $type = $this->type();

        $id = $this->postJson('/api/requests', $this->payload($type, ['save_as_draft' => true, 'form_data' => []]))->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');
        $this->putJson("/api/requests/{$id}", ['subject' => 'Updated subject', 'form_data' => ['reason' => 'Now filled in'], 'submit' => true])
            ->assertOk()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.subject', 'Updated subject');

        // Once submitted it can no longer be edited.
        $this->putJson("/api/requests/{$id}", ['subject' => 'Sneaky edit'])->assertStatus(403);
    }

    public function test_employees_cannot_set_their_own_request_to_approved_or_completed(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/requests', $this->payload($this->type()))->json('data.id');

        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved'])->assertStatus(403);
        $this->putJson("/api/requests/{$id}", ['status' => 'approved'])->assertStatus(403);
        $this->assertSame(RequestStatus::Submitted, EmployeeRequest::find($id)->status);
    }

    public function test_cancelling_works_for_open_requests_only(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/requests', $this->payload($this->type()))->json('data.id');

        $this->postJson("/api/requests/{$id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->postJson("/api/requests/{$id}/cancel")->assertStatus(403);
    }

    public function test_invalid_requests_are_rejected_with_422(): void
    {
        $this->signIn();
        $type = $this->type();
        $inactive = $this->type(['is_active' => false]);

        $this->postJson('/api/requests', [])->assertStatus(422)->assertJsonValidationErrors(['request_type_id', 'subject']);
        $this->postJson('/api/requests', $this->payload($type, ['form_data' => ['days' => 2]]))->assertStatus(422)->assertJsonValidationErrors(['form_data.reason']);
        $this->postJson('/api/requests', $this->payload($type, ['form_data' => ['reason' => 'x', 'kind' => 'Holiday']]))->assertStatus(422)->assertJsonValidationErrors(['form_data.kind']);
        $this->postJson('/api/requests', $this->payload($type, ['form_data' => ['reason' => 'x', 'days' => 0]]))->assertStatus(422)->assertJsonValidationErrors(['form_data.days']);
        $this->postJson('/api/requests', $this->payload($inactive))->assertStatus(422)->assertJsonValidationErrors(['request_type_id']);
        $this->postJson('/api/requests', $this->payload($type, ['subject' => str_repeat('a', 300)]))->assertStatus(422);
        $this->assertSame(0, EmployeeRequest::count(), 'nothing is left behind by a rejected request');
    }

    public function test_unknown_answers_are_discarded(): void
    {
        $this->signIn();

        $response = $this->postJson('/api/requests', $this->payload($this->type(), ['form_data' => ['reason' => 'ok', 'is_admin' => true, '__proto__' => 'x']]))->assertCreated();

        $this->assertSame(['reason'], array_keys($response->json('data.form_data')));
    }

    public function test_listing_filters_search_sorting_and_ownership(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();
        $type = $this->type();
        $leave = $this->type(['name' => 'Leave Sample']);
        EmployeeRequest::factory()->forUser($me)->create(['subject' => 'Alpha', 'status' => RequestStatus::UnderReview, 'request_type_id' => $type->id, 'reference_number' => 'REQ-2026-0101']);
        EmployeeRequest::factory()->forUser($me)->create(['subject' => 'Beta', 'status' => RequestStatus::Submitted, 'request_type_id' => $leave->id, 'reference_number' => 'REQ-2026-0102']);
        EmployeeRequest::factory()->forUser($other)->create(['subject' => 'Not mine', 'status' => RequestStatus::UnderReview]);

        $subjects = fn (string $q) => collect($this->getJson("/api/requests{$q}")->assertOk()->json('data'))->pluck('subject')->all();

        $this->assertEqualsCanonicalizing(['Alpha', 'Beta'], $subjects(''));
        $this->assertSame(['Alpha'], $subjects('?status=under-review'));
        $this->assertSame(['Beta'], $subjects('?request_type_id='.$leave->id));
        $this->assertSame(['Beta'], $subjects('?search=0102'));
        $this->assertSame(['Alpha', 'Beta'], $subjects('?sort=reference_number&direction=asc'));
        $this->assertSame(['Alpha', 'Beta'], $subjects('?from='.now()->subDay()->toDateString().'&to='.now()->addDay()->toDateString().'&sort=reference_number&direction=asc'));
        $this->getJson('/api/requests?status=unknown')->assertStatus(422);
        $this->getJson('/api/requests?scope=review')->assertStatus(403);
    }

    public function test_history_hides_internal_staff_notes_from_the_requester(): void
    {
        $owner = $this->signIn();
        $type = $this->type(['category' => RequestCategory::Hr]);
        $id = $this->postJson('/api/requests', $this->payload($type))->json('data.id');

        $this->actingAs($this->makeUser('hr'));
        $this->postJson("/api/requests/{$id}/status", ['status' => 'under-review', 'comment' => 'Checking records', 'internal' => true])->assertOk();
        $this->postJson("/api/requests/{$id}/status", ['status' => 'approved', 'comment' => 'Approved. Enjoy your leave.'])->assertOk();
        $staffView = collect($this->getJson("/api/requests/{$id}/history")->json('data'));
        $this->assertTrue($staffView->contains('comment', 'Checking records'), 'staff see internal notes');

        $this->actingAs($owner);
        $history = collect($this->getJson("/api/requests/{$id}/history")->assertOk()->json('data'));
        $this->assertFalse($history->contains('comment', 'Checking records'), 'the requester never sees internal notes');
        $this->assertSame(['draft', 'submitted', 'under-review', 'approved'], $history->pluck('status')->all());
        $this->assertSame('Approved. Enjoy your leave.', $history->last()['comment']);
        $this->assertSame('Portal staff', $history->last()['actor'], 'staff are not identified by account');
        $this->assertSame('You', $history->first()['actor']);
        $this->assertSame(['draft', 'submitted', 'under-review', 'approved'], collect($this->getJson("/api/requests/{$id}")->json('data.history'))->pluck('status')->all());
        // The requester was notified of the status change.
        $this->assertTrue(PortalNotification::where('user_id', $owner->id)->where('message', 'like', '%approved%')->exists());
    }

    public function test_staff_review_is_limited_by_role(): void
    {
        $owner = $this->makeUser();
        $hrRequest = EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => RequestType::factory()->create(['category' => RequestCategory::Hr])->id]);
        $itRequest = EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => RequestType::factory()->create(['category' => RequestCategory::It])->id]);

        $this->actingAs($this->makeUser('hr'));
        $this->postJson("/api/requests/{$hrRequest->id}/status", ['status' => 'completed'])->assertOk()->assertJsonPath('data.status', 'completed');
        $this->postJson("/api/requests/{$itRequest->id}/status", ['status' => 'completed'])->assertStatus(404); // HR cannot even see IT requests
        $this->postJson("/api/requests/{$hrRequest->id}/status", ['status' => 'draft'])->assertStatus(422);

        $this->actingAs($this->makeUser('manager'));
        // Not routed to this manager (no approval route exists): same answer as an unknown id.
        $this->postJson("/api/requests/{$hrRequest->id}/status", ['status' => 'approved'])->assertStatus(404);

        $this->actingAs($this->makeUser('admin'));
        $this->postJson("/api/requests/{$itRequest->id}/status", ['status' => 'approved'])->assertOk();
        $this->assertCount(2, $this->getJson('/api/requests?scope=review')->json('data'));
    }

    public function test_attachments_are_validated_stored_privately_and_never_expose_paths(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/requests', $this->payload($this->type()))->json('data.id');

        $ok = $this->post("/api/requests/{$id}/attachments", ['file' => UploadedFile::fake()->create('letter.pdf', 200, 'application/pdf')])->assertCreated();
        $ok->assertJsonPath('data.filename', 'letter.pdf')->assertJsonPath('data.mime_type', 'application/pdf');
        $this->assertArrayNotHasKey('storage_path', $ok->json('data'));
        $this->assertStringNotContainsString('attachments/', $ok->getContent());
        $path = \App\Models\RequestAttachment::firstOrFail()->storage_path;
        \Storage::disk('local')->assertExists($path);
        $this->assertStringNotContainsString('letter', $path, 'the stored name is server-generated');

        $this->getJson("/api/requests/{$id}/attachments")->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson("/api/requests/{$id}/attachments/".$ok->json('data.id'))->assertNoContent();
        \Storage::disk('local')->assertMissing($path);
    }

    public function test_unsafe_or_oversized_uploads_are_rejected(): void
    {
        $this->signIn();
        $id = $this->postJson('/api/requests', $this->payload($this->type()))->json('data.id');

        foreach (['malware.exe', 'shell.php', 'script.js', 'page.html', 'run.sh', 'archive.zip', 'trick.pdf.php'] as $name) {
            $this->post("/api/requests/{$id}/attachments", ['file' => UploadedFile::fake()->create($name, 10)])->assertStatus(422)->assertJsonValidationErrors('file');
        }
        // A renamed executable: the extension says PDF but the content is not.
        // (a real file, so the MIME type is detected from its bytes rather than taken from the name)
        $path = tempnam(sys_get_temp_dir(), 'att');
        file_put_contents($path, "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00 This program cannot be run in DOS mode.");
        $disguised = new UploadedFile($path, 'report.pdf', 'application/pdf', null, true);
        $this->post("/api/requests/{$id}/attachments", ['file' => $disguised])->assertStatus(422)->assertJsonValidationErrors('file');
        @unlink($path);
        $this->post("/api/requests/{$id}/attachments", ['file' => UploadedFile::fake()->create('big.pdf', 6000, 'application/pdf')])->assertStatus(422);
        $this->post("/api/requests/{$id}/attachments", [])->assertStatus(422);
        $this->assertSame(0, \App\Models\RequestAttachment::count());
    }

    public function test_hr_requests_endpoint_only_accepts_hr_services(): void
    {
        $this->signIn();
        $hr = $this->type(['category' => RequestCategory::Hr]);
        $it = $this->type(['category' => RequestCategory::It]);

        $this->postJson('/api/hr/requests', $this->payload($hr))->assertCreated();
        $this->postJson('/api/hr/requests', $this->payload($it))->assertStatus(422)->assertJsonValidationErrors('request_type_id');
    }

    public function test_request_types_list_only_available_types(): void
    {
        $this->type(['name' => 'Available HR', 'category' => RequestCategory::Hr]);
        $this->type(['name' => 'Retired type', 'is_active' => false]);
        $this->type(['name' => 'IT access', 'category' => RequestCategory::It]);
        $this->signIn();

        $names = fn (string $q = '') => collect($this->getJson("/api/request-types{$q}")->assertOk()->json('data'))->pluck('name')->all();

        $this->assertEqualsCanonicalizing(['Available HR', 'IT access'], $names());
        $this->assertSame(['IT access'], $names('?category=it'));
        $this->assertNotContains('Retired type', $names('?active=false'), 'employees cannot list inactive types');
        $inactiveId = RequestType::where('name', 'Retired type')->value('id');
        $this->getJson("/api/request-types/{$inactiveId}")->assertStatus(404);
        $this->getJson('/api/request-types/'.RequestType::where('name', 'Available HR')->value('id'))->assertOk()->assertJsonStructure(['data' => ['id', 'name', 'category', 'fields']]);

        $this->actingAs($this->makeUser('admin'));
        $this->assertSame(['Retired type'], $names('?active=false'));
    }
}
