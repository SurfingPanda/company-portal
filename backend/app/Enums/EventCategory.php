<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum EventCategory: string
{
    case CompanyEvent = 'company-event';
    case Training = 'training';
    case Meeting = 'meeting';
    case Holiday = 'holiday';
    case Deadline = 'deadline';
    case EmployeeActivity = 'employee-activity';
    case DepartmentEvent = 'department-event';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
