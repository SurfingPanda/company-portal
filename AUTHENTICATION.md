# Authentication

How sign-in, sessions and protected routes work in the Employee Portal frontend.
No real credentials or secrets are documented here.

## Architecture

```
/login (LoginPage, UI only)
   │ useAuth().login()
   ▼
AuthContext  ──►  services/authService.ts  ──►  services/api.ts  ──►  Laravel
   ▲                 (real or mock mode)         (fetch, CSRF, cookies)
   │ user / isAuthenticated / isLoading
Route guards (src/auth/RouteGuards.tsx) ── ProtectedRoute, PublicOnlyRoute
```

| File | Responsibility |
| --- | --- |
| `src/context/AuthContext.tsx` | The one source of "who is signed in": `user`, `isAuthenticated`, `isLoading`, `login`, `logout`, `refreshUser`. |
| `src/services/authService.ts` | The only code that knows how authentication works. Real Laravel mode, or development-only mock mode. |
| `src/services/api.ts` | Central API client: base URL, `credentials: "include"`, Sanctum CSRF, JSON, normalised errors. |
| `src/auth/RouteGuards.tsx` | `ProtectedRoute` (layout route) and `PublicOnlyRoute` (wraps `/login`), plus the minimal loading screen. |
| `src/auth/useSignOut.ts` | Sign out and return to `/login`. Used by the profile menu and Account Settings. |
| `src/types/auth.ts` | `LoginCredentials`, `AuthResponse`, `ApiError`, `AuthErrorKind` and the user-facing messages. |

The signed-in person is always the existing `AuthenticatedUser` (`src/types/user.ts`). There is no second user model.

## Environment variables

See `.env.example`. Never commit a real `.env`.

| Variable | Meaning |
| --- | --- |
| `VITE_API_BASE_URL` | Laravel address, e.g. `http://localhost:8000` for local development. Empty means same origin. |
| `VITE_AUTH_MODE` | `mock` (development only) or `api`. **Production builds always use `api`**, even if this is set to `mock`. |

## Laravel contract

Session-based authentication for a SPA (Laravel Sanctum "SPA authentication"):

```
GET  /sanctum/csrf-cookie            sets the XSRF-TOKEN cookie (called automatically)
POST /api/auth/login                 { identifier, password, remember }  ->  { user: AuthenticatedUser }
GET  /api/auth/me                    ->  { user: AuthenticatedUser }       (401 when not signed in)
POST /api/auth/logout                ->  204
```

- `identifier` is an employee ID **or** a company email. The backend decides how to resolve it.
- Status codes the UI understands: `401`/`422` invalid credentials, `403` not authorised for the portal, network failure, and anything else as a generic server error. The UI never shows backend messages or stack traces, and never reveals whether an account exists.
- The browser stores **no** password, token, refresh token or employee data. The session lives in the server's cookie.
- Authorization is decided by Laravel on every request. The React route guards are a convenience, not a security boundary. `user.status` alone must never be trusted for access.
- The portal talks only to the Laravel backend. The browser never contacts the database.

### Laravel configuration needed (when frontend and backend are on different origins)

- `config/cors.php`: allow the frontend origin, `supports_credentials => true`, and include `sanctum/csrf-cookie` and `api/*` in `paths`.
- `.env` (backend): `SANCTUM_STATEFUL_DOMAINS` must list the frontend host (including port), `SESSION_DOMAIN` set so the cookie is shared, and an appropriate `SESSION_SECURE_COOKIE`/`SAME_SITE` for your HTTPS setup.
- Keep CSRF protection enabled. Do not disable CORS or CSRF to make development work.
- Prefer serving the SPA and API from the same site (or use the Vite dev proxy) to avoid cross-site cookie problems.

## Local development

1. **Without a backend (mock mode, the default in development)**: leave `VITE_AUTH_MODE` unset or `mock` and run `npm run dev`.
   Sign in with a development account (see the list under Authorization). Reloading keeps the dev session via a non-sensitive flag in browser storage; signing out removes it.
2. **With Laravel**: set `VITE_AUTH_MODE=api` and `VITE_API_BASE_URL` to your backend, configure Sanctum/CORS as above, run both servers.

Mock mode is NOT secure and exists only to build the UI. It is excluded from production behaviour by `import.meta.env.PROD`.

The development accounts are fictional, mock mode only, and never shown in the UI (see below).

## Protected routes

- Every route under the main layout (`/`, `/company`, `/directory`, `/documents`, `/services`, `/calendar`, `/forms`, `/requests`, `/notifications`, `/profile`, `/account/settings`, `/announcements`, `/helpdesk`, `/hr`, `/recruitment`, `/benefits`, `/resources`, `/search`, and unknown paths) sits inside `ProtectedRoute`.
- On start, `AuthProvider` checks the session with `GET /api/auth/me`. While that runs the app shows "Loading employee portal..." and does **not** redirect.
- Signed out: redirected to `/login?returnUrl=<path>`. After sign-in the employee returns to that path, or `/`.
- Signed in and visiting `/login`: redirected to the validated `returnUrl` or `/`.
- If the server cannot be reached during the start-up check, a "Try Again" screen is shown instead of a misleading redirect to the login page.
- `returnUrl` is validated by `getSafeReturnUrl` (`src/lib/auth.ts`): only same-site paths are accepted; absolute URLs, `//host`, backslashes and `javascript:` fall back to `/`.
- To add a public route, place it outside `ProtectedRoute` in `App.tsx`.

## Logout

Profile menu or Account Settings → **Sign Out** → `useAuth().logout()`:
`POST /api/auth/logout`, then local auth state is cleared **even if the request fails**, remembered searches are cleared, and the user is sent to `/login`.

## Authorization (roles and permissions)

Authentication answers *who you are*; authorization answers *what you may access*. **Laravel is the final authority**: the
frontend uses roles and permissions only to shape the UI and routing. Hiding a link or blocking a page in React protects
nothing, so the backend must authorize every request (view, create, edit, delete, approve, manage, restricted data).

| File | Responsibility |
| --- | --- |
| `src/auth/roles.ts` | `UserRole` (`employee`, `manager`, `hr`, `it`, `admin`) and labels. Roles are system roles, never job titles. |
| `src/auth/permissions.ts` | The strict `Permission` union and the one role-to-permissions table. |
| `src/auth/authorization.ts` | Pure helpers: resolve a user's roles and effective permissions. |
| `src/auth/useAuthorization.ts` | `hasRole`, `hasAnyRole`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions` (built on `useAuth()`). |
| `src/auth/routePermissions.ts` | Central path-to-permission table used by `ProtectedRoute`. Unlisted paths need sign-in only. |
| `src/components/authorization/` | `PermissionGuard` and `RoleGuard` (optional `fallback`, `mode="any"` or `"all"`). |
| `src/pages/Unauthorized.tsx` | The `/unauthorized` "Access Restricted" page. |

- **Permissions come from the backend when available.** If `GET /api/auth/me` returns `user.roles` and `user.permissions`, that explicit list is used. If `permissions` is missing, they are derived from `roles` through the central table (mock mode, or an older backend).
- **Example response:** `{ "user": { ..., "roles": ["employee"], "permissions": ["portal.view", "documents.view"] } }`.
- **`hr.view` / `it.view`** are the employee-facing HR and IT service pages (every employee). **`hr.manage` / `it.manage`** are future administration (HR / IT roles); no admin UI exists yet.
- **Admin** means portal administration only. It grants nothing in payroll, attendance or other external systems.
- **Navigation** is one system: items in `src/data/navigation.ts` may carry a `permission`, and `useNavigationItems()` filters them. Ordinary employees see no administrative links (`Administration` appears only with `admin.access`; its page is a placeholder).
- **403 handling:** a `403` from any non-auth API call opens `/unauthorized` (no body or stack trace is shown). A `403` on login shows the "not currently authorized" message.
- **No role UI:** nothing lets an employee change a role; there is no switch-user or impersonation. Role assignment is server-side.
- **Audit (backend):** authorization decisions should be logged by Laravel (user id, action, resource, timestamp, result). Nothing is logged client-side.

### Laravel requirements

Standard Laravel authorization: a roles/permissions model, **Gates/Policies and middleware** guarding controllers, and
`/api/auth/me` returning `roles` (and ideally `permissions`). Reuse an existing roles package if the backend has one. Keep
only the data the portal needs for authorization; employee facts live on the HR directory entry, not on the account.

### Development accounts (mock mode only; fictional)

All use the sample password `DemoOnly123!` (employee ID or the listed email):

| Employee ID | Role | Email |
| --- | --- | --- |
| `EMP-0001` | employee | `arvin.leano@eljin.example` |
| `EMP-0002` | manager | `ramon.aquino@eljin.example` |
| `EMP-0003` | hr | `grace.ramos@eljin.example` |
| `EMP-0004` | it | `carlo.mendoza@eljin.example` |
| `EMP-0005` | admin | `portal.admin@eljin.example` |

A small **"Dev only · Current mock role"** selector (bottom-right) switches between them. It renders only in a development
build with `VITE_AUTH_MODE=mock`; `switchMockRole` throws otherwise, so it cannot be used in production or against Laravel.

## Not included yet

Password change/recovery, MFA, SSO, session management UI, and any HR/IT/manager/admin tools (only the permission
foundation exists). Authorization is enforced by Laravel.

## First sign-in setup (onboarding)

A new account (created by HR with a directory entry, or by an administrator under Users) has `users.onboarded_at = NULL`.
`/api/auth/me` and `/api/auth/login` return `onboarding_completed: false`, and `ProtectedRoute` sends the person to
`/onboarding` before any other page: welcome, check the details HR holds (read-only), optional contact details
(`PUT /api/profile`), portal preferences, finish. Finishing calls `POST /api/auth/onboarding/complete`, which stamps
`onboarded_at` (idempotent) and the person is never shown the setup again. Accounts that existed before the feature were
backfilled as done. In mock mode the flag is absent, so nothing is shown.

## Sign-in flow (two steps)

The sign-in page first asks only for the **employee ID or company email** (`POST /api/auth/identify`). The answer decides what
comes next:

- `password`: an existing account is asked for its password (`POST /api/auth/login`). Unknown, inactive and suspended
  identifiers also answer `password`, so only a genuine first-time account is revealed.
- `setup`: the account is `pending` (first time). A 6-digit code is emailed to the account's own address (once per minute at
  most; valid 15 minutes; only an HMAC of it is stored; 5 wrong tries destroy it). The person enters the code and chooses a
  password (`POST /api/auth/first-sign-in`): the account becomes active, they are signed in, and the route guard sends them to
  the onboarding. The code proves they own the mailbox, so knowing someone's employee ID is not enough to claim their account.

The emailed activation link (account created by HR/an administrator) and "Forgot your password?" still work as before.

### Personal details and emergency contacts in the setup

The setup has six steps: welcome, check the details HR holds, **about you** (contact and personal details, optional), **emergency
contact** (required), preferences, finish. The server refuses `POST /api/auth/onboarding/complete` until the person has at least one
emergency contact (422 on `emergency_contacts`), so the rule holds even if the screen is bypassed.

## Changing your own password

Account Settings → Account → Account Security → **Change password** (`POST /api/account/password`, signed in). It asks for the
**current password** (a wrong one is refused and recorded as `PASSWORD_CHANGE_REFUSED`), the new one twice (12 to 128 characters,
different from the current one), and is limited to 5 tries a minute and 20 an hour per person so the current password cannot be
guessed. On success: the new password is stored hashed; **every other device is signed out** (this one stays signed in and gets a
fresh session id); "remember me" and any unused reset link are destroyed; the change is audited (`PASSWORD_CHANGED`, never the
password itself); a "Your password was changed" notification is created; and a security email goes to the account address whatever
the person's email settings (skipped only for addresses that cannot receive mail). Forgetting the password still uses
"Forgot your password?" on the sign-in page.
