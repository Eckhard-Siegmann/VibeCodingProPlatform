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

### Password Hashing

Passwords are stored using an **industry-standard adaptive hashing algorithm**. The specific algorithm is not yet finalized:

| Candidate | Strengths | Status |
|-----------|-----------|--------|
| **bcrypt** | Battle-tested, widely supported in Node.js ecosystem | Preferred |
| **Argon2** | Memory-hard (resists GPU attacks), OWASP recommended | Alternative |

Both are acceptable. Final selection depends on library support and performance testing during implementation.

Requirements regardless of algorithm:
- Per-user salt (embedded in hash output)
- No plaintext storage
- No reversible encryption
- Cost factor tunable for hardware

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

### Open Points

- Final password hashing algorithm selection (bcrypt vs Argon2)
- OAuth scope minimization (request only email + profile, not repository access)
- Rate limiting strategy for password reset OTP requests

## References

- Platform Spec Chapter 18: Authentication and Access Control (behavioral specification)
- Platform Spec Chapter 19: Data Model — `users` table, `auth_provider_catalog`
