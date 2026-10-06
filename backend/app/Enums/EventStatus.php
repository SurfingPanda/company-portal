<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum EventStatus: string
{
    case Scheduled = 'scheduled';
    case Cancelled = 'cancelled';
    case Postponed = 'postponed';
    case Completed = 'completed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
