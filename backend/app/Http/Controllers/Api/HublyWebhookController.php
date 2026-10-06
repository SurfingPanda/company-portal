<?php

namespace App\Http\Controllers\Api;

use App\Models\HelpdeskTicket;
use App\Services\Hubly;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Receives signed events from Hubly (see App\Services\Hubly and HUBLY_INTEGRATION.md). Not a user endpoint: no session, only the signature. */
class HublyWebhookController extends ApiController
{
    public function receive(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['status_changed', 'note_added', 'assigned', 'ticket_updated'])],
            'ticket_number' => ['required', 'string', 'max:30'],
            'external_id' => ['nullable', 'string', 'max:60'],
            'status' => ['nullable', 'string', Rule::in(array_keys(config('hubly.status_map')))],
            'status_label' => ['nullable', 'string', 'max:40'],
            'note' => ['nullable', 'string', 'max:5000'],
            'visibility' => ['nullable', Rule::in(['public', 'internal'])],
            'author_name' => ['nullable', 'string', 'max:120'],
            'assignee_name' => ['nullable', 'string', 'max:120'],
        ]);

        $ticket = HelpdeskTicket::query()->where('ticket_number', $data['ticket_number'])->first();
        if ($ticket === null) {
            return response()->json(['message' => 'Unknown ticket.'], 404);
        }

        return response()->json(Hubly::applyEvent($ticket, $data));
    }

    /** How the link is doing, for IT staff: whether it is on, what is waiting to be delivered, and the last problem. */
    public function status(): JsonResponse
    {
        return response()->json(['data' => Hubly::status()]);
    }

    /** Try the waiting deliveries now, and give the ones that gave up another chance. */
    public function retry(): JsonResponse
    {
        \Illuminate\Support\Facades\DB::table('hubly_outbox')->whereNull('sent_at')->whereNull('next_attempt_at')->update(['next_attempt_at' => now(), 'attempts' => 0]);
        $sent = Hubly::enabled() ? Hubly::deliverDue() : 0;

        return response()->json(['data' => Hubly::status() + ['delivered' => $sent]]);
    }
}
