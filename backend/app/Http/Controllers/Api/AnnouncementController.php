<?php

namespace App\Http\Controllers\Api;

use App\Enums\AnnouncementCategory;
use App\Enums\AnnouncementPriority;
use App\Enums\ContentStatus;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Services\Audit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Employees only ever receive PUBLISHED announcements inside their publish/expiry window. People with an announcements
 * management permission can also see drafts and archived items (and filter by `status`). Writes are behind the
 * `announcements.*` permissions in routes/api.php and again in the Form Request.
 */
class AnnouncementController extends ApiController
{
    private const SORTS = ['published_at' => 'published_at', 'title' => 'title', 'priority' => 'priority'];

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', Rule::enum(AnnouncementCategory::class)],
            'priority' => ['sometimes', Rule::enum(AnnouncementPriority::class)],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'pinned' => ['sometimes', 'in:true,false,1,0'],
        ], array_keys(self::SORTS));

        $query = $this->scopeFor($request)->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($input['priority'] ?? null, fn (Builder $q, $v) => $q->where('priority', $v))
            ->when($this->manages($request) ? ($input['status'] ?? null) : null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($request->has('pinned'), fn (Builder $q) => $q->where('is_pinned', $request->boolean('pinned')))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('published_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('published_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['title', 'summary', 'content']);

        // Pinned announcements first, then the requested order.
        $query->orderByDesc('is_pinned');

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'published_at'), $request, AnnouncementResource::class);
    }

    public function show(Request $request, int $announcement): AnnouncementResource
    {
        return new AnnouncementResource($this->scopeFor($request)->findOrFail($announcement));
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $announcement = new Announcement($request->safe()->only(['title', 'summary', 'content', 'category', 'priority', 'is_pinned', 'expires_at']));
        $announcement->slug = $this->uniqueSlug($request->string('title')->toString());
        $announcement->status = $request->enum('status', ContentStatus::class) ?? ContentStatus::Draft;
        $announcement->published_at = $announcement->status === ContentStatus::Published ? ($request->date('published_at') ?? now()) : $request->date('published_at');
        $announcement->author_user_id = $request->user()->getKey();
        $announcement->save();
        Audit::record($request->user(), $announcement->status === ContentStatus::Published ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_CREATED', 'announcements', $announcement, $announcement->title);

        return $this->created(new AnnouncementResource($announcement->refresh()));
    }

    public function update(StoreAnnouncementRequest $request, int $announcement): AnnouncementResource
    {
        $model = Announcement::query()->findOrFail($announcement);
        $wasPublished = $model->status === ContentStatus::Published;
        $model->fill($request->safe()->only(['title', 'summary', 'content', 'category', 'priority', 'is_pinned', 'expires_at']));
        if ($request->has('status')) {
            $model->status = $request->enum('status', ContentStatus::class);
        }
        if ($request->has('published_at')) {
            $model->published_at = $request->date('published_at');
        } elseif ($model->status === ContentStatus::Published && $model->published_at === null) {
            $model->published_at = now();
        }
        $model->save();
        Audit::record($request->user(), (! $wasPublished && $model->status === ContentStatus::Published) ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_UPDATED', 'announcements', $model, $model->title, 'success', ['status' => $model->status->value]);

        return new AnnouncementResource($model);
    }

    public function destroy(Request $request, int $announcement): JsonResponse
    {
        $model = Announcement::query()->findOrFail($announcement);
        $model->delete(); // soft delete: can be restored
        Audit::record($request->user(), 'ANNOUNCEMENT_DELETED', 'announcements', $model, $model->title);

        return $this->noContent();
    }

    private function manages(Request $request): bool
    {
        $user = $request->user();

        return $user->hasPermission('announcements.manage') || $user->hasPermission('announcements.hr-manage');
    }

    /** Employees: visible only. Managers: everything that is not deleted. */
    private function scopeFor(Request $request): Builder
    {
        $query = Announcement::query();

        return $this->manages($request) ? $query : $query->visible();
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'announcement';
        $slug = $base;
        for ($i = 2; Announcement::withTrashed()->where('slug', $slug)->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }
}
