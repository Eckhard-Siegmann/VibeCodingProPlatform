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

## Layout

### Mobile (<768px) - Priority Order

Per Ch.12.4, Decision #26:

1. **Live Banner** (sticky top)
2. **Current Activity** (prominent)
3. **Decision Accordion** (moderator-only, 7 categories)
4. **Selected Problems** (for current event, collapsible if >3)
5. **Timer Controls** (if phase active)
6. **Attendance Tracking** (collapsible)
7. **Pending Review Backlog** (collapsible, default collapsed)
8. **Insights from Previous Event** (collapsible, default collapsed)
9. **Activity Feed** (collapsible, default open)

All sections collapsible except Live Banner and Current Activity (always visible).

### Desktop (≥768px) - Two-Column + Panel

**Left (Main, 50%)**:
- Current Activity
- Selected Problems
- Pending Review Backlog

**Right (Sidebar, 30%)**:
- Decision Accordion (sticky, scrollable if needed)
- Timer Controls (sticky)
- Activity Feed (sticky, max-height)

**Top Panel (Full-Width Above Columns)**:
- Live Banner
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

**Layout**:
```
┌──────────────────────────────────────────┐
│ Attendance (24 registered)          [▼]  │ ← Collapsible header
│                                          │
│ ☑ [Avatar] Max Mustermann (in-presence) │
│ ☑ [Avatar] Eva Schmidt (in-presence)    │
│ ☐ [Avatar] Tom Weber (remote)           │
│ ☐ [Avatar] Lisa Chen (in-presence)      │
│                                          │
│ Show-up rate: 83% (20/24)                │
│ In-presence: 15/18 (83%)                 │
│ Remote: 5/6 (83%)                        │
│                                          │
│ Filter: [All] [In-Presence] [Remote]     │
│         [Checked In] [Not Yet]           │
│                                          │
│ [Export Attendance CSV]                  │
│ [Mark All Present]                       │
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
- Search/filter: Shows modal or bottom sheet on mobile
- Bulk actions: Full-width buttons

**Stats Calculation**:
- Overall show-up rate: showed_up / total_registered
- By attendance mode: Calculate separately for in-presence vs remote
- Updates live as moderator checks boxes

**Export**:
- CSV format: name, email, in_presence, showed_up, check_in_time
- Filename: `{event-slug}-attendance-{date}.csv`
- Uses browser download API

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

**Layout**:
```
┌──────────────────────────────────────────┐
│ Pending Review (5)                  [▶]  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Database Migration Tool              │ │
│ │ Tom Weber • Submitted 3 days ago     │ │
│ │ [Accept] [Changes] [Reject]          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {4 more problems}                        │
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
1. Live Banner (sticky)
2. Current Activity
3. Decision Accordion
4. Selected Problems (collapsible if >3)
5. Timer Controls (if active)
6. Attendance (collapsed default)
7. Pending Review (collapsed default)
8. Insights (collapsed default)
9. Activity Feed (collapsed default)

**Sticky**: Live Banner only
**Collapsible**: All sections except banner and current activity

### Desktop (≥768px)

**Layout**: Two-column with sticky sidebar
- Left: Main content, scrollable
- Right: Decision Accordion + Timer (sticky)
- Top: Live Banner (full-width)
- Bottom: Attendance (expandable panel)

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

## Testing Checklist

- [ ] Decision accordion renders 7 categories
- [ ] Category headers color-coded correctly
- [ ] Only one category open at a time
- [ ] All 25 decision buttons present
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
- [ ] Show-up rate calculates correctly
- [ ] Export attendance CSV works
- [ ] Insights sections load data
- [ ] Insights expand/collapse correctly
- [ ] Mobile: All sections accessible at 375px
- [ ] Mobile: Touch targets ≥44px
- [ ] Mobile: No horizontal overflow
- [ ] Desktop: Two-column layout
- [ ] Desktop: Sticky sidebar
- [ ] Keyboard navigation works
- [ ] Screen reader announces decision actions

---

**Document Version**: 1.0.0
**Lines**: ~400
**Status**: Complete
