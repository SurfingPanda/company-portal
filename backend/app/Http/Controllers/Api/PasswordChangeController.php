<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationType;
use App\Mail\PasswordChangedMail;
use App\Models\PasswordLink;
use App\Services\Audit;
use App\Services\MailGuard;
use App\Services\PortalEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * Change your own password from inside the portal. The current password must be right (so a borrowed, unlocked session cannot
 * take the account over), the new one must be different and long enough, and afterwards every OTHER device is signed out, any
 * unused reset link is destroyed, the change is audited, and the account's email gets a notice.
 */
class PasswordChangeController extends ApiController
{
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed', 'different:current_password'],
        ], [
            'password.min' => 'Use at least 12 characters.',
            'password.confirmed' => 'The two new passwords do not match.',
            'password.different' => 'Choose a password you have not been using.',
        ]);

        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            Audit::record($user, 'PASSWORD_CHANGE_REFUSED', 'users', $user, $user->employee_id, 'failure', ['reason' => 'wrong current password']);
            throw ValidationException::withMessages(['current_password' => ['That is not your current password.']]);
        }

        DB::transaction(function () use ($user, $data, $request) {
            $user->forceFill(['password' => Hash::make($data['password']), 'remember_token' => null])->save();
            // Every other device is signed out; this one stays signed in.
            DB::table('sessions')->where('user_id', $user->getKey())->where('id', '!=', $request->session()->getId())->delete();
            PasswordLink::query()->where('user_id', $user->getKey())->delete();
            Audit::record($user, 'PASSWORD_CHANGED', 'users', $user, $user->employee_id, 'success', ['via' => 'account settings']);
            PortalEvents::notify($user, NotificationType::System, 'Your password was changed', 'If this was not you, reset your password straight away and tell IT.', '/account/settings');
        });
        $request->session()->regenerate();

        if (MailGuard::deliverable($user->email)) {
            try {
                Mail::to($user->email)->send(new PasswordChangedMail($user->employee_id));
            } catch (\Throwable $e) {
                Log::warning('Password changed email failed', ['employee_id' => $user->employee_id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json(['message' => 'Your password was changed. Other devices were signed out.']);
    }
}
