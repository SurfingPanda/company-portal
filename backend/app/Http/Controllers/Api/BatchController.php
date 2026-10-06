<?php

namespace App\Http\Controllers\Api;

use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Answers several READ requests in one round trip. A page that needs a dozen lists (the dashboard) used to make a dozen separate
 * HTTP requests, and each one costs the server a fixed start-up time. Here the browser sends the list of paths it wants and gets
 * every answer back together.
 *
 * Nothing is bypassed: each path is run through the router exactly as if it had been requested on its own, as the same signed-in
 * person, so every route's own middleware (sign-in, permission, rate limit), policy and validation still apply, and a path the
 * person may not read answers 403/404 inside the result. Only GET paths under /api are accepted, never this endpoint again and
 * never the sign-in endpoints.
 */
class BatchController extends ApiController
{
    public const MAX_PATHS = 25;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paths' => ['required', 'array', 'min:1', 'max:'.self::MAX_PATHS],
            'paths.*' => ['required', 'string', 'max:600', 'regex:#^/api/[A-Za-z0-9/_\-.?=&%,:+\[\]*]*$#', 'not_regex:#\.\.|^/api/(batch|auth/)#'],
        ]);

        $results = [];
        foreach (array_unique($data['paths']) as $path) {
            $results[$path] = $this->run($request, $path);
        }

        return response()->json(['results' => $results]);
    }

    /** @return array{status: int, body: mixed} */
    private function run(Request $parent, string $path): array
    {
        $sub = Request::create($path, 'GET', [], [], [], [
            'HTTP_ACCEPT' => 'application/json', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest', 'REMOTE_ADDR' => $parent->ip() ?? '127.0.0.1',
            'HTTP_HOST' => $parent->getHttpHost(), 'HTTPS' => $parent->isSecure() ? 'on' : 'off',
        ]);
        $sub->setUserResolver($parent->getUserResolver());
        if ($parent->hasSession()) {
            $sub->setLaravelSession($parent->session());
        }

        $original = app('request');
        app()->instance('request', $sub);
        try {
            $response = app('router')->dispatchToRoute($sub);
        } catch (\Throwable $e) {
            $handler = app(ExceptionHandler::class);
            if (! $e instanceof \Illuminate\Http\Exceptions\HttpResponseException && ! $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface && ! $e instanceof \Illuminate\Validation\ValidationException && ! $e instanceof \Illuminate\Auth\AuthenticationException && ! $e instanceof \Illuminate\Auth\Access\AuthorizationException && ! $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                $handler->report($e);
            }
            $response = $handler->render($sub, $e);
        } finally {
            app()->instance('request', $original);
        }

        $content = $response->getContent();
        $body = is_string($content) && $content !== '' ? json_decode($content, true) : null;

        return ['status' => $response->getStatusCode(), 'body' => $response->getStatusCode() === 204 ? null : $body];
    }
}
