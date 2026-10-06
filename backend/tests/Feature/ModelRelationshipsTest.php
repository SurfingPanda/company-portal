<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Announcement;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\EmployeeForm;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\JobReferral;
use App\Models\PortalNotification;
use App\Models\PortalPreference;
use App\Models\RecruitmentJob;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_relationships(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', 'manager')->first());
        EmployeeRequest::factory()->forUser($user)->create();
        PortalNotification::factory()->forUser($user)->create();
        HelpdeskTicket::factory()->forUser($user)->create();
        $application = JobApplication::factory()->create(['user_id' => $user->id]);
        JobReferral::query()->forceCreate([
            'referral_number' => 'REF-2026-0001', 'job_id' => $application->job_id, 'referring_user_id' => $user->id,
            'referred_name' => 'Sample Candidate', 'referred_email' => 'candidate.sample@example.com',
        ]);
        $user->activityLogs()->forceCreate(['user_id' => $user->id, 'activity_type' => 'request_submitted', 'description' => 'Submitted a sample request']);
        $user->preferences()->create([]);

        $user->refresh();
        $this->assertCount(1, $user->requests);
        $this->assertCount(1, $user->notifications);
        $this->assertCount(1, $user->helpdeskTickets);
        $this->assertCount(1, $user->applications);
        $this->assertCount(1, $user->referrals);
        $this->assertCount(1, $user->activityLogs);
        $this->assertInstanceOf(PortalPreference::class, $user->preferences);
        $this->assertSame(['manager'], $user->roleNames());
        $this->assertSame($user->id, $user->referrals->first()->referringUser->id);
    }

    public function test_request_relationships_and_history_timeline(): void
    {
        $user = User::factory()->create();
        $request = EmployeeRequest::factory()->forUser($user)->create(['status' => RequestStatus::Draft, 'submitted_at' => null]);

        $request->changeStatus(RequestStatus::Submitted, $user);
        $request->changeStatus(RequestStatus::UnderReview, null, 'Sample review');
        $request->changeStatus(RequestStatus::Completed);
        $request->attachments()->forceCreate(['employee_request_id' => $request->id, 'original_filename' => 'supporting.pdf', 'storage_path' => 'private/x.pdf', 'mime_type' => 'application/pdf', 'file_size' => 1200]);

        $request->refresh();
        $this->assertTrue($request->user->is($user));
        $this->assertNotNull($request->requestType);
        $this->assertSame(['submitted', 'under-review', 'completed'], $request->history->pluck('status')->map->value->all());
        $this->assertNotNull($request->submitted_at);
        $this->assertNotNull($request->completed_at);
        $this->assertCount(1, $request->attachments);
        $this->assertArrayNotHasKey('storage_path', $request->attachments->first()->toArray());
    }

    public function test_content_relationships(): void
    {
        $author = User::factory()->create();
        $announcement = Announcement::query()->forceCreate(['title' => 'Sample', 'slug' => 'sample', 'summary' => 's', 'content' => 'c', 'author_user_id' => $author->id, 'status' => 'published', 'published_at' => now()->subHour()]);
        $event = CalendarEvent::query()->forceCreate(['title' => 'Sample event', 'starts_at' => now(), 'author_user_id' => $author->id]);
        $document = Document::factory()->create();
        $form = EmployeeForm::query()->forceCreate(['title' => 'Sample form', 'document_id' => $document->id]);

        $this->assertTrue($announcement->author->is($author));
        $this->assertTrue($event->author->is($author));
        $this->assertSame('policies', $document->category->slug);
        $this->assertTrue($form->document->is($document));
        $this->assertCount(1, $document->category->documents);
    }

    public function test_job_relationships(): void
    {
        $job = RecruitmentJob::factory()->create();
        $application = JobApplication::factory()->create(['job_id' => $job->id]);

        $this->assertTrue($application->job->is($job));
        $this->assertCount(1, $job->applications);
    }

    public function test_mass_assignment_cannot_set_owner_status_or_reference(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $type = \App\Models\RequestType::factory()->create();

        $request = $user->requests()->make([
            'request_type_id' => $type->id, 'subject' => 'Mine', 'user_id' => $other->id, 'status' => 'approved', 'reference_number' => 'HACK-1',
        ]);

        // `reference_number` and `status` are server-controlled and ignored; the owner always comes from the relationship.
        $this->assertSame($user->id, $request->user_id);
        $this->assertNull($request->reference_number);
        $this->assertNull($request->status);
    }

    public function test_user_serialisation_never_includes_secrets(): void
    {
        $user = User::factory()->create(['remember_token' => 'secret-token']);

        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }
}
