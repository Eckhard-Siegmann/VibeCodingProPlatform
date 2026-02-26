# VibeCoding Professionals Platform — User Manual

**Version 1.0** | February 2026

This manual covers all roles: Administrator, Moderator, Problem Owner, and Participant. Each section is self-contained — read only the section relevant to your role.

---

## Table of Contents

- [1. Platform Overview](#1-platform-overview)
- [2. Getting Started (All Users)](#2-getting-started-all-users)
- [3. Administrator Guide](#3-administrator-guide)
- [4. Moderator Guide](#4-moderator-guide)
- [5. Problem Owner Guide](#5-problem-owner-guide)
- [6. Participant Guide](#6-participant-guide)
- [Appendix A: Quality Dimensions](#appendix-a-quality-dimensions)
- [Appendix B: Keyboard & Audio](#appendix-b-keyboard--audio)

---

## 1. Platform Overview

The VibeCoding Professionals platform supports community hackathon events where participants explore software problems through structured evaluation and collaborative coding. Problems are pitched, coded, and reviewed during live events across multiple locations (Cologne, Aachen, and future cities).

**Core workflow per event:**

```
Problem submitted → Moderator approves → Queue planned → Event starts
  → Problem pitched (timed) → Audience rates pitch
  → Team forms → Coding session
  → Solution reviewed (timed) → Audience rates solution
  → Star awards announced → Lessons captured
```

**Roles at a glance:**

| Role | Primary Responsibility |
|------|----------------------|
| **Administrator** | System setup, user management, evaluation instruments, infrastructure |
| **Moderator** | Event orchestration, quality gates, live phase management |
| **Problem Owner** | Submit and maintain problems, form teams |
| **Participant** | Register for events, rate pitches/reviews, join teams, chat, share insights |

---

## 2. Getting Started (All Users)

### 2.1 Registration

Visit the platform and click **Register**. You need:

- **Display Name** — your public name on the platform
- **Email** — unique across the platform; this is your identity across events and locations
- **Password** — minimum 10 characters, must include uppercase, lowercase, and a number
- **Terms & Conditions** — must accept to proceed

Alternatively, register via **GitHub** or **LinkedIn** OAuth. New OAuth users complete a short form to accept terms and confirm their email.

After registration, check your inbox for a confirmation email. A yellow banner appears on every page until you confirm.

### 2.2 Login

Login with email + password, or click the GitHub/LinkedIn buttons. A "Remember me" option extends your session.

**Forgot your password?** Click the link on the login page. You receive a reset email (limited to 3 requests per hour).

### 2.3 Account Settings

Navigate to `/account` to:

- **Change password** — enter current password + new password. This logs you out of all other devices.
- **Newsletter preference** — opt in or out of the community newsletter.
- **API keys** — generate keys for bot integrations (see Section 3.8).

### 2.4 Navigation

| Route | What You See |
|-------|-------------|
| `/` | Landing page with upcoming events and quick links |
| `/dashboard` | Personal dashboard: your events, problems, contributions |
| `/event/{slug}` | Event detail page with registration |
| `/problem/{slug}` | Problem Card with chat, team, resources |
| `/assess/{id}` | Assessment form (pitch or review rating) |
| `/knowledge-base` | Cross-event insights and lessons learned |
| `/admin` | Admin panel (admin role only) |
| `/dashboard/moderator` | Moderator dashboard (moderator/admin only) |

---

## 3. Administrator Guide

Administrators have full system access. This section covers initial setup, ongoing configuration, and all management capabilities.

### 3.1 System Setup

#### 3.1.1 Database Initialization

The platform uses SQLite for development and PostgreSQL for production. To set up:

```bash
cd database

# Create the database and load schema
./.sqlite-tools/sqlite3.exe event.db ".read schema.sql"

# Load reference data (catalogs, items, inventories)
./.sqlite-tools/sqlite3.exe event.db ".read seed_reference_data.sql"

# Load demo data (optional, for testing)
./.sqlite-tools/sqlite3.exe event.db ".read seed_demo_data.sql"
```

**Order matters**: schema first, then reference data, then demo data.

To rebuild from scratch, delete `event.db` first. Note: the dev server locks the database file — stop it before rebuilding.

#### 3.1.2 Starting the Application

```bash
cd frontend/query

# Install dependencies (first time or after changes)
npm install

# Start development server
npm run dev

# Start with network access (for mobile testing)
npm run dev -- --host
```

The server runs at `http://localhost:5173`. For network access, use the IP address shown in the terminal output.

#### 3.1.3 Environment Configuration

Create a `.env` file in `frontend/query/` based on `.env.example`:

| Variable | Purpose |
|----------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth app secret |

OAuth is optional for development — local email/password authentication works without it.

### 3.2 Admin Dashboard

Navigate to `/admin`. The dashboard shows:

**System Statistics:**
- Total users, events, problems, assessments, decisions

**Health Indicators:**
- Active events (currently in progress)
- Open assessments (not yet closed)
- Retired items (evaluation questions no longer in use)
- Pending registrations (users on waitlists)

Quick-access cards link to all admin sections.

### 3.3 User Management

**Route:** `/admin/users`

View all registered users in a searchable, filterable table.

**Columns:** Name, Email, Role, Registration Date, Email Confirmed, Newsletter, Events Attended

**Filters:**
- Search by name or email
- Filter by role (Observer, Developer, Problem Owner, Moderator, Admin)
- Filter by email status (confirmed, unconfirmed, newsletter subscribers)

**Actions:**

| Action | Description |
|--------|------------|
| **Promote** | Elevate a user to Moderator or Admin. Opens a confirmation dialog explaining the role's scope. Cannot demote admins. Cannot promote bot/agent accounts. |
| **Export Newsletter** | Download a CSV of all newsletter subscribers. |
| **Import CSV** | Redirect to the CSV import wizard (see 3.4). |

### 3.4 CSV User Import

**Route:** `/admin/csv-import`

Bulk-import users from a partner-provided CSV. The wizard has 4 steps:

**Step 1 — Upload:** Drag-and-drop or select a CSV file (max 500 rows).

**Step 2 — Preview:** The system auto-detects columns. Expected headers:

| Column | Required | Description |
|--------|----------|-------------|
| `email` | Yes | User's email address |
| `display_name` | Yes | Public display name |
| `event_slug` | No | Event to register the user for |
| `in_presence` | No | `true` for in-person, `false` for remote |

**Step 3 — Confirm:** Review stats and set a default event if the CSV lacks `event_slug`.

**Step 4 — Report:** See results: how many users were created, how many already existed, how many were registered for events, and any errors with row numbers.

**What happens per new user:**
- Account created with role `observer`
- A one-time password (OTP) is generated
- `login_enabled` is set to `FALSE` — the user must set their own password via the `/set-password` link
- Email is marked as confirmed (since the partner vouches for the address)
- In development mode, OTPs are logged to the console

### 3.5 Event Management

**Route:** `/admin/events` (accessible to Moderators and Admins)

**Table columns:** Title, Partner, Location, Host, Registrations/Capacity, Start Date, Status

**Creating an Event:**

Click "Create Event". Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Event name |
| Description | No | Markdown supported |
| Partner | Yes | Select from registered partners |
| Room | Yes | Determines location and capacity |
| Host | Yes | Select from moderator/admin users |
| Co-hosts | No | Up to 2 additional moderators |
| Start Date/Time | Yes | When the event begins |
| End Date/Time | Yes | Planned end time |
| Website URL | No | External event page |
| LinkedIn URL | No | LinkedIn event link |
| X/Twitter URL | No | Social post link |
| Image URL | No | Event banner image |
| Overbooking Factor | No | 1.0–2.0 (default 1.30). Hidden from users; used to predict no-shows |

A URL-friendly slug is auto-generated from the title and date.

**Editing:** Click any event row to open the editor. All fields can be updated.

### 3.6 Evaluation Instruments

The evaluation system has two layers: **Items** (individual questions) and **Inventories** (ordered collections of items used as survey templates).

#### 3.6.1 Item Management

**Route:** `/admin/items`

Items are the atomic evaluation questions. Each item has:

| Field | Description |
|-------|------------|
| `item_key` | Unique identifier (lowercase, underscores only, e.g., `correctness`) |
| `short_label` | Display name (e.g., "Correctness") |
| `item_text` | Full question text shown to respondents |
| `max_rating` | Scale: 1, 2, 3, **5** (standard Likert), 7, or 10 |
| `label_min` / `label_max` | Scale endpoint labels (e.g., "Poor" / "Excellent") |
| `label_low_mid` / `label_mid` / `label_high_mid` | Optional intermediate labels (for 5+ point scales) |
| `category` | Optional grouping |
| `internal_notes` | Admin-only notes |

**Immutability principle:** Items are never modified in-place. When you "edit" an item, the system retires the old version and creates a new one with the same key. This preserves the integrity of historical responses.

**Actions:**
- **Create** — define a new evaluation question
- **Edit** — creates a new version (retires old)
- **Clone** — copy all fields as a starting point for a similar item
- **Retire** — remove from active use (blocked if referenced by inventories or responses)

Toggle "Show retired" to see inactive items.

#### 3.6.2 Inventory Management

**Route:** `/admin/inventories`

Inventories are ordered collections of items used as assessment templates (e.g., "Pitch Inventory" with 6 quality dimensions, "Review Inventory" with the same 6 dimensions but different weighting context).

**Creating an Inventory:**

1. Enter `inventory_key`, name, and optional description
2. Use the **shuttle editor**:
   - **Left panel**: available items (searchable)
   - **Right panel**: selected items in order
   - Move items between panels by clicking
   - Reorder selected items by dragging
3. Minimum 1 item required

**Actions:**
- **Create** / **Edit** (retire old + create new) / **Clone** / **Retire**
- Same immutability rules as items

### 3.7 Infrastructure Management

**Route:** `/admin/infrastructure`

Three-tab interface for managing physical infrastructure.

#### Partners Tab

Partner organizations that host events (coworking spaces, universities, companies, communities).

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Organization name |
| Type | Yes | `coworking`, `university`, `company`, `community` |
| Logo URL | No | Partner logo |
| Website URL | No | Partner website |
| Contact Name | No | Primary contact |
| Contact Email | No | Contact email |
| Description | No | About the partner |

#### Locations Tab

Physical addresses where events take place.

| Field | Required |
|-------|----------|
| Name | Yes |
| Address | Yes |
| City | Yes |

#### Rooms Tab

Specific rooms within locations.

| Field | Required | Description |
|-------|----------|-------------|
| Location | Yes | Select from locations list |
| Name | Yes | Room name |
| Capacity (with tables) | Yes | Seated capacity for hackathons |
| Capacity (without tables) | Yes | Standing/presentation capacity |

**Setup order:** Create partners first, then locations, then rooms. Events reference rooms (which inherit their location).

### 3.8 Catalogs & Scoring Weights

**Route:** `/admin/catalogs`

Five tabs of configurable controlled vocabularies:

#### Problem Types

Categories for classifying problems: `explorative`, `greenfield`, `advanced_greenfield`, `brownfield`, `reverse_engineering`, `other`. Add custom types, edit display names, toggle active/inactive.

#### Emojis

The curated set of 10 reaction emojis available in chat. Default: `👍 👎 ❤️ 🎉 🤔 👀 🔥 ✅ 💡 🙏`. Add or deactivate emojis as needed.

#### Lesson Categories

Categories for lessons learned: `tooling`, `architecture`, `process`, `gotcha`, `performance`, `testing`. Add custom categories for your community's needs.

#### Contribution Weights (Points)

Controls how many points each action earns. Default values:

| Action | Default Points |
|--------|---------------|
| Review assessment completed | 1 |
| Valuable contribution (chat with 2+ reactions) | 1 |
| Problem submitted | 1 |
| Problem pitched | 1 |
| Problem coded | 1 |

Edit the **current_points** value inline to adjust the incentive structure.

#### Review Weights (Star Awards)

Multipliers applied to review scores when calculating star awards:

| Review Context | Default Multiplier | Rationale |
|---------------|-------------------|-----------|
| Live review | 1.0x | Standard weight |
| Post-event review | 1.5x | More time to verify quality |
| Agent review | 0.5x | Supporting, not authoritative |

Edit the **weight_multiplier** inline.

### 3.9 API Key Management

Users can generate API keys from their account settings (`/account`). Each key:

- Has format `mk_` + 40 hex characters (43 total)
- Creates a corresponding bot user with `role = agent`
- The bot user's `display_name` is "Bot of {owner name}"
- Can be revoked at any time (bot user remains but cannot authenticate)

Bot users authenticate via `Authorization: Bearer mk_...` header and can only create non-binding decisions.

### 3.10 CSV Export (Admin-Only)

On the following pages, admins see a **Download CSV** button that other roles do not:

- **Moderator Dashboard** → Pitch Results Summary (exports pitch scores)
- **Moderator Dashboard** → Review Results Summary (exports review scores)
- **Assessment Results** page → per-assessment detailed export

CSV files include a UTF-8 BOM for Excel compatibility.

---

## 4. Moderator Guide

Moderators orchestrate live events. They have global scope — a moderator can manage any event at any location. Admins automatically have moderator privileges.

### 4.1 Moderator Dashboard

**Route:** `/dashboard/moderator`

The dashboard is the command center during live events. It shows:

| Section | Purpose |
|---------|---------|
| **Live Banner** | Sticky header: current phase, problem, countdown timer, audio toggle |
| **Current Activity** | Shows the currently open assessment (if any) |
| **Event Queue** | Ordered list of selected problems |
| **Backlog** | Problems awaiting review (submitted/needs_changes) |
| **Attendance** | Collapsible panel to track who showed up |
| **Pitch Results** | Results of closed pitch assessments |
| **Review Results** | Ranked review scores |
| **Star Awards** | Award 1st/2nd/3rd place |
| **Communications** | Email template editor + broadcast + log |
| **Decision Accordion** | 7 categories of decisions to record |
| **Activity Feed** | Recent decisions log |

### 4.2 Pre-Event Setup

#### Queue Planning

**Route:** `/dashboard/moderator/queue/{eventId}`

Two-column interface:

- **Left: Event Queue** — problems selected for the event, drag to reorder
- **Right: Available Problems** — problems with `readiness_state = ready`, search + batch-select

Add problems with checkboxes + "Add Selected to Queue". Reorder with up/down arrows. Remove with the X button. Each add/remove records a formal decision.

#### Email Template & Broadcast

1. In the Communications section, compose your **email template** (subject + markdown body)
2. Click "Save New Version" to store it (templates are versioned, never overwritten)
3. Click "Send Broadcast" to email all registered participants
4. Each broadcast is logged in the Communications Log with recipient count, subject, and timestamp

In development mode, emails are logged to the console rather than sent.

#### Attendance Tracking

The Attendance section lists all registered users. For each attendee:

- Toggle "Showed Up" individually
- Use "Mark All Present" to bulk-mark all in-person registrants
- Filter by: All, In-Presence, Remote

Statistics shown: Showed Up, Total Registered, Show-up Rate, Not Recorded.

### 4.3 Running a Live Event

The event follows a cycle per problem: **Pitch → Rate → Code → Review → Rate**.

#### Opening a Pitch Phase

1. In the **Decision Accordion**, expand "Live Assessments"
2. Click **"Open Pitch"**
3. A timer dialog appears — select duration: 3, 5, 10, or 15 minutes (or no time limit)
4. Click confirm

**What happens:**
- A pitch assessment is created automatically
- The Live Banner updates to "Pitching" with the countdown
- All participants see a "Go to Rating" button
- The Problem Card's active indicator turns green

**Auto-close safety:** If you open a new pitch while another is still active, the previous one closes automatically.

#### Closing a Pitch Phase

Click **"Close Pitch"** in the Decision Accordion, or let the timer expire (the system closes it automatically on the next poll cycle, ~5 seconds).

#### Opening/Closing a Review Phase

Same workflow as pitch: "Open Review" → timer selection → participants rate the solution → "Close Review" or timer expires.

#### Extending the Timer

During any timed phase, click **"+5 min"** on the Live Banner to extend. This is a non-binding action (no decision recorded).

#### Audio Cues

The Live Banner has an audio toggle (speaker icon). When enabled:
- **60 seconds remaining**: warning tone
- **Timer expired**: alert tone
- **Phase transition**: notification sound

### 4.4 Quality Gate Decisions

Before a problem can be selected for an event, a moderator must approve it.

In the Decision Accordion under **"Quality Gate"**:

| Decision | Effect |
|----------|--------|
| **Accept** | Readiness: submitted → ready. Problem can now be selected for events. |
| **Request Changes** | Readiness: submitted → needs_changes. PO must revise and resubmit. |
| **Reject** | Readiness: submitted → rejected. Problem is rejected permanently. |

**Objectivity constraint:** A moderator cannot make binding decisions on problems they own. If a moderator joins a problem's team as a developer, they lose moderator authority for that specific problem.

### 4.5 Other Decisions

| Category | Decisions | Effect |
|----------|-----------|--------|
| **Event Planning** | Select for Event, Deselect | Adds/removes from event queue |
| **Sprint Planning** | Select for Coding, Deselect | Marks problem as actively being coded |
| **Deferral** | PO Absent, Low Priority, Skipped, Too Complex, Needs Refinement, Future Capability | Moves to deferred state with reason |
| **Drop** | Low Relevance, Low Quality | Permanently drops the problem |
| **Close** | Complete, Partial | Closes the problem (fully or partially solved) |

Each decision records the actor, timestamp, and optional rationale. These decisions ARE the event log — there is no separate activity log.

### 4.6 Star Awards

After all reviews are closed:

1. The **Star Awards Panel** shows problems ranked by weighted review score
2. The top 3 are pre-filled into 1st/2nd/3rd dropdowns (editable)
3. Verify the ranking and click **"Confirm Awards"**
4. All team members of winning problems receive star awards

Awards are permanent once confirmed. The panel shows trophies and team names after confirmation.

### 4.7 Reviewing Results

#### Pitch Results Summary

Shows each pitched problem in queue order (no ranking). Displays:
- Problem name, response count, overall average, per-item sparkline

Pitch results inform discussion but do not rank problems.

#### Review Results Summary

Shows problems ranked by weighted average score. Displays:
- Rank, problem name, response count, weighted score, per-item sparkline
- Color coding: gold (1st), silver (2nd), bronze (3rd)

Click any row to see detailed assessment results.

### 4.8 Reminder: Moderator Also Creates Events

Moderators (not just admins) can create and edit events via `/admin/events`. See Section 3.5 for details.

---

## 5. Problem Owner Guide

A Problem Owner (PO) submits problems for the community to explore. You become a PO by creating a problem.

### 5.1 Creating a Problem

**Route:** `/problem/new`

Fill in:

| Field | Required | Guidance |
|-------|----------|---------|
| **Title** | Yes (5–200 chars) | Clear, descriptive title |
| **Description** | Yes (20–5000 chars) | Detailed problem statement. What is the challenge? What does success look like? |
| **Value Statement** | No (max 2000 chars) | Why does this problem matter to you personally or strategically? |
| **Problem Type** | Yes | Explorative, greenfield, advanced greenfield, brownfield, reverse engineering, or other |
| **Repository URL** | No | Link to the code repository |
| **Task Count** | Yes (min 1) | How many sub-tasks or work items? |

After creation, your problem is in **draft** state. You can continue editing.

### 5.2 Problem Lifecycle

Your problem moves through two independent state dimensions:

**Readiness State** (quality):

```
draft → submitted → [moderator reviews] → ready
                                         → needs_changes → (edit) → submitted
                                         → rejected
```

**Action State** (community intent):

```
backlog → selected_for_event → selected_for_coding → closed
                             → deferred / dropped
```

You control the transition from draft to submitted. Moderators control all other transitions.

### 5.3 Editing Your Problem Card

When your problem is in **draft** state, you can edit:

- Description
- Value statement
- Repository URLs (primary and secondary)
- Task count

The **Owner Banner** at the top of your Problem Card shows your role and the current state.

When your problem is **not** in draft (e.g., submitted or ready), editing is locked. To make changes:

1. Click **"Create New Version"** — this creates v2.0 (or v3.0, etc.) in draft state
2. Edit the new version
3. Submit for review again

Previous versions are preserved and viewable via the version navigation.

### 5.4 Submitting for Review

When your problem is ready for moderator review, click **"Submit"**. The readiness state changes from `draft` to `submitted`.

The moderator may:
- **Accept** it (→ ready)
- **Request changes** (→ needs_changes — edit and resubmit)
- **Reject** it

### 5.5 Managing Resources

On your Problem Card, add links to helpful materials:

**Direct Resources** — repositories, documentation, and specifications directly related to the problem.

**Helpful Resources** — tutorials, articles, and tools that may help the team.

As the PO, resources you add are auto-approved. Resources suggested by observers require your approval (approve/reject buttons appear).

### 5.6 Managing Your Team

When your problem is selected for coding, developers can join your team by clicking "Join as Dev" on the Problem Card.

**Team roles:**
- **PO** — you (auto-assigned)
- **PO Deputy** — optional second owner
- **Coder** — developers who join the team

**As PO, you can see:**
- Active and retired team members
- Each member's solution repository URL (if set)
- The breakout room URL (video call link, settable by any team member)

Team membership is version-scoped: when you create a new major version, the team resets (fresh start for the next event).

### 5.7 Chat

The Problem Card includes a real-time chat section at the bottom. Chat is:

- **Version-scoped**: shows messages for the current version by default (filter to see other versions)
- **Persistent**: messages survive across sessions and events
- **Role-indicated**: each message shows the author's role (PO, Coder, Moderator, Observer, Bot)
- **Threaded**: reply to specific messages
- **Reactive**: use the 10 curated emojis to react

System messages are posted automatically for team events (joins, retires, phase transitions).

### 5.8 Lessons Learned

After working on your problem, capture insights by clicking **"Add Lesson"** on the Problem Card.

Each lesson includes:
- **Content** (up to 5000 characters)
- **Category**: tooling, architecture, process, gotcha, performance, testing
- **Tags** (optional)
- **Event** (optional, to associate with a specific event)

Moderators can flag lessons as "valuable" — these surface in the Knowledge Base across locations.

### 5.9 Conflict of Interest

If your problem is being reviewed, you (and your active team members) **cannot submit review assessments** for it. This preserves objectivity. You can still submit pitch assessments.

---

## 6. Participant Guide

This section covers what every authenticated user can do: attend events, rate pitches and reviews, join teams, chat, and contribute to the knowledge base.

### 6.1 Discovering Events

**Route:** `/event/{slug}`

The event page shows:
- Event title, description, and banner image
- Partner organization and venue
- Host and co-hosts
- Date and time
- Capacity and current registration count
- Social links (website, LinkedIn, X)
- Problem queue (which problems will be discussed)

### 6.2 Registering for Events

On the event page, click **"Register"** and select:
- **In-person** — attending at the physical venue
- **Remote** — participating online

If the event is at capacity, you are placed on a **waitlist** with your position shown. When a spot opens, you receive an invitation to accept or decline.

To cancel, click **"Cancel Registration"** — your spot opens for the next person on the waitlist.

### 6.3 During a Live Event

#### The Live Banner

When an event is in progress, a sticky banner appears showing:
- Current phase (pitching, reviewing, idle)
- The problem being discussed
- Countdown timer
- "Go to Rating" button (during pitch/review phases)
- Audio toggle for notifications

The banner polls the server every 5 seconds and pauses when you switch tabs.

#### Submitting an Assessment

When the moderator opens a pitch or review phase:

1. Click **"Go to Rating"** in the Live Banner (or navigate to the assessment URL)
2. Select your **attendance mode** (in-presence / remote)
3. Select your **role** (observer, developer, etc.)
4. Rate each quality dimension on the 5-point scale
5. Click **Submit**

The timer is visible at the top. Colors shift from green → yellow (2:30 left) → red (1:00 left) → pulsing alert.

After submission, you earn a contribution point and may unlock milestones (first assessment, etc.).

#### Viewing Results

After an assessment closes, visit `/assess/{id}/results` to see:
- Per-item statistics (n, mean, standard deviation, min, max)
- Chart view with bar graphs
- Improvement priorities (needs attention / improvement / strength)
- Filters by respondent role and attendance mode

### 6.4 Joining a Team

When a problem is selected for coding:

1. Open the Problem Card (`/problem/{slug}`)
2. Click **"Join as Dev"**
3. You are added as a coder to the team
4. A system message announces your join in chat

As a team member you can:
- Set a **breakout room URL** (Zoom/Meet link for your team's video call)
- Set your **solution repository URL**
- **Retire** from the team if you need to step away (you can rejoin later)

**Note for moderators:** If you join as a developer, you lose moderator authority for that specific problem (to preserve objectivity). You keep moderator powers for all other problems.

### 6.5 Problem Card Chat

Every problem has a chat section. You can:

- **Post messages** (up to 2000 characters)
- **Reply** to specific messages (threading)
- **React** with emojis (from the curated set of 10)
- **@mention** other users

**Filters at the top:**
- Version filter: current version (default), all versions, specific version
- Quick filters: All, Moderator, PO, Has URL, Team

Chat updates every 3 seconds during live events, 10 seconds otherwise. Polling pauses when you switch tabs.

### 6.6 Adding Resources

On any Problem Card, you can suggest resources:
- **Direct resources** — directly related links (repos, docs, specs)
- **Helpful resources** — supplementary material (tutorials, articles)

If you are the PO, deputy, team member, or moderator, your resources are auto-approved. Otherwise, they go to the PO for approval.

### 6.7 Knowledge Base

**Route:** `/knowledge-base`

Browse lessons learned across all problems, events, and locations.

**Search and filter by:**
- Free text search
- Category (tooling, architecture, process, gotcha, performance, testing)
- Event
- Location (city)
- Valuable only (flagged by moderators)

Each lesson card shows content, category, author, associated event/location, and a link to the source problem.

### 6.8 Your Dashboard

**Route:** `/dashboard`

Your personal command center showing:

- **Live Event** — current phase, timer, link to active assessment
- **My Events** — events you are registered for
- **My Problems** — problems you created with state badges
- **Personal Contributions** — your points breakdown over the last 6 weeks:
  - Review assessments completed
  - Valuable contributions (chat with 2+ reactions)
  - Problems submitted, pitched, coded
- **Milestones** — first-time achievements (first assessment, first submission, etc.)
- **Activity Feed** — recent decisions on your problems

### 6.9 Contribution Points & Star Awards

**Points** reward quality content contribution. You earn points by:

| Action | Default Points |
|--------|---------------|
| Completing a review assessment | 1 |
| Chat message receiving 2+ 👍 or 💡 reactions | 1 |
| Submitting a problem | 1 |
| Having your problem pitched | 1 |
| Having your problem coded | 1 |

Points accumulate across all events and locations on a rolling 6-week window.

**Star Awards** reward hacking excellence. After all reviews close, the moderator confirms 1st, 2nd, and 3rd place based on weighted review scores. All team members of winning problems receive the award.

---

## Appendix A: Quality Dimensions

The platform evaluates code quality across six dimensions:

| Dimension | What It Measures |
|-----------|-----------------|
| **Correctness** | Meets requirements, handles edge cases |
| **Test Support** | Evidence convincingly demonstrates correctness |
| **Readability** | Easy to understand — naming, structure, local reasoning |
| **Simplicity** | No unnecessary complexity or bloat |
| **Elegance** | Fitting language constructs, clean teachable structure |
| **Extensibility** | Accommodates likely changes without overengineering |

These dimensions enable meaningful comparison of solutions produced by different tools and approaches, even when implementations differ significantly.

---

## Appendix B: Keyboard & Audio

### Audio Notifications

Toggle audio via the speaker icon in the Live Banner. When enabled:

| Event | Sound |
|-------|-------|
| 60 seconds remaining | Warning tone |
| Timer expired | Alert tone |
| Phase transition (pitch/review opens or closes) | Notification chime |

### Browser Tab Behavior

The platform is tab-aware:
- **Active tab**: full polling (3–5 seconds)
- **Hidden tab**: polling pauses to save resources
- **Tab refocused**: catches up immediately

No manual refresh needed during live events.
