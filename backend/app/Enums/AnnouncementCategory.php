<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum AnnouncementCategory: string
{
    case CompanyNews = 'company-news';
    case Hr = 'hr';
    case It = 'it';
    case Operations = 'operations';
    case Facilities = 'facilities';
    case Finance = 'finance';
    case Training = 'training';
    case Safety = 'safety';
    case Policy = 'policy';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
