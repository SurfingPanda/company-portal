<?php

namespace Tests\Feature\Api;

use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Models\ActivityLog;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\JobReferral;
use App\Models\PortalNotification;
use App\Models\RecruitmentJob;
use Illuminate\Http\UploadedFile;

class ActivityAndTicketApiTest extends ApiTestCase
{
    // --- Notifications -----------------------------------------------------------------------------------------------

    public function test_own_notifications_list_filter_and_mark_read(): void
    {
        $me = $this->signIn();
        $mine = PortalNotification::factory()->forUser($me)->create(['title' => 'Mine unread', 'type' => 'request']);
        PortalNotification::factory()->forUser($me)->create(['title' => 'Mine read', 'type' => 'hr', 'read_at' => now()]);
        PortalNotification::factory()->forUser($this->makeUser())->create(['title' => 'Someone else']);

        $titles = fn (string $q = '') => collect($this->getJson("/api/notifications{$q}")->assertOk()->json('data'))->pluck('title')->all();

        $this->assertEqualsCanonicalizing(['Mine unread', 'Mine read'], $titles());
        $this->assertSame(['Mine unread'], $titles('?unread=true'));
        $this->assertSame(['Mine read'], $titles('?type=hr'));
        $this->getJson('/api/notifications?type=bogus')->assertStatus(422);
        $this->getJson('/api/notifications')->assertJsonStructure(['data' => [['id', 'type', 'title', 'message', 'link', 'read_at', 'created_at']], 'meta']);

        $this->postJson("/api/notifications/{$mine->id}/read")->assertOk()->assertJsonPath('data.title', 'Mine unread');
        $this->assertNotNull($mine->fresh()->read_at);
        $this->assertSame([], $titles('?unread=true'));
    }

    public function test_read_all_only_touches_my_notifications(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();
        PortalNotification::factory()->forUser($me)->count(2)->create();
        $theirs = PortalNotification::factory()->forUser($other)->create();

        $this->postJson('/api/notifications/read-all')->assertOk()->assertJsonPath('data.updated', 2);

        $this->assertSame(0, PortalNotification::ownedBy($me)->unread()->count());
        $this->assertNull($theirs->fresh()->read_at);
    }

    public function test_another_users_notification_is_not_found_even_for_admins(): void
    {
        $theirs = PortalNotification::factory()->forUser($this->makeUser())->create();

        foreach (['employee', 'admin'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson("/api/notifications/{$theirs->id}")->assertStatus(404);
            $this->postJson("/api/notifications/{$theirs->id}/read")->assertStatus(404);
        }
        $this->assertNull($theirs->fresh()->read_at);
    }

    public function test_notification_preferences_suppress_server_notifications(): void
    {
        $me = $this->signIn();
        $me->preferences()->create(['notify_requests' => false]);

        $type = \App\Models\RequestType::factory()->create();
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'Quiet request'])->assertCreated();

        $this->assertSame(0, PortalNotification::ownedBy($me)->count(), 'the employee turned request notifications off');
        $this->assertSame(1, ActivityLog::where('user_id', $me->id)->where('activity_type', 'request_submitted')->count(), 'activity is still recorded');
    }

    // --- Activity ----------------------------------------------------------------------------------------------------

    public function test_activity_is_the_signed_in_employees_own_feed(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();
        $me->activityLogs()->forceCreate(['user_id' => $me->id, 'activity_type' => 'request_submitted', 'description' => 'Mine A']);
        $me->activityLogs()->forceCreate(['user_id' => $me->id, 'activity_type' => 'document_viewed', 'description' => 'Mine B']);
        $other->activityLogs()->forceCreate(['user_id' => $other->id, 'activity_type' => 'request_submitted', 'description' => 'Theirs']);

        $descriptions = fn (string $q = '') => collect($this->getJson("/api/activity{$q}")->assertOk()->json('data'))->pluck('description')->all();

        $this->assertEqualsCanonicalizing(['Mine A', 'Mine B'], $descriptions());
        $this->assertSame(['Mine A'], $descriptions('?type=request'));
        $this->assertSame(['Mine B'], $descriptions('?type=document_viewed'));
        $this->assertSame([], $descriptions('?from='.now()->addDay()->toDateString()));
        $this->assertSame(['id', 'type', 'description', 'entity_type', 'entity_id', 'created_at'], array_keys($this->getJson('/api/activity')->json('data.0')), 'no audit internals');
        $this->getJson('/api/activity?type=bad;drop')->assertStatus(422);
    }

    // --- Helpdesk ----------------------------------------------------------------------------------------------------

    private function ticketPayload(array $overrides = []): array
    {
        return ['type' => 'incident', 'category' => 'hardware', 'subject' => 'Laptop will not start', 'description' => 'It shows a black screen.', ...$overrides];
    }

    public function test_creating_a_ticket_generates_number_activity_and_notification(): void
    {
        $me = $this->signIn();

        $response = $this->postJson('/api/helpdesk/tickets', $this->ticketPayload(['priority' => 'high', 'asset_tag' => 'AST-1']))->assertCreated();

        $this->assertMatchesRegularExpression('/^INC-'.now()->year.'-00001$/', $response->json('data.ticket_number'));
        $response->assertJsonPath('data.status', 'new')->assertJsonPath('data.priority', 'high');
        $this->assertSame(1, ActivityLog::where('user_id', $me->id)->where('activity_type', 'ticket_created')->count());
        $this->assertSame(1, PortalNotification::ownedBy($me)->count());
        $this->postJson('/api/helpdesk/tickets', $this->ticketPayload())->assertCreated()->assertJsonPath('data.ticket_number', 'INC-'.now()->year.'-00002');
    }

    public function test_ticket_creation_ignores_protected_fields_and_validates_input(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();

        $this->postJson('/api/helpdesk/tickets', $this->ticketPayload(['status' => 'closed', 'user_id' => $other->id, 'ticket_number' => 'HACK', 'assigned_to' => $other->id]))->assertCreated();
        $ticket = HelpdeskTicket::firstOrFail();
        $this->assertSame($me->id, $ticket->user_id);
        $this->assertNotSame('HACK', $ticket->ticket_number);
        $this->assertSame('new', $ticket->status->value);
        $this->assertNull($ticket->assigned_to);

        $this->postJson('/api/helpdesk/tickets', [])->assertStatus(422)->assertJsonValidationErrors(['type', 'category', 'subject', 'description']);
        $this->postJson('/api/helpdesk/tickets', $this->ticketPayload(['category' => 'plumbing']))->assertStatus(422);
        $this->assertSame(1, HelpdeskTicket::count());
    }

    public function test_own_tickets_are_listed_filtered_and_visible_others_are_not(): void
    {
        $me = $this->signIn();
        HelpdeskTicket::factory()->forUser($me)->create(['subject' => 'My printer', 'category' => 'printer', 'priority' => 'low', 'status' => 'open']);
        HelpdeskTicket::factory()->forUser($me)->create(['subject' => 'My laptop', 'category' => 'hardware']);
        $theirs = HelpdeskTicket::factory()->forUser($this->makeUser())->create(['subject' => 'Their laptop']);

        $subjects = fn (string $q = '') => collect($this->getJson("/api/helpdesk/tickets{$q}")->assertOk()->json('data'))->pluck('subject')->all();

        $this->assertEqualsCanonicalizing(['My printer', 'My laptop'], $subjects());
        $this->assertSame(['My printer'], $subjects('?category=printer'));
        $this->assertSame(['My printer'], $subjects('?status=open'));
        $this->assertSame(['My printer'], $subjects('?priority=low'));
        $this->assertSame(['My laptop'], $subjects('?search=laptop'));
        $this->getJson("/api/helpdesk/tickets/{$theirs->id}")->assertStatus(404);
        $this->getJson('/api/helpdesk/tickets?scope=all')->assertStatus(403);

        $this->actingAs($this->makeUser('it'));
        $this->assertCount(3, $this->getJson('/api/helpdesk/tickets?scope=all')->json('data'));
        $this->getJson("/api/helpdesk/tickets/{$theirs->id}")->assertOk();
        $this->assertCount(0, $this->getJson('/api/helpdesk/tickets')->json('data'), 'IT staff still default to their own tickets');
    }

    public function test_replies_attachments_and_cancel_follow_ownership(): void
    {
        $me = $this->signIn();
        $ticket = HelpdeskTicket::factory()->forUser($me)->create();

        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'Still broken'])->assertCreated()
            ->assertJsonPath('data.replies.0.author', 'You')->assertJsonPath('data.replies.0.message', 'Still broken');
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => ''])->assertStatus(422);
        $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create('photo.png', 50, 'image/png')])->assertCreated();
        $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create('tool.exe', 5)])->assertStatus(422);

        $this->actingAs($this->makeUser('it'));
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'Please restart it.'])->assertCreated()->assertJsonPath('data.replies.1.author', 'You');
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/cancel")->assertStatus(403);
        $this->assertSame(1, PortalNotification::ownedBy($me)->where('title', 'New reply on your ticket')->count());

        $this->actingAs($me);
        $this->getJson("/api/helpdesk/tickets/{$ticket->id}")->assertJsonPath('data.replies.1.author', 'IT support');

        $stranger = $this->makeUser();
        $this->actingAs($stranger);
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'Intruding'])->assertStatus(404);
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/cancel")->assertStatus(404);

        $this->actingAs($me);
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->postJson("/api/helpdesk/tickets/{$ticket->id}/replies", ['message' => 'After cancel'])->assertStatus(409);
    }

    // --- Recruitment -------------------------------------------------------------------------------------------------

    private function applicationPayload(array $overrides = []): array
    {
        return ['applicant_name' => 'Sample Applicant', 'email' => 'applicant.sample@example.com', 'mobile' => '+63 900 000 0000', 'cover_letter' => 'Hello', ...$overrides];
    }

    public function test_applying_generates_a_number_activity_and_notification(): void
    {
        $me = $this->signIn();
        $job = RecruitmentJob::factory()->create();

        $response = $this->postJson("/api/recruitment/jobs/{$job->id}/apply", $this->applicationPayload())->assertCreated();

        $this->assertSame('APP-'.now()->year.'-0001', $response->json('data.application_number'));
        $response->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.job.id', $job->id);
        $this->assertSame($me->id, JobApplication::firstOrFail()->user_id);
        $this->assertSame(1, ActivityLog::where('activity_type', 'application_submitted')->count());
        $this->assertSame(1, PortalNotification::ownedBy($me)->count());
        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", $this->applicationPayload())->assertCreated()->assertJsonPath('data.application_number', 'APP-'.now()->year.'-0002');
    }

    public function test_application_validation_protected_fields_and_closed_jobs(): void
    {
        $me = $this->signIn();
        $job = RecruitmentJob::factory()->create();
        $closed = RecruitmentJob::factory()->create(['status' => JobStatus::Closed]);
        $disabled = RecruitmentJob::factory()->create(['application_enabled' => false]);

        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", [])->assertStatus(422)->assertJsonValidationErrors(['applicant_name', 'email']);
        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", $this->applicationPayload(['email' => 'not-an-email']))->assertStatus(422);
        $this->postJson("/api/recruitment/jobs/{$closed->id}/apply", $this->applicationPayload())->assertStatus(409);
        $this->postJson("/api/recruitment/jobs/{$disabled->id}/apply", $this->applicationPayload())->assertStatus(409);
        $this->postJson('/api/recruitment/jobs/99999/apply', $this->applicationPayload())->assertStatus(404);

        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", $this->applicationPayload(['status' => 'offer', 'user_id' => 999, 'application_number' => 'HACK', 'job_id' => $closed->id]))->assertCreated();
        $application = JobApplication::firstOrFail();
        $this->assertSame([$me->id, ApplicationStatus::Submitted, $job->id], [$application->user_id, $application->status, $application->job_id]);
        $this->assertNotSame('HACK', $application->application_number);
    }

    public function test_referrals_get_numbers_and_belong_to_the_referrer(): void
    {
        $me = $this->signIn();
        $job = RecruitmentJob::factory()->create();

        $response = $this->postJson("/api/recruitment/jobs/{$job->id}/refer", ['referred_name' => 'Sample Candidate', 'referred_email' => 'candidate.sample@example.com', 'relationship' => 'Former colleague', 'referring_user_id' => 999])->assertCreated();

        $this->assertSame('REF-'.now()->year.'-0001', $response->json('data.referral_number'));
        $this->assertSame($me->id, JobReferral::firstOrFail()->referring_user_id);
        $this->postJson("/api/recruitment/jobs/{$job->id}/refer", ['referred_name' => 'x'])->assertStatus(422)->assertJsonValidationErrors('referred_email');
        $this->getJson('/api/recruitment/referrals')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_jobs_are_listed_to_everyone_but_applications_and_referrals_are_private(): void
    {
        $me = $this->signIn();
        $job = RecruitmentJob::factory()->create(['title' => 'Sample Analyst', 'department' => 'Finance']);
        RecruitmentJob::factory()->create(['title' => 'Scheduled role', 'published_at' => now()->addWeek()]);
        $mine = JobApplication::factory()->create(['user_id' => $me->id, 'job_id' => $job->id]);
        $theirs = JobApplication::factory()->create(['user_id' => $this->makeUser()->id, 'job_id' => $job->id]);
        $theirReferral = JobReferral::query()->forceCreate(['referral_number' => 'REF-2026-0900', 'job_id' => $job->id, 'referring_user_id' => $this->makeUser()->id, 'referred_name' => 'X', 'referred_email' => 'x@example.com']);

        $this->assertSame(['Sample Analyst'], collect($this->getJson('/api/recruitment/jobs')->json('data'))->pluck('title')->all());
        $this->assertSame(['Sample Analyst'], collect($this->getJson('/api/recruitment/jobs?department=Finance&search=analyst')->json('data'))->pluck('title')->all());
        $this->getJson("/api/recruitment/jobs/{$job->id}")->assertOk()->assertJsonPath('data.requirements', []);

        $this->assertSame([$mine->id], collect($this->getJson('/api/recruitment/applications')->json('data'))->pluck('id')->all());
        $this->getJson("/api/recruitment/applications/{$mine->id}")->assertOk();
        $this->getJson("/api/recruitment/applications/{$theirs->id}")->assertStatus(404);
        $this->getJson("/api/recruitment/referrals/{$theirReferral->id}")->assertStatus(404);
        $response = $this->getJson("/api/recruitment/applications/{$mine->id}")->json('data');
        $this->assertArrayNotHasKey('resume_path', $response);
    }
}
