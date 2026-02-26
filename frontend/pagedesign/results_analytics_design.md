# Results & Analytics Page Design

**Route**: `/assess/[id]/results`
**Purpose**: Display aggregated assessment results with filters and visualizations
**Components**: ResultsTable, BarChart, FilterBar, ImprovementPriorities
**Created**: 2026-02-05

---

## Overview

Results page shows assessment data aggregated by item with filtering by role, presence, and visualization options.

**Data Displayed**:
- Per-item statistics: N, Mean, SD, Min, Max
- Response distribution (via chart)
- Improvement priorities for Problem Owners
- Filter by role and attendance mode

---

## Page Layout

**Header Section**:
```
┌──────────────────────────────────────────┐
│ [← Back to Problem]                      │
│                                          │
│ Assessment Results                       │
│ API Rate Limiter - Pitch Assessment      │
│ [Closed] • 12 responses                  │
└──────────────────────────────────────────┘
```

**Filter Bar** (Desktop inline, Mobile bottom sheet):
```
┌──────────────────────────────────────────┐
│ Filters:                                 │
│ Role [All ▼] Location [All ▼] [Apply]   │
└──────────────────────────────────────────┘
```

**View Toggle**:
```
[Table] [Chart]  ← Tab selector
```

**Main Content** (Table View):
```
┌──────────────────────────────────────────────────────┐
│ Item             │  N │ Mean │  SD  │ Min │ Max │    │
├──────────────────┼────┼──────┼──────┼─────┼─────┤    │
│ Correctness      │ 12 │  4.2 │  0.8 │  3  │  5  │ ───│
│ Readability      │ 12 │  3.8 │  1.1 │  2  │  5  │ ───│
│ Test Support     │ 12 │  4.0 │  0.9 │  2  │  5  │ ───│
│ Simplicity       │ 12 │  3.5 │  1.2*│  1  │  5  │ ───│
│ ...              │    │      │      │     │     │    │
└──────────────────────────────────────────────────────┘

* High SD (>1.5) indicates disagreement
```

**Main Content** (Chart View):
```
┌──────────────────────────────────────────┐
│                                          │
│  5.0 ┤                                   │
│      │   ●                               │
│  4.0 ┤ ●   ●       ●                     │
│      │       ●   ●                       │
│  3.0 ┤         ●       ●                 │
│      │                   ●               │
│  2.0 ┤                                   │
│      │                                   │
│  1.0 ┼────────────────────────────────── │
│      Corr Read Test Simp Eleg Exte Comp │
│                                          │
└──────────────────────────────────────────┘
```

**Improvement Priorities** (Below main content):
```
┌──────────────────────────────────────────┐
│ Improvement Priorities                   │
│                                          │
│ 1. 🔴 Simplicity (3.5/5)                 │
│    High disagreement (SD 1.2). Consider  │
│    clarifying scope boundaries.          │
│                                          │
│ 2. 🟡 Readability (3.8/5)                │
│    Room for improvement. Add code        │
│    examples or structure explanation.    │
│                                          │
│ 3. 🟢 Correctness (4.2/5)                │
│    Strength! Maintain current approach.  │
└──────────────────────────────────────────┘
```

---

## Component Specifications

### ResultsTable

**Component**: `analytics/ResultsTable.svelte`
**Props**:
```typescript
interface Props {
  results: ItemResult[];  // N, mean, sd, min, max per item
  showTrend?: boolean;    // Optional sparkline column
  class?: string;
}

interface ItemResult {
  item_key: string;
  short_label: string;
  n: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
  trend?: number[];  // For sparkline
}
```

**Desktop**: HTML table with sortable columns
**Mobile**: Stacked cards per item

**Mobile Card Layout**:
```
┌────────────────────────────────────┐
│ Correctness                        │
│                                    │
│ Mean: 4.2  SD: 0.8  N: 12          │
│ Range: 3 - 5                       │
│                                    │
│ ─── [sparkline if trend] ───       │
└────────────────────────────────────┘
```

**Precision**:
- Mean: 1 decimal place (4.2)
- SD: 1 decimal place (0.8)
- N, Min, Max: Whole numbers

**Small-N Warning**:
- If N < 5: Asterisk (*) after N
- Footer note: "* Low response count, results may not be representative"

---

### BarChart

**Component**: `charts/BarChart.svelte`
**Props**:
```typescript
interface Props {
  labels: string[];        // Item short labels
  datasets: Dataset[];     // One or more series
  height?: number;         // Default 300px
  horizontal?: boolean;    // Default false (vertical bars)
  showLegend?: boolean;    // Default true
}

interface Dataset {
  label: string;           // "Mean Score"
  data: number[];          // Values per item
  backgroundColor?: string; // Optional custom color
}
```

**Usage Example** (Mean scores per item):
```typescript
<BarChart
  labels={results.map(r => r.short_label)}
  datasets={[{
    label: 'Mean Score',
    data: results.map(r => r.mean),
    backgroundColor: 'var(--color-primary)'
  }]}
  height={300}
/>
```

**Mobile**:
- Canvas scales to container width
- If many items (>10): Horizontal scroll
- Touch-friendly tooltips (tap to show)
- Legend below chart

**Desktop**:
- Full-width canvas
- Legend to the right
- Hover tooltips

---

### FilterBar Integration

**Desktop** (inline):
```
Filters: [Role: All ▼] [Location: All ▼] [Apply]
```

**Mobile** (bottom sheet):
```
[Filters (2 active)]  ← Button shows filter count

Tap opens bottom sheet:
┌────────────────────────────────────┐
│ Filters                     [×]    │
│                                    │
│ Role                               │
│ [All                       ▼]      │
│                                    │
│ Attendance Mode                    │
│ [All                       ▼]      │
│                                    │
│ ─────────────────────────────      │
│                                    │
│ [Reset]              [Apply (2)]   │
└────────────────────────────────────┘
```

**Filter Options**:

**Role** (7 options + All):
- All
- Observer
- Developer
- Coding Partner
- Problem Owner
- Moderator
- Administrator
- Agent

**Attendance Mode** (3 options):
- All
- In-Presence
- Remote

**Active Count**:
- Shows number of active filters: "Filters (2 active)"
- Resets to "Filters" when all = default

---

### ImprovementPriorities

**Component**: `analytics/ImprovementPriorities.svelte`
**Props**:
```typescript
interface Props {
  priorities: Priority[];
  maxScore?: number;  // Default 5
}

interface Priority {
  item: string;           // Short label
  score: number;          // Mean score
  level: 'needs_attention' | 'improvement' | 'strength';
  suggestion: string;     // Auto-generated or manual
}
```

**Thresholds** (Ch.15.4.5):
- Needs Attention (🔴): score < 3.0
- Room for Improvement (🟡): score 3.0-3.5
- Strength (🟢): score > 3.5

**Auto-Generated Suggestions**:
```typescript
if (item === 'clarity' && score < 3.0) {
  return "Reviewers found the description unclear. Add more context or examples.";
}
if (item === 'complexity' && score > 4.0) {
  return "This may be too complex for a single sprint. Consider splitting into phases.";
}
if (sd > 1.5) {
  return `High disagreement on ${item}. This might indicate ambiguity to address.`;
}
```

**Sort Order**: Needs attention first, then improvement, then strengths

**Mobile**: Vertical list, full-width cards
**Desktop**: Same (no grid, list is clearer)

---

## Responsive Behavior

### Mobile (<640px)

**Priority**:
1. Header + Back button
2. Filter button (count badge if active)
3. View toggle (Table/Chart tabs)
4. Main content (table as cards OR chart full-width)
5. Improvement priorities

**Table as Cards**:
- One card per item
- All stats visible in card
- Scrollable list
- Tap item → Expand to show distribution (future)

**Chart**:
- Full-width canvas
- Horizontal scroll if >10 items
- Tap bar → Show exact value tooltip
- Legend below chart

### Desktop (≥768px)

**Two-Column Option**:
- Left (70%): Table or chart
- Right (30%): Improvement priorities sidebar

**Or Single Column**:
- Full-width table/chart
- Improvement priorities below

---

## Data Loading

**+page.server.ts**:
```typescript
export const load: PageServerLoad = async ({ params, url }) => {
  const { id } = params;

  // Get assessment details
  const assessment = await getAssessmentById(id);

  // Get aggregated results
  const results = await getAggregatedResults(id);

  // Get filter options from query params
  const roleFilter = url.searchParams.get('role');
  const presenceFilter = url.searchParams.get('presence');

  // Apply filters if present
  const filteredResults = applyFilters(results, { role: roleFilter, presence: presenceFilter });

  return {
    assessment,
    results: filteredResults,
    allResults: results,  // For comparison
    filters: { role: roleFilter, presence: presenceFilter }
  };
};
```

**Filter Application**:
- Via URL query params: `/assess/{id}/results?role=developer&presence=in_presence`
- Allows bookmarking filtered views
- Back button preserves filters

---

## Chart Configuration

**Chart.js Options** (BarChart):
```typescript
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: isMobile ? 'bottom' : 'right'
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: maxScore,
      ticks: {
        stepSize: 1
      }
    }
  }
}
```

**Touch Tooltips**:
- On mobile: Tap bar to show tooltip
- Tooltip persists until tap elsewhere
- Not hover-only (doesn't work on touch)

---

## Empty State

**No Results**:
```
No results available yet.

Results will appear after the assessment closes
and participants have submitted their ratings.

Minimum 3 responses needed for statistics.
```

**Low Response Count** (N < 3):
```
⚠️ Only {N} responses

Statistics may not be representative with few responses.
Encourage more participants to complete the assessment.
```

---

## CSV Export Button (Admin-Only)

**Spec Reference**: Ch.15.3.4 (Export and Downstream Use), A17

**Visibility**: Only users with `admin` role see the Download CSV button.

**Position**: In the filter/toolbar area, right-aligned, alongside the view toggle.

**Layout**:
```
┌──────────────────────────────────────────┐
│ Filters:                                 │
│ Role [All ▼] Location [All ▼] [Apply]   │
│                         [📥 CSV] [Table][Chart] │
└──────────────────────────────────────────┘
```

**Behavior**:
- Click generates CSV **client-side** from the currently displayed filtered data
- No separate API endpoint required
- Includes all columns visible in the current filtered view
- UTF-8 BOM prepended for Excel compatibility
- Filename: `rating_results_{ISO_date}.csv` (e.g., `rating_results_2026-02-25.csv`)

**CSV Columns**:
```
Item,N,Mean,SD,Min,Max
Correctness,12,4.2,0.8,3,5
Readability,12,3.8,1.1,2,5
...
```

**Button Styling**:
```
<Button variant="outline" size="sm">
  <Download class="w-4 h-4 mr-1" />
  CSV
</Button>
```

**Mobile**: Button in filter bar, same row as view toggle.

---

## Scalable List Considerations (Ch.12.10)

### Per-Item Results Table — Bounded, No Pagination

The ResultsTable displays per-item aggregated statistics. Item count is bounded by the inventory definition (currently 6 core quality dimensions + 2 meta items = 8 items). This is a fixed, small set determined by the inventory structure, not by user data volume.

**No pagination** is needed. The full item set is always loaded and displayed. Even with future inventory expansion, items are expected to remain under 20 — well within a single-page view.

### Contributor Wall / Leaderboard — Explicit Limits

The Contributor Wall (visible on the landing page `/`, specified in `recognition_design.md`) and any per-event leaderboard views display ranked user lists that can grow with the community.

**Limits**:
- **Landing page Contributor Wall**: `LIMIT 10` (top 10 contributors, last 6 weeks). Already bounded by `getTopContributors(10)`. No pagination — the wall is a curated highlight, not a complete ranking.
- **Event-level leaderboard** (if displayed in results context): `LIMIT 100` with "Load More" appending 50 more. Server query: `ORDER BY total_points DESC LIMIT ? OFFSET ?`
- **Community-wide full ranking** (future): Must use the standard scalable list view pattern (Ch.12.10) with `Pagination.svelte`, `SearchBar.svelte`, and `ListFilterBar.svelte` (filter by location, event, time range).

### Historical Event Results Tables — Scalable List View

When displaying results across multiple events (e.g., "How did this problem score at previous events?" or "All events at this location"), the data set is potentially unbounded.

**Pattern**: Standard scalable list view (Ch.12.10):
- Server-side pagination: 20 rows per page, `Pagination.svelte` for navigation
- SearchBar: Filter by problem title, event name, or author
- ListFilterBar: Filter by location, time range, problem type
- URL state: `?location=cologne&page=2&search=api` for shareable views
- Sort: By event date (default newest first), or by score

**Data shape** (per row in a historical results table):
```typescript
{
  event_title: string,
  event_date: string,
  location_name: string,
  problem_title: string,
  assessment_type: 'pitch' | 'review',
  response_count: number,
  weighted_average: number,
  rank: number | null  // null for pitch (no ranking)
}
```

**Implementation note**: Historical event tables are a future enhancement beyond MVP scope. This specification ensures the pattern is defined when implementation begins.

---

## Testing Checklist

- [ ] Page loads with assessment data
- [ ] Results table displays all items
- [ ] Statistics calculated correctly (N, mean, SD, min, max)
- [ ] Precision: 1 decimal for mean/SD
- [ ] Small-N warning shows when N < 5
- [ ] High-SD warning shows when SD > 1.5
- [ ] Bar chart renders correctly
- [ ] Chart uses problem color palette (if multi-series)
- [ ] Chart tooltips work on mobile (tap)
- [ ] Chart legend position: bottom (mobile), right (desktop)
- [ ] View toggle switches between table and chart
- [ ] Filter bar shows on desktop
- [ ] Filter button shows on mobile
- [ ] Bottom sheet opens with filters
- [ ] Filters apply correctly
- [ ] URL updates with filter params
- [ ] Bookmarked URL preserves filters
- [ ] Improvement priorities generate correctly
- [ ] Priority levels color-coded (red/yellow/green)
- [ ] Suggestions contextual and helpful
- [ ] Empty state shows when no results
- [ ] Low response warning shows
- [ ] Back button navigates to problem card
- [ ] Mobile: All content accessible at 375px
- [ ] Mobile: Charts scrollable if wide
- [ ] Mobile: Table transforms to cards
- [ ] Desktop: Full table visible
- [ ] CSV button visible only for admin users
- [ ] CSV button hidden for non-admin users
- [ ] CSV download generates valid CSV file
- [ ] CSV filename follows convention (rating_results_YYYY-MM-DD.csv)
- [ ] CSV has UTF-8 BOM for Excel compatibility
- [ ] CSV includes all visible columns from current filtered view
- [ ] CSV values properly escaped (commas, quotes)
- [ ] Accessibility: All data announced to screen readers

---

**Document Version**: 1.1.0
**Lines**: ~400
**Status**: Complete
**Changelog**:
- v1.1.0 (2026-02-25): Added "Scalable List Considerations" section — explicit limits for Contributor Wall/leaderboard (LIMIT 10/100), historical event results table pattern (Ch.12.10 scalable list view), confirmation that per-item results are bounded and need no pagination
- v1.0.0: Initial specification (CSV export button added for TICKET-23)
