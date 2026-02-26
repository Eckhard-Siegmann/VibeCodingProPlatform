# Event Queue Planning Design

**Route**: `/dashboard/moderator/queue/[eventId]`
**Purpose**: Pre-event curation — select problems for an event and manage queue order
**User Stories**: M6 (Select Problems for Event), M13 (Reorder Queue)
**Spec References**: Ch.12.5 (Event Planning View), Ch.27.4 (Curation Phase), Ch.29.8 (Queue Management)
**Pattern**: Dual-pane shuttle (same as Inventory Editor in admin_interfaces_design.md §26.12.2)
**Created**: 2026-02-25

---

## Overview

The Event Queue Planning page is the moderator's tool for **pre-event curation**: browsing ready problems and composing the event agenda. It is distinct from the live moderator dashboard (`/dashboard/moderator`), which handles in-event orchestration.

**Entry Point**: "Plan Event Queue" button on the moderator dashboard.

**Key Principle**: All state changes flow through `recordDecision()` (ADR 006). Adding a problem to the queue fires `selected_for_event`; removing fires `deselected_for_event`. Reordering uses the PATCH `/api/events/{eventId}/queue` endpoint (not a decision — ordering is operational, not decisional).

---

## Layout

### Mobile (<768px) — Vertical Stack

Problems are shown in two sequential sections. The moderator scrolls between them and uses action buttons to move problems between sections.

```
┌─────────────────────────────────────┐
│ ← Back to Dashboard                │
│                                     │
│ Plan Queue: VibeCoding Cologne Mar  │
│ Event: March 28, 2026               │
│                                     │
│ ─── Event Queue (3) ───            │
│                                     │
│ 1. API Rate Limiter        [↑][↓]  │
│    Max Mustermann                   │
│    [Ready] [Candidate]              │
│    [✗ Remove]                       │
│                                     │
│ 2. Auth Middleware          [↑][↓]  │
│    Eva Schmidt                      │
│    [Ready] [Candidate]              │
│    [✗ Remove]                       │
│                                     │
│ 3. Cache Strategy           [↑][↓]  │
│    Tom Weber                        │
│    [Ready] [Candidate]              │
│    [✗ Remove]                       │
│                                     │
│ ─── Available Problems (5) ───      │
│                                     │
│ ☐ Database Migration Tool           │
│   Lisa Chen • Ready                 │
│                                     │
│ ☐ WebSocket Manager                 │
│   Anna Müller • Ready               │
│                                     │
│ ☐ CI Pipeline Generator             │
│   Paul Koch • Ready                 │
│                                     │
│ {2 more}                            │
│                                     │
│ [Add Selected to Queue ↑]           │
│                                     │
└─────────────────────────────────────┘
```

### Desktop (≥768px) — Side-by-Side Shuttle

Two columns with transfer controls between them. Left pane uses SearchBar + ListFilterBar + "Load More" pagination (Ch.12.10). Right pane scrolls independently for large queues.

```
┌───────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                       │
│                                                           │
│ Plan Queue: VibeCoding Cologne March 2026                 │
│ Event: March 28, 2026 at STARTPLATZ Köln                  │
│                                                           │
│ ┌─────────────────────────┬───┬───────────────────────────┐
│ │ Available Problems (87) │   │ Event Queue (3)           │
│ ├─────────────────────────┤   ├───────────────────────────┤
│ │ [Search problems...___] │   │                           │
│ │ Type: [All         ▼]   │   │ 1. API Rate Limiter  [↑↓] │
│ │                         │   │    Max Mustermann         │
│ │ ☐ Database Migration    │   │    [Ready] [Candidate]    │
│ │   Lisa Chen • Ready     │   │                           │
│ │   greenfield            │[>]│ 2. Auth Middleware   [↑↓] │
│ │                         │   │    Eva Schmidt            │
│ │ ☐ WebSocket Manager     │   │    [Ready] [Candidate]    │
│ │   Anna Müller • Ready   │[<]│                           │
│ │   brownfield            │   │ 3. Cache Strategy    [↑↓] │
│ │                         │   │    Tom Weber              │
│ │ ☐ CI Pipeline Generator │   │    [Ready] [Candidate]    │
│ │   Paul Koch • Ready     │   │                           │
│ │                         │   │                           │
│ │ [Load 20 more           │   │                           │
│ │  (showing 20 of 87)]    │   │                           │
│ └─────────────────────────┴───┴───────────────────────────┘
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Section: Event Queue (Right Pane / Top on Mobile)

**Data Source**: `getEventQueue(eventId)` — ordered by `position_index ASC`
**Display Priority**: Queue is shown FIRST (on mobile, above the backlog) because it represents the current state of planning.

### Per Queue Item

```
┌──────────────────────────────────────────┐
│ [↑] [position] [↓]                      │
│                                          │
│ Problem Title                            │
│ Owner Name                               │
│ [Ready] [queue_state]                    │
│                                          │
│ [✗ Remove from Queue]                    │
└──────────────────────────────────────────┘
```

**Fields**:
- Position number (from `position_index`)
- Problem title (linked to `/problem/{slug}`)
- Owner display name
- Readiness badge: `<Badge variant="ready">Ready</Badge>`
- Queue state badge: `<Badge variant="selected_for_event">{queue_state}</Badge>`
- Problem type badge (if set): `<Badge variant="outline">{problem_type}</Badge>`

**Reorder Controls**:
- ↑/↓ buttons (44×44px touch targets)
- Disabled at boundaries (first item can't go up, last can't go down)
- Immediate PATCH to `/api/events/{eventId}/queue` on click
- Optimistic UI: swap positions instantly, reconcile on server response

**Remove Button**:
- Text: "Remove" with × icon
- Variant: `ghost` with `text-alert` on hover
- Fires `deselected_for_event` decision via POST `/api/events/{eventId}/decisions`
- Confirmation: ConfirmDialog "Remove from event queue? Problem returns to backlog."
- On success: Toast "Problem removed from event queue"

### Scroll Behavior for Large Queues

Event queues are typically 3–20 problems, but the UI must gracefully handle queues that grow beyond screen height:

- **Desktop**: The right pane uses `max-height: calc(100vh - var(--height-topbar-desktop) - 120px)` with `overflow-y: auto` to create a scrollable container. The pane header ("Event Queue (N)") remains sticky at the top of the pane.
- **Mobile**: The queue section scrolls naturally within the page flow (no separate scroll container). If >10 items, a subtle "Scroll for more" indicator appears at the bottom of the visible area.
- **Reorder buttons** (↑/↓): Remain functional regardless of scroll position. After reorder, the moved item scrolls into view if necessary (using `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`).

No server-side pagination is needed for the Event Queue — the full queue is always loaded (bounded by practical event size).

### Empty State

```
┌──────────────────────────────────────────┐
│ Event Queue (0)                          │
│                                          │
│ No problems in the event queue yet.      │
│ Select problems from the Available       │
│ Problems list to add them.               │
│                                          │
│ [border-dashed styling]                  │
└──────────────────────────────────────────┘
```

---

## Section: Available Problems (Left Pane / Bottom on Mobile)

**Data Source**: Custom query — `readiness_state = 'ready' AND action_state = 'backlog' AND archived_at IS NULL`
**Sort**: By `created_at DESC` (newest first)

### Scalable List Pattern (Ch.12.10)

The Available Problems pane is a filtered view of the global problem backlog. At scale, a multi-location community may have **50–200 ready problems** in the backlog. This pane MUST support server-side search, filtering, and pagination.

**SearchBar** (`ui/SearchBar.svelte`):
- Position: Top of the left pane (desktop) / top of Available section (mobile)
- Placeholder: `"Search problems..."`
- Behavior: 300ms debounce, minimum 2 characters, `COLLATE NOCASE`
- Searches: `title` and `owner display_name` columns
- Visible on both desktop and mobile

**ListFilterBar** (`ui/ListFilterBar.svelte`):
- Filters:
  - **Problem Type**: `[All] [Greenfield] [Brownfield] [Explorative] [Advanced Greenfield] [Reverse Engineering] [Other]`
- Desktop: Inline dropdown select below SearchBar
- Mobile: Horizontal scrollable pill bar below SearchBar

**Server-Side Pagination**:
- Pattern: **"Load More" append** (not numbered pages) — preserves checkbox state across loads
- Default display: 20 problems initially
- "Load More" button: `"Load 20 more (showing 20 of 87)"`
- Server query: `WHERE readiness_state = 'ready' AND action_state = 'backlog' AND archived_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`
- Search and filter always apply server-side before pagination
- When a problem is added to the queue, it disappears from the available list (no manual refresh needed)

**URL State**: Search/filter/pagination state is NOT persisted in URL (this is a sub-page for operational workflow, not a shareable view). State is held in component-level `$state` variables and reset on page navigation.

### Per Available Problem

```
┌──────────────────────────────────────────┐
│ ☐ Problem Title                          │
│   Owner Name • Ready                     │
│   Type: greenfield                       │
└──────────────────────────────────────────┘
```

**Fields**:
- Checkbox for selection (multi-select)
- Problem title (linked to `/problem/{slug}` in new tab)
- Owner display name
- Readiness badge (always `ready` in this view)
- Problem type (if set)

### Add Action

**Mobile**: Full-width button below the available problems list
```
[Add Selected to Queue ↑]
```
- Disabled when no checkboxes checked
- Shows count: "Add 2 Selected to Queue ↑"

**Desktop**: Shuttle button `[>]` between panes
- Disabled when no checkboxes checked

**On Add**:
- For each selected problem, fire `selected_for_event` decision via POST `/api/events/{eventId}/decisions`
- Sequential API calls (one per problem — each is a separate decision)
- On success: Problem moves from left pane to right pane
- Toast: "N problem(s) added to event queue"
- Clear checkboxes after add

**On Remove (Desktop)**: Shuttle button `[<]`
- Same as the Remove button per queue item

### Empty State

```
┌──────────────────────────────────────────┐
│ Available Problems (0)                   │
│                                          │
│ No ready problems available.             │
│ Problems must pass the quality gate      │
│ before they can be selected for events.  │
└──────────────────────────────────────────┘
```

---

## Page Header

**Layout**:
```
┌──────────────────────────────────────────┐
│ ← Back to Dashboard                     │
│                                          │
│ Plan Queue: {Event Title}                │
│ {Event Date} at {Location Name}          │
│                                          │
│ Queue: 3 problems • Available: 5         │
└──────────────────────────────────────────┘
```

**Back Button**: Returns to `/dashboard/moderator`
**Event Info**: Title, date, location (loaded from event data)
**Quick Stats**: Count of queue items and available problems

---

## Data Requirements

**`+page.server.ts`**:
```typescript
{
  eventId: string,
  eventTitle: string,
  eventDate: string,
  locationName: string,

  // Right pane: current queue (always fully loaded — bounded by event size)
  queue: QueueItemWithProblem[],  // ordered by position_index ASC

  // Left pane: available problems (paginated — Ch.12.10)
  availableProblems: {
    items: {
      problem_id: string,
      slug: string,
      title: string,
      owner_display_name: string,
      current_readiness_state: string,  // always 'ready'
      problem_type: string | null,
      created_at: string
    }[],
    totalItems: number  // total matching problems (for "showing X of Y")
  }
}
```

**Repository Function** (`repositories/event-planning.ts`):
```typescript
function getAvailableBacklog(options: {
  search?: string,
  problemType?: string,
  limit: number,     // default 20
  offset: number     // default 0
}): { items: AvailableProblem[], totalItems: number }
// SELECT p.problem_id, p.public_slug, pv.title, u.display_name,
//        p.current_readiness_state, p.problem_type, p.created_at
// FROM problems p
// JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
// JOIN users u ON p.created_by_user_id = u.user_id
// WHERE p.current_readiness_state = 'ready'
//   AND p.current_action_state = 'backlog'
//   AND p.archived_at IS NULL
//   [AND (pv.title LIKE '%search%' OR u.display_name LIKE '%search%') COLLATE NOCASE]
//   [AND p.problem_type = ?]
// ORDER BY p.created_at DESC
// LIMIT ? OFFSET ?
```

**Existing functions reused**:
- `getEventQueue(eventId)` from `repositories/queue.ts`
- `recordDecision()` from `repositories/events.ts`
- `reorderQueue()` from `repositories/queue.ts`

---

## Server Actions

All actions POST to existing API endpoints. No new endpoints needed.

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Add to queue | POST | `/api/events/{eventId}/decisions` | `{ problem_id, decision_type: 'selected_for_event' }` |
| Remove from queue | POST | `/api/events/{eventId}/decisions` | `{ problem_id, decision_type: 'deselected_for_event' }` |
| Reorder queue | PATCH | `/api/events/{eventId}/queue` | `{ ordered_problem_ids: string[] }` |

---

## Auth & Authorization

- **Access**: `requireModerator(cookies)` — only moderators and admins can access
- **Objectivity constraint**: Moderators who joined a problem's team cannot fire `selected_for_event` or `deselected_for_event` for that problem (enforced by `requireModeratorForProblem` in the API route)
- **Error handling**: 401 → redirect to `/login`, 403 → toast error with explanation

---

## Responsive Behavior

### Mobile (<768px)
- Vertical stack: Queue first (scrolls naturally), then Available Problems
- Full-width cards
- ↑/↓ reorder buttons: 44×44px
- Remove button: full-width ghost
- "Add Selected" button: full-width, sticky at bottom of Available section
- Checkboxes: 44×44px touch targets
- SearchBar: Full-width above Available Problems list
- ListFilterBar: Horizontal scrollable pill bar below SearchBar
- "Load More" button: Full-width below problem list

### Desktop (≥768px)
- Side-by-side: Available (left 45%), Shuttle buttons (center 10%), Queue (right 45%)
- Shuttle buttons: `[>]` add, `[<]` remove
- Queue pane: `max-height` with independent scroll for large queues
- Queue items: drag handles (☰) for reordering (future enhancement, ↑/↓ MVP)
- SearchBar + ListFilterBar visible above Available list
- "Load More" button at bottom of Available list (below last problem card)

---

## State Management

```typescript
// Selected problems for batch add
let selectedProblemIds = $state<Set<string>>(new Set());

// Optimistic queue order (for immediate UI feedback)
let optimisticQueue = $state<QueueItemWithProblem[]>([]);

// Loading state for individual operations
let addingProblemId = $state<string | null>(null);
let removingProblemId = $state<string | null>(null);
let reordering = $state(false);
```

**Optimistic Updates**:
- On add: Immediately move problem from left to right (end of queue)
- On remove: Immediately move problem from right to left
- On reorder: Immediately swap positions
- On server error: Revert via `invalidateAll()`

---

## Accessibility

**Keyboard Navigation**:
- Tab through checkboxes, add button, queue items, reorder buttons, remove buttons
- Enter/Space toggles checkbox, activates buttons
- Escape closes ConfirmDialog

**Screen Reader**:
- Available section: `aria-label="Available problems for event selection"`
- Queue section: `aria-label="Event queue, ordered by pitch priority"`
- Reorder buttons: `aria-label="Move {problem} up"` / `"Move {problem} down"`
- Position: `aria-label="Position {n} of {total}"`

**Color + Icon**:
- Queue state badges use both color and text
- Remove button uses × icon + text (not color alone)

---

## Entry Point from Moderator Dashboard

Add a "Plan Event Queue" button to the moderator dashboard, in the Event Queue section header:

```
Event Queue (3)                    [Plan Queue →]
```

**Button**:
- Variant: `outline`
- Icon: `Calendar` (Lucide)
- Navigates to: `/dashboard/moderator/queue/{eventId}`
- Visible only to moderators/admins

---

## Testing Checklist

- [ ] Page loads with correct event info (title, date, location)
- [ ] Available problems shows only `ready` + `backlog` + not archived
- [ ] Available problems SearchBar filters by title and owner name (300ms debounce)
- [ ] Available problems ListFilterBar filters by problem type
- [ ] Available problems "Load More" appends 20 more problems
- [ ] Available problems total count shown in pane header
- [ ] Queue shows current event queue ordered by position_index
- [ ] Queue scrolls independently on desktop when >10 items
- [ ] Checkbox selection works (single and multi-select)
- [ ] Checkbox state preserved across "Load More" appends
- [ ] Add to queue fires `selected_for_event` decision
- [ ] Problem moves from Available to Queue on add
- [ ] Problem's `current_action_state` changes to `selected_for_event`
- [ ] Remove from queue fires `deselected_for_event` decision
- [ ] Problem moves from Queue to Available on remove
- [ ] Problem's `current_action_state` changes to `backlog`
- [ ] ConfirmDialog appears before remove
- [ ] ↑/↓ reorder buttons work
- [ ] Reorder persists to database (PATCH endpoint)
- [ ] Position numbers update correctly after reorder
- [ ] ↑ disabled on first item, ↓ disabled on last
- [ ] After reorder, moved item scrolls into view
- [ ] Back button returns to moderator dashboard
- [ ] Toast notifications for all actions
- [ ] Mobile: Full-width layout at 375px
- [ ] Mobile: Touch targets ≥44px
- [ ] Mobile: No horizontal overflow
- [ ] Mobile: SearchBar and filter pills visible above Available list
- [ ] Desktop: Side-by-side shuttle layout
- [ ] Desktop: Queue pane scrolls with sticky header for large queues
- [ ] Empty states display correctly
- [ ] Auth: Redirects to login if not authenticated
- [ ] Auth: Only moderators/admins can access

---

**Document Version**: 1.1.0
**Status**: Complete
**Changelog**:
- v1.1.0 (2026-02-25): Added SearchBar + ListFilterBar + "Load More" pagination for Available Problems pane (Ch.12.10), scroll behavior for large Event Queues, updated data requirements with paginated signature, updated responsive behavior and testing checklist
- v1.0.0: Initial specification
