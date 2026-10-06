# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Eljin Portal": an employee portal. React 19 + TypeScript + Vite 8 + Tailwind 4 + shadcn/Radix frontend at the repo root, Laravel 12 (PHP 8.2+, MySQL, Sanctum) API in `backend/`. There is **no external HRIS**: the portal is the HR system of record and HR types in all employee information by hand. Employee facts (display name, job title, department, location, company email, employment status/type, date joined, manager) live on the HR-maintained `directory_entries` record, linked to the login by `user_id`/`employee_id`. Portal `users` hold only `employee_id` (non-FK), email, password, status, roles. Payroll, leave balances, attendance, government IDs and similar data are deliberately not stored.

Root-level docs are the source of truth for contracts: `API.md` (frontend↔API contract, per-module migration status), `AUTHENTICATION.md`, `ADMIN.md`, `DATABASE.md`, `SECURITY.md`. `20.md`–`30.md` and `login.md` are phase prompt/notes files, not documentation.

## Commands

Frontend (repo root):
- `npm run dev` — Vite dev server on a fixed port, 5181 (`strictPort`: it stops with an error if that port is busy; the backend only accepts sign-in from the origins in `backend/.env`)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint (no test runner is configured on the frontend)

Backend (`cd backend`):
- `cp .env.example .env && php artisan key:generate && php artisan migrate --seed` — setup (MySQL db `eljin_portal`; demo data seeded only outside production)
- `php artisan serve` — API (port 8000 by default; this machine uses `--port=8001` because another project holds 8000, and root `.env` sets `VITE_API_BASE_URL` to match). `SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS` in `backend/.env` must list the frontend origin (`localhost:5181`)
- `php artisan test` (or `composer test`) — all tests; single: `php artisan test --filter=AuthorizationTest` or `php artisan test tests/Feature/AuthorizationTest.php`
- `vendor/bin/pint` — PHP formatting
- `php artisan` custom commands: `CreateAdminCommand`, `SetPasswordCommand` (in `app/Console/Commands`)

## Frontend architecture

Layering (UI code only imports the feature service; pages never call `fetch`):

`page/component → src/services/<feature>Service.ts → adapters/<feature>.mock.ts | <feature>.api.ts → src/data (mock) | src/services/api.ts → Laravel`

- `src/services/api.ts` is the single HTTP client (cookies, Sanctum CSRF, normalised errors, 401/403 hooks via `src/auth/ApiAuthHandlers.tsx`). Admin services are under `src/services/admin`.
- Two independent env switches: `VITE_AUTH_MODE` and `VITE_DATA_MODE` (`mock` | `api`). **Production builds always force `api`.** In API mode, failures must show the normal error/retry state — never silently fall back to mock data or fake success. Modules not yet migrated still read mock data (see the status table in `API.md`).
- Only public values may go in `VITE_*` vars (they are bundled into the browser).
- Auth: `AuthContext` + `authService`; route guards in `src/auth/RouteGuards.tsx`. Permissions are mirrored in `src/auth/permissions.ts`, `roles.ts`, `routePermissions.ts` — the UI copy only shapes the UI.
- Path alias `@` → `src/`. Shared hooks in `src/hooks`, validation/helpers in `src/lib`, UI primitives in `src/components/ui` (shadcn, see `components.json`).

## Backend architecture

- All routes in `backend/routes/api.php` under `/api`, Sanctum SPA cookie session auth (call `/sanctum/csrf-cookie` first). Authorization is enforced server-side in two layers: `permission:x` middleware (`EnsurePermission`; 401 signed out / 403 not permitted) and policies/scoped queries for ownership (another user's record returns **404**). Declare static route segments before `{id}` routes; ids are numeric.
- Roles (`employee, manager, hr, it, admin`) and permissions are defined in code in `app/Authorization/RolePermissions.php` — no API creates roles. **When changing permissions, update both this file and `src/auth/permissions.ts`.** `admin` = portal administration only; it grants nothing in payroll or attendance.
- Controllers in `app/Http/Controllers/Api` (admin ones in `Admin/` and `Admin/Hr/`); business logic in `app/Services` (`RequestService`, `ApprovalRouting`, `UserAdminService`, `PasswordLinks`, `Audit`, etc.); status/category values are PHP enums in `app/Enums`.
- Code that needs employee facts (profile `official` block, department-restricted documents in `Document::scopeAccessibleTo`/`DocumentPolicy`, approval routing) reads `User::directoryEntry`. No linked entry means "unknown", never "allowed". The `source`/`verification` columns on `directory_entries` are legacy and unused.
- Accounts: statuses active/pending/inactive/suspended; disabling deletes sessions; no hard deletes.
- Tests are PHPUnit in `backend/tests/{Feature,Unit}` (schema, seeders, relationships, authorization).
- Email (password links, first-sign-in codes, nothing else) goes through SMTP set in `backend/.env` (`MAIL_*`; currently Hostinger, `smtp.hostinger.com:465`, sent as the portal mailbox). The password lives only in `backend/.env` (git-ignored). `MAIL_MAILER=log` writes emails to `backend/storage/logs/laravel.log` instead, which is handy for development; tests never send mail.
- Speed: every API request costs a fixed ~0.2-0.4 s on this machine (Laravel boot; PHP's dev server handles one request at a time, so a dashboard's ~12 requests queue). `backend/serve-fast.cmd [port]` starts the API with opcache on (a dashboard load of 12 requests took 3.1 s instead of 4.8 s). `src/services/api.ts` does three things about it. (1) GETs asked for within 20 ms of each other are sent as ONE `GET /api/batch?paths[]=...` (`BatchController` runs each path through the router as the same user, so every route's own middleware, policies and validation still apply; GET paths under `/api` only, max 25, never `/api/auth/*`); the dashboard went from 12 requests to 1. (2) GET answers are remembered and shown at once (stale-while-revalidate): a page loaded through `useAsync` (which wraps its loader in `withRevalidation`) is given the remembered answer immediately, up to 5 min old (60 s notifications, 2 min admin), while a fresh copy is fetched in the background; if it differs the cache is updated and every `useAsync` page quietly reloads from it (`subscribeToFreshData`), so the screen corrects itself a moment later. Anything NOT loaded through `useAsync` (the `use*Browser` hooks, contexts) only gets answers younger than 10 s (5 s notifications/admin) because it cannot update itself. Answers younger than 3 s are never refetched, `/api/auth/*` is never cached, and the cache is emptied on every write, sign-in and sign-out. (3) In development Vite proxies `/api` and `/sanctum` to the API (`vite.config.ts`, `VITE_API_BASE_URL` empty in `.env`), so calls are same-origin and there are no CORS preflight (OPTIONS) requests (they used to double the request count).
