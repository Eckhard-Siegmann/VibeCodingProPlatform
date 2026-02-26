# ADR 010: Time and Scheduling Architecture

## Status
Accepted

## Context
The platform features several time-dependent behaviors:
1.  **Waitlist Management**: Automatically sliding the next person into the queue when a spot frees up, and expiring unverified invites after 24 hours.
2.  **Event Reminders**: Broadcasting emails to all registered attendees roughly 24 hours before an event begins.
3.  **Live Event Timers**: High-frequency state transitions, such as automatically closing a 5-minute Pitch Phase or a 90-minute Coding Sprint when the countdown hits 0:00.
4.  **Auth & Session Expirations**: Invalidating email confirmation OTPs after 24 hours, and expiring stale browser sessions.

The system is deployed on a Hetzner server (Node.js/SvelteKit with SQLite). We must define an orchestration pattern that respects the platform's stateless architecture (Chapter 1.3) while fulfilling new moderator constraints:
-   **Action & Content Control**: Moderators must control *when* broad event reminders are fired and have the explicit ability to customize the content (e.g., announcing last-minute special guests).
-   **Strict Automation**: Conversely, the waitlist queue must resolve itself mathematically and immediately without waiting for a moderator to manually approve each step.
-   **Perfect Auditability**: Moderators must be able to view an immutable, chronological log of everything the autonomous system did and every manual email that was sent.
-   **DRY Content Management**: The Waitlist invitation email must utilize the EXACT same base template as the Event Invitation email, but with a specific 24h confirmation notice appended.

## Decision
We will reject fully autonomous job queues (e.g., Redis/BullMQ) and pure lazy evaluation in favor of a **Hybrid OS-Cron Architecture** with a **Moderator Action Queue**.

Specifically:
1.  **The Infrastructure Tick**: An OS-level cron job on the Hetzner server will trigger a protected webhook (`POST /api/internal/tick`) every 2-5 minutes.
2.  **Fully Automated Tier**: The tick autonomously executes purely mathematical/mechanical state changes:
    *   Expiring 24h waitlist invitations.
    *   Inviting the *next* person on the waitlist (rendering the current event template + 24h confirmation appendix).
    *   Closing expired timers in `event_live_context` (safety-net; see §Timer Closure Idempotency below).
3.  **Human-in-the-Loop Tier**: The tick *does not* send broad event reminder emails. Instead, when `events.starts_at - 24h` is reached, it sets a boolean `reminder_due_flag = true`. The Moderator dashboard surfaces this as a pending task. The Moderator customizes the versioned template and manually executes the broadcast.
4.  **Auditability**: Every email dispatch and automated waitlist state transition is logged immutably in a new `communications_log` table, exposed to the moderator UI.

### Timer Closure Idempotency

Live event timers (pitch countdown, coding sprint, etc.) can be closed by **two independent mechanisms**:

1. **Primary — Lazy evaluation on read** (Ch.14.5.1.1): When any client polls `event_live_context` and `timer_ends_at < NOW()`, the application layer atomically inserts a `closed_for_pitch_assessment` (or `closed_for_review`) decision and updates the cached live context *before* returning the response. This provides sub-second closure latency during active events with participants online.

2. **Safety net — OS-cron tick**: The `/api/internal/tick` endpoint checks for expired timers every 2-5 minutes. This catches the edge case where *no* client polls during the expiry window (e.g., all participants closed their browsers).

Both mechanisms MUST be **idempotent**: before inserting a closure decision, the code checks whether `current_mode` is still active for that timer. If the mode is already `'idle'` (i.e., the other mechanism already fired), no duplicate decision is created. This is enforced by wrapping the check-and-close in a single database transaction with a `WHERE current_mode != 'idle'` guard.

### Waitlist Auto-Invite Atomicity

The waitlist auto-invite operation (`autoInviteNextWaitlist`) follows a **check-then-act** pattern: it reads the pending invite state, verifies remaining capacity, selects the next waitlisted user, and writes the invite timestamps — all of which must observe a consistent snapshot. Without transaction protection, a concurrent `cancelRegistration()` request (which itself calls `inviteNextFromWaitlist()` inside its own transaction) could interleave between the read and write phases, resulting in:

- **Duplicate invitations**: Two invites issued for the same freed slot.
- **Capacity overrun**: More invites outstanding than available spots.

Both violate User Story S13's invariant: *"at most one active invitation exists per available spot."*

**Enforcement**: The pending-invite check, capacity check, next-user lookup, and `UPDATE event_registrations` are wrapped in a single synchronous `db.transaction()`. Email dispatch (an external side effect) occurs *after* the transaction commits, so the database lock is not held during network I/O. The `communications_log` entry is written inside the transaction alongside the invite UPDATE to guarantee audit completeness even if the process crashes after commit but before email dispatch.

This mirrors the transaction discipline already established in §Timer Closure Idempotency and in `expireWaitlistInvitations()`, which wraps cancel + log + next-invite in a per-registration transaction.

## Rationale
-   **Control**: A fully automated job queue would fire the 24h reminder before the moderator had a chance to customize it with new guests. The hybrid approach perfectly aligns with the requirement for human curation of broadcast communications.
-   **Automation**: The waitlist is decoupled from human bottlenecks and resolves immediately via the tick.
-   **Infrastructure Simplicity**: Utilizing an OS-level cron against a standard REST endpoint avoids the operational overhead of managing a separate Redis instance or persistent background worker pool on Hetzner.
-   **DRY Constraint**: By relying on the `event_email_templates` table and programmatic appending during the waitlist auto-invite step, we satisfy the DRY requirement natively without duplicating template management effort.

## Consequences
-   **Positive**: The architecture forces a strict audit trail (`communications_log`) because the system is making independent decisions that a human needs to verify.
-   **Positive**: SvelteKit remains purely stateless; all time-based logic lives behind a single, easily testable API endpoint.
-   **Negative**: The server requires OS-level configuration (cron setup) during deployment, meaning it cannot be deployed to a pure serverless environment (e.g., Vercel) without relying on external scheduling services (like GitHub Actions or Vercel Cron). Given the Hetzner constraint, this is acceptable.
