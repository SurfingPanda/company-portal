<?php

namespace App\Http\Middleware;

use App\Services\Hubly;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accepts a call from Hubly only when it carries a fresh timestamp and a valid HMAC-SHA256 signature of "timestamp.body" made with
 * the shared secret. Anything else (including every call while the link is switched off) is refused without saying why.
 */
class VerifyHublySignature
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(Hubly::enabled(), 404);
        $timestamp = (string) $request->header('X-Hubly-Timestamp');
        $signature = (string) $request->header('X-Hubly-Signature');
        $fresh = ctype_digit($timestamp) && abs(time() - (int) $timestamp) <= (int) config('hubly.tolerance');
        abort_unless($fresh && $signature !== '' && hash_equals(Hubly::sign($timestamp, $request->getContent()), $signature), 401);

        return $next($request);
    }
}
