<?php

namespace App\Policies;

use App\Enums\RequestCategory;
use App\Enums\RequestStatus;
use App\Models\EmployeeRequest;
use App\Models\User;

/**
 * Employees see only their own requests. HR may review HR-type requests (`requests.hr-review`); `requests.manage` covers
 * all (administrators). Team access (`requests.team-view`) is deliberately not granted yet: it needs the department-head
 * reporting line, which does not exist here.
 */
class EmployeeRequestPolicy
{
    private const HR_CATEGORIES = [RequestCategory::Hr, RequestCategory::Benefits, RequestCategory::Recruitment];

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('requests.view-own');
    }

    public function view(User $user, EmployeeRequest $request): bool
    {
        if ($request->user_id === $user->getKey()) {
            return $user->hasPermission('requests.view-own');
        }

        return $user->hasPermission('requests.manage')
            || ($user->hasPermission('requests.hr-review') && in_array($request->requestType?->category, self::HR_CATEGORIES, true))
            || ($user->hasPermission('requests.it-review') && $request->requestType?->category === RequestCategory::It)
            || app(\App\Services\ApprovalRouting::class)->isApproverOf($user, $request);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('requests.submit');
    }

    /** Staff may change the status of requests they are allowed to see (HR for HR-type requests, administrators for all). Owners never do. */
    public function review(User $user, EmployeeRequest $request): bool
    {
        if ($request->user_id === $user->getKey() && ! $user->hasPermission('requests.manage')) {
            return false;
        }

        return $user->hasPermission('requests.manage')
            || ($user->hasPermission('requests.hr-review') && in_array($request->requestType?->category, self::HR_CATEGORIES, true))
            || ($user->hasPermission('requests.it-review') && $request->requestType?->category === RequestCategory::It && $request->user_id !== $user->getKey())
            // HR-designated approver (department routing) who also holds the manager permission; never on their own request.
            || app(\App\Services\ApprovalRouting::class)->isApproverOf($user, $request);
    }

    /** Owners may edit only their own drafts. */
    public function update(User $user, EmployeeRequest $request): bool
    {
        return $request->user_id === $user->getKey() && $request->status === RequestStatus::Draft && $user->hasPermission('requests.submit');
    }

    /** Owners may add or remove attachments until the request reaches a final state. */
    public function attach(User $user, EmployeeRequest $request): bool
    {
        return $request->user_id === $user->getKey()
            && in_array($request->status, [RequestStatus::Draft, RequestStatus::Submitted, RequestStatus::UnderReview], true);
    }

    /** Owners may cancel their own request until it is completed or already cancelled. */
    public function cancel(User $user, EmployeeRequest $request): bool
    {
        return $request->user_id === $user->getKey() && ! in_array($request->status, [RequestStatus::Completed, RequestStatus::Cancelled], true);
    }
}
