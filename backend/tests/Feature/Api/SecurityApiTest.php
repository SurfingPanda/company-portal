<?php

namespace Tests\Feature\Api;

use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Models\ActivityLog;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\RecruitmentJob;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/** Phase 28 security suite: headers, error hygiene, IDOR, spoofing, status workflow, validation limits, uploads, logging. */
class SecurityApiTest extends ApiTestCase
{
    // --- Headers and error hygiene -----------------------------------------------------------------------------------

    public function test_api_responses_carry_security_headers_and_are_not_cacheable(): void
    {
        $this->signIn();

        $response = $this->getJson('/api/announcements')->assertOk();

        $response->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')->assertHeader('Permissions-Policy')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        // Even error responses carry them.
        $this->getJson('/api/nope')->assertStatus(404)->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_hsts_is_sent_in_production_over_https_only(): void
    {
        $this->app['env'] = 'production';

        $this->getJson('https://localhost/api/auth/me')->assertHeader('Strict-Transport-Security');
        $this->getJson('http://localhost/api/auth/me')->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_unexpected_exceptions_never_leak_internals_even_with_debug_on(): void
    {
        config(['app.debug' => true]);
        Route::middleware('web')->get('/api/_boom', fn () => throw new \RuntimeException('SQLSTATE[HY000] password=hunter2 in C:\\xampp\\secret.php'));

        $response = $this->getJson('/api/_boom')->assertStatus(500);

        $this->assertSame(['message' => 'Unable to process the request.', 'errors' => []], $response->json());
        foreach (['SQLSTATE', 'hunter2', 'xampp', 'RuntimeException', 'trace', 'exception'] as $leak) {
            $this->assertStringNotContainsStringIgnoringCase($leak, $response->getContent());
        }
    }

    // --- IDOR across more resources ----------------------------------------------------------------------------------

    public function test_attachments_of_another_employees_request_are_unreachable(): void
    {
        $alice = $this->signIn();
        $type = RequestType::factory()->create();
        $mine = EmployeeRequest::factory()->forUser($alice)->create(['request_type_id' => $type->id]);
        $this->post("/api/requests/{$mine->id}/attachments", ['file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])->assertCreated();
        $attachmentId = $mine->attachments()->firstOrFail()->id;

        $bob = $this->makeUser();
        $theirs = EmployeeRequest::factory()->forUser($bob)->create(['request_type_id' => $type->id]);
        $this->actingAs($bob);

        $this->getJson("/api/requests/{$mine->id}/attachments")->assertStatus(404);
        $this->post("/api/requests/{$mine->id}/attachments", ['file' => UploadedFile::fake()->create('b.pdf', 10, 'application/pdf')])->assertStatus(404);
        $this->deleteJson("/api/requests/{$mine->id}/attachments/{$attachmentId}")->assertStatus(404);
        // Using his own request id with Alice's attachment id must not reach her file either.
        $this->deleteJson("/api/requests/{$theirs->id}/attachments/{$attachmentId}")->assertStatus(404);
        $this->getJson("/api/requests/{$mine->id}/history")->assertStatus(404);
        $this->assertSame(1, $mine->attachments()->count());
    }

    public function test_staff_roles_are_not_a_back_door_to_private_data(): void
    {
        $owner = $this->makeUser();
        $itRequest = EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => RequestType::factory()->create(['category' => RequestCategory::It])->id]);
        $ticket = HelpdeskTicket::factory()->forUser($owner)->create();
        $application = JobApplication::factory()->create(['user_id' => $owner->id]);

        // HR cannot read IT requests or tickets; IT cannot read applications; managers have no team access yet.
        $this->actingAs($this->makeUser('hr'));
        $this->getJson("/api/requests/{$itRequest->id}")->assertStatus(404);
        $this->getJson("/api/helpdesk/tickets/{$ticket->id}")->assertStatus(404);
        $this->actingAs($this->makeUser('it'));
        $this->getJson("/api/recruitment/applications/{$application->id}")->assertStatus(404);
        $this->actingAs($this->makeUser('manager'));
        $this->getJson("/api/requests/{$itRequest->id}")->assertStatus(404);
        $this->getJson("/api/helpdesk/tickets/{$ticket->id}")->assertStatus(404);
    }

    // --- Spoofing and mass assignment ---------------------------------------------------------------------------------

    public function test_the_acting_user_always_comes_from_the_session(): void
    {
        $me = $this->signIn();
        $other = $this->makeUser();
        $spoof = ['user_id' => $other->id, 'created_by' => $other->id, 'employee_id' => 'EMP-999', 'role' => 'admin', 'roles' => ['admin'], 'status' => 'Approved', 'is_sample' => false];
        $type = RequestType::factory()->create();
        $job = RecruitmentJob::factory()->create();

        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', ...$spoof])->assertCreated();
        $this->postJson('/api/helpdesk/tickets', ['type' => 'incident', 'category' => 'other', 'subject' => 'S', 'description' => 'D', ...$spoof])->assertCreated();
        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', ...$spoof])->assertCreated();
        $this->postJson("/api/recruitment/jobs/{$job->id}/refer", ['referred_name' => 'A', 'referred_email' => 'a@example.com', 'referring_user_id' => $other->id, ...$spoof])->assertCreated();
        $this->putJson('/api/profile', ['preferred_name' => 'Me', ...$spoof])->assertOk();
        $this->putJson('/api/account/preferences', ['theme' => 'dark', ...$spoof])->assertOk();

        $this->assertSame($me->id, EmployeeRequest::firstOrFail()->user_id);
        $this->assertSame($me->id, HelpdeskTicket::firstOrFail()->user_id);
        $this->assertSame($me->id, JobApplication::firstOrFail()->user_id);
        $this->assertSame($me->id, \App\Models\JobReferral::firstOrFail()->referring_user_id);
        $this->assertSame($me->id, $me->profile->user_id);
        $this->assertSame(0, $other->requests()->count() + $other->helpdeskTickets()->count() + $other->applications()->count());
        $this->assertNull($other->fresh()->profile);
        $this->assertNull($other->preferences);
        $fresh = $me->fresh();
        $this->assertSame(['employee'], $fresh->roleNames());
        $this->assertNotSame('EMP-999', $fresh->employee_id);
        $this->assertTrue($fresh->is_sample, 'sample flags cannot be changed from the API');
    }

    public function test_request_status_follows_server_side_transitions(): void
    {
        $owner = $this->makeUser();
        $type = RequestType::factory()->create(['category' => RequestCategory::Hr]);
        $make = fn (RequestStatus $status) => EmployeeRequest::factory()->forUser($owner)->create(['request_type_id' => $type->id, 'status' => $status]);
        $hr = $this->makeUser('hr');
        $this->actingAs($hr);

        $draft = $make(RequestStatus::Draft);
        $this->postJson("/api/requests/{$draft->id}/status", ['status' => 'approved'])->assertStatus(409);

        $submitted = $make(RequestStatus::Submitted);
        $this->postJson("/api/requests/{$submitted->id}/status", ['status' => 'under-review'])->assertOk();
        $this->postJson("/api/requests/{$submitted->id}/status", ['status' => 'approved'])->assertOk();
        $this->postJson("/api/requests/{$submitted->id}/status", ['status' => 'rejected'])->assertStatus(409);
        $this->postJson("/api/requests/{$submitted->id}/status", ['status' => 'completed'])->assertOk();
        foreach (['approved', 'under-review', 'rejected'] as $status) {
            $this->postJson("/api/requests/{$submitted->id}/status", ['status' => $status])->assertStatus(409);
        }

        $cancelled = $make(RequestStatus::Cancelled);
        $this->postJson("/api/requests/{$cancelled->id}/status", ['status' => 'approved'])->assertStatus(409);
        $this->assertSame(RequestStatus::Cancelled, $cancelled->fresh()->status);
    }

    public function test_an_employee_cannot_use_the_staff_status_endpoint_on_any_request(): void
    {
        $me = $this->signIn();
        $mine = EmployeeRequest::factory()->forUser($me)->create();

        $this->postJson("/api/requests/{$mine->id}/status", ['status' => 'approved'])->assertStatus(403);
        $this->putJson("/api/requests/{$mine->id}", ['status' => 'completed', 'user_id' => 99])->assertStatus(403); // not a draft
        $this->assertSame(RequestStatus::Submitted, $mine->fresh()->status);
    }

    // --- Validation limits and SQL-safety ------------------------------------------------------------------------------

    public function test_filters_sorts_and_search_are_validated_and_never_reach_sql(): void
    {
        $this->signIn();
        foreach (['/api/announcements', '/api/documents', '/api/requests', '/api/notifications', '/api/helpdesk/tickets', '/api/calendar/events', '/api/recruitment/jobs'] as $path) {
            $this->getJson("{$path}?sort=title;DROP%20TABLE%20users")->assertStatus(422);
            $this->getJson("{$path}?sort[]=title")->assertStatus(422);
            $this->getJson("{$path}?direction=sideways")->assertStatus(422);
            $this->getJson("{$path}?per_page=101")->assertStatus(422);
            $this->getJson("{$path}?per_page=-5")->assertStatus(422);
            $this->getJson("{$path}?page=0")->assertStatus(422);
            $this->getJson("{$path}?search[]=x")->assertStatus(422);
            $this->getJson("{$path}?search=".str_repeat('a', 101))->assertStatus(422);
            $this->getJson("{$path}?from=not-a-date")->assertStatus(422);
            // Classic injection strings are just text: valid request, no rows, tables intact.
            $this->getJson("{$path}?search=".urlencode("'; DROP TABLE users; --"))->assertOk();
        }
        $this->getJson('/api/requests?status[]=approved')->assertStatus(422);
        $this->getJson('/api/documents?category[]=x')->assertStatus(422);
        $this->getJson('/api/helpdesk/tickets?priority=%27%20OR%201%3D1')->assertStatus(422);
        $this->assertTrue(\Schema::hasTable('users'));
    }

    public function test_oversized_or_malformed_input_is_rejected_with_422(): void
    {
        $this->signIn();
        $type = RequestType::factory()->create(['fields' => [['id' => 'when', 'type' => 'date', 'required' => true], ['id' => 'who', 'type' => 'email']]]);
        $job = RecruitmentJob::factory()->create();

        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => str_repeat('x', 256), 'form_data' => ['when' => '2026-10-01']])->assertStatus(422)->assertJsonValidationErrors('subject');
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', 'description' => str_repeat('x', 5001), 'form_data' => ['when' => '2026-10-01']])->assertStatus(422)->assertJsonValidationErrors('description');
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', 'form_data' => ['when' => 'tomorrow-ish']])->assertStatus(422)->assertJsonValidationErrors('form_data.when');
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', 'form_data' => ['when' => '2026-10-01', 'who' => 'not-an-email']])->assertStatus(422)->assertJsonValidationErrors('form_data.who');
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', 'form_data' => array_fill_keys(range(1, 61), 'x')])->assertStatus(422)->assertJsonValidationErrors('form_data');
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => ['array'], 'form_data' => ['when' => '2026-10-01']])->assertStatus(422);
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'S', 'priority' => 'critical', 'form_data' => ['when' => '2026-10-01']])->assertStatus(422)->assertJsonValidationErrors('priority');
        $this->postJson('/api/helpdesk/tickets', ['type' => 'incident', 'category' => 'other', 'subject' => 'S', 'description' => str_repeat('x', 5001)])->assertStatus(422);
        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'bad'])->assertStatus(422)->assertJsonValidationErrors('email');
        $this->postJson("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => str_repeat('a', 256), 'email' => 'a@example.com'])->assertStatus(422);
        $this->putJson('/api/profile', ['personal_email' => 'x@', 'avatar_url' => 'javascript:alert(1)'])->assertStatus(422)->assertJsonValidationErrors(['personal_email', 'avatar_url']);
        $this->putJson('/api/profile', ['avatar_url' => 'http://insecure.example/a.png'])->assertStatus(422);
        $this->assertSame(0, EmployeeRequest::count());
    }

    public function test_html_in_user_text_is_stored_as_plain_text_and_never_interpreted(): void
    {
        $this->signIn();
        $payload = '<script>alert(1)</script><img src=x onerror=alert(1)>';

        $response = $this->postJson('/api/helpdesk/tickets', ['type' => 'incident', 'category' => 'other', 'subject' => 'XSS test', 'description' => $payload])->assertCreated();

        // JSON-encoded text (React renders it as text); the API never returns HTML.
        $this->assertSame($payload, $response->json('data.description'));
        $this->assertStringContainsString('application/json', $response->headers->get('Content-Type'));
    }

    // --- Uploads (requests, helpdesk, resumes) --------------------------------------------------------------------------

    public function test_resume_upload_accepts_documents_only_and_stores_privately(): void
    {
        $me = $this->signIn();
        $job = RecruitmentJob::factory()->create();

        $ok = $this->post("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', 'resume' => UploadedFile::fake()->create('cv.pdf', 200, 'application/pdf')])->assertCreated();

        $path = JobApplication::firstOrFail()->resume_path;
        Storage::disk('local')->assertExists($path);
        $this->assertStringNotContainsString('cv', $path, 'stored under a generated name');
        $this->assertStringNotContainsString('resume_path', $ok->getContent());
        $this->assertStringNotContainsString('resumes/', $ok->getContent());

        $before = JobApplication::count();
        foreach (['cv.exe', 'cv.php', 'cv.js', 'cv.bat', 'cv.sh', 'cv.png', 'cv.pdf.exe', 'cv.svg'] as $name) {
            $this->post("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', 'resume' => UploadedFile::fake()->create($name, 10)])->assertStatus(422)->assertJsonValidationErrors('resume');
        }
        $this->post("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', 'resume' => UploadedFile::fake()->create('big.pdf', 6000, 'application/pdf')])->assertStatus(422);

        // Real bytes of a Windows executable under a .pdf name.
        $tmp = tempnam(sys_get_temp_dir(), 'cv');
        file_put_contents($tmp, "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00 This program cannot be run in DOS mode.");
        $this->post("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', 'resume' => new UploadedFile($tmp, 'cv.pdf', 'application/pdf', null, true)])->assertStatus(422)->assertJsonValidationErrors('resume');
        @unlink($tmp);

        $this->assertSame($before, JobApplication::count(), 'rejected resumes create no application');
        $this->assertCount(1, Storage::disk('local')->allFiles('resumes'), 'and leave no stored file behind');
        $this->assertSame($me->id, JobApplication::firstOrFail()->user_id);
    }

    public function test_upload_limits_and_private_storage_for_helpdesk_attachments(): void
    {
        $me = $this->signIn();
        $ticket = HelpdeskTicket::factory()->forUser($me)->create();

        $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create('ok.png', 10, 'image/png')])->assertCreated();
        foreach (['x.svg', 'x.html', 'x.exe', 'x.php', 'x.phtml', 'x.jar', 'x.ps1', 'x.docm', 'x.zip'] as $name) {
            $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create($name, 10)])->assertStatus(422);
        }
        $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create('big.png', 5121, 'image/png')])->assertStatus(422);
        $this->assertSame(1, $ticket->attachments()->count());
        // The private disk is used, never `public`.
        $this->assertSame('local', $ticket->attachments()->first()->disk);
        $this->assertSame([], array_values(array_diff(Storage::disk('public')->allFiles(), ['.gitignore'])));
    }

    // --- Logging and audit trail --------------------------------------------------------------------------------------

    public function test_failed_sign_ins_are_logged_without_passwords_or_raw_identifiers(): void
    {
        Log::spy();
        $this->makeUser('employee', ['employee_id' => 'EMP-8801']);

        $this->postJson('/api/auth/login', ['identifier' => 'EMP-8801', 'password' => 'SuperSecret-Typed-1'])->assertStatus(401);

        Log::shouldHaveReceived('warning')->withArgs(function (string $message, array $context = []) {
            $flat = json_encode($context);

            return $message === 'Sign-in failed' && ! str_contains($flat, 'SuperSecret') && ! str_contains($flat, 'EMP-8801') && isset($context['identifier_hash']);
        })->once();
    }

    public function test_login_logout_and_actions_are_recorded_without_sensitive_payloads(): void
    {
        $user = $this->makeUser('employee', ['employee_id' => 'EMP-8802']);

        $this->postJson('/api/auth/login', ['identifier' => 'EMP-8802', 'password' => 'DemoOnly123!'])->assertOk();
        $this->postJson('/api/auth/logout')->assertNoContent();

        $types = ActivityLog::where('user_id', $user->id)->pluck('activity_type')->all();
        $this->assertSame(['login', 'logout'], $types);
        $dump = json_encode(ActivityLog::all()->toArray());
        $this->assertStringNotContainsString('DemoOnly123', $dump);
        $this->assertStringNotContainsString('password', strtolower($dump));
    }

    // --- Data exposure -----------------------------------------------------------------------------------------------------

    public function test_no_endpoint_returns_secrets_storage_paths_or_internal_fields(): void
    {
        $me = $this->signIn();
        $type = RequestType::factory()->create();
        $request = EmployeeRequest::factory()->forUser($me)->create(['request_type_id' => $type->id]);
        $request->history()->forceCreate(['status' => 'under-review', 'comment' => 'Staff only', 'is_internal' => true]);
        $this->post("/api/requests/{$request->id}/attachments", ['file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]);
        $ticket = HelpdeskTicket::factory()->forUser($me)->create();
        $this->post("/api/helpdesk/tickets/{$ticket->id}/attachments", ['file' => UploadedFile::fake()->create('a.png', 10, 'image/png')]);
        $job = RecruitmentJob::factory()->create();
        $this->post("/api/recruitment/jobs/{$job->id}/apply", ['applicant_name' => 'A', 'email' => 'a@example.com', 'resume' => UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf')]);

        $forbidden = ['password', 'remember_token', 'storage_path', 'storage_disk', 'resume_path', 'is_internal', 'Staff only', 'attachments/', 'resumes/', 'assigned_to', 'uploaded_by', 'author_user_id', 'created_by', 'user_id'];
        foreach (['/api/auth/me', '/api/profile', "/api/requests/{$request->id}", '/api/requests', "/api/helpdesk/tickets/{$ticket->id}", '/api/recruitment/applications', '/api/documents', '/api/announcements', '/api/account/preferences', '/api/activity', '/api/notifications'] as $path) {
            $body = $this->getJson($path)->assertOk()->getContent();
            foreach ($forbidden as $needle) {
                $this->assertStringNotContainsString($needle, $body, "{$path} must not expose {$needle}");
            }
        }
    }

    // --- Rate limiting -----------------------------------------------------------------------------------------------------

    public function test_write_and_search_endpoints_are_rate_limited_with_429(): void
    {
        $this->signIn();
        $type = RequestType::factory()->create();

        foreach (range(1, 30) as $i) {
            $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => "S{$i}", 'save_as_draft' => true])->assertCreated();
        }
        $this->postJson('/api/requests', ['request_type_id' => $type->id, 'subject' => 'One too many'])->assertStatus(429)
            ->assertJsonPath('message', 'Too many requests. Please wait a moment and try again.')->assertHeader('Retry-After');

        $this->actingAs($this->makeUser());
        foreach (range(1, 60) as $i) {
            $this->getJson('/api/search?q=sample')->assertOk();
        }
        $this->getJson('/api/search?q=sample')->assertStatus(429);
        // Ordinary reads are unaffected by the stricter limits above.
        $this->getJson('/api/announcements')->assertOk();
    }

    public function test_login_throttling_is_per_account_and_address_and_does_not_lock_other_employees(): void
    {
        $this->makeUser('employee', ['employee_id' => 'EMP-8810']);
        $this->makeUser('employee', ['employee_id' => 'EMP-8811']);

        foreach (range(1, 5) as $i) {
            $this->postJson('/api/auth/login', ['identifier' => 'EMP-8810', 'password' => 'wrong'])->assertStatus(401);
        }
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-8810', 'password' => 'DemoOnly123!'])->assertStatus(429);
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-8811', 'password' => 'DemoOnly123!'])->assertOk();
    }

    // --- Database constraints ----------------------------------------------------------------------------------------------

    public function test_uniqueness_is_enforced_by_the_database_not_just_by_code(): void
    {
        $this->makeUser('employee', ['employee_id' => 'EMP-8820', 'email' => 'dup@eljin.example']);

        foreach ([['employee_id' => 'EMP-8820', 'email' => 'other@eljin.example'], ['employee_id' => 'EMP-8821', 'email' => 'dup@eljin.example']] as $attributes) {
            try {
                User::factory()->create($attributes);
                $this->fail('duplicate user was accepted');
            } catch (\Illuminate\Database\UniqueConstraintViolationException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}
