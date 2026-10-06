<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\TicketStatus;
use App\Models\HelpdeskTicket;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The link to Hubly (IT ticketing). Outbound: tickets and the requester's replies are queued in `hubly_outbox` and delivered with
 * a signed HTTPS call, retried with a growing delay, so a Hubly outage never loses a ticket. Inbound: see `applyEvent()`.
 * Hubly is the master of a ticket's status, owner and notes; the portal only mirrors them and tells the requester.
 */
final class Hubly
{
    public static function enabled(): bool
    {
        return config('hubly.enabled') && filled(config('hubly.url')) && strlen((string) config('hubly.secret')) >= 32;
    }

    /** HMAC-SHA256 of "timestamp.body" with the shared secret. */
    public static function sign(string $timestamp, string $body): string
    {
        return hash_hmac('sha256', $timestamp.'.'.$body, (string) config('hubly.secret'));
    }

    // --- Outbound ---------------------------------------------------------------------------------------------------------

    /** Queue an event for Hubly and try to deliver it after the response has been sent. */
    public static function queue(HelpdeskTicket $ticket, string $event, array $extra = []): void
    {
        if (! self::enabled()) {
            return;
        }
        $row = DB::table('hubly_outbox')->insertGetId([
            'helpdesk_ticket_id' => $ticket->getKey(), 'event' => $event, 'payload' => json_encode($extra), 'next_attempt_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        dispatch(fn () => self::deliver($row))->afterResponse();
    }

    /** @return array<string, mixed> */
    private static function body(HelpdeskTicket $ticket, string $event, array $extra): array
    {
        $ticket->loadMissing('user.directoryEntry.department');
        $entry = $ticket->user?->directoryEntry;
        $body = [
            'event' => $event,
            'ticket_number' => $ticket->ticket_number,
            'external_id' => $ticket->external_id,
            'sent_at' => now()->toIso8601String(),
        ];
        if ($event === 'ticket.created') {
            $body['ticket'] = [
                'subject' => $ticket->subject, 'description' => $ticket->description, 'category' => $ticket->category, 'type' => $ticket->type,
                'priority' => $ticket->priority->value, 'location' => $ticket->location, 'device' => $ticket->device,
                'operating_system' => $ticket->operating_system, 'asset_tag' => $ticket->asset_tag, 'created_at' => $ticket->created_at?->toIso8601String(),
            ];
            $body['requester'] = [
                'employee_id' => $ticket->user?->employee_id, 'name' => $entry?->display_name, 'email' => $ticket->user?->email,
                'department' => $entry?->department?->name, 'job_title' => $entry?->job_title,
            ];
        }

        return $body + $extra;
    }

    /** Send one queued call. Returns true when Hubly accepted it. Never throws. */
    public static function deliver(int $outboxId): bool
    {
        $row = DB::table('hubly_outbox')->where('id', $outboxId)->whereNull('sent_at')->first();
        $ticket = $row ? HelpdeskTicket::query()->find($row->helpdesk_ticket_id) : null;
        if ($row === null || $ticket === null || ! self::enabled()) {
            return false;
        }
        $attempts = $row->attempts + 1;
        try {
            $json = json_encode(self::body($ticket, $row->event, json_decode($row->payload, true) ?: []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $timestamp = (string) time();
            $response = Http::withHeaders([
                'X-Portal-Timestamp' => $timestamp, 'X-Portal-Signature' => self::sign($timestamp, $json),
                'X-Portal-Event' => $row->event, 'Idempotency-Key' => 'outbox-'.$row->id, 'Accept' => 'application/json',
            ])->timeout((int) config('hubly.timeout'))->withBody($json, 'application/json')->post((string) config('hubly.url'));

            if (! $response->successful()) {
                throw new \RuntimeException('Hubly answered HTTP '.$response->status());
            }
            $externalId = $response->json('external_id') ?? $response->json('id') ?? $response->json('data.external_id');
            if ($row->event === 'ticket.created' && $externalId !== null && $ticket->external_id === null) {
                $ticket->forceFill(['external_id' => substr((string) $externalId, 0, 60)])->save();
            }
            DB::table('hubly_outbox')->where('id', $row->id)->update(['sent_at' => now(), 'attempts' => $attempts, 'last_error' => null, 'updated_at' => now()]);

            return true;
        } catch (\Throwable $e) {
            // Wait 1, 2, 4, 8… minutes (at most one hour) before the next try; give up for good after max_attempts.
            $next = $attempts >= (int) config('hubly.max_attempts') ? null : now()->addMinutes(min(60, 2 ** ($attempts - 1)));
            DB::table('hubly_outbox')->where('id', $row->id)->update(['attempts' => $attempts, 'last_error' => substr($e->getMessage(), 0, 250), 'next_attempt_at' => $next, 'updated_at' => now()]);
            Log::warning('Hubly delivery failed', ['outbox' => $row->id, 'attempt' => $attempts, 'error' => $e->getMessage()]);

            return false;
        }
    }

    /** Deliver everything that is due (the scheduled command). @return int how many were delivered */
    public static function deliverDue(): int
    {
        $sent = 0;
        foreach (DB::table('hubly_outbox')->whereNull('sent_at')->whereNotNull('next_attempt_at')->where('next_attempt_at', '<=', now())->orderBy('id')->limit(50)->pluck('id') as $id) {
            $sent += self::deliver($id) ? 1 : 0;
        }

        return $sent;
    }

    /** @return array{enabled: bool, waiting: int, failed: int, last_sent_at: ?string, last_error: ?string} */
    public static function status(): array
    {
        $open = DB::table('hubly_outbox')->whereNull('sent_at');

        return [
            'enabled' => self::enabled(),
            'waiting' => (clone $open)->whereNotNull('next_attempt_at')->count(),
            'failed' => (clone $open)->whereNull('next_attempt_at')->count(),
            'last_sent_at' => DB::table('hubly_outbox')->whereNotNull('sent_at')->max('sent_at'),
            'last_error' => (clone $open)->whereNotNull('last_error')->latest('updated_at')->value('last_error'),
        ];
    }

    // --- Inbound ----------------------------------------------------------------------------------------------------------

    /**
     * Apply one signed event from Hubly to the portal ticket and tell the requester. Idempotent by `event_id`.
     *
     * @param  array{event_id: string, type: string, status?: ?string, status_label?: ?string, note?: ?string, visibility?: ?string, author_name?: ?string, assignee_name?: ?string, external_id?: ?string}  $event
     * @return array{applied: bool, duplicate: bool}
     */
    public static function applyEvent(HelpdeskTicket $ticket, array $event): array
    {
        return DB::transaction(function () use ($ticket, $event) {
            $seen = DB::table('hubly_events')->insertOrIgnore(['event_id' => $event['event_id'], 'helpdesk_ticket_id' => $ticket->getKey(), 'type' => $event['type'], 'created_at' => now(), 'updated_at' => now()]);
            if ($seen === 0) {
                return ['applied' => false, 'duplicate' => true];
            }
            $ticket->loadMissing('user');
            $link = '/helpdesk/tickets/'.$ticket->ticket_number;
            $changed = false;

            if (! empty($event['external_id']) && $ticket->external_id !== $event['external_id']) {
                $ticket->external_id = substr($event['external_id'], 0, 60);
                $changed = true;
            }
            if (array_key_exists('assignee_name', $event) && $ticket->external_assignee !== ($event['assignee_name'] ?: null)) {
                $ticket->external_assignee = $event['assignee_name'] ?: null;
                $changed = true;
            }
            if (! empty($event['status'])) {
                $mapped = config('hubly.status_map')[$event['status']] ?? null;
                if ($mapped !== null) {
                    $status = TicketStatus::from($mapped);
                    $label = $event['status_label'] ?? ucfirst(str_replace('_', ' ', $event['status']));
                    $moved = $ticket->status !== $status || $ticket->external_status !== $label;
                    $ticket->status = $status;
                    $ticket->external_status = $label;
                    $ticket->resolved_at = in_array($status, [TicketStatus::Resolved, TicketStatus::Closed], true) ? ($ticket->resolved_at ?? now()) : null;
                    $ticket->closed_at = $status === TicketStatus::Closed ? ($ticket->closed_at ?? now()) : null;
                    $changed = true;
                    if ($moved) {
                        PortalEvents::notify($ticket->user, NotificationType::It, 'Ticket update', "Ticket {$ticket->ticket_number} is now {$label}.", $link);
                    }
                }
            }
            // Only public notes reach the employee: an internal note in Hubly is never copied here.
            if (! empty($event['note']) && ($event['visibility'] ?? 'public') === 'public') {
                $reply = $ticket->replies()->make(['message' => $event['note']]);
                $reply->forceFill(['helpdesk_ticket_id' => $ticket->getKey(), 'user_id' => null, 'source' => 'hubly', 'author_name' => $event['author_name'] ?? null])->save();
                $changed = true;
                PortalEvents::notify($ticket->user, NotificationType::It, 'New note on your ticket', "IT support added a note to {$ticket->ticket_number}.", $link);
            }
            if ($changed) {
                $ticket->save();
                $ticket->touch();
            }

            return ['applied' => true, 'duplicate' => false];
        });
    }
}
