# ADR 005: Email Provider — Brevo

## Status

**Accepted** (2026-02-05)

## Context
The platform generates several transactional and informational outbound emails: onboarding OTPs, event invitations, confirmation links, and waitlist allocations ([as defined in Platform Spec Chapter 16](../platform/16_e-mail_communication.md)). 

Historically, applications either set up their own internal SMTP servers or passed fully-rendered HTML blocks to an external service. This causes layout rendering discrepancies depending on the receiver's app, raises immediate GDPR compliance questions, causes high bounce rates, and tightly couples the application code to email CSS logic. 

We require an architectural strategy ("Option 1") to deliver these notifications securely and reliably.

## Decision
We have decided to use **Brevo (formerly Sendinblue)** natively via their REST API as the exclusive infrastructure endpoint for system outbound mail.

### Justification
1. **Separation of Concerns (Template Decoupling):** We absolutely do not assemble email HTML in our backend application code. All visual templates, dynamic layouts, and translations exist strictly within the Brevo Dashboard. 
2. **Lean API Communication:** Our backend service merely passes minimal contextual data dictionaries to trigger the delivery:
   - `templateId`
   - `params` (e.g. `otp_code` or `magic_link`)
3. **GDPR Default Compliance:** By default, Brevo hosts inside the EU and complies heavily with GDPR data handling mandates.
4. **Reliability and Tracking:** By not using an SMTP bridge and interfacing natively with the HTTP API, we completely avoid legacy networking bottlenecks and benefit from webhook-driven bounce state resolutions if we choose to implement them natively later on.

## Consequences
- **Positive:** We avoid styling and tweaking tables inside of backend application routes. Business logic is extremely lean. Delivery rates are high.
- **Positive:** Changes to the onboarding email text do not require deploying a new backend container version.
- **Negative/Risk:** Vendor lock-in. Switching to SendGrid, Mailgun, or Postmark would require recreating all the visual templates out of Brevo and mapping new API request structures in the Node.js/Typescript codebase. 
- **Development Implication:** Local development must be routed to a sterile/sandbox API key or a console-logger dummy class to prevent real emails being sent out while modifying local state.

## Implementation Details

### Two Dispatch Patterns

The platform uses two distinct email dispatch patterns, both routed through the Brevo REST API (`POST https://api.brevo.com/v3/smtp/email`):

#### Pattern 1: Transactional Emails (Brevo-Managed Templates)

For authentication and onboarding flows, the backend sends only a `templateId` and `params`. The email's visual layout, subject line, and body text are managed entirely within the Brevo Dashboard.

```json
{
  "to": [{ "email": "target@domain.test", "name": "Dynamic Name" }],
  "templateId": 4,
  "params": {
    "otp_code": "A8kz9mXp2qLw",
    "platform_url": "https://vibecoding.events"
  }
}
```

**Required Brevo templates** (IDs configured via `BREVO_TEMPLATE_*` env vars):

| Env Variable | Purpose | Required `params` |
|-------------|---------|-------------------|
| `BREVO_TEMPLATE_EMAIL_CONFIRMATION` | Self-registration confirmation link | `confirmation_url`, `display_name` |
| `BREVO_TEMPLATE_PASSWORD_RESET` | Forgot-password OTP delivery | `otp_code`, `display_name` |
| `BREVO_TEMPLATE_ONBOARDING_OTP` | CSV-import initial password setup | `otp_code`, `set_password_url`, `display_name` |

#### Pattern 2: Event Emails (Platform-Managed Content)

For event communications (broadcasts, waitlist invites, reminders), the content is authored by moderators in the platform's versioned `event_email_templates` table (Ch.16.6). The backend passes the moderator-authored subject and body as `params` to a single **generic wrapper template** in Brevo. This wrapper provides the standard visual layout (header, footer, unsubscribe link) while the content comes from the platform.

```json
{
  "to": [{ "email": "target@domain.test", "name": "Dynamic Name" }],
  "templateId": 10,
  "params": {
    "subject_line": "Reminder: VibeCoding Cologne starts soon!",
    "body_content": "Hi Max, ...",
    "display_name": "Max Mustermann"
  }
}
```

| Env Variable | Purpose | Required `params` |
|-------------|---------|-------------------|
| `BREVO_TEMPLATE_EVENT_GENERIC` | Wrapper for moderator-authored event emails | `subject_line`, `body_content`, `display_name` |

This preserves the ADR's core principle: no HTML assembly in backend code. The Brevo wrapper template handles all visual rendering.

### API Configuration

| Env Variable | Purpose | Default |
|-------------|---------|---------|
| `BREVO_API_KEY` | Brevo REST API key (v3) | *none* — dev mode logs to console |
| `BREVO_SENDER_EMAIL` | From address for all emails | `noreply@vibecoding.events` |
| `BREVO_SENDER_NAME` | Display name for sender | `VibeCoding Community` |
| `BREVO_TEMPLATE_EMAIL_CONFIRMATION` | Template ID for email confirmation | — |
| `BREVO_TEMPLATE_PASSWORD_RESET` | Template ID for password reset OTP | — |
| `BREVO_TEMPLATE_ONBOARDING_OTP` | Template ID for CSV-import onboarding | — |
| `BREVO_TEMPLATE_EVENT_GENERIC` | Template ID for event wrapper | — |
| `ORIGIN` | Platform base URL for building links | `http://localhost:5173` |

### Dev Mode Behavior

When `BREVO_API_KEY` is not set (local development), all email dispatch functions log to the server console with `[EMAIL-DEV]` prefix and return success. The `communications_log` audit trail is always written regardless of dispatch mode.

### Idempotency (Ch. 16.1.5)

Each email dispatch includes an `X-Mailin-custom` header containing a deterministic idempotency key derived from the trigger context:

| Trigger | Key Pattern |
|---------|-------------|
| Email confirmation | `confirm:{user_id}:{hash_prefix}` |
| Password reset | `reset:{user_id}:{timestamp_minute}` |
| Onboarding OTP | `onboard:{user_id}` |
| Event broadcast | `broadcast:{event_id}:{template_version}:{user_id}` |
| Waitlist invite | `waitlist:{event_id}:{registration_id}` |
| Event reminder | `reminder:{event_id}:{user_id}` |

Note: Brevo does not natively deduplicate on custom headers. The idempotency key is passed as a `params` field (`_idempotency_key`) for potential future webhook reconciliation. The primary deduplication responsibility remains with the platform's trigger logic (e.g., checking `waitlist_invited_at` before re-inviting).

## References

- Platform Spec Chapter 16: E-Mail Communication (trigger inventory, delivery constraints, idempotency)
- Platform Spec Chapter 18: Authentication — OTP, password reset, email confirmation flows
- Platform Spec Chapter 30: Registration and Onboarding — welcome email, waitlist notification
- Brevo API Reference: https://developers.brevo.com/reference/sendtransacemail
