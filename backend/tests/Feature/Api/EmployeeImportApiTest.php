<?php

namespace Tests\Feature\Api;

use App\Mail\PasswordLinkMail;
use App\Models\CompanyLocation;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;

/** CSV import of employee records: preview, import, and the rules each row must pass. */
class EmployeeImportApiTest extends ApiTestCase
{
    private const HEADER = 'employee_id,display_name,company_email,job_title,department,location,employment_status,employment_type,date_joined,manager_employee_id,phone,role';

    private function csv(array $lines, string $header = self::HEADER, string $name = 'employees.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, implode("\n", [$header, ...$lines])."\n");
    }

    private function hrUser(): User
    {
        $hr = $this->makeUser('hr');
        $this->actingAs($hr);

        return $hr;
    }

    public function test_preview_reports_what_would_happen_and_writes_nothing(): void
    {
        $this->hrUser();
        Department::query()->forceCreate(['name' => 'Finance', 'status' => 'published']);
        CompanyLocation::query()->forceCreate(['name' => 'Head Office', 'status' => 'published']);
        DirectoryEntry::query()->forceCreate(['employee_id' => 'EMP-1000', 'display_name' => 'Already Here', 'company_email' => 'here@eljin.example', 'source' => 'manual', 'verification' => 'unverified']);

        $file = $this->csv([
            'EMP-2001,Ana Cruz,ana@eljin.example,Accountant,finance,Head Office,active,regular,2024-05-06,EMP-2002,0917 123 4567,manager',
            'EMP-2002,Ben Lim,ben@eljin.example,Lead,Finance,,,,,,,',
            'EMP-1000,Already Here,here@eljin.example,,,,,,,,,',
            'EMP-2003,Bad Dept,bad@eljin.example,,Nowhere,,,,,,,',
            'EMP-2004,,notanemail,,,,sleeping,,17/03/2025,,,admin',
            'EMP-2002,Dup Id,dup@eljin.example,,,,,,,,,',
            'EMP-2005,Dup Mail,ana@eljin.example,,,,,,,,,',
            'EMP-2006,Orphan Mgr,orphan@eljin.example,,,,,,,GHOST-1,,',
        ]);
        $data = $this->post('/api/admin/hr/employees/import/preview', ['file' => $file])->assertOk()->json('data');

        $this->assertSame(8, $data['total']);
        $this->assertSame(2, $data['ready']);
        $this->assertSame(['EMP-1000'], array_column($data['existing'], 'employee_id'));
        $byLine = collect($data['errors'])->keyBy('line');
        $this->assertStringContainsString('Unknown department "Nowhere"', $byLine[5]['messages'][0]);
        $this->assertGreaterThanOrEqual(4, count($byLine[6]['messages'])); // name, email, status, date, role
        $this->assertStringContainsString('repeated', implode(' ', $byLine[7]['messages']));
        $this->assertStringContainsString('Company email is repeated', implode(' ', $byLine[8]['messages']));
        $this->assertStringContainsString('was not found', implode(' ', $byLine[9]['messages']));
        $this->assertSame(1, DirectoryEntry::count(), 'a preview writes nothing');
        $this->assertSame(0, User::where('employee_id', 'EMP-2001')->count());
    }

    public function test_import_creates_entries_logins_roles_managers_and_hides_them_by_default(): void
    {
        Mail::fake();
        $hr = $this->hrUser();
        $dept = Department::query()->forceCreate(['name' => 'Finance', 'status' => 'published']);
        $loc = CompanyLocation::query()->forceCreate(['name' => 'Head Office', 'status' => 'published']);

        $file = $this->csv([
            'EMP-2001,Ana Cruz,Ana@Eljin.example,Accountant,FINANCE,head office,On Leave,Part-Time,2024-05-06,EMP-2002,0917 123 4567,Manager',
            'EMP-2002,Ben Lim,ben@eljin.example,Lead,Finance,,,,,,,Regular Employee',
        ]);
        $done = $this->post('/api/admin/hr/employees/import', ['file' => $file, 'create_logins' => '1'])->assertOk()->json('data');

        $this->assertSame([2, 2, 0], [$done['created'], $done['logins_created'], count($done['failed'])]);
        $ana = DirectoryEntry::where('employee_id', 'EMP-2001')->firstOrFail();
        $this->assertSame([$dept->id, $loc->id, 'on_leave', 'part_time', '2024-05-06', 'ana@eljin.example'], [$ana->department_id, $ana->location_id, $ana->employment_status, $ana->employment_type, $ana->date_joined->toDateString(), $ana->company_email]);
        $this->assertFalse($ana->is_visible, 'imported employees stay hidden until HR shows them');
        $this->assertSame(DirectoryEntry::where('employee_id', 'EMP-2002')->value('id'), $ana->manager_id, 'a manager may appear after the person in the file');
        $this->assertSame(['manager'], User::where('employee_id', 'EMP-2001')->firstOrFail()->roleNames());
        $this->assertSame(['employee'], User::where('employee_id', 'EMP-2002')->firstOrFail()->roleNames());
        $this->assertSame('pending', User::where('employee_id', 'EMP-2001')->firstOrFail()->status->value);
        $this->assertSame($ana->user_id, User::where('employee_id', 'EMP-2001')->value('id'));
        Mail::assertSent(PasswordLinkMail::class, 2);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_IMPORTED', 'actor_user_id' => $hr->id]);
    }

    public function test_import_skips_existing_employees_imports_the_good_rows_and_can_be_repeated(): void
    {
        Mail::fake();
        $this->hrUser();
        $file = fn () => $this->csv([
            'EMP-3001,Good One,one@eljin.example,,,,,,,,,',
            'EMP-3002,,broken,,,,,,,,,',
            'EMP-3003,Good Two,two@eljin.example,,,,,,,,,',
        ]);

        $first = $this->post('/api/admin/hr/employees/import', ['file' => $file(), 'create_logins' => '0'])->assertOk()->json('data');
        $this->assertSame([2, 0, 1], [$first['created'], $first['logins_created'], count($first['errors'])]);
        $this->assertSame(0, User::whereIn('employee_id', ['EMP-3001', 'EMP-3003'])->count(), 'no logins when not asked for');
        Mail::assertNothingSent();

        $again = $this->post('/api/admin/hr/employees/import', ['file' => $file(), 'create_logins' => '0'])->assertOk()->json('data');
        $this->assertSame([0, 2], [$again['created'], $again['skipped_existing']]);
        $this->assertSame(2, DirectoryEntry::count());
    }

    public function test_manager_loops_and_unusable_files_are_rejected(): void
    {
        $this->hrUser();
        $loop = $this->csv([
            'EMP-4001,A One,a@eljin.example,,,,,,,EMP-4002,,',
            'EMP-4002,B Two,b@eljin.example,,,,,,,EMP-4003,,',
            'EMP-4003,C Three,c@eljin.example,,,,,,,EMP-4001,,',
            'EMP-4004,D Four,d@eljin.example,,,,,,,EMP-4004,,',
            'EMP-4005,E Five,e@eljin.example,,,,,,,EMP-4001,,',
        ]);
        $data = $this->post('/api/admin/hr/employees/import/preview', ['file' => $loop])->assertOk()->json('data');
        $this->assertSame(0, $data['ready'], 'looped rows are errors, and so is anyone whose manager is an error row');
        $this->assertCount(5, $data['errors']);

        $this->post('/api/admin/hr/employees/import/preview', ['file' => UploadedFile::fake()->createWithContent('e.csv', '')])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->post('/api/admin/hr/employees/import/preview', ['file' => $this->csv(['x'], 'foo,bar')])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->post('/api/admin/hr/employees/import/preview', ['file' => $this->csv([], self::HEADER)])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->post('/api/admin/hr/employees/import/preview', ['file' => UploadedFile::fake()->create('e.exe', 5)])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->post('/api/admin/hr/employees/import/preview', [])->assertStatus(422);
    }

    public function test_file_formats_semicolons_aliases_and_windows_encoding_are_understood(): void
    {
        Mail::fake();
        $this->hrUser();
        $content = mb_convert_encoding("Employee ID;Name;Email;Position;Hire Date\nEMP-5001;José Peña;jose@eljin.example;Analyst;2023-01-02\n", 'Windows-1252', 'UTF-8');
        $file = UploadedFile::fake()->createWithContent('excel.csv', $content);

        $done = $this->post('/api/admin/hr/employees/import', ['file' => $file, 'create_logins' => '0'])->assertOk()->json('data');
        $this->assertSame(1, $done['created']);
        $entry = DirectoryEntry::where('employee_id', 'EMP-5001')->firstOrFail();
        $this->assertSame(['José Peña', 'Analyst', '2023-01-02'], [$entry->display_name, $entry->job_title, $entry->date_joined->toDateString()]);
    }

    public function test_only_hr_with_the_right_permissions_can_import_and_show_employees(): void
    {
        Mail::fake();
        $this->actingAs($this->makeUser('employee'));
        $file = fn () => $this->csv(['EMP-6001,Some One,some@eljin.example,,,,,,,,,']);
        $this->post('/api/admin/hr/employees/import/preview', ['file' => $file()])->assertStatus(403);
        $this->post('/api/admin/hr/employees/import', ['file' => $file()])->assertStatus(403);

        $this->hrUser();
        $this->post('/api/admin/hr/employees/import', ['file' => $file(), 'create_logins' => '0', 'make_visible' => '1'])->assertOk();
        $this->assertTrue(DirectoryEntry::where('employee_id', 'EMP-6001')->firstOrFail()->is_visible);
    }
}
