<?php

namespace App\Services;

use App\Models\ApprovalFallback;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\EmployeeRequest;
use App\Models\RequestApprovalRoute;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Portal approval routing. Who reviews a request from a person, in order:
 *   1. an explicit HR route for (their department, this request type), else one for (their department, every type): the
 *      exception to the normal rule, for example "all leave of Finance goes to HR";
 *   2. their MANAGER, taken from the employee record (`manager_id`): the first person up the reporting chain who can act, so a
 *      manager who is on leave or has no manager role is skipped and the request goes to their own manager;
 *   3. else the head of their department (chosen by HR);
 *   4. else the company-wide FALLBACK approver chosen by HR: the primary, or the secondary when the primary cannot act or is the
 *      requester.
 * An approver can act only if their employee record is linked to an ACTIVE portal account that holds `requests.team-review`
 * (the manager role), and never on their own request. A requester with no employee record goes straight to the fallback.
 * Routing decides WHO may review; it never grants a permission.
 *
 * Everything funnels through resolve(), so approverFor() (one request) and scopeFor() (a list of requests) cannot disagree.
 * One instance keeps what it has read for as long as it lives; the container hands out a fresh one on every app() call.
 */
final class ApprovalRouting
{
    /** Longest reporting chain followed, a guard against bad data. */
    private const MAX_CHAIN = 25;

    /** @var array<int, DirectoryEntry|null> keyed by portal user id */
    private array $entryByUser = [];

    /** @var array<int, DirectoryEntry|null> keyed by directory entry id */
    private array $entryById = [];

    /** @var array<int, bool> */
    private array $eligible = [];

    /** @var array<int, array{general: ?int, hasGeneral: bool, specific: array<int, ?int>}>|null */
    private ?array $routes = null;

    /** @var array<int, ?int>|null department id => eligible head user id */
    private ?array $heads = null;

    /** @var list<int>|null */
    private ?array $fallback = null;

    /** The portal user who should review this request, or null when nobody configured can act. */
    public function approverFor(EmployeeRequest $request): ?User
    {
        $id = $this->resolve((int) $request->user_id, $request->request_type_id === null ? null : (int) $request->request_type_id)[0];

        return $id === null ? null : User::query()->find($id);
    }

    /**
     * Where a person's requests go and why, for the admin screens: `via` is route, manager, head, fallback or none.
     *
     * @return array{approver: ?User, via: string}
     */
    public function explain(User $requester, ?int $requestTypeId = null): array
    {
        [$id, $via] = $this->resolve((int) $requester->getKey(), $requestTypeId);

        return ['approver' => $id === null ? null : User::query()->find($id), 'via' => $via];
    }

    public function isApproverOf(User $user, EmployeeRequest $request): bool
    {
        return $user->hasPermission('requests.team-review') && $this->approverFor($request)?->is($user) === true;
    }

    /** Restrict a request query to the requests routed to `$approver` (no rows when they approve nothing). */
    public function scopeFor(Builder $query, User $approver): Builder
    {
        if (! $this->canAct($approver)) {
            return $query->whereRaw('1 = 0');
        }

        // Routing depends only on (requester, request type), so resolve each distinct pair once and filter on the result.
        $pairs = EmployeeRequest::query()->select('user_id', 'request_type_id')->distinct()->get();
        $this->warm($pairs->pluck('user_id')->unique()->all());

        $mine = [];
        $others = [];
        foreach ($pairs as $pair) {
            $target = $this->resolve((int) $pair->user_id, $pair->request_type_id === null ? null : (int) $pair->request_type_id)[0];
            if ($target === $approver->getKey()) {
                $mine[$pair->user_id][] = $pair->request_type_id;
            } else {
                $others[$pair->user_id] = true;
            }
        }
        if ($mine === []) {
            return $query->whereRaw('1 = 0');
        }

        $whole = array_keys(array_diff_key($mine, $others));
        $partial = array_diff_key($mine, array_flip($whole));

        return $query->where(function (Builder $outer) use ($whole, $partial) {
            if ($whole !== []) {
                $outer->orWhereIn('user_id', $whole);
            }
            foreach ($partial as $userId => $typeIds) {
                $outer->orWhere(fn (Builder $q) => $q->where('user_id', $userId)->whereIn('request_type_id', array_filter($typeIds, fn ($t) => $t !== null))
                    ->when(in_array(null, $typeIds, true), fn (Builder $x) => $x->orWhereNull('request_type_id')));
            }
        });
    }

    /**
     * @return array{0: ?int, 1: string} the approver's user id (or null) and how they were chosen
     */
    private function resolve(int $requesterId, ?int $typeId): array
    {
        $entry = $this->entryForUser($requesterId);
        $departmentId = $entry?->department_id;

        // 1. An explicit HR route for the department.
        if ($departmentId !== null && ($route = $this->routes()[$departmentId] ?? null) !== null) {
            $routed = ($typeId !== null && array_key_exists($typeId, $route['specific'])) ? $route['specific'][$typeId] : $route['general'];
            if ($routed !== null && $routed !== $requesterId) {
                return [$routed, 'route'];
            }
        }

        // 2. The first person up the reporting chain who can act.
        $seen = [];
        $cursor = $entry;
        for ($hops = 0; $cursor !== null && $cursor->manager_id !== null && $hops < self::MAX_CHAIN; $hops++) {
            if (isset($seen[$cursor->manager_id])) {
                break;
            }
            $seen[$cursor->manager_id] = true;
            $cursor = $this->entryForId((int) $cursor->manager_id);
            $managerUserId = $cursor?->user_id;
            if ($managerUserId !== null && $managerUserId !== $requesterId && $this->isEligible((int) $managerUserId)) {
                return [(int) $managerUserId, 'manager'];
            }
        }

        // 3. The department head.
        if ($departmentId !== null) {
            $head = $this->heads()[$departmentId] ?? null;
            if ($head !== null && $head !== $requesterId) {
                return [$head, 'head'];
            }
        }

        // 4. The company-wide fallback.
        foreach ($this->fallback() as $fallbackId) {
            if ($fallbackId !== $requesterId) {
                return [$fallbackId, 'fallback'];
            }
        }

        return [null, 'none'];
    }

    // --- What routing reads: loaded lazily, remembered for the life of this instance ---------------------------------------

    private function entryForUser(int $userId): ?DirectoryEntry
    {
        if (! array_key_exists($userId, $this->entryByUser)) {
            $entry = DirectoryEntry::query()->where('user_id', $userId)->first();
            $this->entryByUser[$userId] = $entry;
            if ($entry !== null) {
                $this->entryById[$entry->getKey()] = $entry;
            }
        }

        return $this->entryByUser[$userId];
    }

    private function entryForId(int $id): ?DirectoryEntry
    {
        if (! array_key_exists($id, $this->entryById)) {
            $entry = DirectoryEntry::query()->find($id);
            $this->entryById[$id] = $entry;
            if ($entry?->user_id !== null) {
                $this->entryByUser[$entry->user_id] = $entry;
            }
        }

        return $this->entryById[$id];
    }

    /** Load, in bulk, everything resolve() will need for these requesters, so a long list does not query per person. */
    private function warm(array $userIds): void
    {
        $missing = array_values(array_diff($userIds, array_keys($this->entryByUser)));
        foreach (array_chunk($missing, 500) as $chunk) {
            $found = DirectoryEntry::query()->whereIn('user_id', $chunk)->get();
            foreach ($found as $entry) {
                $this->entryByUser[$entry->user_id] = $entry;
                $this->entryById[$entry->getKey()] = $entry;
            }
            foreach (array_diff($chunk, $found->pluck('user_id')->all()) as $none) {
                $this->entryByUser[$none] = null;
            }
        }
        // Walk up the reporting chains one level at a time.
        for ($level = 0; $level < self::MAX_CHAIN; $level++) {
            $need = collect($this->entryById)->filter()->pluck('manager_id')->filter()->unique()->reject(fn ($id) => array_key_exists($id, $this->entryById))->values()->all();
            if ($need === []) {
                break;
            }
            $found = DirectoryEntry::query()->whereIn('id', $need)->get();
            foreach ($found as $entry) {
                $this->entryById[$entry->getKey()] = $entry;
                if ($entry->user_id !== null) {
                    $this->entryByUser[$entry->user_id] = $entry;
                }
            }
            foreach (array_diff($need, $found->pluck('id')->all()) as $gone) {
                $this->entryById[$gone] = null;
            }
        }
        // Who among them can act.
        $candidates = collect($this->entryById)->filter()->pluck('user_id')->filter()->unique()->reject(fn ($id) => array_key_exists($id, $this->eligible))->values()->all();
        foreach (array_chunk($candidates, 500) as $chunk) {
            foreach (User::query()->with('roles')->whereIn('id', $chunk)->get() as $user) {
                $this->eligible[$user->getKey()] = $this->canAct($user);
            }
            foreach (array_diff($chunk, array_keys($this->eligible)) as $none) {
                $this->eligible[$none] = false;
            }
        }
    }

    private function isEligible(int $userId): bool
    {
        if (! array_key_exists($userId, $this->eligible)) {
            $user = User::query()->with('roles')->find($userId);
            $this->eligible[$userId] = $user !== null && $this->canAct($user);
        }

        return $this->eligible[$userId];
    }

    /**
     * Explicit HR routes per department: the eligible user (or null) for the "every type" route and for each type-specific route.
     * A configured-but-ineligible approver gives null, which lets routing carry on to the manager.
     *
     * @return array<int, array{general: ?int, hasGeneral: bool, specific: array<int, ?int>}>
     */
    private function routes(): array
    {
        if ($this->routes === null) {
            $this->routes = [];
            foreach (RequestApprovalRoute::query()->where('is_active', true)->with('approver.user')->get()->groupBy('department_id') as $departmentId => $deptRoutes) {
                $general = $deptRoutes->firstWhere('request_type_id', null);
                $specific = [];
                foreach ($deptRoutes->whereNotNull('request_type_id') as $route) {
                    $specific[$route->request_type_id] = $this->eligibleId($route->approver?->user);
                }
                $this->routes[$departmentId] = ['general' => $this->eligibleId($general?->approver?->user), 'hasGeneral' => $general !== null, 'specific' => $specific];
            }
        }

        return $this->routes;
    }

    /** @return array<int, ?int> */
    private function heads(): array
    {
        if ($this->heads === null) {
            $this->heads = [];
            foreach (Department::query()->whereNotNull('head_directory_entry_id')->with('headEntry.user')->get() as $department) {
                $this->heads[$department->getKey()] = $this->eligibleId($department->headEntry?->user);
            }
        }

        return $this->heads;
    }

    /** @return list<int> eligible fallback approver user ids, primary first */
    private function fallback(): array
    {
        if ($this->fallback === null) {
            $this->fallback = [];
            foreach (ApprovalFallback::query()->orderBy('priority')->with('approver.user')->get() as $fallback) {
                $id = $this->eligibleId($fallback->approver?->user);
                if ($id !== null) {
                    $this->fallback[] = $id;
                }
            }
        }

        return $this->fallback;
    }

    private function eligibleId(?User $user): ?int
    {
        if ($user === null) {
            return null;
        }

        return ($this->eligible[$user->getKey()] ??= $this->canAct($user)) ? $user->getKey() : null;
    }

    private function canAct(User $user): bool
    {
        return $user->hasPermission('requests.team-review');
    }
}
