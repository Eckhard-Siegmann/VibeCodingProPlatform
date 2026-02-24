# Architecture Decision Record: Email Delivery Infrastructure

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

## Abstract Data Payload Implementation Schema
The backend must send requests in this approximate shape without injecting HTML text:
```json
{
  "to": [{ "email": "target@domain.test", "name": "Dynamic Name" }],
  "templateId": 4,
  "params": {
    "event_name": "VibeCoding Aachen March 2026",
    "rsvp_url": "https://example.com/rsvp/token"
  }
}
```
