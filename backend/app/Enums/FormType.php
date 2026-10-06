<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum FormType: string
{
    case Download = 'download';
    case Online = 'online';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
