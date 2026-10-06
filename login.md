Build a professional **Login Page** for the existing **ELJIN CORPORATION EMPLOYEE PORTAL**.

This is a **frontend-only login page for now**. Do NOT implement real authentication, database authentication, password verification, SSO, LDAP, Active Directory, Microsoft Entra ID, or HRIS authentication yet.

The goal of this task is to create the complete login experience and prepare the architecture for the future authentication phase.

---

# 1. IMPORTANT PROJECT CONTEXT

Existing stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide React
* React Router

The existing portal already contains many completed modules, including:

* Employee Dashboard
* Company
* Employee Directory
* Documents
* Services
* Calendar
* Forms & Requests
* Notifications
* Employee Profile
* Announcements
* IT Helpdesk
* HR Services
* Recruitment & Careers
* Benefits
* Employee Resources
* Global Search
* Account Settings

The company already has an **HRIS on another server**.

Do not modify or duplicate HRIS functionality.

---

# 2. LOGIN ROUTE

Create:

```text
/login
```

The login page must be accessible directly through:

```text
/login
```

The existing portal routes should remain unchanged.

Do not yet enforce authentication on every route.

This is a UI and architecture preparation phase.

---

# 3. LOGIN PAGE PURPOSE

The page should feel like the official entrance to an internal corporate employee portal.

The user should immediately understand:

> ELJIN CORPORATION
> Employee Portal

The page should feel:

* corporate
* trustworthy
* established
* clean
* professional
* practical

It should NOT look like:

* a startup SaaS login
* an AI product
* a gaming website
* a generic Bootstrap template
* a flashy landing page

---

# 4. PAGE LAYOUT

Use a professional split layout on desktop.

Suggested structure:

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│       ELJIN CORPORATION      │       Welcome Back           │
│                              │                              │
│       Employee Portal        │       Sign in to continue    │
│                              │                              │
│       Corporate branding     │       Email / Employee ID    │
│       / subtle information   │       Password               │
│                              │       [ Sign In ]             │
│                              │                              │
│                              │       Forgot password?        │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

Do NOT create a giant marketing hero.

The branding panel should remain restrained.

---

# 5. DESKTOP BRANDING PANEL

On desktop, create a left-side branding panel.

Display:

```text
ELJIN CORPORATION

EMPLOYEE PORTAL
```

Include a short neutral description:

> Your central access point for employee services, company resources, forms, documents, and support.

Do not invent a corporate slogan.

Do not invent the company's official mission, vision, or values.

---

# 6. BRANDING PANEL DESIGN

Use the established ELJIN portal visual language.

Preferred:

* deep navy/dark blue
* subtle tonal variation
* white text
* restrained accent
* subtle geometric structure if needed

Avoid:

* huge gradients
* purple gradients
* glowing effects
* floating blobs
* 3D illustrations
* stock photography
* abstract AI artwork
* glassmorphism

A very subtle background pattern is acceptable if it improves the corporate appearance.

Keep it understated.

---

# 7. LOGIN PANEL

The right side should contain the login form.

Heading:

> Welcome Back

Supporting text:

> Sign in to access the Employee Portal.

Do not use:

> Welcome back, employee!

Keep the wording professional.

---

# 8. LOGIN FORM

Fields:

### Employee ID or Company Email

Label:

> Employee ID or Company Email

Placeholder:

> Enter your employee ID or company email

### Password

Label:

> Password

Placeholder:

> Enter your password

Password must use:

```html
type="password"
```

Do not display the password by default.

---

# 9. SHOW PASSWORD

Add a small eye icon button inside or beside the password field.

Use Lucide:

```text
Eye
EyeOff
```

Behavior:

```text
Hidden → Show password
Shown → Hide password
```

The button must have an accessible label.

Example:

```text
Show password
Hide password
```

Do not rely on the icon alone.

---

# 10. REMEMBER ME

Add:

```text
[ ] Remember me
```

This is UI-only for now.

Do not implement authentication persistence.

Do not store credentials.

If the checkbox is selected, it can simply be held in component state.

---

# 11. FORGOT PASSWORD

Add:

> Forgot your password?

For now, clicking it should NOT create a real password-reset system.

You can either:

1. route to a placeholder page, or
2. show a small informational dialog.

Preferred message:

> Password recovery will be available when Employee Portal authentication is connected.

Do not ask users to enter their password into an unofficial recovery form.

Do not implement password recovery yet.

---

# 12. SIGN IN BUTTON

Primary button:

> Sign In

Use the existing shadcn/ui Button component if available.

The button should be prominent but not oversized.

Use the corporate accent color.

---

# 13. FRONTEND-ONLY LOGIN BEHAVIOR

For now, implement a **demo login flow only**.

Do not pretend it is real authentication.

Possible behavior:

When the user submits valid-looking non-empty fields:

```text
Employee ID or Email:
test@example.com

Password:
••••••••
```

show a short loading state:

> Signing in...

Then display a development/demo message or navigate to the existing dashboard only if the project already has a clearly defined mock-auth mechanism.

Prefer creating a simple mock authentication abstraction rather than putting authentication logic directly into the page.

---

# 14. MOCK AUTH ARCHITECTURE

Create a future-compatible authentication abstraction.

Suggested:

```text
src/
├── context/
│   └── AuthContext.tsx
│
├── types/
│   └── auth.ts
│
├── services/
│   └── authService.ts
│
└── pages/
    └── auth/
        └── LoginPage.tsx
```

Adapt this to the existing architecture if equivalent files already exist.

Do NOT create duplicate AuthContext/AuthService if Phase 10 already has an authentication abstraction.

Reuse the existing one.

---

# 15. AUTHENTICATED USER

Use the existing:

```ts
AuthenticatedUser
```

model from Phase 10.

Do not create a second user model.

The eventual authenticated user should provide information already used by:

* Dashboard
* Profile
* Directory-related UI
* Notifications
* Requests
* Settings

---

# 16. MOCK LOGIN

If a mock login is necessary, keep it explicitly development/demo-only.

For example:

```text
Demo login
Employee ID: DEMO-001
Password: demo
```

However, do NOT prominently display fake credentials on the production-looking login page.

If the project already has a development environment indicator, use that.

Do not create hard-coded real-looking employee credentials.

---

# 17. LOGIN VALIDATION

Implement basic frontend validation:

Employee ID/email:

* required

Password:

* required

Show appropriate messages.

Examples:

> Employee ID or company email is required.

> Password is required.

Do not implement complex password policy validation yet.

The backend will eventually handle authentication validation.

---

# 18. LOGIN ERROR STATE

Prepare the UI for backend authentication errors.

Example:

> We couldn't sign you in with those credentials.

Do not reveal whether:

* the employee ID exists
* the email exists
* the password was correct

Use a generic authentication error.

This will be important for future security.

---

# 19. LOADING STATE

When submitting:

Button becomes:

> Signing in...

Disable:

* submit button
* login inputs if appropriate

Prevent duplicate submissions.

Restore the form if the login fails.

---

# 20. SUCCESS REDIRECT

For mock authentication only, redirect to:

```text
/
```

after successful demo authentication.

The existing Employee Dashboard should then load normally.

Do not create a new dashboard.

---

# 21. RETURN URL

Prepare the architecture for future redirect behavior.

Example:

```text
/login?returnUrl=/documents
```

If authentication is eventually enforced, the user can return to the page they originally requested.

For now, do not implement complex redirect handling unless it fits cleanly.

Do not allow arbitrary external URLs.

Only allow internal portal routes.

---

# 22. MOBILE DESIGN

On mobile, do NOT keep the desktop split layout.

Use:

```text
ELJIN CORPORATION
EMPLOYEE PORTAL

Welcome Back

[ Employee ID / Email ]
[ Password ]

[ ] Remember me

[ Sign In ]

Forgot your password?
```

The branding area should become compact.

Do not create excessive vertical spacing.

The login form should fit comfortably on common phone screens.

---

# 23. LOGO

If an official ELJIN CORPORATION logo already exists in the project, use it.

Before adding a new logo asset, inspect the existing project assets.

Do NOT invent or redesign the corporate logo.

If no official logo exists, use a clean text-based:

> ELJIN CORPORATION

wordmark treatment as a temporary placeholder.

Do not create a fake official logo.

---

# 24. FOOTER

Add a minimal login footer.

Example:

> © 2026 ELJIN CORPORATION • Employee Portal

Do not invent:

* corporate address
* phone number
* email address
* legal information

Optional links:

```text
Help
Privacy
```

Only include them if corresponding routes/content already exist.

---

# 25. SECURITY MESSAGING

A small subtle message may appear below the form:

> For authorized employees only.

This is appropriate for an internal corporate portal.

Do not use threatening or exaggerated security language.

---

# 26. AUTHENTICATION NOTICE

Because this phase is frontend-only, do not expose technical implementation details to normal users.

Do not display:

> Mock authentication
> LocalStorage authentication
> Demo authentication

on the production-looking login page.

Keep development-only information in code/comments or development tooling.

---

# 27. NO CREDENTIAL STORAGE

Absolutely do NOT:

* store passwords in localStorage
* store passwords in sessionStorage
* encode passwords and store them
* create fake password hashes
* log passwords
* put passwords in URLs
* put passwords in query parameters

The current mock flow should only simulate the authentication process.

---

# 28. PASSWORD AUTOCOMPLETE

Use appropriate browser autocomplete attributes.

Example:

```html
autocomplete="username"
```

for the employee ID/email field.

```html
autocomplete="current-password"
```

for password.

Do not disable browser password managers unnecessarily.

---

# 29. ACCESSIBILITY

Implement:

* proper form labels
* keyboard navigation
* visible focus states
* accessible password visibility control
* accessible checkbox
* accessible error messages
* accessible loading state
* semantic form structure

The form should work fully with keyboard navigation.

---

# 30. VISUAL STYLE

Maintain the established ELJIN CORPORATION corporate design.

Use:

* deep navy
* white/off-white
* neutral gray
* restrained accent color
* subtle borders
* minimal shadows
* professional typography
* lightly rounded or mostly square controls

Avoid:

* purple
* giant gradients
* glassmorphism
* excessive rounded cards
* giant buttons
* huge typography
* excessive shadows
* animated backgrounds
* illustrations
* stock photos
* AI-generated visual styling

The login page should look like an established Philippine corporate intranet.

---

# 31. RESPONSIVE BREAKPOINTS

Ensure the login page works at:

* desktop
* laptop
* tablet
* mobile

Test approximately:

```text
1920px
1440px
1024px
768px
480px
375px
```

Do not allow:

* horizontal scrolling
* clipped form fields
* overlapping elements
* inaccessible buttons
* excessive empty space

---

# 32. ROUTE PROTECTION — DO NOT IMPLEMENT YET

Do NOT protect every route in this phase.

Do NOT automatically redirect:

```text
/
```

to:

```text
/login
```

unless the existing project already has an explicit mock-auth system that requires it.

Authentication enforcement will be part of the later authentication phase.

The current objective is to create the login experience safely without breaking the existing development environment.

---

# 33. FUTURE AUTHENTICATION ARCHITECTURE

Prepare for:

```text
React
  ↓
Laravel API
  ↓
Authentication
  ↓
MySQL
```

Potential future endpoints:

```text
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Do NOT implement these APIs now.

Do NOT make browser calls to HRIS.

---

# 34. FUTURE AUTHENTICATION OPTIONS

The architecture should eventually allow integration with one or more of:

* Laravel authentication
* company Active Directory
* Microsoft Entra ID
* SSO

But do not implement any of them now.

Do not assume which authentication provider the company will use.

Keep the frontend authentication abstraction provider-agnostic.

---

# 35. SESSION ARCHITECTURE

Prepare the AuthContext for future state such as:

```ts
interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

Possible methods:

```ts
login()
logout()
refreshUser()
```

Do not implement real token handling yet.

Do not store authentication tokens in localStorage as part of this phase.

---

# 36. EXISTING PROFILE INTEGRATION

After mock login, the existing portal should continue to derive employee information from the centralized user model.

Do not create:

```text
LoginUser
PortalUser
DashboardUser
ProfileUser
```

as separate competing models.

Use:

```text
AuthenticatedUser
```

as the central model.

---

# 37. SETTINGS INTEGRATION

The new login page must not interfere with Phase 21:

```text
/account/settings
```

Portal preferences remain separate from authentication credentials.

Do not put notification settings or UI preferences into the authentication model.

---

# 38. NAVIGATION

The login page should NOT display the full employee portal navbar.

Do not show:

* Directory
* Documents
* Services
* Calendar
* Notifications
* Profile menu

until the user enters the authenticated portal experience.

The login page should have its own minimal header/branding.

---

# 39. PAGE TITLE

Set the browser document title appropriately.

Example:

> Sign In | ELJIN CORPORATION Employee Portal

Use the project's existing document-title approach if one exists.

---

# 40. NO PUBLIC MARKETING CONTENT

The login page is not a company marketing page.

Do not add:

* company history
* mission/vision
* company statistics
* careers promotion
* testimonials
* marketing slogans
* public news

Keep it focused on employee authentication.

---

# 41. QUALITY CHECK

Before finishing:

1. Verify `/login` loads.
2. Verify the form is responsive.
3. Verify required-field validation.
4. Verify password visibility toggle.
5. Verify remember-me state.
6. Verify loading state.
7. Verify generic login error state.
8. Verify mock successful login if implemented.
9. Verify redirect to `/`.
10. Verify existing dashboard remains functional.
11. Verify existing navigation is not shown on the login page.
12. Verify keyboard navigation.
13. Verify accessibility.
14. Verify mobile layout.
15. Verify no passwords are stored.
16. Verify no authentication tokens are stored.
17. Verify no real API calls are made.
18. Verify no HRIS connection is introduced.
19. Verify TypeScript compilation.
20. Verify production build.
21. Verify no unrelated modules are rewritten.

---

# 42. IMPORTANT — DO NOT IMPLEMENT PHASE 22 YET

Do NOT proceed into full authentication/access-control implementation.

Specifically do NOT implement:

* real Laravel login
* database authentication
* password hashing
* session authentication
* JWT
* Sanctum
* OAuth
* Microsoft SSO
* Active Directory
* Entra ID
* route guards
* role-based permissions
* password reset backend
* MFA

Those will be handled separately.

---

# FINAL RESULT

The portal should now have a polished:

```text
/login
```

experience that looks like the official entrance to the ELJIN CORPORATION Employee Portal.

The architecture should be ready for future real authentication without prematurely tying the frontend to a specific authentication provider.

Keep the implementation:

* corporate
* professional
* responsive
* accessible
* secure by design
* lightweight
* maintainable
* compatible with the existing portal
* ready for future Laravel authentication
