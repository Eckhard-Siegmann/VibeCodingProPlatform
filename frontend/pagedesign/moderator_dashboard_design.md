# Moderator Dashboard Design

**Route**: `/dashboard/moderator`
**Purpose**: Live event orchestration and decision control
**Inherits**: Participant dashboard sections (Ch.12.5)
**Adds**: Moderator-specific controls
**Created**: 2026-02-05

---

## Overview

Moderator dashboard is the control center during live events. Moderators use this interface while:
- Standing at the front of the room
- Screen sharing to participants
- Moving around venue checking in attendees
- Responding to issues on smartphones

**Critical Requirement** (Ch.12.5):
> "All moderator controls work on smartphones (375px width minimum)"

---

## Mobile-First Design Principle

Unlike participant dashboard, moderator dashboard MUST prioritize **mobile usability** because:
1. Moderators walk around during events (smartphone in hand)
2. Check-in participants at door (tablet or phone)
3. Make quick decisions while facilitating discussions (phone)
4. Screen share from laptop BUT also need phone access

**Every control verified at 375px viewport.**

---

## Z-Index Stacking Context

**Added v1.2.0**: All moderator dashboard layers must respect the global navigation chrome z-index stack (Ch.12.7, Ch.26.16):

| Layer | Z-Index | Position | Element |
|-------|---------|----------|---------|
| TopAppBar | `z-50` | `fixed top-0` | Brand bar + avatar menu |
| LiveBanner | `z-40` | `sticky top-[var(--height-topbar-mobile)]` | Event state banner |
| Page content | default | `static` | All dashboard sections below |
| BottomNavBar | `z-50` | `fixed bottom-0` | Primary route navigation |

**Content offset**: The dashboard wrapper `<div>` must apply `pt-[var(--height-topbar-mobile)] pb-[var(--height-bottomnav-mobile)]` (mobile) / `pt-[var(--height-topbar-desktop)] pb-[var(--height-bottomnav-desktop)]` (desktop) to prevent content from hiding beneath the fixed navigation bars.

**Sticky sidebar** (desktop): Decision Accordion and Timer Controls use `position: sticky` with `top` set to `calc(var(--height-topbar-desktop) + var(--height-livebanner, 0px))` to avoid overlapping the TopAppBar and LiveBanner. Sticky elements must NOT use `z-index` above `z-30` to stay below the global chrome.

---

## Layout

### Mobile (<768px) - Priority Order

Per Ch.12.4, Decision #26:

1. **Live Banner** (sticky below TopAppBar, z-40)
2. **Current Activity** (prominent)
3. **Decision Accordion** (moderator-only, 7 categories)
4. **Selected Problems** (for current event, collapsible if >3)
5. **Timer Controls** (if phase active)
6. **Attendance Tracking** (collapsible)
7. **Review Results Summary** (collapsible, visible when ≥1 review closed)
7b. **Pitch Results Summary** (collapsible, visible when ≥1 pitch closed)
8. **Pending Review Backlog** (collapsible, default collapsed)
9. **Insights from Previous Event** (collapsible, default collapsed)
10. **Activity Feed** (collapsible, default open)

All sections collapsible except Live Banner and Current Activity (always visible).

### Desktop (≥768px) - Two-Column + Panel

**Left (Main, 50%)**:
- Current Activity
- Selected Problems
- Pending Review Backlog

**Right (Sidebar, 30%)**:
- Decision Accordion (sticky below TopAppBar+LiveBanner, scrollable if needed)
- Timer Controls (sticky)
- Activity Feed (sticky, max-height)

**Top Panel (Full-Width Above Columns)**:
- Live Banner (sticky, z-40, positioned below TopAppBar z-50)
- Event phase indicator
- Quick stats (participants online, assessments completed)

**Bottom Panel** (Expandable):
- Attendance Tracking
- Insights from Previous Event

---

## Section: Decision Accordion (Moderator-Only)

**Component**: `moderation/DecisionAccordion.svelte`
**Critical**: Most important moderator tool
**Mobile Pattern**: Accordion by category (Ch.26.12.3)

**Component reuse mandate**: The `DecisionAccordion` is a **single reusable component**. It is used in:
1. **Moderator Dashboard** — sidebar panel, receives `problemId` from queue selection
2. **Problem Card** — `ModeratorControlPanel` wrapper, receives `problemId` from route params

Both contexts use identical accordion markup, category definitions, and decision availability logic. The component receives `currentReadinessState` and `currentActionState` as props and derives button availability from the Decision Availability Rules below.

**Full Specification**:

### Category 1: Quality Gate (Blue)

**Header**: `bg-primary/10 text-primary border-l-4 border-primary`
**Icon**: Shield or CheckCircle
**Decisions**: 3

**Buttons**:
1. **Accept** - `bg-primary text-white`
   - Action: quality_gate_accepted
   - Effect: readiness → ready
   - Comment: Optional ("Great problem!")
   - Toast: "Problem accepted"

2. **Request Changes** - `bg-warning text-white`
   - Action: quality_gate_needs_changes
   - Effect: readiness → needs_changes
   - Comment: **REQUIRED** ("Add acceptance criteria")
   - Toast: "Changes requested, PO notified"

3. **Reject** - `bg-alert text-white`
   - Action: quality_gate_rejected
   - Effect: readiness → rejected
   - Comment: **REQUIRED** ("Too complex for sprint format")
   - Toast: "Problem rejected, PO notified"

**Mobile Layout** (Category Expanded):
```
▼ Quality Gate (3 decisions)

  [✓ Accept                              ]

  [⚠ Request Changes                     ]

  [✗ Reject                              ]
```
- Full-width buttons
- 44px minimum height
- 8px vertical gap
- Icons before text

**Desktop Layout**:
- Can show inline (all visible)
- Or keep accordion for consistency
- Buttons: Grid 3 columns, not full-width

### Category 2: Event Planning (Green)

**Header**: `bg-success/10 text-success border-l-4 border-success`
**Icon**: Calendar
**Decisions**: 2

**Buttons**:
1. **Select for Event** - `bg-success text-white`
   - Action: selected_for_event
   - Effect: action → selected_for_event
   - Comment: Optional
   - Toast: "Problem selected for {event name}"

2. **Deselect from Event** - `bg-secondary text-headers`
   - Action: deselected_for_event
   - Effect: action → backlog
   - Comment: Optional
   - Toast: "Problem removed from event"

### Category 3: Sprint Planning (Purple)

**Header**: `bg-purple-bg text-purple border-l-4 border-purple`
**Icon**: Code
**Decisions**: 2

1. **Select for Coding** - `bg-purple text-white`
   - Action: selected_for_coding
   - Effect: action → selected_for_coding
   - Note: Enables "Join as Dev" button on Problem Card
   - Toast: "Coding sprint started for {problem}"

2. **Deselect from Coding** - `bg-secondary text-headers`
   - Action: deselected_for_coding
   - Effect: action → selected_for_event (returns to event, not backlog)
   - Comment: Optional ("Insufficient team interest")
   - Toast: "Removed from coding"

### Category 4: Deferral (Yellow)

**Header**: `bg-pending/10 text-pending border-l-4 border-pending`
**Icon**: Clock or Pause
**Decisions**: 6

All buttons: `bg-pending text-white`, comment **REQUIRED**

1. **Defer: PO Absent** - Problem owner not available
2. **Defer: Low Priority** - Lower priority relative to others
3. **Defer: Skipped** - Ran out of time, no quality judgment
4. **Defer: Too Complex** - Too ambitious for sprint
5. **Defer: Needs Refinement** - Needs more work before ready
6. **Defer: Future Capability** - Waiting for tools/skills

**Comment Examples**:
- "PO had to leave early, will reconsider next event"
- "Good problem but 3 others ranked higher by group vote"
- "Only had time for 2 problems today"

**Effect**: All → action: deferred

### Category 5: Drop (Red)

**Header**: `bg-alert/10 text-alert border-l-4 border-alert`
**Icon**: Trash or XCircle
**Decisions**: 2

Both buttons: `bg-alert text-white`, comment **REQUIRED**

1. **Drop: Low Relevance** - No longer relevant to community
2. **Drop: Low Quality** - Fundamentally unsuitable

**Effect**: All → action: dropped (terminal state)

**Confirmation**: Extra ConfirmDialog before drop decision:
```
Drop Problem?

This removes the problem from consideration permanently.
The decision will be visible to the Problem Owner.

[Cancel] [Drop Problem]
```

### Category 6: Close (Purple)

**Header**: `bg-purple-bg text-purple border-l-4 border-purple`
**Icon**: CheckCircle or FlagCheckered
**Decisions**: 2

Both buttons: `bg-purple text-white`, comment optional

1. **Close: Complete** - Goals fully achieved
2. **Close: Partial** - Partially solved, good enough

**Effect**: All → action: closed (terminal state)

### Category 7: Live Assessments (Orange)

**Header**: `bg-warning-bg text-warning border-l-4 border-warning`
**Icon**: Radio or Broadcast
**Decisions**: 4

**Buttons**:
1. **Open Pitch** - `bg-warning text-white`
   - Shows modal: Select problem + set timer (optional)
   - Timer: Dropdown (5min, 10min, 15min, Custom, No limit)
   - Effect: event_live_context → pitch mode
   - Toast: "Pitch assessment opened for {problem}"
   - Auto-closes previous pitch if one is open

2. **Close Pitch** - `bg-secondary text-headers`
   - Confirmation: "Close pitch for {problem}?"
   - Effect: event_live_context → idle
   - Toast: "Pitch closed, {N} responses collected"

3. **Open Review** - Similar to Open Pitch
4. **Close Review** - Similar to Close Pitch

**Timer Modal**:
```
Open Pitch Assessment

Problem: [Select dropdown ▼]
Duration: [5 minutes ▼]
☐ Enable audio cues

[Cancel] [Open Pitch]
```

---

### Accordion Behavior (Mobile)

**Interaction**:
- Tap header → Expand category
- Auto-collapse previously expanded category
- Smooth animation (200ms)
- Chevron rotates 180°

**State Management**:
```typescript
let openCategory = $state<DecisionCategory | null>(null);

function toggleCategory(category: DecisionCategory) {
  openCategory = openCategory === category ? null : category;
}
```

**Visual Feedback**:
- Expanded: Chevron ▲, header slightly darker
- Collapsed: Chevron ▼, header normal
- Transition: Chevron rotation, content height

### Decision Availability Rules

Not all decisions are available in all states. The `DecisionAccordion` component derives button availability from the problem's current `readiness_state` and `action_state`:

| Decision Type | Available When |
|---|---|
| `quality_gate_accepted` | readiness = `submitted` OR `needs_changes` |
| `quality_gate_needs_changes` | readiness = `submitted` OR `needs_changes` |
| `quality_gate_rejected` | readiness = `submitted` OR `needs_changes` |
| `selected_for_event` | readiness = `ready` AND action = `backlog` |
| `deselected_for_event` | action = `selected_for_event` |
| `selected_for_coding` | action = `selected_for_event` |
| `deselected_for_coding` | action = `selected_for_coding` |
| `opened_for_pitch_assessment` | action = `selected_for_event` OR `selected_for_coding` |
| `closed_for_pitch_assessment` | action = `selected_for_event` OR `selected_for_coding` |
| `opened_for_review` | action = `selected_for_event` OR `selected_for_coding` |
| `closed_for_review` | action = `selected_for_event` OR `selected_for_coding` |
| `deferred_*` (all 6) | action NOT IN (`closed`, `dropped`) |
| `dropped_*` (both) | action NOT IN (`closed`, `dropped`) |
| `closed_*` (both) | action NOT IN (`closed`, `dropped`) |

**Lifecycle decisions** (`problem_created`, `problem_cloned`, `problem_submitted`, `problem_updated`) are never shown in the accordion — they are system-recorded, not moderator-initiated.

**Visual treatment of unavailable decisions**:
- Buttons shown with `opacity-50` and `cursor-not-allowed`
- Category header badge shows available/total count (e.g., "2/3")
- Entire category visually muted if 0 decisions available

**Source**: Ch.10 (decision model), Ch.05 (dual-state transitions), Ch.27 (transition diagram)

---

## Section: Timer Controls

**Component**: Custom form
**Visibility**: When live assessment or coding sprint active
**Position**: Sticky in sidebar (desktop), inline section (mobile)

**Layout**:
```
┌──────────────────────────────────────────┐
│ Phase Timer                              │
│                                          │
│ Pitch: "API Rate Limiter"                │
│                                          │
│ [====== 04:15 ======]                    │ ← Large countdown
│                                          │
│ [+1min] [+5min] [+10min]                 │ ← Extend buttons
│                                          │
│ [Close Phase Now]                        │ ← End immediately
│                                          │
│ 🔊 Audio Cues: [Toggle]                  │ ← Sound on/off
└──────────────────────────────────────────┘
```

**Countdown Display**:
- Format: MM:SS
- Size: text-4xl font-mono (large, readable from distance)
- Color escalation:
  - >25% remaining: text-headers
  - 10-25% remaining: text-pending (yellow)
  - <10% remaining: text-alert (red) + pulse animation
- Updates every second

**Extend Buttons**:
- Size: sm for compactness
- Variant: outline
- Click → Adds time to countdown
- Feedback: Brief toast "5 minutes added"

**Close Phase Button**:
- Size: md
- Variant: secondary (not destructive - reversible)
- Confirmation: "Close {phase} now? This will end voting/review."
- Effect: Creates close decision, clears timer

**Audio Toggle**:
- Shows current state: ON (sound icon) or OFF (muted icon)
- Click → toggles audioStore.setEnabled()
- Persists to localStorage
- Toast: "Audio cues enabled" / "Audio cues disabled"

---

## Section: Attendance Tracking

**Component**: Checklist with checkboxes
**Visibility**: Moderator only
**Collapsible**: Yes (default collapsed on mobile)

### Scalable List Pattern (Ch.12.10)

At scale, an event may have **50–500 registered attendees**. The attendance list MUST support server-side search and filtering to remain usable.

**SearchBar** (`ui/SearchBar.svelte`):
- Position: Below the section header, above the attendee list
- Placeholder: `"Search by name..."`
- Behavior: 300ms debounce, minimum 2 characters, `COLLATE NOCASE`
- Searches: `display_name` and `email` columns
- Mobile: Full-width below header when section is expanded
- Desktop: Inline, 250px width

**ListFilterBar** (`ui/ListFilterBar.svelte`):
- Filters:
  - **Mode**: `[All] [In-Presence] [Remote]`
  - **Status**: `[All] [Checked In] [Not Yet]`
- Desktop: Inline dropdown selects alongside SearchBar
- Mobile: Horizontal scrollable pill bar below SearchBar

**Pagination**: For events with >50 registrants, the list uses a **"Load More" append pattern** (not numbered pages) to keep the check-in workflow fluid:
- Initial display: 50 attendees (sorted alphabetically)
- "Load More" button appends 50 more
- Total count always shown in header: `"Attendance (24/50 checked in, 247 registered)"`
- Filters and search always apply server-side before pagination

**URL State**: Attendance search/filter state is NOT persisted in URL (unlike main list views) because attendance is a transient operational workflow, not a shareable view.

**Layout**:
```
┌──────────────────────────────────────────┐
│ Attendance (20/24 checked in)       [▼]  │ ← Collapsible header
│                                          │
│ [Search by name..._________________]     │ ← SearchBar
│ [All] [In-Presence] [Remote]             │ ← ListFilterBar pills
│ [All] [Checked In] [Not Yet]             │
│                                          │
│ ☑ [Avatar] Eva Schmidt (in-presence)     │
│ ☑ [Avatar] Max Mustermann (in-presence)  │
│ ☐ [Avatar] Lisa Chen (in-presence)       │
│ ☐ [Avatar] Tom Weber (remote)            │
│                                          │
│ [Load More (showing 24 of 24)]           │ ← Only if >50
│                                          │
│ Show-up rate: 83% (20/24)                │
│ In-presence: 15/18 (83%)                 │
│ Remote: 5/6 (83%)                        │
│                                          │
│ [Export Attendance CSV]                   │
│ [Mark All Present]                        │
└──────────────────────────────────────────┘
```

**Interaction**:
- Tap checkbox → Creates or updates event_attendance record
- Real-time updates to show-up rates
- Checkboxes: 44×44px touch targets
- Avatars: sm size (24px) for compactness

**Mobile Optimization**:
- Collapsed by default (reduce scroll)
- Tap header to expand
- SearchBar: Full-width, always visible when expanded
- Filter pills: Horizontal scroll bar
- Bulk actions: Full-width buttons

**Stats Calculation**:
- Overall show-up rate: showed_up / total_registered
- By attendance mode: Calculate separately for in-presence vs remote
- Updates live as moderator checks boxes
- Stats are calculated server-side from FULL dataset (not just visible page)

**Export**:
- CSV format: name, email, in_presence, showed_up, check_in_time
- Filename: `{event-slug}-attendance-{date}.csv`
- Uses browser download API
- Exports ALL attendees regardless of current search/filter/pagination state

---

## Section: Insights from Previous Event

**Component**: Accordion sections per Ch.12.5, Decision #10
**Purpose**: Prepare moderator for event introduction
**Data**: Lessons learned, late reviews from previous event

**Layout**:
```
┌──────────────────────────────────────────┐
│ Insights from Previous Event        [▶]  │ ← Collapsed default
│                                          │
│ ▼ Own Location (Cologne Jan 2026)       │
│   • "TDD with Claude works best..."     │
│   • "Greenfield problems <3 tasks..."   │
│   • 2 late code reviews submitted       │
│                                          │
│ ▶ Other Locations (Aachen Jan)          │ ← Collapsed, tap to expand
│                                          │
│ ▶ All-Time Valuable Insights            │
└──────────────────────────────────────────┘
```

**Three Accordion Subsections**:

1. **Own Location** (expanded default):
   - ALL lessons from this location's previous event
   - Late reviews submitted after event ended
   - Source: `lessons_learned WHERE event_id = {prev_event} AND valuable = ANY`

2. **Other Locations** (collapsed):
   - ONLY lessons flagged `valuable = TRUE` from other locations
   - Last 2-3 events from other cities
   - Source: `lessons_learned WHERE location != {own} AND valuable = TRUE`

3. **All-Time Valuable** (collapsed):
   - Top 10 most valuable lessons across all time, all locations
   - Highest reaction counts (👍 + 💡)
   - Source: `lessons_learned WHERE valuable = TRUE ORDER BY reactions DESC LIMIT 10`

**Per Lesson Display**:
- Category badge (tooling, architecture, process, gotcha, performance, testing)
- Lesson content (truncated to 2 lines with "Read more")
- Author name + event
- Reaction count
- Link to full lesson on problem card

**Purpose**:
Moderators can quickly review insights from previous events and present a 2-minute wrap-up at start of current event: "Last time we learned..."

---

## Section: Pending Review Backlog

**Component**: Problem list needing quality gate decisions
**Filter**: `readiness_state = 'submitted'`
**Sort**: By submitted_at (oldest first - FIFO queue)

### Scalable List Pattern (Ch.12.10)

At scale, up to **200 pending problems** may accumulate in the review backlog (multi-location community, multiple events queued). The section MUST be designed for server-side pagination.

**Server-Side Pagination**:
- Default page size: **10** problems per page
- Pattern: **"Load More" append** (not numbered pages) — moderators process the queue top-down, appending older items progressively
- "Load More" button shows: `"Load 10 more (showing 10 of 47)"`
- Server query: `WHERE readiness_state = 'submitted' ORDER BY submitted_at ASC LIMIT ? OFFSET ?`
- Total count always visible in header: `"Pending Review (47)"`

**ListFilterBar** (`ui/ListFilterBar.svelte`):
- Filters (optional, useful at scale):
  - **Problem Type**: `[All] [Greenfield] [Brownfield] [Explorative] [Other]`
  - **Age**: `[All] [Urgent (>7 days)] [Recent (<3 days)]`
- Desktop: Inline dropdown selects below section header
- Mobile: Horizontal scrollable pill bar

**URL State**: Pending Review filter/pagination state is NOT persisted in URL (this is a dashboard sub-section, not a standalone page).

**Layout**:
```
┌──────────────────────────────────────────┐
│ Pending Review (47)                 [▶]  │
│                                          │
│ [All Types ▼] [All Ages ▼]              │ ← ListFilterBar
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Database Migration Tool              │ │
│ │ Tom Weber • Submitted 9 days ago     │ │ ← Red (>7 days)
│ │ [Accept] [Changes] [Reject]          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Auth Service Refactor                │ │
│ │ Lisa Chen • Submitted 5 days ago     │ │ ← Yellow (3-7 days)
│ │ [Accept] [Changes] [Reject]          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {8 more on this page}                    │
│                                          │
│ [Load 10 more (showing 10 of 47)]        │
└──────────────────────────────────────────┘
```

**Per Problem**:
- Title (link)
- Owner + submitted timestamp
- Self-assessment scores (if exists): "Clarity 4.2, Complexity 3.8"
- Quick decision buttons (uses Decision Accordion actions)
- Expand to see full description

**Urgency Indicators**:
- >7 days old: Red timestamp "Submitted 9 days ago"
- 3-7 days: Yellow
- <3 days: Normal

**Mobile**: Collapsible, default collapsed (reduce scroll)
**Desktop**: Always visible in main column

---

## Responsive Behavior

### Mobile (<768px)

**Priority Order**:
1. Live Banner (sticky below TopAppBar z-50, uses z-40)
2. Current Activity
3. Decision Accordion
4. Selected Problems (collapsible if >3)
5. Timer Controls (if active)
6. Attendance (collapsed default, with SearchBar when expanded)
7. Pending Review (collapsed default, with "Load More" pagination)
8. Insights (collapsed default)
9. Activity Feed (collapsed default)

**Sticky**: TopAppBar (z-50, fixed) + Live Banner (z-40, sticky) + BottomNavBar (z-50, fixed)
**Content padding**: `pt-[var(--height-topbar-mobile)] pb-[var(--height-bottomnav-mobile)]`
**Collapsible**: All sections except banner and current activity

### Desktop (≥768px)

**Layout**: Two-column with sticky sidebar
- Left: Main content, scrollable
- Right: Decision Accordion + Timer (sticky, `top` offset = TopAppBar + LiveBanner heights)
- Top: Live Banner (full-width, z-40 below TopAppBar z-50)
- Bottom: Attendance (expandable panel, with SearchBar + filter pills)

---

## Data Requirements

**+page.server.ts**:
```typescript
{
  ...participantDashboardData,

  selectedProblems: Problem[], // current_action_state = 'selected_for_event' AND event_id = current
  pendingReview: Problem[], // readiness_state = 'submitted'
  attendance: Registration[], // For current event
  previousEventInsights: {
    ownLocation: Lesson[],
    otherLocations: Lesson[],
    allTimeValuable: Lesson[]
  },
  timerState: {
    active: boolean,
    phase: 'pitch' | 'review' | 'coding',
    problem_id: string,
    ends_at: string
  } | null
}
```

---

## Accessibility

**Decision Buttons**:
- All have descriptive aria-label
- "Accept" button: `aria-label="Accept problem {problemName} for quality gate"`
- Not just "Accept" alone

**Accordion**:
- Headers: `role="button"`, `aria-expanded`, `aria-controls`
- Content: `role="region"`, `aria-labelledby`

**Color + Icon**:
- Category colors paired with icons (not color alone)
- Colorblind users can distinguish by icon

**Keyboard**:
- Tab through all controls
- Enter/Space activates
- Escape closes modals
- Arrow keys navigate expanded category buttons (optional)

---

## Review Results Summary

**Visibility**: Appears when at least one review assessment has been closed for the event.
**Position**: After "Selected Problems" section, before "Pending Review Backlog" on mobile. In desktop two-column layout, right column below Timer Controls.

### List Bounds

Review results are bounded by the event queue size (typically 3–20 problems per event). No server-side pagination is needed. However, as a safety cap:
- **Maximum display**: 20 problems (matching a realistic event ceiling)
- If an event somehow exceeds 20 coded problems, the table shows the top 20 by weighted average with a note: `"Showing top 20 of {N} reviewed problems. View all →"`
- The "View all →" link navigates to a full results page with `Pagination.svelte` (Ch.12.10 pattern)

### Card Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ⭐ Review Results                              [View All →] │
│                                                              │
│ ┌───┬─────────────────────┬───────┬────────┬──────────────┐ │
│ │ # │ Problem              │ N     │ Score  │ Items        │ │
│ ├───┼─────────────────────┼───────┼────────┼──────────────┤ │
│ │ 1 │ API Rate Limiter     │ 12    │ 4.2    │ ▃▅▆▇▅▄▆▅    │ │
│ │ 2 │ CLI Parser           │ 10    │ 3.8    │ ▄▃▅▆▄▃▅▄    │ │
│ │ 3 │ Database Migration   │  8    │ 3.4    │ ▃▂▄▅▃▂▄▃    │ │
│ └───┴─────────────────────┴───────┴────────┴──────────────┘ │
│                                                              │
│ N = distinct reviewers │ Score = weighted avg (excl meta)    │
└─────────────────────────────────────────────────────────────┘
```

### Design Tokens

```
Card: elevation="resting", padding="md"
Header icon: Star (lucide), text-warning (amber)
Header title: "Review Results" - text-lg font-semibold text-headers
"View All" link: text-sm text-primary hover:text-primary-hover → navigates to results page

Table:
  Rank column:  w-8, text-center, font-mono
  Problem:      flex-1, font-medium text-headers, truncate on mobile
  N:            w-12, text-center, text-meta
  Score:        w-16, text-center, font-semibold
                Score ≥ 4.0: text-success
                Score 3.0-3.9: text-headers
                Score < 3.0: text-error
  Items:        w-24, hidden on mobile (<768px)
                Sparkline of per-item means (8 data points, excluding meta items)
                Uses SparkLine component from charts/

Rank badge styling:
  #1: bg-warning/10 text-warning font-bold (gold tint)
  #2: bg-secondary/30 text-labels font-semibold (silver tint)
  #3: bg-[#CD7F32]/10 text-[#CD7F32] font-semibold (bronze tint)
  Others: text-meta
```

### Mobile (<768px)

- Items sparkline column hidden (not enough width)
- Problem title truncated with ellipsis after ~20 chars
- Table rows minimum height 48px for touch targets
- Card collapsible (default open if ≤3 problems, collapsed if >3)

### Desktop (≥1024px)

- Full table with sparkline column
- Sortable columns (click header to toggle sort)
- Hover row highlights with bg-canvas/50
- "View All" navigates to `/assess/{assessmentId}/results` for the selected problem

### Data Source

- API endpoint: `GET /api/events/[eventId]/review-results`
- Returns array of reviewed problems with:
  - `problem_id`, `problem_title`, `problem_slug`
  - `assessment_id` (for navigation to results page)
  - `response_count` (distinct reviewers)
  - `weighted_average` (mean of per-item weighted means, excluding meta items)
  - `item_means` (array of 8 floats for sparkline: correctness through extensibility + completion_degree + time_efficiency)
  - `rank` (ordinal by weighted_average descending)
- Sorted by rank ascending

### Empty State

If event has no closed review assessments:
```
┌─────────────────────────────────────────────────────┐
│ ⭐ Review Results                                    │
│                                                      │
│     📊 No review results yet                        │
│     Results appear here after closing a review       │
│     session.                                         │
└─────────────────────────────────────────────────────┘
```

### Interaction with Moderator Dashboard Layout

Add to mobile priority order (between items 6 and 7):
```
6.5  **Review Results Summary** (collapsible, default open)
6.6  **Pitch Results Summary** (collapsible, default open)
```

Add to desktop two-column layout:
- Right column, after Timer Controls, before Pending Review Backlog

---

## Pitch Results Summary

**Visibility**: Appears when at least one pitch assessment has been closed for the event.
**Position**: After "Review Results Summary" section in mobile priority order; same column on desktop.

### List Bounds

Pitch results are bounded by the event queue size (typically 3–20 problems per event). No server-side pagination is needed. Same safety cap as Review Results:
- **Maximum display**: 20 problems
- Overflow: "Showing top 20 of {N} pitched problems." with link to full results

### Card Structure

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Pitch Results                                            │
│                                                              │
│ ┌─────────────────────┬───────┬────────┬──────────────────┐ │
│ │ Problem              │ N     │ Avg    │ Items            │ │
│ ├─────────────────────┼───────┼────────┼──────────────────┤ │
│ │ API Rate Limiter     │ 18    │ 3.9    │ ▃▅▆▇▅            │ │
│ │ CLI Parser           │ 16    │ 3.6    │ ▄▃▅▆▄            │ │
│ │ Database Migration   │ 15    │ 3.2    │ ▃▂▄▅▃            │ │
│ └─────────────────────┴───────┴────────┴──────────────────┘ │
│                                                              │
│ N = distinct respondents │ Avg = mean of item means          │
│ (No ranking — pitch results inform discussion, not outcomes) │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences from Review Results Summary

- **No ranking column**: Per Ch.15.1, pitch results never show rankings or winner indicators
- **No weighting**: Simple AVG(rating_value), no review_weight_catalog multipliers
- **Sort order**: Pitch order (event queue position_index), not by score
- **All items included**: No meta-item exclusion (meta items are review-only)
- **Purpose**: Inform group discussion about which problems to pursue

### Design Tokens

```
Card: elevation="resting", padding="none"
Header icon: BarChart3 (lucide), text-primary
Header title: "Pitch Results" - text-lg font-semibold text-headers

Table:
  Problem:      flex-1, font-medium text-headers, truncate on mobile
  N:            w-12, text-center, text-meta
  Avg:          w-16, text-center, font-semibold text-headers
  Items:        w-24, hidden on mobile (<768px)
                Sparkline of per-item means
                Uses inline SVG bars (same as ReviewResultsSummary)

No rank badge styling (pitch has no ranking).
```

### Data Source

- Uses `getEventPitchResults(eventId)` from responses repository
- Returns array of pitched problems with:
  - `problem_id`, `problem_title`, `problem_slug`
  - `assessment_id` (for navigation to individual results page)
  - `response_count` (distinct respondents)
  - `overall_average` (mean of per-item means, all items)
  - `item_means` (array of floats for sparkline)
- Sorted by pitch order (queue position), NOT by score

### Empty State

Section hidden entirely when no closed pitch assessments exist for the event.

### CSV Export Button

An admin-only "Download CSV" button in the card footer:
```
│ [📥 Download CSV]                   (admin role only) │
```
- Generates CSV client-side from the rendered pitch results data
- Filename: `pitch_results_{ISO_date}.csv`

---

## Testing Checklist

- [ ] Decision accordion renders 7 categories
- [ ] Category headers color-coded correctly
- [ ] Only one category open at a time
- [ ] All 26 decision buttons present
- [ ] Comment modal appears for required decisions
- [ ] Decision submission works (creates decision in DB)
- [ ] Toast notifications shown
- [ ] Problem state updates after decision
- [ ] Timer controls display when phase active
- [ ] Countdown updates every second
- [ ] Extend buttons add time correctly
- [ ] Close Phase button works
- [ ] Audio toggle persists preference
- [ ] Attendance checkboxes update database
- [ ] Attendance SearchBar filters by name (300ms debounce)
- [ ] Attendance filter pills work (mode + status)
- [ ] Attendance "Load More" appends next batch for 50+ attendees
- [ ] Show-up rate calculates correctly (from full dataset, not visible page)
- [ ] Export attendance CSV exports ALL attendees (ignoring current filter/pagination)
- [ ] Insights sections load data
- [ ] Insights expand/collapse correctly
- [ ] Pending Review "Load More" appends 10 more problems
- [ ] Pending Review total count shown in header
- [ ] Pending Review filter pills work (type, age)
- [ ] Review results summary hidden when no closed reviews
- [ ] Review results summary shows ranked problems after review close
- [ ] Review results sparklines render per-item means
- [ ] Review results scores color-coded by threshold
- [ ] Review/Pitch results capped at 20 problems with overflow link
- [ ] Z-index: TopAppBar (z-50) above LiveBanner (z-40) above content
- [ ] Z-index: BottomNavBar (z-50) visible at bottom
- [ ] Z-index: Sticky sidebar below TopAppBar+LiveBanner
- [ ] Content padding prevents overlap with fixed TopAppBar and BottomNavBar
- [ ] Mobile: All sections accessible at 375px
- [ ] Mobile: Touch targets ≥44px
- [ ] Mobile: No horizontal overflow
- [ ] Desktop: Two-column layout
- [ ] Desktop: Sticky sidebar respects TopAppBar offset
- [ ] Keyboard navigation works
- [ ] Screen reader announces decision actions

---

## Section: Email Templates Sub-Page Link

The moderator dashboard's existing **TemplateEditor** card includes a link to the dedicated Email Templates management page at `/dashboard/moderator/emails/[eventId]`. This link appears as a "View History" button in the TemplateEditor card header, allowing moderators to access the full template version history (M31) and revert to older versions.

The dedicated email templates page is specified in `frontend/pagedesign/email_templates_design.md`.

---

**Document Version**: 1.2.0
**Lines**: ~510
**Status**: Complete
**Changelog**:
- v1.2.0 (2026-02-25): Added z-index stacking context section (Ch.12.7, Ch.26.16), server-side pagination for Pending Review Backlog and Attendance Tracking (Ch.12.10), explicit list bounds for Review/Pitch Results, updated responsive behavior and testing checklist
- v1.1.0: Added Review Results Summary and Pitch Results Summary sections (TICKET-23)
