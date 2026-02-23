# 30. Registration and Onboarding

This chapter specifies the **user registration flows**, **event registration**, **CSV import**, and **onboarding communications** for the community platform.

---

## 30.1 Overview

The platform supports multiple registration pathways:

| Pathway | Use Case |
|---------|----------|
| **Self-Registration** | Users register themselves via the platform |
| **CSV Import** | Administrators bulk-import users from partner lists |
| **Event Registration** | Existing users register for specific events |

All pathways result in:
- A user account with email as unique identifier
- Onboarding communication for new users
- Persistent identity across the community

---

## 30.2 Self-Registration Flow

### User Journey

1. **Landing**: User visits event page or registration page
2. **Method Selection**: Choose registration method
   - Email + Password
   - GitHub OAuth
   - LinkedIn OAuth
3. **Account Creation**: Enter required information
4. **Terms Acceptance**: Accept Terms & Conditions (mandatory)
5. **Newsletter Opt-In**: Get infoletter checkbox (default: checked)
6. **Confirmation**: Submit registration
7. **Email Verification**: Receive confirmation email
8. **Activation**: Click confirmation link

### Email + Password Registration

| Step | User Action | System Action |
|------|-------------|---------------|
| 1 | Enter email | Check if email exists |
| 2 | If exists | Prompt to login instead |
| 3 | If new | Show password field |
| 4 | Enter password | Validate against policy |
| 5 | Accept T&C | Record timestamp |
| 6 | Set newsletter preference | Store flag |
| 7 | Submit | Create user, send confirmation |

### OAuth Registration

| Step | User Action | System Action |
|------|-------------|---------------|
| 1 | Click "Sign in with GitHub/LinkedIn" | Redirect to provider |
| 2 | Authorize on provider | Receive user ID + email |
| 3 | Return to platform | Check if email exists |
| 4 | If exists | Link OAuth to existing account |
| 5 | If new | Show T&C + newsletter form |
| 6 | Accept T&C | Record timestamp |
| 7 | Set newsletter preference | Store flag |
| 8 | Submit | Create user, mark email confirmed |

**Note**: OAuth users have email automatically confirmed (provider verification trusted).

---

## 30.3 Email Uniqueness and Deduplication

### Core Principle

**Email addresses are UNIQUE across the platform.** When a registration is attempted:

1. System checks if email already exists
2. If exists: No new user created
3. Instead: Existing user is used/linked

### Deduplication Scenarios

| Scenario | Result |
|----------|--------|
| New email, self-registration | Create new user |
| Existing email, self-registration | Prompt to login |
| Existing email, OAuth | Link OAuth to existing user |
| Existing email, CSV import | Skip (no duplicate), link to event |
| New email, CSV import | Create new user |

### Event Registration with Existing User

When registering for an event:
1. User enters email
2. System checks existence
3. If exists: Only create event registration (not new user)
4. If new: Full registration flow

---

## 30.4 CSV Import

### Purpose

Partner organizations (e.g., co-working spaces, companies) provide lists of attendees. Administrators import these to:
- Pre-register users for events
- Enable faster check-in
- Build community mailing list

### CSV Format

```csv
email,display_name,event_slug,in_presence
max.mustermann@example.com,Max Mustermann,cologne-march-2026,true
eva.schmidt@example.com,Eva Schmidt,cologne-march-2026,true
remote.user@example.com,Remote User,cologne-march-2026,false
```

| Column | Required | Description |
|--------|----------|-------------|
| `email` | Yes | User email address |
| `display_name` | Yes | User display name |
| `event_slug` | No | Event to register for |
| `in_presence` | No | In-presence attendance (default: true) |

### Import Logic

For each row:

1. **Check email**: Does user exist?
2. **If new user**:
   - Create user with `role = 'observer'`
   - Generate OTP
   - Set `get_infoletter = TRUE`
   - Queue onboarding email
3. **If existing user**:
   - Skip user creation
   - Use existing user_id
4. **If event_slug provided**:
   - Create event registration
   - Check capacity/waitlist
5. **Report**: Show import results

### Import Report

After import, administrator sees:

```
Import Results:
- Total rows: 50
- New users created: 35
- Existing users found: 15
- Event registrations created: 48
- Waitlisted: 2
- Errors: 0
```

### Import Permissions

Only **Administrators** can perform CSV imports.

---

## 30.5 Terms & Conditions

### Mandatory Acceptance

Users must accept Terms & Conditions to:
- Register for events
- Create problems
- Join teams
- Post in chat

### T&C Display

During registration, display:
- Link to full T&C document
- Checkbox: "I accept the Terms & Conditions"
- Checkbox must be checked to proceed

### T&C Recording

| Field | Value |
|-------|-------|
| `terms_accepted_at` | Timestamp of acceptance |

### T&C Content

**OPEN POINT**: Terms & Conditions content to be provided separately. The platform hosts the T&C page; content is managed externally.

### T&C Updates

When T&C are updated:
1. Existing users see prompt on next login
2. User must re-accept to continue
3. New `terms_accepted_at` recorded

---

## 30.6 Newsletter (Infoletter) Preference

### Default Behavior

| Registration Type | Default Value |
|-------------------|---------------|
| Self-registration | Checked (opt-out) |
| CSV import | TRUE (opt-out) |
| OAuth | Checked (opt-out) |

### User Control

The `get_infoletter` checkbox:
- Appears during registration
- Can be changed in account settings
- Affects receipt of:
  - Event announcements
  - Community newsletters
  - New problem notifications
  - Community achievements

### Checkbox State for Existing Users

When an existing user registers for an event:
1. System retrieves current `get_infoletter` value
2. Checkbox displayed in current state
3. User can toggle
4. Updated value saved

---

## 30.7 Onboarding Email

### Trigger

Onboarding email sent when:
- New user created (any pathway)
- First-time registration

### Email Content

**Subject**: Welcome to VibeCoding Professionals

**Body includes**:
1. Welcome message
2. Platform introduction
3. One-time password (for email+password users)
4. Email confirmation link
5. Quick start guide
6. Community guidelines summary
7. Team culture expectations:
   - Positivism and constructive feedback
   - Staying on topic
   - Bot messages are clearly marked

### Email Confirmation

The email includes a confirmation link:
```
https://platform.example.com/confirm-email?hash={confirmation_hash}
```

Link validity: **24 hours**

### Confirmation Flow

1. User clicks link
2. System validates hash and expiry
3. If valid: Set `email_confirmed = TRUE`
4. Show success message
5. Redirect to dashboard

### Expired Confirmation

If link expired:
1. Show "Link expired" message
2. Offer "Resend confirmation" button
3. Generate new hash, send new email

---

## 30.8 Event Registration Flow

### Prerequisites

User must:
- Have an account (or create one)
- Accept Terms & Conditions

Note: Users can register even if email is unconfirmed, but will not receive event reminder emails or waitlist notifications until email is confirmed (Chapter 18.5).

### Registration Steps

1. **View Event**: User navigates to `/event/{slug}`
2. **Click Register**: Prominent "Register for Event" button
3. **Login/Register**: If not logged in, prompt authentication
4. **Attendance Mode**: Select "In-Presence" or "Remote"
5. **Newsletter Check**: Show current preference, allow toggle
6. **Confirm**: Submit registration

### Capacity Check

For in-presence registration:

| Condition | Result |
|-----------|--------|
| Under overbooking capacity | Registered immediately |
| At overbooking capacity | Added to waitlist |

### Registration Confirmation

System sends confirmation email:
- Event details
- Date/time
- Location address
- Waitlist position (if applicable)

### Mobile Registration Experience

**Added 2026-02-05**: Mobile registration flow uses vertical layout with full-width controls. Native pickers for platform-optimized UX. See event_detail_design.md for complete registration section specification.

**Key Mobile Patterns**:
- Attendance mode: Vertical radio button cards (full-width)
- Capacity indicator: Inline with color-coded icons
- T&C checkbox: Clickable link opens in new tab
- Register button: Full-width, 48px height, primary variant
- Loading state: Spinner with "Registering..." text
- Success: Toast notification + section transforms to confirmation state

---

## 30.9 Waitlist Notification Flow

### Slot Available

When a registration is cancelled:

1. System identifies next waitlist user
2. Send invitation email
3. Set `waitlist_invited_at` and `waitlist_expires_at`

### Invitation Email

**Subject**: A spot opened up for {Event Title}!

**Body includes**:
- Event details
- "Confirm my spot" button
- Expiration notice (24 hours)
- "Decline" option

### Response Handling

| User Action | System Response |
|-------------|-----------------|
| Click confirm | Update registration, remove from waitlist |
| Click decline | Invite next in line |
| No response (24h) | Auto-decline, invite next |

---

## 30.10 Account Settings

### Accessible Settings

Authenticated users can manage:

| Setting | Description |
|---------|-------------|
| Display Name | Change display name |
| Password | Change password (local auth) |
| Linked Accounts | View/link GitHub/LinkedIn |
| Newsletter | Toggle subscription |
| Email | View (not changeable) |

### Password Change

1. Enter current password
2. Enter new password (must meet policy)
3. Confirm new password
4. Submit

### Linked Accounts

- View currently linked OAuth providers
- Link additional providers
- Cannot unlink if it's the only auth method

---

## 30.11 Onboarding Communications Enhancement

Beyond technical registration, onboarding communications set expectations and create belonging.

### 30.11.1 Welcome Email

Sent immediately after account confirmation:

```
Subject: Welcome to VibeCoding! 🚀

Hi {Name},

Welcome to the VibeCoding community!

We're a community of software professionals exploring how AI tools
are changing the way we write code. Here's what you can do:

📝 Submit a Problem
   Got a coding challenge? Share it with the community.
   [Create your first problem]

📅 Join an Event
   We meet regularly in Cologne and Aachen.
   [Browse upcoming events]

💬 Connect
   Each problem has a team chat. Join the conversation!

Quick Start:
1. Browse our problems to see what we work on
2. Register for an upcoming event
3. Show up, pitch ideas, code together, learn

Questions? Reply to this email.

See you soon!
The VibeCoding Team
```

### 30.11.2 Role-Specific Orientation

Based on first action, send targeted orientation:

**After first problem submission:**
```
Subject: Your problem is submitted! What's next

Hi {Name},

Your problem "{Problem Title}" is now submitted for review!

What happens next:
1. A moderator will review it within a few days
2. You'll see feedback in the chat section of your problem card
3. Once accepted, your problem can be pitched at events

Tips for a successful problem:
• Keep acceptance criteria specific
• Link a repository (even if empty)
• Be responsive to moderator feedback

[View your problem]
```

**After first event registration:**
```
Subject: You're registered for {Event Name}

Hi {Name},

You're confirmed for {Event Name} on {Date}!

What to expect:
• 🎤 Pitch phase: Problems are presented, you vote
• 👥 Team formation: Join a problem that interests you
• 💻 Coding sprint: Work together on solutions
• ⭐ Review: Rate the outcomes

Preparation (optional):
• Browse the problems: [link]
• Bring your laptop and charger
• Join remotely if you can't attend in person

Location: {Address}
Time: {Start Time}

[View event details]
```

### 30.11.3 Community Guidelines Summary

Included in welcome email and displayed during onboarding:

```
Community Guidelines
────────────────────

1. BE CONSTRUCTIVE
   Share feedback that helps others improve.

2. STAY ON TOPIC
   Keep discussions focused on the problems.

3. RESPECT EACH OTHER
   We're professionals with different backgrounds and tools.

4. SHARE KNOWLEDGE
   Lessons learned help the whole community.

5. HAVE FUN
   This is about learning, not competing.

Full guidelines: [link]
```

### 30.11.4 "What to Expect at Your First Event"

Pre-event communication for first-time attendees:

```
Subject: Your first VibeCoding event tomorrow!

Hi {Name},

Tomorrow is your first VibeCoding event! Here's what to expect:

18:00 - Welcome & Introductions
  We'll go around the room briefly. Don't worry, it's casual.

18:15 - Problem Pitches
  3-4 problems will be presented. You'll rate them on your phone.

18:45 - Problem Selection
  Based on votes and discussion, we pick 1-2 to work on.

19:00 - Coding Sprint (90 min)
  Join a team and start coding! Beginners welcome.

20:30 - Solution Reviews
  Teams demo what they built. We rate the outcomes.

21:00 - Wrap-up
  Share lessons learned. Plan for next time.

What to bring:
• Laptop (charged!)
• Your favorite IDE
• Curiosity

What NOT to worry about:
• Being an expert (we're all learning)
• Having a perfect solution (rough is fine)
• Knowing everyone (we do intros)

[View event details]
```

### 30.11.5 Re-Engagement Communications

For users who haven't participated recently:

**After 30 days of inactivity:**
```
Subject: We miss you at VibeCoding!

Hi {Name},

It's been a while since we've seen you. Here's what's happening:

Recent activity:
• 12 new problems submitted
• 3 successful events
• "API Rate Limiter" got an amazing solution

Upcoming events:
• {Event 1}: {Date} in {City}
• {Event 2}: {Date} in {City}

[Browse problems] [Register for an event]

Not interested anymore? [Unsubscribe from updates]
```

---

## 30.12 Relationship to Other Chapters

- **Chapter 18**: Authentication methods and policies
- **Chapter 19**: Data model for users and registrations
- **Chapter 29**: Events and capacity management
- **Chapter 31**: Team chat (requires registration)
- **Chapter 17**: Administrator CSV import interface
- **Chapter 32**: Onboarding flows and first-time guidance
- **Chapter 33**: Milestone recognition in communications
