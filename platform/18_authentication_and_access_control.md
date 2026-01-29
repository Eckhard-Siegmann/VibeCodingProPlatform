# 18. Authentication and Access Control

This chapter defines the **minimal but deliberate authentication and access-control model** of the system. It clarifies which actors must authenticate, which actors explicitly do not, and how authority boundaries are enforced without overengineering. The guiding principle is *operational safety with minimal friction*, aligned with the exploratory and community-driven nature of the meetup.

---

## 18.1 Login Model for Moderators and Administrators

The system distinguishes sharply between **participants** and **operators**.

### Who must log in

Only the following roles require authentication:

- **Moderator**
- **Administrator**

All other actors — including Problem Owners, Developers, Observers, and external reviewers — interact with the system **without mandatory login**, primarily via unique URLs and session-based identification.

This design ensures:
- Low-friction onboarding for contributors
- Minimal identity requirements for Problem Owners (email only, no password)
- Low operational overhead during live meetups

### Authentication mechanism

The authentication model is intentionally simple:

- **Moderators/Administrators**: Login via email + password
- **Problem Owners**: Email required at problem creation, but **no password**
  - Access to edit is via the private URL (security by obscurity)
  - Same email reuses existing user record, enabling attribution across problems
- Passwords stored as **secure hashes** (no plaintext, no reversible encryption)
- No OAuth, SSO, or third-party identity providers
- No multi-factor authentication (by design, not omission)

This model is sufficient because:
- The system does not manage sensitive personal data
- The threat model assumes a *gutmütige* (benign) community
- The primary risk is accidental misuse, not hostile intrusion
- Problem Owners who later become Moderators can have a password added to their existing record

### Session behavior

- Authenticated sessions persist for the duration of the browser session
- Moderators may log in from desktop or mobile devices
- Logging out immediately removes access to privileged UI controls

---

## 18.2 Role Escalation and Privilege Boundaries

### Distinct operational roles

There are two authenticated operational roles:

- **Moderator**
- **Administrator**

Administrators are a **strict superset** of Moderators.

An Administrator:
- Can perform all Moderator actions
- Can additionally modify system-defining artifacts (Items, Inventories, global configuration)

A Moderator:
- Can curate Problems
- Can trigger Decisions
- Can open and close Assessments
- Can manage meetup flow and dashboards
- **Cannot** alter Items, Inventories, or other statistical foundations

### Role escalation model

Role escalation is **explicit and manual**:

- An Administrator may promote a Moderator to Administrator via a flag
- There is no self-escalation
- There is no temporary escalation
- There is no UI-based “request admin rights” mechanism

This reflects the system’s governance model:
- Administrative power implies responsibility for data integrity
- Statistical validity depends on controlled modification of Inventories and Items
- Escalation is rare, intentional, and auditable

### Identity consistency

- A single email identity may exist with multiple privilege levels
- In practice, one person may possess:
  - A Moderator login
  - An Administrator login
- The system treats these as **distinct authority contexts**, even if associated with the same human

This avoids accidental high-privilege actions during live moderation while preserving convenience for system maintainers.

---

## 18.3 Security by Design vs. Security by Obscurity

### Deliberate use of security by obscurity

The system intentionally employs **security by obscurity** in specific, well-scoped areas:

- Private Problem Card URLs
- Editor URLs for Problem Owners
- Clone and draft access links

These URLs:
- Are long, random, and unguessable
- Are immutable once created
- Function as capability-based access tokens

This approach is acceptable because:
- The assets protected are collaborative drafts, not confidential data
- Accidental discovery is the primary risk, not targeted attack
- It dramatically simplifies UX for Problem Owners

### Where security by design applies

By contrast, **security by design** is enforced where mistakes would have systemic impact:

- Modifying Items
- Modifying Inventories
- Triggering binding Decisions
- Curating meetup backlogs
- Controlling live dashboards

These actions:
- Require authenticated roles
- Are gated by explicit UI controls
- Are logged as Decisions or administrative actions

### Explicit non-goals

The system explicitly does **not** aim to provide:

- Enterprise-grade access control
- Fine-grained permission matrices
- Audit logs for legal or compliance purposes
- Protection against malicious insiders

Attempting to do so would:
- Increase cognitive load
- Slow down live meetups
- Undermine the experimental and agentic nature of the platform

### Security philosophy summary

The guiding philosophy is:

> *Protect the integrity of the system, not the secrecy of its contents.*

By combining:
- Minimal authentication where necessary
- Capability-based URLs where sufficient
- Explicit privilege boundaries for critical operations

…the system achieves a pragmatic balance between openness, safety, and usability.

---

This authentication and access-control model is intentionally conservative in scope, yet robust enough to support live moderation, longitudinal data integrity, and collaborative experimentation without becoming an operational burden.
