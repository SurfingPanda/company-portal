<?php

namespace App\Services;

use Closure;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Server-side reference numbers: REQ-2026-0001, INC-2026-00125, APP-2026-0001, REF-2026-0001.
 *
 * The number is the next free sequence for `PREFIX-YEAR-`. Two concurrent submissions can compute the same value, so the
 * unique index is the real guarantee: on a collision the whole insert is retried with a fresh number. The browser never
 * supplies a reference.
 */
final class ReferenceNumbers
{
    private const ATTEMPTS = 5;

    /**
     * @template T
     *
     * @param  Closure(string): T  $persist  inserts the row using the generated number and returns the result
     * @return T
     */
    public static function create(string $table, string $column, string $prefix, int $pad, Closure $persist): mixed
    {
        for ($attempt = 1; ; $attempt++) {
            try {
                return DB::transaction(fn () => $persist(self::next($table, $column, $prefix, $pad)));
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt >= self::ATTEMPTS) {
                    throw $e;
                }
            }
        }
    }

    public static function next(string $table, string $column, string $prefix, int $pad): string
    {
        $stem = sprintf('%s-%d-', $prefix, now()->year);
        $last = DB::table($table)->where($column, 'like', $stem.'%')->orderByDesc($column)->value($column);
        $sequence = $last === null ? 1 : ((int) substr($last, strlen($stem))) + 1;

        return $stem.str_pad((string) $sequence, $pad, '0', STR_PAD_LEFT);
    }
}
