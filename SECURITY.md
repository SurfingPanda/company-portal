# Security and Production Configuration (Phase 28)

The React app is an **untrusted client**. Route guards, permission checks, hidden or disabled buttons and client-side
validation only shape the UI. Laravel enforces authentication, authorization, ownership, validation, file rules and rate
limits on every request (see `API.md` and `AUTHENTICATION.md`).

## What is enforced where

| Concern | Enforcement |
| --- | --- |
| Authentication | Sanctum SPA session cookie (HttpOnly, SameSite=Lax, Secure in production). No token in browser storage. Generic 401; 403 only after a correct password for inactive accounts. |
| CSRF | Stateful requests need the `X-XSRF-TOKEN` header (verified: POST/PUT/DELETE without it return 419). CSRF is never disabled. |
| CORS | `config/cors.php`: exact origins from `CORS_ALLOWED_ORIGINS`, credentials on, no `*`, only the headers the client sends. |
| Authorization | `permission:` middleware (role) + policies and owner-scoped queries. Another person's record answers **404**, identical to a missing one, so ids cannot be probed. |
| Identity | The acting user is always `$request->user()`. `user_id`, `employee_id`, roles, status, reference numbers, sample flags and storage paths are never mass-assignable and are ignored if sent. |
| Workflow | Employees can only draft, submit, edit drafts and cancel. Staff moves go through a small server-side transition table (`RequestService::STAFF_TRANSITIONS`); anything else is 409. |
| Validation | Form Requests on every write: lengths, enums, dates, emails, array sizes (`form_data` max 60 keys), file type/size. Lists: `per_page` max 100, `search` max 100 chars, `sort`/`direction` whitelisted, filters validated, `LIKE` with bound parameters and escaped wildcards. |
| Uploads | Extension allow-list **and** content-sniffed MIME type, 5 MB, private `local` disk, server-generated filenames, no path ever returned. Requests/tickets: pdf, doc(x), xls(x), jpg, png, txt. Resumes: pdf, doc, docx. SVG, HTML, scripts and executables are rejected. There is no avatar upload; `avatar_url` accepts `https://` addresses only. |
| Errors | One JSON shape with fixed messages; no stack traces, SQL, paths or class names, even when `APP_DEBUG=true`. |
| Logging | Failed sign-ins are logged as warnings with a hash of the identifier and the IP, never the password. Activity records (login, logout, request, ticket, application, referral, profile, document view) hold short descriptions only. |
| Rate limits (HTTP 429, `Retry-After`) | Login 5 failures/min per account+IP and 20/min per IP; API 240/min; writes 30/min; uploads 20/min; search 60/min. |
| Headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Resource-Policy`; API responses: `Content-Security-Policy: default-src 'none'` and `Cache-Control: no-store`; HSTS in production over HTTPS. |
| Data exposure | API Resources return only the fields the UI needs. Tests scan responses for `password`, `remember_token`, storage/resume paths, internal notes and user ids. |
| Privacy | Search covers only entities the user may see (documents by access level, published content). Notification links only navigate; the target page still passes Laravel authorization. The directory is sample/mock data (business fields only); no directory API exists yet. |

## React frontend

- `localStorage` holds only portal preferences and recent searches. In development mock mode a non-sensitive sample-account
  marker is stored; it does not exist in production builds. No passwords, tokens or HR data are stored anywhere.
- No `console.log`, `dangerouslySetInnerHTML` or `innerHTML`; user text renders through React (escaped).
- `VITE_*` variables are public (compiled into the bundle). Never put secrets there.
- 401 clears the session once and redirects to `/login` (never for `/api/auth/*`, so no redirect loop); 403 opens `/unauthorized`; 429 shows "Too many requests. Please wait a moment and try again."

### Content-Security-Policy for the React app (set on the web server serving `dist/`)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' <api-origin>;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`style-src 'unsafe-inline'` is needed by inline styles in the UI libraries; `img-src https:` allows avatar URLs. Replace
`<api-origin>` with the real API origin. Verify the production build under these headers before go-live.

## Production checklist

Use `backend/.env.production.example` (placeholders only) as the template; set real values on the server only.

```
APP_ENV=production        APP_DEBUG=false        APP_URL=<production-api-url>
DB_HOST/DB_DATABASE/DB_USERNAME/DB_PASSWORD   (least-privilege user; DB not reachable from the internet)
SESSION_SECURE_COOKIE=true  SESSION_SAME_SITE=lax  SESSION_ENCRYPT=true  SESSION_DOMAIN=<shared-parent-domain>
SANCTUM_STATEFUL_DOMAINS=<portal-host>   CORS_ALLOWED_ORIGINS=<https://portal-origin>
Frontend build: VITE_API_BASE_URL=<production-api-url>   (production builds force API mode)
```

- Serve everything over HTTPS; terminate TLS before Laravel and trust the proxy so `isSecure()` is true.
- Run `php artisan migrate --force`, **never** `db:seed` demo data (the seeders refuse to create demo accounts in production).
- `php artisan config:cache route:cache`; keep `storage/` and `.env` outside the web root; the web root is `backend/public`.
- Run `npm audit` and `composer audit` in CI. Last run: 0 vulnerabilities in both.

## Remaining recommendations

- Add MFA/SSO and a password reset flow in their own phases (out of scope here).
- Antivirus scanning of uploaded files (e.g. ClamAV) before staff download them, once a download endpoint exists.
- Serve the React app headers from the real web server and re-test (the CSP above is a starting point).
- Configure log shipping and alerting on repeated `Sign-in failed` warnings.
- Review `avatar_url`: external https images can leak the viewer's IP to the image host; host avatars on the portal when avatar upload is built.
- Back up the database and test restores; rotate `APP_KEY` only with a plan for existing sessions.
