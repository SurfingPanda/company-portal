<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\DirectoryResource;
use App\Enums\EmploymentStatus;
use App\Models\CompanyLocation;
use App\Models\Department;
use App\Models\DirectoryEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * The employee directory: VISIBLE entries only (HR hides an entry by switching `is_visible` off, which never affects the
 * employee's account). Business information only, see DirectoryResource. Hidden entries answer 404 exactly like unknown ones.
 */
class DirectoryController extends ApiController
{
    private const SORTS = ['name' => 'display_name', 'position' => 'job_title'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'department' => ['sometimes', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:160'],
            'status' => ['sometimes', Rule::in(EmploymentStatus::values())],
            'sortBy' => ['sometimes', 'in:name,department,position'],
            'sortDir' => ['sometimes', 'in:asc,desc'],
        ]);

        $query = DirectoryEntry::query()->visible()->with('department', 'location')
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('employment_status', $v))
            ->when($input['department'] ?? null, fn (Builder $q, $v) => $q->whereHas('department', fn (Builder $d) => $d->where('name', $v)))
            ->when($input['location'] ?? null, fn (Builder $q, $v) => $q->whereHas('location', fn (Builder $l) => $l->where('name', $v)));

        $term = trim((string) ($input['search'] ?? ''));
        if ($term !== '') {
            $like = '%'.strtr($term, ['!' => '!!', '%' => '!%', '_' => '!_']).'%';
            $query->where(function (Builder $q) use ($term, $like) {
                $this->searched($q, $term, ['display_name', 'employee_id', 'job_title', 'company_email']);
                $q->orWhereHas('department', fn (Builder $d) => $d->whereRaw("name like ? escape '!'", [$like]));
            });
        }

        $direction = ($input['sortDir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $sortBy = $input['sortBy'] ?? 'name';
        if ($sortBy === 'department') {
            $query->orderBy(Department::query()->select('name')->whereColumn('departments.id', 'directory_entries.department_id'), $direction);
        } else {
            $query->orderBy(self::SORTS[$sortBy], $direction);
        }
        $query->orderBy('display_name')->orderBy('id');

        return DirectoryResource::collection($query->paginate($this->perPage($request))->withQueryString());
    }

    public function show(string $employeeId): DirectoryResource
    {
        return new DirectoryResource(DirectoryEntry::query()->visible()->with('department', 'location')->where('employee_id', $employeeId)->firstOrFail());
    }

    /**
     * The reporting structure for the organization chart: every employee shown in the directory who has not left, with the person
     * they report to. A manager who is hidden or inactive is skipped (the line goes to the nearest person who is shown), a
     * reporting loop in the data is cut, and nothing beyond the directory's own business information is returned.
     */
    public function organization(): JsonResponse
    {
        $limit = 2000;
        $shown = DirectoryEntry::query()->visible()->where('employment_status', '!=', EmploymentStatus::Inactive->value)->with('department')
            ->orderBy('display_name')->orderBy('id')->limit($limit + 1)->get();
        $truncated = $shown->count() > $limit;
        $shown = $shown->take($limit);

        $parentOf = DirectoryEntry::query()->whereNotNull('manager_id')->pluck('manager_id', 'id');
        $isShown = $shown->pluck('id')->flip();
        $nearest = function (int $id) use ($parentOf, $isShown): ?int {
            $cursor = $parentOf[$id] ?? null;
            for ($hops = 0; $cursor !== null && $hops < 50; $hops++) {
                if ($cursor === $id) {
                    return null;
                }
                if (isset($isShown[$cursor])) {
                    return $cursor;
                }
                $cursor = $parentOf[$cursor] ?? null;
            }

            return null;
        };

        $parents = [];
        foreach ($shown as $entry) {
            $parents[$entry->id] = $nearest($entry->id);
        }
        // Cut loops among the people who are shown: whoever closes a loop becomes a top-level person.
        foreach ($parents as $id => $parent) {
            $seen = [$id => true];
            for ($cursor = $parent, $hops = 0; $cursor !== null && $hops < 100; $hops++) {
                if (isset($seen[$cursor])) {
                    $parents[$id] = null;
                    break;
                }
                $seen[$cursor] = true;
                $cursor = $parents[$cursor] ?? null;
            }
        }

        $employeeIds = $shown->pluck('employee_id', 'id');

        return response()->json([
            'data' => $shown->map(fn (DirectoryEntry $e) => [
                'employee_id' => $e->employee_id, 'display_name' => $e->display_name, 'job_title' => $e->job_title, 'department' => $e->department?->name,
                'manager_employee_id' => $parents[$e->id] !== null ? $employeeIds[$parents[$e->id]] : null,
            ])->values(),
            'meta' => ['total' => $shown->count(), 'truncated' => $truncated],
        ]);
    }

    /** Filter choices (published departments and locations) with how many VISIBLE entries each holds. */
    public function filters(): JsonResponse
    {
        $count = fn (string $column, int $id) => DirectoryEntry::query()->visible()->where($column, $id)->count();

        return response()->json(['data' => [
            'departments' => Department::query()->published()->get()->map(fn (Department $d) => ['name' => $d->name, 'count' => $count('department_id', $d->id)])->values(),
            'locations' => CompanyLocation::query()->published()->get()->map(fn (CompanyLocation $l) => ['name' => $l->name, 'count' => $count('location_id', $l->id)])->values(),
        ]]);
    }
}
