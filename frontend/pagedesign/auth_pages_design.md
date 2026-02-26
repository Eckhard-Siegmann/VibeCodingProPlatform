# Authentication Pages Design

**Routes**: `/login`, `/register`, `/forgot-password`, `/set-password`, `/confirm-email`
**Status**: New Specification
**Created**: 2026-02-25

---

## Overview

Authentication pages handle user registration, login, password management, and email confirmation. All pages share a centered card layout on the viewport background — no header, no sidebar, no dashboard chrome. The VibeCoding logo and name anchor the top of each card.

**Philosophy**: "Low barrier, high trust" — minimal fields, clear feedback, fast paths to participation. OAuth buttons are prominent (most users are developers). Error messages are specific and actionable.

**Specification Sources**: Ch.18 (Authentication), Ch.30 (Registration & Onboarding), ADR 004 (Auth Providers), ADR 007 (Sessions)

---

## Shared Layout: Auth Shell

All auth pages use the same centered layout — no PageContainer, no Header component.

**Background**: `--color-viewport` (#DCEBFF) — full viewport
**Card**: Centered, max-w-md (448px), elevation="raised", border-radius 16px

```
┌──────────────────────────── viewport (#DCEBFF) ────────────────────────────┐
│                                                                            │
│                    ┌──────────────────────────┐                             │
│                    │                          │                             │
│                    │   [Logo]                 │                             │
│                    │   VibeCoding             │                             │
│                    │   Professionals          │                             │
│                    │                          │                             │
│                    │   ─── page content ───   │                             │
│                    │                          │                             │
│                    └──────────────────────────┘                             │
│                                                                            │
│                    Powered by VibeCoding Community                          │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card Header** (shared across all auth pages):
- Logo: SVG or text mark, 48px height, centered
- Title: "VibeCoding Professionals", text-xl, font-bold, text-headers, centered
- Subtitle: Page-specific (e.g., "Sign in to your account"), text-sm, text-labels, centered

**Footer** (below card):
- "Powered by VibeCoding Community", text-xs, text-meta (#7F91AF), centered
- Privacy Policy and Terms links, text-xs

**Responsive**:
- Desktop (≥640px): Card centered with shadow, generous vertical padding
- Mobile (<640px): Card fills viewport width, no horizontal margin, min-height 100vh

---

## Page 1: Login (`/login`)

### Route
`/login`
**Query params**: `?redirect=/path` (optional, redirect after successful login)

### Component: `routes/login/+page.svelte`

### Layout

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    Sign in to your account   │  ← subtitle
│                              │
│ ┌──────────────────────────┐ │
│ │  🔗 Sign in with GitHub  │ │  ← full-width, variant="outline", h-12
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │  🔗 Sign in with LinkedIn│ │  ← full-width, variant="outline", h-12
│ └──────────────────────────┘ │
│                              │
│ ──── or continue with ────── │  ← divider with text
│                              │
│  Email                       │
│ ┌──────────────────────────┐ │
│ │  you@example.com         │ │  ← input, type="email", autocomplete
│ └──────────────────────────┘ │
│                              │
│  Password                    │
│ ┌──────────────────────────┐ │
│ │  ••••••••••              │ │  ← input, type="password", toggle visibility
│ └──────────────────────────┘ │
│                              │
│  ☐ Remember me      Forgot? │  ← checkbox + link, same row
│                              │
│ ┌──────────────────────────┐ │
│ │      Sign In             │ │  ← Button variant="default", full-width, h-12
│ └──────────────────────────┘ │
│                              │
│  Don't have an account?      │
│  Create one →                │  ← link to /register
│                              │
└──────────────────────────────┘
```

### Field Specifications

| Field | Type | Validation | Autocomplete |
|-------|------|------------|--------------|
| Email | `input[type="email"]` | Required, valid email format | `email` |
| Password | `input[type="password"]` | Required, min 1 char | `current-password` |
| Remember me | Checkbox | Optional, default unchecked | — |

### Password Visibility Toggle

Eye icon button inside the password input field:
- Default: password hidden (dots)
- Click: toggles to `type="text"` (show password)
- Icon: `Eye` / `EyeOff` from lucide-svelte
- Position: absolute right inside input, vertically centered

### OAuth Buttons

- GitHub: Icon (GitHub mark) + "Sign in with GitHub"
- LinkedIn: Icon (LinkedIn mark) + "Sign in with LinkedIn"
- Both: `variant="outline"`, full-width, h-12, gap-2 between icon and text
- Hover: subtle background shift (`bg-canvas`)
- Loading state: Spinner replaces icon, text changes to "Redirecting..."

### Error States

| Error | Display |
|-------|---------|
| Invalid credentials | Red alert below form: "Invalid email or password. Please try again." |
| Account disabled | Red alert: "This account has been deactivated. Contact an administrator." |
| OTP pending | Yellow alert: "You need to set your password first." + link to `/set-password` |
| OAuth failure | Red alert: "Authentication with {provider} failed. Please try again." |
| Rate limited | Yellow alert: "Too many login attempts. Please wait {seconds} seconds." |

Error alerts use the existing alert pattern: `bg-red-50 border-l-4 border-alert text-alert` (red) or `bg-yellow-50 border-l-4 border-pending text-pending` (yellow).

### Success Flow

1. Validate credentials server-side
2. Create session (ADR 007)
3. Set HTTP-only cookie
4. Redirect to `?redirect` param or `/` (dashboard)

### Accessibility

- Form uses `<form>` element with `method="POST"` action
- Labels associated with inputs via `for`/`id`
- Error messages use `role="alert"` with `aria-live="polite"`
- Focus moves to first error field on validation failure
- OAuth buttons have `aria-label="Sign in with {provider}"`

---

## Page 2: Registration (`/register`)

### Route
`/register`
**Query params**: `?redirect=/path` (optional), `?event=slug` (pre-fill event registration)

### Component: `routes/register/+page.svelte`

### Layout

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    Create your account       │  ← subtitle
│                              │
│ ┌──────────────────────────┐ │
│ │  🔗 Sign up with GitHub  │ │  ← full-width, variant="outline", h-12
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │  🔗 Sign up with LinkedIn│ │  ← full-width, variant="outline", h-12
│ └──────────────────────────┘ │
│                              │
│ ──── or register with ────── │  ← divider with text
│                              │
│  Display Name                │
│ ┌──────────────────────────┐ │
│ │  Max Mustermann          │ │  ← input, type="text"
│ └──────────────────────────┘ │
│                              │
│  Email                       │
│ ┌──────────────────────────┐ │
│ │  you@example.com         │ │  ← input, type="email"
│ └──────────────────────────┘ │
│                              │
│  Password                    │
│ ┌──────────────────────────┐ │
│ │  ••••••••••              │ │  ← input, type="password", toggle
│ └──────────────────────────┘ │
│  Password strength:  ████░░  │  ← strength indicator bar
│  ✓ 10+ characters           │
│  ✓ Uppercase letter          │
│  ✗ Number                    │  ← red when not met
│                              │
│  ☑ I accept the Terms &     │
│    Conditions                │  ← required checkbox, "Terms" is link
│                              │
│  ☑ Subscribe to community   │
│    newsletter                │  ← default checked (opt-out)
│                              │
│ ┌──────────────────────────┐ │
│ │    Create Account        │ │  ← Button variant="default", full-width
│ └──────────────────────────┘ │
│                              │
│  Already have an account?    │
│  Sign in →                   │  ← link to /login
│                              │
└──────────────────────────────┘
```

### Field Specifications

| Field | Type | Validation | Autocomplete |
|-------|------|------------|--------------|
| Display Name | `input[type="text"]` | Required, 2-100 chars | `name` |
| Email | `input[type="email"]` | Required, valid email, unique check | `email` |
| Password | `input[type="password"]` | Required, policy check (see below) | `new-password` |
| T&C acceptance | Checkbox | Required (must be checked) | — |
| Newsletter | Checkbox | Optional, default checked | — |

### Password Policy Indicators

Real-time validation shown below the password field:

| Rule | Icon when met | Icon when not met |
|------|---------------|-------------------|
| 10+ characters | ✓ green (`text-success`) | ✗ red (`text-alert`) |
| Uppercase letter | ✓ green | ✗ red |
| Lowercase letter | ✓ green | ✗ red |
| Number | ✓ green | ✗ red |

**Strength bar**: 4-segment bar below the password field.
- 0 rules met: empty (gray)
- 1-2 rules met: 1-2 segments red
- 3 rules met: 3 segments yellow
- 4 rules met: 4 segments green

Icons: `Check` and `X` from lucide-svelte, size 14px, inline with text.

### Email Uniqueness Check

On email field blur:
1. Client sends `GET /api/auth/check-email?email=...`
2. If email exists: Show yellow info below field: "This email is already registered. [Sign in instead](/login)"
3. If new: No message (silent success)
4. Loading: Subtle spinner in field

### OAuth Registration Flow

1. User clicks "Sign up with GitHub/LinkedIn"
2. Redirect to provider
3. On return with new email: Show T&C + newsletter form (compact, no password field)
4. On return with existing email: Auto-link, show success toast, redirect

**Post-OAuth form** (shown only for new accounts via OAuth):

```
┌──────────────────────────────┐
│    Almost there!             │
│                              │
│    Signed in as:             │
│    max@example.com (GitHub)  │
│                              │
│  Display Name                │
│ ┌──────────────────────────┐ │
│ │  Max Mustermann          │ │  ← pre-filled from OAuth profile
│ └──────────────────────────┘ │
│                              │
│  ☑ I accept the Terms &     │
│    Conditions                │
│                              │
│  ☑ Subscribe to community   │
│    newsletter                │
│                              │
│ ┌──────────────────────────┐ │
│ │    Complete Registration │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Error States

| Error | Display |
|-------|---------|
| Email already exists | Yellow info: "This email is already registered. [Sign in instead](/login)" |
| Password too weak | Red indicators on unmet rules (inline, real-time) |
| T&C not accepted | Red text below checkbox: "You must accept the Terms & Conditions" |
| Server error | Red alert: "Registration failed. Please try again." |

### Success Flow (Email + Password)

1. Create user with `login_enabled = TRUE`, `email_confirmed = FALSE`
2. Generate email confirmation hash, store hash + expiry (24h)
3. Send confirmation email via Brevo (transactional)
4. Create session, set cookie
5. Redirect to confirmation-pending page:

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    ✓ Account Created!        │  ← text-success, text-xl
│                              │
│    We've sent a confirmation │
│    email to:                 │
│                              │
│    max@example.com           │  ← font-medium
│                              │
│    Click the link in the     │
│    email to confirm your     │
│    address and receive       │
│    newsletters and event     │
│    reminders.                │
│                              │
│    You can already browse    │
│    events and start using    │
│    the platform.             │
│                              │
│ ┌──────────────────────────┐ │
│ │    Go to Dashboard       │ │  ← Button variant="default"
│ └──────────────────────────┘ │
│                              │
│    Didn't receive it?        │
│    [Resend confirmation]     │  ← link, rate limited
│                              │
└──────────────────────────────┘
```

### Resend Confirmation Behavior

The "Resend confirmation" link calls `POST /api/auth/resend-confirmation` via `fetch()` (user is authenticated — session created during registration). The same 60-second UI cooldown pattern used on the Forgot Password resend applies here:

1. On click → `fetch()` call to API → show "Sending..."
2. On success → start 60-second local countdown timer
3. During cooldown → button disabled, shows "Resend confirmation (available in {N}s)"
4. After cooldown → re-enable button
5. On error → show inline error text, re-enable button

**States**:
- Default: `text-primary hover:underline` — "Resend confirmation"
- Sending: `text-meta cursor-not-allowed` — "Sending..."
- Cooldown: `text-meta cursor-not-allowed` — "Resend confirmation (available in 42s)"
- Error: `text-alert` — inline error below link

**Rate limiting**: Server-side rate limiting is NOT required for this endpoint (unlike forgot-password) because it requires authentication. The 60-second client-side cooldown provides sufficient UX protection.

---

## Page 3: Forgot Password (`/forgot-password`)

### Route
`/forgot-password`

### Component: `routes/forgot-password/+page.svelte`

### Layout

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    Reset your password       │  ← subtitle
│                              │
│    Enter your email address  │
│    and we'll send you a      │
│    one-time password to      │
│    reset it.                 │  ← text-sm, text-labels
│                              │
│  Email                       │
│ ┌──────────────────────────┐ │
│ │  you@example.com         │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │    Send Reset Code       │ │  ← Button variant="default", full-width
│ └──────────────────────────┘ │
│                              │
│  ← Back to sign in          │  ← link to /login
│                              │
└──────────────────────────────┘
```

### Success State (replaces form)

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    ✉ Check your email        │  ← text-xl
│                              │
│    We've sent a one-time     │
│    password to:              │
│                              │
│    max@example.com           │  ← font-medium
│                              │
│    Use it on the password    │
│    reset page to set a new   │
│    password.                 │
│                              │
│ ┌──────────────────────────┐ │
│ │    Set New Password      │ │  ← Button, links to /set-password?email=...
│ └──────────────────────────┘ │
│                              │
│    Didn't receive it?        │
│    [Send again] (available   │
│    in 60s)                   │  ← cooldown timer
│                              │
└──────────────────────────────┘
```

### Security

- Always show success message, even if email doesn't exist (prevent email enumeration)
- Rate limit: max 3 requests per email per hour (ADR 004)
- Cooldown: 60 seconds between requests for same email, shown as countdown

---

## Page 4: Set Password (`/set-password`)

### Route
`/set-password`
**Query params**: `?email=user@example.com` (optional, pre-fills email field)

### Purpose
Used for two flows:
1. **CSV-imported users**: First-time password setup with OTP from onboarding email
2. **Password reset**: Setting new password after receiving OTP from forgot-password flow

### Component: `routes/set-password/+page.svelte`

### Layout

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    Set your password         │  ← subtitle
│                              │
│    Enter the one-time        │
│    password from your email  │
│    and choose a new          │
│    password.                 │  ← text-sm, text-labels
│                              │
│  Email                       │
│ ┌──────────────────────────┐ │
│ │  you@example.com         │ │  ← pre-filled if ?email param
│ └──────────────────────────┘ │
│                              │
│  One-Time Password           │
│ ┌──────────────────────────┐ │
│ │  ABC123DEF456            │ │  ← input, monospace font, uppercase
│ └──────────────────────────┘ │
│                              │
│  New Password                │
│ ┌──────────────────────────┐ │
│ │  ••••••••••              │ │  ← input, type="password", toggle
│ └──────────────────────────┘ │
│  ✓ 10+ characters           │  ← same policy indicators as register
│  ✓ Uppercase letter          │
│  ✓ Lowercase letter          │
│  ✓ Number                    │
│                              │
│  Confirm Password            │
│ ┌──────────────────────────┐ │
│ │  ••••••••••              │ │  ← must match new password
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │    Set Password          │ │  ← Button variant="default", full-width
│ └──────────────────────────┘ │
│                              │
│  ← Back to sign in          │  ← link to /login
│                              │
└──────────────────────────────┘
```

### Field Specifications

| Field | Type | Validation | Autocomplete |
|-------|------|------------|--------------|
| Email | `input[type="email"]` | Required | `email` |
| OTP | `input[type="text"]` | Required, 12 chars alphanumeric | `one-time-code` |
| New Password | `input[type="password"]` | Required, policy check | `new-password` |
| Confirm Password | `input[type="password"]` | Required, must match new password | `new-password` |

### OTP Field

- Monospace font (`font-mono`)
- Uppercase display via CSS (`uppercase`)
- 12-character alphanumeric
- No spaces or dashes (stripped on input)

### Error States

| Error | Display |
|-------|---------|
| Invalid OTP | Red alert: "Invalid one-time password. Please check your email and try again." |
| OTP already used | Red alert: "This one-time password has already been used. [Request a new one](/forgot-password)" |
| Password mismatch | Red text below confirm: "Passwords do not match." |
| Password too weak | Red indicators on unmet rules (inline, real-time) |

### Success Flow

1. Verify OTP against stored hash
2. Store new password hash (bcrypt, cost 12)
3. Set `login_enabled = TRUE`, clear `otp_hash`, `otp_is_initial = FALSE`
4. Delete all existing sessions for user (force re-auth)
5. Create new session, set cookie
6. Show success toast: "Password set successfully!"
7. Redirect to `/` (dashboard)

---

## Page 5: Email Confirmation (`/confirm-email`)

### Route
`/confirm-email`
**Query params**: `?hash={confirmation_hash}` (required)

### Purpose
Handles the email confirmation link click. This is a **processing page**, not a form.

### Component: `routes/confirm-email/+page.svelte`

### Server-Side Logic (`+page.server.ts`)

1. Extract `hash` from query params
2. Look up user by `email_confirm_hash` match
3. Check `email_confirm_expires_at > now`
4. If valid: Set `email_confirmed = TRUE`, clear hash fields
5. Pass result to page component

### Success State

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    ✓ Email Confirmed!        │  ← text-success, text-xl
│                              │
│    Your email address has    │
│    been verified. You'll     │
│    now receive newsletters   │
│    and event reminders.      │
│                              │
│ ┌──────────────────────────┐ │
│ │    Go to Dashboard       │ │  ← Button variant="default"
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Expired State

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    ⚠ Link Expired            │  ← text-pending, text-xl
│                              │
│    This confirmation link    │
│    has expired (valid for    │
│    24 hours).                │
│                              │
│ ┌──────────────────────────┐ │
│ │  Resend Confirmation     │ │  ← Button variant="default"
│ └──────────────────────────┘ │
│                              │
│  ← Back to sign in          │
│                              │
└──────────────────────────────┘
```

### Invalid/Already Confirmed State

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    ℹ Already Confirmed       │  ← text-primary, text-xl
│                              │
│    Your email address is     │
│    already confirmed.        │
│                              │
│ ┌──────────────────────────┐ │
│ │    Go to Dashboard       │ │  ← Button variant="default"
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

---

## Page 6: OAuth Completion (`/auth/complete`)

### Route
`/auth/complete`
**No query params** — OAuth data is carried in the `oauth_pending` HTTP-only cookie (set by the OAuth callback).

### Purpose
Shown to new users who authenticated via GitHub/LinkedIn but whose email does not match an existing account. They must accept T&C before account creation is finalized.

### Guard
If the `oauth_pending` cookie is absent or expired, redirect to `/login` with error message.

### Component: `routes/auth/complete/+page.svelte`

### Layout

```
┌──────────────────────────────┐
│         [Logo]               │
│    VibeCoding Professionals  │
│                              │
│    Almost there!             │  ← subtitle
│                              │
│    Signed in as:             │
│    max@example.com (GitHub)  │  ← from oauth_pending cookie
│                              │
│  Display Name                │
│ ┌──────────────────────────┐ │
│ │  Max Mustermann          │ │  ← pre-filled from OAuth profile
│ └──────────────────────────┘ │
│                              │
│  ☑ I accept the Terms &     │
│    Conditions                │  ← required, "Terms" is link
│                              │
│  ☑ Subscribe to community   │
│    newsletter                │  ← default checked (opt-out)
│                              │
│ ┌──────────────────────────┐ │
│ │  Complete Registration   │ │  ← Button variant="default", full-width
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Field Specifications

| Field | Type | Validation | Pre-filled |
|-------|------|------------|------------|
| Display Name | `input[type="text"]` | Required, 2-100 chars | From OAuth profile |
| T&C acceptance | Checkbox | Required (must be checked) | Unchecked |
| Newsletter | Checkbox | Optional, default checked | Checked |

### Success Flow

1. Validate T&C accepted
2. Read `oauth_pending` cookie (provider, provider_user_id, email, display_name)
3. Create user: `auth_provider = '{provider}'`, `email_confirmed = TRUE`, `login_enabled = TRUE`, no password
4. Set `github_id` or `linkedin_id` on the user record
5. Create session, clear `oauth_pending` cookie
6. Show success toast: "Welcome to VibeCoding!"
7. Redirect to `/`

### Error States

| Error | Display |
|-------|---------|
| Cookie missing/expired | Redirect to `/login` with flash: "OAuth session expired. Please try again." |
| T&C not accepted | Red text below checkbox: "You must accept the Terms & Conditions" |
| Email taken (race condition) | Red alert: "This email was registered while you were completing setup. [Sign in instead](/login)" |

---

## Shared Component: Email Confirmation Banner

**Purpose**: Persistent reminder for unconfirmed users (Ch. 18.5)
**Location**: Below the site header, above page content, on all authenticated pages
**Component**: `layout/EmailConfirmBanner.svelte`

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠ Please confirm your email address to receive event            │
│   reminders and newsletters.  [Resend confirmation email]   [✕] │
└──────────────────────────────────────────────────────────────────┘
```

**Styling**:
- Background: `bg-yellow-50` (light warning)
- Border: `border-b border-pending`
- Text: `text-sm text-labels`
- Link: `text-primary underline`
- Dismiss: `✕` button (hides for current session only — reappears on next login)

**Visibility**:
- Shown when `user.email_confirmed === false`
- Hidden after user confirms or dismisses
- Dismissal stored in `sessionStorage` (not permanent — reminds again next session)

---

## Shared Component: Divider with Text

Used on login and register pages for "or continue with" / "or register with".

```svelte
<div class="relative my-6">
  <div class="absolute inset-0 flex items-center">
    <div class="w-full border-t border-secondary"></div>
  </div>
  <div class="relative flex justify-center text-xs">
    <span class="bg-card px-4 text-meta">or continue with</span>
  </div>
</div>
```

---

## Form Behavior

### Submit Handling

All auth forms use progressive enhancement:
- `<form method="POST">` with SvelteKit form actions
- Client-side validation runs first (instant feedback)
- Server-side validation is authoritative
- Loading state: Button shows spinner + "Signing in..." / "Creating account..." text
- Button disabled during submission (prevent double-submit)

### Client-Side Validation

Real-time validation on field blur:
- Email: Valid email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Password: Policy rules checked character-by-character as user types
- Required fields: Red border + "Required" text on blur if empty

### Server Error Handling

Server responses return `{ success: boolean, error?: string, field?: string }`:
- If `field` is present: highlight that specific field with error
- If no `field`: show error as alert at top of form
- On success: redirect via `303 See Other`

---

## Mobile Specifications (<640px)

All auth pages on mobile:
- Card fills full viewport width (no side margins)
- Padding: `px-6 py-8`
- All buttons: full-width, h-12 (48px touch target)
- Input fields: h-12 (48px), text-base (16px — prevents iOS zoom)
- OAuth buttons stack vertically with gap-3
- "Remember me" row: checkbox + label left, "Forgot?" right (same row maintained)
- Password policy rules: full-width, two-column grid if space permits

---

## Route Map Summary

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `GET /login` | — | Show login form | No |
| `POST /login` | Form action | Process login | No |
| `GET /register` | — | Show registration form | No |
| `POST /register` | Form action | Process registration | No |
| `GET /forgot-password` | — | Show forgot password form | No |
| `POST /forgot-password` | Form action | Send OTP email | No |
| `GET /set-password` | — | Show password set form | No |
| `POST /set-password` | Form action | Set new password with OTP | No |
| `GET /confirm-email` | — | Process email confirmation | No (hash-based) |
| `POST /confirm-email` | Form action | Resend confirmation email | Yes (session) |
| `POST /logout` | Form action | Destroy session | Yes |
| `GET /api/auth/check-email` | API | Email uniqueness check | No |
| `GET /auth/github` | — | Start GitHub OAuth flow | No |
| `GET /auth/github/callback` | — | GitHub OAuth callback | No |
| `GET /auth/linkedin` | — | Start LinkedIn OAuth flow | No |
| `GET /auth/linkedin/callback` | — | LinkedIn OAuth callback | No |
| `GET /auth/complete` | — | Show post-OAuth T&C form | No (cookie-based) |
| `POST /auth/complete` | Form action | Create account after OAuth | No (cookie-based) |

---

## Design Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--color-viewport` | #DCEBFF | Page background |
| `--color-card` | #FEFEFE | Auth card background |
| `--color-primary` | #2680F1 | Primary buttons, links |
| `--color-success` | #55B368 | Success states, met password rules |
| `--color-alert` | #D95A5C | Error states, unmet password rules |
| `--color-pending` | #EAB308 | Warning states, confirmation banner |
| `--color-headers` | #192A4B | Card title text |
| `--color-labels` | #7B7C90 | Subtitles, field labels |
| `--color-meta` | #7F91AF | Divider text, footer |
| `--color-secondary` | #DCE4EA | Input borders (idle), dividers |
| `--radius-card` | 16px | Auth card border radius |

---

## Relationship to Other Pages

- **Dashboard** (`/`): Post-login destination
- **Event Detail** (`/event/[slug]`): "Register" button links to `/register?redirect=/event/{slug}`
- **Landing Page**: "Sign In" / "Create Account" links in header
- **All Authenticated Pages**: EmailConfirmBanner component for unconfirmed users
