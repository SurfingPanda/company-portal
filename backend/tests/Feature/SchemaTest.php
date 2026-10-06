<?php

namespace Tests\Feature;

use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\JobApplication;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_portal_tables_exist(): void
    {
        $tables = [
            'users', 'roles', 'user_roles', 'announcements', 'calendar_events', 'document_categories', 'documents', 'employee_forms',
            'request_types', 'employee_requests', 'request_history', 'request_attachments', 'notifications', 'activity_logs',
            'helpdesk_tickets', 'helpdesk_replies', 'helpdesk_attachments', 'benefits', 'benefit_faqs', 'recruitment_jobs',
            'job_applications', 'job_referrals', 'resources', 'resource_faqs', 'portal_preferences', 'sessions',
        ];
        foreach ($tables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing table {$table}");
        }
    }

    public function test_users_table_holds_only_portal_identity_not_hr_data(): void
    {
        $this->assertTrue(Schema::hasColumns('users', ['employee_id', 'email', 'password', 'remember_token', 'status', 'last_login_at']));
        foreach (['name', 'full_name', 'salary', 'department', 'job_title', 'leave_balance', 'government_id', 'birth_date'] as $hrColumn) {
            $this->assertFalse(Schema::hasColumn('users', $hrColumn), "users must not store HRIS data: {$hrColumn}");
        }
        // The HRIS link is a plain identifier, not a foreign key to another system.
        $this->assertSame([], collect(Schema::getForeignKeys('users'))->all());
    }

    public function test_important_indexes_exist(): void
    {
        $expected = [
            'users' => ['employee_id', 'email'],
            'announcements' => ['slug', 'status', 'published_at'],
            'calendar_events' => ['starts_at'],
            'documents' => ['slug'],
            'employee_requests' => ['reference_number', 'user_id', 'status'],
            'notifications' => ['user_id', 'read_at'],
            'helpdesk_tickets' => ['ticket_number', 'user_id'],
            'recruitment_jobs' => ['status'],
            'job_applications' => ['application_number'],
        ];

        foreach ($expected as $table => $columns) {
            $indexed = collect(Schema::getIndexes($table))->flatMap(fn ($index) => $index['columns'])->all();
            foreach ($columns as $column) {
                $this->assertContains($column, $indexed, "{$table}.{$column} should be indexed");
            }
        }
    }

    public function test_unique_constraints_are_enforced(): void
    {
        User::factory()->create(['employee_id' => 'EMP-9001', 'email' => 'one@eljin.example']);

        $this->expectException(QueryException::class);
        User::factory()->create(['employee_id' => 'EMP-9001', 'email' => 'two@eljin.example']);
    }

    public function test_reference_numbers_are_unique(): void
    {
        $user = User::factory()->create();
        $type = RequestType::factory()->create();
        EmployeeRequest::factory()->forUser($user)->create(['request_type_id' => $type->id, 'reference_number' => 'REQ-2026-0001']);
        $this->assertDuplicateRejected(fn () => EmployeeRequest::factory()->forUser($user)->create(['request_type_id' => $type->id, 'reference_number' => 'REQ-2026-0001']));

        HelpdeskTicket::factory()->forUser($user)->create(['ticket_number' => 'TKT-2026-0001']);
        $this->assertDuplicateRejected(fn () => HelpdeskTicket::factory()->forUser($user)->create(['ticket_number' => 'TKT-2026-0001']));

        JobApplication::factory()->create(['user_id' => $user->id, 'application_number' => 'APP-2026-0001']);
        $this->assertDuplicateRejected(fn () => JobApplication::factory()->create(['user_id' => $user->id, 'application_number' => 'APP-2026-0001']));
    }

    public function test_foreign_keys_are_enforced(): void
    {
        $type = RequestType::factory()->create();

        $this->expectException(QueryException::class);
        DB::table('employee_requests')->insert([
            'reference_number' => 'REQ-2026-9999', 'request_type_id' => $type->id, 'user_id' => 999999, 'subject' => 'orphan',
            'status' => 'draft', 'priority' => 'normal', 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function test_a_user_with_requests_cannot_be_deleted_silently(): void
    {
        $user = User::factory()->create();
        EmployeeRequest::factory()->forUser($user)->create();

        $this->expectException(QueryException::class);
        $user->delete(); // restrictOnDelete keeps request history
    }

    private function assertDuplicateRejected(callable $create): void
    {
        try {
            $create();
            $this->fail('Duplicate was accepted.');
        } catch (QueryException) {
            $this->addToAssertionCount(1);
        }
    }
}
