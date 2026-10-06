<?php

namespace App\Enums;

/** Kind of employment contract, entered by HR; stored as a plain string. */
enum EmploymentType: string
{
    case Regular = 'regular';
    case Probationary = 'probationary';
    case Contractual = 'contractual';
    case PartTime = 'part_time';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
