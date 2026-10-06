<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Enums\ContentStatus;
use App\Http\Controllers\Api\ApiController;
use App\Models\CompanyHistoryEntry;
use App\Models\CompanyLocation;
use App\Models\CompanyPage;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\LeadershipProfile;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The company overview page (mission, vision, values…) and the HR dashboard counts. Real counts only. */
class AdminCompanyController extends ApiController
{
    public function dashboard(): JsonResponse
    {
        $published = ContentStatus::Published->value;

        return response()->json(['data' => [
            'directory' => [
                'total' => DirectoryEntry::count(),
                'visible' => DirectoryEntry::where('is_visible', true)->count(),
                'hidden' => DirectoryEntry::where('is_visible', false)->count(),
                'unlinked' => DirectoryEntry::whereNull('user_id')->count(),
            ],
            'departments' => ['total' => Department::count(), 'published' => Department::where('status', $published)->count()],
            'locations' => ['total' => CompanyLocation::count(), 'published' => CompanyLocation::where('status', $published)->count()],
            'company' => [
                'overview_published' => CompanyPage::where('page_key', CompanyPage::OVERVIEW)->where('status', $published)->exists(),
                'history_published' => CompanyHistoryEntry::where('status', $published)->count(),
                'leadership_published' => LeadershipProfile::where('status', $published)->count(),
                // Content waiting for someone with the publish permission (there is no separate review workflow).
                'drafts' => CompanyHistoryEntry::where('status', 'draft')->count() + LeadershipProfile::where('status', 'draft')->count() + CompanyLocation::where('status', 'draft')->count() + Department::where('status', 'draft')->count(),
            ],
        ]]);
    }

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->present(CompanyPage::overview())]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'display_name' => ['sometimes', 'nullable', 'string', 'max:160'],
            'introduction_title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'introduction' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'mission' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'vision' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'core_values' => ['sometimes', 'nullable', 'array', 'max:20'],
            'core_values.*.title' => ['required', 'string', 'max:120'],
            'core_values.*.description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
        ]);

        $page = CompanyPage::overview();
        $publish = $request->user()->hasPermission('hr.company.publish');
        $wasPublished = $page->status === ContentStatus::Published;
        // Without the publish permission a user may only work on a draft: not touch live content, not publish or archive.
        abort_if(! $publish && ($wasPublished || (isset($data['status']) && $data['status'] !== 'draft')), 403);

        $page->fill(array_intersect_key($data, array_flip(['display_name', 'introduction_title', 'introduction', 'mission', 'vision', 'core_values'])));
        if (isset($data['core_values'])) {
            $page->core_values = array_values(array_map(fn ($v) => ['title' => $v['title'], 'description' => $v['description'] ?? null], $data['core_values']));
        }
        if (isset($data['status'])) {
            $page->status = $data['status'];
            if ($data['status'] === 'published' && $page->published_at === null) {
                $page->published_at = now();
            }
        }
        $page->updated_by = $request->user()->getKey();
        $page->is_sample = false;
        $page->save();

        $action = (! $wasPublished && $page->status === ContentStatus::Published) ? 'COMPANY_OVERVIEW_PUBLISHED' : ($page->status === ContentStatus::Archived ? 'COMPANY_OVERVIEW_ARCHIVED' : 'COMPANY_OVERVIEW_UPDATED');
        Audit::record($request->user(), $action, 'hr', $page, 'Company overview', 'success', ['fields' => implode(',', array_keys($data))]);

        return response()->json(['data' => $this->present($page->refresh())]);
    }

    /** @return array<string, mixed> */
    private function present(CompanyPage $page): array
    {
        return [
            'display_name' => $page->display_name, 'introduction_title' => $page->introduction_title, 'introduction' => $page->introduction,
            'mission' => $page->mission, 'vision' => $page->vision, 'core_values' => $page->core_values ?? [],
            'status' => $page->status->value, 'published_at' => $page->published_at?->toIso8601String(), 'updated_at' => $page->updated_at?->toIso8601String(), 'is_sample' => $page->is_sample,
        ];
    }
}
