# Problem Backlog Page Design

**Route**: `/problems`
**Status**: New — TICKET-29
**Created**: 2026-02-25
**Components**: `ProblemBacklog.svelte` (page), `ui/SearchBar.svelte`, `ui/ListFilterBar.svelte`, `ui/Pagination.svelte`

---

## Overview

The Problem Backlog Page is the community-wide problem discovery surface. It enables all authenticated users to browse, search, filter, and sort problems across the entire platform. For moderators, it doubles as a curation tool with additional filter options.

**Design Goals**:
- Fast scanning: Users should identify interesting problems within seconds
- Progressive filtering: Start broad, narrow down with filters
- Mobile-first: Usable while standing at an event, one-handed on a phone
- Shareable: Every filter/search/page combination has a unique URL

---

## User Stories Covered

- **U6** – Browse Public Problems
- **U41** – Filter and Sort Problem Backlog
- **U42** – Search Problems by Keyword
- **U44** – Share a Filtered View
- **M2** – View the Global Problem Backlog

---

## Specification Sources

- **Ch.12.8** — Problem Backlog Page (behavioral spec, visibility rules, filters, layout)
- **Ch.12.10** — Scalable List Views (pagination, search, URL state management)
- **Ch.26.17** — Pagination, SearchBar, ListFilterBar component specs
- **Ch.4** — Problem concept and dual-state model
- **Ch.13.1** — Problem Card public view

---

## Component Hierarchy

```
+page.svelte (/problems)
├─ PageContainer
│  ├─ PageHeader
│  │  ├─ h1: "Problems"
│  │  └─ SearchBar
│  ├─ ListFilterBar
│  │  ├─ FilterSelect: Readiness State
│  │  ├─ FilterSelect: Action State
│  │  ├─ FilterSelect: Problem Type
│  │  ├─ FilterSelect: Location
│  │  ├─ SortSelect: Sort Order
│  │  ├─ {#if role ∈ {moderator, admin}}
│  │  │  └─ (additional filter options for rejected, dropped)
│  │  └─ {#if hasActiveFilters}
│  │     └─ ClearAllLink
│  ├─ ResultsCount ("Showing 1-20 of 47 problems")
│  ├─ ProblemList
│  │  └─ {#each problems as problem}
│  │     └─ ProblemListItem
│  │        ├─ Badge: problem_type (top-left)
│  │        ├─ Title (linked to /problem/[slug])
│  │        ├─ OwnerName
│  │        ├─ Badge: readiness_state
│  │        ├─ Badge: action_state
│  │        ├─ DescriptionExcerpt (120 chars)
│  │        ├─ StarCount + ReviewCount
│  │        ├─ VersionBadge
│  │        └─ {#if eventAssociation}
│  │           └─ EventChip
│  ├─ {#if problems.length === 0}
│  │  └─ EmptyState
│  └─ Pagination
```

---

## Page Layout

### Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────┐
│ Problems                                  [🔍 Search…  ] │
├──────────────────────────────────────────────────────────┤
│ [All States ▼] [All Actions ▼] [All Types ▼]            │
│ [All Locations ▼] [Newest First ▼]           Clear all  │
├──────────────────────────────────────────────────────────┤
│ Showing 1-20 of 47 problems                             │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [Greenfield]                                       │   │
│ │ API Rate Limiter                                   │   │
│ │ Max Mustermann                                     │   │
│ │ [Ready] [Backlog]                                  │   │
│ │ "Implement a token bucket rate limiter for API     │   │
│ │ endpoints with configurable limits and sliding…"   │   │
│ │ ⭐⭐ · 3 reviews · v2                              │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ [Explorative]                                      │   │
│ │ DSPy Pipeline Optimization                         │   │
│ │ Lisa Chen                                          │   │
│ │ [Submitted] [Selected for Event]                   │   │
│ │ "Optimize a DSPy evaluation pipeline for better    │   │
│ │ prompt engineering with measurable outcomes…"      │   │
│ │ v1 · Cologne Feb 2026                              │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ {18 more problem cards}                                  │
│                                                          │
│ Showing 1-20 of 47   [◀ Prev] 1 [2] 3 [Next ▶]        │
└──────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────────────────┐
│ Problems                         │
│                                  │
│ [🔍 Search problems…_________]  │ ← Full-width search
│                                  │
│ [All States] [All Types] [▶ More]│ ← Scrollable pill bar
│                                  │
│ 47 problems                      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ [Greenfield]                 │ │
│ │ API Rate Limiter             │ │
│ │ Max Mustermann               │ │
│ │ [Ready] [Backlog]            │ │
│ │ "Implement a token bucket…"  │ │
│ │ ⭐⭐ · 3 reviews · v2        │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ [Explorative]                │ │
│ │ DSPy Pipeline Optimization   │ │
│ │ Lisa Chen                    │ │
│ │ [Submitted] [Sel. for Event] │ │
│ │ "Optimize a DSPy eval…"     │ │
│ │ v1 · Cologne Feb 2026       │ │
│ └──────────────────────────────┘ │
│                                  │
│ {more cards}                     │
│                                  │
│ [◀ Prev] Page 2 of 3 [Next ▶]  │
└──────────────────────────────────┘
```

---

## ProblemListItem — Detailed Design

### Card Layout

```
┌────────────────────────────────────────────────────────┐
│ [Greenfield]                                           │  ← Classification badge, size="sm"
│                                                        │
│ API Rate Limiter                                       │  ← Title, text-lg, font-semibold, linked
│ Max Mustermann                                         │  ← Owner, text-sm, text-labels
│                                                        │
│ [Ready]  [Backlog]                                     │  ← State badges, variant matches state
│                                                        │
│ "Implement a token bucket rate limiter for API         │  ← Description, text-sm, text-body
│ endpoints with configurable limits and sliding…"       │     line-clamp-2, max 120 chars
│                                                        │
│ ⭐⭐ · 3 reviews · v2               Cologne Feb 2026  │  ← Metadata row, text-xs, text-labels
└────────────────────────────────────────────────────────┘
```

### Card Properties

| Property | Value |
|----------|-------|
| Container | `Card` with `elevation="resting"` |
| Hover | `elevation="raised"`, `cursor-pointer` |
| Padding | `p-4` (mobile), `p-5` (desktop) |
| Margin | `mb-3` between cards |
| Click target | Entire card navigates to `/problem/[slug]` |
| Border radius | `rounded-lg` |

### Element Styling

| Element | Desktop | Mobile |
|---------|---------|--------|
| Classification badge | `Badge` with type variant, `mb-2` | Same |
| Title | `text-lg font-semibold text-headers` | `text-base font-semibold` |
| Owner | `text-sm text-labels` | Same |
| State badges | `Badge` components, `gap-2`, `mt-1` | Same |
| Description | `text-sm text-body line-clamp-2`, `mt-2` | Same |
| Metadata row | `flex items-center gap-3 text-xs text-labels mt-3` | Same |
| Stars | `⭐` repeated for each star (or star count icon) | Same |
| Event chip | `text-xs bg-canvas px-2 py-0.5 rounded-full` | Same |

### State Badge Variants

Reuse existing `Badge` component variants:

| State | Variant | Example |
|-------|---------|---------|
| draft | `draft` | Gray background |
| submitted | `submitted` | Blue background |
| needs_changes | `needs_changes` | Yellow background |
| ready | `ready` | Green background |
| rejected | `rejected` | Red background |
| backlog | `backlog` | Gray outline |
| selected_for_event | `selected_for_event` | Green outline |
| selected_for_coding | `selected_for_coding` | Purple outline |
| deferred | `deferred` | Yellow outline |
| closed | `closed` | Gray solid |

---

## Filters — Detailed Design

### Desktop Filter Bar

```
┌──────────────────────────────────────────────────────────────┐
│ [All Readiness ▼] [All Actions ▼] [All Types ▼]             │
│ [All Locations ▼] [Newest First ▼]                Clear all │
└──────────────────────────────────────────────────────────────┘
```

Uses `ListFilterBar` component (Ch.26.17.3). Each filter is a native `<select>` or bits-ui Select.

### Mobile Filter Bar

Horizontal scrollable pill bar:

```
│ [All States] [All Actions] [All Types] [Loc…] [Sort…] │  ← overflow-x-auto
```

Tap a pill → opens native select or bottom sheet with options.

Active (non-default) pills styled: `border-primary text-primary font-medium`.

### Filter Configuration

```typescript
const filterConfig: FilterConfig[] = [
  {
    key: 'readiness',
    label: 'Readiness',
    options: [
      { value: 'all', label: 'All Readiness' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'needs_changes', label: 'Needs Changes' },
      { value: 'ready', label: 'Ready' },
      // Moderator-only:
      // { value: 'draft', label: 'Draft' },
      // { value: 'rejected', label: 'Rejected' },
    ],
    defaultValue: 'all',
  },
  {
    key: 'action',
    label: 'Action State',
    options: [
      { value: 'all', label: 'All Actions' },
      { value: 'backlog', label: 'Backlog' },
      { value: 'selected_for_event', label: 'Selected for Event' },
      { value: 'selected_for_coding', label: 'Selected for Coding' },
      { value: 'deferred', label: 'Deferred' },
      { value: 'closed', label: 'Closed' },
      // Moderator-only:
      // { value: 'dropped', label: 'Dropped' },
    ],
    defaultValue: 'all',
  },
  {
    key: 'type',
    label: 'Problem Type',
    options: [
      { value: 'all', label: 'All Types' },
      // Populated from problem_type_catalog:
      { value: 'explorative', label: 'Explorative' },
      { value: 'greenfield', label: 'Greenfield' },
      { value: 'advanced_greenfield', label: 'Advanced Greenfield' },
      { value: 'brownfield', label: 'Brownfield' },
      { value: 'reverse_engineering', label: 'Reverse Engineering' },
      { value: 'other', label: 'Other' },
    ],
    defaultValue: 'all',
  },
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
];

const sortConfig: FilterConfig = {
  key: 'sort',
  label: 'Sort',
  options: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_reviewed', label: 'Most Reviewed' },
    { value: 'alpha', label: 'Alphabetical' },
  ],
  defaultValue: 'newest',
};
```

### Moderator-Only Filters

When `role ∈ {moderator, admin}`, additional filter options are injected:

- **Readiness**: + "Draft", "Rejected"
- **Action**: + "Dropped"

These appear visually separated (thin divider) within the existing dropdowns, with a label prefix: "—— Moderator ——".

---

## Search — Detailed Design

### SearchBar Component

Uses `SearchBar` component (Ch.26.17.2):

```
Desktop:                                Mobile:
┌─────────────────────────┐            ┌──────────────────────────────┐
│ 🔍 Search problems… [×] │            │ 🔍 Search problems…     [×] │
└─────────────────────────┘            └──────────────────────────────┘
(right-aligned in header)              (full-width, below title)
```

| Property | Value |
|----------|-------|
| Placeholder | "Search problems…" |
| Debounce | 300ms |
| Min length | 2 characters |
| Search fields | problem title, description, owner display_name |
| URL param | `?search=query` |

### Search Behavior

1. User types "rate lim"
2. After 300ms of no further typing, search fires
3. URL updates to `/problems?search=rate+lim`
4. Server filters: `WHERE (title LIKE '%rate lim%' OR description LIKE '%rate lim%' OR display_name LIKE '%rate lim%') COLLATE NOCASE`
5. Results update in place, preserving active filters
6. Pagination resets to page 1
7. Results count updates: "3 problems matching 'rate lim'"

---

## Pagination — Detailed Design

### Desktop Pagination

Uses `Pagination` component (Ch.26.17.1):

```
Showing 21-40 of 47 problems    [◀ Prev] 1 [2] 3 [Next ▶]
```

### Mobile Pagination

```
[◀ Prev]   Page 2 of 3   [Next ▶]
```

### Configuration

| Property | Value |
|----------|-------|
| Page size | 20 (hardcoded, not user-configurable for MVP) |
| URL param | `?page=2` |
| Scroll behavior | On page change, scroll to top of problem list |

---

## Empty States

### No Results (filters active)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│           📋                                       │
│                                                    │
│   No problems match your current filters.          │
│                                                    │
│   Try adjusting your search or filters,            │
│   or [clear all filters].                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### No Problems Exist

```
┌────────────────────────────────────────────────────┐
│                                                    │
│           📋                                       │
│                                                    │
│   No problems have been submitted yet.             │
│   Be the first to create one!                      │
│                                                    │
│   [Create New Problem →]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Empty state styling**: Centered, `text-labels`, `py-16`, icon `text-4xl mb-4`.
**CTA button**: `Button variant="default"` linking to `/problem/new`.

---

## Data Requirements

### +page.server.ts

```typescript
export const load: PageServerLoad = async ({ url, cookies }) => {
  const user = await getAuthenticatedUser(cookies);
  if (!user) throw redirect(302, '/login');

  const page = parseInt(url.searchParams.get('page') || '1');
  const search = url.searchParams.get('search') || '';
  const readiness = url.searchParams.get('readiness') || 'all';
  const action = url.searchParams.get('action') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const location = url.searchParams.get('location') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';

  const isModerator = user.role === 'moderator' || user.role === 'admin';

  const result = await getProblemsBacklog({
    page,
    pageSize: 20,
    search,
    readiness,
    action,
    type,
    location,
    sort,
    includeDraft: isModerator && readiness === 'draft',
    includeRejected: isModerator && readiness === 'rejected',
    includeDropped: isModerator && action === 'dropped',
  });

  const problemTypes = await getActiveProblemTypes();
  const locations = await getLocations();

  return {
    problems: result.items,
    pagination: result.pagination,
    problemTypes,
    locations,
    filters: { readiness, action, type, location, sort, search },
    isModerator,
  };
};
```

### Response Shape

```typescript
interface ProblemBacklogItem {
  problem_id: string;
  slug: string;
  title: string;
  owner_display_name: string;
  readiness_state: string;
  action_state: string;
  problem_type: string;
  short_description: string;    // First 120 chars of description
  current_version: number;
  star_count: number;
  review_count: number;
  event_title: string | null;   // If selected for an event
  event_slug: string | null;
  created_at: string;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

---

## URL State Management

All state is encoded in URL query parameters:

```
/problems                                         ← Default: all problems, newest first, page 1
/problems?readiness=ready                         ← Filter by readiness
/problems?readiness=ready&type=greenfield         ← Multiple filters
/problems?search=rate+limiter                     ← Search
/problems?sort=most_reviewed&page=2               ← Sort + pagination
/problems?readiness=ready&type=greenfield&sort=newest&page=2&search=api  ← All combined
```

**Implementation**: Use SvelteKit's `goto()` with `replaceState: true` for filter changes, `pushState` for pagination, enabling back-button navigation through pages but not through every filter click.

---

## Accessibility

### Keyboard Navigation

- **Tab**: Search → filters → problem cards → pagination
- **Enter** on problem card: Navigate to problem detail
- **Enter** on filter: Open dropdown / activate
- **Arrow keys**: Navigate within dropdown options

### ARIA

- Page: `<main aria-label="Problem Backlog">`
- Search: `role="searchbox"`, `aria-label="Search problems"`
- Filter group: `role="group"`, `aria-label="Filters"`
- Problem list: `<ul role="list">`, items: `<li role="listitem">`
- Pagination: `<nav aria-label="Pagination">`
- Results count: `aria-live="polite"` (announces "X problems" on filter change)
- Empty state: `role="status"`

### Screen Reader

- Filter change: Announce "Filtered to X problems" via live region
- Search: Announce "X results for 'query'" after debounce completes
- Page change: Announce "Page X of Y" on navigation

---

## Performance

| Metric | Target |
|--------|--------|
| Initial page load | < 200ms server response |
| Filter/search response | < 150ms server response |
| Page navigation | < 100ms server response |
| Maximum per page | 20 items (server-enforced) |

### Optimization

- Server-side rendering (SSR) for initial load
- `COUNT(*)` query for total items (separate from data query for performance)
- Index on `readiness_state`, `action_state`, `problem_type` columns
- Description truncation in SQL (`SUBSTR(description, 1, 120)`) to reduce payload

---

## Testing Checklist

### Functional Tests

- [ ] Page loads with default filters (all, newest first, page 1)
- [ ] Search filters problems by title, description, owner name
- [ ] Search debounces (300ms)
- [ ] Search clears with × button
- [ ] Filter by readiness state works
- [ ] Filter by action state works
- [ ] Filter by problem type works
- [ ] Filter by location works
- [ ] Sort by newest/oldest/most reviewed/alphabetical works
- [ ] Filter change resets to page 1
- [ ] "Clear all" resets all filters to defaults
- [ ] Pagination navigates between pages
- [ ] URL updates with filter/search/page state
- [ ] Back button restores previous filter state
- [ ] Shared URL loads correct filtered view
- [ ] Problem card click navigates to /problem/[slug]
- [ ] Empty state shows when no problems match
- [ ] Empty state CTA links to /problem/new
- [ ] Moderator sees draft/rejected/dropped filter options
- [ ] Non-moderator does not see moderator-only filters
- [ ] Results count updates on filter change

### Responsive Tests

- [ ] Mobile (375px): Full-width search, scrollable pill filters
- [ ] Mobile: Cards full-width, stacked metadata
- [ ] Mobile: Simplified pagination (prev/next + page X of Y)
- [ ] Desktop (768px+): Inline dropdown filters, numbered pagination
- [ ] Desktop: Cards with more horizontal space
- [ ] Breakpoint transition smooth

### Accessibility Tests

- [ ] Keyboard navigation through all interactive elements
- [ ] Screen reader announces filter changes
- [ ] All form controls have labels
- [ ] Color not sole indicator (badges have text + color)
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Focus visible on all interactive elements

---

## Templates Used

| Component | Source |
|-----------|--------|
| Card | `ui/card` (elevation="resting") |
| Badge | `ui/badge` (state variants) |
| Button | `ui/button` (variant="default" for CTA) |
| SearchBar | `ui/SearchBar.svelte` (Ch.26.17.2) |
| ListFilterBar | `ui/ListFilterBar.svelte` (Ch.26.17.3) |
| Pagination | `ui/Pagination.svelte` (Ch.26.17.1) |
| PageContainer | `layout/PageContainer.svelte` |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-25
**Status**: Specification Complete
