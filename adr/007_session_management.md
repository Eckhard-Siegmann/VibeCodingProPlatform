# ADR 007: Session Management

## Status

**Accepted** (2026-02-25)

## Context

Chapter 18.9 specifies session management with database-backed sessions, multi-device support, "log out everywhere", and admin-forced logout. However, the `sessions` table was removed from the data model (Ch. 19.3.2) when pseudonymous participation was eliminated — leaving no storage mechanism for sessions.

The platform needs a session strategy that supports:
- HTTP-only secure cookie-based authentication
- "Remember me" (30-day sessions) vs browser-session-only
- Multi-device support (concurrent sessions per user)
- "Log out everywhere" (invalidate all sessions)
- Admin forced logout (deactivate user → sessions invalidated)
- Maximum session lifetime (90 days, then forced re-authentication)
- Stateless web application architecture (no background workers for cleanup)

## Decision

### Database-Backed Sessions with `user_sessions` Table

Sessions are stored in a `user_sessions` table. Each successful authentication creates a session row with a cryptographically random token. The token is sent to the client as an HTTP-only, Secure, SameSite=Lax cookie.

**Rationale for database sessions over JWT**:
- JWTs cannot be revoked without a server-side blocklist, which is effectively a session store
- "Log out everywhere" and admin forced logout require server-side session awareness
- The platform's scale (dozens to low hundreds of concurrent users) makes DB lookup overhead negligible
- SQLite/PostgreSQL handle this volume without any caching layer

### Session Token

| Property | Value |
|----------|-------|
| Format | 64-character hex string (`crypto.randomBytes(32).toString('hex')`) |
| Cookie name | `session` |
| Cookie flags | `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` |
| Storage | Hashed in database (SHA-256) — raw token never stored server-side |

**Security**: The session token is hashed before storage, identical to the pattern used for passwords. If the database is compromised, raw tokens cannot be extracted. The cookie contains the raw token; the server hashes it on each request to look up the session.

### Session Lifecycle

| Event | Action |
|-------|--------|
| Login (no "remember me") | Create session with `expires_at = NULL` (browser session) |
| Login (with "remember me") | Create session with `expires_at = now + 30 days` |
| Each request | Validate token hash + check `expires_at` and `max_lifetime` |
| Logout | Delete session row, clear cookie |
| "Log out everywhere" | Delete all session rows for user, clear current cookie |
| Password change | Delete all session rows for user (force re-auth on all devices) |
| Admin deactivation | Delete all session rows for user |
| Max lifetime exceeded | Session rejected on next request (90 days from `created_at`) |

### Session Validation (Per-Request)

On every request requiring authentication:

1. Read `session` cookie → raw token
2. Hash token with SHA-256
3. Look up `user_sessions` row by `token_hash`
4. If not found → 401 Unauthorized
5. If `expires_at IS NOT NULL AND expires_at < now` → delete row, 401
6. If `created_at + 90 days < now` → delete row, 401 (max lifetime)
7. Load user from `user_id` foreign key
8. If `user.login_enabled = FALSE` → delete row, 401
9. Return authenticated user

### Lazy Cleanup (No Background Workers)

Expired sessions are cleaned up lazily:
- **On validation**: If a session is expired, it is deleted during the validation check (step 5-6 above)
- **On login**: Before creating a new session, delete any expired sessions for the same user
- **Optional bulk cleanup**: An external cron endpoint `POST /api/admin/cleanup-sessions` can be called periodically to purge all expired sessions. This is not required for correctness — just hygiene.

This aligns with the platform's stateless architecture principle (Ch. 1 §1.3).

### `user_sessions` Table Schema

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `session_id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `token_hash` | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 hash of raw session token |
| `expires_at` | TIMESTAMP | nullable | NULL = browser session; set = "remember me" |
| `created_at` | TIMESTAMP | NOT NULL | Used for max lifetime check (90 days) |
| `last_seen_at` | TIMESTAMP | NOT NULL | Updated on each validated request; informational |
| `user_agent` | VARCHAR | nullable | For "manage sessions" UI (identify devices) |

**Indexes**:
- `UNIQUE INDEX ON token_hash` (primary lookup path)
- `INDEX ON user_id` (for "log out everywhere" and cleanup)
- `INDEX ON expires_at` (for bulk cleanup)

## Consequences

### Positive

- **Revocability**: Any session can be invalidated instantly (logout, password change, admin action)
- **"Log out everywhere"**: Simple `DELETE FROM user_sessions WHERE user_id = ?`
- **No external dependencies**: Works with SQLite (dev) and PostgreSQL (prod) — no Redis needed
- **Lazy cleanup**: No background workers required; expired sessions cleaned opportunistically
- **Auditable**: `last_seen_at` and `user_agent` provide visibility into active sessions

### Negative / Trade-offs

- **DB lookup per request**: Every authenticated request requires a session table query. At current scale (< 200 concurrent users), this adds < 1ms latency with indexed lookup. If scale grows significantly, consider an in-memory cache with short TTL.
- **Cookie-only**: No support for token-based auth in request headers (except for agents, which use API keys per Ch. 18.8). If SPA or mobile app needs arise, a bearer token variant can be added later.

## References

- Platform Spec Ch. 18 §18.9 — Session management behavioral specification
- Platform Spec Ch. 19 §19.3.2 — Previous `sessions` table removal note
- Platform Spec Ch. 1 §1.3 — Stateless platform architecture
- ADR 001 — Database engine strategy (SQLite dev / PostgreSQL prod)
