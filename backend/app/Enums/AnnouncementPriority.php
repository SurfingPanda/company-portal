<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum AnnouncementPriority: string
{
    case Normal = 'normal';
    case Important = 'important';
    case Urgent = 'urgent';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
