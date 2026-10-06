# Administration (Phase 29)

The admin area manages the **Employee Portal**. HR keeps the employee records (names, departments, job titles) here by hand.
Payroll, attendance, leave balances and benefit records are not stored in the portal at all.

```
Portal user (login)  --employee_id-->  HR directory entry     Browser never talks to MySQL.
React /admin  ->  Laravel /api/admin/*  ->  policies / validation  ->  MySQL
```

A portal user holds only `employee_id` (the company employee ID, not a foreign key), company email, password hash,
status and roles. The employee's name, department and job title are on the linked directory entry (HR Management).

## Account states (enforced by Laravel on sign-in and on every request)

| Status | Meaning |
| --- | --- |
| active | Can sign in and use the portal. |
| pending | Account exists but is not activated; cannot sign in. |
| inactive | No portal access. |
| suspended | Access temporarily blocked. |

Disabling an account deletes its sessions immediately. There is no hard delete (history stays intact): accounts are disabled.

## Roles and permissions

Roles (`employee, manager, hr, it, admin`) and their permissions are **defined in code** (`App\Authorization\RolePermissions`,
mirrored in `src/auth/permissions.ts`). The admin UI shows them read-only; no API can create roles or permissions.
`admin` has broad PORTAL-management permissions and nothing in payroll or attendance. New permissions: `users.manage`, `roles.view`,
`audit.view`, `settings.manage`, `notifications.manage`.

| Module | Permission(s) that open it | Roles today |
| --- | --- | --- |
| Dashboard | any admin-area permission (shows only what you manage) | hr, it, admin |
| Users, Roles, Permissions | `users.manage` / `roles.view` | admin |
| Access (per-employee check boxes) | `users.manage` | admin |
| Announcements | `announcements.manage` or `.hr-manage` | hr, admin |
| Calendar, Forms, Request types | `calendar.manage` / `forms.manage` / `requests.manage` | admin |
| Documents, Document categories | `documents.manage`, `.hr-manage`, `.it-manage` | hr, it, admin |
| Benefits, Job postings, Applications, Referrals | `benefits.manage` / `recruitment.manage` | hr, admin |
| Resources | `resources.manage` or `.it-manage` | it, admin |
| Requests | `requests.manage` or `requests.hr-review` (HR sees HR-type requests only) | hr, admin |
| Helpdesk | `helpdesk.manage` | it, admin |
| Notifications, Activity log, Settings | `notifications.manage` / `audit.view` / `settings.manage` | admin |

## Privilege-escalation and self-protection rules (server side, `UserAdminService`)

- Only `users.manage` holders reach `/api/admin/users*`; HR/IT/managers get 403.
- Roles come from the fixed list; unknown roles are 422.
- An administrator cannot change **their own** roles or status.
- The **last active administrator** can never be disabled or lose the admin role (422 with a clear message).
- A user always keeps at least one role.
- Created accounts get an unusable random password and the chosen status; client-sent `password`, `is_sample`, HR fields are ignored.

## First administrator (deployment)

No default accounts exist, and production seeders create none. On a new deployment run, on the server:

```bash
php artisan migrate --force
php artisan portal:create-admin           # prompts for employee ID, email and a hidden password (12+ chars)
```

The command refuses to run without a terminal and never accepts a password as an argument. Until an activation / password
reset flow exists (extension point: `App\Contracts\AccountActivation`, default does nothing), an operator sets the password
for accounts created in the admin UI with `php artisan portal:set-password EMP-0042`. No reset system is faked.

## API (all under `/api`, all require sign-in + permission middleware)

`admin/dashboard`, `admin/users` (GET, POST), `admin/users/{id}` (GET, PUT email only), `admin/users/{id}/status` (PATCH),
`admin/users/{id}/roles` (POST), `admin/users/{id}/roles/{role}` (DELETE), `admin/roles[/{id}]`, `admin/permissions`,
`admin/activity-log`, `admin/settings` (GET, PUT), `admin/notifications` (GET, POST), and CRUD for `admin/documents`,
`admin/document-categories` (no delete), `admin/forms`, `admin/request-types` (no delete: deactivate), `admin/benefits`,
`admin/resources`, `admin/recruitment/jobs`, plus read-only `admin/recruitment/applications|referrals`.
Existing endpoints are reused instead of duplicated: announcements and calendar writes (`/api/announcements`,
`/api/calendar/events`), request review (`GET /api/requests?scope=review`, `POST /api/requests/{id}/status`) and helpdesk
(`GET /api/helpdesk/tickets?scope=all`, replies, and the new `PATCH /api/helpdesk/tickets/{id}` for status, priority, assignee).

## Audit log

`audit_logs` is append-only (no edit/delete route; the model refuses updates and deletes). It records actor, action
(`USER_CREATED`, `USER_DISABLED`, `ROLE_ASSIGNED`, `ROLE_REMOVED`, `ANNOUNCEMENT_PUBLISHED`, `DOCUMENT_UPDATED`,
`REQUEST_STATUS_CHANGED`, `HELPDESK_TICKET_ASSIGNED`, `RECRUITMENT_POSTING_PUBLISHED`, `BENEFIT_UPDATED`,
`SETTING_CHANGED`, `NOTIFICATION_SENT` …), module, target, result and IP, never passwords or other secrets. The
employee-facing `activity_logs` table (each employee's own feed) is separate and unchanged.

## Settings

Fixed keys only (`App\Services\PortalSettings`): portal name/description, support contact, links to ERP / ticketing
(https only), default page size, search-history default. Secrets cannot be stored. The links are stored for the portal to read;


## Limitations

- Mock mode has no administration (the admin area says so); it needs the Laravel API.
- Not built, because the backend has no support for them: services management (the service catalog is static frontend data),
  helpdesk categories, benefit/resource FAQ management, document file upload/replace/download (no document file storage),
  internal helpdesk notes, user display-name/notes fields, department filter for users.
- `hr` document managers can manage all documents, not only HR ones (no department scoping yet).
- Stored link settings are not yet consumed by the employee React app (it reads `VITE_*` configuration).
- Admin lists are tested against the API and in a browser for admin and HR; tablet/mobile layouts rely on a drawer menu and
  horizontally scrolling tables.

---

# HR Management (Phase 31)

HR staff manage the **employee records, the employee-facing directory and company content** without a developer. There is no
external HR system: the portal is the system of record and HR enters everything by hand.

## Field ownership

| Data | Owner | In the portal |
| --- | --- | --- |
| Employee ID, job title, department assignment, company email, employment status / type, date joined, manager | Portal (HR) | Editable by HR on the employee record; `employee_id` is chosen once and cannot change. |
| Directory display name, business phone, description, location, visibility | Portal (HR) | Always editable. |
| Departments (name, description, contact, head display text, order, status) | Portal | Labels only: which employees belong to one is set on each employee's record, never from the department screen. |
| Company overview, history, leadership profiles, locations | Portal (HR content) | Draft / published / archived. Employees see published content only. |
| Services (cards, destinations, related forms/documents/benefits/request types) | Portal | Draft / published / archived, optional required permission. |

**Creating an employee record also creates their login**: the company email (mandatory, unique across entries and accounts) becomes the sign-in name, the account starts `pending` with the role HR picks on the form (**Regular Employee** or **Manager** only; HR can also switch a linked account between those two later, but never its own role), and the employee is emailed a one-time link to choose their own password (the sign-in page also has "First time signing in?"). Changing the entry's email changes the login. **Offboarding is automatic**: setting an employee's status to **Inactive** disables their login immediately (all sessions end, "remember me" is cleared, unused password links and codes are destroyed) and the sign-in page refuses them; setting them back to Active or On leave restores the login exactly as it was (a never-activated account returns to waiting for its first sign-in). Only logins this rule disabled are ever re-enabled: an account an administrator suspended or disabled by hand is never touched, and an administrator changing such an account's status takes it out of HR's hands. It is refused for the last active administrator and for your own record. Inactive employees get no login from creating a record, "Create login", the bulk action or an import. Both changes are audited (`USER_OFFBOARDED`, `USER_REINSTATED`).

**CSV import** (Employee Directory → "Import from CSV", `/admin/hr/employees/import`): HR uploads a CSV (comma, semicolon or tab separated; UTF-8 or Excel encoding; up to 1,000 rows / 1 MB; a template can be downloaded), checks it (`POST /api/admin/hr/employees/import/preview` writes nothing and reports every problem by line number), then imports the good rows (`POST .../import`). Departments and locations are matched by name and never created; managers can be anywhere in the file; employee IDs that already exist are skipped, never changed, so a corrected file can be uploaded again. Options: create logins and send the password emails (default on), and show the employees in the directory (needs `hr.directory.visibility`; default off). Rows with problems can be downloaded as a CSV.

Entries created before this change get a login with "Create login & send password link" on the entry page, or all at once with "Create logins for all" on the HR Dashboard (up to 100 per run; entries without an email, or whose email another account already uses, are skipped and listed). HR Staff, IT Staff and Administrator access is granted by an administrator under Users, and HR cannot change the role of anyone who holds one of them. Mail uses `MAIL_MAILER` (the default `log` writes the email, link included, to `backend/storage/logs/laravel.log`; configure SMTP for real delivery).

`directory_entries` is the employee record, keyed by the employee ID HR enters, optionally linked
(`user_id`) to an existing portal account. Linking never creates accounts (those live under Users). **Hiding an entry never
changes the account** (status, roles, sessions); `source`, `verification`, `official_name` and `user_id` can never be sent by a client.

## Tables (migration `2026_10_03_000001_create_hr_content_tables`)

`departments`, `company_locations`, `directory_entries` (unique employee_id, unique company_email, unique user_id, FKs with
`nullOnDelete`), `company_pages` (key `overview`), `company_history_entries`, `leadership_profiles`, `portal_services`.
Departments and locations in use cannot be deleted (409); archive them instead. Archiving never cascades into employee entries.

## Permissions (added; HR and admin roles hold them, IT and others do not)

`hr.directory.view`, `hr.directory.manage`, `hr.directory.visibility`, `hr.departments.manage`, `hr.company.manage`,
`hr.company.publish`, `hr.services.manage`, `hr.services.publish`; `hr.manage` (existing) opens the HR dashboard.
Without the matching `*.publish` permission a user can create and edit **drafts only**: they cannot publish, archive or change
live content (enforced in `AdminCrudController::guardPublication`, covered by a test).

## API

Admin (`/api/admin/hr/*`, permission middleware on every route): `dashboard`, `employees` (GET list/filter/sort/paginate, POST, GET/PUT `{id}`,
PATCH `{id}/visibility`, POST `{id}/link-account`, GET `unlinked-users`), `departments`, `company` (GET/PUT overview),
`company/history`, `company/leadership`, `company/locations`, `services` (each: list, create, show, PUT, PATCH `{id}/status`, DELETE).
Employee-facing (published/visible content only): `GET /api/directory[?search&department&location&sortBy&sortDir]`,
`/api/directory/{employeeId}`, `/api/directory/filters`, `/api/company`, `/company/history|leadership|departments|locations`.
Global search covers visible directory entries. Every
change is audited (`DIRECTORY_ENTRY_*`, `DIRECTORY_VISIBILITY_CHANGED`, `DIRECTORY_ACCOUNT_LINKED`, `DEPARTMENT_*`, `LOCATION_*`,
`HISTORY_ENTRY_*`, `LEADERSHIP_*`, `COMPANY_OVERVIEW_*`, `HR_SERVICE_*`).

## Service destinations

A service destination is a portal path (`/forms`, one leading slash) or an `https://` address. `javascript:`, `data:`, `http:`,
protocol-relative and whitespace/markup-containing URLs are refused. 

## Frontend

Admin: `/admin/hr` (dashboard), `/admin/hr/employees` (+ detail with preview and account link), `/admin/hr/departments`,
`/admin/hr/company` (overview), `/admin/hr/company/history|leadership|locations`. They reuse the generic
admin list/form screens, confirmation dialog and status badges; HR Documents/Forms/Benefits/Recruitment/Requests link to the existing
admin pages instead of duplicating them. Employee pages (`/directory`, `/company/*`, `/services`) read the same data through the
existing services, which switch to Laravel in API mode.

## Limitations and dependencies

- No photo/image upload: there is no secure image storage yet, so leadership and directory entries show without photos.
- Employment status (active / on leave / inactive), employment type, date joined and manager are stored on the employee record. The manager link drives approval routing and the organization chart (no reporting loop is allowed). Leave balances, payroll and attendance are not stored.
- No review/approval workflow: publishing is a separate permission and is audited.
- HR must supply: approved company overview text, history, leadership profiles, departments, locations (addresses/contacts/hours), and the real list of HR services and their destinations. The development seeder fills **sample** placeholders (all flagged `is_sample`, refused in production).

---

# Department heads and approval routing (HR-managed)

**Department head.** HR picks a directory entry as the head of a department (Admin → HR Management → Departments). The company
Departments page shows that person's display name (the typed "head" text is only a fallback). Stored in
`departments.head_directory_entry_id`.

**Approval routing.** Requests follow the **manager on the employee record** (`manager_id`, set in Employee Directory), so
reporting lines are not maintained twice. HR adds routes only for exceptions (Admin → HR Management → Approval Routing,
`/api/admin/hr/approval-routes`, permission `hr.approvals.manage`, held by `hr` and `admin`). Resolution for a request
(`App\Services\ApprovalRouting`, one `resolve()` used for single requests and for review lists):

1. the requester's department = the department of the directory entry linked to their account;
2. an active HR route for (that department, this request type), else a route for (that department, all types): the exception;
3. else the requester's **manager**, or the first person up the reporting chain who can act (a manager without the manager role, a
   disabled account or no linked account is skipped, and so is a loop in the data);
4. else the department head; 5. else the company fallback (below).

Safeguards, all enforced by Laravel:
- Routing never grants a permission. The approver must have an **active portal account** linked to their directory entry **and** hold
  `requests.team-review` (the `manager` role, assigned by an administrator under Users). The routes page shows "Can review: No" otherwise.
- Nobody reviews their own request. A suspended or deactivated approver cannot act.
- An approver sees only requests routed to them (anything else answers 404), can move a request to under-review, approved or rejected,
  and **cannot complete** it (HR or an administrator does). Internal notes and the audit log work as for other reviewers.
- The approver is notified when a request is submitted; the requester is notified of each status change; every change is audited
  (`REQUEST_STATUS_CHANGED`, `APPROVAL_ROUTE_*`, `DEPARTMENT_UPDATED`).
- A routed approver can open Administration → Requests (and the dashboard), and nothing else in the admin area.

Who belongs to a department and who reports to whom both come from the employee records HR maintains.
`ApprovalRouting::resolve()` is the single place where routing is decided (`explain()` returns the approver and how they were
chosen: `route`, `manager`, `head`, `fallback` or `none`).
Demo data: the MIS department head is the demo manager, so demo requests from the demo employee reach that manager.

## Fallback approver (departments without a manager)

HR sets a company-wide **fallback approver** (primary, plus an optional secondary) under Admin → HR Management → Approval Routing
(`GET/PUT /api/admin/hr/approval-fallback`, `hr.approvals.manage`, audited as `APPROVAL_FALLBACK_UPDATED`). Resolution order is now:
route for (department, type) → route for (department, all types) → manager chain → department head → **fallback**. The fallback is also used when
the department approver cannot act (no manager role, suspended, unlinked) or is the requester, and for requesters who have no linked
directory entry or department. The secondary acts only when the primary cannot act or is the requester. A department that has a
usable approver never reaches the fallback. The fallback approver needs the same things as any approver (linked, active account with
the manager role); the page shows "Can review" or why not. Typical setup for a team without a manager: give the HR Manager the
`manager` role (besides `hr`), link their directory entry, and choose them as the primary fallback.

## IT request queue and ticket ownership

**IT-type requests** (request types in the `it` category) go to the IT team, not HR.

- The IT role holds `requests.it-review`. IT staff see only IT-type requests (never their own) under Administration -> Requests; HR does not see them; administrators see everything.
- A type that needs no approval (or has no approver anywhere in the routing chain): IT is notified ("New IT request") and may move it through under review, approved/rejected and completed.
- A type that needs approval and has an approver (department head, route or fallback): the approver is notified and decides. IT can mark it under review and **complete it only once it is approved**; IT is notified when it is approved ("Approved IT request"). Everyone else cannot approve it.
- Rules are enforced in `RequestService::moveError()` (Laravel); the screen only hides moves the server would refuse. Refused moves answer 422 on `status`.

**Helpdesk tickets** are visible to everyone who holds `helpdesk.manage` (IT and administrators): `GET /api/helpdesk/tickets?scope=all`, optionally `assigned=me|unassigned`.

- New tickets notify IT staff ("New helpdesk ticket"), except the requester.
- `POST /api/helpdesk/tickets/{id}/claim` takes ownership: assigns the signed-in staff member, moves a `new` ticket to `open` and tells the requester. It is idempotent for the current owner, answers 409 when another person owns the ticket or it is closed/cancelled, and is audited as `HELPDESK_TICKET_ASSIGNED`. Reassigning to someone else is a deliberate action through `PATCH /api/helpdesk/tickets/{id}`.
- Employees only ever see their own tickets.

## Passwords: activation and reset by email

No default or shared password is ever issued. Creating a user (recommended status **Pending**) emails them an **activation link**; they choose their own password and the account becomes Active.

- **Activation link** (Pending accounts) is valid 72 hours; **reset link** (Active accounts, "Forgot your password?" on the sign-in page) 2 hours. Links work once, a newer link replaces older ones, and only a hash of the token is stored. Setting a password signs the account out everywhere. Passwords need at least 12 characters.
- **Admins:** Users -> a user -> **Send activation email** / **Send password reset email** (audited as `USER_PASSWORD_LINK_SENT`). Disabled (inactive/suspended) accounts get no link. If the mail server is down, user creation still succeeds and the admin can resend.
- "Forgot password" answers identically for known and unknown accounts (no account discovery) and is rate limited (5 per minute per address).
- `php artisan portal:set-password EMP-0042` still works as an operator fallback.

**Mail setup** (backend `.env`): `FRONTEND_URL` is the portal address used in the links. `MAIL_MAILER=log` (the default) only writes emails to `storage/logs/laravel.log`, which is useful for testing: copy the link from there. For real delivery set `MAIL_MAILER=smtp` with `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` and `MAIL_FROM_NAME` (your company mail server or provider).


## Removed: Employee Services directory

The `/services` pages, the HR Services admin screen, `GET /api/services` and the `portal_services` table (dropped by migration `2026_10_07_000001`) are gone, as is the IT Services page under Helpdesk. IT work goes through the Helpdesk (tickets) and IT requests. The navigation now links HR, Resources and Helpdesk directly. The separate HR page list at `/hr/services` (HR request types) is unchanged.

# Organization chart

The employee-facing chart (Company → Departments) is drawn from the same reporting lines (`GET /api/directory/organization`, permission
`directory.view`): everyone shown in the directory who has not left, joined by the manager on their record. A manager who is hidden
or inactive is skipped (the line goes to the nearest person who is shown), a reporting loop is cut, and only the directory's
business fields are returned. Wide screens draw a **top-down tree**: the top person (the one with no manager), then their managers,
then the people under each manager; people who manage nobody hang in a column under their manager so the tree stays narrow, and
only managers sit side by side. Small screens show an indented list. The top three levels are open, every branch opens and closes,
and names link to the directory profile. One top person becomes the root; several (or an incomplete structure) hang under the
company name, so for a single CEO at the top, leave the CEO's manager empty and make sure everyone else's chain leads to the CEO.
Until HR has recorded any reporting lines the page falls back to the departments list and says it is illustrative.

# Policy acknowledgements

HR publishes company policies and sees who has confirmed they read them (Administration → HR Management → **Policies**, permission
`policies.manage`, held by `hr` and `admin`; employees hold `policies.view`).

- **A policy** has a title, optional summary, plain-text body, an audience (all employees, managers, or chosen departments), an
  optional effective date and a "please read by" date, and a status: draft (employees do not see it), published, or archived. Policies
  are archived, never deleted, because acknowledgements are the record of who read what.
- **Who must read it** = accounts that are active or still waiting for their first sign-in and are in the audience (department =
  the department on their employee record; managers = holders of the Manager role). Inactive and suspended accounts are not asked.
- **Employees** see their policies under **Policies** (menu) and a prompt on the dashboard while any are unread. A policy shows as
  To read, Overdue (past the due date) or Read. They tick "I have read and understood" and confirm. The confirmation stores the
  policy **version**, the person and the time (`policy_acknowledgements`, unique per policy, person and version); the server refuses a
  confirmation for a version that is no longer current (409), so nobody confirms text they did not see. Confirmations are never edited.
- **Saving** a published policy fixes it in place (a typo): nobody is asked again. **Save and publish as new version** raises the
  version, notifies the audience and asks everyone to read and confirm again; earlier confirmations stay on record.
- **Who has not read it**: the policy's report (`GET /api/admin/policies/{id}/acknowledgements`) shows totals and a progress bar, and
  lists people filtered by Not read / Read / Everyone, department and search, with their manager, whether they have signed in yet,
  and the date for those who read it. It downloads as CSV. **Remind** sends a portal notification to those who have not read it
  (at most once every 24 hours per policy).
- Publishing, new versions and reminders are audited (`POLICY_*`); publishing and new versions notify the audience.

# Personal details and emergency contacts

Employees enter these themselves (first-sign-in setup, then My Profile → Personal Information, `/profile/personal`;
`GET/PUT /api/profile/personal`, permission `profile.edit`): date of birth, civil status, home address, and up to five emergency
contacts (name, relationship, phone, optional second phone and email; the first is called first). Nobody can change another person's
details: there is no id in the path. HR **cannot edit** them.

- **HR can read them** on the employee's page (Employee Directory → the employee → "Show personal details", permission
  `hr.directory.manage`, `GET /api/admin/hr/employees/{id}/personal`). They load only when asked for, and **every look is written
  to the audit log** (`PERSONAL_DATA_VIEWED`). Managers, IT and other employees cannot read them.
- They never appear in the Employee Directory, the directory API, the organization chart or HR lists.
- Deliberately not collected: government IDs, bank details, medical information, salary.
- Accounts created before this feature see a reminder on the dashboard until they add an emergency contact.

# Birthdays and work anniversaries (dashboard)

The dashboard's **Celebrations** section lists birthdays and work anniversaries in the next 30 days (`GET /api/celebrations`, permission
`directory.view`). It is hidden when there is nothing to show.

- **Birthdays are private unless the employee agrees.** Each employee chooses "Let my colleagues see my birthday" in their personal
  details (first-sign-in setup or My Profile → Personal Information); it is **off by default**. Only the **day and month** are sent:
  never the birth year or age, and not the date of birth itself. Employees without a date of birth cannot be shown.
- **Work anniversaries** come from the date joined HR recorded and show the years completed (1 or more). They are shown unless the
  employee turns "Let my colleagues see my work anniversary" off.
- Only people shown in the directory and not Inactive appear. A 29 February date is celebrated on 28 February in other years.
- HR sees the date of birth itself only in the audited "Show personal details" view; the sharing switches do not widen that.

# Email notifications and the daily summary

Every portal notification can also reach people by email, at their account email, depending on what each person chose
(Account Settings → Notification Preferences → **Email**; stored as `portal_preferences.email_mode`):

- **Daily summary** (the default): one email each morning at 7:30 (Asia/Manila) with what needs them (policies still to read,
  requests waiting for their review), unread portal notifications since the last summary, and today's celebrations. Nothing to say
  means no email, and never more than one a day. Sent by `php artisan portal:send-digests` (options `--user=EMP-ID`, `--force`,
  `--dry-run`), which the scheduler runs daily.
- **Instantly**: one email per notification, as it is created. In a web request the email is sent after the response, so nobody waits for
  the mail server. Choose this only if you can live with volume: announcements and policy publications reach everyone.
- **No email**.

The category switches (Announcements, HR, IT, Requests, Events, Documents) apply to email too: a category switched off creates no
notification and so no email. System notices always arrive. A person can use **Email me a sample** (5 an hour) to see the summary.

**The scheduler must be running** for the daily summary: `php artisan schedule:work` while developing, or one cron entry on the
server, `* * * * * cd /path/to/backend && php artisan schedule:run`. Instant emails need nothing extra.

Safeguards: accounts that are not active, and addresses that can never receive mail (example.com, `*.example`, `*.test`,
`*.invalid`, `*.local`, `localhost`: the sample data) are skipped, so the demo data never produces bounces. A failed send is logged
and never breaks the action that caused it. Emails carry a List-Unsubscribe header pointing at the settings page, escape everything
they show, and only make a link clickable when it is a plain route inside the portal.

All emails (password link, first-sign-in code, notification, summary) share one design (`resources/views/mail/layout.blade.php`:
navy header with a green rule, serif headings, bulletproof buttons, dark-mode styles, a plain-text alternative for each).

## Access (per-employee permissions)

Administration -> User Management -> **Access** (or **Edit access** on a user). Pick an employee, tick what they may do on top of their role (create policies, upload documents, review requests, view reports...) and save. Grants are stored in `user_permissions`, merged by `User::permissions()` and enforced by the same `permission:` middleware as roles; unticking removes them. Rules: only the list in `RolePermissions::grantableCatalog()` can be granted (never `users.manage`, `admin.access`, `roles.view`, `audit.view`, `settings.manage`, `notifications.manage`); you cannot change your own access; disabled accounts hold nothing; every change is audited as `ACCESS_UPDATED` with the permissions granted and revoked. API: `GET/PUT /api/admin/users/{id}/access`.

**Access templates** (Access -> Access templates, `access_templates` table, `GET/POST/PUT/DELETE /api/admin/access-templates`): named sets of grantable permissions by job function (starters: Team Lead, HR Staff, Recruiter, Policy Officer, IT Support, Content Editor, Reports Viewer). On a person's Access page, **Apply template** adds the template's boxes to what is ticked (it never saves by itself); **Copy access from another employee** replaces the ticks. Editing or deleting a template never changes access already saved for people. Templates can only hold grantable permissions.

## Reports and exports

HR Management -> **Reports** (`reports.view`: HR and administrators, or granted per person on the Access page). Built only from portal records: headcount by department, location and employment type; tenure; hires (by date joined) and leavers (when set to inactive, from the audit log) for the last 6/12/24 months; account counts (including logins with no employee record); and per-policy acknowledgement progress. Nothing about payroll, attendance or leave exists in the portal, so none is reported. API: `GET /api/admin/reports/overview?months=`, `GET /api/admin/reports/export/{directory|headcount|policies}` (CSV with a byte-order mark for Excel). Exports leave out personal details, emergency contacts and birthdays, neutralise spreadsheet formulas (cells starting `= + - @` are prefixed with an apostrophe), and every export is audited as `REPORT_EXPORTED` with the row count.

## Hubly link (helpdesk)

See `HUBLY_INTEGRATION.md`. With `HUBLY_ENABLED=true`, new helpdesk tickets are sent to Hubly (signed, queued in `hubly_outbox`, retried by `portal:sync-hubly` every minute) and Hubly is the master: status changes and public notes come back through `POST /api/integrations/hubly/events` (HMAC-signed, idempotent by `event_id`), update the ticket, and notify the requester. IT staff see the ticket read-only with its Hubly number, status and technician; Administration -> Helpdesk shows how many deliveries are waiting and a "Try again now" button (`GET /api/admin/hubly/status`, `POST /api/admin/hubly/retry`). Internal Hubly notes are never copied.
