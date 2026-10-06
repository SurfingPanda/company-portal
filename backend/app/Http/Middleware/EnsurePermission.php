<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route middleware: `->middleware('permission:documents.manage')`. Unauthenticated -> 401, authenticated without the
 * permission -> 403 (the React portal handles both). Permissions come from the user's server-side roles.
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        abort_if($user === null, 401);
        abort_unless(collect($permissions)->contains(fn (string $p) => $user->hasPermission($p)), 403);

        return $next($request);
    }
}
