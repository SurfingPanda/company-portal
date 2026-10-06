<?php

namespace App\Http\Controllers\Api;

use App\Mail\DailyDigestMail;
use App\Services\DigestBuilder;
use App\Services\MailGuard;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/** "Send me a sample": the signed-in person gets their own daily summary now, so they can see what the email looks like. */
class EmailPreviewController extends ApiController
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! MailGuard::deliverable($user->email)) {
            throw ValidationException::withMessages(['email' => ['Your account email cannot receive messages, so a sample cannot be sent.']]);
        }

        $digest = DigestBuilder::for($user->load(['preferences', 'profile', 'directoryEntry', 'roles']), CarbonImmutable::now()->subDays(7));
        Mail::to($user->email)->send(new DailyDigestMail($user, $digest, preview: true));

        [$name, $domain] = explode('@', $user->email, 2);

        return response()->json(['data' => ['sent_to' => mb_substr($name, 0, 1).'***@'.$domain]]);
    }
}
