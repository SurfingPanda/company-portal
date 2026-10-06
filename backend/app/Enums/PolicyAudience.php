<?php

namespace App\Enums;

/** Who must read and acknowledge a policy. Stored as a plain string column. */
enum PolicyAudience: string
{
    case All = 'all';
    case Managers = 'managers';
    case Departments = 'departments';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
