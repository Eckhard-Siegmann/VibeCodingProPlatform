# 16. E-Mail Communication

This chapter defines the policies and explicit triggers for all outbound e-mail communication within the platform. To ensure high deliverability, GDPR compliance, and templating flexibility, the platform relies on external transactional email infrastructure.
The specific implementation (the choice of provider and API mechanics) is an architectural **Design Decision** captured within the `adr/` documentation, separate from this platform specification.

---

## 16.1 General Policy

### 16.1.1 Sender Identity

All system-generated emails are sent from a single, consistent sender identity:

| Property | Value |
|----------|-------|
| **From address** | `noreply@vibecoding.events` |
| **Display name** | `VibeCoding Community` |
| **Reply-To** | None (noreply). Users are directed to in-app channels for support. |

The actual `From` header and SPF/DKIM configuration is managed in the email delivery provider. The platform only passes template identifiers and data dictionaries — it never assembles HTML or renders email bodies (see `adr/005_email_provider_brevo.md`).

### 16.1.2 Template Format

All email templates are **multipart** (HTML + plain-text fallback), managed entirely within the email delivery provider's dashboard. The platform's responsibility is limited to:

1. Selecting the correct `templateId`
2. Passing a `params` data dictionary with the required template variables
3. Specifying the recipient (`to` address and display name)

This separation ensures that visual design changes to emails never require a platform deployment.

### 16.1.3 Unsubscribe Mechanism

Per GDPR Art. 7(3) and CAN-SPAM requirements:

- All **informational** emails MUST include a one-click unsubscribe link in the footer
- Unsubscribe is managed by the email delivery provider's built-in list management
- Users can also toggle their newsletter preference in account settings (Chapter 30, §30.10)
- **Transactional** emails (OTP, password reset, email confirmation) do not include unsubscribe links, as they are required for core platform functionality

### 16.1.4 Error Handling & Bounces

As detailed in **Chapter 25 (Interview Findings)**, if an email fails to deliver (hard bounce):
- There is **no automated recovery path** initiated by the platform
- It is solely the user's responsibility to provide a valid email
- Bounces are tracked by the delivery provider, but the user must visit their profile settings to correct their email if needed

### 16.1.5 Idempotency

Email triggers may fire more than once due to retries or concurrent requests. To prevent duplicate sends:
- Each trigger call includes an **idempotency key** derived from the trigger context (e.g., `event_reminder:{event_id}:{user_id}`)
- The email delivery provider deduplicates on this key
- The platform does not maintain its own send log — deduplication is the provider's responsibility

---

## 16.2 Delivery Constraints (Opt-In & GDPR)

The platform classifies emails into two rigid categories: **Transactional** and **Informational/Marketing**. Delivery is gated based on the user's `email_confirmed` state from **Chapter 18**.

| Email Category | Definition | Delivery Condition |
|----------------|------------|--------------------|
| **Transactional** | Required to use the core platform features (authentication, account access). | Bypasses `email_confirmed` check. Sent to any provided email. |
| **Informational** | Reminders, newsletters, surveys, follow-ups, and decision notifications. | Requires `email_confirmed = TRUE`. The platform silently skips sending to unconfirmed accounts. |

---

## 16.3 Stateless Trigger Architecture

The platform is a **stateless web application** with no background workers or cron jobs (see Chapter 1, §1.3 "Stateless Platform, External Triggers"). Email triggers fall into two categories based on how they are initiated:

### 16.3.1 Synchronous Triggers

Fired within the same HTTP request that causes the triggering event. The platform calls the email provider API before returning the response.

**Examples**: OTP generation, password reset, email confirmation, welcome email.

### 16.3.2 Scheduled Triggers (External Cron)

Time-based emails (reminders, follow-ups) cannot be triggered lazily because they must arrive at a specific time regardless of user activity. These are initiated by an **external scheduler** (cron job, cloud scheduler, or orchestration service) that calls a platform API endpoint.

The platform exposes **trigger endpoints** that:
1. Accept the trigger type and any context (e.g., event ID)
2. Query the database for eligible recipients (registered, email confirmed, not already notified)
3. Call the email provider for each eligible recipient
4. Return a summary of sends attempted

The external scheduler's configuration and scheduling logic is documented in `adr/`, not in this specification.

---

## 16.4 Consolidated E-mail Trigger Inventory

The following matrix standardizes every email sent by the platform, consolidating requirements from across the design specifications.

### 16.4.1 Authentication & Onboarding (Ch. 18, 30)

| E-mail Title | Category | Trigger Type | Trigger Event | Required Template Variables | Reference |
|--------------|----------|-------------|---------------|--------------------------|-----------|
| **Onboarding OTP** | Transactional | Synchronous | User created via CSV import or admin; requires initial password setup | `otp_code` | Ch. 18, §18.3 |
| **Password Reset** | Transactional | Synchronous | User clicks "Forgot Password" | `otp_code` | Ch. 18, §18.3 |
| **Email Confirmation** | Transactional | Synchronous | User completes self-registration (Local Auth) | `confirmation_link` | Ch. 18, §18.5; Ch. 30, §30.8 |
| **Welcome Email** | Informational | Synchronous | User successfully confirms their email address | `display_name`, `profile_url` | Ch. 30, §30.11.1 |

**Note on OAuth Users:** OAuth users have `email_confirmed` set to `TRUE` implicitly because the identity provider is trusted. They bypass the Email Confirmation sequence.

### 16.4.2 Events & Logistics (Ch. 29, 30)

| E-mail Title | Category | Trigger Type | Trigger Event | Required Template Variables | Reference |
|--------------|----------|-------------|---------------|--------------------------|-----------|
| **Event Invitation** | Informational | Synchronous | Admin invites users or CSV import links an existing user to an event | `event_name`, `event_date`, `rsvp_url` | Ch. 29, §29.5; Ch. 30, §30.10 |
| **Event Reminder** | Informational | Scheduled | External cron calls trigger endpoint 24h before event start | `event_name`, `location_details`, `start_time` | Ch. 29, §29.11.1 |
| **Waitlist Notification** | Informational | Synchronous | A spot opens for a waitlisted user (cancellation triggers slot reallocation) | `event_name`, `claim_deadline_url` | Ch. 30, §30.9 |
| **Thank-You / Follow-Up** | Informational | Scheduled | External cron calls trigger endpoint 24h after event conclusion | `event_name`, `feedback_url`, `results_url` | Ch. 29, §29.11.4 |

### 16.4.3 Problem Owner Decision Notifications

| E-mail Title | Category | Trigger Type | Trigger Event | Required Template Variables | Reference |
|--------------|----------|-------------|---------------|--------------------------|-----------|
| **Decision Notification** | Informational | Synchronous | A binding moderator decision is recorded on a problem owned by the user | `problem_title`, `decision_display_name`, `rationale`, `problem_url` | Ch. 10; Ch. 18, §18.14 |

**Decision types that trigger PO notification:**

| Decision Type | Notification Summary |
|---------------|---------------------|
| `quality_gate_accepted` | "Your problem has been accepted" |
| `quality_gate_rejected` | "Your problem was not accepted" (includes rationale) |
| `quality_gate_needs_changes` | "Changes requested on your problem" (includes rationale) |
| `selected_for_event` | "Your problem was selected for {event_name}" |
| `deselected_for_event` | "Your problem was removed from {event_name}" |

**Not notified**: Deferral, sprint, live, and close decisions — these are visible in-app and do not warrant email interruption.

### 16.4.4 Future Direction (Not MVP)

The following notification emails are planned but deferred:

- **Team Join Notification**: When a developer joins a Problem Owner's team via "Challenge Accepted"
- **Assessment Results Available**: Post-event notification that review scores have been published
- **Contribution Milestone**: "You earned your first star!" or "You reached 20 contribution points"
- **Cross-Location Interest**: "A problem you deferred in Cologne was picked up in Aachen"

These require additional infrastructure (notification preference management, per-user opt-out granularity) that exceeds MVP scope. See Chapter 22 for deferred specification tracking.

---

## 16.6 Versioned Event Email Templates

To provide moderators with granular content control and maintain a perfect audit history of what was sent to users, event-specific communications (Invitations, Reminders, and Waitlist Notifications) rely on a versioned template system.

### 16.6.1 The Default Template & Event Creation
The platform maintains a single **Global Default Template** for Event Invitations/Reminders.
When a new Event is planned or created in the system, this global default is copied and saved as **Version 1** in the `event_email_templates` table specifically for that event, with `is_current = true`.

### 16.6.2 Moderator Customization & Versioning
Moderators can view and edit the active template for an event via the Moderator Dashboard.
Because emails may be sent out gradually (e.g., as waitlist spots open over weeks), editing an active template **does not mutate** the existing record.
Instead, when a moderator makes a change (e.g., adding "Special Guest: The Mayor!") and saves:
1. The previous version is marked `is_current = false`.
2. A new version (e.g., Version 2) is created with the new text and marked `is_current = true`.

### 16.6.3 Dispatch Resolution
When an email trigger is fired (either manually by a moderator or fully automatically by the OS-Cron):
The system *always* uses the `body_markdown` of the template version where `is_current = true` at the exact millisecond the trigger executes.

**Contextual Overrides & Appendices**:
- **Event Reminders / Invitations**: Receive the versioned template exactly as authored.
- **Waitlist Auto-Invitations**: To obey the DRY principle, the system dynamically appends a non-versioned, hardcoded string to the bottom of the current versioned template before sending.
  - *Added Text*: `"A spot has opened up for you! Please log in and explicitly confirm your participation within 24 hours, or this spot will be offered to the next person on the waitlist."*

This guarantees that a late registrant pulled from the waitlist receives the exact same "Special Guest" context (e.g., Version 3) as the general attendee base, alongside their specific temporal constraints.

---

## 16.7 Relationship to Other Chapters

- **Chapter 1**: Design principles — stateless platform architecture constrains trigger patterns
- **Chapter 10**: Decisions — decision recording triggers PO notifications
- **Chapter 18**: Authentication — OTP, password reset, email confirmation flows; `email_confirmed` field gates informational email delivery
- **Chapter 19**: Data model — `users.email_confirmed` field, `event_email_templates` (§19.3.9), `communications_log` (§19.3.10)
- **ADR 010**: Time and Scheduling Architecture — OS-Cron hybrid model for automated waitlist emails and moderator-controlled broadcasts
- **Chapter 25**: Interview findings — error handling and bounce policy
- **Chapter 29**: Events and locations — event invitation, reminder (§29.11.1), and follow-up (§29.11.4) triggers
- **Chapter 30**: Registration and onboarding — registration confirmation, waitlist notification (§30.9), welcome email (§30.11.1)
- **`adr/005_email_provider_brevo.md`**: Provider choice, API payload schema, template management strategy
