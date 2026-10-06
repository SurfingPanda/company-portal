<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum NotificationType: string
{
    case Announcement = 'announcement';
    case Request = 'request';
    case Event = 'event';
    case Document = 'document';
    case System = 'system';
    case Hr = 'hr';
    case It = 'it';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
