<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\DocumentCategoryResource;
use App\Http\Resources\DocumentResource;
use App\Models\ActivityLog;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Services\PortalEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Document METADATA. Every list, count and lookup goes through Document::accessibleTo(), the SQL twin of DocumentPolicy,
 * so a document the user may not open is never returned, counted or confirmed to exist (404, not 403). File storage does
 * not exist yet: download/view returns a placeholder instead of a file.
 */
class DocumentController extends ApiController
{
    private const SORTS = ['published_at' => 'published_at', 'title' => 'title', 'updated_at' => 'updated_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'category' => ['sometimes', 'string', 'max:80'],
            'department' => ['sometimes', 'string', 'max:80'],
            'file_type' => ['sometimes', 'string', 'max:10'],
        ], array_keys(self::SORTS));

        $query = Document::query()->accessibleTo($request->user())->with('category')
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->whereHas('category', fn (Builder $c) => $c->where('slug', $v)->orWhere('name', $v)))
            ->when($input['department'] ?? null, fn (Builder $q, $v) => $q->where('department', $v))
            ->when($input['file_type'] ?? null, fn (Builder $q, $v) => $q->where('file_type', strtoupper($v)))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('published_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('published_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['title', 'description', 'owner']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'published_at'), $request, DocumentResource::class);
    }

    public function show(Request $request, int $document): DocumentResource
    {
        $model = Document::query()->accessibleTo($request->user())->with('category')->findOrFail($document);
        $this->recordView($request, $model);

        return new DocumentResource($model);
    }

    /** Categories that contain at least one document the user can see. */
    public function categories(Request $request): AnonymousResourceCollection
    {
        $visible = Document::query()->accessibleTo($request->user())->select('document_category_id');

        return DocumentCategoryResource::collection(
            DocumentCategory::query()->whereIn('id', $visible)
                ->withCount(['documents as documents_count' => fn (Builder $q) => $q->accessibleTo($request->user())])
                ->orderBy('sort_order')->orderBy('name')->get(),
        );
    }

    public function recent(Request $request): AnonymousResourceCollection
    {
        $limit = min(20, max(1, (int) $request->query('limit', 5)));

        return DocumentResource::collection(
            Document::query()->accessibleTo($request->user())->with('category')->orderByDesc('published_at')->orderByDesc('id')->limit($limit)->get(),
        );
    }

    /** Ranked by how often portal users opened them (recorded as `document_viewed` activity). With no views yet, newest first. */
    public function popular(Request $request): AnonymousResourceCollection
    {
        $limit = min(20, max(1, (int) $request->query('limit', 5)));
        $views = ActivityLog::query()->where('activity_type', 'document_viewed')->where('entity_type', 'document')
            ->select('entity_id', DB::raw('count(*) as views'))->groupBy('entity_id');

        $documents = Document::query()->accessibleTo($request->user())->with('category')
            ->leftJoinSub($views, 'v', 'v.entity_id', '=', 'documents.id')->select('documents.*')
            ->orderByDesc(DB::raw('coalesce(v.views, 0)'))->orderByDesc('documents.published_at')->orderByDesc('documents.id')
            ->limit($limit)->get();

        return DocumentResource::collection($documents);
    }

    /** Placeholder until private file storage exists. Access is still checked, so the answer never reveals restricted documents. */
    public function download(Request $request, int $document): JsonResponse
    {
        $model = Document::query()->accessibleTo($request->user())->findOrFail($document);
        Gate::authorize('view', $model);

        return response()->json(['data' => ['document_id' => $model->id, 'available' => false, 'message' => 'File delivery is not enabled yet.']]);
    }

    /** At most one view entry per user, document and day, so the feed and the popularity ranking are not inflated. */
    private function recordView(Request $request, Document $document): void
    {
        $user = $request->user();
        $seen = $user->activityLogs()->where('activity_type', 'document_viewed')->where('entity_type', 'document')
            ->where('entity_id', $document->id)->where('created_at', '>=', now()->startOfDay())->exists();
        if (! $seen) {
            PortalEvents::activity($user, 'document_viewed', 'Viewed document: '.$document->title, 'document', $document->id);
        }
    }
}
