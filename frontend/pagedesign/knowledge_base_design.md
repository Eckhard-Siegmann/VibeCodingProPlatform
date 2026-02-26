# Knowledge Base Page Design

**Route**: `/knowledge-base`
**Status**: New (TICKET-15)
**Created**: 2026-02-25
**Spec References**: Ch.4.2 (Lessons Learned Log), Ch.12.5 (Moderator Learnings), Ch.12.8 (Search), Ch.15.2.4 (Cross-Location Learning), Ch.19.3.29 (`lessons_learned`), Ch.19.3.30 (`lesson_category_catalog`)

---

## Overview

A global, searchable view of all lessons learned across the platform. Surfaces curated knowledge from past hackathon problems, filterable by category, event, location, and valuable flag. Supports the moderator wrap-up workflow (M20) and general knowledge discovery for all authenticated users.

**Access**: All authenticated users. Moderators can flag lessons as valuable.

---

## Page Layout

```
┌─────────────────────────────────┐  TopAppBar (fixed, z-50)
│ VibeCoding              [EH]   │  Brand + Avatar
├─────────────────────────────────┤
│                                 │
│  Knowledge Base                 │  Page title
│                                 │
│  [🔍 Search lessons...]        │  Text search input
│                                 │
│  Filters:                       │
│  [Category ▼] [Event ▼]        │  Dropdowns
│  [Location ▼] ☑ Valuable only  │  Location filter + toggle
│                                 │
│  ─── Results (24 lessons) ───  │  Count header
│                                 │
│  ┌─────────────────────────┐   │  LessonCard (reused)
│  │ [Architecture] Feb 3 •  │   │
│  │ Max Mustermann          │   │
│  │ @ VibeCoding Cologne    │   │
│  │                         │   │
│  │ "Using DSPy-style..."   │   │
│  │ #prompting #optimization│   │
│  │               [★ Value] │   │
│  │ → API Rate Limiter (v2) │   │  Problem link
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Gotcha] Jan 30 •       │   │
│  │ Eva Schmidt             │   │
│  │ ...                     │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤  BottomNavBar (fixed, z-50)
│ 🏠 Home  📅 Events  📋 Problems│
└─────────────────────────────────┘
```

---

## Components

### Page Container

**Component**: Reuses `layout/PageContainer.svelte`
**Title**: "Knowledge Base"
**Description subtitle**: "Lessons learned across the community"

### Search Input

**Position**: Top of content area, full width
**Placeholder**: "Search lessons..."
**Behavior**: Filters lessons by content text match (case-insensitive substring)
**Debounce**: 300ms after typing stops
**Clear**: "×" button when text is present

### Filter Bar

**Position**: Below search, horizontal row wrapping on mobile

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Category | `<select>` dropdown | All Categories, Tooling, Architecture, Process, Gotcha, Performance, Testing | All |
| Event | `<select>` dropdown | All Events, {list of events with lessons} | All |
| Location | `<select>` dropdown | All Locations, {list of locations} | All |
| Valuable only | Checkbox | Toggle | Unchecked |

**Styling**: Same filter pattern as `LessonsLearnedLog.svelte` — small dropdowns with `text-xs`, border, rounded.

### Results Header

**Format**: "Results ({N} lessons)" or "No lessons found" when empty.
**Sorted by**: `created_at DESC` (newest first).

### Lesson Card (Extended)

Reuses `LessonCard.svelte` with an additional **problem link** row:

```
→ {Problem Title} (v{major_version})
```

This links to `/problem/{public_slug}` so users can navigate to the source problem.

**Props extension**: Add optional `problemTitle`, `problemSlug`, `majorVersion` to the existing `Lesson` interface.

### Empty State

When no lessons exist or no results match filters:

```
💡
No lessons found
Lessons are captured after working on problems during events.
Try adjusting your filters or search terms.
```

---

## Data Loading

### Server Load (`+page.server.ts`)

```typescript
// Loads from lessons repository
const lessons = getGlobalLessons({
  search: url.searchParams.get('q'),
  category: url.searchParams.get('category'),
  eventId: url.searchParams.get('event'),
  locationId: url.searchParams.get('location'),
  valuableOnly: url.searchParams.get('valuable') === '1'
});

// Load filter options
const events = getEventsWithLessons();
const locations = getLocationsWithLessons();

return { lessons, events, locations, user };
```

### Query Pattern

```sql
SELECT
  ll.lesson_id, ll.content, ll.category, ll.tags, ll.valuable,
  ll.created_at, ll.edited_at,
  u.display_name AS author_name, u.user_id AS author_id,
  e.title AS event_name, e.event_id,
  p.public_slug AS problem_slug,
  pv.title AS problem_title, pv.major_version,
  l.city AS location_name, l.location_id
FROM lessons_learned ll
JOIN users u ON ll.user_id = u.user_id
JOIN problems p ON ll.problem_id = p.problem_id
JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
LEFT JOIN events e ON ll.event_id = e.event_id
LEFT JOIN rooms r ON e.room_id = r.room_id
LEFT JOIN locations l ON r.location_id = l.location_id
WHERE 1=1
  AND (? IS NULL OR ll.content LIKE '%' || ? || '%')
  AND (? IS NULL OR ll.category = ?)
  AND (? IS NULL OR ll.event_id = ?)
  AND (? IS NULL OR l.location_id = ?)
  AND (? = 0 OR ll.valuable = 1)
ORDER BY ll.created_at DESC
```

---

## Interactions

### Search

- Text input triggers filter on 300ms debounce
- Updates URL query params: `?q=...&category=...&event=...&location=...&valuable=1`
- Enables browser back/forward through filter states

### Flag Valuable (Moderator/Admin only)

- Same toggle as on Problem Card
- Calls `PATCH /api/problems/{problemId}/lessons/{lessonId}` with `{ valuable: true/false }`
- Optimistic UI update

### Navigate to Problem

- Clicking the problem link navigates to `/problem/{slug}`

---

## Role-Based Visibility

| Element | Observer | PO | Developer | Moderator | Admin |
|---------|----------|----|-----------|-----------|-------|
| View lessons | ✓ | ✓ | ✓ | ✓ | ✓ |
| Search/filter | ✓ | ✓ | ✓ | ✓ | ✓ |
| Flag valuable | — | — | — | ✓ | ✓ |

---

## Mobile Considerations

- Search input: Full width, 44px min-height touch target
- Filter dropdowns: Wrap to two rows on narrow screens
- Lesson cards: Full width with comfortable padding
- Scroll: Standard page scroll (no fixed-height container)

---

## Component Hierarchy

```
/knowledge-base/+page.svelte
├─ PageContainer
│  ├─ Search input
│  ├─ Filter bar (category, event, location, valuable)
│  ├─ Results header ("{N} lessons")
│  └─ {#each lessons}
│     └─ KnowledgeBaseCard (extends LessonCard with problem link)
│
└─ +page.server.ts (loads global lessons + filter options)
```

---

## API Dependencies

| Endpoint | Method | Purpose |
|----------|--------|---------|
| Page server load | GET | Load all lessons with filters |
| `/api/problems/[id]/lessons/[lessonId]` | PATCH | Toggle valuable flag |

---

## Relationship to Other Pages

- **Problem Card** (`/problem/[slug]`): Shows problem-scoped lessons in LessonsLearnedLog section. "Add Lesson" action lives there.
- **Moderator Dashboard** (`/dashboard/moderator`): "Learnings from Last Event" panel (Ch.12.5) is a subset focused on previous event context. Knowledge Base is the complete cross-event view.
- **Landing Page** (`/`): Could link to Knowledge Base as a community feature.
