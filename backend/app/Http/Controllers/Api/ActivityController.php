<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ActivityResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** The signed-in employee's own activity feed. Reads through the user's relation, so nobody else's activity can appear. */
class ActivityController extends ApiController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, ['type' => ['sometimes', 'string', 'max:50', 'regex:/^[a-z_]+$/']], ['created_at']);

        $query = $request->user()->activityLogs()->getQuery()
            // `request` matches request_submitted, request_cancelled …; an exact type matches itself.
            ->when($input['type'] ?? null, fn (Builder $q, $v) => $q->where(fn (Builder $t) => $t->where('activity_type', $v)->orWhere('activity_type', 'like', $v.'_%')))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v));

        return $this->paginated($this->sorted($query, $request, ['created_at' => 'created_at'], 'created_at'), $request, ActivityResource::class);
    }
}
