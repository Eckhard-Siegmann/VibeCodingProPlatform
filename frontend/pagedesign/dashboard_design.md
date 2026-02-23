# Dashboard Pages Design

**Routes**: `/dashboard` (Participant), `/dashboard/moderator` (Moderator)
**Status**: Retroactive documentation of Agent 4 implementation + enhancements
**Created**: 2026-02-05

---

## Overview

Two dashboard views sharing common elements but with role-specific additions. Participant dashboard provides personalized access to problems and events. Moderator dashboard adds live event orchestration controls.

---

## Common Elements (Both Dashboards)

### Live Banner (Sticky)

**Component**: `dashboard/LiveBanner.svelte`
**Visibility**: When event is active (current time between starts_at and planned_ends_at)
**Position**: `position: sticky; top: 0; z-index: 40`
**Height**: 60px minimum, expands for content

**States**:

| Event State | Banner Content | Color | Icon |
|-------------|----------------|-------|------|
| Idle (no event) | "Next: {Event Name} on {Date}" | Neutral (bg-canvas) | 📅 |
| Pitch Active | "🔴 LIVE: Pitching '{Problem}' — Vote now!" | Blue (bg-primary/10) | 🔴 |
| Coding Active | "💻 Coding: '{Problem}' — {Time} remaining" | Purple (bg-purple-bg) | 💻 |
| Review Active | "📝 Review open: '{Problem}'" | Green (bg-success/10) | 📝 |
| Event Ended | "Event ended. Thanks for participating!" | Neutral | ✓ |

**Mobile (<640px)**:
- Full-width, 48px minimum height
- Single line, text truncates if needed
- Tap banner → navigate to current activity (rating form or problem card)

**Desktop (≥768px)**:
- Same full-width
- More vertical padding (py-4)
- No truncation

**Interaction**:
- Clickable → routes to /assess/{id} or /problem/{slug} based on context
- Countdown timer shown if set (e.g., "Closes in 4:32")
- Participant count shown if live (e.g., "28 online")

---

### Current Activity Section

**Component**: `dashboard/CurrentActivity.svelte`
**Visibility**: Always visible (shows different content based on state)
**Position**: First scrollable section after banner

**States**:

**No Active Assessment**:
```
┌─────────────────────────────────────┐
│ Current Activity                    │
│                                     │
│ No interactive rating open          │
│                                     │
│ Next up: Problem selection          │
│ (after all pitches complete)        │
└─────────────────────────────────────┘
```

**Pitch Open**:
```
┌─────────────────────────────────────┐
│ 🎤 Now Open for Rating              │
│                                     │
│ API Rate Limiter                    │
│ Building a token bucket rate        │
│ limiter for API endpoints...        │
│                                     │
│ [Go to Pitch Rating →]              │
│                                     │
│ Closes in 4:15                      │
│ 12 responses so far                 │
└─────────────────────────────────────┘
```

**Review Open**:
```
┌─────────────────────────────────────┐
│ 📝 Review Assessment Open           │
│                                     │
│ API Rate Limiter                    │
│ Evaluate the solutions submitted    │
│                                     │
│ [Go to Review Rating →]             │
│                                     │
│ Open until Feb 10                   │
│ 8 responses so far                  │
└─────────────────────────────────────┘
```

**Visual**:
- Card elevation: `resting`
- Prominent button: `variant="default" size="lg"`
- Icon badge at top: Different per assessment type
- Problem title: `text-xl font-semibold`
- Description: `text-labels`, 2-line clamp
- Metadata row: Timestamp + response count

---

## Participant Dashboard (/dashboard)

**Layout Priority** (Mobile <768px, Decision #26):
1. Live Banner (sticky)
2. Current Activity
3. My Events
4. My Problems
5. Upcoming Events (preview)
6. Recent Activity Feed

**Desktop (≥768px)**:
- Two-column: Main content (2/3) + Sidebar (1/3)
- Main: Current Activity, My Events, My Problems
- Sidebar: Upcoming Events, Activity Feed

---

### Section: My Events

**Component**: Custom section using EventGrid
**Data**: User's registered events (upcoming and recent)
**Empty State**: `emptyEvents` config

**Layout**:
```
┌─────────────────────────────────────┐
│ My Events                           │
│                                     │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ Event 1     │ │ Event 2     │   │ (Grid on desktop)
│ │ Feb 10      │ │ Feb 24      │   │
│ └─────────────┘ └─────────────┘   │
│                                     │
│ [Browse All Events →]               │
└─────────────────────────────────────┘
```

**Mobile**: Vertical stack of EventCards (compact variant)
**Desktop**: 2-column grid

**Filters**: Upcoming (default) | Past
**Sort**: By date ascending (next event first)

---

### Section: My Problems

**Component**: Custom problem list
**Data**: Problems created by user
**Empty State**: `emptyProblemList` config

**Layout**:
```
┌─────────────────────────────────────┐
│ My Problems                         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ API Rate Limiter                │ │
│ │ [Ready] [Selected for Event]    │ │
│ │ Last updated 2 days ago          │ │
│ │ [Edit] [View]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Create New Problem →]              │
└─────────────────────────────────────┘
```

**Per Problem Card**:
- Title (link to problem card)
- State badges (readiness + action)
- Last updated timestamp
- Quick actions: Edit (if draft), View

**Sort**: Last updated descending
**Limit**: Show 5, "View All" link if more

---

### Section: Recent Activity Feed

**Component**: `dashboard/ActivityFeed.svelte`
**Data**: Recent decisions, chat messages, lessons learned (cross-problem)
**Collapsible**: On mobile (default open)

**Layout**:
```
┌─────────────────────────────────────┐
│ Recent Activity              [▼]    │
│                                     │
│ 2m ago  Eva commented               │
│         "Great progress on tests"   │
│         → API Rate Limiter          │
│                                     │
│ 1h ago  Problem "CLI Parser"        │
│         selected for event          │
│         → View problem              │
│                                     │
│ 3h ago  Max submitted lesson        │
│         "TDD with Claude works..."  │
│         → API Rate Limiter          │
└─────────────────────────────────────┘
```

**Activity Types** (icon-coded):
- 💬 Chat message
- ⚖️ Decision
- 💡 Lesson learned
- 👥 Team join/retire
- ✓ Assessment completed

**Interaction**: Tap activity → navigate to context (problem card, chat, etc.)
**Limit**: 10 most recent items
**Timeframe**: Last 7 days

---

## Moderator Dashboard (/dashboard/moderator)

**Inherits**: All sections from Participant Dashboard
**Adds**: Moderator-specific controls and information

**Layout Priority** (Mobile, Decision #26):
1. Live Banner (sticky)
2. Current Activity
3. **Decision Accordion** (moderator-only)
4. Selected Problems (for current event)
5. Pending Review Backlog
6. Timer Controls
7. Attendance Tracking
8. Activity Feed

---

### Section: Decision Accordion (Moderator-Only)

**Component**: `moderation/DecisionAccordion.svelte`
**Visibility**: Only for users with moderator or admin role
**Position**: Prominent, before problem list
**Mobile**: Accordion by category (Ch.26.12.3)
**Desktop**: Can show all expanded or keep accordion

**Mobile Layout**:
```
┌─────────────────────────────────────┐
│ Moderator Actions                   │
│                                     │
│ ▼ Quality Gate (3)             [🔵] │ ← Blue header, expanded
│   [Accept]                          │
│   [Request Changes]                 │
│   [Reject]                          │
│                                     │
│ ▶ Event Planning (2)            [🟢] │ ← Green, collapsed
│                                     │
│ ▶ Sprint Planning (2)           [🟣] │ ← Purple, collapsed
│                                     │
│ ▶ Deferral (6)                  [🟡] │ ← Yellow, collapsed
│                                     │
│ ▶ Drop (2)                      [🔴] │ ← Red, collapsed
│                                     │
│ ▶ Close (2)                     [🟣] │ ← Purple, collapsed
│                                     │
│ ▶ Live Assessments (4)          [🟠] │ ← Orange, collapsed
└─────────────────────────────────────┘
```

**Accordion Behavior**:
- Tap category header → expand, shows buttons
- Only ONE category expanded at a time
- Tapping expanded category → collapse
- Tapping different category → collapse previous, expand new

**Category Headers** (color-coded):
1. **Quality Gate** (blue): `bg-primary/10 text-primary border-l-4 border-primary`
2. **Event Planning** (green): `bg-success/10 text-success border-l-4 border-success`
3. **Sprint Planning** (purple): `bg-purple-bg text-purple border-l-4 border-purple`
4. **Deferral** (yellow): `bg-pending/10 text-pending border-l-4 border-pending`
5. **Drop** (red): `bg-alert/10 text-alert border-l-4 border-alert`
6. **Close** (purple): `bg-purple-bg text-purple border-l-4 border-purple`
7. **Live Assessments** (orange): `bg-warning-bg text-warning border-l-4 border-warning`

**Decision Buttons** (when category expanded):
- Full-width on mobile (100% width, 44px height)
- Color matches category (primary button colored, others secondary)
- Icon before text (from Lucide)
- Tap → shows comment modal if required (Request Changes, Reject, Defer, Drop)

**Comment Modal**:
- Uses FormDialog component
- Single textarea field (required for some decisions)
- Submit → creates decision with rationale
- Cancel → closes modal, no decision created

**Desktop (≥768px)**:
- Can show all categories expanded (no accordion)
- Or keep accordion for consistency
- Buttons in grid (2-3 per row) instead of full-width
- Comment input inline instead of modal

---

### Section: Selected Problems (Current Event)

**Component**: Problem list with decision controls
**Data**: Problems with `action_state = 'selected_for_event'` for current event
**Sort**: Manual order (position_index from event_problem_queue)

**Per Problem Card**:
```
┌─────────────────────────────────────┐
│ API Rate Limiter              [⋮]   │
│ Max Mustermann                      │
│ [Ready] [Selected for Event]        │
│                                     │
│ [Open Pitch] [Select for Coding]    │ ← Context-sensitive
│                                     │
│ 12 pitch votes • 3 team members     │
└─────────────────────────────────────┘
```

**ActionMenu (⋮)** contains:
- View Problem Card
- Open/Close Pitch (if applicable)
- Open/Close Review (if applicable)
- Select for Coding / Deselect
- Defer (opens submenu with 6 reasons)
- Drop (opens submenu with 2 reasons)
- Close (if coded - 2 options)

**Reordering**: Drag handles on desktop, up/down buttons on mobile

---

### Section: Timer Controls (Moderator-Only)

**Component**: Custom controls for countdown timers
**Visibility**: When live assessment or coding sprint active

**Layout**:
```
┌─────────────────────────────────────┐
│ Timer Controls                      │
│                                     │
│ Current Phase: Pitch Assessment     │
│ Time Remaining: 04:32               │
│                                     │
│ [Extend +5min] [Extend +10min]      │
│ [Close Now]                         │
│                                     │
│ Audio Cues: [Toggle On/Off]         │
└─────────────────────────────────────┘
```

**Functions**:
- Show current countdown
- Extend buttons add time to timer
- Close Now button ends phase immediately
- Audio toggle controls sound alerts

---

### Section: Attendance Tracking (Moderator-Only)

**Component**: Check-in interface
**Visibility**: During or after event
**Data**: event_registrations + event_attendance

**Layout**:
```
┌─────────────────────────────────────┐
│ Attendance (24 registered)          │
│                                     │
│ ☑ Max Mustermann                    │
│ ☑ Eva Schmidt                       │
│ ☐ Tom Weber                         │
│ ☐ Lisa Chen                         │
│                                     │
│ Show-up rate: 83% (20/24)           │
│                                     │
│ [Export Attendance]                 │
└─────────────────────────────────────┘
```

**Interaction**:
- Tap checkbox → mark attended/not attended
- Real-time update to show-up rate
- Export → CSV download

---

## Responsive Behavior

### Mobile (<640px)

**Vertical Stack Order**:
1. Live Banner (sticky, always visible)
2. Current Activity (if active, else collapsed)
3. Decision Accordion (moderator only, all categories collapsed initially)
4. My Events (2-3 cards shown, "View All" link)
5. My Problems (3 shown, "View All" link)
6. Selected Problems (moderator only, 5 shown)
7. Timer Controls (moderator only, if active)
8. Attendance (moderator only, collapsible)
9. Recent Activity (collapsible, default open)

**Collapsible Sections on Mobile**:
- Current Activity: Collapsed if no active assessment
- Selected Problems: Collapsed if >5 problems
- Attendance: Collapsed always
- Recent Activity: Open default, can collapse

**Sticky Elements**:
- Live Banner only
- No other sticky elements (avoid scroll conflicts)

### Desktop (≥768px)

**Two-Column Layout**:

**Left Column (Main, 66%):**
- Current Activity
- Decision Accordion (moderator only)
- My Events grid (2 columns)
- My Problems list
- Selected Problems (moderator only)

**Right Column (Sidebar, 33%):**
- Timer Controls (moderator only, sticky)
- Attendance (moderator only)
- Recent Activity Feed (sticky, max-height)

**No Collapsing**: All sections always visible on desktop

---

## Component Specifications

### LiveBanner Component

**File**: `dashboard/LiveBanner.svelte`
**Props**:
```typescript
interface Props {
  eventState: 'idle' | 'pitch' | 'coding' | 'review' | 'ended';
  problemTitle?: string;
  timeRemaining?: number; // seconds
  participantsOnline?: number;
  onClick?: () => void;
}
```

**Visual Details**:
- Height: 48px mobile, 60px desktop
- Padding: px-4 py-3
- Border bottom: 1px solid --color-secondary (subtle separation from content)
- Background: Variant-specific (see table above)
- Text: font-medium, responsive size (text-sm mobile, text-base desktop)
- Icon: 20px size, inline before text

**Animation**:
- Phase change: 200ms fade transition
- Pulse animation on "LIVE" states (respects prefers-reduced-motion)

**Audio Integration**:
- Phase change triggers audioStore.playPhaseChange() if enabled
- No sound for idle/ended states

---

### CurrentActivity Component

**File**: `dashboard/CurrentActivity.svelte`
**Props**:
```typescript
interface Props {
  assessment?: {
    assessment_id: string;
    problem_title: string;
    problem_slug: string;
    short_description: string;
    type: 'pitch' | 'review';
    closes_at?: string;
    response_count: number;
  };
  nextPhase?: string; // "Problem selection", "Coding sprint", etc.
}
```

**States**:
- Has assessment: Show prominent call-to-action
- No assessment: Show "No activity" with next phase info

**Button Sizing**:
- Mobile: Full-width, size="lg" (52px height)
- Desktop: Auto-width, size="md", centered

**Countdown Display**:
- If closes_at exists: Show "Closes in {relative}" or countdown timer
- If open-ended: Show "Open until {date}"

---

### DecisionAccordion Integration

**Component**: `moderation/DecisionAccordion.svelte`
**Props**:
```typescript
interface Props {
  problemId?: string; // If decisions are for specific problem, pre-select it
  problems: Problem[]; // List of problems to choose from
  onDecision: (decisionType: string, problemId: string, comment?: string) => void;
}
```

**Workflow**:
1. Moderator expands category (e.g., "Quality Gate")
2. Sees 3 buttons: Accept, Request Changes, Reject
3. If no problem selected: Dropdown appears "Select problem..."
4. Tap decision button → Comment modal if needed → Submit
5. Decision created, toast notification shown, dashboard refreshes

**Comment Required For**:
- Request Changes (explain what to change)
- Reject (explain why)
- All Defer reasons (explain context)
- All Drop reasons (explain why)

**Comment Optional For**:
- Accept, Select for Event, Select for Coding, Close

---

## Data Requirements

### Participant Dashboard

**+page.server.ts** must load:
```typescript
{
  user: {
    user_id, display_name, role, points, stars
  },
  currentEvent: {
    event_id, title, status, current_activity
  } | null,
  myEvents: Event[], // User's registrations
  myProblems: Problem[], // User's created problems
  upcomingEvents: Event[], // Next 3 events
  recentActivity: Activity[] // Last 10 activities
}
```

### Moderator Dashboard

**+page.server.ts** must load (extends participant):
```typescript
{
  ...participantData,
  selectedProblems: Problem[], // For current event
  pendingReviewBacklog: Problem[], // Submitted, not yet reviewed
  attendance: Registration[], // For current event
  timerState: {
    phase: string,
    ends_at: string,
    duration_minutes: number
  } | null
}
```

---

## Accessibility Requirements

**WCAG 2.1 AA Compliance**:

- Live Banner: `role="banner"`, `aria-live="polite"` for phase changes
- Current Activity: `role="region"`, `aria-label="Current Activity"`
- Decision buttons: All have aria-label describing action
- Problem cards: `role="article"` or within `<article>` tags
- Collapsible sections: `aria-expanded` on headers
- All buttons: 44×44px minimum touch targets
- Color contrast: All text ≥4.5:1 ratio with backgrounds

**Keyboard Navigation**:
- Tab through all interactive elements
- Enter/Space activates buttons
- Escape closes modals/comment inputs
- Arrow keys navigate problem list (optional enhancement)

---

## Mobile-Specific Patterns

### Collapsible Section UI

**Header** (when section can collapse):
```svelte
<button class="flex items-center justify-between w-full p-3 bg-canvas">
  <span class="font-medium text-headers">Recent Activity</span>
  <ChevronDown class={cn("transition-transform", isOpen && "rotate-180")} />
</button>
```

**Content** (when expanded):
```svelte
<div class="accordion-content" style="height: {isOpen ? contentHeight : 0}px">
  <div class="p-4">
    {content}
  </div>
</div>
```

**Animation**: Uses .accordion-content class from app.css (200ms ease-out)

### Sticky Banner Implementation

**Critical for Mobile**:
```svelte
<div class="sticky top-0 z-40 bg-primary/10 border-b border-primary/20">
  <div class="px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🔴</span>
      <span class="font-medium text-primary">LIVE: Pitching 'API Rate Limiter'</span>
    </div>
    <Button size="sm">Vote Now</Button>
  </div>
</div>
```

**iOS Safari Compatibility**:
- Use `position: -webkit-sticky` fallback
- Ensure parent doesn't have `overflow: hidden`
- Test thoroughly on actual iPhone

---

## Related Specifications

- **Ch.12.3**: Participant Dashboard structure
- **Ch.12.5**: Moderator Dashboard with decision controls
- **Ch.14**: Live interaction modes (pitch, review)
- **Ch.26.12.3**: Decision accordion mobile pattern
- **Ch.33**: Recent activity and engagement

---

## Testing Checklist

### Functional Tests
- [ ] Live banner appears when event active
- [ ] Live banner sticky on scroll (mobile)
- [ ] Current activity shows correct state
- [ ] "Go to Rating" button navigates correctly
- [ ] My Events grid shows user's registrations
- [ ] My Problems list shows user's created problems
- [ ] Decision accordion expands/collapses correctly
- [ ] Only one category open at a time (accordion)
- [ ] Decision buttons work (all 25 types)
- [ ] Comment modal appears when required
- [ ] Selected problems list shows current event problems
- [ ] Timer controls extend/close phase
- [ ] Attendance checkboxes update show-up rate
- [ ] Activity feed shows last 10 items
- [ ] Activity items link to correct destinations

### Responsive Tests
- [ ] Mobile: Vertical stack in priority order
- [ ] Mobile: Collapsible sections work
- [ ] Mobile: Live banner stays at top during scroll
- [ ] Desktop: Two-column layout renders
- [ ] Desktop: Sidebar sticky behavior
- [ ] Breakpoint: 768px transitions smoothly

### Accessibility Tests
- [ ] All interactive elements keyboard accessible
- [ ] Decision buttons have descriptive labels
- [ ] Live banner announces phase changes
- [ ] Color not sole indicator (icons present)
- [ ] Touch targets ≥44×44px on mobile
- [ ] Screen reader can navigate entire page

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-05
**Status**: Specification Complete
