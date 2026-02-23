# 29. Events and Locations

This chapter specifies the **event management model** for the multi-location community platform. It covers partners, locations, rooms, events, capacity management, and the waitlist system.

---

## 29.1 Conceptual Model

The platform hosts **events** at **locations** in partnership with **partner organizations**. This model supports:

- Multiple locations (Cologne, Aachen, future cities)
- Partner organization attribution and branding
- Room-based capacity management with overbooking
- Waitlist handling for in-presence attendance

### Entity Hierarchy

```
Partner (e.g., STARTPLATZ)
  └── hosts Events
Location (e.g., STARTPLATZ Köln)
  └── contains Rooms
Room (e.g., Workshop Room A)
  └── hosts Events (with capacity)
Event (e.g., VibeCoding Cologne March 2026)
  └── has Registrations
  └── has Problems (via queue)
```

---

## 29.2 Partners

### Definition

A **Partner** is an organization that hosts or co-hosts events. Partners provide venues, community access, and organizational support.

### Partner Types

| Type Key | Display Name | Examples |
|----------|--------------|----------|
| `coworking` | Co-Working Space | STARTPLATZ, WeWork |
| `university` | University | RWTH Aachen, TH Köln |
| `company` | Company | Corporate sponsors |
| `community` | Community | Event groups, user groups |

### Partner Data

Each partner record includes:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Organization name |
| Logo URL | No | URL to logo image (for auto-generated event images) |
| Website URL | No | Organization website |
| Contact Name | No | Primary contact person |
| Contact Email | No | Contact email address |
| Partner Type | Yes | One of the defined types |
| Description | No | Partner bio/description |

### Partner Management

- Administrators can create and edit partners
- Partners are referenced by events (not deleted if referenced)
- Partner logo is used for auto-generated event images

---

## 29.3 Locations and Rooms

### Locations

A **Location** represents a physical venue where events can be held.

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Location name (e.g., "STARTPLATZ Köln") |
| Address | Yes | Street address |
| City | Yes | City name (for filtering/grouping) |

### Rooms

A **Room** is a specific space within a location with defined capacity.

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Room name (e.g., "Workshop Room A") |
| Location | Yes | FK to location |
| Max Pax (Tables) | Yes | Maximum capacity with tables |
| Max Pax (No Tables) | Yes | Maximum capacity without tables |

### Capacity Modes

Events use room capacity in one of two modes:

- **With Tables**: Standard workshop setup, uses `max_pax_tables`
- **Without Tables**: Theater/standing setup, uses `max_pax_no_tables`

The event configuration specifies which capacity mode applies.

---

## 29.4 Events

### Definition

An **Event** is a concrete occurrence at a specific time, location, and with specific hosts.

### Event Data

| Field | Required | Description |
|-------|----------|-------------|
| Slug | Yes | Human-readable URL identifier (e.g., "cologne-march-2026") |
| Partner | Yes | FK to hosting partner |
| Room | Yes | FK to venue room |
| Title | Yes | Event title |
| Description | No | Event description/agenda |
| Starts At | Yes | Event start time |
| Planned Ends At | Yes | Planned end time |
| Host | Yes | Primary host (FK to user) |
| Co-Host 1 | No | Optional co-host |
| Co-Host 2 | No | Optional co-host |
| Website URL | No | External event page |
| LinkedIn URL | No | LinkedIn announcement |
| X Post URL | No | X/Twitter announcement |
| Image URL | No | Custom event image (overrides auto-generated) |
| Overbooking Factor | Yes | Default 1.30 (130%) |

**Registration Component Integration**: RegistrationSection component (Ch.26.11.22) encapsulates all registration logic and can be embedded in any event view.

### Event URLs

Events are accessible via human-readable URLs:

```
/event/{slug}
```

Examples:
- `/event/cologne-march-2026`
- `/event/aachen-april-2026`
- `/event/cologne-special-ai-workshop`

### Event Image Generation

By default, event images are **auto-generated** from:
1. Partner logo
2. Event title
3. Event date

Administrators can override with a custom image by setting `image_url`.

### Event Visibility

Events are visible on the public dashboard **immediately when created**. There is no draft/publish workflow for events.

---

## 29.5 Capacity Management

### Base Capacity

Base capacity is derived from the room:

```
base_capacity = room.max_pax_tables  (or max_pax_no_tables)
```

### Overbooking

Events support **overbooking** to account for no-shows:

```
overbooking_capacity = base_capacity × overbooking_factor
```

Default overbooking factor is **130%** (1.30).

Example:
- Room capacity: 30 seats
- Overbooking factor: 1.30
- Overbooking capacity: 39 registrations allowed

### Display Capacity Logic

To hide overbooking from users, capacity display follows this rule:

| Registration Level | Displayed Value |
|-------------------|-----------------|
| 0-70% of base capacity | Actual registered count |
| 70%+ of base capacity | `max(registered, overbooking_capacity - registered)` |

Example (30-seat room, 39 overbooking cap):
- 15 registered → Show "15/30"
- 21 registered (70%) → Show "21/30"
- 25 registered → Show "25/30" (not "25/39")
- 35 registered → Show "35/30" (shows overflow)

This prevents revealing the overbooking buffer while showing realistic availability.

### Show-Up Rate Tracking

The system tracks actual attendance to optimize overbooking factors:

1. At event check-in, moderators mark attendance
2. System calculates show-up rate: `showed_up / registered`
3. Historical show-up rates inform future overbooking decisions

---

## 29.6 Waitlist System

### Triggering Waitlist

When in-presence registrations reach `overbooking_capacity`:
- New in-presence registrations go to **waitlist**
- Waitlist position assigned sequentially
- Remote registrations are not waitlisted

### Waitlist Invitation

When a registered user cancels their in-presence registration:

1. System identifies top waitlist user
2. System sends invitation email
3. User has **24 hours** to respond
4. If accepted: Registration confirmed, removed from waitlist
5. If no response: Invitation expires, next user invited
6. If declined: Next user invited

### Waitlist Data

| Field | Description |
|-------|-------------|
| Waitlist Position | Sequential position (1, 2, 3...) |
| Waitlist Invited At | When invitation was sent |
| Waitlist Expires At | 24 hours from invitation |

### Waitlist Expiration

Expired invitations are handled automatically:
- System checks for expired invitations periodically
- Expired invitations trigger next-in-line invitation
- Users can re-register (goes to end of waitlist)

---

## 29.7 Event Lifecycle

### Creation

1. Administrator creates event with all required fields
2. Event immediately visible on public dashboard
3. Registrations open immediately

### During Event

1. Moderators open pitch/review phases (see Chapter 14)
2. Moderators record attendance for show-up tracking
3. Team formation via "Join as Dev" button on Problem Cards (see Chapter 31)

### After Event

1. Event remains visible in "Past Events" section
2. Assessment data preserved
3. Chat history preserved
4. Show-up rate calculated

---

## 29.8 Event-Problem Association

Problems are associated with events via the **event problem queue** (see Chapter 11).

### Queue State vs Action State

The system maintains **two distinct state tracking mechanisms**:

**Problem Action State** (on `problems` table, see Ch.4.3, Ch.27):
- Global disposition: `backlog`, `selected_for_event`, `selected_for_coding`, `deferred`, `dropped`, `closed`
- Applies across all events
- Driven by decisions (Ch.10)
- Represents the problem's overall lifecycle status

**Event Queue State** (on `event_problem_queue` table):
- Event-specific association: `candidate`, `selected_for_pitch`, `selected_for_coding`, `completed`
- Scoped to a single event
- Tracks the problem's journey within that specific event
- Enables event-specific backlog management

**Relationship**: When a problem is `selected_for_event` (action state), it may have different queue states in different event queues. A problem in `backlog` action state would not appear in any event queue.

| Queue State | Meaning |
|-------------|---------|
| `candidate` | Problem is a candidate for this event |
| `selected_for_pitch` | Problem will be pitched at this event |
| `selected_for_coding` | Problem selected for sprint at this event |
| `completed` | Problem work completed at this event |

A problem can be associated with multiple events over time, enabling longitudinal analysis.

**Version-Scoped Event Participation**: When a problem is associated with an event, the **major version active at event start** becomes the reference version. Participants evaluate that specific semantic snapshot during pitch and review phases. If a Problem Owner creates new versions mid-event, the event queue continues referencing the original version. This enables tracking: Does refinement improve evaluation scores across events? See Chapter 5.4 for version-scoping mechanics.

---

## 29.9 Hosts and Co-Hosts

### Host Responsibilities

The primary **Host** is responsible for:
- Event orchestration
- Live moderation
- Decision recording

### Co-Host Capabilities

Co-hosts (up to 2) have the same capabilities as the host during the event. This enables:
- Shared moderation duties
- Backup coverage
- Cross-location collaboration

### Host Requirements

Hosts and co-hosts must have `moderator` or `admin` role.

---

## 29.10 External Links

Events support links to external resources:

| Link Type | Purpose |
|-----------|---------|
| Website URL | External event page (Eventbrite, Event.com, etc.) |
| LinkedIn URL | LinkedIn announcement post |
| X Post URL | X/Twitter announcement |

These links are displayed on the event detail page and enable cross-platform promotion.

---

## 29.11 Event Rituals

Events have technical lifecycle (start/end timestamps), but also **ritual lifecycle** — structured moments that create belonging and continuity.

### 29.11.1 Pre-Event Rituals

**24-Hour Reminder Email:**
```
Subject: VibeCoding tomorrow! 🚀

Hi {Name},

You're registered for {Event Name} tomorrow at {Time}.

Quick prep:
☐ Browse the problems: {link}
☐ Have your laptop charged
☐ Know how to find the room: {location details}

What to expect:
• Problem pitches and voting
• Team formation and coding
• Solution reviews and lessons learned

See you tomorrow!
```

**Pre-Event Checklist (Dashboard):**

For registered participants, show checklist 24h before event:

```
Pre-Event Checklist for {Event Name}
────────────────────────────────────
☐ Browse the problems (3 problems selected)
☐ Check event location details
☐ Review community guidelines

[Mark all complete]
```

### 29.11.2 Event Opening Ritual

When the event begins, moderators follow a structured opening:

1. **Welcome Message** (system-generated in event chat):
   ```
   ─── {timestamp} Event started: Welcome to {Event Name}! ───
   ```

2. **Housekeeping Announcement** (moderator script):
   - WiFi information
   - Emergency exits
   - Break schedule
   - Code of conduct reminder

3. **Community Moment**:
   - "Who's here for the first time?" (first-timers wave)
   - Quick round of introductions (for smaller events)

### 29.11.3 Event Closing Ritual

When the event ends, create closure and anticipation:

1. **Wrap-Up Announcement**:
   ```
   ─── {timestamp} Event ended: Thank you for participating! ───
   ```

2. **Accomplishment Summary** (displayed on dashboard):
   ```
   What We Accomplished Today
   ──────────────────────────
   • 3 problems pitched
   • 2 problems coded
   • 28 participants contributed
   • 12 solutions reviewed
   • 8 lessons learned captured

   Top contributors today:
   • Eva Schmidt (5 points)
   • Max Mustermann (4 points)
   • Lisa Chen (3 points)
   ```

3. **Call to Action**:
   - "Don't forget to complete your review assessments!"
   - "Add your lessons learned while they're fresh"
   - "Join us next time: {Next Event Date}"

### 29.11.4 Post-Event Thank-You Flow

**Thank-You Email (sent 24h after event ends):**
```
Subject: Thank you for joining {Event Name}!

Hi {Name},

Thanks for participating in {Event Name}!

Your impact:
• You rated {N} problems
• You contributed {N} chat messages
• {Specific achievement, if any}

What's next:
• Complete post-event reviews: {link}
• Add lessons learned: {link}
• See the results: {link}

Next event: {Next Event Name} on {Date}
[Register for next event]
```

**Personal Accomplishment Summary:**

On user dashboard after event:

```
Your {Event Name} Summary
─────────────────────────
✓ Attended (in-presence)
✓ Completed 4 pitch assessments
✓ Joined team: "API Rate Limiter"
✓ Added 2 lessons learned

Points earned: 6
Stars earned: ⭐⭐ (2nd place: API Rate Limiter)

[View event details] [Add more lessons learned]
```

### 29.11.5 Moderator Wrap-Up Ceremony

At event close, moderators lead a verbal wrap-up:

1. **Celebration of accomplishments**: Highlight what was built
2. **Recognition of contributors**: Name top contributors
3. **Cross-location insights** (if available): Share valuable lessons from other locations
4. **Teaser for next event**: Create anticipation
5. **Reminder to complete reviews**: Encourage post-event engagement

**Wrap-Up Script (suggested):**
```
That's a wrap on {Event Name}!

Let's celebrate:
• {Problem 1} made great progress — team {names}
• {Problem 2} has a working prototype — team {names}
• Special thanks to {contributor} for {specific contribution}

From our Cologne friends last week:
"When using Claude for TDD, start with the test file open"

Next event: {Date} — problems are already being submitted!

Before you go:
1. Complete your review assessments (you have until {date})
2. Add lessons learned while they're fresh
3. Connect with your team if you want to continue

Thanks for being here!
```

---

## 29.12 Relationship to Other Chapters

- **Chapter 11**: Event model and problem queue
- **Chapter 12**: Event display on dashboards
- **Chapter 14**: Live interaction modes during events
- **Chapter 18**: Authentication required for registration
- **Chapter 19**: Data model for events, partners, locations, rooms
- **Chapter 30**: Registration and onboarding flows
- **Chapter 31**: Team formation and chat during events
- **Chapter 32**: Onboarding guidance feeds into event rituals
- **Chapter 33**: Milestone recognition integrates with event rituals
