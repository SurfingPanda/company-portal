<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\PasswordLinks;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Public endpoints for choosing a password from an emailed link (account activation and "forgot password").
 * "Forgot" answers the same way whether or not the account exists, so it cannot be used to discover who has an account.
 */
class PasswordLinkController extends ApiController
{
    public function __construct(private readonly PasswordLinks $links) {}

    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string', 'max:255']]);
        $user = User::query()->withIdentifier($data['identifier'])->first();
        if ($user !== null) {
            $this->links->send($user);
        }

        return response()->json(['message' => 'If an account matches, an email with a link to choose a new password is on its way.'], 202);
    }

    public function set(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed'],
        ]);

        if (! $this->links->complete($data['token'], $data['password'])) {
            throw ValidationException::withMessages(['token' => ['This link is invalid or has expired. Ask for a new one.']]);
        }

        return response()->json(['message' => 'Your password is set. You can sign in now.']);
    }
}
