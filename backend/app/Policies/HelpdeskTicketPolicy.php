<?php

namespace App\Policies;

use App\Enums\TicketStatus;
use App\Models\HelpdeskTicket;
use App\Models\User;

/** Requesters see and reply to their own tickets; IT staff with `helpdesk.manage` can see and reply to all. */
class HelpdeskTicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('helpdesk.view');
    }

    public function view(User $user, HelpdeskTicket $ticket): bool
    {
        return ($ticket->user_id === $user->getKey() && $user->hasPermission('helpdesk.view')) || $user->hasPermission('helpdesk.manage');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('helpdesk.create');
    }

    /** Requesters may cancel their own ticket until it is resolved, closed or already cancelled. */
    public function cancel(User $user, HelpdeskTicket $ticket): bool
    {
        return $ticket->user_id === $user->getKey()
            && in_array($ticket->status, [TicketStatus::New, TicketStatus::Open, TicketStatus::Pending], true);
    }

    public function reply(User $user, HelpdeskTicket $ticket): bool
    {
        return $this->view($user, $ticket);
    }
}
