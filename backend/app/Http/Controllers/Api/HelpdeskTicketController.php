<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationType;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Requests\CreateHelpdeskReplyRequest;
use App\Http\Requests\CreateHelpdeskTicketRequest;
use App\Http\Requests\UploadAttachmentRequest;
use App\Http\Resources\HelpdeskTicketResource;
use App\Http\Resources\RequestAttachmentResource;
use App\Models\HelpdeskTicket;
use App\Services\AttachmentStorage;
use App\Services\PortalEvents;
use App\Services\ReferenceNumbers;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * IT helpdesk tickets. Employees see only their own; IT staff (`helpdesk.manage`) can also list all with `scope=all`.
 * A ticket that is not yours is a 404. No SLA, CMDB, chat, escalation or realtime: tickets, replies and attachments only.
 */
class HelpdeskTicketController extends ApiController
{
    private const SORTS = ['created_at' => 'created_at', 'updated_at' => 'updated_at', 'priority' => 'priority', 'status' => 'status'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'status' => ['sometimes', Rule::enum(TicketStatus::class)],
            'priority' => ['sometimes', Rule::enum(TicketPriority::class)],
            'category' => ['sometimes', Rule::in(CreateHelpdeskTicketRequest::CATEGORIES)],
            'scope' => ['sometimes', Rule::in(['own', 'all'])],
            'assigned' => ['sometimes', Rule::in(['me', 'unassigned'])],
        ], array_keys(self::SORTS));

        if (($input['scope'] ?? 'own') === 'all') {
            abort_unless($request->user()->hasPermission('helpdesk.manage'), 403);
            $query = HelpdeskTicket::query()->with('user', 'assignee');
        } else {
            $query = $request->user()->helpdeskTickets()->getQuery();
        }
        // Staff queues (only meaningful with scope=all): my tickets, or tickets nobody has taken yet.
        $query->when(($input['scope'] ?? 'own') === 'all' && ($input['assigned'] ?? null) === 'me', fn (Builder $q) => $q->where('assigned_to', $request->user()->getKey()))
            ->when(($input['scope'] ?? 'own') === 'all' && ($input['assigned'] ?? null) === 'unassigned', fn (Builder $q) => $q->whereNull('assigned_to'))
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($input['priority'] ?? null, fn (Builder $q, $v) => $q->where('priority', $v))
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->where('category', $v))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['ticket_number', 'subject', 'description']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'updated_at'), $request, HelpdeskTicketResource::class);
    }

    public function show(Request $request, int $ticket): HelpdeskTicketResource
    {
        return new HelpdeskTicketResource($this->find($ticket)->load('user', 'assignee', 'replies', 'attachments'));
    }

    public function store(CreateHelpdeskTicketRequest $request): JsonResponse
    {
        $user = $request->user();

        $ticket = ReferenceNumbers::create('helpdesk_tickets', 'ticket_number', 'INC', 5, function (string $number) use ($user, $request) {
            $ticket = $user->helpdeskTickets()->make($request->safe()->only(['category', 'type', 'subject', 'description', 'location', 'device', 'operating_system', 'asset_tag']));
            $ticket->priority = $request->enum('priority', TicketPriority::class) ?? TicketPriority::Normal;
            $ticket->ticket_number = $number;
            $ticket->status = TicketStatus::New;
            $ticket->save();

            PortalEvents::activity($user, 'ticket_created', "Created ticket {$number}", 'helpdesk_ticket', $ticket->getKey());
            // The IT team is told so someone can take ownership (they see it under Administration -> Helpdesk).
            foreach (\App\Models\User::query()->holdingPermission('helpdesk.manage')->whereKeyNot($user->getKey())->get() as $staff) {
                PortalEvents::notify($staff, NotificationType::It, 'New helpdesk ticket', "Ticket {$number} is waiting for an owner.", '/admin/helpdesk/tickets/'.$ticket->getKey());
            }
            PortalEvents::notify($user, NotificationType::It, 'Ticket received', "Your ticket {$number} was received by IT support.", '/helpdesk/tickets/'.$number);

            return $ticket;
        });

        return $this->created(new HelpdeskTicketResource($ticket->load('replies', 'attachments')));
    }

    public function reply(CreateHelpdeskReplyRequest $request, int $ticket): JsonResponse
    {
        $model = $this->find($ticket);
        Gate::authorize('reply', $model);
        abort_if(in_array($model->status, [TicketStatus::Closed, TicketStatus::Cancelled], true), 409);

        DB::transaction(function () use ($model, $request) {
            $reply = $model->replies()->make(['message' => $request->validated('message')]);
            $reply->forceFill(['helpdesk_ticket_id' => $model->getKey(), 'user_id' => $request->user()->getKey()])->save();
            $model->touch();

            PortalEvents::activity($request->user(), 'ticket_replied', "Replied on ticket {$model->ticket_number}", 'helpdesk_ticket', $model->getKey());
            // When support answers, the requester is told; an employee's own reply needs no notification to themselves.
            if ($model->user_id !== $request->user()->getKey()) {
                PortalEvents::notify($model->user, NotificationType::It, 'New reply on your ticket', "IT support replied to {$model->ticket_number}.", '/helpdesk/tickets/'.$model->ticket_number);
            }
        });

        return $this->created(new HelpdeskTicketResource($model->load('replies', 'attachments')));
    }

    public function attach(UploadAttachmentRequest $request, int $ticket): JsonResponse
    {
        $model = $this->find($ticket);
        Gate::authorize('reply', $model);
        abort_if(in_array($model->status, [TicketStatus::Closed, TicketStatus::Cancelled], true), 409);

        $stored = AttachmentStorage::store($request->file('file'), 'attachments/helpdesk/'.$model->getKey());
        try {
            $attachment = $model->attachments()->make(['original_filename' => $stored['original_filename'], 'mime_type' => $stored['mime_type'], 'file_size' => $stored['file_size']]);
            $attachment->forceFill(['storage_path' => $stored['storage_path'], 'disk' => $stored['disk'], 'uploaded_by' => $request->user()->getKey()])->save();
        } catch (\Throwable $e) {
            AttachmentStorage::delete($stored['disk'], $stored['storage_path']);
            throw $e;
        }

        return $this->created(new RequestAttachmentResource($attachment));
    }

    /**
     * Staff handling of a ticket (`helpdesk.manage`): status, priority and assignee. Everything else about the ticket stays as
     * the requester wrote it. The assignee must be a portal user who can handle tickets; moves are audited.
     */
    public function staffUpdate(Request $request, int $ticket): HelpdeskTicketResource
    {
        $model = HelpdeskTicket::query()->with('user', 'assignee')->findOrFail($ticket);
        $data = $request->validate([
            'status' => ['sometimes', Rule::enum(TicketStatus::class)],
            'priority' => ['sometimes', Rule::enum(TicketPriority::class)],
            'assigned_to' => ['sometimes', 'nullable', 'string', 'max:32', Rule::exists('users', 'employee_id')],
        ]);

        $assignee = null;
        if (! empty($data['assigned_to'])) {
            $assignee = \App\Models\User::query()->where('employee_id', $data['assigned_to'])->firstOrFail();
            if (! $assignee->hasPermission('helpdesk.manage')) {
                throw \Illuminate\Validation\ValidationException::withMessages(['assigned_to' => ['This user cannot handle helpdesk tickets.']]);
            }
        }

        DB::transaction(function () use ($model, $data, $assignee, $request) {
            $details = [];
            if (array_key_exists('assigned_to', $data) && $model->assigned_to !== $assignee?->getKey()) {
                $model->assigned_to = $assignee?->getKey();
                $details['assigned_to'] = $assignee?->employee_id;
                \App\Services\Audit::record($request->user(), 'HELPDESK_TICKET_ASSIGNED', 'helpdesk', $model, $model->ticket_number, 'success', ['assigned_to' => $assignee?->employee_id]);
            }
            if (isset($data['priority']) && $model->priority->value !== $data['priority']) {
                $details['priority'] = $data['priority'];
                $model->priority = $data['priority'];
            }
            if (isset($data['status']) && $model->status->value !== $data['status']) {
                $status = TicketStatus::from($data['status']);
                $details['status'] = $status->value;
                $model->status = $status;
                $model->resolved_at = in_array($status, [TicketStatus::Resolved, TicketStatus::Closed], true) ? ($model->resolved_at ?? now()) : null;
                $model->closed_at = $status === TicketStatus::Closed ? now() : null;
                PortalEvents::notify($model->user, NotificationType::It, 'Ticket update', "Ticket {$model->ticket_number} is now {$status->value}.", '/helpdesk/tickets/'.$model->ticket_number);
            }
            $model->save();
            if (array_diff_key($details, ['assigned_to' => 1]) !== []) {
                \App\Services\Audit::record($request->user(), 'HELPDESK_TICKET_UPDATED', 'helpdesk', $model, $model->ticket_number, 'success', array_diff_key($details, ['assigned_to' => 1]));
            }
        });

        return new HelpdeskTicketResource($model->refresh()->load('user', 'assignee', 'replies', 'attachments'));
    }

    /**
     * "Take ownership": assign an unassigned ticket to the signed-in IT staff member (a new ticket becomes open). A ticket someone
     * else already owns answers 409: reassigning is a deliberate action through the update endpoint, never an accident.
     */
    public function claim(Request $request, int $ticket): HelpdeskTicketResource
    {
        $model = HelpdeskTicket::query()->with('user', 'assignee')->findOrFail($ticket);
        $me = $request->user();
        abort_if($model->assigned_to !== null && $model->assigned_to !== $me->getKey(), 409);
        abort_if(in_array($model->status, [TicketStatus::Closed, TicketStatus::Cancelled], true), 409);

        if ($model->assigned_to === null) {
            DB::transaction(function () use ($model, $me) {
                $model->assigned_to = $me->getKey();
                if ($model->status === TicketStatus::New) {
                    $model->status = TicketStatus::Open;
                    PortalEvents::notify($model->user, NotificationType::It, 'Ticket update', "Ticket {$model->ticket_number} is now open: IT support has taken it.", '/helpdesk/tickets/'.$model->ticket_number);
                }
                $model->save();
                \App\Services\Audit::record($me, 'HELPDESK_TICKET_ASSIGNED', 'helpdesk', $model, $model->ticket_number, 'success', ['assigned_to' => $me->employee_id, 'via' => 'claim']);
            });
        }

        return new HelpdeskTicketResource($model->refresh()->load('user', 'assignee', 'replies', 'attachments'));
    }

    public function cancel(Request $request, int $ticket): HelpdeskTicketResource
    {
        $model = $this->find($ticket);
        Gate::authorize('cancel', $model);

        DB::transaction(function () use ($model, $request) {
            $model->status = TicketStatus::Cancelled;
            $model->save();
            PortalEvents::activity($request->user(), 'ticket_cancelled', "Cancelled ticket {$model->ticket_number}", 'helpdesk_ticket', $model->getKey());
        });

        return new HelpdeskTicketResource($model->load('replies', 'attachments'));
    }

    /** 404 when it does not exist or the user may not view it. */
    private function find(int $id): HelpdeskTicket
    {
        $ticket = HelpdeskTicket::query()->findOrFail($id);
        $this->mustView($ticket);

        return $ticket;
    }
}
