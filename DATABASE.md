# Portal Database & Laravel Backend Foundation (Phase 25)

The Laravel backend lives in `backend/` (Laravel 12, PHP 8.2+, MySQL). This phase added the **database schema, Eloquent
models, policies, seeders and tests**. It deliberately did not add controllers or API routes: the React API contract
(`API.md`) is ready for them, and they come with each module's migration from mock data.

```
React portal  ->  Laravel API  ->  Portal MySQL database
```

## Where employee data lives

There is no external HR system. The portal is the system of record and HR types everything in by hand.

- `users` holds **portal identity only**: `employee_id` (the company employee ID, intentionally **not** a foreign key), `email`,
  `password` (Laravel hashing), `status`, `last_login_at`. No name, job title or department is stored on the account.
- Employee facts (display name, job title, department, location, company email, phone, employment status and type, date joined, manager) live on the HR-maintained
  `directory_entries` record, linked to the account by `user_id`. Code that needs them (the profile, department-restricted
  documents, approval routing) reads `User::directoryEntry`. No entry linked means "unknown", never "allowed".
- Not stored anywhere in the schema: salary, leave balances, attendance, government IDs, performance or discipline data.
- Benefits tables are **information only** (no balances, claims, medical data, deductions or eligibility calculations).

## Running it

```bash
cd backend
cp .env.example .env            # set DB_* for your MySQL (default database name: eljin_portal)
php artisan key:generate
php artisan migrate --seed      # roles always; demo users/content only outside production
php artisan test                # SQLite in-memory, no MySQL needed
```

Demo seeders are **development only**: `DatabaseSeeder` refuses to create demo users or sample content when
`APP_ENV=production`. Demo accounts mirror the React mock accounts (`EMP-0001` to `EMP-0005`, one per role, password in
`AUTHENTICATION.md`). All seeded content is fictional, labelled "Sample"/"SAMPLE / DEMO", and flagged `is_sample`.

## Tables

| Area | Tables | Notes |
| --- | --- | --- |
| Identity | `users`, `roles`, `user_roles`, `user_permissions`, `access_templates`, `sessions` | Roles assigned server-side only; no role UI. `sessions` supports Laravel session auth. |
| Announcements | `announcements` | `slug` unique; indexes on `status`, `published_at`, `(status, published_at)`; soft deletes. |
| Calendar | `calendar_events` | Index on `starts_at`, `(status, starts_at)`; soft deletes. |
| Documents | `document_categories`, `documents` | **Metadata only.** `storage_disk`/`storage_path` reserve a future private location and are hidden from serialisation. Access levels `all`/`department`/`manager`/`restricted`. |
| Forms | `employee_forms` | A download form points at a `document` (no duplicated metadata); an online form points at a `request_type`. |
| Requests | `request_types`, `employee_requests`, `request_history`, `request_attachments` | `reference_number` unique; `request_history` = timeline rows. Attachments are metadata only. |
| Notifications | `notifications` | Model `PortalNotification`; owned by `user_id`; `read_at` for read state. |
| Activity | `activity_logs` | Lightweight feed (not an audit system); only `created_at`. |
| Helpdesk | `helpdesk_tickets`, `helpdesk_replies`, `helpdesk_attachments` | `ticket_number` unique; no SLA, CMDB or chat. |
| Benefits | `benefits`, `benefit_faqs` | Informational. |
| Recruitment | `recruitment_jobs`, `job_applications`, `job_referrals` | No scoring, ranking, scheduling or recruiter notes. |
| Resources | `resources`, `resource_faqs` | Reference documents, forms, benefits or routes; never copy their content. |
| Preferences | `portal_preferences` | One row per user (unique `user_id`); defaults mirror the React portal. |

Design choices: statuses and categories are **string columns cast to PHP enums** (`app/Enums`, values match the React slugs,
portable across MySQL and SQLite); JSON is used in only two justified places (`request_types.fields`, the dynamic form
definition, and `employee_requests.form_data`, the answers to it); users with requests, tickets or referrals are protected
with `restrictOnDelete` so history cannot disappear silently; user-owned preferences and notifications cascade.

## Models and relationships

`User` -> `roles()`, `requests()`, `notifications()`, `activityLogs()`, `helpdeskTickets()`, `applications()`, `referrals()`,
`preferences()` · `EmployeeRequest` -> `user()`, `requestType()`, `history()`, `attachments()` · `Announcement` / `CalendarEvent`
-> `author()` · `Document` -> `category()` · `EmployeeForm` -> `document()`, `requestType()` · `JobApplication` -> `job()`, `user()` ·
`JobReferral` -> `job()`, `referringUser()` · plus tickets/replies/attachments, benefits/FAQs, resources and jobs.
`User` does **not** use Laravel's `Notifiable`, so `notifications()` is the portal's own relation with no clash.

## Authorization

- `App\Authorization\RolePermissions` mirrors the frontend permission map (`src/auth/permissions.ts`). **This copy enforces; the frontend only shapes the UI.**
- One Gate is registered per permission; `permission:xxx` route middleware returns 401 (signed out) or 403 (not permitted).
- Policies (auto-discovered): `EmployeeRequestPolicy`, `PortalNotificationPolicy`, `HelpdeskTicketPolicy`, `JobApplicationPolicy`, `JobReferralPolicy`, `PortalPreferencePolicy`, `DocumentPolicy`.
  Employees see only their own requests, notifications, tickets and applications; notifications are private even from administrators.
- **IDOR rule for the future controllers:** always load owned records through the relation (`$user->requests()->findOrFail($id)`) or authorise with a policy. Never `findOrFail($id)` and return it.
- Mass assignment is protected: `user_id`, `status`, `reference_number`, sample flags and storage paths are never fillable.
- `password` and `remember_token` are hidden; attachment storage paths are hidden.
- Inactive or suspended users hold no permissions.

## Frontend compatibility (comparison with the React types)

| Frontend | Backend | Note |
| --- | --- | --- |
| `EmployeeRequest.reference` / `title` / `answers`+`values` | `reference_number` / `subject` / `form_data` | API Resource maps names; answers' display labels come from `request_types.fields`. |
| `RequestCategory` includes `recruitment` | `RequestCategory` enum includes `benefits` and `recruitment` | Superset of both lists. |
| `RequestStatus` slugs | same slugs (`under-review`…) | Identical. |
| Announcement `content` = structured blocks | `announcements.content` = text | Store the blocks as text/markdown or JSON when the API is built; decide then. |
| Helpdesk knowledge-base articles | no table yet | Deferred (search/FAQ keep working from the frontend until then). |
| Document `accessLevel` | `access_level` | Same four values. |
| Event `startDate`+`startTime` | `starts_at` timestamp | API Resource splits for the UI if needed. |

No frontend change was needed in this phase; mock mode keeps working.

## Assumptions

- `employee_id` values are the company's employee IDs, entered by HR, and are unique within the portal.
- The sign-in identifier (employee ID or email) is resolved by `User::withIdentifier()`; the real login controller, Sanctum and rate limiting are the next backend step (`AUTHENTICATION.md`).
- SQLite is used for tests, MySQL for real environments; migrations avoid engine-specific features (so no FULLTEXT yet; MySQL `LIKE` search is enough for now).
- Request, ticket, application and referral numbers (`LV-2026-0001` style) will be generated by the server inside a transaction.

## Deferred

API routes/controllers/Form Requests/API Resources, Sanctum installation, file storage, knowledge-base table,
rate limiting, WebSockets/email/SMS, audit logging, any administration UI.

## Personal details and emergency contacts

`user_profiles` also holds the employee-entered `date_of_birth`, `civil_status`, `address_line`, `city`, `province` and `postal_code`;
`emergency_contacts` (user, name, relationship, phone, alternate phone, email, order) holds up to five people to call. Both belong to
the employee and are removed with the account. They are separate from `users` (which stays portal identity only) and from the HR
directory entry.

`user_profiles` also holds `share_birthday` (default off) and `share_anniversary` (default on): the employee's choice of what
colleagues see in the dashboard's Celebrations section.

`portal_preferences` also holds `email_mode` (`instant`, `daily` (default) or `off`) and `last_digest_at` (when the daily summary
last went out, so it is never sent twice in a day).
