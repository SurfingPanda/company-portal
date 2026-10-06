<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Http\Controllers\Api\ApiController;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\Audit;
use App\Services\PortalEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Portal notifications sent by administrators. In-portal only (no email, SMS or push exists); the notification table is the
 * single channel, so future channels can be added behind PortalEvents. Recipients are ACTIVE accounts, and each employee's own
 * notification preferences still apply. The link must be an in-portal path.
 */
class AdminNotificationController extends ApiController
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->listInput($request, [], ['created_at']);
        $query = AuditLog::query()->where('action', 'NOTIFICATION_SENT');

        return $this->paginated($this->sorted($query, $request, ['created_at' => 'created_at'], 'created_at'), $request, \App\Http\Resources\Admin\AuditLogResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::enum(NotificationType::class)],
            'title' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:1000'],
            'link' => ['sometimes', 'nullable', 'string', 'max:300', 'regex:/^\/(?!\/)[A-Za-z0-9\/_\-.?=&%#]*$/'],
            'audience' => ['required', Rule::in(['all', 'role', 'user'])],
            'role' => ['required_if:audience,role', 'nullable', Rule::enum(RoleName::class)],
            'employee_id' => ['required_if:audience,user', 'nullable', 'string', 'max:32'],
        ], ['link.regex' => 'The link must be a portal path such as /announcements/1.']);

        if ($data['audience'] === 'user' && ! User::where('employee_id', $data['employee_id'])->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages(['employee_id' => ['No account matches that employee ID.']]);
        }

        $recipients = User::query()->where('status', UserStatus::Active->value)
            ->when($data['audience'] === 'role', fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $data['role'])))
            ->when($data['audience'] === 'user', fn ($q) => $q->where('employee_id', $data['employee_id']));

        $delivered = 0;
        $type = NotificationType::from($data['type']);
        DB::transaction(function () use ($recipients, $data, $type, &$delivered) {
            $recipients->with('preferences')->chunkById(200, function ($users) use ($data, $type, &$delivered) {
                foreach ($users as $user) {
                    if (PortalEvents::notify($user, $type, $data['title'], $data['message'], $data['link'] ?? null) !== null) {
                        $delivered++;
                    }
                }
            });
        });

        Audit::record($request->user(), 'NOTIFICATION_SENT', 'notifications', null, $data['title'], 'success', [
            'type' => $data['type'], 'audience' => $data['audience'].($data['audience'] === 'role' ? ':'.$data['role'] : ''), 'delivered' => $delivered,
        ]);

        return response()->json(['data' => ['delivered' => $delivered]], 201);
    }
}
