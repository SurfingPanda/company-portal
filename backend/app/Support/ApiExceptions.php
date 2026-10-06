<?php

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * One error contract for the whole API. The React client ignores the body except `errors` on 422 and shows its own wording,
 * but the body must still never leak internals, so exception messages are replaced with fixed sentences.
 */
final class ApiExceptions
{
    /** Fixed wording per status. Raw exception messages are never returned. */
    private const MESSAGES = [
        401 => 'Authentication is required.',
        403 => 'You do not have permission to access this resource.',
        404 => 'The requested resource could not be found.',
        405 => 'This method is not allowed for the requested resource.',
        409 => 'The request conflicts with the current state of the resource.',
        419 => 'Your session has expired. Please refresh and try again.',
        422 => 'The given data was invalid.',
        429 => 'Too many requests. Please wait a moment and try again.',
        500 => 'Unable to process the request.',
        503 => 'The service is temporarily unavailable.',
    ];

    public static function register(Exceptions $exceptions): void
    {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        $exceptions->render(function (Throwable $e, Request $request): ?JsonResponse {
            if (! ($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            return match (true) {
                $e instanceof ValidationException => self::json(422, $e->errors()),
                $e instanceof AuthenticationException => self::json(401),
                $e instanceof AuthorizationException => self::json(403),
                $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => self::json(404),
                $e instanceof TokenMismatchException => self::json(419),
                $e instanceof HttpExceptionInterface => self::json($e->getStatusCode(), [], null, $e->getHeaders()),
                default => self::json(500),
            };
        });
    }

    /**
     * @param  array<string, list<string>>  $errors
     * @param  array<string, string>  $headers
     */
    private static function json(int $status, array $errors = [], ?string $message = null, array $headers = []): JsonResponse
    {
        return response()->json(
            ['message' => $message ?? self::MESSAGES[$status] ?? self::MESSAGES[$status >= 500 ? 500 : 403], 'errors' => (object) $errors],
            $status,
            // Keep Retry-After on 429; drop everything else the exception wanted to say.
            array_intersect_key($headers, ['Retry-After' => true]),
        );
    }
}
