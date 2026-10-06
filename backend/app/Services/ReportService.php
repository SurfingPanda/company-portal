<?php

namespace App\Services;

use App\Enums\ContentStatus;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\DirectoryEntry;
use App\Models\Policy;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Company reports for HR, built only from what the portal already stores (employee records, accounts, policy acknowledgements and
 * the audit log). No payroll, attendance or leave figures exist here, so none are reported. Everything is read-only.
 */
final class ReportService
{
    /** Columns of the directory export. Deliberately excludes private data (personal details, emergency contacts, birthdays). */
    public const DIRECTORY_COLUMNS = ['Employee ID', 'Name', 'Job title', 'Department', 'Location', 'Company email', 'Employment status', 'Employment type', 'Date joined', 'Manager', 'Portal account'];

    /** @return array<string, mixed> */
    public function overview(int $months = 12): array
    {
        $entries = DirectoryEntry::query()->with('department:id,name', 'location:id,name')->get();
        $today = CarbonImmutable::today();

        return [
            'generated_at' => now()->toIso8601String(),
            'headcount' => [
                'total' => $entries->count(),
                'active' => $entries->where('employment_status', 'active')->count(),
                'on_leave' => $entries->where('employment_status', 'on_leave')->count(),
                'inactive' => $entries->where('employment_status', 'inactive')->count(),
                'by_department' => $this->tally($entries->where('employment_status', '!=', 'inactive'), fn ($e) => $e->department?->name ?? 'No department'),
                'by_location' => $this->tally($entries->where('employment_status', '!=', 'inactive'), fn ($e) => $e->location?->name ?? 'No location'),
                'by_type' => $this->tally($entries->where('employment_status', '!=', 'inactive'), fn ($e) => $e->employment_type ? ucfirst(str_replace('_', ' ', $e->employment_type)) : 'Not set'),
            ],
            'tenure' => $this->tenure($entries->where('employment_status', '!=', 'inactive'), $today),
            'movement' => $this->movement($entries, $months, $today),
            'accounts' => [
                'active' => User::query()->where('status', UserStatus::Active->value)->count(),
                'waiting_first_sign_in' => User::query()->where('status', UserStatus::Pending->value)->count(),
                'disabled' => User::query()->whereIn('status', [UserStatus::Inactive->value, UserStatus::Suspended->value])->count(),
                'without_record' => User::query()->whereNotIn('employee_id', DirectoryEntry::query()->select('employee_id'))->count(),
            ],
            'policies' => $this->policyCompliance(),
        ];
    }

    /** @return list<array{label: string, count: int}> largest first */
    private function tally(Collection $entries, callable $key): array
    {
        return $entries->groupBy($key)->map(fn (Collection $g, string $label) => ['label' => $label, 'count' => $g->count()])
            ->sortByDesc('count')->values()->all();
    }

    /** @return list<array{label: string, count: int}> */
    private function tenure(Collection $entries, CarbonImmutable $today): array
    {
        $buckets = ['Under 1 year' => 0, '1 to 3 years' => 0, '3 to 5 years' => 0, '5 years or more' => 0, 'Date not set' => 0];
        foreach ($entries as $entry) {
            if ($entry->date_joined === null) {
                $buckets['Date not set']++;

                continue;
            }
            $years = CarbonImmutable::parse($entry->date_joined)->diffInYears($today, true);
            $buckets[match (true) {
                $years < 1 => 'Under 1 year', $years < 3 => '1 to 3 years', $years < 5 => '3 to 5 years', default => '5 years or more',
            }]++;
        }

        return collect($buckets)->map(fn (int $count, string $label) => compact('label', 'count'))->values()->all();
    }

    /**
     * New hires (by "date joined") and leavers (when the employee was set to inactive, from the audit log) for each of the last
     * `$months` months, oldest first.
     *
     * @return list<array{month: string, label: string, hires: int, leavers: int}>
     */
    private function movement(Collection $entries, int $months, CarbonImmutable $today): array
    {
        $start = $today->startOfMonth()->subMonths($months - 1);
        $rows = [];
        for ($i = 0; $i < $months; $i++) {
            $month = $start->addMonths($i);
            $rows[$month->format('Y-m')] = ['month' => $month->format('Y-m'), 'label' => $month->format('M Y'), 'hires' => 0, 'leavers' => 0];
        }
        foreach ($entries as $entry) {
            $key = $entry->date_joined?->format('Y-m');
            if ($key !== null && isset($rows[$key])) {
                $rows[$key]['hires']++;
            }
        }
        AuditLog::query()->where('action', 'USER_OFFBOARDED')->where('created_at', '>=', $start)->pluck('created_at')
            ->each(function ($at) use (&$rows) {
                $key = CarbonImmutable::parse($at)->format('Y-m');
                if (isset($rows[$key])) {
                    $rows[$key]['leavers']++;
                }
            });

        return array_values($rows);
    }

    /** @return list<array{id: int, title: string, version: int, audience: string, required: int, acknowledged: int, outstanding: int, percent: int}> */
    public function policyCompliance(): array
    {
        return Policy::query()->where('status', ContentStatus::Published->value)->orderBy('title')->get()
            ->map(fn (Policy $p) => ['id' => $p->id, 'title' => $p->title, 'version' => $p->version, 'audience' => $p->audience->value, ...$p->progress()])
            ->all();
    }

    /**
     * Rows for a CSV export, header first.
     *
     * @return list<list<string|int>>
     */
    public function exportRows(string $type): array
    {
        return match ($type) {
            'directory' => $this->directoryRows(),
            'headcount' => $this->headcountRows(),
            'policies' => $this->policyRows(),
            default => abort(404),
        };
    }

    /** @return list<list<string|int>> */
    private function directoryRows(): array
    {
        $rows = [self::DIRECTORY_COLUMNS];
        DirectoryEntry::query()->with('department:id,name', 'location:id,name', 'manager:id,display_name', 'user:id,status')->orderBy('display_name')
            ->each(function (DirectoryEntry $e) use (&$rows) {
                $rows[] = [$e->employee_id, $e->display_name, $e->job_title ?? '', $e->department?->name ?? '', $e->location?->name ?? '', $e->company_email ?? '',
                    $e->employment_status, $e->employment_type ?? '', $e->date_joined?->format('Y-m-d') ?? '', $e->manager?->display_name ?? '', $e->user?->status->value ?? 'none'];
            });

        return $rows;
    }

    /** @return list<list<string|int>> */
    private function headcountRows(): array
    {
        $rows = [['Department', 'Active', 'On leave', 'Inactive', 'Total']];
        DirectoryEntry::query()->with('department:id,name')->get()->groupBy(fn ($e) => $e->department?->name ?? 'No department')->sortKeys()
            ->each(function (Collection $g, string $name) use (&$rows) {
                $rows[] = [$name, $g->where('employment_status', 'active')->count(), $g->where('employment_status', 'on_leave')->count(), $g->where('employment_status', 'inactive')->count(), $g->count()];
            });

        return $rows;
    }

    /** @return list<list<string|int>> */
    private function policyRows(): array
    {
        $rows = [['Policy', 'Version', 'Audience', 'Required', 'Acknowledged', 'Outstanding', 'Percent acknowledged']];
        foreach ($this->policyCompliance() as $p) {
            $rows[] = [$p['title'], $p['version'], $p['audience'], $p['required'], $p['acknowledged'], $p['outstanding'], $p['percent']];
        }

        return $rows;
    }

    /** One CSV cell. Text starting with = + - @ (or a tab/return) is prefixed so a spreadsheet never runs it as a formula. */
    public static function cell(string|int|null $value): string
    {
        $text = (string) ($value ?? '');
        if ($text !== '' && str_contains("=+-@\t\r", $text[0]) && ! is_numeric($text)) {
            $text = "'".$text;
        }

        return '"'.str_replace('"', '""', $text).'"';
    }
}
