<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum RoleName: string
{
    case Employee = 'employee';
    case Manager = 'manager';
    case Hr = 'hr';
    case It = 'it';
    case Admin = 'admin';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
