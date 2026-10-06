<?php

namespace App\Services;

/**
 * Decides whether an address is worth sending to. Reserved example domains (RFC 2606: example.com, *.example, *.test, *.invalid,
 * *.localhost) can never receive mail, so the sample data never turns into a flood of bounces.
 */
final class MailGuard
{
    private const RESERVED_SUFFIXES = ['.example', '.test', '.invalid', '.localhost', '.local'];

    private const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org', 'localhost'];

    public static function deliverable(?string $email): bool
    {
        if ($email === null || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return false;
        }
        $domain = strtolower(substr(strrchr($email, '@'), 1));
        foreach (self::RESERVED_SUFFIXES as $suffix) {
            if (str_ends_with($domain, $suffix)) {
                return false;
            }
        }

        return ! in_array($domain, self::RESERVED_DOMAINS, true);
    }
}
