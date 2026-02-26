# 12. Dashboards and System Views

This chapter describes the **global system views** that provide orientation, coordination, and control across the entire platform. Unlike Problem Cards or Survey pages, dashboards are not centered on a single Problem but on the *state of the system as a whole*.

Dashboards are role-sensitive: unauthenticated users see the public landing page, authenticated users see the participant dashboard, while Moderators and Administrators see progressively richer controls. The visual structure is deliberately simple, optimized for live use during events, screen sharing, and rapid situational awareness.

---

## 12.1 Public Landing Page (Unauthenticated)

The **Public Landing Page** is the entry point for visitors who are not yet logged in. It showcases the community and encourages registration.

### Purpose
- Showcase upcoming and past events
- Encourage registration and community participation
- Provide platform introduction

### Core Elements

**Hero Section**
- Platform name and tagline
- Brief description of VibeCoding Professionals
- Prominent "Register" and "Login" buttons

**Upcoming Events**
- Grid of upcoming events (sorted by date)
- Each event displays:
  - **Event image** (auto-generated from partner logo + title, or custom)
  - Event title
  - Date and time
  - Location (city, venue)
  - Partner logo
  - Registration count (with capacity display logic from Chapter 29)
- Click leads to event detail page

**Past Events**
- Grid of past events (most recent first)
- Each event displays:
  - Event image
  - Event title
  - Date
  - Location
  - Summary stats (e.g., "5 problems tackled, 23 participants")
- Click leads to event recap page

**Top Contributors (Last 6 Weeks)**
- Grid showing top 10 contributors by points
- Each row displays:
  - Display name
  - Total points earned
  - Total stars (⭐)
  - Contribution count
- Only users with `show_on_contributor_wall = TRUE` appear
- Sorted by points (descending), then contribution count (descending)
- See Chapter 33.6.2 for full specification

**Call to Action**
- "Join our community" section
- Benefits of participation
- Link to registration

---

## 12.2 Event Detail Page

Clicking on an event from the landing page or dashboard shows the **Event Detail Page**.

### Purpose
- Display full event information
- Enable event registration
- Show event-specific problems

### Core Elements

**Event Header**
- Event image (large)
- Event title
- Date, time, duration
- Location with address
- Partner name and logo
- Host and co-host names

**Description Section**
- Full event description
- Agenda (if provided)
- External links (website, LinkedIn, X)

**Registration Section** (Prominent)
- **"Register for Event"** button
- Current registration count with capacity indicator
- Attendance mode toggle: "In-Presence" / "Remote"
- Waitlist indicator (if capacity reached)
- Registration requires:
  - Authentication (login or register)
  - Terms & Conditions acceptance

**Problems Section**
- Problems selected for this event
- Each shows: title, PO, readiness state
- Link to Problem Card

**For Registered Users**
Additional elements appear after registration:
- "You're registered" confirmation
- **"Cancel Registration"** button (sets `cancelled_at`, triggers waitlist invitation per Ch.29.6)
- Breakout room links (if available)
- Team assignments (if formed)

---

## 12.3 Participant Dashboard (Authenticated)

The **Participant Dashboard** is the home view for authenticated users. It provides personalized access to events, problems, and community features.

### Purpose
- Provide personalized overview of platform activity
- Quick access to registered events and owned problems
- Show community activity

### Core Elements

**Welcome Header**
- User display name
- Quick stats (events attended, problems created, etc.)

**My Events**
- Events user is registered for (upcoming)
- Events user has attended (recent)
- Quick link to browse all events

**My Problems**
- Problems owned by this user
- Current readiness and action state
- Quick edit access

**Current Event Activity** (if event is live)
- If user is registered for a currently active event:
  - Current phase indicator (Pitching, Review, Open Hacking)
  - "Now Open for Rating" banner (if assessment open)
  - Direct link to rating page
  - Team chat shortcut

**Upcoming Events**
- Grid of upcoming events (same as landing page)
- "Register" button for unregistered events

**Recent Activity Feed**
- New problems submitted
- Decisions made
- Team formations
- Chat highlights

---

## 12.4 Event Dashboard (During Live Event)

The **Event Dashboard** is the live coordination surface during an active event. It replaces the general dashboard view during event hours.

### Purpose
- Provide live, authoritative overview of current event state
- Allow participants to follow along without verbal coordination
- Offer clear entry points to currently relevant interactions

### Core Elements

**Event Header**
- Event name, date, and location
- Partner logo
- Current phase indicator (e.g. *Pre-Event*, *Pitching*, *Review*, *Open Hacking*)
- Optional short status message set by Moderators

**Current Interactive Activity (Prominent Section)**
- If an interactive assessment is open:
  - Clear banner: *"Now Open for Rating"*
  - Problem title and short description
  - Primary button: *Go to Rating*
- If no interactive activity is open:
  - Neutral message: *"No interactive rating open"*

This section always reflects **exactly one** interactive context, even if other assessments are open elsewhere.

**Selected Problems for This Event**
- Ordered list of Problems selected for the current event
- Each entry shows:
  - Problem title
  - Owner name
  - Current readiness and action state (read-only)
  - "Challenge accepted" button (or team count)
  - Link to Problem Card
- Visual cues indicate whether a Problem has already been pitched, reviewed, or worked on

**Chat Panel** (two tabs)
- **Event Chat** tab (default during live events):
  - Event-wide messages (`problem_id IS NULL`) — moderator announcements, system phase echoes, community links
  - All authenticated participants can post (see Ch.31.16)
  - Location filter: `[This Event ▼]` / `[All {City} Events]` — scrolls back through previous events at same location
  - Quick post input at bottom for any participant
- **Problem Activity** tab (default pre/post-event):
  - Most recent 10 messages across all problems for this event
  - Click any message to navigate to full Problem Card chat
  - No version filtering (shows all versions)

**Backlog Preview (Condensed)**
- Small, non-intrusive list of:
  - Newly submitted Problems
  - Deferred-for-future Problems
- No action buttons, informational only

### Interaction Constraints
- Decisions cannot be triggered by regular participants
- Rating and chat are available
- Team formation via "Challenge accepted"

The Event Dashboard establishes **shared reality**: everyone sees the same thing, at the same time.

---

## 12.5 Moderator Dashboard

The Moderator Dashboard extends the Event Dashboard with **operational controls**. It is optimized for live facilitation and may be used on desktop or mobile devices.

Moderators must be authenticated and have `moderator` or `admin` role to access this view. Moderators have **global scope** — they can access any event across all locations.

### Purpose
- Curate and steer event flow
- Trigger assessments and decisions with minimal friction
- Serve as the control surface during screen sharing

### Mobile Administration

**CRITICAL**: All moderator controls work on smartphones (375px width minimum).

Moderators orchestrate live events while standing, moving around the room, and interacting with participants. The Moderator Dashboard provides full functionality on mobile devices, ensuring moderators can make decisions, open assessments, and manage events from any location using their smartphones.

Mobile-specific patterns: Accordion decision buttons, sticky banners, full-width controls, touch-friendly targets (44×44px minimum).

### Structural Relationship
The Moderator Dashboard:
- Reuses all elements of the Event Dashboard
- Adds decision buttons, filters, and planning tools
- Never hides public information; it only augments it

### Additional Elements

**Moderator Control Panel**
A persistent panel (or expandable section) visible only to Moderators.

**Desktop (≥768px)**: Inline panel with all decision buttons visible, or expandable sections
**Mobile (<768px)**: Accordion sections by category (Decision #4 from template session)

**Mobile Accordion Pattern** (26 decision types grouped into 8 categories):
- **Quality Gate** (blue header): Accept, Request Changes, Reject
- **Event Planning** (green header): Select for Event, Deselect for Event
- **Sprint Planning** (purple header): Select for Coding, Deselect for Coding
- **Deferral** (yellow header): 6 variants (PO Absent, Low Priority, Skipped, Too Complex, Needs Refinement, Future Capability)
- **Drop** (red header): Low Relevance, Low Quality
- **Close** (purple header): Complete, Partial
- **Live Assessments** (orange header): Open/Close Pitch, Open/Close Review

**Accordion Behavior**:
- Tap category header to expand, shows relevant decision buttons
- Only one category expanded at a time
- Buttons: Full-width, 44px height, colored per category
- Color-coded headers provide quick visual navigation

**Desktop Alternative**: All categories visible inline, or keep accordion for consistency

**Live Assessment Controls** (available in both layouts):
- Selector to choose which Problem is currently open
- Open/Close buttons for pitch and review phases
- Timer controls (set duration, extend time)

**Event Planning View** (Sub-Page: `/dashboard/moderator/queue/{eventId}`)

A dedicated queue planning page accessible from the moderator dashboard. This view supports **pre-event curation** — the workflow of selecting `ready` problems from the backlog and adding them to the event queue.

The Event Planning View uses a **dual-pane shuttle pattern** (analogous to the Inventory Editor in Ch.17/26.12.2):
- **Left pane**: "Available Problems" — problems where `readiness = ready AND action = backlog`, eligible for event selection
- **Right pane**: "Event Queue" — problems already selected for the event, ordered by `position_index`

Moderators can:
- Move problems from the backlog to the event queue (fires `selected_for_event` decision)
- Remove problems from the queue (fires `deselected_for_event` decision)
- Reorder problems within the queue (PATCH `/api/events/{eventId}/queue`)

The view also supports advanced filtering on the backlog pane, using the scalable list view components (§12.10):
- `SearchBar` for searching by problem title and owner name (300ms debounce, `COLLATE NOCASE`)
- `ListFilterBar` for filtering by problem type
- "Load More" append-style pagination (20 problems per batch) for the Available Problems pane, which can contain 50–200 ready problems
- Sorting by creation date (default newest first)

The Event Planning View is linked from the moderator dashboard via a prominent "Plan Event Queue" button. See `frontend/pagedesign/queue_planning_design.md` for the full UI specification.

**Live Decision Execution**
- Moderators can execute decisions with a single click
- Decisions are immediately logged and reflected across all views
- Optional rationale field appears contextually when required (e.g. rejections)

**Pending Review Backlog**
- Lists all problems with `readiness_state = 'submitted'`, sorted by `submitted_at` (oldest first — FIFO queue)
- At scale (200+ pending problems across the multi-location community), uses "Load More" append-style pagination (10 problems per batch) per §12.10 Scalable List Views
- Optional `ListFilterBar` for filtering by problem type and urgency (age since submission)
- Urgency color-coding: >7 days red, 3–7 days yellow, <3 days normal
- See `frontend/pagedesign/moderator_dashboard_design.md` for the full UI specification

**Activity Log Shortcut**
- Compact feed of recent Decisions and Chat activity
- Uses "Load More" append-style pagination (10 items initially, append 10 more per click, max 50 items)
- Each entry links directly to the relevant Problem Card
- Designed to replace ad-hoc messaging tools for internal coordination

**Attendance Tracking** (during/after event)
- Mark attendance for show-up rate tracking
- View registration list — uses `SearchBar` for name/email search and `ListFilterBar` for mode/status filtering (see §12.10 Scalable List Views)
- For events with 50+ registrants: "Load More" append-style pagination (50 per batch), sorted alphabetically
- Show-up rate statistics calculated from full dataset (not just visible page)
- Export attendance data (exports ALL attendees regardless of current filter/pagination)

**Learnings from Last Event** (Cross-Location Panel)

A dedicated panel for moderators to prepare event introductions with insights from previous events.

| Section | Content |
|---------|---------|
| **Own Location** | Full list of lessons learned from this location's previous event |
| **Other Locations** | Only lessons flagged as "valuable" from other locations (Cologne ↔ Aachen) |
| **Late Reviews** | Code reviews submitted after the previous event ended |

**Hierarchy:**
1. **Primary**: Own location's previous event (e.g., Cologne → Cologne)
2. **Secondary**: Other locations' recent events (e.g., Cologne → Aachen)
3. **Tertiary**: All-time valuable insights across community

This panel supports the **moderator wrap-up** workflow: before each event, moderators can present a summary of aftermath learnings and late insights from the previous event.

**Future Enhancement**: An agent will prepare this summary automatically (see Chapter 21).

### Screen-Sharing Safety
- Moderator-only controls are visually distinct
- Public-facing content remains readable and stable
- Sensitive information is never exposed in this dashboard

### Role-Conditional Control Visibility

The platform's controls are role-sensitive: the same screen surface presents different controls depending on the authenticated user's role. This subsection provides a consolidated visibility matrix for all interactive controls across the Event Dashboard (12.4), Moderator Dashboard (12.5), and Problem Card (Chapter 13).

**Legend**: **Yes** = always visible/enabled, **—** = hidden, **Conditional** = visible only when a specific phase or state condition is met.

#### Dashboard Controls (Event Dashboard + Moderator Dashboard)

| Control | Observer | PO | Developer | Moderator | Admin |
|---------|----------|----|-----------|-----------|-------|
| Open/Close Pitch Assessment | — | — | — | Yes | Yes |
| Open/Close Review Assessment | — | — | — | Yes | Yes |
| Select for Event / Deselect | — | — | — | Yes | Yes |
| Select for Coding / Deselect | — | — | — | Yes | Yes |
| Set countdown timer / Extend time | — | — | — | Yes | Yes |
| Send announcement | — | — | — | Yes | Yes |
| Reorder event queue | — | — | — | Yes | Yes |
| Mark attendance | — | — | — | Yes | Yes |
| Award stars | — | — | — | Yes | Yes |
| "Go to Rating" | Conditional | Conditional | Conditional | Conditional | Conditional |
| "Challenge accepted" / Team count | Conditional | Conditional | Conditional | Conditional | Conditional |

#### Problem Card Controls

| Control | Observer | PO (own) | PO (other) | Developer (team) | Moderator | Admin |
|---------|----------|----------|------------|------------------|-----------|-------|
| Edit problem content | — | Draft only | — | — | — | — |
| Submit problem | — | Yes | — | — | — | — |
| Self-Rate | — | Yes | — | — | — | — |
| Rate Pitch | When open | When open | When open | When open | When open | When open |
| Rate Review | When open | When open | When open | When open | When open | When open |
| Quality Gate (Accept / Reject / Needs Changes) | — | — | — | — | Yes | Yes |
| Select for Event / Deselect | — | — | — | — | Yes | Yes |
| Select for Coding / Deselect | — | — | — | — | Yes | Yes |
| Defer decisions (`deferred_*`) | — | — | — | — | Yes | Yes |
| Drop decisions (`dropped_*`) | — | — | — | — | Yes | Yes |
| Close decisions (`closed_*`) | — | — | — | — | Yes | Yes |
| Open/Close Pitch Assessment | — | — | — | — | Yes | Yes |
| Open/Close Review Assessment | — | — | — | — | Yes | Yes |
| Join as Dev | Conditional | — | Conditional | — | Conditional* | Conditional* |
| Retire from Team | — | — | — | Yes | — | — |
| Add Lesson Learned | Yes | Yes | Yes | Yes | Yes | Yes |
| Add Direct Resource | — | Yes | — | Yes | — | — |
| Add Helpful Artifact | — | Yes | Suggest | Yes | Suggest | Suggest |

#### Phase-Conditional Behavior

- **"Join as Dev"**: Visible when `action_state = 'selected_for_coding'` AND the event is active. This is the primary team formation window during the coding sprint (see Chapter 31).
- **"Rate Pitch"**: Enabled only when a pitch assessment is open for this problem (`event_live_context.current_mode = 'pitch'`). Greyed out otherwise.
- **"Rate Review"**: Enabled only when a review assessment is open for this problem. Greyed out otherwise.
- **Self-Rate**: Available to PO only, anytime a self-assessment (Problem Evaluation) inventory exists for this problem.
- **"Go to Rating"** on dashboard: Visible to all authenticated users when an interactive assessment is open.

#### Moderator Objectivity Constraint

Rows marked with * denote a special case. When a moderator clicks "Join as Dev" on a Problem Card, they become a developer **for that problem only**. Their effective role on that specific problem changes:

- All moderator decision controls (quality gate, open/close assessments, select/defer/drop/close) become **hidden** for that problem
- Rating controls remain available (as for any developer)
- Team controls (retire, share repo, breakout room) become available
- Moderator powers for **all other problems** remain unaffected

This preserves objectivity: a moderator cannot make binding decisions on a problem they are actively coding. The role override is derived from `problem_team_members` membership (Chapter 31), not from a separate permission table.

---

## 12.6 Administrator Overview

The Administrator Overview is a **meta-level system view** intended for maintenance, configuration, and oversight. It is not used during live event facilitation except in exceptional cases.

Administrators are authenticated users with superset permissions over Moderators.

### Purpose
- Maintain system integrity and consistency
- Configure Inventories and Items
- Oversee long-term data quality

### Core Sections

**System Status Overview**
- Summary metrics:
  - Number of Users
  - Number of Events
  - Number of Problems
  - Number of Assessments
  - Number of Decisions
- Health indicators for:
  - Active events
  - Open assessments
  - Retired items or inventories

**Event Management**
- Create new events
- Edit event details
- Manage event-problem queue
- View registrations and attendance

**Partner & Location Management**
- Create and edit partners
- Create and edit locations and rooms
- View capacity utilization

**Inventory and Item Management**
- Access to Inventory definitions
- Ability to:
  - Create new Inventories
  - Clone existing Inventories
  - Retire Inventories
- Item management with strict controls:
  - Create from template
  - Change (retire + replace)
  - Prevent deletion if in use

**User Management**
- List of all users
- Ability to:
  - Import users via CSV
  - Upgrade users to Moderator/Administrator
  - View user activity
  - Manage newsletter subscriptions

**Global Audit Views**
- Cross-event views of:
  - Decision histories
  - State transitions
  - Assessment usage
  - Show-up rates
- Designed for analysis, not live operations
- Each tabular view includes a **"Download CSV"** button for offline analysis and debugging (see Ch.15.3.4)

### Design Philosophy
The Administrator Overview favors **clarity over speed**:
- No destructive actions without confirmation
- No hidden automation
- All changes leave audit traces

Administrators are trusted actors, but the system still assumes that **future analysis depends on today's discipline**.

---

Together, these dashboards form a coherent system of views:
- **Public Landing Page** for discovery and community showcase
- **Event Detail Page** for event information and registration
- **Participant Dashboard** for personalized access
- **Event Dashboard** for shared awareness during live events
- **Moderator Dashboard** for live orchestration
- **Administrator Overview** for structural stewardship

They ensure that complex, agentic, and human-centered workflows remain navigable, transparent, and resilient across multiple locations and events.

---

## 12.7 Global Navigation Architecture

**Added 2026-02-25**: The platform uses an **"App-Like" Split Navigation** pattern that separates identity/account actions from main app navigation. This eliminates layered hamburger menus and provides always-visible, single-tap route switching.

### 12.7.1 Design Philosophy

The navigation architecture addresses three mobile UX problems:

1. **Hidden menus**: Hamburger menus bury primary routes behind multiple taps, increasing cognitive load
2. **Conflated concerns**: Mixing "Where do I go?" with "Who am I?" in one menu creates confusion
3. **Lost orientation**: Without persistent route indicators, users lose context during live events

**Solution**: Two distinct chrome elements with orthogonal responsibilities:

| Element | Position | Purpose | Contains |
|---------|----------|---------|----------|
| **Top App Bar** | Fixed top | "Who am I?" — Identity & session | Brand + User Avatar |
| **Bottom Navigation Bar** | Fixed bottom | "Where do I go?" — App routes | 3-5 primary screens |

### 12.7.2 Top App Bar

A thin, persistent header providing platform identity and user session controls.

**Left side**: Platform logo or brand name ("VibeCoding")
**Right side**: Logged-in user symbol (initial-based avatar circle, see Ch.26.11.16)

**Avatar tap behavior**: Opens a single-level dropdown or bottom sheet (mobile) containing only account-related actions:
- Profile / Settings
- Logout
- (Future: Notification preferences)

**Visibility**: Present on **all authenticated pages**. Hidden on the public landing page (which has its own hero layout).

**Vertical stacking**: The Top App Bar sits **above** the Live Banner (see dashboard sections 12.3-12.5). Both are sticky, creating a clear visual hierarchy:

```
┌─────────────────────────────────────┐  ← Top App Bar (sticky, z-50)
│ VibeCoding              [EH]       │     Brand + Avatar
├─────────────────────────────────────┤  ← Live Banner (sticky, z-40)
│ 🔴 LIVE: Pitching 'API Rate Lim…' │     Event state
├─────────────────────────────────────┤
│                                     │
│         Page Content                │  ← Scrollable content
│         (Dashboard, Problem Card,   │
│          Assessment, etc.)          │
│                                     │
├─────────────────────────────────────┤  ← Bottom Nav Bar (fixed, z-50)
│  🏠 Home   📅 Events   📋 Problems │     Primary routes
└─────────────────────────────────────┘
```

### 12.7.3 Bottom Navigation Bar

A fixed bar at the viewport bottom providing single-tap access to primary screens.

**Route items** (3-5 icons with labels):

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| 🏠 | Home | `/dashboard` | Participant dashboard (default) |
| 📅 | Events | `/events` | Browse upcoming and past events |
| 📋 | Problems | `/problems` | Browse all public problems |

**Additional items for moderators/admins** (up to 5 total):

| Icon | Label | Route | Condition |
|------|-------|-------|-----------|
| 🎛️ | Moderate | `/dashboard/moderator` | `role ∈ {moderator, admin}` |
| ⚙️ | Admin | `/admin` | `role = admin` |

**Active state indicator**: The currently active route is visually highlighted (filled icon + accent color). Inactive items use muted icon + label color.

**Interaction model**: Single tap navigates immediately. No sub-menus, no long-press behavior.

### 12.7.4 Responsive Behavior

| Viewport | Top App Bar | Bottom Nav Bar |
|----------|-------------|----------------|
| Mobile (<640px) | Compact (44px height), logo text only | Full-width, 56px height, icons + labels stacked vertically |
| Tablet (640-1023px) | Standard (48px height), logo + tagline | Same as mobile |
| Desktop (≥1024px) | Standard (48px height), logo + tagline | Optional — may convert to left sidebar or top nav tabs (Future) |

**MVP**: Bottom navigation bar is present on all viewport sizes for consistency. Desktop sidebar conversion is a future enhancement.

### 12.7.5 Visibility Rules

| Page | Top App Bar | Bottom Nav Bar |
|------|-------------|----------------|
| Landing page (`/`) | Hidden | Hidden |
| Login / Register | Hidden | Hidden |
| All authenticated pages | Visible | Visible |

The landing page and authentication pages are "full-bleed" experiences with their own navigation (hero CTAs, login forms). The global chrome appears only after authentication.

### 12.7.6 Relationship to Existing Navigation

The global navigation chrome **complements** existing in-page navigation:

- **BackButton** (Ch.26.11.17): Still used for hierarchical back-navigation within flows (Assessment → Problem Card)
- **VersionNav** (Ch.13.5): Version switching remains within the Problem Card
- **FilterBar / FilterBottomSheet** (Ch.26.11.18): Content filters remain page-specific
- **Live Banner** (Ch.12.3-12.5): Stacks below Top App Bar, provides event-context navigation

The Bottom Nav Bar provides **lateral** navigation (switching between sibling screens), while BackButton provides **hierarchical** navigation (returning to parent context). Both coexist.

---

## 12.8 Problem Backlog Page

**Added 2026-02-25**: The Problem Backlog Page provides a dedicated browsing surface for all authenticated users to discover and explore problems across the community. This page is the target of the "Problems" item in the Bottom Navigation Bar (§12.7.3).

### Purpose

- Enable authenticated users to browse all publicly visible problems
- Provide filtering and sorting for efficient discovery
- Support moderator workflows for backlog curation
- Serve as the entry point for problem selection and event planning

### Route

`/problems` (plural) — distinct from `/problem/[slug]` (singular) for individual Problem Cards.

### 12.8.1 Visibility Rules (Public Problem Definition)

A problem appears on the public backlog when its states satisfy **both** of the following conditions:

| Dimension | Visible States | Hidden States |
|-----------|---------------|---------------|
| **Readiness** | submitted, needs_changes, ready | draft, rejected |
| **Action** | backlog, selected_for_event, selected_for_coding, deferred, closed | dropped |

**Rationale**:
- `draft` problems are private works-in-progress
- `rejected` problems failed the quality gate and should not be promoted
- `dropped` problems were explicitly removed from consideration
- `deferred` and `closed` problems remain visible for historical context and cross-event continuity

**Moderator override**: Moderators see additional filter options to reveal hidden states (rejected, dropped) for curation and audit purposes.

### 12.8.2 Core Layout

```
┌─────────────────────────────────────────────────┐
│ Problems                            [🔍 Search] │
├─────────────────────────────────────────────────┤
│ Filters: [All States ▼] [All Types ▼] [Sort ▼] │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Greenfield]  API Rate Limiter              │ │
│ │ Max Mustermann · Ready · Backlog            │ │
│ │ "Implement a token bucket rate limiter..."  │ │
│ │ ⭐⭐ · 3 reviews · v2                       │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Explorative]  DSPy Pipeline Optimization   │ │
│ │ Lisa Chen · Submitted · Selected for Event  │ │
│ │ "Optimize a DSPy evaluation pipeline..."    │ │
│ │ v1 · Cologne Feb 2026                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│            [Load More] or pagination            │
└─────────────────────────────────────────────────┘
```

### 12.8.3 Problem List Item

Each problem in the list displays:

| Element | Description |
|---------|-------------|
| **Classification badge** | Problem type (Greenfield, Brownfield, etc.) — top-left, `size="sm"` |
| **Title** | Problem title, linked to `/problem/[slug]` |
| **Owner** | Problem owner display name |
| **Readiness state** | Badge (submitted, needs_changes, ready) |
| **Action state** | Badge (backlog, selected_for_event, etc.) |
| **Description excerpt** | First 120 characters of the current version's description |
| **Stars** | Star count (if any) |
| **Review count** | Number of completed reviews |
| **Version** | Current version number |
| **Event association** | If selected for an event, show event name |

### 12.8.4 Filters

| Filter | Options | Default |
|--------|---------|---------|
| **Readiness State** | All, Submitted, Needs Changes, Ready | All |
| **Action State** | All, Backlog, Selected for Event, Selected for Coding, Deferred, Closed | All |
| **Problem Type** | All, + all active `problem_type_catalog` entries | All |
| **Location** | All, Cologne, Aachen, ... (from events associated with problems) | All |
| **Sort** | Newest First, Oldest First, Most Reviewed, Alphabetical | Newest First |

**Moderator-only filters** (visible when `role ∈ {moderator, admin}`):

| Filter | Additional Options |
|--------|-------------------|
| **Readiness State** | + Draft, Rejected |
| **Action State** | + Dropped |

### 12.8.5 Search

Keyword search across problem title, description, and owner display name. Server-side `LIKE` query with debouncing (300ms). Results update the list in place, preserving active filters.

### 12.8.6 Pagination

Server-side pagination with configurable page size (default: 20 problems per page). See §12.10 for the reusable pagination pattern.

### 12.8.7 Mobile Layout

On viewports <768px:

- Filters collapse into a horizontal scrollable pill bar or a "Filters" button opening a bottom sheet (see Ch.26.11.18 FilterBottomSheet)
- Problem cards are full-width with stacked metadata
- Search bar is full-width below the page title

### 12.8.8 Empty States

| Condition | Message |
|-----------|---------|
| No problems match filters | "No problems match your current filters. Try adjusting your search or filters." |
| No problems exist | "No problems have been submitted yet. Be the first to create one!" with link to `/problem/new` |

### 12.8.9 Interaction

- Clicking a problem card navigates to `/problem/[slug]`
- All filters and search update URL query parameters for shareability (e.g., `/problems?readiness=ready&type=greenfield&sort=newest`)
- Browser back button returns to the previously filtered state

---

## 12.9 Events Listing Page

**Added 2026-02-25**: The Events Listing Page provides a dedicated browsing surface for all authenticated users to discover upcoming, active, and past events across all locations. This page is the target of the "Events" item in the Bottom Navigation Bar (§12.7.3).

### Purpose

- Enable authenticated users to browse all community events
- Provide temporal grouping (upcoming, active, past) for orientation
- Support event registration directly from the listing
- Surface cross-location activity

### Route

`/events` (plural) — distinct from `/event/[slug]` (singular) for individual Event Detail Pages (§12.2).

### 12.9.1 Core Layout

```
┌─────────────────────────────────────────────────┐
│ Events                              [🔍 Search] │
├─────────────────────────────────────────────────┤
│ Filters: [All Locations ▼] [All Time ▼]        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ── Active Now ──────────────────────────────── │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 VibeCoding Cologne Feb 2026             │ │
│ │ Feb 25, 2026 · STARTPLATZ · 18 registered  │ │
│ │ Currently: Pitching                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ── Upcoming ────────────────────────────────── │
│ ┌─────────────────────────────────────────────┐ │
│ │ VibeCoding Aachen Mar 2026                  │ │
│ │ Mar 15, 2026 · RWTH · 12 registered        │ │
│ │ [Register]                                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ── Past ────────────────────────────────────── │
│ ┌─────────────────────────────────────────────┐ │
│ │ VibeCoding Cologne Jan 2026                 │ │
│ │ Jan 28, 2026 · STARTPLATZ · 23 attended     │ │
│ │ 5 problems · 3 reviews completed            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│            [Load More Past Events]              │
└─────────────────────────────────────────────────┘
```

### 12.9.2 Event List Item

| Element | Description |
|---------|-------------|
| **Title** | Event title, linked to `/event/[slug]` |
| **Live indicator** | 🔴 badge if event is currently active |
| **Date** | Formatted date and time |
| **Location** | City and venue name |
| **Partner logo** | Small logo (24px) if available |
| **Registration count** | "N registered" with capacity context (Ch.29) |
| **Current phase** | For active events: current live mode (Pitching, Review, etc.) |
| **Summary stats** | For past events: problem count, review count, attendance |
| **Registration button** | For upcoming events: "Register" / "Registered ✓" / "Waitlist" |

### 12.9.3 Temporal Sections

Events are grouped into three sections, each sorted appropriately:

| Section | Filter Condition | Sort Order | Default State |
|---------|-----------------|------------|---------------|
| **Active Now** | `start_time ≤ now AND end_time ≥ now` | By start time (ascending) | Expanded, prominently styled |
| **Upcoming** | `start_time > now` | By start time (ascending, nearest first) | Expanded |
| **Past** | `end_time < now` | By start time (descending, most recent first) | Show first 5, then "Load More" |

### 12.9.4 Filters

| Filter | Options | Default |
|--------|---------|---------|
| **Location** | All, Cologne, Aachen, ... (from `locations` table) | All |
| **Time Range** | All, Next 3 Months, Last 6 Months, This Year | All |

### 12.9.5 Search

Keyword search across event title, description, location name, and partner name. Same debounced server-side pattern as Problem Backlog (§12.8.5).

### 12.9.6 Pagination

Past events use **append-style "Load More"** pagination since the temporal grouping makes traditional page numbers less intuitive. Default: 5 past events initially, load 10 more per click.

### 12.9.7 Mobile Layout

On viewports <768px:

- Event cards are full-width
- Location filter as horizontal pill bar
- Temporal section headers are sticky during scroll

### 12.9.8 Empty States

| Condition | Message |
|-----------|---------|
| No upcoming events | "No upcoming events scheduled yet. Check back soon!" |
| No past events | "This community is just getting started. Stay tuned for the first event!" |
| No events match filters | "No events match your current filters." |

### 12.9.9 Moderator Context

Moderators see the same listing as participants. Event management controls are in the Admin area (Ch.17.3), not on the events listing page. However, moderators see a subtle "Manage" link on each event card linking to the moderator dashboard's event context.

---

## 12.10 Scalable List Views

**Added 2026-02-25**: This section defines the reusable pagination, search, and filtering pattern applied to all list views across the platform. The pattern ensures consistent UX and graceful scaling from dozens to thousands of entries.

### Applicability

The scalable list view pattern applies to:

| Page | Route | Expected Scale |
|------|-------|---------------|
| Problem Backlog | `/problems` | 10s–100s of problems |
| Events Listing | `/events` | 10s–100s of events |
| Admin: Users | `/admin/users` | 100s–1000s of users |
| Admin: Events | `/admin/events` | 10s–100s of events |
| Admin: Items | `/admin/items` | 10s–100s of items |
| Admin: Inventories | `/admin/inventories` | 10s of inventories |
| Moderator: Backlog in dashboard | `/dashboard/moderator` | 10s–100s of problems |

### 12.10.1 Server-Side Pagination

All list views with potentially unbounded data use **server-side pagination**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Current page (1-indexed) |
| `pageSize` | integer | 20 | Items per page (max 100) |
| `search` | string | "" | Search query |
| `sort` | string | varies | Sort field and direction |

**API Response Shape** (consistent across all paginated endpoints):

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 247,
    "totalPages": 13
  }
}
```

For SvelteKit server routes (`+page.server.ts`), pagination parameters are read from `url.searchParams` and passed to repository functions.

### 12.10.2 Search Pattern

- **Debounce**: 300ms delay after last keystroke before firing search
- **Minimum query length**: 2 characters (below 2 chars, clear search filter)
- **Server query**: `WHERE column LIKE '%query%'` with appropriate columns per entity
- **Case-insensitive**: `COLLATE NOCASE` (SQLite) / `ILIKE` (PostgreSQL)
- **Clear button**: "×" icon inside search input to reset
- **URL persistence**: Search term encoded in `?search=` query parameter

### 12.10.3 Filter Pattern

- Filters are rendered as dropdown selects (desktop) or horizontal pill bars / bottom sheet (mobile)
- Each filter change resets to page 1 and triggers a server request with the full filter set
- All active filters are encoded in URL query parameters
- A "Clear All Filters" link appears when any non-default filter is active
- Filters combine with AND logic

### 12.10.4 URL State Management

All list view state (page, search, sort, filters) is persisted in URL query parameters:

```
/problems?readiness=ready&type=greenfield&sort=newest&page=2&search=api
/admin/users?search=eva&role=moderator&page=1
/events?location=cologne&time=next_3_months
```

This enables:
- **Shareable filtered views**: Copy URL to share a specific view with colleagues
- **Browser navigation**: Back/forward through filter changes
- **Bookmarkable searches**: Save frequently used filter combinations
- **Page reload resilience**: Filters preserved across page refreshes

### 12.10.5 Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load (server response) | < 200ms |
| Filter/search response (server) | < 150ms |
| Page navigation (server) | < 100ms |
| Maximum items per page | 100 (enforced server-side) |

### 12.10.6 Responsive Behavior

| Viewport | Pagination | Filters | Search |
|----------|-----------|---------|--------|
| Desktop (≥768px) | Numbered pages with prev/next | Inline dropdown selects | Inline search input in page header |
| Mobile (<768px) | Simplified prev/next + "Page X of Y" | Bottom sheet or horizontal pill bar | Full-width search input below title |

### 12.10.7 Component References

See Chapter 26.17 for the implementation-ready component specifications:

- **Pagination** component (`ui/Pagination.svelte`)
- **SearchBar** component (`ui/SearchBar.svelte`)
- **ListFilterBar** component (`ui/ListFilterBar.svelte`)

---

## 12.11 Search and Discoverability [LOW PRIORITY]

> **Note**: Sections 12.11 and below were renumbered when Problem Backlog Page (§12.8), Events Listing Page (§12.9), and Scalable List Views (§12.10) were added (2026-02-25).

As the platform grows, finding relevant content becomes essential. This section specifies search and discovery capabilities.

**Note:** This is a **low-priority enhancement** for future implementation, not MVP scope.

### 12.11.1 Full-Text Search

A unified search interface that searches across all content types.

**Search Input:**
```
[🔍 Search problems, chat, lessons...____________]
```

**Search Scope Filters (checkboxes, default all active):**
- ☑ Problems (titles, descriptions, acceptance criteria)
- ☑ Chat messages (content, author names)
- ☑ Lessons learned (content, categories, tags)

**Search Results:**

```
Search: "rate limiter"
──────────────────────

📝 Problems (3 results)
  • API Rate Limiter — Max Mustermann
    "Implement a rate limiter for API endpoints..."
  • Redis Cache Manager — Lisa Chen
    "...using rate limiting for cache eviction"
  • Authentication Service — Tom Weber
    "...includes rate limiter middleware"

💬 Chat (12 results)
  • "The rate limiter approach worked well for our use case..."
    — Eva, in "API Rate Limiter", Feb 3
  • "Consider token bucket vs sliding window rate limiter"
    — Max, in "API Rate Limiter", Feb 2

💡 Lessons (2 results)
  • [Performance] "Rate limiters need Redis for multi-instance..."
    — From API Rate Limiter, Cologne Feb 2026
```

### 12.11.2 Semantic Search (Future Enhancement)

Beyond keyword matching, use **vector embeddings** for semantic similarity:

**Use Cases:**
- "Find problems similar to API Rate Limiter"
- "What lessons are related to caching?"
- Search by concept, not just keywords

**Implementation Notes:**
- Generate embeddings for problems, lessons, chat messages
- Store in vector database (pgvector or external)
- Enable "Similar problems" suggestions on Problem Cards

### 12.11.3 Faceted Navigation

Allow users to narrow results via structured filters:

**Filter Facets:**
- Problem Type: Greenfield / Brownfield / Explorative / etc.
- Readiness State: Draft / Ready / Closed
- Location: Cologne / Aachen / All
- Event: Specific event / All events
- Time Range: Last 30 days / Last 6 months / All time
- Has Stars: Yes / No

**Filter Persistence:**
- Filters persist during session
- Saved filter presets (future): "My filters" for quick access

### 12.11.4 Discovery Features

**"Similar Problems" Panel (on Problem Card):**
```
Similar Problems
────────────────
• Redis Cache Manager (78% similar)
• Database Connection Pool (65% similar)
• API Gateway (62% similar)
```

**"You Might Like" (on Dashboard):**
Based on participation history:
- Problems in categories user has worked on
- Problems from teams user has joined
- New problems from authors user has worked with

### 12.11.5 Search Data Model (Future)

For semantic search, the following extensions would be needed:

```sql
-- Vector embeddings for semantic search
CREATE TABLE content_embeddings (
  embedding_id UUID PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL,  -- 'problem', 'lesson', 'chat_message'
  content_id UUID NOT NULL,
  embedding_vector VECTOR(1536),  -- OpenAI ada-002 dimension
  created_at TIMESTAMP NOT NULL,
  UNIQUE (content_type, content_id)
);
```

**Note:** This requires vector database extension (pgvector) and embedding generation pipeline.

---

## 12.12 Contributor Wall Display

**Added 2026-02-05**: Public display of top contributors on landing page (referenced in Ch.12.1, specified here for completeness).

### Purpose
Recognize and showcase community contributors publicly, encouraging continued engagement and providing social proof for newcomers.

### Display Specification

**Location**: Landing page, below upcoming/past events sections
**Title**: "Top Contributors (Last 6 Weeks)"
**Data Source**: View `contributor_wall_6week` (Ch.19.3.36)
**Count**: Top 10 contributors sorted by points (descending), then contribution count (tie-breaker)

### Visual Layout - Leaderboard Style

**Top 3 (Podium Styling)**:
Ranks 1-3 receive visual emphasis to celebrate excellence:

```
┌─────────────────────────────────────────────┐
│           🥇 1st Place                      │
│     Eva Schmidt                             │
│     42 pts  ⭐⭐⭐    18 contributions       │
└─────────────────────────────────────────────┘
   ┌────────────────────┬────────────────────┐
   │   🥈 2nd Place     │   🥉 3rd Place     │
   │  Max Mustermann    │   Lisa Chen        │
   │  38 pts ⭐⭐       │   35 pts ⭐        │
   │  15 contributions  │   22 contributions │
   └────────────────────┴────────────────────┘
```

**Ranks 4-10 (Standard Rows)**:
```
4. Tom Weber         31 pts  ⭐⭐     12 contributions
5. Anna Müller       28 pts           19 contributions
6. ...
```

**Mobile**: Vertical stack, all ranks same width, podium top 3 slightly larger cards
**Desktop**: Grid option for top 3 (side-by-side), list for 4-10

### Privacy

Only users with `show_on_contributor_wall = TRUE` appear (Ch.18.12, Ch.33.6.5).
Opt-out users excluded from public display but personal progress still tracked.

### Component

**ContributorWall.svelte** component (`dashboard/ContributorWall.svelte`) encapsulates:
- Data fetching (or receives as prop)
- Podium styling for top 3
- Standard list for 4-10
- Empty state if no contributors
- Responsive layout

**Files**: `dashboard/ContributorWall.svelte`

---

## 12.13 Relationship to Other Chapters

Together, these pages and dashboards form a coherent system of views:
- **Public Landing Page** (§12.1) for discovery and community showcase
- **Event Detail Page** (§12.2) for event information and registration
- **Participant Dashboard** (§12.3) for personalized access
- **Event Dashboard** (§12.4) for shared awareness during live events
- **Moderator Dashboard** (§12.5) for live orchestration
- **Administrator Overview** (§12.6) for structural stewardship
- **Problem Backlog Page** (§12.8) for community-wide problem discovery
- **Events Listing Page** (§12.9) for cross-location event browsing

**Related Chapters:**
- **Chapter 13**: Problem Card links from listing and search results
- **Chapter 14**: Live event indicators on dashboards
- **Chapter 15**: Results and analytics views accessible from dashboards
- **Chapter 17**: Administration interfaces reference scalable list views (§12.10)
- **Chapter 18**: Authentication for personalized views
- **Chapter 19**: Data model for search indexes
- **Chapter 26.16**: Component specs for TopAppBar, BottomNavBar, AccountMenu
- **Chapter 26.17**: Component specs for Pagination, SearchBar, ListFilterBar
- **Chapter 29**: Event display and filtering
- **Chapter 32**: Onboarding integrates with dashboard guidance
- **Chapter 33**: Contributor wall displayed on landing page
