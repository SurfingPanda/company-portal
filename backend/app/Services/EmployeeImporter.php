<?php

namespace App\Services;

use App\Enums\EmploymentStatus;
use App\Enums\EmploymentType;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\CompanyLocation;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * CSV import of employee records (directory entries). Three separate steps so HR can check before anything is written:
 *   parse()     read the file into rows (any delimiter, UTF-8 or Excel/Windows-1252, header names are forgiving);
 *   validate()  check every row and report each problem with its line number; nothing is written;
 *   import()    create the rows that passed (and, optionally, their logins), one transaction per row.
 * Employees whose ID already exists are skipped, never changed, so a corrected file can be uploaded again safely.
 * Departments and locations are matched by name and are never created; an unknown name is an error on that row.
 */
final class EmployeeImporter
{
    public const MAX_ROWS = 1000;

    /** Columns the template offers. Only the first three are required. */
    public const COLUMNS = [
        'employee_id', 'display_name', 'company_email', 'job_title', 'department', 'location', 'employment_status', 'employment_type',
        'date_joined', 'manager_employee_id', 'phone', 'role',
    ];

    private const ALIASES = [
        'email' => 'company_email', 'work_email' => 'company_email', 'name' => 'display_name', 'full_name' => 'display_name',
        'position' => 'job_title', 'title' => 'job_title', 'manager' => 'manager_employee_id', 'manager_id' => 'manager_employee_id',
        'status' => 'employment_status', 'type' => 'employment_type', 'date_hired' => 'date_joined', 'hire_date' => 'date_joined',
        'mobile' => 'phone', 'contact_number' => 'phone', 'id' => 'employee_id', 'emp_id' => 'employee_id',
    ];

    public function __construct(private readonly UserAdminService $users) {}

    /**
     * @return array{rows: list<array<string, string>>, ignored_columns: list<string>}
     *
     * @throws ValidationException when the file cannot be used at all (empty, missing required columns, too many rows)
     */
    public function parse(UploadedFile $file): array
    {
        $content = (string) file_get_contents($file->getRealPath());
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content) ?? $content;
        if (! mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        }
        $firstLine = strtok($content, "\r\n") ?: '';
        $delimiter = collect([',', ';', "\t"])->sortByDesc(fn ($d) => substr_count($firstLine, $d))->first();

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $content);
        rewind($stream);

        $header = fgetcsv($stream, 0, $delimiter, '"', '');
        if ($header === false || $header === [null]) {
            throw ValidationException::withMessages(['file' => ['The file is empty.']]);
        }
        $columns = array_map(fn ($h) => $this->canonical((string) $h), $header);
        $missing = array_values(array_diff(['employee_id', 'display_name', 'company_email'], $columns));
        if ($missing !== []) {
            throw ValidationException::withMessages(['file' => ['Missing required column(s): '.implode(', ', $missing).'. Download the template to see the expected headers.']]);
        }
        $ignored = array_values(array_unique(array_filter(array_diff($columns, self::COLUMNS), fn ($c) => $c !== '')));

        $rows = [];
        $line = 1;
        while (($record = fgetcsv($stream, 0, $delimiter, '"', '')) !== false) {
            $line++;
            if ($record === [null] || count(array_filter($record, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }
            $row = ['line' => (string) $line];
            foreach ($columns as $i => $column) {
                if (in_array($column, self::COLUMNS, true)) {
                    $row[$column] = trim((string) ($record[$i] ?? ''));
                }
            }
            $rows[] = $row;
            if (count($rows) > self::MAX_ROWS) {
                throw ValidationException::withMessages(['file' => ['The file has more than '.self::MAX_ROWS.' rows. Split it into smaller files.']]);
            }
        }
        fclose($stream);
        if ($rows === []) {
            throw ValidationException::withMessages(['file' => ['The file has a header but no employees.']]);
        }

        return ['rows' => $rows, 'ignored_columns' => $ignored];
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @return array{ready: list<array<string, mixed>>, existing: list<array{line: int, employee_id: string}>, errors: list<array{line: int, employee_id: string, display_name: string, messages: list<string>}>}
     */
    public function validate(array $rows): array
    {
        $departments = Department::query()->pluck('id', 'name')->mapWithKeys(fn ($id, $name) => [mb_strtolower($name) => $id])->all();
        $locations = CompanyLocation::query()->pluck('id', 'name')->mapWithKeys(fn ($id, $name) => [mb_strtolower($name) => $id])->all();
        $existingIds = DirectoryEntry::query()->pluck('employee_id')->map(fn ($v) => mb_strtolower($v))->flip()->all();
        $takenEmails = DirectoryEntry::query()->whereNotNull('company_email')->pluck('employee_id', 'company_email')->mapWithKeys(fn ($id, $e) => [mb_strtolower($e) => $id])->all();
        foreach (User::query()->pluck('employee_id', 'email') as $email => $owner) {
            $takenEmails[mb_strtolower($email)] ??= $owner;
        }
        $dbManagerOf = DirectoryEntry::query()->from('directory_entries as e')->leftJoin('directory_entries as m', 'm.id', '=', 'e.manager_id')
            ->whereNotNull('e.manager_id')->pluck('m.employee_id', 'e.employee_id')->mapWithKeys(fn ($m, $e) => [mb_strtolower($e) => mb_strtolower((string) $m)])->all();

        $ready = [];
        $existing = [];
        $errors = [];
        $seenIds = [];
        $seenEmails = [];

        foreach ($rows as $raw) {
            $line = (int) $raw['line'];
            $id = $raw['employee_id'] ?? '';
            $row = $this->normalise($raw);
            $messages = [];

            $v = Validator::make($row, [
                'employee_id' => ['required', 'regex:/^[A-Za-z0-9][A-Za-z0-9_\-]{2,31}$/'],
                'display_name' => ['required', 'max:120'],
                'company_email' => ['required', 'email:rfc', 'max:255'],
                'job_title' => ['nullable', 'max:120'],
                'phone' => ['nullable', 'max:40', 'regex:/^[0-9+()\-\s.ext]{3,40}$/i'],
                'employment_status' => ['required', Rule::in(EmploymentStatus::values())],
                'employment_type' => ['nullable', Rule::in(EmploymentType::values())],
                'date_joined' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
                'role' => ['required', Rule::in([RoleName::Employee->value, RoleName::Manager->value])],
            ], [
                'employee_id.regex' => 'Employee ID must be 3-32 letters, numbers, dashes or underscores.',
                'date_joined.date_format' => 'Date joined must look like 2025-03-17 (year-month-day).',
                'date_joined.before_or_equal' => 'Date joined cannot be in the future.',
                'employment_status.in' => 'Employment status must be active, on leave or inactive.',
                'employment_type.in' => 'Employment type must be regular, probationary, contractual or part time.',
                'role.in' => 'Role must be Regular Employee or Manager.',
                'phone.regex' => 'Phone may only contain digits, spaces and + ( ) - . characters.',
            ], ['company_email' => 'company email', 'display_name' => 'display name', 'employee_id' => 'employee ID']);
            foreach ($v->errors()->all() as $message) {
                $messages[] = $message;
            }

            $idKey = mb_strtolower($row['employee_id']);
            if ($row['employee_id'] !== '' && isset($seenIds[$idKey])) {
                $messages[] = "Employee ID is repeated (first on line {$seenIds[$idKey]}).";
            }
            $seenIds[$idKey] ??= $line;

            if (isset($existingIds[$idKey]) && $messages === []) {
                $existing[] = ['line' => $line, 'employee_id' => $row['employee_id']];
                continue;
            }

            $emailKey = mb_strtolower($row['company_email']);
            if ($row['company_email'] !== '') {
                if (isset($seenEmails[$emailKey])) {
                    $messages[] = "Company email is repeated (first on line {$seenEmails[$emailKey]}).";
                } elseif (isset($takenEmails[$emailKey]) && mb_strtolower((string) $takenEmails[$emailKey]) !== $idKey) {
                    $messages[] = 'Another employee or account already uses this company email.';
                }
                $seenEmails[$emailKey] ??= $line;
            }

            $row['department_id'] = null;
            if ($row['department'] !== '') {
                $row['department_id'] = $departments[mb_strtolower($row['department'])] ?? null;
                if ($row['department_id'] === null) {
                    $messages[] = "Unknown department \"{$row['department']}\". Add it under Departments first.";
                }
            }
            $row['location_id'] = null;
            if ($row['location'] !== '') {
                $row['location_id'] = $locations[mb_strtolower($row['location'])] ?? null;
                if ($row['location_id'] === null) {
                    $messages[] = "Unknown location \"{$row['location']}\". Add it under Company Locations first.";
                }
            }

            $row['line'] = $line;
            if ($messages === []) {
                $ready[$idKey] = $row;
            } else {
                $errors[$line] = ['line' => $line, 'employee_id' => $id, 'display_name' => $row['display_name'], 'messages' => $messages];
            }
        }

        // Managers: must exist (already in the portal, or a good row in this file), not be the person, and never form a loop.
        do {
            $changed = false;
            $managerOf = $dbManagerOf;
            foreach ($ready as $key => $row) {
                $managerOf[$key] = mb_strtolower($row['manager_employee_id']);
            }
            foreach ($ready as $key => $row) {
                $manager = mb_strtolower($row['manager_employee_id']);
                if ($manager === '') {
                    continue;
                }
                $problem = null;
                if ($manager === $key) {
                    $problem = 'A person cannot be their own manager.';
                } elseif (! isset($existingIds[$manager]) && ! isset($ready[$manager])) {
                    $problem = "Manager \"{$row['manager_employee_id']}\" was not found (it must already exist or be a valid row in this file).";
                } else {
                    for ($cursor = $manager, $hops = 0; $cursor !== '' && $hops < 100; $hops++) {
                        if ($cursor === $key) {
                            $problem = 'The manager chain loops back to this person.';
                            break;
                        }
                        $cursor = $managerOf[$cursor] ?? '';
                    }
                }
                if ($problem !== null) {
                    $errors[$row['line']] = ['line' => $row['line'], 'employee_id' => $row['employee_id'], 'display_name' => $row['display_name'], 'messages' => [$problem]];
                    unset($ready[$key]);
                    $changed = true;
                }
            }
        } while ($changed);

        ksort($errors);

        return ['ready' => array_values($ready), 'existing' => $existing, 'errors' => array_values($errors)];
    }

    /**
     * Create the rows that passed validation. Returns what happened so HR can see it; a row that fails here (for example a
     * mail or database problem) is reported and does not stop the others.
     *
     * @param  list<array<string, mixed>>  $ready
     * @return array{created: int, logins_created: int, logins_linked: int, failed: list<array{line: int, employee_id: string, reason: string}>}
     */
    public function import(User $actor, array $ready, bool $createLogins, bool $visible): array
    {
        $created = 0;
        $loginsCreated = 0;
        $loginsLinked = 0;
        $failed = [];
        $createdIds = [];

        foreach ($ready as $row) {
            try {
                DB::transaction(function () use ($actor, $row, $createLogins, $visible, &$loginsCreated, &$loginsLinked) {
                    $entry = new DirectoryEntry;
                    $entry->forceFill([
                        'employee_id' => $row['employee_id'], 'display_name' => $row['display_name'], 'job_title' => $row['job_title'] ?: null,
                        'department_id' => $row['department_id'], 'location_id' => $row['location_id'], 'company_email' => $row['company_email'],
                        'phone' => $row['phone'] ?: null, 'employment_status' => $row['employment_status'], 'employment_type' => $row['employment_type'] ?: null,
                        'date_joined' => $row['date_joined'] ?: null, 'is_visible' => $visible, 'source' => DirectoryEntry::MANUAL,
                        'verification' => 'unverified', 'is_sample' => false,
                    ])->save();

                    if ($createLogins && $row['employment_status'] !== EmploymentStatus::Inactive->value) {
                        $user = User::query()->where('employee_id', $row['employee_id'])->first();
                        if ($user === null) {
                            $user = $this->users->create($actor, ['employee_id' => $row['employee_id'], 'email' => $row['company_email'], 'role' => $row['role'], 'status' => UserStatus::Pending->value]);
                            $loginsCreated++;
                        } else {
                            $loginsLinked++;
                        }
                        if (DirectoryEntry::query()->where('user_id', $user->getKey())->exists()) {
                            throw new \RuntimeException('Its account is already linked to another employee record.');
                        }
                        $entry->forceFill(['user_id' => $user->getKey()])->save();
                    }
                });
                $created++;
                $createdIds[] = $row;
            } catch (\Throwable $e) {
                $failed[] = ['line' => (int) $row['line'], 'employee_id' => $row['employee_id'], 'reason' => $e instanceof \RuntimeException ? $e->getMessage() : 'Could not be saved.'];
            }
        }

        // Managers last, so a manager can appear anywhere in the file (or already exist).
        foreach ($createdIds as $row) {
            if ($row['manager_employee_id'] === '') {
                continue;
            }
            $managerId = DirectoryEntry::query()->whereRaw('lower(employee_id) = ?', [mb_strtolower($row['manager_employee_id'])])->value('id');
            if ($managerId !== null) {
                DirectoryEntry::query()->where('employee_id', $row['employee_id'])->update(['manager_id' => $managerId]);
            }
        }

        Audit::record($actor, 'DIRECTORY_IMPORTED', 'hr', null, 'CSV import', 'success', [
            'created' => $created, 'logins_created' => $loginsCreated, 'failed' => count($failed), 'visible' => $visible ? 1 : 0,
        ]);

        return ['created' => $created, 'logins_created' => $loginsCreated, 'logins_linked' => $loginsLinked, 'failed' => $failed];
    }

    /** Header text -> one of COLUMNS (or the cleaned text when unknown). */
    private function canonical(string $header): string
    {
        $key = trim(preg_replace('/[^a-z0-9]+/', '_', mb_strtolower($header)) ?? '', '_');

        return self::ALIASES[$key] ?? $key;
    }

    /**
     * @param  array<string, string>  $raw
     * @return array<string, string>
     */
    private function normalise(array $raw): array
    {
        $row = [];
        foreach (self::COLUMNS as $column) {
            $row[$column] = trim($raw[$column] ?? '');
        }
        $slug = fn (string $v) => trim(preg_replace('/[\s\-]+/', '_', mb_strtolower($v)) ?? '', '_');
        $row['employment_status'] = $row['employment_status'] === '' ? EmploymentStatus::Active->value : $slug($row['employment_status']);
        $row['employment_type'] = $row['employment_type'] === '' ? '' : $slug($row['employment_type']);
        $role = $slug($row['role']);
        $row['role'] = match ($role) {
            '', 'regular_employee', 'regular', 'employee' => RoleName::Employee->value,
            default => $role,
        };
        $row['company_email'] = mb_strtolower($row['company_email']);

        return $row;
    }
}
