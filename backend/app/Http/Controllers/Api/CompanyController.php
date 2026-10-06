<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContentStatus;
use App\Models\CompanyHistoryEntry;
use App\Models\CompanyLocation;
use App\Models\CompanyPage;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\LeadershipProfile;
use Illuminate\Http\JsonResponse;

/**
 * Company information for employees. Only PUBLISHED content is returned; drafts and archived items do not exist as far as
 * these endpoints are concerned. Nothing is invented: an unpublished overview is returned as `null`.
 */
class CompanyController extends ApiController
{
    public function overview(): JsonResponse
    {
        $page = CompanyPage::query()->where('page_key', CompanyPage::OVERVIEW)->where('status', ContentStatus::Published->value)->first();

        return response()->json(['data' => $page === null ? null : [
            'display_name' => $page->display_name, 'introduction_title' => $page->introduction_title, 'introduction' => $page->introduction,
            'mission' => $page->mission, 'vision' => $page->vision, 'core_values' => $page->core_values ?? [], 'is_sample' => $page->is_sample,
        ]]);
    }

    public function history(): JsonResponse
    {
        return response()->json(['data' => CompanyHistoryEntry::query()->published()->get()->map(fn ($h) => ['id' => $h->id, 'year' => $h->year, 'title' => $h->title, 'description' => $h->description, 'is_sample' => $h->is_sample])->values()]);
    }

    public function leadership(): JsonResponse
    {
        return response()->json(['data' => LeadershipProfile::query()->published()->get()->map(fn ($l) => ['id' => $l->id, 'name' => $l->name, 'title' => $l->title, 'area' => $l->area, 'biography' => $l->biography, 'is_sample' => $l->is_sample])->values()]);
    }

    public function departments(): JsonResponse
    {
        return response()->json(['data' => Department::query()->published()->with('headEntry')->get()->map(fn ($d) => [
            'id' => $d->id, 'code' => $d->code, 'name' => $d->name, 'description' => $d->description, 'contact_email' => $d->contact_email, 'head' => $d->headEntry?->display_name ?? $d->head_display,
            // Counts only entries employees can see, so a count never reveals hidden people.
            'employee_count' => DirectoryEntry::query()->visible()->where('department_id', $d->id)->count(), 'is_sample' => $d->is_sample,
        ])->values()]);
    }

    public function locations(): JsonResponse
    {
        return response()->json(['data' => CompanyLocation::query()->published()->get()->map(fn ($l) => [
            'id' => $l->id, 'name' => $l->name, 'address' => $l->address, 'phone' => $l->phone, 'email' => $l->email, 'description' => $l->description, 'operating_info' => $l->operating_info, 'is_sample' => $l->is_sample,
        ])->values()]);
    }
}
