<?php

namespace App\Http\Controllers\Api;

use App\Enums\EventCategory;
use App\Enums\EventStatus;
use App\Enums\EventVisibility;
use App\Http\Requests\StoreCalendarEventRequest;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use App\Services\Audit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Company calendar. Employees see events open to everyone; department-only and private events need information the portal
 * does not hold (department / invitations), so they are not shown to ordinary employees. Calendar managers see all.
 * No recurrence engine: a recurring event is simply several events.
 */
class CalendarEventController extends ApiController
{
    private const SORTS = ['starts_at' => 'starts_at', 'title' => 'title'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', Rule::enum(EventCategory::class)],
            'status' => ['sometimes', Rule::enum(EventStatus::class)],
        ], array_keys(self::SORTS));

        $query = $this->scopeFor($request)
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            // An event is in range when it overlaps [from, to]: it starts before `to` ends and (ends after `from`, or starts after it).
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->where(fn (Builder $r) => $r->where('starts_at', '>=', $request->date('from')->startOfDay())->orWhere('ends_at', '>=', $request->date('from')->startOfDay())))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->where('starts_at', '<=', $request->date('to')->endOfDay()));
        $this->searched($query, $input['search'] ?? null, ['title', 'description', 'location']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'starts_at', 'asc'), $request, CalendarEventResource::class);
    }

    public function show(Request $request, int $event): CalendarEventResource
    {
        return new CalendarEventResource($this->scopeFor($request)->findOrFail($event));
    }

    public function store(StoreCalendarEventRequest $request): JsonResponse
    {
        $event = new CalendarEvent($request->safe()->only(['title', 'description', 'category', 'location', 'starts_at', 'ends_at', 'is_all_day']));
        $event->status = $request->enum('status', EventStatus::class) ?? EventStatus::Scheduled;
        $event->visibility = $request->enum('visibility', EventVisibility::class) ?? EventVisibility::All;
        $event->author_user_id = $request->user()->getKey();
        $event->save();
        Audit::record($request->user(), 'EVENT_CREATED', 'calendar', $event, $event->title);

        return $this->created(new CalendarEventResource($event->refresh()));
    }

    public function update(StoreCalendarEventRequest $request, int $event): CalendarEventResource
    {
        $model = CalendarEvent::query()->findOrFail($event);
        $model->fill($request->safe()->only(['title', 'description', 'category', 'location', 'starts_at', 'ends_at', 'is_all_day']));
        if ($request->has('status')) {
            $model->status = $request->enum('status', EventStatus::class);
        }
        if ($request->has('visibility')) {
            $model->visibility = $request->enum('visibility', EventVisibility::class);
        }
        $model->save();
        Audit::record($request->user(), 'EVENT_UPDATED', 'calendar', $model, $model->title, 'success', ['status' => $model->status->value]);

        return new CalendarEventResource($model);
    }

    public function destroy(Request $request, int $event): JsonResponse
    {
        $model = CalendarEvent::query()->findOrFail($event);
        $model->delete();
        Audit::record($request->user(), 'EVENT_DELETED', 'calendar', $model, $model->title);

        return $this->noContent();
    }

    private function scopeFor(Request $request): Builder
    {
        $query = CalendarEvent::query();

        return $request->user()->hasPermission('calendar.manage') ? $query : $query->where('visibility', EventVisibility::All->value);
    }
}
