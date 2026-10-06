<?php

namespace App\Services;

use App\Enums\EmploymentStatus;
use App\Models\DirectoryEntry;
use Carbon\CarbonImmutable;

/**
 * Birthdays and work anniversaries coming up (the dashboard and the daily summary use the same rules).
 *  - A BIRTHDAY appears only when the employee agreed (`share_birthday`), and only as a day and month: the birth year and age are
 *    never returned.
 *  - A WORK ANNIVERSARY comes from HR's date joined and shows unless the employee turned it off. Only years of 1 or more.
 *  - Only people shown in the directory who have not left appear. A 29 February date is celebrated on 28 February in other years.
 */
final class Celebrations
{
    /** @return array{birthdays: list<array<string, mixed>>, anniversaries: list<array<string, mixed>>} */
    public static function upcoming(int $days, ?int $forUserId = null): array
    {
        $today = CarbonImmutable::today();
        $until = $today->addDays($days);

        $people = DirectoryEntry::query()->visible()->where('employment_status', '!=', EmploymentStatus::Inactive->value)->whereNotNull('user_id')
            ->with(['department', 'user.profile'])->get();

        $birthdays = [];
        $anniversaries = [];
        foreach ($people as $entry) {
            $profile = $entry->user?->profile;
            $base = ['employee_id' => $entry->employee_id, 'display_name' => $entry->display_name, 'job_title' => $entry->job_title, 'department' => $entry->department?->name, 'is_you' => $entry->user_id === $forUserId];

            if ($profile?->share_birthday && $profile->date_of_birth !== null) {
                $next = self::nextOccurrence($profile->date_of_birth, $today);
                if ($next->lte($until)) {
                    $birthdays[] = $base + ['date' => $next->toDateString(), 'is_today' => $next->isSameDay($today)];
                }
            }
            if ($entry->date_joined !== null && ($profile === null || $profile->share_anniversary)) {
                $next = self::nextOccurrence($entry->date_joined, $today);
                $years = $next->year - $entry->date_joined->year;
                if ($years >= 1 && $next->lte($until)) {
                    $anniversaries[] = $base + ['date' => $next->toDateString(), 'is_today' => $next->isSameDay($today), 'years' => $years];
                }
            }
        }

        $byDate = fn (array $a, array $b) => [$a['date'], $a['display_name']] <=> [$b['date'], $b['display_name']];
        usort($birthdays, $byDate);
        usort($anniversaries, $byDate);

        return ['birthdays' => $birthdays, 'anniversaries' => $anniversaries];
    }

    /** The next date (today or later) on which this month and day comes round. */
    private static function nextOccurrence(\DateTimeInterface $origin, CarbonImmutable $today): CarbonImmutable
    {
        $month = (int) $origin->format('n');
        $day = (int) $origin->format('j');
        for ($year = $today->year; $year <= $today->year + 1; $year++) {
            $date = self::inYear($year, $month, $day);
            if ($date->gte($today)) {
                return $date;
            }
        }

        return self::inYear($today->year + 1, $month, $day);
    }

    private static function inYear(int $year, int $month, int $day): CarbonImmutable
    {
        // 29 February in a year without one is celebrated on 28 February.
        if ($month === 2 && $day === 29 && ! CarbonImmutable::create($year, 1, 1)->isLeapYear()) {
            $day = 28;
        }

        return CarbonImmutable::create($year, $month, $day)->startOfDay();
    }
}
