# Events Listing Page Design

**Route**: `/events`
**Status**: New — TICKET-29
**Created**: 2026-02-25
**Components**: Page + `ui/SearchBar.svelte`, `ui/ListFilterBar.svelte`

---

## Overview

The Events Listing Page is the dedicated event discovery surface for authenticated users. It groups events into temporal sections (Active Now, Upcoming, Past) and supports cross-location browsing. Unlike the landing page event grid (which targets unauthenticated visitors), this page shows richer metadata, supports inline registration, and provides filtering.

**Design Goals**:
- Temporal orientation: Immediately see what's happening now, what's coming, what happened
- Cross-location discovery: Browse events across Cologne, Aachen, and future locations
- Quick registration: Register for events without navigating to the detail page
- Community context: Past events show summary stats to convey community momentum

---

## User Stories Covered

- **U3** – Browse Upcoming Events
- **U43** – Filter Events by Location
- **U44** – Share a Filtered View
- **U45** – Register for Event from Listing

---

## Specification Sources

- **Ch.12.9** — Events Listing Page (behavioral spec, temporal sections, filters)
- **Ch.12.10** — Scalable List Views (pagination, search, URL state)
- **Ch.12.1** — Public Landing Page event grid (shared design vocabulary)
- **Ch.12.2** — Event Detail Page (link target from event cards)
- **Ch.26.17** — Pagination, SearchBar, ListFilterBar component specs
- **Ch.29** — Events and Locations model
- **Ch.29.5** — Event registration

---

## Component Hierarchy

```
+page.svelte (/events)
├─ PageContainer
│  ├─ PageHeader
│  │  ├─ h1: "Events"
│  │  └─ SearchBar
│  ├─ ListFilterBar
│  │  ├─ FilterSelect: Location
│  │  ├─ FilterSelect: Time Range
│  │  └─ {#if hasActiveFilters}
│  │     └─ ClearAllLink
│  │
│  ├─ {#if activeEvents.length > 0}
│  │  └─ Section: "Active Now"
│  │     └─ {#each activeEvents as event}
│  │        └─ EventListItem (live variant)
│  │
│  ├─ {#if upcomingEvents.length > 0}
│  │  └─ Section: "Upcoming"
│  │     └─ {#each upcomingEvents as event}
│  │        └─ EventListItem (upcoming variant)
│  │           └─ RegistrationButton
│  │
│  ├─ {#if pastEvents.length > 0}
│  │  └─ Section: "Past"
│  │     ├─ {#each pastEvents as event}
│  │     │  └─ EventListItem (past variant)
│  │     └─ {#if hasMorePastEvents}
│  │        └─ LoadMoreButton
│  │
│  └─ {#if allEmpty}
│     └─ EmptyState
```

---

## Page Layout

### Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────┐
│ Events                                 [🔍 Search…     ] │
├──────────────────────────────────────────────────────────┤
│ [All Locations ▼]  [All Time ▼]                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ── 🔴 Active Now ────────────────────────────────────── │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🔴 VibeCoding Cologne Feb 2026                     │   │
│ │ Feb 25, 2026 · 18:00–21:00                         │   │
│ │ STARTPLATZ Köln · Workshop Room A                  │   │
│ │ Currently: Pitching · 18 registered                │   │
│ │ [STARTPLATZ logo]                    [View Event →]│   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ── Upcoming ─────────────────────────────────────────── │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ VibeCoding Aachen Mar 2026                         │   │
│ │ Mar 15, 2026 · 18:00–21:00                         │   │
│ │ RWTH SuperC · Seminar Room 2                       │   │
│ │ 12 registered · 30 capacity               [Register]│  │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ VibeCoding Cologne Apr 2026                        │   │
│ │ Apr 22, 2026 · 18:00–21:00                         │   │
│ │ STARTPLATZ Köln · Workshop Room A                  │   │
│ │ 5 registered · 30 capacity                [Register]│  │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ── Past ─────────────────────────────────────────────── │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ VibeCoding Cologne Jan 2026                        │   │
│ │ Jan 28, 2026 · STARTPLATZ Köln                     │   │
│ │ 23 attended · 5 problems · 3 reviews completed     │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ VibeCoding Aachen Dec 2025                         │   │
│ │ Dec 17, 2025 · RWTH SuperC                         │   │
│ │ 18 attended · 4 problems · 2 reviews completed     │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│                  [Load More Past Events]                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────────────────┐
│ Events                           │
│                                  │
│ [🔍 Search events…_____________]│ ← Full-width search
│                                  │
│ [All Locations] [All Time ▶]    │ ← Scrollable pills
│                                  │
│ ── 🔴 Active Now ────────────── │ ← Sticky section header
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🔴 VibeCoding Cologne       │ │
│ │ Feb 25 · 18:00–21:00        │ │
│ │ STARTPLATZ · Pitching       │ │
│ │ 18 registered               │ │
│ │            [View Event →]   │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Upcoming ──────────────────── │ ← Sticky section header
│                                  │
│ ┌──────────────────────────────┐ │
│ │ VibeCoding Aachen            │ │
│ │ Mar 15 · 18:00–21:00        │ │
│ │ RWTH · 12/30 registered     │ │
│ │                  [Register] │ │
│ └──────────────────────────────┘ │
│                                  │
│ ── Past ─────────────────────── │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ VibeCoding Cologne           │ │
│ │ Jan 28 · STARTPLATZ          │ │
│ │ 23 attended · 5 problems     │ │
│ └──────────────────────────────┘ │
│                                  │
│    [Load More Past Events]       │
└──────────────────────────────────┘
```

---

## EventListItem — Detailed Design

Three variants based on temporal context:

### Active Event Card

```
┌────────────────────────────────────────────────────────┐
│ 🔴 VibeCoding Cologne Feb 2026                         │  ← Title with live indicator
│                                                        │
│ Feb 25, 2026 · 18:00–21:00                             │  ← Date + time
│ STARTPLATZ Köln · Workshop Room A                      │  ← Location + room
│                                                        │
│ Currently: Pitching                                    │  ← Live phase badge
│ 18 registered · 15 attending                           │  ← Participation counts
│                                                        │
│ [STARTPLATZ logo]                      [View Event →]  │  ← Partner logo + CTA
└────────────────────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Live indicator | `🔴` emoji + pulsing animation (respects prefers-reduced-motion) |
| Title | `text-lg font-semibold text-headers` |
| Card border | `border-l-4 border-primary` (left accent for active events) |
| Card bg | `bg-primary/5` (subtle blue tint) |
| Phase badge | `Badge variant="live"` — e.g., "Pitching" in orange |
| CTA button | `Button variant="default" size="sm"` → navigates to `/event/[slug]` |

### Upcoming Event Card

```
┌────────────────────────────────────────────────────────┐
│ VibeCoding Aachen Mar 2026                             │
│                                                        │
│ Mar 15, 2026 · 18:00–21:00                             │
│ RWTH SuperC · Seminar Room 2                           │
│                                                        │
│ 12 registered · 30 capacity                            │
│ [RWTH logo]                                [Register]  │
└────────────────────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Card | `Card elevation="resting"`, standard white background |
| Registration info | `text-sm text-labels` |
| Capacity bar | Optional: thin progress bar showing fill (12/30 = 40%) |
| Register button | `Button variant="default" size="sm"` |

**Registration Button States**:

| State | Label | Variant | Action |
|-------|-------|---------|--------|
| Not registered | "Register" | `default` | POST `/api/events/[eventId]/registrations` |
| Registered (confirmed) | "Registered ✓" | `secondary` (green text) | Navigate to event detail |
| Waitlisted | "Waitlisted" | `secondary` (yellow text) | Navigate to event detail |
| Capacity full (not registered) | "Join Waitlist" | `outline` | POST `/api/events/[eventId]/registrations` |

### Past Event Card

```
┌────────────────────────────────────────────────────────┐
│ VibeCoding Cologne Jan 2026                            │
│                                                        │
│ Jan 28, 2026 · STARTPLATZ Köln                         │
│                                                        │
│ 23 attended · 5 problems tackled · 3 reviews completed │
└────────────────────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Card | `Card elevation="flat"`, `bg-canvas` (subdued for past) |
| Stats | `text-sm text-labels` — attended count, problem count, review count |
| Click | Entire card → `/event/[slug]` (event recap) |
| No CTA button | Past events are view-only |

### Card Properties (All Variants)

| Property | Value |
|----------|-------|
| Padding | `p-4` (mobile), `p-5` (desktop) |
| Margin | `mb-3` between cards |
| Border radius | `rounded-lg` |
| Partner logo | 24px height, `object-contain`, right-aligned on desktop, below title on mobile |
| Hover (desktop) | Elevation → `raised`, `cursor-pointer` |
| Click target | Entire card navigates to `/event/[slug]` (except Register button) |

---

## Section Headers

### Styling

```
── 🔴 Active Now ─────────────────────────
── Upcoming ──────────────────────────────
── Past ──────────────────────────────────
```

| Property | Value |
|----------|-------|
| Font | `text-sm font-semibold uppercase tracking-wider text-labels` |
| Decoration | `border-b border-secondary` full-width line |
| Padding | `pb-2 mb-4 mt-8` (first section: `mt-0`) |
| Icon | 🔴 for Active only |

### Mobile Sticky Headers

On mobile, section headers are `sticky` during scroll:

```css
.section-header {
  position: sticky;
  top: 44px; /* Below TopAppBar */
  z-index: 10;
  background: var(--color-canvas);
}
```

This ensures users always know which temporal section they're viewing while scrolling through long lists.

---

## Filters — Detailed Design

### Filter Configuration

```typescript
const filterConfig: FilterConfig[] = [
  {
    key: 'location',
    label: 'Location',
    options: [
      { value: 'all', label: 'All Locations' },
      // Populated from locations table:
      { value: 'cologne', label: 'Cologne' },
      { value: 'aachen', label: 'Aachen' },
    ],
    defaultValue: 'all',
  },
  {
    key: 'time',
    label: 'Time Range',
    options: [
      { value: 'all', label: 'All Time' },
      { value: 'next_3_months', label: 'Next 3 Months' },
      { value: 'last_6_months', label: 'Last 6 Months' },
      { value: 'this_year', label: 'This Year' },
    ],
    defaultValue: 'all',
  },
];
```

### Desktop Layout

```
[All Locations ▼]  [All Time ▼]                     Clear all
```

### Mobile Layout

```
[All Locations] [All Time ▶]     ← Horizontal scrollable pills
```

### Filter Behavior

- Location filter applies to all three temporal sections
- Time range filter primarily affects the Past section (upcoming/active are always shown regardless of time range)
- URL: `/events?location=cologne&time=last_6_months`

---

## Search

### SearchBar

| Property | Value |
|----------|-------|
| Placeholder | "Search events…" |
| Debounce | 300ms |
| Min length | 2 characters |
| Search fields | event title, description, location name, partner name |
| URL param | `?search=query` |

Search applies across all three temporal sections.

---

## Pagination

### Strategy: "Load More" for Past Events

Unlike the Problem Backlog (numbered pages), the Events Listing uses **append-style "Load More"** for past events:

- Active and Upcoming events: Always show all (expected low count)
- Past events: Show first 5 initially
- "Load More Past Events" button: Loads 10 more, appends to list
- URL param: `?pastCount=15` (tracks how many past events are visible)

```
┌────────────────────────────────────────┐
│       [Load More Past Events]          │  ← Button variant="secondary"
│       Showing 5 of 42 past events      │  ← text-xs text-labels
└────────────────────────────────────────┘
```

**Rationale**: Temporal grouping makes traditional page numbers confusing ("Is page 2 past events or upcoming events?"). "Load More" is more natural for chronological feeds.

---

## Empty States

### No Upcoming Events

```
┌────────────────────────────────────────────────┐
│                                                │
│            📅                                  │
│                                                │
│   No upcoming events scheduled yet.            │
│   Check back soon!                             │
│                                                │
└────────────────────────────────────────────────┘
```

Shown within the "Upcoming" section. The section header remains visible.

### No Past Events

```
┌────────────────────────────────────────────────┐
│                                                │
│            📅                                  │
│                                                │
│   This community is just getting started.      │
│   Stay tuned for the first event!              │
│                                                │
└────────────────────────────────────────────────┘
```

### No Events Match Filters

```
┌────────────────────────────────────────────────┐
│                                                │
│            📅                                  │
│                                                │
│   No events match your current filters.        │
│                                                │
│   [Clear all filters]                          │
│                                                │
└────────────────────────────────────────────────┘
```

### Completely Empty (No Events at All)

If there are zero events in the system (fresh install), show a single full-page empty state instead of three empty sections.

---

## Inline Registration — Detailed Design

### Registration Flow (from listing page)

1. User clicks "Register" on an upcoming event card
2. Button shows loading spinner
3. `POST /api/events/[eventId]/registrations` with `{ attendance_mode: 'in_presence' }` (default)
4. On success: Button transitions to "Registered ✓" (green)
5. On capacity full: Button transitions to "Waitlisted" (yellow)
6. On error: Toast notification with error message

### Attendance Mode

By default, inline registration uses `in_presence`. Users who want to register as `remote` navigate to the Event Detail Page where the full registration form with mode toggle is available.

### Cancellation

Cancellation is NOT available from the listing page. Users navigate to the Event Detail Page or their Dashboard to cancel.

---

## Moderator Context

### Additional Elements

Moderators see a subtle "Manage" link on each event card:

```
┌────────────────────────────────────────────────────┐
│ VibeCoding Aachen Mar 2026                         │
│ ...                                                │
│ [RWTH logo]    [Manage]              [Register]    │
│                  ↑ text-xs text-labels underline    │
└────────────────────────────────────────────────────┘
```

"Manage" links to the moderator dashboard with that event's context: `/dashboard/moderator?event=[eventId]`.

---

## Data Requirements

### +page.server.ts

```typescript
export const load: PageServerLoad = async ({ url, cookies }) => {
  const user = await getAuthenticatedUser(cookies);
  if (!user) throw redirect(302, '/login');

  const search = url.searchParams.get('search') || '';
  const location = url.searchParams.get('location') || 'all';
  const time = url.searchParams.get('time') || 'all';
  const pastCount = parseInt(url.searchParams.get('pastCount') || '5');

  const now = new Date();

  const activeEvents = await getEvents({
    status: 'active', search, location, now,
  });
  const upcomingEvents = await getEvents({
    status: 'upcoming', search, location, time, now,
  });
  const pastResult = await getEvents({
    status: 'past', search, location, time, now,
    limit: pastCount,
  });

  const locations = await getLocations();

  // Get user's registrations to show correct button states
  const userRegistrations = await getUserRegistrations(user.user_id);

  return {
    activeEvents,
    upcomingEvents,
    pastEvents: pastResult.items,
    pastTotal: pastResult.total,
    pastCount,
    locations,
    userRegistrations,  // Map<eventId, registration status>
    filters: { search, location, time },
    isModerator: user.role === 'moderator' || user.role === 'admin',
  };
};
```

### Response Shape

```typescript
interface EventListItem {
  event_id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  planned_ends_at: string;
  location_name: string;
  room_name: string;
  city: string;
  partner_name: string;
  partner_logo_url: string | null;
  registration_count: number;
  effective_capacity: number;        // room capacity × overbooking factor
  attendance_count: number | null;   // Only for past/active events
  problem_count: number | null;      // Only for past events
  review_count: number | null;       // Only for past events
  current_mode: string | null;       // Only for active events (pitch, review, idle)
  current_problem_title: string | null; // Only for active events
}

interface UserRegistration {
  event_id: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
}
```

---

## Accessibility

### Keyboard Navigation

- **Tab**: Search → filters → event cards (within each section) → Load More
- **Enter** on event card: Navigate to event detail
- **Enter** on Register button: Trigger registration
- **Section headers**: Not focusable (decorative)

### ARIA

- Page: `<main aria-label="Events Listing">`
- Each section: `<section aria-label="Active events">`, `<section aria-label="Upcoming events">`
- Event list: `<ul role="list">`, items: `<li role="listitem">`
- Register button: `aria-label="Register for {event title}"`
- Load More: `aria-label="Load more past events"`
- Live indicator: `aria-label="Currently active"` on the 🔴

### Screen Reader

- Section counts: "Active Now: 1 event", "Upcoming: 3 events", "Past: 5 of 42 events"
- Registration success: "Registered for {event title}" announced via live region
- Live event: "Live event: VibeCoding Cologne, currently pitching"

---

## Performance

| Metric | Target |
|--------|--------|
| Initial page load | < 200ms server response |
| Filter response | < 150ms |
| Load More response | < 100ms |
| Registration action | < 300ms total (network + DB) |

### Optimization

- Active + Upcoming events: Single query each (low count expected)
- Past events: Paginated with `LIMIT` + `COUNT(*)` for total
- User registrations: Single query for all event IDs on page
- Partner logos: Lazy-loaded, fallback to text if missing

---

## Testing Checklist

### Functional Tests

- [ ] Page loads with three temporal sections
- [ ] Active events show live indicator and current phase
- [ ] Upcoming events show registration count and capacity
- [ ] Past events show summary stats (attended, problems, reviews)
- [ ] Register button works (creates registration)
- [ ] Register button shows correct state (Register / Registered / Waitlisted)
- [ ] Location filter filters all sections
- [ ] Time range filter filters past events
- [ ] Search filters across all sections
- [ ] "Load More Past Events" loads 10 more
- [ ] URL updates with filter/search/pastCount state
- [ ] Event card click navigates to /event/[slug]
- [ ] Moderator "Manage" link visible and navigates correctly
- [ ] Empty states show correctly for each section
- [ ] Section headers visible when sections have content

### Responsive Tests

- [ ] Mobile (375px): Full-width cards, scrollable pill filters
- [ ] Mobile: Section headers sticky below TopAppBar
- [ ] Mobile: Register button full-width within card
- [ ] Desktop (768px+): Wider cards, inline filters
- [ ] Desktop: Partner logo right-aligned
- [ ] Breakpoint transition smooth

### Accessibility Tests

- [ ] Keyboard navigation through all sections
- [ ] Screen reader announces section names and counts
- [ ] Register button has descriptive aria-label
- [ ] Live event announced correctly
- [ ] Color not sole indicator (text labels + icons)
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Focus visible on all interactive elements

---

## Templates Used

| Component | Source |
|-----------|--------|
| Card | `ui/card` (elevation varies by variant) |
| Badge | `ui/badge` (for live phase indicator) |
| Button | `ui/button` (Register, Load More, View Event) |
| SearchBar | `ui/SearchBar.svelte` (Ch.26.17.2) |
| ListFilterBar | `ui/ListFilterBar.svelte` (Ch.26.17.3) |
| PageContainer | `layout/PageContainer.svelte` |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-25
**Status**: Specification Complete
