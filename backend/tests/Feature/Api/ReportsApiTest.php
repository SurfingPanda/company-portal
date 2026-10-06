<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Services\ReportService;

/** HR reports and CSV exports: HR and administrators only, read-only, audited, and safe to open in a spreadsheet. */
class ReportsApiTest extends ApiTestCase
{
    private function entry(array $attributes = []): DirectoryEntry
    {
        static $n = 0;
        $n++;
        $e = new DirectoryEntry(['display_name' => "Person {$n}", 'employment_status' => 'active']);
        $e->forceFill(['employee_id' => "EMP-9{$n}", 'source' => 'manual', ...$attributes])->save();

        return $e;
    }

    public function test_overview_counts_people_departments_and_movement(): void
    {
        $dept = Department::query()->create(['name' => 'Sales', 'status' => 'published']);
        $this->entry(['department_id' => $dept->id, 'date_joined' => now()->subMonths(2)->toDateString(), 'employment_type' => 'regular']);
        $this->entry(['department_id' => $dept->id, 'date_joined' => now()->subYears(6)->toDateString()]);
        $this->entry(['employment_status' => 'inactive']);

        $this->actingAs($this->makeUser('hr'));
        $data = $this->getJson('/api/admin/reports/overview')->assertOk()->json('data');

        $this->assertSame(3, $data['headcount']['total']);
        $this->assertSame(2, $data['headcount']['active']);
        $this->assertSame(1, $data['headcount']['inactive']);
        $this->assertSame([['label' => 'Sales', 'count' => 2]], $data['headcount']['by_department']);
        $this->assertSame(12, count($data['movement']));
        $this->assertSame(1, collect($data['movement'])->sum('hires'));
        $this->assertSame(1, collect($data['tenure'])->firstWhere('label', '5 years or more')['count']);
    }

    public function test_only_people_with_report_access_can_read_or_export(): void
    {
        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->getJson('/api/admin/reports/overview')->assertForbidden();
            $this->get('/api/admin/reports/export/directory')->assertForbidden();
        }
        $this->actingAs($this->makeUser('admin'))->getJson('/api/admin/reports/overview')->assertOk();
    }

    public function test_a_granted_report_permission_opens_reports_for_an_employee(): void
    {
        $employee = $this->makeUser('employee');
        $this->actingAs($this->makeUser('admin'))->putJson("/api/admin/users/{$employee->id}/access", ['permissions' => ['reports.view']])->assertOk();
        $this->actingAs($employee->fresh())->getJson('/api/admin/reports/overview')->assertOk();
    }

    public function test_directory_export_is_a_csv_that_is_audited_and_leaves_out_private_data(): void
    {
        $this->entry(['display_name' => '=HYPERLINK("http://evil.example")', 'job_title' => 'Cook']);
        $this->actingAs($this->makeUser('hr'));

        $response = $this->get('/api/admin/reports/export/directory')->assertOk();
        $csv = $response->streamedContent();

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('"Employee ID","Name","Job title"', $csv);
        $this->assertStringNotContainsString('"=HYPERLINK', $csv, 'a formula must never start a cell');
        $this->assertStringContainsString('"\'=HYPERLINK', $csv);
        foreach (['Emergency', 'Birthday', 'Personal email', 'Mobile'] as $private) {
            $this->assertStringNotContainsString($private, $csv);
        }
        $this->assertTrue(AuditLog::query()->where('action', 'REPORT_EXPORTED')->exists());
    }

    public function test_unknown_export_types_are_not_found_and_cells_are_escaped(): void
    {
        $this->actingAs($this->makeUser('hr'))->get('/api/admin/reports/export/payroll')->assertNotFound();
        $this->assertSame('"say ""hi"""', ReportService::cell('say "hi"'));
        $this->assertSame('"\'@sum"', ReportService::cell('@sum'));
        $this->assertSame('"-5"', ReportService::cell('-5'));
        $this->assertSame('"12"', ReportService::cell(12));
    }

    public function test_policy_compliance_matches_the_policy_screen(): void
    {
        $this->actingAs($this->makeUser('hr'));
        $this->makeUser('employee');
        $policy = new \App\Models\Policy(['title' => 'Safety', 'body' => 'Wear gloves.']);
        $policy->forceFill(['status' => 'published', 'audience' => 'all', 'version' => 1])->save();

        $row = collect($this->getJson('/api/admin/reports/overview')->json('data.policies'))->firstWhere('id', $policy->id);
        $this->assertSame($policy->progress()['required'], $row['required']);
        $this->assertSame(0, $row['percent']);
    }
}
