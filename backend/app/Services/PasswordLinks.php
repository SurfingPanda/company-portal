<?php

namespace App\Services;

use App\Contracts\AccountActivation;
use App\Enums\UserStatus;
use App\Mail\FirstSignInCodeMail;
use App\Mail\PasswordLinkMail;
use App\Models\PasswordLink;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Self-service password setup: an emailed, single-use, expiring link lets a person choose their own password. Used for the
 * first activation of an account an administrator created and for "forgot password". Only a SHA-256 hash of the token is
 * stored, a new link replaces earlier unused ones, and the link is never returned by the API (it exists only in the email).
 * Binds to the AccountActivation extension point, so creating a user sends the activation email.
 */
class PasswordLinks implements AccountActivation
{
    public const ACTIVATION_HOURS = 72;

    public const RESET_HOURS = 2;

    public const CODE_MINUTES = 15;

    public const CODE_MAX_ATTEMPTS = 5;

    /** A new code is not sent again within this many seconds (stops the sign-in page being used to flood a mailbox). */
    public const CODE_RESEND_SECONDS = 60;

    public function accountCreated(User $user): void
    {
        $this->send($user);
    }

    /** Email the right link for this account's state. Returns false when nothing was sent (disabled account, mail failure). */
    public function send(User $user): bool
    {
        $purpose = match ($user->status) {
            UserStatus::Pending => 'activation',
            UserStatus::Active => 'reset',
            default => null,
        };
        if ($purpose === null || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $hours = $purpose === 'activation' ? self::ACTIVATION_HOURS : self::RESET_HOURS;
        $token = Str::random(64);
        DB::transaction(function () use ($user, $purpose, $token, $hours) {
            PasswordLink::query()->where('user_id', $user->getKey())->whereNull('used_at')->delete();
            $link = new PasswordLink;
            $link->forceFill(['user_id' => $user->getKey(), 'purpose' => $purpose, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHours($hours)])->save();
        });

        $url = rtrim((string) config('app.frontend_url'), '/').'/set-password?token='.$token;
        try {
            Mail::to($user->email)->send(new PasswordLinkMail($purpose, $user->employee_id, $url, $hours));
        } catch (\Throwable $e) {
            Log::warning('Password link email failed', ['employee_id' => $user->employee_id, 'error' => $e->getMessage()]);

            return false;
        }

        return true;
    }

    /** Masked address shown on the sign-in page, e.g. "a***@eljin.example". */
    public static function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($name, 0, 1).'***@'.$domain;
    }

    /**
     * First sign-in: email a 6-digit code to the account's own address. Only for `pending` accounts. Returns false when nothing
     * was sent (not pending, bad address, resent too soon, mail failure).
     */
    public function sendFirstSignInCode(User $user): bool
    {
        if ($user->status !== UserStatus::Pending || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $recent = PasswordLink::query()->where('user_id', $user->getKey())->where('purpose', 'activation_code')->whereNull('used_at')
            ->where('created_at', '>', now()->subSeconds(self::CODE_RESEND_SECONDS))->exists();
        if ($recent) {
            return false;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        DB::transaction(function () use ($user, $code) {
            PasswordLink::query()->where('user_id', $user->getKey())->where('purpose', 'activation_code')->delete();
            $link = new PasswordLink;
            $link->forceFill(['user_id' => $user->getKey(), 'purpose' => 'activation_code', 'token_hash' => $this->codeHash($user, $code), 'expires_at' => now()->addMinutes(self::CODE_MINUTES)])->save();
        });
        try {
            Mail::to($user->email)->send(new FirstSignInCodeMail($user->employee_id, $code, self::CODE_MINUTES));
        } catch (\Throwable $e) {
            Log::warning('First sign-in code email failed', ['employee_id' => $user->employee_id, 'error' => $e->getMessage()]);

            return false;
        }

        return true;
    }

    /**
     * Check the code and set the password, activating the account. A wrong code counts as an attempt; after CODE_MAX_ATTEMPTS the
     * code is destroyed and a new one must be requested. Returns false for any problem (the caller gives one generic message).
     */
    public function completeFirstSignIn(User $user, string $code, string $password): bool
    {
        if ($user->status !== UserStatus::Pending) {
            return false;
        }
        $link = PasswordLink::query()->where('user_id', $user->getKey())->where('purpose', 'activation_code')->whereNull('used_at')->where('expires_at', '>', now())->first();
        if ($link === null) {
            return false;
        }
        if (! hash_equals($link->token_hash, $this->codeHash($user, $code))) {
            $link->forceFill(['attempts' => $link->attempts + 1])->save();
            if ($link->attempts >= self::CODE_MAX_ATTEMPTS) {
                $link->delete();
            }

            return false;
        }

        DB::transaction(function () use ($user, $password) {
            $user->forceFill(['password' => Hash::make($password), 'status' => UserStatus::Active->value])->save();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            PasswordLink::query()->where('user_id', $user->getKey())->delete();
            Audit::record(null, 'USER_ACTIVATED', 'users', $user, $user->employee_id, 'success', ['via' => 'first sign-in code']);
        });

        return true;
    }

    private function codeHash(User $user, string $code): string
    {
        return hash_hmac('sha256', $user->getKey().'|'.$code, (string) config('app.key'));
    }

    /** The unused, unexpired link for a token, or null. */
    public function find(string $token): ?PasswordLink
    {
        return PasswordLink::query()->with('user')->where('token_hash', hash('sha256', $token))->whereNull('used_at')->where('expires_at', '>', now())->first();
    }

    /** Set the password, activate a pending account, end its sessions and use the link up. Returns false for a bad link. */
    public function complete(string $token, string $password): bool
    {
        $link = $this->find($token);
        $user = $link?->user;
        if ($link === null || $user === null || ! in_array($user->status, [UserStatus::Pending, UserStatus::Active], true)) {
            return false;
        }

        DB::transaction(function () use ($user, $password) {
            $activated = $user->status === UserStatus::Pending;
            $user->forceFill(['password' => Hash::make($password), 'status' => UserStatus::Active->value])->save();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            PasswordLink::query()->where('user_id', $user->getKey())->delete();
            Audit::record(null, $activated ? 'USER_ACTIVATED' : 'USER_PASSWORD_RESET', 'users', $user, $user->employee_id, 'success', ['via' => 'emailed link']);
        });

        return true;
    }
}
