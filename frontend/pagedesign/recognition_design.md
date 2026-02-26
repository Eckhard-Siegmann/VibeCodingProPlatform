# Recognition & Gamification Design

**Routes**: Embedded in `/dashboard` (participant), `/dashboard/moderator` (moderator), `/` (landing page)
**Status**: Specification for Ticket-14 implementation
**Created**: 2026-02-25
**Spec References**: Ch.33.6, Ch.17.9, Ch.12.9, Ch.19.3.35–19.3.42

---

## Overview

Three recognition surfaces:

1. **Contributor Wall** — public leaderboard on landing page (already implemented; needs real data)
2. **Personal Contribution Panel** — enhanced "Your Progress" card on participant dashboard
3. **Star Awards Panel** — moderator UI shown after review closure

Plus: **Milestone toast** delivery on qualifying actions.

---

## 1. Contributor Wall (`/`)

**Component**: `dashboard/ContributorWall.svelte` (already exists)
**Location**: Landing page, below event list sections
**Data source**: `contributor_wall_6week` SQLite view → `getTopContributors(10)`

### Layout (Mobile <640px)

```
┌─────────────────────────────────────┐
│ Top Contributors (Last 6 Weeks)     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🥇  Eva Schmidt                │ │  ← 1st place: gold gradient card
│ │       42 pts  ★★★  18 contrib  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ 🥈 Max M.     │ │ 🥉 Lisa C.   │ │  ← 2nd/3rd: side by side
│ │ 38 pts  ★★   │ │ 35 pts  ★    │ │
│ │ 15 contrib    │ │ 22 contrib   │ │
│ └───────────────┘ └───────────────┘ │
│                                     │
│  4  Tom Weber        31 pts  ★★    │  ← Ranks 4-10: flat list rows
│  5  Anna Müller      28 pts         │
│  6  Chris Lee        24 pts  ★     │
│  ...                                │
└─────────────────────────────────────┘
```

**Empty State** (no points yet): Wall is hidden entirely. The landing page omits the section when `data.topContributors.length === 0`.

**Implementation note**: Already implemented. This design doc records what was built.

---

## 2. Personal Contribution Panel (Participant Dashboard)

**Component**: New `dashboard/PersonalContributions.svelte`
**Location**: Participant dashboard sidebar (desktop), below My Problems section (mobile)
**Data source**: `getPersonalContributions(userId)` from recognition repository

### Layout

```
┌─────────────────────────────────────┐
│ Your Contributions                  │
│                                     │
│  24 pts       ★★★★★               │
│  all time     5 stars total         │
│                                     │
│  12 pts (last 6 weeks)              │
│                                     │
│  ─────────────────────────────────  │
│  Breakdown                          │
│                                     │
│  Review assessments    ████░  8 pts │
│  Valuable contributions ███░░  4 pts│
│  Problems submitted    ██░░░  3 pts │
│  Problems pitched      █░░░░  2 pts │
│  Problems coded        ███░░  3 pts │
│                                     │
│  ─────────────────────────────────  │
│  Recent Awards                      │
│                                     │
│  ★★★ 1st  API Rate Limiter         │
│           Feb 2026                  │
│                                     │
│  ★   3rd  CLI Parser                │
│           Jan 2026                  │
└─────────────────────────────────────┘
```

**Visual tokens**:
- Card elevation: `resting`
- Points display: `text-2xl font-bold text-headers`
- Stars: Rendered as filled star characters `★` in `text-pending` (yellow)
- "Last 6 weeks" note: `text-sm text-labels`
- Breakdown bars: Simple inline bar (CSS width proportional to max action total)
  - Bar color: `bg-primary` (blue), max 5 cells as visual segments
  - Text: action display_name + point count, `text-sm text-labels`
- Recent Awards: Star count as `★` prefix, problem name as link to `/problem/[slug]`, event + date in `text-xs text-labels`
- Section dividers: `border-t border-border`

**Empty State** (no contributions yet):
```
┌─────────────────────────────────────┐
│ Your Contributions                  │
│                                     │
│  No contributions yet.              │
│  Complete a review, submit a        │
│  problem, or join a team to earn    │
│  your first points.                 │
└─────────────────────────────────────┘
```

**Data shape** (from `getPersonalContributions`):
```typescript
interface PersonalContributions {
  allTimePoints: number;
  recentPoints: number;     // last 6 weeks
  allTimeStars: number;
  breakdown: Array<{
    actionKey: string;
    displayName: string;
    totalPoints: number;
  }>;
  recentAwards: Array<{
    place: number;
    starsAwarded: number;
    problemTitle: string;
    problemSlug: string;
    eventName: string;
    awardedAt: string;
  }>;
}
```

**Mobile behavior**: Full-width card, same layout. Awards list limited to 3 entries. "Show all" link not needed for MVP.

---

## 3. Star Awards Panel (Moderator Dashboard)

**Component**: New `dashboard/StarAwardsPanel.svelte`
**Location**: Moderator dashboard — shown as a full-width section when review assessments exist for the current event
**Visibility rule**: Shown when the current event has at least one `closed_for_review` decision (i.e., review phase ended)

### 3.1 Panel Anatomy

```
┌─────────────────────────────────────────────┐
│ ⭐ Star Awards                              │
│ VibeCoding Cologne — Feb 2026               │
│                                             │
│ Assign 1st, 2nd, 3rd to the top solutions. │
│ Rankings are suggested by review scores.    │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ RANK  PROBLEM             SCORE  AWARD      │
│                                             │
│  1    API Rate Limiter    4.2    [1st ▼]   │
│       Team: Max, Eva                        │
│                                             │
│  2    CLI Parser          3.8    [2nd ▼]   │
│       Team: Lisa, Tom                       │
│                                             │
│  3    Log Analyzer        3.5    [3rd ▼]   │
│       Team: Anna                            │
│                                             │
│  4    Auth Middleware     2.9    [None ▼]  │
│       Team: Chris                           │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ [Confirm Awards]   [Reset to Suggested]    │
└─────────────────────────────────────────────┘
```

**Already-awarded state** (awards confirmed):
```
┌─────────────────────────────────────────────┐
│ ⭐ Star Awards — Confirmed                  │
│ VibeCoding Cologne — Feb 2026               │
│                                             │
│  🥇 1st  API Rate Limiter — Max, Eva       │
│  🥈 2nd  CLI Parser — Lisa, Tom            │
│  🥉 3rd  Log Analyzer — Anna               │
│                                             │
│  Awarded by Eva Schmidt · Feb 25, 2026     │
└─────────────────────────────────────────────┘
```

### 3.2 Visual Tokens

- Panel card: `elevation="raised"` to stand out
- Header: `text-xl font-semibold text-headers` + event name in `text-sm text-labels`
- Instruction text: `text-sm text-labels italic`
- Score display: `font-mono text-sm` aligned right
- Award dropdown: Native `<select>` styled via shadcn-svelte Select (or simple `<select>`) with options: "1st place", "2nd place", "3rd place", "No award"
  - Constraint: Same place can't be assigned to two problems simultaneously (inline validation)
- Team members: `text-xs text-labels` below problem title
- Confirm button: `variant="default"` (blue), disabled until at least one award assigned and no conflicts
- Reset button: `variant="ghost"` — resets dropdowns to suggested ranking
- "No review data" state: shown when no weighted scores available
- Already-awarded medals: `🥇 🥈 🥉` with `text-lg` before problem title

### 3.3 Award Dropdown State Machine

```
Options per row:
  - "No award"     (default if below rank 3 or moderator clears it)
  - "1st place"    (disabled if already assigned to another problem)
  - "2nd place"    (disabled if already assigned to another problem)
  - "3rd place"    (disabled if already assigned to another problem)
```

**Validation before Confirm**:
- At least 1 award must be assigned
- No two problems may share the same place
- Confirm button shows inline error message if validation fails

### 3.4 Confirm Flow

1. Moderator clicks **[Confirm Awards]**
2. `ConfirmDialog` appears:
   ```
   Confirm Star Awards?

   ★★★ 1st: API Rate Limiter
   ★★  2nd: CLI Parser
   ★   3rd: Log Analyzer

   This cannot be undone.

   [Cancel] [Confirm]
   ```
3. On confirm: POST to `/api/events/[eventId]/star-awards`
4. All team members of each winning problem get a `star_awards` record
5. Success toast: "⭐ Star awards confirmed! Top contributors notified."
6. Panel transitions to "already-awarded" read-only state

### 3.5 Mobile Layout (<640px)

Each problem row becomes a compact card:

```
┌─────────────────────────────────────┐
│ ⭐ Star Awards                      │
│ VibeCoding Cologne — Feb 2026       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ #1  API Rate Limiter            │ │
│ │     Score: 4.2                  │ │
│ │     Team: Max, Eva              │ │
│ │     [Award: 1st place ▼]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ #2  CLI Parser                  │ │
│ │     Score: 3.8                  │ │
│ │     Team: Lisa, Tom             │ │
│ │     [Award: 2nd place ▼]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Confirm Awards]                    │
└─────────────────────────────────────┘
```

- Each problem: card with `elevation="resting"`, `p-3`
- Award select: full-width, 44px height (touch target)
- Confirm button: full-width, `size="lg"`

### 3.6 "No Review Data" State

When no review assessments exist for the event's coded problems:

```
┌─────────────────────────────────────┐
│ ⭐ Star Awards                      │
│                                     │
│ No review scores available yet.     │
│                                     │
│ Star awards can be confirmed once   │
│ at least one review assessment has  │
│ been closed for this event.         │
└─────────────────────────────────────┘
```

---

## 4. Milestone Toast Notifications

**Component**: Toast system (Ch.26.11.12) — `lib/stores/toast.ts` + `Toast.svelte`
**Trigger**: Server returns `milestone` field in API responses when a new milestone was just achieved

### Toast Specifications

Each milestone triggers a `success` variant toast (3s auto-dismiss):

| Milestone | Toast Title | Toast Message |
|-----------|-------------|---------------|
| `first_problem_submitted` | "First problem submitted!" | "Moderators will review soon." |
| `first_problem_accepted` | "Problem accepted!" | "Your problem is ready for pitching." |
| `first_assessment_completed` | "First rating submitted!" | "Your input shapes decisions." |
| `first_team_joined` | "You're on the team!" | "Check the chat to connect." |
| `first_event_attended` | "Welcome to the community!" | "Great to have you here." |
| `first_lesson_learned` | "Insight captured!" | "Others can learn from this." |
| `first_star_earned` | "First star earned!" | "Outstanding solution — well done." |

**First problem accepted**: Persists (no auto-dismiss) with manual close button.

### API Response Pattern

When a qualifying action completes, the server response includes an optional `milestones` array:

```json
{
  "success": true,
  "milestones": [
    {
      "key": "first_assessment_completed",
      "title": "First rating submitted!",
      "message": "Your input shapes decisions."
    }
  ]
}
```

The client-side code reads `milestones` from the response and fires `addToast()` for each one.

---

## 5. Integration Points

### Participant Dashboard — "Your Progress" Sidebar

**Before** (current): Simple card with "Assessments: N | Points: N | Stars: N"

**After** (this ticket): Replace with `PersonalContributions.svelte` which shows full breakdown.

**Location in `+page.svelte`**: Replace the "Your Progress" `Card` in the sidebar section (currently lines 262-285 of the dashboard).

### Moderator Dashboard — Star Awards Section

**Location**: Add `StarAwardsPanel.svelte` to the moderator dashboard after the "Review Results Summary" section (position 7 in the mobile layout priority order from `moderator_dashboard_design.md`).

**Visibility**: Only shown when current event has at least one review assessment that has been closed (`closed_for_review` decision exists).

**Data loading**: Add `reviewScores` and `existingStarAwards` to the moderator dashboard `+page.server.ts` loader.

---

## 6. Component List

| Component | File | Status |
|-----------|------|--------|
| `ContributorWall` | `dashboard/ContributorWall.svelte` | Exists |
| `PersonalContributions` | `dashboard/PersonalContributions.svelte` | New |
| `StarAwardsPanel` | `dashboard/StarAwardsPanel.svelte` | New |
| Toast system | `lib/stores/toast.ts` + `Toast.svelte` | Check if exists |

---

## 7. API Endpoints Required

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/api/events/[eventId]/review-scores` | Weighted scores per coded problem | Moderator |
| `POST` | `/api/events/[eventId]/star-awards` | Confirm star awards | Moderator |
| `GET` | `/api/events/[eventId]/star-awards` | Existing awards for event | Moderator |

---

## 8. Cross-Reference Compliance

- Spec: Ch.33.6.2 (public wall), Ch.33.6.3 (points), Ch.33.6.4 (stars), Ch.33.6.7 (personal)
- Spec: Ch.17.9 (star awards UI and flow)
- Spec: Ch.12.9 (contributor wall display)
- Data: Ch.19.3.35–19.3.42
- Templates: `ContributorWall` entry in `template_collection.md`
