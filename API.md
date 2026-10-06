# API Guide

How the React portal talks to the Laravel backend. The Laravel backend foundation (schema, models, policies, seeders, tests) lives in `backend/` and is described in `DATABASE.md`; API
routes and controllers are not built yet. This document is the contract the backend must implement, plus the frontend
architecture that consumes it. No secrets are documented here.

```
Employee browser  ->  React portal  ->  Laravel API  ->  MySQL (portal data)
```

React never talks to MySQL. There is no external HR system: HR enters employee records directly in the portal
(directory entries), and Laravel is the only source of employee data.

## Frontend architecture

```
Page / component
   ↓
Feature service        src/services/<feature>Service.ts      (the only thing UI code imports)
   ↓
Mock adapter  OR  API adapter     src/services/adapters/<feature>.mock.ts | <feature>.api.ts
   ↓                    ↓
src/data (dev only)   src/services/api.ts  ->  Laravel
```

| File | Role |
| --- | --- |
| `src/services/api.ts` | The one HTTP client: `api.get/post/put/patch/delete/upload`, credentials, Sanctum CSRF, JSON, timeout, safe errors, 401/403 hooks. Pages never call `fetch`. |
| `src/services/dataMode.ts` | `DATA_MODE` (`mock` or `api`). **Production is always `api`.** |
| `src/types/api.ts` | `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `ValidationErrors`, `ListParams`. |
| `src/lib/apiErrors.ts` | `getApiErrorMessage`, `getFieldErrors` (maps 422 to `{ field: "message" }`), `isValidationError`. |
| `src/auth/ApiAuthHandlers.tsx` | Connects 401 and 403 responses to the app. |
| `src/services/authService.ts` | Authentication (see `AUTHENTICATION.md`). |

### Modes

| Variable | Values | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | URL or empty | e.g. `http://localhost:8000` for local development only. Empty = same origin. Never hard-code it elsewhere. |
| `VITE_AUTH_MODE` | `mock` / `api` | Authentication source. Production is always `api`. |
| `VITE_DATA_MODE` | `mock` / `api` | Feature data source. Production is always `api`. |

The dev-only panel (bottom right) shows `auth: … · data: …` so mock and API are always distinguishable.
**If an API-mode call fails, the UI shows its normal error/retry state. It never silently falls back to mock data and
never shows a success message for a failed request.** Mock mode may simulate success; that is development behaviour only.

### Migration status (one module at a time)

| Feature | Status |
| --- | --- |
| Authentication (`/api/auth/*`) | API-ready (Phase 22) |
| Notifications and activity | **Migrated to the adapter pattern** (`notificationService`): mock in dev, `/api/notifications` and `/api/activity` in API mode |
| Announcements, calendar, documents, forms and request types, requests (incl. cancel, attachments), HR leave (via requests), helpdesk tickets (reply, cancel, attachments), benefits, recruitment (jobs, applications, referrals), resources, profile, portal preferences, global search | **Migrated (Phase 27)**: each service switches between `adapters/<feature>.api.ts` and the sample data by data mode |
| Directory, company pages, service catalog, helpdesk knowledge base, dashboard shortcuts | Still sample data in every mode (no backend endpoint yet); clearly labelled sample in the UI |

## Conventions

- **Base path:** `/api/` (unversioned). The portal is a single first-party SPA that ships together with its API, so `/api/v1/` adds no value today. If a second client ever appears, introduce `/api/v1/` then.
- **Naming:** REST, plural nouns, Laravel style (`GET /api/documents`, `GET /api/documents/{id}`, `POST /api/requests`, `PATCH /api/notifications/{id}/read`).
- **Authentication:** Laravel session cookie via Sanctum SPA flow: `GET /sanctum/csrf-cookie`, then `POST /api/auth/login`. Cookies are sent with `credentials: include`; the XSRF token is echoed in `X-XSRF-TOKEN`.
- **Success body:** API Resources: `{ "data": T, "message"?: string }`. Lists use `{ "data": T[] }` or the Laravel paginator below.
- **Pagination:** `?page=1&per_page=20` returns `{ data: T[], current_page, last_page, per_page, total }`. Never return unbounded lists.
- **Filters** (only where meaningful): `search`, `category`, `department`, `status`, `date_from`, `date_to`, `sort`, `page`, `per_page`.
- **Sorting:** `sort` is a **whitelisted key** (`newest`, `oldest`, `name`, `updated`) that the backend maps to a known column. Never put the value into SQL.
- **Field names:** the Laravel API (Phase 26) uses **snake_case** (`employee_id`, `read_at`, `document_id`). The frontend adapters in `src/services/adapters/` map them to the camelCase types in `src/types/*`, so page components never see the wire format.

### Errors

The frontend maps status codes to its own safe wording and ignores the body, except `errors` on 422:

| Status | Frontend behaviour |
| --- | --- |
| `401` | Session ended: auth state is cleared and the employee is returned to `/login?returnUrl=<page>` (once; never for `/api/auth/*`). |
| `403` | Signed in but not allowed: opens `/unauthorized`. **Not** signed out. |
| `404` | "We could not find what you were looking for." |
| `419` | CSRF expired: fetches a fresh cookie and retries once. |
| `422` | `error.errors` is available. `getFieldErrors(error)` maps it to field messages. |
| `429` | "Too many requests. Please wait a moment and try again." |
| `5xx` / `503` | Generic "something went wrong" / "temporarily unavailable". |
| network / timeout | "Unable to reach the server" / "took too long" (15 s timeout). |

Laravel 422 body the client understands:

```json
{ "message": "The given data was invalid.", "errors": { "reason": ["The reason field is required."] } }
```

Production Laravel must run with `APP_DEBUG=false` so exceptions never leak stack traces, SQL or paths.

## Authorization and privacy (backend requirements)

The frontend's roles and permissions (Phase 23) only shape the UI. **Laravel must authorize every request.**

- Authenticated routes use `auth:sanctum`; sensitive ones also use a Policy/Gate or permission middleware.
- **Prevent IDOR.** Never `Model::findOrFail($id)` and return it. Scope to the current user (`$request->user()->requests()->findOrFail($id)`) or authorise with a Policy (`$this->authorize('view', $model)`). Applies to requests, applications, referrals, helpdesk tickets, benefits requests, notifications, profiles and documents.
- Employees receive only **their own** requests, applications, tickets and notifications. Broader access (team, HR) requires an explicit permission such as `requests.team-view` or `requests.hr-review`.
- **Documents** honour access levels (`all`, `department`, `manager`, `restricted`); do not serve a restricted document because its id is known. Authorize file downloads too.
- **Directory API** (`/api/directory`, `/api/directory/{employeeId}`) returns approved business fields only: name, job title, department, company email, office location, employee ID where appropriate, work contact. Never personal email/mobile, salary, government IDs, bank, medical, performance or disciplinary data.
- Use API Resources (`app/Http/Resources`) so models are never exposed directly. Protect against mass assignment (`$fillable`).
- Never trust ids or a user id from the client; derive the user from the session.
- Do not log passwords, session secrets, tokens or unnecessary employee data.

### CORS / Sanctum (when frontend and backend are on different origins)

- `config/cors.php`: `paths` include `api/*` and `sanctum/csrf-cookie`; `allowed_origins` is the exact frontend origin (never `*` with credentials); `supports_credentials => true`.
- Backend `.env`: `SANCTUM_STATEFUL_DOMAINS` lists the frontend host (with port), `SESSION_DOMAIN` is set for cookie sharing, and cookie `secure`/`same_site` suit your HTTPS setup.
- Keep CSRF and CORS protections on. Prefer same-site deployment (or the Vite dev proxy).

## Endpoints

Legend: **Used** = the frontend already calls it (API mode). **Contract** = the frontend is ready; build it when the module is migrated.

### Auth: Used (see `AUTHENTICATION.md`)

```
GET  /sanctum/csrf-cookie
POST /api/auth/login        { identifier, password, remember }  -> { user }
GET  /api/auth/me                                              -> { user }   (401 when signed out)
POST /api/auth/logout
```

`user` is the existing `AuthenticatedUser` including `roles` (and ideally `permissions`).

### Notifications and activity: Used

```
GET   /api/notifications            -> { data, meta }                 own notifications only
POST  /api/notifications/{id}/read                                     own only; 404 otherwise
POST  /api/notifications/read-all
GET   /api/activity?per_page=N      -> { data: EmployeeActivity[] }   own only
```

In API mode the **server creates** notifications and activity when it processes an action; the browser never does.

### Contract (not yet called by the frontend)

| Area | Endpoints |
| --- | --- |
| Dashboard | `GET /api/dashboard` (optional aggregate: user, announcements, events, requests, activity, documents, resources, notifications) |
| Profile | `GET /api/profile`, `PUT /api/profile` (preferred name, personal email, mobile only), `POST/DELETE /api/profile/avatar` |
| Directory | `GET /api/directory`, `GET /api/directory/{employeeId}` |
| Documents | `GET /api/documents`, `/{id}`, `/categories`, `/recent`, `/popular` |
| Announcements | `GET /api/announcements`, `/{id}` (filters: category, priority, pinned, date, status) |
| Calendar | `GET /api/events`, `/{id}` (filters: date_from/date_to, category, department, status) |
| Forms and requests | `GET /api/forms`, `/{id}`; `GET/POST /api/requests`, `GET/PATCH /api/requests/{id}`; `POST /api/requests/{id}/attachments` |
| HR | `GET /api/hr/services`, `GET/POST /api/hr/requests` (requests only; no payroll, attendance or leave-balance logic) |
| Benefits | `GET /api/benefits`, `/{id}`, `/faq`, `/resources`; `POST /api/benefits/requests` |
| Recruitment | `GET /api/jobs`, `/{id}`; `GET/POST /api/applications`, `GET /api/applications/{id}`; `POST /api/referrals` |
| Helpdesk | `GET/POST /api/helpdesk/tickets`, `GET /api/helpdesk/tickets/{id}`, `POST .../{id}/replies`, `GET /api/helpdesk/knowledge-base`, `GET /api/helpdesk/services` |
| Resources | `GET /api/resources`, `/{id}`, `/categories`, `/featured`, `/faq` |
| Search | `GET /api/search?q=` (authorised, safe directory fields only; no external search engine) |

### File uploads (preparation)

The client has `api.upload(path, FormData)` for `POST /api/<resource>/{id}/attachments`. The backend must validate type (allow-list, no executables), size and **ownership**, store files on a **non-public disk**, and serve downloads through an authorised route. No storage platform is built.

## Laravel structure to create (when the backend starts)

```
app/Http/Controllers/Api/     AuthController, DashboardController, DocumentController, AnnouncementController, EventController,
                              RequestController, NotificationController …   (only the ones a migrated module needs)
app/Http/Requests/            StoreRequestRequest, UpdateProfileRequest, CreateHelpdeskTicketRequest …  (Form Request validation)
app/Http/Resources/           UserResource, DocumentResource, AnnouncementResource, EventResource, RequestResource, NotificationResource
app/Models/                   User, Role/Permission (or the package already in use), Document, Announcement, Event, EmployeeRequest, Notification …
app/Policies/                 one per model that holds private data
routes/api.php                group: auth:sanctum + permission middleware; throttle on login, search, requests, helpdesk, uploads
database/migrations/          only tables actually needed; users link to their HR employee record via employee_id (the directory entry holds the employee facts)
```

- Use Laravel's built-in rate limiting (`throttle:`) for login, search, requests, helpdesk and uploads.
- Wrap multi-record actions in `DB::transaction` (e.g. create request + attachment metadata + activity + notification) so a failure leaves nothing half-written.
- Write the activity entry and notification on the server whenever an important action completes (request submitted/status changed, ticket created, application submitted, announcement published). Real-time delivery (WebSockets) is out of scope.
- Add Laravel feature tests for authorization (own vs other employee's resource returns 403/404) and validation (422 shape).

## Adding the next module (recipe)

1. Create `src/services/adapters/<feature>.api.ts` using `api.get/post/…` and the types in `src/types`.
2. Move the current mock logic into `<feature>.mock.ts`.
3. In `<feature>Service.ts`, export the functions through `isApiMode ? apiAdapter : mockAdapter` (see `notificationService.ts`).
4. On write forms, catch `ApiRequestError` and use `getFieldErrors(error)` for field messages and `getApiErrorMessage(error)` for the general message. Show success only after the request resolves.
5. Update the migration table above.


---

# Laravel REST API reference (Phase 26)

Implemented in `backend/` (`routes/api.php`, `app/Http/Controllers/Api`, `Requests`, `Resources`, `Policies`). 90 backend tests cover it (`php artisan test`).

## Conventions

- **Auth:** Sanctum SPA session cookie. `GET /sanctum/csrf-cookie`, then `POST /api/auth/login`. Every route except login needs it (**401** when signed out). No tokens in localStorage. There is no `/refresh` (cookie sessions have nothing to refresh).
- **Authorisation:** `permission:x` route middleware (role permissions, **403**) plus policies/scoped queries for ownership. A record the caller may not see answers **404**, identical to a missing one (no id probing).
- **Collections:** `{ "data": [...], "links": {...}, "meta": { "current_page", "last_page", "per_page", "total" } }`. Default `per_page` 20, max 100.
- **Single:** `{ "data": {...} }`. **Errors:** `{ "message": "...", "errors": {} }` with fixed safe messages (never exception text): 401, 403, 404, 405, 409 (state conflict), 419, 422 (`errors` = field messages), 429 (`Retry-After`), 500.
- **Common query params:** `page`, `per_page`, `search` (LIKE, bound parameters, wildcards escaped), `sort` (whitelisted per endpoint), `direction` (`asc|desc`), `from`, `to`, plus endpoint filters. Invalid values return 422.
- **Rate limits:** login 5 attempts/min per account+IP (and 20/min per IP), API 240/min, writes 30/min, uploads 20/min, search 60/min.

## Endpoints

| Area | Endpoint | Auth / permission | Notes |
| --- | --- | --- | --- |
| Auth | `POST /api/auth/login` `{identifier, password, remember}` | public, throttled | employee ID or email; generic 401; 403 for inactive accounts; returns `{data: user}` |
| | `GET /api/auth/me`, `POST /api/auth/logout` | signed in | user: `id, employee_id, email, display_name, account_status, roles, permissions, profile{}, official{}`. `official` comes from the directory entry HR linked to the account and is null until HR links one |
| Profile | `GET/PUT /api/profile` | `profile.view` / `profile.edit` | PUT accepts only `preferred_name, personal_email, mobile_number, avatar_url` |
| Preferences | `GET/PUT /api/account/preferences`, `POST .../reset` | signed in | always the caller's own record; no id in the URL |
| Announcements | `GET /api/announcements`, `/{id}` | `announcements.view` | published and inside `published_at/expires_at` only; filters `category, priority, pinned, from, to, search`; managers also `status` |
| | `POST/PUT/DELETE /api/announcements[/{id}]` | `announcements.manage` or `.hr-manage` | soft delete |
| Calendar | `GET /api/calendar/events`, `/{id}` | `calendar.view` | `from`, `to` (overlap), `category`, `status`, `search`; employees see `visibility=all` only |
| | `POST/PUT/DELETE /api/calendar/events[/{id}]` | `calendar.manage` | no recurrence |
| Documents | `GET /api/documents`, `/categories`, `/recent`, `/popular`, `/{id}`, `/{id}/download` | `documents.view` | access levels enforced in SQL and policy; metadata only; download is a placeholder (`available:false`) |
| Forms | `GET /api/forms`, `/{id}` | `forms.view` | `document_id` only (hidden if the document is not accessible) |
| Request types | `GET /api/request-types`, `/{id}` | `forms.view` / `requests.submit` | active types only (managers may filter inactive) |
| Requests | `GET /api/requests` (`status, request_type_id, from, to, search, sort, scope=own|review`) | `requests.view-own` | own requests; `scope=review` for HR/admin |
| | `POST /api/requests` `{request_type_id, subject, description?, priority?, form_data?, save_as_draft?}` | `requests.submit` | server generates `REQ-YYYY-NNNN` (or the type prefix), history, activity, notification, in one transaction; answers validated against the type's field definitions |
| | `GET/PUT /api/requests/{id}`, `POST .../{id}/cancel`, `GET .../{id}/history` | owner | PUT edits drafts only (`submit:true` submits); status can never be set by the employee |
| | `POST /api/requests/{id}/status` `{status, comment?, internal?}` | `requests.manage` / `requests.hr-review` + policy | `under-review/approved/rejected/completed`; `internal` notes are hidden from the requester |
| | `GET/POST /api/requests/{id}/attachments`, `DELETE .../{attachment}` | owner | allow-listed types (pdf, doc(x), xls(x), jpg, png, txt), 5 MB, content-sniffed MIME, private disk, server-generated names, no paths returned |
| Notifications | `GET /api/notifications` (`unread`, `type`), `GET /{id}`, `POST /{id}/read`, `POST /read-all` | own only | 404 for others' ids, even for admins |
| Activity | `GET /api/activity` (`type`, `from`, `to`) | own only | |
| Helpdesk | `GET/POST /api/helpdesk/tickets`, `GET /{id}`, `POST /{id}/replies`, `/{id}/attachments`, `/{id}/cancel`, `POST /{id}/claim` (IT: take ownership; 409 if owned) | `helpdesk.view/create` | own tickets (IT: `scope=all`) `assigned` filter (`me` or `unassigned`); number `INC-YYYY-NNNNN` |
| | `GET /api/helpdesk/knowledge-base` | **not built** | no table exists; the frontend keeps its sample articles. Future contract: list/show with `search, category, tags, page` |
| Benefits | `GET /api/benefits`, `/{id}`, `/categories`, `/featured`, `/faq` | `benefits.view` | information only; nothing calculated |
| Recruitment | `GET /api/recruitment/jobs[/{id}]`, `POST /jobs/{id}/apply`, `POST /jobs/{id}/refer`, `GET /applications[/{id}]`, `GET /referrals[/{id}]` | `recruitment.view` / `.apply` | numbers `APP-`/`REF-YYYY-NNNN`; own only; closed or disabled jobs return 409 |
| Resources | `GET /api/resources`, `/{id}`, `/categories`, `/featured`, `/faq` | `resources.view` | references documents/forms/benefits by id |
| HR boundary | `GET /api/hr/services`, `GET /api/hr/employee-information`, `POST /api/hr/requests` | `hr.view` | services = HR request types; employee information is `null` + `meta.connected:false` until HR links a directory entry to the account; HR requests only |
| Search | `GET /api/search?q=&type=&page=` | `portal.view` | announcements, documents, forms, benefits, resources, events, jobs; each type honours its own visibility rules |

## Frontend status after Phase 26

- **Migrated to the adapter pattern:** authentication (`adapters/auth.api.ts` maps `UserResource`), notifications and activity (`adapters/notifications.api.ts`).
- **Backend ready, frontend still on sample data:** every other module. Migrate one at a time with the recipe above; the snake_case wire format is mapped inside each adapter. Mock mode (`VITE_DATA_MODE=mock`) is unchanged.
- **HR-maintained fields** (`job_title`, `department` …) arrive as `null` until HR links a directory entry to the account; the adapter maps them to empty strings. The UI must show a neutral placeholder until then.

## Running the portal against Laravel (Phase 27)

```bash
cd backend && php artisan migrate:fresh --seed && php artisan serve --host=localhost --port=8000
# frontend, in another terminal (use "localhost" for BOTH so the session cookie is same-site):
VITE_AUTH_MODE=api VITE_DATA_MODE=api VITE_API_BASE_URL=http://localhost:8000 npx vite --host localhost --port 5173
```

Mock mode (`VITE_AUTH_MODE=mock VITE_DATA_MODE=mock`, the default) needs no server. Production builds are always `api`.
New helper: `hooks/useMutation` (idle/submitting/success/error, blocks double submits, maps 422 to field errors).
Known limits: resumes are not stored by Laravel; profile "language/timezone" preferences stay local; "All" search results show the top matches per type.

## Password links (public, throttled 5/min per address)

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/forgot-password` `{identifier}` | Emails a reset/activation link if the account exists. Always 202 with the same message. |
| `POST /api/auth/set-password` `{token, password, password_confirmation}` | Sets the password (min 12), activates a pending account, ends sessions. 422 on `token` for a bad/expired/used link. |
| `POST /api/admin/users/{id}/password-link` | `users.manage`. Emails a fresh link; 409 for disabled accounts, 502 if the mail could not be sent. |
