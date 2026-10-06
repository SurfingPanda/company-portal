<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContentStatus;
use App\Enums\EventVisibility;
use App\Models\Announcement;
use App\Models\Benefit;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\EmployeeForm;
use App\Models\RecruitmentJob;
use App\Models\Resource;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Portal-wide search with plain MySQL LIKE queries (no search engine). It searches only what the signed-in user may see:
 * the same visibility rules as each entity's own endpoint, and a type is skipped entirely when the user lacks its
 * `*.view` permission. Without `type` it returns the top few matches per type; with `type` it paginates that one type.
 */
class SearchController extends ApiController
{
    private const PREVIEW = 5;

    public function index(Request $request): JsonResponse
    {
        $types = array_keys($this->definitions($request));
        $input = $this->listInput($request, [
            'q' => ['required', 'string', 'min:2', 'max:100'],
            'type' => ['sometimes', Rule::in($types)],
        ]);

        $allowed = array_filter($this->definitions($request), fn (array $d) => $request->user()->hasPermission($d['permission']));
        $term = $input['q'];

        if (isset($input['type'])) {
            abort_unless(isset($allowed[$input['type']]), 403);
            $d = $allowed[$input['type']];
            $page = $this->searched($d['query'](), $term, $d['columns'])->orderBy($d['order'])->orderBy('id')->paginate($this->perPage($request))->withQueryString();

            return response()->json([
                'data' => $page->getCollection()->map(fn ($m) => $this->item($input['type'], $d, $m))->values(),
                'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total(), 'query' => $term],
            ]);
        }

        $results = [];
        $counts = [];
        foreach ($allowed as $type => $d) {
            $query = $this->searched($d['query'](), $term, $d['columns']);
            $counts[$type] = (clone $query)->count();
            foreach ($query->orderBy($d['order'])->orderBy('id')->limit(self::PREVIEW)->get() as $model) {
                $results[] = $this->item($type, $d, $model);
            }
        }

        return response()->json(['data' => $results, 'meta' => ['query' => $term, 'counts' => $counts]]);
    }

    /** @return array{type: string, id: int, title: string, summary: ?string, category: ?string} */
    private function item(string $type, array $d, $model): array
    {
        return [
            'type' => $type,
            'id' => $model->getKey(),
            'title' => (string) $model->{$d['title']},
            'summary' => $model->{$d['summary']} !== null ? mb_strimwidth(strip_tags((string) $model->{$d['summary']}), 0, 200, '…') : null,
            'category' => ($c = $model->{$d['category']}) instanceof \BackedEnum ? $c->value : $c,
            'key' => isset($d['key']) ? (string) $model->{$d['key']} : null,
        ];
    }

    /**
     * @return array<string, array{permission: string, query: Closure(): Builder, columns: list<string>, order: string, title: string, summary: string, category: string}>
     */
    private function definitions(Request $request): array
    {
        $user = $request->user();

        return [
            'announcements' => ['permission' => 'announcements.view', 'query' => fn () => Announcement::query()->visible(), 'columns' => ['title', 'summary', 'content'], 'order' => 'title', 'title' => 'title', 'summary' => 'summary', 'category' => 'category'],
            'documents' => ['permission' => 'documents.view', 'query' => fn () => Document::query()->accessibleTo($user), 'columns' => ['title', 'description'], 'order' => 'title', 'title' => 'title', 'summary' => 'description', 'category' => 'department'],
            'forms' => ['permission' => 'forms.view', 'query' => fn () => EmployeeForm::query()->where('status', ContentStatus::Published->value), 'columns' => ['title', 'description'], 'order' => 'title', 'title' => 'title', 'summary' => 'description', 'category' => 'category'],
            'benefits' => ['permission' => 'benefits.view', 'query' => fn () => Benefit::query(), 'columns' => ['name', 'short_description', 'description'], 'order' => 'name', 'title' => 'name', 'summary' => 'short_description', 'category' => 'category'],
            'resources' => ['permission' => 'resources.view', 'query' => fn () => Resource::query()->where('status', ContentStatus::Published->value), 'columns' => ['title', 'description'], 'order' => 'title', 'title' => 'title', 'summary' => 'description', 'category' => 'category'],
            'events' => ['permission' => 'calendar.view', 'query' => fn () => CalendarEvent::query()->where('visibility', EventVisibility::All->value), 'columns' => ['title', 'description', 'location'], 'order' => 'title', 'title' => 'title', 'summary' => 'description', 'category' => 'category'],
            // VISIBLE directory entries (business fields only; hidden entries never match).
            'directory' => ['permission' => 'directory.view', 'query' => fn () => \App\Models\DirectoryEntry::query()->visible(), 'columns' => ['display_name', 'job_title', 'company_email', 'employee_id'], 'order' => 'display_name', 'title' => 'display_name', 'summary' => 'job_title', 'category' => 'employee_id', 'key' => 'employee_id'],
            'jobs' => ['permission' => 'recruitment.view', 'query' => fn () => RecruitmentJob::query()->listed(), 'columns' => ['title', 'department', 'summary'], 'order' => 'title', 'title' => 'title', 'summary' => 'summary', 'category' => 'department'],
        ];
    }
}
