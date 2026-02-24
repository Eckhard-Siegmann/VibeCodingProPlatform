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

**Event Planning View**
- Full list of Problems with extended metadata
- Advanced filtering:
  - By event
  - By location
  - By readiness state (`draft`, `submitted`, `needs_changes`, `ready`, `rejected`)
  - By action state (`backlog`, `selected_for_event`, `selected_for_coding`, `deferred`, `dropped`, `closed`)
  - By decision history
- Sorting by creation date, last decision, or priority

This view supports **pre-event curation** and **in-event reprioritization**.

**Live Decision Execution**
- Moderators can execute decisions with a single click
- Decisions are immediately logged and reflected across all views
- Optional rationale field appears contextually when required (e.g. rejections)

**Activity Log Shortcut**
- Compact feed of recent Decisions and Chat activity
- Each entry links directly to the relevant Problem Card
- Designed to replace ad-hoc messaging tools for internal coordination

**Attendance Tracking** (during/after event)
- Mark attendance for show-up rate tracking
- View registration list
- Export attendance data

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

## 12.7 Search and Discoverability [LOW PRIORITY]

As the platform grows, finding relevant content becomes essential. This section specifies search and discovery capabilities.

**Note:** This is a **low-priority enhancement** for future implementation, not MVP scope.

### 12.7.1 Full-Text Search

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

### 12.7.2 Semantic Search (Future Enhancement)

Beyond keyword matching, use **vector embeddings** for semantic similarity:

**Use Cases:**
- "Find problems similar to API Rate Limiter"
- "What lessons are related to caching?"
- Search by concept, not just keywords

**Implementation Notes:**
- Generate embeddings for problems, lessons, chat messages
- Store in vector database (pgvector or external)
- Enable "Similar problems" suggestions on Problem Cards

### 12.7.3 Faceted Navigation

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

### 12.7.4 Discovery Features

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

### 12.7.5 Search Data Model (Future)

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

## 12.8 Contributor Wall Display

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

## 12.9 Relationship to Other Chapters

Together, these dashboards form a coherent system of views:
- **Public Landing Page** for discovery and community showcase
- **Event Detail Page** for event information and registration
- **Participant Dashboard** for personalized access
- **Event Dashboard** for shared awareness during live events
- **Moderator Dashboard** for live orchestration
- **Administrator Overview** for structural stewardship

**Related Chapters:**
- **Chapter 13**: Problem Card links from search results
- **Chapter 14**: Live event indicators on dashboards
- **Chapter 15**: Results and analytics views accessible from dashboards
- **Chapter 18**: Authentication for personalized views
- **Chapter 19**: Data model for search indexes
- **Chapter 29**: Event display and filtering
- **Chapter 32**: Onboarding integrates with dashboard guidance
- **Chapter 33**: Contributor wall displayed on landing page
