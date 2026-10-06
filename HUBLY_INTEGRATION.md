# Hubly integration (IT helpdesk)

Employees create helpdesk tickets in the portal. Each ticket is sent to **Hubly**, where IT works it. **Hubly is the master**: status changes and public notes made in Hubly come back to the portal, and the employee is notified (in the portal and by email, following their notification settings). Portal staff can no longer edit tickets while the link is on (they answer 409 "handled in Hubly"); the employee can still reply and cancel, and both are forwarded to Hubly.

Both directions are authenticated with one shared secret (`HUBLY_SECRET`, 32+ characters, set on both sides, never sent over the wire). Every call carries a timestamp and `HMAC-SHA256(secret, timestamp + "." + raw_body)` as lowercase hex. The receiver rejects a missing, wrong or stale (older than 5 minutes) signature.

## Portal settings (`backend/.env`)

```
HUBLY_ENABLED=true
HUBLY_URL=https://hubly.eljincorp.com/backend/api/integrations/portal   # the Hubly endpoint below
HUBLY_SECRET=<64 hex characters, the same value Hubly holds>
```
The scheduler must run (`php artisan schedule:work` locally, or the `schedule:run` cron every minute) so the retry command `portal:sync-hubly` works. While `HUBLY_ENABLED=false` nothing is sent, nothing is accepted, and the portal helpdesk behaves as before.

## Portal -> Hubly  (Hubly must implement this endpoint)

`POST {HUBLY_URL}` with JSON, headers `X-Portal-Timestamp` (unix seconds), `X-Portal-Signature` (hex HMAC), `X-Portal-Event`, `Idempotency-Key` (the same key is re-sent on a retry: create the work order once per key). Answer 2xx; any other answer is retried after 1, 2, 4, 8... minutes (max 1 hour apart, 10 attempts, then an IT user can press "Try again now" on the ticket page).

`ticket.created` (also contains `ticket_number`, e.g. `INC-00012`, which Hubly must store and send back):
```json
{ "event": "ticket.created", "ticket_number": "INC-00012", "external_id": null, "sent_at": "2026-10-20T08:15:00+00:00",
  "ticket": { "subject": "...", "description": "...", "category": "hardware", "type": "incident", "priority": "high",
              "location": null, "device": null, "operating_system": null, "asset_tag": null, "created_at": "..." },
  "requester": { "employee_id": "EMP-0007", "name": "Maria Santos", "email": "maria@...", "department": "Sales", "job_title": "..." } }
```
Respond with the new work order number: `{ "external_id": "WO00000042" }` (the portal shows it and sends it on later events).

`ticket.reply` (employee wrote again): `{ "event": "ticket.reply", "ticket_number": "...", "external_id": "...", "reply": { "message": "...", "author": "EMP-0007", "created_at": "..." } }` -> add as a requester note.

`ticket.cancelled`: `{ "event": "ticket.cancelled", "ticket_number": "...", "external_id": "..." }` -> cancel the work order.

Suggested mapping: portal `priority` low/normal/high/urgent equals Hubly's; `category` + `type` become Hubly category / request type; match the requester by email.

## Hubly -> Portal  (implemented in the portal)

`POST https://<portal>/api/integrations/hubly/events`, headers `X-Hubly-Timestamp`, `X-Hubly-Signature`, JSON body. Send one event per change, with a **unique `event_id`** (for example `ticket_activity.id`); a repeated `event_id` is ignored, so retrying is safe. Answers: 200 `{applied, duplicate}`, 401 bad/stale signature, 404 unknown ticket or link off, 422 invalid body.

| field | meaning |
| --- | --- |
| `event_id` (required) | unique id, max 100 chars |
| `type` (required) | `status_changed`, `note_added`, `assigned`, `ticket_updated` |
| `ticket_number` (required) | the portal number sent in `ticket.created` |
| `external_id` | the Hubly work order number |
| `status` | `open`, `in_progress`, `on_hold`, `pending`, `resolved`, `closed`, `cancelled` |
| `status_label` | Hubly's wording shown to the employee, e.g. `In progress` |
| `note` + `visibility` | `public` is shown to the employee and notifies them; **`internal` is never copied** |
| `author_name` | technician name shown on the note |
| `assignee_name` | who is handling it (shown as "Handled by") |

Status mapping in the portal: `open`, `in_progress` -> Open; `on_hold`, `pending` -> Pending; `resolved` -> Resolved; `closed` -> Closed; `cancelled` -> Cancelled (`config/hubly.php`).

Hubly-side sketch (Laravel, raw query builder as Hubly does): in the code that writes a `ticket_activity` row of type `change` (status/assignee) or `note`, call a small `PortalSync::send($ticket, $payload)` that signs `time().".".$json` with `PORTAL_SECRET` and POSTs it, fire-and-forget (catch and log, like `Audit`), ideally from a queue/cron so a portal outage cannot slow IT down. Only tickets that arrived from the portal (those holding a portal `ticket_number`) are synced.
