# 18. Authentication and Access Control

This chapter defines the **mandatory authentication model** for the community platform. All human users must authenticate to participate in events, access problem cards, or use platform features. This model supports multi-location events, persistent identity across the community, and proper GDPR-compliant communication.

**Note**: This chapter replaces the earlier "minimal authentication" model. The transition to mandatory authentication reflects learnings from Event #1 and the expansion to a multi-location community platform.

---

## 18.1 Mandatory Authentication Model

### All Human Users Must Authenticate

The platform requires authentication for **all** human participants:

- **Problem Owners**: Must have authenticated account to create/edit problems
- **Developers**: Must authenticate to join teams and participate in sprints
- **Observers**: Must authenticate to vote, chat, or attend events
- **Moderators**: Must authenticate for all moderation functions
- **Administrators**: Must authenticate for all administrative functions

This ensures:
- Persistent identity across events and locations (Cologne, Aachen, etc.)
- Ability to send newsletters and event notifications
- Proper attribution of contributions and assessments
- Team formation and chat participation
- GDPR-compliant consent tracking

### Authentication Methods

The platform supports three authentication methods:

| Method | Use Case | Implementation |
|--------|----------|----------------|
| **Local (Email + Password)** | Default for all users | Secure hash storage |
| **OAuth (developer platform)** | Convenient for developers | See ADR 004 |
| **OAuth (professional platform)** | Professional networking context | See ADR 004 |

Users choose their method at registration. OAuth users do not need to manage passwords.

---

## 18.2 Password Policy

### Requirements

For local (email + password) authentication, passwords must meet these criteria:

| Requirement | Specification |
|-------------|---------------|
| Minimum length | 10 characters |
| Uppercase letters | At least 1 |
| Lowercase letters | At least 1 |
| Numbers | At least 1 |
| Special characters | Not required (optional) |

### Password Storage

- Passwords stored as **secure hashes** using an industry-standard adaptive hashing algorithm (see ADR 004)
- No plaintext storage
- No reversible encryption
- Hash includes per-user salt

### Password Change

- Users can change password at any time from account settings
- Password change does not invalidate existing sessions
- Old password required to set new password (except OTP reset)

---

## 18.3 One-Time Password (OTP) Flow

### Initial Onboarding

When a new user is created (via registration or CSV import), they receive an email containing a **one-time password**:

1. Admin or system creates user with email address
2. System sets `email_confirmed = TRUE` and `login_enabled = FALSE`
3. System generates random OTP and stores hash in `password_hash` field
4. System sends onboarding email with OTP
5. User visits password change page with email + OTP
6. User sets new password meeting policy requirements
7. System sets `login_enabled = TRUE` and invalidates OTP
8. User can now login with email + new password

**Critical**: The OTP is **not for logging in**. It is solely for setting the initial password. Users cannot access the platform until they complete this password change step.

### Account States During Onboarding

| State | `email_confirmed` | `login_enabled` | Can Login? | Can Set Password? |
|-------|-------------------|-----------------|------------|-------------------|
| CSV imported | TRUE | FALSE | ❌ No | ✅ Yes (via OTP) |
| Email not confirmed | FALSE | FALSE | ❌ No | ❌ No |
| Password set | TRUE | TRUE | ✅ Yes | ✅ Yes (via old password) |

### OTP Characteristics

| Property | Value |
|----------|-------|
| Format | Alphanumeric, 12 characters |
| Validity | **No expiration** (until used or reset) |
| Single use | Yes (invalidated after password change) |
| Storage | Hashed (same as passwords) |
| Purpose | **Password initialization only** (not login) |

### Forgot Password Flow

Users who forget their password can request a reset:

1. User clicks "Forgot Password" and enters email
2. System generates new OTP and stores hash (invalidating any previous OTP)
3. System sends email with new OTP
4. User logs in with email + new OTP
5. System requires password change
6. User sets new password

**Security Note**: The forgot password flow rate-limits requests to prevent abuse.

---

## 18.4 OAuth Integration

The specific OAuth providers are documented in ADR 004 (Authentication Providers).

### OAuth Flow

For users who prefer OAuth authentication, both supported providers follow the same flow:

1. User clicks "Sign in with {Provider}"
2. Redirected to provider's authorization page
3. User grants access
4. System receives provider user ID and email
5. If email exists in system: link provider ID to existing account
6. If email is new: create account with provider as auth method
7. User is logged in

### OAuth Account Linking

- An existing local account can be linked to one or both OAuth providers
- If OAuth email matches existing account, accounts are merged
- Users can have multiple OAuth providers linked
- OAuth users can optionally set a local password as backup

### Mobile OAuth Experience

**Added 2026-02-05**: Mobile OAuth flows use native browser redirects. Optimized for small screens with clear progress indicators and minimal steps.

**Mobile-Specific Considerations**:
- OAuth buttons: Full-width on mobile (<640px), inline on desktop
- Redirect flow: Works seamlessly on mobile browsers
- Loading state: Shows spinner during OAuth roundtrip
- Error handling: Clear messages if OAuth fails or user cancels
- Success: Toast notification + redirect to intended destination

---

## 18.5 Email Confirmation (Double Opt-In)

### Confirmation Flow

New accounts require email confirmation for GDPR compliance:

1. User registers (any method)
2. System sends confirmation email with unique hash
3. User clicks confirmation link
4. System sets `email_confirmed = TRUE`
5. User can now receive newsletters and event notifications

### Confirmation Hash

| Property | Value |
|----------|-------|
| Format | UUID or random 64-character hex |
| Validity | **24 hours** from generation |
| Single use | Yes |
| Regeneration | User can request new confirmation email |

### Unconfirmed Accounts

Users with unconfirmed email can still:
- Log in and browse events
- Register for events
- Participate in chats

Users with unconfirmed email **cannot**:
- Receive newsletter emails
- Receive event reminder emails
- Be contacted for waitlist notifications

**Prompt**: The UI persistently reminds unconfirmed users to confirm their email.

---

## 18.6 Terms and Conditions

### Mandatory Acceptance

All users must accept Terms & Conditions before full platform participation:

1. During registration, T&C acceptance checkbox is displayed
2. User must check the box to proceed
3. System records `terms_accepted_at` timestamp
4. Acceptance is required before:
   - Registering for events
   - Creating problems
   - Joining teams
   - Posting in chat

### T&C Updates

When T&C are updated:
- Existing users see a prompt to re-accept on next login
- New `terms_accepted_at` timestamp recorded
- Previous acceptance history preserved in audit log

**Note**: T&C content is an **open point** to be provided separately (see Chapter 30).

---

## 18.7 Role-Based Access Control

### Role Hierarchy

| Role | Can Bind Decisions | Authentication Required | Capabilities |
|------|-------------------|------------------------|--------------|
| Observer | No | Yes | Browse, vote, chat |
| Developer | No | Yes | + join teams, share repos |
| Coding Partner | No | Yes | Same as Developer |
| Problem Owner | No | Yes | + create/edit problems |
| Moderator | Yes | Yes | + curate events, make decisions |
| Administrator | Yes | Yes | + manage items, inventories, users |
| Agent | No | API token | Non-binding recommendations only |

### Global Moderators

Moderators have **global scope** — they can:
- Moderate any event (Cologne, Aachen, or future locations)
- See all events and problems across the platform
- Make binding decisions on any problem
- Access moderation dashboards for all locations

This ensures operational flexibility and knowledge sharing across the community.

### Problem-Local Role Override

When moderators join a problem team as developers ("Join as Dev"), they temporarily adopt the developer role **for that specific problem only** (Chapter 31.7). This preserves objectivity:

- Moderator loses binding decision authority for that problem
- Retains global moderator role for all other problems
- Prevents conflicts of interest (cannot moderate a problem you're coding)
- Team membership creates the local role override

The platform resolves role contextually: check team membership first; if moderator is a team coder, treat as developer for that problem; otherwise use base role.

### Administrator Capabilities

Administrators are a **strict superset** of Moderators, with additional abilities:
- Manage Items and Inventories
- Manage Partners and Locations
- Import users via CSV
- Promote users to Moderator/Administrator
- Configure system settings

### Role Escalation

Role changes are **explicit and auditable**:
- An Administrator can promote any user to Moderator
- An Administrator can promote a Moderator to Administrator
- There is no self-escalation
- Role changes are logged in the decisions table

---

## 18.8 Agent Authentication

### Agent Identity

Agents (AI systems) authenticate differently from humans:

| Property | Specification |
|----------|---------------|
| Auth method | API token or JWT |
| Identity | Pre-configured in `users` table with `role = 'agent'` |
| Session | Stateless (token per request) |
| Binding decisions | **Always `is_binding = false`** |

### Agent Capabilities

Agents can:
- Create non-binding recommendations
- Post chat messages (marked as bot)
- Analyze problems and provide assessments
- Participate in discussions (clearly identified)

Agents cannot:
- Create binding decisions
- Moderate events
- Manage users or system configuration
- Register for events

---

## 18.9 Session Management

### Session Creation

- Sessions created on successful authentication
- Session token stored as HTTP-only secure cookie
- Session linked to user record in database

### Session Duration

| Property | Value |
|----------|-------|
| Default duration | Browser session (until close) |
| "Remember me" duration | 30 days |
| Idle timeout | None (explicit logout only) |
| Maximum lifetime | 90 days (then forced re-auth) |

### Session Invalidation

Sessions are invalidated when:
- User logs out
- User changes password
- Administrator forces logout
- Session reaches maximum lifetime
- Account is deactivated

### Multi-Device Support

- Users can have multiple active sessions
- Each device gets its own session
- "Log out everywhere" option available in settings

---

## 18.10 Security Considerations

### What This Model Provides

- Persistent, verified identity for all participants
- Secure password storage with modern hashing
- GDPR-compliant consent tracking
- Protection against casual unauthorized access
- Audit trail for all authenticated actions

### What This Model Does NOT Provide

The platform explicitly does **not** aim for:
- Enterprise-grade security (SOC 2, ISO 27001)
- Protection against determined attackers
- Multi-factor authentication (MFA)
- IP-based access restrictions
- Real-time anomaly detection

### Threat Model

The system assumes:
- A **benign community** of professional practitioners
- Primary risk is **accidental misuse**, not hostile intrusion
- No highly sensitive personal data beyond email addresses
- OAuth providers provide identity verification (see ADR 004)

### Security Philosophy

> *Protect platform integrity and enable community trust, without creating barriers to participation.*

---

## 18.11 Migration from Previous Model

### Handling Existing Problem Owners

Problem Owners from Event #1 (who had email-only access via private URLs) are migrated:

1. System identifies all existing PO accounts without passwords
2. System generates OTP for each
3. System sends onboarding email: "The platform now requires login..."
4. PO logs in with OTP and sets password
5. Private URLs remain functional but redirect to login

### Private URL Deprecation

The previous "security by obscurity" private URLs are **deprecated but still functional**:
- Existing private URLs redirect to login page
- After authentication, user is redirected to their problem
- New problems do not generate private editing URLs
- Access is controlled via authentication, not URL knowledge

---

## 18.12 Trust Indicators

Trust is assumed in the "benign community" model, but visible trust signals accelerate collaboration and help newcomers identify experienced practitioners.

### 18.12.1 Contribution History Visibility

User profiles display contribution history:

```
Max Mustermann
──────────────
Member since: January 2026
Events attended: 5
Problems submitted: 3 (2 accepted, 1 in review)
Teams joined: 4
Points earned: 24 | Stars: ⭐⭐⭐⭐⭐

Recent Activity:
• Completed review assessment (2 days ago)
• Joined team "CLI Parser" (1 week ago)
• Problem "API Rate Limiter" accepted (2 weeks ago)
```

**Privacy Note:** Basic contribution stats are visible to authenticated users. Detailed history (which problems, which teams) is visible to team members and moderators.

### 18.12.2 Profile Completeness Indicators

Encourage profile completion with visual indicators:

```
Profile Completeness: 80%
─────────────────────────
✓ Display name set
✓ Email confirmed
✓ Terms accepted
○ First problem submitted
○ First assessment completed
```

**Completeness Criteria:**

| Element | Weight | Description |
|---------|--------|-------------|
| Display name | 20% | Non-default name set |
| Email confirmed | 20% | Double opt-in completed |
| Terms accepted | 10% | T&C accepted |
| First event attended | 20% | Registered and showed up |
| First contribution | 30% | Problem, assessment, or team join |

### 18.12.3 Social Proof Elements

On problem cards and team sections, show social proof:

**Problem Card:**
```
"API Rate Limiter" by Max Mustermann
────────────────────────────────────
👥 Worked on by 3 teams across 2 events
⭐ Best solution: Eva Schmidt (VibeCoding Cologne Feb 2026)
💬 42 chat messages
📝 8 lessons learned captured
```

**Team Section:**
```
Team Members
────────────
● Max Mustermann (PO) — 5 events, 24 points
● Eva Schmidt — 8 events, 38 points ⭐⭐⭐
● Tom Weber — 2 events, 8 points (new!)
```

### 18.12.4 Experience Level Badges

Based on contribution history, show experience level:

| Badge | Criteria |
|-------|----------|
| 🌱 New | < 2 events attended |
| 👤 Active | 2-5 events, some contributions |
| ⭐ Contributor | 5+ events, 20+ points |
| 🏆 Top Contributor | 50+ points OR top-10 wall appearance |

**Display:** Badge appears next to name in chat and team lists.

### 18.12.5 Endorsement System (Future Direction)

**Not MVP scope**, but captured for future:
- Moderators can endorse users for specific skills
- Endorsements visible on profile
- "Endorsed for: Code Review, TDD, Architecture"

---

## 18.13 Relationship to Other Chapters

- **Chapter 3**: Roles and authority model — role definitions
- **Chapter 19**: Data model — `users` table authentication fields, `show_on_contributor_wall`
- **Chapter 29**: Events — event registration requires authentication
- **Chapter 30**: Registration — onboarding flows
- **Chapter 31**: Team chat — chat participation requires authentication
- **Chapter 32**: Onboarding — first-time user guidance
- **Chapter 33**: Contributor recognition — points and stars system

---

## 18.14 API Endpoint Authorization

Every API endpoint MUST enforce authorization before processing requests. This section defines the authorization contract for the frontend's server-side API routes.

### 18.14.1 Authorization Levels

| Level | Applies To | Requirement |
|-------|-----------|-------------|
| **Authenticated** | All endpoints | Valid user identity (session cookie). Failure → `401 Unauthorized` |
| **Role-gated** | Mutating endpoints (POST, PATCH, DELETE) on queue, decisions, live context | User must hold `moderator` or `admin` role. Failure → `403 Forbidden` |
| **Objectivity-constrained** | Binding decisions (decisions endpoint) | Moderator must NOT be a team member (coder) on the target problem. Checked via `getEffectiveRole()` (see Ch.3). Failure → `403 Forbidden: objectivity constraint` |

### 18.14.2 Endpoint Authorization Matrix

| Endpoint Pattern | GET | POST | PATCH | DELETE |
|------------------|-----|------|-------|--------|
| `/api/events/[eventId]/queue` | Authenticated | Moderator | Moderator | — |
| `/api/events/[eventId]/queue/[problemId]` | — | — | — | Moderator |
| `/api/events/[eventId]/decisions` | — | Moderator + Objectivity | — | — |
| `/api/events/[eventId]/live-context` | Authenticated | — | — | — |
| `/api/assess/[assessmentId]/responses` | Authenticated | Authenticated | — | — |

### 18.14.3 HTTP Error Response Contract

All API error responses follow a consistent shape:

```json
{ "success": false, "error": "<reason>" }
```

| HTTP Status | Meaning | When |
|-------------|---------|------|
| `400 Bad Request` | Malformed or invalid payload | Missing required fields, invalid values |
| `401 Unauthorized` | No valid user identity | Missing or invalid session cookie |
| `403 Forbidden` | Identity known but insufficient privileges | Wrong role, or objectivity constraint violated |
| `500 Internal Server Error` | Server-side failure | Database errors, unexpected exceptions |

### 18.14.4 Objectivity Constraint at API Level

Before recording a **binding** decision (`is_binding = true`), the decisions endpoint MUST:

1. Authenticate the user (→ 401 if missing)
2. Verify `moderator` or `admin` role (→ 403 if insufficient)
3. Call `getEffectiveRole(userId, problemId, eventId)` from the teams repository
4. If effective role is `coder` (team member on the target problem), reject with `403 Forbidden: objectivity constraint — moderator is a team member on this problem`

This enforces the principle from Ch.12.5: moderators who are coding on a problem lose binding decision authority for that specific problem. They may still make non-binding recommendations (agents and conflicted moderators use `is_binding = false`).
