<?php

namespace App\Http\Controllers\Api;

use App\Services\Celebrations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Birthdays and work anniversaries coming up, for the dashboard. The rules (consent, day and month only) live in App\Services\Celebrations. */
class CelebrationController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $input = $request->validate(['days' => ['sometimes', 'integer', 'min:1', 'max:60']]);
        $days = (int) ($input['days'] ?? 30);

        return response()->json(['data' => Celebrations::upcoming($days, $request->user()->getKey()), 'meta' => ['days' => $days]]);
    }
}
