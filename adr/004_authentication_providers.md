# ADR 004: Authentication Providers

## Status

**Accepted** (2026-02-05)

## Context

The platform requires mandatory authentication for all participants (Chapter 18). The community consists of professional software practitioners attending events in multiple locations (Cologne, Aachen). Authentication must:

- Be low-friction for developers (many already have GitHub accounts)
- Support professional networking context (LinkedIn presence)
- Provide a fallback for users without OAuth accounts
- Enable persistent identity across events and locations via email as unique identifier

## Decision

### Three Authentication Methods

| Method | Provider | Use Case |
|--------|----------|----------|
| **Local** | Email + Password | Default for all users; no external dependency |
| **Developer OAuth** | GitHub | Convenient for developers; trusted identity verification |
| **Professional OAuth** | LinkedIn | Professional networking context; career-oriented community |

### Password Hashing — bcrypt

**Decision (2026-02-25)**: Passwords are stored using **bcrypt** with a cost factor of 12.

| Property | Value |
|----------|-------|
| Algorithm | bcrypt |
| Cost factor | 12 (≈250ms on modern hardware) |
| Library | `bcrypt` npm package (Node.js native bindings) |
| Salt | Automatically embedded in bcrypt output |
| Output format | `$2b$12$...` (60-character string) |

**Rationale**: bcrypt is battle-tested, universally supported in Node.js, and sufficient for the platform's benign-community threat model (Ch. 18.10). Argon2 offers theoretical advantages against GPU attacks, but bcrypt at cost 12 provides adequate protection for a community platform that does not store sensitive personal data beyond emails. The `bcrypt` npm package uses native C bindings for performance.

**OTP hashing**: One-time passwords are also hashed with bcrypt (same library, same cost factor). OTP verification uses `bcrypt.compare()`.

Requirements:
- Per-user salt (embedded in bcrypt output)
- No plaintext storage
- No reversible encryption
- Cost factor of 12 (tunable via environment variable if hardware changes)

### OAuth Flow (Both Providers)

The OAuth integration follows the same 7-step flow for both providers:

1. User clicks "Sign in with {Provider}"
2. Redirected to provider's authorization page
3. User grants access
4. System receives provider user ID and email
5. If email exists in system: link provider ID to existing account
6. If email is new: create account with provider as auth method
7. User is logged in

### Account Linking

- An existing local account can be linked to one or both OAuth providers
- If OAuth email matches an existing account, accounts are merged automatically
- Users can have multiple OAuth providers linked simultaneously
- OAuth users can optionally set a local password as backup

### OAuth User Properties

- `email_confirmed` set to `TRUE` implicitly (identity provider is trusted)
- No password hash stored unless user explicitly sets a local password
- Provider-specific user ID stored for identity mapping (`github_id`, `linkedin_id` fields in `users` table)

### Mobile OAuth Experience

Mobile OAuth flows use native browser redirects:
- OAuth buttons: Full-width on mobile (<640px), inline on desktop
- Loading state: Spinner during OAuth roundtrip
- Error handling: Clear messages if OAuth fails or user cancels
- Success: Toast notification + redirect to intended destination

## Consequences

### Positive

- **Low friction**: Most developers can sign in with one click via GitHub
- **Professional context**: LinkedIn integration aligns with community's professional positioning
- **Identity unification**: Email-based deduplication prevents multiple accounts
- **Fallback available**: Local auth works for users without GitHub/LinkedIn

### Negative

- **OAuth provider dependency**: GitHub/LinkedIn outages block those login paths (local auth unaffected)
- **Two OAuth integrations to maintain**: Each provider has its own API, token format, and scope requirements
- **Privacy considerations**: OAuth grants may request more profile data than needed (minimize scopes)

### Resolved Points (2026-02-25)

**Password hashing algorithm**: bcrypt with cost factor 12. See "Password Hashing" section above.

**OAuth scope minimization**:

| Provider | Scopes | Data Received |
|----------|--------|---------------|
| GitHub | `read:user`, `user:email` | User ID, display name, primary email |
| LinkedIn | `openid`, `profile`, `email` | User ID, display name, email |

No repository access, no social graph, no posting permissions. Scopes are the minimum required for identity verification and email retrieval.

**Rate limiting for password reset OTP**:

| Constraint | Value |
|------------|-------|
| Per email address | Max 3 OTP requests per hour |
| Per IP address | Max 10 OTP requests per hour |
| Cooldown | 60 seconds between requests for same email |
| Implementation | In-memory rate limiter (e.g., `express-rate-limit` pattern adapted for SvelteKit hooks) |
| Failure response | `429 Too Many Requests` with `Retry-After` header |

Rate limiting is applied at the SvelteKit server hook level. No database table needed — in-memory counters reset on server restart, which is acceptable for the platform's threat model.

## OAuth Implementation Details

### Environment Variables

OAuth client credentials are read from environment variables. Both providers require a client ID (public) and client secret (confidential):

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth App client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth App client secret |
| `ORIGIN` | SvelteKit's own `ORIGIN` env var — used to construct callback URLs |

The callback URL registered with each provider follows the pattern:
`{ORIGIN}/auth/{provider}/callback` (e.g., `https://example.com/auth/github/callback`).

In development, `ORIGIN` defaults to `http://localhost:5173` (SvelteKit dev server).

### CSRF Protection (OAuth State Parameter)

Every OAuth initiation generates a `state` parameter to prevent cross-site request forgery:

1. Generate 32 random bytes → hex string (64 chars)
2. Store in an HTTP-only, SameSite=Lax cookie named `oauth_state` (max-age: 10 minutes)
3. Pass as `state` query parameter to the provider's authorize URL
4. On callback, compare cookie value with `state` query parameter
5. If mismatch or cookie absent → reject with error, redirect to `/login`
6. Clear the `oauth_state` cookie after validation

### Provider-Specific Endpoints

**GitHub** (Authorization Code Flow):

| Step | URL |
|------|-----|
| Authorize | `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=read:user+user:email&state=...` |
| Token exchange | `POST https://github.com/login/oauth/access_token` (Accept: application/json) |
| User info | `GET https://api.github.com/user` (Bearer token) |
| User email | `GET https://api.github.com/user/emails` (Bearer token) — pick primary verified email |

**LinkedIn** (OpenID Connect):

| Step | URL |
|------|-----|
| Authorize | `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=...&redirect_uri=...&scope=openid+profile+email&state=...` |
| Token exchange | `POST https://www.linkedin.com/oauth/v2/accessToken` (form-urlencoded) |
| User info | `GET https://api.linkedin.com/v2/userinfo` (Bearer token) — returns `sub`, `name`, `email`, `email_verified` |

### Callback Processing Logic

The OAuth callback handler follows a unified flow for both providers:

1. Validate `state` parameter against cookie (CSRF check)
2. Exchange authorization `code` for access token
3. Fetch user profile and email from provider API
4. **Account resolution**:
   a. Lookup user by `github_id` / `linkedin_id` → if found, log in (existing OAuth link)
   b. Lookup user by email → if found, link provider ID to existing account, log in
   c. No match → redirect to `/auth/complete` with OAuth data in a short-lived HTTP-only cookie (`oauth_pending`, max-age: 10 minutes, JSON with provider, provider_user_id, email, display_name)
5. For cases (a) and (b): create session, redirect to `?redirect` param or `/`
6. For case (c): user completes T&C acceptance on `/auth/complete`, then account is created

### Post-OAuth Completion (`/auth/complete`)

New users arriving via OAuth must still accept Terms & Conditions (Ch. 18.6). The `/auth/complete` route:

1. Reads `oauth_pending` cookie — if absent, redirects to `/login`
2. Displays a compact form: display name (pre-filled), T&C checkbox (required), newsletter checkbox (default checked)
3. On submit: creates user with `auth_provider = '{provider}'`, `email_confirmed = TRUE`, `login_enabled = TRUE`, no `password_hash`
4. Sets the provider-specific ID column (`github_id` or `linkedin_id`)
5. Creates session, clears `oauth_pending` cookie, redirects to `/`

### Rate Limiting Implementation

OTP rate limiting (per "Resolved Points" section) uses an **in-memory Map** in the SvelteKit server hooks:

```
Map<string, { count: number; firstRequest: number; lastRequest: number }>
```

Two maps: one keyed by email, one by IP. Entries are cleaned up lazily (on each request, purge entries older than 1 hour). Server restart resets all counters — acceptable for the platform's threat model (Ch. 18.10).

The rate limiter is applied as a `handle` hook that intercepts `POST /forgot-password` requests before they reach the form action.

## References

- Platform Spec Chapter 18: Authentication and Access Control (behavioral specification)
- Platform Spec Chapter 19: Data Model — `users` table, `auth_provider_catalog`
