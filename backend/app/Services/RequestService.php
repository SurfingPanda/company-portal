<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use App\Models\EmployeeRequest;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creating and moving employee requests. Everything that must succeed together (request, history entry, activity entry,
 * notification) happens in one transaction, and the reference number and status are decided here, never by the client.
 * This is not an approval engine: it records who moved a request to which status, nothing more.
 */
final class RequestService
{
    /** @param  array<string, mixed>  $data  validated input */
    public function create(User $user, RequestType $type, array $data, bool $draft): EmployeeRequest
    {
        return ReferenceNumbers::create('employee_requests', 'reference_number', $type->reference_prefix ?: 'REQ', 4, function (string $reference) use ($user, $type, $data, $draft) {
            $request = $user->requests()->make([
                'request_type_id' => $type->getKey(),
                'subject' => $data['subject'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? RequestPriority::Normal->value,
                'form_data' => RequestFormData::only($type, $data['form_data'] ?? null),
            ]);
            $request->reference_number = $reference; // not mass-assignable on purpose
            $request->status = RequestStatus::Draft;
            $request->save();

            $request->history()->forceCreate(['status' => RequestStatus::Draft->value, 'comment' => 'Request created.', 'user_id' => $user->getKey()]);
            PortalEvents::activity($user, 'request_drafted', "Saved a draft of {$request->reference_number}", 'request', $request->getKey());

            if (! $draft) {
                $this->submit($user, $request);
            }

            return $request;
        });
    }

    /** Draft -> submitted. */
    public function submit(User $user, EmployeeRequest $request): EmployeeRequest
    {
        DB::transaction(function () use ($user, $request) {
            $request->changeStatus(RequestStatus::Submitted, $user, 'Request submitted.');
            PortalEvents::activity($user, 'request_submitted', "Submitted request {$request->reference_number}", 'request', $request->getKey());
            // Tell the department approver chosen by HR (if any): they can review it under Administration -> Requests.
            if ($approver = app(ApprovalRouting::class)->approverFor($request)) {
                PortalEvents::notify($approver, NotificationType::Request, 'Request to review', "Request {$request->reference_number} was routed to you.", '/admin/requests/'.$request->getKey());
            }
            // IT-type requests: IT is told right away when no approval is needed (or no approver exists); otherwise after approval.
            if ($request->requestType?->category === \App\Enums\RequestCategory::It && (! $request->requestType->requires_approval || app(ApprovalRouting::class)->approverFor($request) === null)) {
                $this->notifyIt($request, 'New IT request', "Request {$request->reference_number} is waiting in the IT queue.");
            }
            PortalEvents::notify($user, NotificationType::Request, 'Request submitted', "Your request {$request->reference_number} was submitted.", '/requests/'.$request->reference_number);
        });

        return $request;
    }

    public function cancel(User $user, EmployeeRequest $request): EmployeeRequest
    {
        DB::transaction(function () use ($user, $request) {
            $request->changeStatus(RequestStatus::Cancelled, $user, 'Cancelled by the requester.');
            PortalEvents::activity($user, 'request_cancelled', "Cancelled request {$request->reference_number}", 'request', $request->getKey());
        });

        return $request;
    }

    /**
     * The only moves staff may make (the backend, not the client, decides). Drafts, finished and cancelled requests cannot be
     * reviewed. Deliberately a small table, not a workflow engine.
     */
    private const STAFF_TRANSITIONS = [
        'submitted' => ['under-review', 'approved', 'rejected', 'completed'],
        'under-review' => ['approved', 'rejected', 'completed'],
        'approved' => ['completed'],
    ];

    /**
     * Whether `$actor` may move `$request` to `$to`, or the sentence explaining why not (null = allowed).
     *   - administrators and HR (for HR-type requests): any move the transition table allows;
     *   - a routed department approver: under-review, approved, rejected (never completed);
     *   - IT staff on IT-type requests: any move, EXCEPT that when the type needs approval and an approver exists, IT leaves the
     *     decision to the approver: IT can mark it under review, and complete it only once it is approved.
     */
    public function moveError(User $actor, EmployeeRequest $request, RequestStatus $to): ?string
    {
        if ($actor->hasPermission('requests.manage')) {
            return null;
        }
        $category = $request->requestType?->category;
        if ($actor->hasPermission('requests.hr-review') && in_array($category, [\App\Enums\RequestCategory::Hr, \App\Enums\RequestCategory::Benefits, \App\Enums\RequestCategory::Recruitment], true)) {
            return null;
        }

        $routing = app(ApprovalRouting::class);
        $allowed = [];
        if ($routing->isApproverOf($actor, $request)) {
            array_push($allowed, 'under-review', 'approved', 'rejected');
        }
        if ($actor->hasPermission('requests.it-review') && $category === \App\Enums\RequestCategory::It && $request->user_id !== $actor->getKey()) {
            $decidedByApprover = $request->requestType?->requires_approval && $routing->approverFor($request) !== null;
            if (! $decidedByApprover) {
                array_push($allowed, 'under-review', 'approved', 'rejected', 'completed');
            } else {
                $allowed[] = 'under-review';
                if ($request->status === RequestStatus::Approved) {
                    $allowed[] = 'completed';
                }
            }
        }

        if (in_array($to->value, $allowed, true)) {
            return null;
        }

        return $allowed === [] ? 'You cannot change the status of this request.'
            : ($to === RequestStatus::Completed ? 'This request cannot be completed yet: it needs the approver\'s decision first, or only HR or an administrator completes it.' : 'The department approver decides this request.');
    }

    /** Tell everyone who reviews IT requests (IT staff) about a request, except the requester. */
    private function notifyIt(EmployeeRequest $request, string $title, string $message): void
    {
        foreach (User::query()->holdingPermission('requests.it-review')->whereKeyNot($request->user_id)->get() as $staff) {
            PortalEvents::notify($staff, NotificationType::It, $title, $message, '/admin/requests/'.$request->getKey());
        }
    }

    /** Staff status change. Notifies the requester; an internal comment is stored but never shown to them. */
    public function review(User $reviewer, EmployeeRequest $request, RequestStatus $status, ?string $comment, bool $internal): EmployeeRequest
    {
        abort_unless(in_array($status->value, self::STAFF_TRANSITIONS[$request->status->value] ?? [], true), 409);

        DB::transaction(function () use ($reviewer, $request, $status, $comment, $internal) {
            // The status change itself is always visible to the requester; an internal comment is a separate, staff-only entry.
            $request->changeStatus($status, $reviewer, $internal ? null : $comment);
            if ($internal && $comment !== null) {
                $request->history()->forceCreate(['status' => $status->value, 'comment' => $comment, 'user_id' => $reviewer->getKey(), 'is_internal' => true]);
            }
            Audit::record($reviewer, 'REQUEST_STATUS_CHANGED', 'requests', $request, $request->reference_number, 'success', ['status' => $status->value, 'internal_note' => $internal]);
            if ($status === RequestStatus::Approved && $request->requestType?->category === \App\Enums\RequestCategory::It) {
                $this->notifyIt($request, 'Approved IT request', "Request {$request->reference_number} was approved and is ready to fulfil.");
            }
            $owner = $request->user;
            PortalEvents::activity($owner, 'request_status_changed', "Request {$request->reference_number} is now {$status->value}", 'request', $request->getKey());
            PortalEvents::notify($owner, NotificationType::Request, 'Request update', "Request {$request->reference_number} is now {$status->value}.", '/requests/'.$request->reference_number);
        });

        return $request;
    }
}
