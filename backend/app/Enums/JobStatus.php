<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum JobStatus: string
{
    case Open = 'open';
    case ClosingSoon = 'closing-soon';
    case Closed = 'closed';
    case Filled = 'filled';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
