<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Defensive headers on every response from the Laravel app.
 *
 *  - API responses are JSON only, so their CSP is the strictest possible (`default-src 'none'`) and they are never cached
 *    (they carry one employee's private data).
 *  - HSTS is sent only in production over HTTPS.
 * The React application's own CSP is set by the web server that serves `dist/` (see SECURITY.md), because Laravel does not
 * serve that HTML.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');

        if ($request->is('api/*') || $request->is('sanctum/*')) {
            $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        if (app()->environment('production') && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
