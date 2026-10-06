<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationType;
use App\Http\Resources\NotificationResource;
use App\Models\PortalNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * The signed-in employee's own notifications. Every query starts from `ownedBy($user)`, so another employee's notification
 * id is a 404 (not 403) and nobody, administrators included, can read someone else's.
 */
class NotificationController extends ApiController
{
    private const SORTS = ['created_at' => 'created_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'unread' => ['sometimes', 'in:true,false,1,0'],
            'type' => ['sometimes', Rule::enum(NotificationType::class)],
        ], array_keys(self::SORTS));

        $query = PortalNotification::query()->ownedBy($request->user())
            ->when($request->boolean('unread'), fn (Builder $q) => $q->unread())
            ->when($input['type'] ?? null, fn (Builder $q, $v) => $q->where('type', $v));

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'created_at'), $request, NotificationResource::class);
    }

    public function show(Request $request, int $notification): NotificationResource
    {
        return new NotificationResource($this->own($request, $notification));
    }

    public function read(Request $request, int $notification): NotificationResource
    {
        $model = $this->own($request, $notification);
        $model->markAsRead();

        return new NotificationResource($model);
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = PortalNotification::query()->ownedBy($request->user())->unread()->update(['read_at' => now()]);

        return response()->json(['data' => ['updated' => $count]]);
    }

    private function own(Request $request, int $id): PortalNotification
    {
        return PortalNotification::query()->ownedBy($request->user())->findOrFail($id);
    }
}
