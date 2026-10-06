<?php

namespace App\Enums;

/** Where an employee stands with the company. Entered by HR; stored as a plain string. */
enum EmploymentStatus: string
{
    case Active = 'active';
    case OnLeave = 'on_leave';
    case Inactive = 'inactive';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
