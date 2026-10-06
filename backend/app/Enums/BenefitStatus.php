<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum BenefitStatus: string
{
    case Available = 'available';
    case InformationOnly = 'information-only';
    case ComingSoon = 'coming-soon';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
