<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum ResourceType: string
{
    case Document = 'document';
    case Form = 'form';
    case Service = 'service';
    case Page = 'page';
    case Faq = 'faq';
    case External = 'external';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
