# ADR 010 Rationale: Solution Matrix — Time & Scheduling Architecture

> **Rationale log for [ADR 010 — Time and Scheduling Architecture](../010_time_and_scheduling_architecture.md)**
> This document records the alternatives analysis and scoring that led to ADR 010. It is preserved as a decision rationale artifact; the normative decisions are in the ADR itself.

## 1. Context and Requirements

The platform is deployed on a **Hetzner server in Germany** (Node.js/SvelteKit with SQLite). We must define a unified architectural pattern to handle *all* time-based lifecycle events across the system, not just the waitlist.

### The Four Categories of Timed Events
1. **Event Reminders (Broadcasts)**: Emails sent to *all registered attendees* typically ~24h before the event starts.
2. **Waitlist Management**: Enforcing the 24-hour expiration rule for pending invites and *fully automatically* sliding the next person into the queue without human intervention.
3. **Live Event Timers**: High-frequency state transitions, such as automatically closing a 5-minute Pitch Phase or a 90-minute Coding Sprint when the countdown hits 0:00.
4. **Auth & Session Expirations**: Invalidating email confirmation OTPs after 24 hours, and expiring stale browser sessions.

### New Moderator Requirements
- **Action Control**: Moderators must be able to influence *timing* (when things happen) for broad event broadcasts.
- **Content Control**: Moderators must be able to customize broad emails (e.g., adding a note like *"Special Guest: The Mayor of Cologne will be there!"* to the Event Reminder).
- **Waitlist Automation**: The waitlist must resolve itself mathematically and immediately without waiting for a moderator to approve the next person in line.
- **Transparency & Auditability**: Moderators must clearly see what has happened: Were the emails sent? To whom? What was the exact text that went out? Did the waitlist auto-invite someone while I was asleep?

---

## 2. The 3 Architectural Alternatives

### Alternative 1: Fully Automated Job Queue (e.g., Node-Cron + Redis/BullMQ)
A heavy backend orchestration pattern where jobs are scheduled in a message broker.
- **Waitlist**: Works well, pushes invites immediately.
- **Reminders**: Fails the control requirement. A moderator has to navigate into a "Upcoming Jobs" configuration screen, find the specific scheduled broadcast job, edit the template attached to it, and save it *before* the cron triggers it.
- **Transparency**: Requires building a complex job-history UI to expose the message broker's internal logs to the admin.

### Alternative 2: Pure Lazy Evaluation (Current Spec Default)
No background jobs whatsoever. Time is an illusion until a user makes an HTTP request.
- **Waitlist**: Fails the automation requirement. If no one visits the site, an expired waitlist spot is never reclaimed and the next person never gets an email.
- **Transparency**: Highly error-prone and untraceable.

### Alternative 3: OS-Cron Checkpoint + Hybrid Action Queue (Recommended)
The system leverages a simple, robust OS-level cron job that splits behaviors: Silent/Mechanical tasks are fully automated, while Broadcast tasks are queued for humans.
- **How it works**: An OS-level `cron` job pings a protected API endpoint (`POST /api/internal/tick`) every 2-5 minutes.
   - **Fully Automated Tasks**: The tick automatically processes silent, mechanical tasks: expiring 24h waitlist invitations, auto-emailing the *next* person on the waitlist with a standardized transactional template, invalidating old OTPs, and closing 0:00 Pitch Timers.
   - **Human-in-the-Loop Tasks**: For the 24h Event Reminder sent to all registered participants, the tick *does not* send the emails autonomously. Instead, it generates a "Reminder Due" action card in the Moderator Dashboard.
- **Moderator Control**: The Moderator logs in, sees the "Reminder Due" card, clicks it, customizes the content (*"The Mayor is joining us!"*), and physically clicks **[Send Broadcast]**.
- **Transparency (The Audit Viewer)**: Every sent email and automated waitlist action is recorded in a `communications_log` table, exposed to moderators via a read-only list view.

---

## 3. Solution Matrix Scoring

*Scoring: 1 (Poor) to 5 (Excellent)*

| Evaluation Criteria | Alt 1: Full Auto Job Queue | Alt 2: Pure Lazy Evaluation | Alt 3: Hybrid (Cron + Moderator Queue) |
|---------------------|----------------------------|------------------------|-----------------------------------------|
| **Complexity** (Setup & Ops on Hetzner) | 2 (Requires Redis/Message Broker and complex error handling) | 4 (Zero infrastructure) | 4 (Simple OS-cron, standard SvelteKit actions, SQLite) |
| **Robustness** | 4 (Consistent execution if infra is stable) | 1 (Fails if traffic drops; blocks page loads) | 5 (Guaranteed by OS-cron; decoupled from page-loads) |
| **Maintainability** | 2 (Two separate code lifecycles/apps to monitor) | 4 (All code in one place) | 4 (All code in one place; standard SvelteKit API routes) |
| **Error-Proneness** (Fewer errors = higher script) | 2 (Silent job failures; accidental generic sends) | 1 (Severe race conditions on concurrent page loads) | 5 (Mechanical tasks automated safely; broadcast tasks gated by human check) |
| **Transparency** | 2 (Hard to expose job queue state to non-technical mods) | 1 (Invisible state changes) | **5** (Built around a visual action queue and definitive `communications_log` table) |
| **Controllability** | 2 (Difficult to intervene before scheduled execution) | 1 (Zero control) | **5** (Moderator decides *when* the broadcast fires and *what* it says) |
| **Total Score** | **14 / 30** | **12 / 30** | **28 / 30** |

---

## 4. Final Recommendation & Implementation Strategy

**Recommendation: Alternative 3 (OS-Cron Checkpoint + Moderator Action Queue)** is the clear winner for a standard Hetzner deployment using SQLite. It avoids complex message broker infrastructure (Redis/RabbitMQ) while perfectly satisfying the requirement that moderators have direct control over broad community communications.

### Implementation Checklist for the Selected Architecture:

1. **The Infrastructure Tick**:
   - Configure Hetzner Linux `cron` to execute `curl -X POST https://platform.com/api/internal/tick -H "Authorization: Bearer <SECRET>"` every 2-5 minutes.
   
2. **Fully Automated Logic (`/api/internal/tick`)**:
   - Update `event_registrations` to expire waitlist invitations where `waitlist_expires_at < NOW()`. Logs action to `communications_log`.
   - Auto-dispatch the *standard transactional* waitlist invite to the next `waitlist_position`, setting their `waitlist_expires_at`. Logs email to `communications_log`.
   - Close timers (`event_live_context`).
   - If `events.starts_at - 24h < NOW()`, set `reminder_due_flag = true` (Do not send email).

3. **The Moderator "Action Queue" UI**:
   - Dashboard checks for events where `reminder_due_flag = true` and `reminder_sent_at = NULL`.
   - Shows alert: **"Event Reminder Due: Setup and Send"**.

4. **The Customization & Dispatch UI**:
   - Moderator clicks the alert, edits the custom notes textarea (*"Special Guest: The Mayor!"*), and hits **"Broadcast to Registered Attendees"**.
   - Server sends emails via Brevo and writes to `communications_log`.

5. **Transparency: The Automated Audit Viewer UI**:
   - Create schema table `communications_log` (`log_id`, `event_id`, `type`, `recipient_user_id`, `sent_at`, `subject`, `system_generated`).
   - Add a definitive List View component (`ui/data-table/DataTable.svelte`) to the Moderator Dashboard Event page: **"System Activity & Communication Log"**.
   - Shows precisely when the automated waitlist system expired a user, when it invited the next user, and when the manual event reminders were dispatched. Moderators can filter by `type='waitlist_auto'` vs `type='broadcast_manual'`.
