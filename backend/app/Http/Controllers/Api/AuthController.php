<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Enums\UserStatus;
use App\Services\PasswordLinks;
use App\Services\PortalEvents;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Session authentication for the SPA (Laravel Sanctum stateful mode): the browser holds an HttpOnly session cookie, never
 * a token in localStorage. `GET /sanctum/csrf-cookie` must be called before `login`.
 *
 * Failures are deliberately generic: unknown account, wrong password and a locked account all look the same to the caller
 * (401), so nothing about an account can be learned. Inactive accounts get 403 only AFTER the password was correct.
 * There is no /refresh: a session cookie does not expire the way a bearer token does, so there is nothing to refresh.
 */
class AuthController extends ApiController
{
    private const GENERIC_FAILURE = 'Invalid employee ID/email or password.';

    /**
     * Step 1 of sign-in: the person types only their employee ID or company email. The answer says what to ask for next:
     * `password` (normal sign-in) or `setup` (first time: a 6-digit code was emailed so they can choose a password).
     * Unknown, disabled and suspended identifiers all answer `password`, so only a genuine first-time account is revealed.
     */
    public function identify(Request $request, PasswordLinks $links): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string', 'max:255']], ['identifier.required' => 'Enter your employee ID or company email.']);
        $user = User::query()->withIdentifier($data['identifier'])->first();

        if ($user !== null && $user->status === UserStatus::Pending) {
            $links->sendFirstSignInCode($user);

            return response()->json(['data' => ['step' => 'setup', 'email_hint' => PasswordLinks::maskEmail($user->email), 'code_minutes' => PasswordLinks::CODE_MINUTES]]);
        }

        return response()->json(['data' => ['step' => 'password']]);
    }

    /** Step 2 for a first-time account: the emailed code proves the mailbox, the new password is saved, and they are signed in. */
    public function completeSetup(Request $request, PasswordLinks $links): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
            'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed'],
        ], ['code.regex' => 'Enter the 6-digit code from your email.']);

        $user = User::query()->withIdentifier($data['identifier'])->first();
        if ($user === null || ! $links->completeFirstSignIn($user, $data['code'], $data['password'])) {
            throw ValidationException::withMessages(['code' => ['That code is wrong or has expired. Check your email, or ask for a new code.']]);
        }

        Auth::guard('web')->login($user->refresh());
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        PortalEvents::activity($user, 'login', 'Signed in to the portal');

        return (new UserResource($user->load('roles', 'profile')))->response();
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $key = $this->throttleKey($request);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $this->logFailure($request, 'rate limited');
            return response()->json(
                ['message' => 'Too many sign-in attempts. Please wait a moment and try again.', 'errors' => (object) []],
                429,
                ['Retry-After' => RateLimiter::availableIn($key)],
            );
        }

        $user = User::query()->withIdentifier($request->string('identifier')->toString())->first();

        // Always run a hash check so response time does not reveal whether the account exists.
        static $placeholder = null;
        $valid = Hash::check($request->string('password')->toString(), $user?->password ?? ($placeholder ??= Hash::make(Str::random(40))));

        if ($user === null || ! $valid) {
            RateLimiter::hit($key, 60);
            $this->logFailure($request, 'invalid credentials');

            return response()->json(['message' => self::GENERIC_FAILURE, 'errors' => (object) []], 401);
        }

        if (! $user->isActive()) {
            RateLimiter::hit($key, 60);
            $this->logFailure($request, 'inactive account');
            abort(403);
        }

        RateLimiter::clear($key);
        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        PortalEvents::activity($user, 'login', 'Signed in to the portal');

        return (new UserResource($user->load('roles', 'profile')))->response();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('roles', 'profile'));
    }

    /** Marks the first-sign-in setup as finished. Idempotent: calling it again changes nothing. */
    public function completeOnboarding(Request $request): UserResource
    {
        $user = $request->user();
        if ($user->onboarded_at === null && ! $user->emergencyContacts()->exists()) {
            throw ValidationException::withMessages(['emergency_contacts' => ['Add at least one emergency contact to finish the setup.']]);
        }
        if ($user->onboarded_at === null) {
            $user->forceFill(['onboarded_at' => now()])->save();
            PortalEvents::activity($user, 'onboarding_completed', 'Finished the first sign-in setup');
        }

        return new UserResource($user->load('roles', 'profile'));
    }

    public function logout(Request $request): JsonResponse
    {
        PortalEvents::activity($request->user(), 'logout', 'Signed out of the portal');
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->noContent();
    }

    /**
     * Sign-in failures are logged for diagnosis WITHOUT the password and without the raw identifier (only a short hash of it),
     * so the log never holds credentials or a mistyped password that was really someone's identifier.
     */
    private function logFailure(Request $request, string $reason): void
    {
        Log::warning('Sign-in failed', ['reason' => $reason, 'identifier_hash' => substr(hash('sha256', strtolower(trim($request->string('identifier')->toString()))), 0, 16), 'ip' => $request->ip()]);
    }

    /** Per account AND address, so one attacker cannot lock an employee out from everywhere, nor spray many accounts. */
    private function throttleKey(Request $request): string
    {
        return 'login:'.strtolower(trim($request->string('identifier')->toString())).'|'.$request->ip();
    }
}
