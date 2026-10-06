<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum DocumentAccessLevel: string
{
    case All = 'all';
    case Department = 'department';
    case Manager = 'manager';
    case Restricted = 'restricted';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
