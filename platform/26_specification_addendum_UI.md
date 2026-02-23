# 26. Specification Addendum: Rating UI Requirements

This addendum captures user interface requirements for the assessment/survey system, established through design discussion on 2026-01-29. These findings extend the base specification (Chapters 12-15) with concrete implementation requirements for rating input components.

---

## Problem Statement

The base specification defines Items, Inventories, and Assessments conceptually (Chapters 7-9) and describes UI views at a functional level (Chapters 12-15). However, the concrete visual and interaction patterns for rating inputs—especially responsive behavior across device sizes—remain underspecified.

## Objective

Produce implementation-ready requirements for:
- Rating input components for different scale sizes
- Responsive layouts for mobile (vertical) and desktop (wide) viewports
- Accessibility compliance (WCAG 2.1 AA)
- Tech stack selection

---

## 26.1 Scale Type → UI Pattern Mapping

| `max_rating` | UI Pattern | Rationale |
|--------------|------------|-----------|
| 1, 2, 3, 5, 7 | **Button scale** | Discrete choices with semantic labels; higher accessibility |
| 10 | **Continuous slider** | Anti-anchoring for pre/post intrapersonal testing |

### Design Decision: Continuous Slider for 10-Point Scales

**Rationale**: For longitudinal assessments (e.g., pitch vs. review, pre/post comparisons), a continuous slider prevents anchoring bias. Users cannot easily recall their previous numeric selection because they only see position, not number. This improves validity of intrapersonal pre/post testing.

Research basis:
- [MeasuringU](https://measuringu.com/uxlite-numeric-slider-desktop-mobile/): No significant difference in mean scores between 5-point scales and sliders
- [NN/g](https://www.nngroup.com/articles/gui-slider-controls/): Sliders work when "specific value does not matter...approximate is good enough"

---

## 26.2 Slider Behavior Requirements

### 26.2.1 Value Display: Never Show Number

**Requirement**: The slider MUST NOT display numeric values to the user at any point—before, during, or after interaction.

| Property | Specification |
|----------|---------------|
| Numeric display | Never shown |
| Tick marks | None |
| Labels | Endpoint labels only (`label_min`, `label_max` from Item definition) |
| Stored value | Backend maps continuous position to integer 1-10 |

**Rationale**: Prevents recall/anchoring bias in longitudinal assessments. Users see only relative position on the scale.

### 26.2.2 Slider Interaction States

| State | Visual Appearance | Data State |
|-------|-------------------|------------|
| **Untouched** | Thumb centered at midpoint, 50% opacity, dashed track | `null` (not submitted) |
| **Touched/Dragging** | Thumb follows input, full opacity, solid track | Pending value |
| **Released** | Thumb at final position, subtle confirmation animation | Integer 1-10 stored |
| **Re-editing** | Can drag again while assessment is open | Supersedes previous |

### 26.2.3 Slider Initial State

- Thumb starts at **center position** (neutral)
- Item is considered **unanswered** until user moves the slider
- First touch/drag activates the item

---

## 26.3 Skip Behavior: Implicit

**Requirement**: Unanswered items are automatically skipped. No explicit "Skip" button is required.

| Behavior | Specification |
|----------|---------------|
| Untouched slider | No `responses` row created |
| Untouched button scale | No `responses` row created |
| Explicit skip button | Not provided |
| Form submission | Only touched items are submitted |

**Rationale**: Reduces cognitive load and UI clutter. Aligns with Chapter 9.1 specification: "Skipping an Item produces no response (no row in responses table)."

---

## 26.4 Backend-Prepared Assessment Render Structure

**NEW: Backend owns all scale logic and consistency checking. Frontend is a stateless renderer.**

### 26.4.1 Assessment Render Endpoint

The frontend does **not** fetch raw items. Instead, it calls:

```
GET /api/assessments/{assessmentId}/render-structure
```

**Response Structure (MVP: all items same scale):**
```json
{
  "assessment_id": "abc-123",
  "inventory_key": "review_assessment",
  "render_type": "single_matrix",
  "matrix": {
    "max_rating": 5,
    "common_headers": [
      { "rating_value": 1, "label": "Poor" },
      { "rating_value": 2, "label": "Fair" },
      { "rating_value": 3, "label": "Good" },
      { "rating_value": 4, "label": "Very Good" },
      { "rating_value": 5, "label": "Excellent" }
    ],
    "rows": [
      {
        "position_index": 1,
        "item_id": "uuid-1",
        "item_key": "correctness",
        "short_label": "Correctness",
        "full_text": "How would you rate the correctness of this solution?",
        "max_rating": 5,
        "current_rating": null
      },
      // ... 17 more items (all 18 items with max_rating=5)
    ]
  }
}
```

**Response Structure (Future: mixed scales):**
```json
{
  "assessment_id": "abc-456",
  "inventory_key": "review_assessment_v2",
  "render_type": "mixed_matrices",
  "matrices": [
    {
      "description": "Quality Assessment (5-point)",
      "render_mode": "matrix",
      "max_rating": 5,
      "common_headers": [...],
      "rows": [/* 17 items with max_rating=5 */]
    },
    {
      "description": "Cognitive Load (slider)",
      "render_mode": "slider",
      "max_rating": 7,
      "common_headers": [
        { "rating_value": 1, "label": "Very demanding" },
        { "rating_value": 4, "label": "Neutral" },
        { "rating_value": 7, "label": "Effortless" }
      ],
      "rows": [
        {
          "position_index": 9,
          "item_id": "uuid-9-v2",
          "item_key": "cognitive_ease",
          "short_label": "Cognitive Ease",
          "max_rating": 7,
          "current_rating": null
        }
      ]
    }
  ]
}
```

### 26.4.2 Backend Scale Consistency Logic

The backend:
1. Fetches all items in the inventory (with active versions only)
2. Extracts scale signature from each: `(max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max)`
3. Groups items by signature
4. Returns a single JSON object describing the render strategy

**If all items have identical scale**: `render_type: "single_matrix"` → Frontend renders one table
**If items have different scales**: `render_type: "mixed_matrices"` → Frontend renders multiple sections

### 26.4.3 Frontend Rendering (Stateless)

```svelte
<!-- AssessmentForm.svelte -->
<script>
  let structure = await fetch(`/api/assessments/${assessmentId}/render-structure`)
    .then(r => r.json());
</script>

{#if structure.render_type === 'single_matrix'}
  <MatrixTable matrix={structure.matrix} />
{:else if structure.render_type === 'mixed_matrices'}
  <div>
    {#each structure.matrices as matrix}
      {#if matrix.render_mode === 'matrix'}
        <MatrixTable {matrix} />
      {:else if matrix.render_mode === 'slider'}
        <SliderSection {matrix} />
      {:else if matrix.render_mode === 'binary_choice'}
        <BinaryChoiceSection {matrix} />
      {/if}
    {/each}
  </div>
{/if}
```

The frontend contains **no scale logic**—only conditional rendering based on `render_mode`.

### 26.4.4 Benefits

- **Scale consistency validated once at backend** → No repeated checks in UI
- **Frontend is dumb** → No business logic, just presentation
- **Future scales automatic** → New scale (7-point, slider, binary) automatically supported
- **Clean API** → One endpoint returns everything needed for one assessment

---

## 26.5 Button Scale Requirements

### 26.5.1 Button Scale Interaction States

| State | Visual Appearance | Data State |
|-------|-------------------|------------|
| **Untouched** | All buttons outlined/hollow, no selection | `null` (not submitted) |
| **Selected** | One button filled/highlighted | Integer value stored |
| **Changed** | Previous deselects, new selects | Supersedes previous |

### 26.5.2 Label Display

| `max_rating` | Label Strategy |
|--------------|----------------|
| 5 | All 5 labels displayed: `label_min`, `label_low_mid`, `label_mid`, `label_high_mid`, `label_max` |
| 3 | 3 labels: `label_min`, `label_mid`, `label_max` |
| 7 | 3 labels at endpoints and center: `label_min`, `label_mid`, `label_max` |

---

## 26.6 Accessibility Requirements

### 26.6.1 Touch Targets

| Requirement | Specification | Source |
|-------------|---------------|--------|
| Minimum size | 44×44 CSS pixels | WCAG 2.1 Target Size |
| Minimum gap | 16px between adjacent buttons | UX best practice |

### 26.6.2 Keyboard Navigation

**Button Scale:**
- `Tab`: Focus next/previous item
- `Arrow Left/Right`: Move selection within scale
- `Enter` or `Space`: Confirm selection (for non-immediate selection mode)

**Slider:**
- `Arrow Left/Right`: Move by ±0.5 (continuous feel)
- `Home`: Jump to minimum
- `End`: Jump to maximum
- `Tab`: Focus next/previous item

### 26.6.3 ARIA Requirements

**Button Scale:**
```html
<div role="radiogroup" aria-label="{item.short_label}">
  <button role="radio" aria-checked="{selected === 1}" aria-label="{label_min}">
    {label_min}
  </button>
  <!-- ... -->
</div>
```

**Continuous Slider:**
```html
<div
  role="slider"
  aria-label="{item.short_label}"
  aria-valuemin="1"
  aria-valuemax="10"
  aria-valuenow="{currentValue}"
  aria-valuetext="{valueText}"
  tabindex="0"
/>
```

Where `valueText` provides semantic context:
- 1-3: "Low"
- 4-6: "Medium"
- 7-10: "High"

### 26.6.4 Visual Requirements

| Requirement | Specification |
|-------------|---------------|
| Focus ring | Visible on all interactive elements |
| Color contrast | ≥ 4.5:1 ratio (WCAG AA) |
| Motion | Respect `prefers-reduced-motion` |

---

## 26.7 Responsive Layout Requirements

### 26.7.1 Breakpoints

| Breakpoint | Width | Layout Strategy |
|------------|-------|-----------------|
| Default (mobile) | < 640px | Vertical stack, full-width items |
| `sm` | ≥ 640px | Landscape phone adjustments |
| `md` | ≥ 768px | Side-by-side label + control |
| `lg` | ≥ 1024px | Multi-column overview possible |

### 26.7.2 Mobile Layout (< 640px)

**Button Scale (5-point example):**
```
┌─────────────────────────────┐
│ Correctness                 │
│ The solution meets stated   │
│ requirements (including     │
│ edge cases) and behaves as  │
│ intended.                   │
│                             │
│ ┌─────────────────────────┐ │
│ │ ○  Incorrect/misleading │ │
│ ├─────────────────────────┤ │
│ │ ○  Partly correct       │ │
│ ├─────────────────────────┤ │
│ │ ○  Mostly correct       │ │
│ ├─────────────────────────┤ │
│ │ ○  Minor issues         │ │
│ ├─────────────────────────┤ │
│ │ ○  Fully correct        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

- Vertical stack of tappable rows
- Each row is full-width, minimum 48px height
- Short labels (use `short_label` or abbreviated `label_*`)

**Continuous Slider (10-point):**
```
┌─────────────────────────────┐
│ Cognitive Load              │
│                             │
│ How mentally demanding was  │
│ it to follow, supervise,    │
│ and validate the process?   │
│                             │
│ Very low    ───    Very high│
│    ●━━━━━━━━━━━━━━━━━━━━○   │
└─────────────────────────────┘
```

- Full-width slider track
- Endpoint labels above or beside track
- Sufficient padding for thumb manipulation

### 26.7.3 Desktop Layout (≥ 768px)

**Button Scale (5-point example):**
```
┌─────────────────────────────────────────────────────────────┐
│  Correctness: The solution meets the stated requirements... │
│                                                             │
│  ○ Incorrect    ○ Partly     ○ Mostly    ○ Minor    ○ Fully │
│    /misleading    correct      correct     issues     correct│
└─────────────────────────────────────────────────────────────┘
```

- Horizontal row of radio buttons
- Labels below each button
- Full text labels visible

**Continuous Slider (10-point):**
```
┌─────────────────────────────────────────────────────────────┐
│  Cognitive Load: How mentally demanding was it to follow,   │
│  supervise, and validate the process?                       │
│                                                             │
│  Very low load                            Extremely high    │
│      ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○    │
└─────────────────────────────────────────────────────────────┘
```

- Question text on single line or two lines
- Full endpoint labels
- Wide slider track for precision

---

## 26.8 Tech Stack Decision

**Decision: SvelteKit 2.x + Tailwind CSS 4.x**

This updates the tech stack decision from Chapter 25 (Next.js 14 + shadcn/ui) based on further evaluation.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **SvelteKit 2.x** | Lighter weight, excellent DX, built-in SSR, growing ecosystem |
| Styling | **Tailwind CSS 4.x** | Utility-first, responsive breakpoints (`sm:`, `md:`, `lg:`) |
| Accessible primitives | **Melt UI** or **Bits UI** | Headless components for Svelte with full ARIA support |
| Form handling | **Superforms + Zod** | Progressive enhancement, validation |
| Database | SQLite (dev) → PostgreSQL (prod) | Per Chapter 25 |
| ORM | **Drizzle** or **Kysely** | Type-safe queries, works with both databases |

### 26.8.1 Component Architecture

```
src/lib/components/
├── rating/
│   ├── RatingItem.svelte        # Dispatcher: selects scale type by max_rating
│   ├── ButtonScale.svelte       # max_rating ≤ 7
│   ├── ContinuousSlider.svelte  # max_rating = 10
│   └── ScaleLabel.svelte        # Endpoint label component
├── assessment/
│   ├── AssessmentForm.svelte    # Full inventory form
│   ├── ItemCard.svelte          # Card wrapper per item
│   └── ProgressIndicator.svelte # Items answered / total
└── ui/
    ├── Button.svelte
    └── Card.svelte
```

### 26.8.2 Scale Selection Logic

```svelte
<!-- RatingItem.svelte -->
{#if item.max_rating <= 7}
  <ButtonScale {item} bind:value />
{:else}
  <ContinuousSlider {item} bind:value />
{/if}
```

---

## 26.9 Data Flow

1. **Render**: Fetch inventory → items via `item_key` → resolve to active `item_id`
2. **Capture**: User interacts → local Svelte store updates
3. **Submit**: Form action → validate → INSERT into `responses` table
4. **Supersession**: If re-rating while assessment open, previous response marked `superseded_at`

---

## 26.10 Open Considerations

| Topic | Status | Notes |
|-------|--------|-------|
| Haptic feedback on slider | Deferred | Consider for native mobile apps |
| Progress indicator | Consider | "X of Y items answered" may improve completion rates |
| Undo for accidental slider touch | Deferred | Users can re-drag to adjust |
| Offline support | Future | Service worker + local storage for resilience |

---

## Relationship to Base Specification

This addendum **extends** Chapters 12-15 (UI specifications) with concrete implementation requirements:

- Chapter 12 (Dashboards): Unaffected
- Chapter 13 (Problem Card UI): Rating components used within assessment sections
- Chapter 14 (Live Interaction Modes): Rating inputs used in Pitch and Review modes
- Chapter 15 (Results & Analytics): Aggregations operate on integer values stored by these components

This addendum **updates** Chapter 25 (Tech Stack Decision):
- Original: Next.js 14 + shadcn/ui
- Updated: SvelteKit 2.x + Tailwind CSS + Melt UI

---

## 26.11 Component System: shadcn-svelte

**Added 2026-02-04**: The platform uses a shadcn-svelte inspired component architecture built on bits-ui primitives with custom styling that aligns with the design system.

### 26.11.1 Architecture Overview

```
src/lib/
├── utils.ts                    # cn() utility (clsx + tailwind-merge)
├── components/
│   ├── ui/                     # Primitive components (shadcn-style)
│   │   ├── card/               # Card family
│   │   │   ├── card.svelte
│   │   │   ├── card-header.svelte
│   │   │   ├── card-title.svelte
│   │   │   ├── card-content.svelte
│   │   │   ├── card-footer.svelte
│   │   │   └── index.ts        # Barrel export
│   │   ├── badge/              # Badge component
│   │   │   ├── badge.svelte
│   │   │   └── index.ts
│   │   ├── button/             # Button component
│   │   │   ├── button.svelte
│   │   │   └── index.ts
│   │   ├── alert-dialog/       # AlertDialog (bits-ui based)
│   │   │   ├── alert-dialog-*.svelte
│   │   │   └── index.ts
│   │   ├── ConfirmDialog.svelte    # High-level confirmation modal
│   │   ├── LoadingSpinner.svelte   # Loading indicator
│   │   └── Separator.svelte        # DEPRECATED: Use spacing + shadows
│   ├── layout/                 # Page layout components
│   ├── rating/                 # Rating scale components
│   ├── assessment/             # Assessment form components
│   └── problem/                # Problem Card components
```

### 26.11.2 Import Pattern

Components use barrel exports with named imports:

```svelte
<!-- Preferred: Named imports from index -->
import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';

<!-- High-level components: Direct import -->
import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
```

### 26.11.3 Card Component

The Card provides visual containment with configurable elevation (depth via shadows) and padding.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elevation` | `'flat' \| 'resting' \| 'raised' \| 'floating'` | `'resting'` | Shadow depth |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `class` | `string` | - | Additional CSS classes |

**Elevation mapping:**
- `flat`: No shadow (inline with parent)
- `resting`: `--shadow-card` — Default card appearance
- `raised`: `--shadow-md` — Slightly elevated (hover states)
- `floating`: `--shadow-floating` — Modals, dialogs, popovers

**Cards-on-card pattern**: Use `elevation="resting"` for nested cards within a page container. The shadow provides visual depth without separators.

### 26.11.4 Badge Component

Badges display status indicators with semantic color variants.

**Generic variants:**
- `default` — Primary blue background
- `secondary` — Gray background
- `outline` — Border only
- `destructive` — Red/alert background

**Readiness state variants** (per Chapter 5):
| Variant | Visual | Use case |
|---------|--------|----------|
| `draft` | Gray | Problem in draft state |
| `submitted` | Amber | Awaiting review |
| `needs_changes` | Orange | Moderator requested changes |
| `ready` | Green | Passed quality gate |
| `rejected` | Red | Did not pass quality gate |

**Action state variants** (per Chapter 5):
| Variant | Visual | Use case |
|---------|--------|----------|
| `backlog` | Gray | In community backlog |
| `selected_for_event` | Blue | Selected for upcoming event |
| `selected_for_coding` | Purple | Currently being coded |
| `deferred` | Orange | Postponed to future event |
| `dropped` | Red | Removed from consideration |
| `closed` | Green | Completed |

**Usage:**
```svelte
<Badge variant="ready">Ready</Badge>
<Badge variant="selected_for_event">Selected for Event</Badge>
```

### 26.11.5 Button Component

Buttons provide interactive actions with consistent sizing and visual hierarchy.

**Variants:**
- `default` — Primary action (blue fill)
- `secondary` — Secondary action (gray fill with border)
- `ghost` — Tertiary action (transparent, hover shows background)
- `destructive` — Dangerous action (red fill)
- `outline` — Bordered without fill
- `link` — Text-only with underline on hover

**Sizes:**
- `sm` — 36px min-height, compact
- `md` — 44px min-height, default (WCAG touch target)
- `lg` — 52px min-height, prominent actions
- `icon` — 40x40px square for icon-only buttons

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | See above | `'default'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Size preset |
| `fullWidth` | `boolean` | `false` | Expand to container width |
| `disabled` | `boolean` | `false` | Disable interaction |

### 26.11.6 AlertDialog Component

AlertDialog provides accessible modal dialogs for confirmations and alerts. Built on bits-ui primitives with custom styling.

**Sub-components:**
- `AlertDialog` — Root controller (from bits-ui)
- `AlertDialogTrigger` — Trigger button (from bits-ui)
- `AlertDialogContent` — Modal container with overlay
- `AlertDialogHeader` — Title + description container
- `AlertDialogTitle` — Modal title
- `AlertDialogDescription` — Modal description text
- `AlertDialogFooter` — Action buttons container
- `AlertDialogAction` — Confirm button
- `AlertDialogCancel` — Cancel button

**High-level wrapper**: `ConfirmDialog.svelte` provides a simplified API:
```svelte
<ConfirmDialog
  bind:open={showConfirm}
  title="Confirm Action"
  message="Are you sure?"
  confirmLabel="Yes"
  cancelLabel="No"
  variant="default" <!-- or "danger" -->
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### 26.11.7 Visual Design Principles

**Shadows for depth, not separators**: The design system uses shadow elevation to establish visual hierarchy rather than separator lines. This creates a cleaner, more modern appearance.

**Spacing rhythm**: Consistent `space-y-4` or `space-y-6` between sections provides visual breathing room.

**Color tokens**: All components use CSS custom properties defined in `app.css`:
- `--color-card`, `--color-canvas`, `--color-viewport` — Background layers
- `--color-primary`, `--color-primary-hover` — Interactive elements
- `--color-headers`, `--color-labels`, `--color-meta` — Typography
- `--color-success`, `--color-alert`, `--color-warning`, `--color-pending` — Status

### 26.11.8 cn() Utility

The `cn()` utility merges CSS classes with Tailwind conflict resolution:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage in components:
```svelte
<div class={cn('base-class', condition && 'conditional-class', className)}>
```

### 26.11.9 Dependencies

| Package | Purpose |
|---------|---------|
| `bits-ui` | Headless accessible primitives (AlertDialog, etc.) |
| `clsx` | Conditional class joining |
| `tailwind-merge` | Tailwind class conflict resolution |
| `@lucide/svelte` | Icon library |

---

## Sources

- [NN/g: Slider Design Rules of Thumb](https://www.nngroup.com/articles/gui-slider-controls/)
- [Smashing Magazine: Designing the Perfect Slider](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- [MeasuringU: Sliders vs Numeric Scales](https://measuringu.com/uxlite-numeric-slider-desktop-mobile/)
- [Baymard: Slider Interface Requirements](https://baymard.com/blog/slider-interfaces/)
- [IxDF: Rating Scales in UX Research](https://www.interaction-design.org/literature/article/rating-scales-for-ux-research)
- [Material Design 3: Slider Accessibility](https://m3.material.io/components/sliders/accessibility)
- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/)
- [bits-ui Documentation](https://www.bits-ui.com/)

### 26.11.10 Dialog System

**Added 2026-02-05**: Three distinct dialog templates for different use cases (Decision #1 from template design session).

**ConfirmDialog** (existing): Simple yes/no decisions
- Usage: Delete, drop, close, destructive actions
- Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `variant` (default/danger)
- Already implemented at `ui/ConfirmDialog.svelte`
- Mobile: Full-screen on <640px, modal on larger screens

**FormDialog** (NEW): Dialogs with form inputs
- Usage: Add resource, assign deputy, add lesson, create event
- Props: `title`, `fields[]`, `onSubmit`, `onCancel`, `submitLabel`
- Contains form inputs (text, textarea, select, etc.) passed as fields array
- Validation before submission allowed
- Auto-focus first field on open
- Mobile: Full-screen on <640px for better typing experience
- Built on bits-ui Dialog primitive with form wrapper
- File: `ui/form-dialog/FormDialog.svelte`

**InfoDialog** (NEW): Read-only information/help
- Usage: State explanations, help content, feature tours, onboarding
- Props: `title`, `content` (snippet or string), `dismissLabel`
- No form inputs, just informational content and close button
- Supports markdown strings or component snippets for content
- Mobile: Scrollable content area, dismiss button always visible at bottom
- Built on bits-ui AlertDialog primitive
- File: `ui/info-dialog/InfoDialog.svelte`

### 26.11.11 EmptyState Component

**Added 2026-02-05**: Generic empty state with domain-specific configuration (Decision #2).

**Component Interface**:
- Props: `config` (EmptyStateConfig from lib/config/empty-states.ts)
- Alternative Props: `icon`, `title`, `message`, `action` (optional) if inline
- Renders: Centered layout, generous padding (py-12), subtle background

**Visual Structure**:
```
┌─────────────────────────────┐
│          {icon}             │  ← Emoji or SVG icon
│                             │
│       {title}              │  ← text-xl font-semibold
│   {message}                │  ← text-labels
│                             │
│   [{action.label}]         │  ← Optional Button
└─────────────────────────────┘
```

**Configuration Pattern**:
All empty state content defined in `lib/config/empty-states.ts`:
```typescript
export const emptyProblemList = {
  icon: '📝',
  title: 'No problems yet',
  message: 'Problems are challenges you want to solve.',
  action: { label: 'Create your first problem', href: '/problem/new' }
};

export const emptyChat = {
  icon: '💬',
  title: 'No messages yet',
  message: 'Be the first to post! Introduce yourself or share your approach.',
  action: null
};
```

**Mobile**: Same layout works well on all viewport sizes. Icon scales appropriately.

**File**: `ui/empty-state/EmptyState.svelte`

### 26.11.12 Toast Notification System

**Added 2026-02-05**: Corner popup notifications with auto-dismiss (Decision #3).

**Components**:
- `Toast.svelte`: Individual toast message with variant styling
- `ToastQueue.svelte`: Container that positions and manages multiple toasts
- `Toaster.svelte`: Root provider component (added to `+layout.svelte`)

**Toast Variants**:
| Variant | Icon | Color | Usage Examples |
|---------|------|-------|----------------|
| success | ✓ checkmark | Green (#55B368) | "Assessment submitted", "Problem saved", "Changes applied" |
| error | ✗ X mark | Red (#D95A5C) | "Submission failed", "Connection lost", "Validation error" |
| info | ⓘ info circle | Blue (#2680F1) | "Assessment closed", "New version available", "Team member joined" |
| warning | ⚠ alert | Yellow (#EAB308) | "Session expiring soon", "Unsaved changes", "Review closes in 5 minutes" |

**Behavior Specification**:
- **Position**:
  - Desktop: top-right, 16px from viewport edge
  - Mobile (<640px): Full-width at top, 8px margins
  - If keyboard open: Bottom-right to avoid keyboard overlap
- **Duration**:
  - Success: 3000ms
  - Error: 5000ms
  - Info/Warning: 4000ms
  - All durations configurable per toast
- **Max visible**: 3 toasts stacked vertically with 8px gap
- **Queue**: Additional toasts queued, appear when space available
- **Dismiss**:
  - Auto after duration
  - Manual: Click X button
  - Mobile: Swipe right to dismiss
- **Animation**:
  - Enter: Slide in from right, 200ms ease-out
  - Exit: Fade out + slide right, 200ms ease-out

**Mobile Considerations**:
- Full-width toasts on screens <640px (easier to tap X button)
- Bottom positioning if `window.visualViewport` detects keyboard
- Swipe gesture for quick dismiss
- Touch target for X button: 44×44px minimum

**Store Interface** (`lib/stores/toast.ts`):
```typescript
addToast({
  variant: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message?: string,
  duration?: number
}): string  // Returns toast ID

removeToast(id: string): void
clearAll(): void
```

**Files**: `ui/toast/Toast.svelte`, `ToastQueue.svelte`, `Toaster.svelte`, `index.ts`

### 26.11.13 Skeleton Loading Patterns

**Added 2026-02-05**: Placeholder components for async content loading (Decision #4).

**Components**:
- `SkeletonCard.svelte`: Card-shaped placeholder matching Card component elevations
- `SkeletonList.svelte`: Multiple skeleton items with spacing (count prop)
- `SkeletonText.svelte`: Text line with shimmer animation (width prop)
- `SkeletonAvatar.svelte`: Circular avatar placeholder

**Shimmer Animation**:
- Background: Linear gradient `90deg` moving left→right
- Colors: `--color-canvas` (0%) → `--color-secondary` (50%) → `--color-canvas` (100%)
- Background size: `1000px 100%`
- Animation: `shimmer 1.5s infinite`
- Keyframes defined in `app.css`
- **Accessibility**: Respects `prefers-reduced-motion` (static gradient if reduced motion preferred)

**Usage Pattern**:
```svelte
{#if loading}
  <SkeletonCard elevation="resting" />
{:else}
  <Card elevation="resting">
    {content}
  </Card>
{/if}
```

Show skeleton while data loads, replace with real content on completion. Maintains layout stability (no content shift).

**Files**: `ui/skeleton/SkeletonCard.svelte`, `SkeletonList.svelte`, `SkeletonText.svelte`, `SkeletonAvatar.svelte`, `index.ts`

### 26.11.14 Form Input Components (shadcn-svelte style)

**Added 2026-02-05**: All form inputs follow shadcn-svelte architecture with bits-ui primitives (Decision #5).

**Select.svelte** (Dropdown):
- Built on bits-ui Select primitive
- Props: `options[]`, `value`, `onchange`, `placeholder`, `disabled`, `searchable`
- **Mobile**: Native select behavior option (better UX), or custom dropdown with touch-friendly size
- Search filter activated for long lists (>10 items)
- Keyboard navigation: Arrow keys, type-ahead
- File: `ui/select/Select.svelte`

**Checkbox.svelte**:
- Built on bits-ui Checkbox primitive
- Props: `checked`, `onchange`, `label`, `disabled`, `indeterminate`
- **Touch target**: 44×44px minimum (label extends clickable area)
- Label positioned right of checkbox, fully clickable
- Indeterminate state supported (for partial selections)
- File: `ui/checkbox/Checkbox.svelte`

**DatePicker.svelte**:
- Props: `value` (Date object), `onchange`, `min`, `max`, `disabled`
- **Responsive behavior**:
  - **Mobile (<768px)**: Native `input[type=date]` for iOS/Android optimized pickers
  - **Desktop (≥768px)**: bits-ui DatePicker with calendar popup
- Native pickers provide better mobile UX (platform-specific date selection UI)
- Custom calendar has month/year navigation, today button
- File: `ui/date-picker/DatePicker.svelte`

**TimePicker.svelte**:
- Native `input[type=time]` with consistent styling
- Props: `value` (string HH:MM format), `onchange`, `disabled`
- Mobile keyboard: Numeric input optimized by browser
- 24-hour or 12-hour based on user locale
- File: `ui/time-picker/TimePicker.svelte`

**FileUpload.svelte**:
- Props: `accept`, `multiple`, `onUpload`, `maxSize`, `maxFiles`
- **Desktop**: Drag-drop zone + click to browse button
- **Mobile**: Click to browse only (drag-drop unreliable on touch devices)
- **Preview**: File chips showing name, size, remove button per file
- **Validation**: File type (via accept), size limits with clear error messages
- Visual states: Idle, dragover (desktop), uploading (progress), error
- File: `ui/file-upload/FileUpload.svelte`

### 26.11.15 Responsive Data Tables

**Added 2026-02-05**: Desktop tables transform to cards on mobile (Decision #6).

**DataTable.svelte**:
- Props: `columns[]`, `data[]`, `actions[]`, `sortable`, `onSort`
- **Desktop (≥768px)**: HTML `<table>` with headers, sortable columns
- **Mobile (<768px)**: Renders as stacked `TableCard` components per row
- Sorting: Click column headers to sort (desktop), sort button on mobile
- Pagination: Optional footer with page navigation
- Empty state: Uses EmptyState component if no data
- Loading state: Uses SkeletonList while fetching

**TableCard.svelte**:
- Props: `rowData`, `columns[]`, `actions[]`
- Mobile representation of table row
- Layout: Key-value pairs vertically stacked
- Actions: ActionMenu (⋮) in top-right corner
- Highlight: Tappable, shows selected state with border
- Usage: Automatic via DataTable on mobile, or standalone for custom lists

**Usage Examples**:
- Event list, user list, problem backlog
- Moderator activity logs
- Admin user management (table→cards transformation essential for mobile admin)

**Files**: `ui/data-table/DataTable.svelte`, `TableCard.svelte`, `index.ts`

### 26.11.16 Initial-Based Avatars

**Added 2026-02-05**: Colored circles with user initials for visual identity (Decision #25).

**InitialAvatar.svelte**:
- Props: `userName`, `userId`, `size` ('sm'|'md'|'lg'), `online` (optional boolean)
- **Generates**: Two initials from name (e.g., "Max Mustermann" → "MM")
- **Color**: Deterministic from userId hash modulo 8 → avatar color palette
- **Sizes**:
  - `sm`: 24px (inline with text, chat messages)
  - `md`: 36px (lists, team members, cards)
  - `lg`: 48px (headers, Problem Owner display, profiles)
- **Online indicator**: Optional green dot (6px) in bottom-right if `online={true}`

**Avatar Colors** (8 distinct, accessible):
Mapped from `hash(userId) % 8`:
- `--color-avatar-1`: Red (#EF4444)
- `--color-avatar-2`: Blue (#3B82F6)
- `--color-avatar-3`: Green (#10B981)
- `--color-avatar-4`: Amber (#F59E0B)
- `--color-avatar-5`: Purple (#8B5CF6)
- `--color-avatar-6`: Pink (#EC4899)
- `--color-avatar-7`: Cyan (#06B6D4)
- `--color-avatar-8`: Lime (#84CC16)

All colors provide sufficient contrast with white text (WCAG AA compliant).

**Placement**:
- Chat messages (before name for others, omitted for own)
- Team member lists (before name)
- Problem Owner in header
- Contributor wall
- User management lists
- Decision timeline (optional, for visual recognition)

**Utility Functions** (`lib/utils/avatar.ts`):
```typescript
export function getInitials(name: string): string
export function getAvatarColor(userId: string): string
```

**File**: `ui/initial-avatar/InitialAvatar.svelte`

### 26.11.17 Navigation Components

**Added 2026-02-05**: Back button for hierarchical navigation (Decision #9).

**BackButton.svelte**:
- Props: `label` (optional, defaults to "Back"), `href` (optional), `onclick` (optional)
- **Default behavior**: `history.back()` if no onclick provided
- **Visual**: ← arrow icon + label text
- **Position**: Top-left of page, or integrated into Header component
- **Styling**:
  - Mobile: Prominent size (44px height), full touch target
  - Desktop: Smaller (36px height), can be subtle
- **Variants**: `ghost` (default), `outline` for emphasis
- Usage contexts: Assessment → Problem Card, Results → Problem Card, Event Detail → Events List

**File**: `ui/back-button/BackButton.svelte`

**Future**: Breadcrumbs component (not MVP scope)

### 26.11.18 Filter System

**Added 2026-02-05**: Responsive filter interface - inline on desktop, bottom sheet on mobile (Decision #10).

**FilterBar.svelte** (Desktop ≥768px):
- Props: `filters[]` configuration array
- Layout: Horizontal flex row of filter controls
- Types supported: Dropdown (FilterDropdown), Checkbox (FilterCheckbox), Search input, DateRange
- Compact spacing, fits in page header or below title
- Apply button updates results immediately (no separate apply action)

**FilterBottomSheet.svelte** (Mobile <768px):
- Triggered by "Filters" button tap
- Slides up from bottom of viewport with backdrop
- Contains same filter controls as desktop, vertical layout
- Generous spacing between filters (16px gaps)
- **Footer**: Apply + Reset buttons at bottom (sticky)
- **Backdrop**: Semi-transparent black, dismisses sheet on tap
- Built on bits-ui Dialog primitive with bottom positioning

**FilterDropdown.svelte** (Primitive):
- Props: `options[]`, `value`, `onchange`, `label`, `placeholder`
- Used in both FilterBar and FilterBottomSheet
- Consistent styling across contexts
- Built on bits-ui Select

**FilterCheckbox.svelte** (Primitive):
- Props: `checked`, `onchange`, `label`
- Boolean filter primitive
- Used in both desktop and mobile filter contexts

**Responsive Pattern**:
```svelte
<!-- Desktop: Inline filters -->
<div class="hidden md:flex">
  <FilterBar {filters} onApply={handleFilter} />
</div>

<!-- Mobile: Bottom sheet -->
<div class="md:hidden">
  <Button onclick={openFilters}>Filters ({activeCount})</Button>
  <FilterBottomSheet bind:open {filters} onApply={handleFilter} />
</div>
```

**Files**: `ui/filter-bar/FilterBar.svelte`, `FilterBottomSheet.svelte`, `FilterDropdown.svelte`, `FilterCheckbox.svelte`, `index.ts`

### 26.11.19 ActionMenu Component (⋮)

**Added 2026-02-05**: Three-dot menu for list item actions (Decision #11).

**ActionMenu.svelte**:
- Props: `actions[]` array of action objects
- **Actions Array Interface**:
  ```typescript
  {
    label: string,
    icon?: Component,  // Lucide icon component
    onclick: () => void,
    variant?: 'default' | 'destructive'
  }
  ```
- **Trigger**: ⋮ button (three vertical dots icon)
- **Menu**: Popover aligned to trigger (auto-positioned)
- **Mobile**: Touch-friendly list items (48px height minimum)
- **Desktop**: Hover reveals trigger, click opens menu
- Built on bits-ui Popover or DropdownMenu primitive

**Visual Specification**:
- Background: `bg-card`, `shadow-floating` elevation
- Dividers: 1px between action groups (if grouped)
- Destructive actions: Red text color (`text-alert`)
- Icons: Left-aligned before label text
- Padding: 12px per item

**Usage Contexts**:
- Problem list items (edit, archive, clone)
- Resource list items (edit, delete, move)
- User list rows (edit, promote, disable)
- Lesson cards (edit, flag valuable, delete)

**File**: `ui/action-menu/ActionMenu.svelte`

### 26.11.20 AccordionSection Component

**Added 2026-02-05**: Collapsible section with animated header (Decision #28).

**AccordionSection.svelte**:
- Props: `title`, `defaultOpen`, `children` (snippet), `class`
- **Header**: Tappable bar showing title + chevron icon
- **Icon**: Chevron rotates 180° on expand (▼ collapsed ↔ ▲ expanded)
- **Content**: Animated height transition (200ms ease-out) + opacity fade
- **State**: Controlled (`open` prop) or uncontrolled (`defaultOpen`) modes

**Visual Specification**:
- **Header**:
  - Background: `bg-canvas`
  - Padding: `p-3 md:p-4`
  - Border radius: `rounded-t-[--radius-card]` when open, `rounded-[--radius-card]` when closed
  - Cursor: pointer
  - Hover: `bg-canvas/80`
- **Content**:
  - Background: `bg-card`
  - Padding: `p-4 md:p-5`
  - Border radius: `rounded-b-[--radius-card]`
  - Border: `border border-secondary` wraps entire section
- **Transition**: CSS classes `.accordion-content` and `.accordion-icon` with transforms

**Mobile Usage** (Problem Card):
- Wrap major sections: Description (open), Assessments (open), Lessons (collapsed), Team (open), Chat (open), Decisions (collapsed)
- Reduces initial scroll length on mobile

**Desktop Behavior**:
- Can be disabled (all sections always open) via responsive logic
- Or keep accordion active for consistency

**File**: `ui/accordion-section/AccordionSection.svelte`

### 26.11.21 Chart Components (via Chart.js)

**Added 2026-02-05**: Visualizations for results and analytics using Chart.js library (Decision #22).

**Library**: Chart.js 4.x (installed in package.json, no Svelte wrapper)
**Implementation**: Svelte components that wrap Chart.js with lifecycle management

**BarChart.svelte**:
- Props: `data`, `labels`, `options`, `height` (optional)
- Usage: Item-by-item score comparison across problems or versions
- **Colors**: Use `--color-problem-*` tokens (problem-1 through problem-8) for multi-series
- **Mobile**: Responsive canvas (scales with container width), horizontal scroll if many bars
- Tooltips: Touch-friendly on mobile (tap to show, not hover)
- File: `charts/BarChart.svelte`

**LineChart.svelte**:
- Props: `datasets`, `labels`, `options`, `height` (optional)
- Usage: Version trend over time (v1 → v2 → v3 score progression)
- **Legend**:
  - Mobile: Below chart (vertical layout)
  - Desktop: Right side of chart
- **Mobile**: Pinch-to-zoom enabled for detail examination
- Tooltips: Tap-friendly interaction
- File: `charts/LineChart.svelte`

**SparkLine.svelte**:
- Props: `values[]`, `color`, `width`, `height`
- Minimal Chart.js Line configuration: No axes, no labels, no legend, pure visualization
- Default size: 60×20px (inline in tables/cards)
- Usage: Quick visual trends without taking space
- No interactivity (no tooltips)
- File: `charts/SparkLine.svelte`

**Mobile Considerations for ALL Charts**:
- Touch-friendly tooltips (tap, not hover-only)
- Sufficient contrast for outdoor/sunlight readability
- Respect `prefers-reduced-motion` (no animated chart entry, instant render)
- Canvas element: `touch-action: pan-y` for vertical scroll, prevent horizontal pan conflicts

**Files**: `charts/BarChart.svelte`, `LineChart.svelte`, `SparkLine.svelte`

### 26.11.22 Event Registration Components

**Added 2026-02-05**: Reusable event registration section (Decision #21).

**RegistrationSection.svelte** (Primary component):
- Props: `event`, `userRegistration` (if exists), `onRegister`
- **Contains**:
  - **Attendance mode toggle**: Radio buttons for In-Presence / Remote attendance
  - **CapacityIndicator**: Shows current registration count vs. capacity
  - **WaitlistNotice**: Displays if user is waitlisted or has pending invitation
  - **T&C checkbox**: Terms & Conditions acceptance (required to register)
  - **Newsletter checkbox**: Opt-in for community newsletter (default: checked)
  - **Register button**: Primary button, large size on mobile, or "You're registered" status
- **Layout**:
  - Mobile: Vertical stack, all controls full-width
  - Desktop: Can be inline or sidebar, more compact
- **Validation**: T&C must be checked before registration enabled
- File: `registration/RegistrationSection.svelte`

**CapacityIndicator.svelte**:
- Props: `registered`, `capacity`, `waitlistCount`
- **Visual**: "{registered}/{capacity} registered" with color coding
- **Colors**:
  - Green: <70% capacity (`text-success`)
  - Yellow: 70-90% capacity (`text-pending`)
  - Red: >90% capacity (`text-alert`)
  - Purple: Waitlisted (`text-purple`)
- **Icon**: User icon with count badge
- Compact: One line, icon + text inline
- File: `registration/CapacityIndicator.svelte`

**WaitlistNotice.svelte**:
- Props: `position` (waitlist number), `expiresAt` (if invited), `status` ('waitlisted'|'invited')
- **Variants**:
  - Waitlisted: "You're on the waitlist (#5)" - `bg-warning-bg` banner
  - Invited: "Spot available! Respond by {time}" - `bg-success/10` banner with countdown
- **Action button**: "Confirm Spot" if invited (prominent, primary variant)
- **Style**: Full-width banner, above or below registration form
- File: `registration/WaitlistNotice.svelte`

## 26.12 Mobile Admin Interface Patterns

**Added 2026-02-05**: Comprehensive patterns for administrative interfaces on smartphones (Decision #16, #17 from template session). Supports the Mobile Administration Guarantee in Chapter 17.0.

All administrative interfaces work on smartphones with **375px width minimum (iPhone SE)**. The following patterns ensure full functionality on mobile devices.

### 26.12.1 Complex Form Pattern (Vertical Scroll Layout)

**Principle**: All fields stacked vertically, no forced side-by-side layouts on mobile.

**Layout Rules**:
- All inputs full-width with 16px horizontal margins
- Labels positioned above inputs (not beside)
- Field groups separated by spacing (16px or 24px vertical gaps)
- Touch-friendly: All inputs 44px minimum height
- Submit button: Sticky at bottom or in-flow at end

**Item Editor Mobile Layout**:
```
┌────────────────────────────────┐
│ Item Text                      │
│ [_________________________]    │ ← Textarea, 3-4 rows
│                                │
│ Max Rating                     │
│ [5           ▼]                │ ← Select dropdown
│                                │
│ Label (Minimum)                │
│ [_________________________]    │
│                                │
│ Label (Low-Mid)                │
│ [_________________________]    │
│                                │
│ ... (continues for all labels) │
│                                │
│        [Save Item]             │
└────────────────────────────────┘
```

**Event Creation Mobile**:
- Partner select: Full-width dropdown
- Room select: Full-width dropdown
- Date/time: Native pickers (`input[type=date]`, `input[type=time]`)
- All fields vertical stack
- Submit at bottom

**Applies To**: Item Editor, Event Editor, Partner Editor, all complex forms

### 26.12.2 Shuttle Pattern on Mobile (Inventory Editor)

**Desktop (≥768px)**: Side-by-side dual lists with shuttle buttons between
**Mobile (<768px)**: Vertical stacking with full-width controls

**Mobile Layout**:
```
┌────────────────────────────────┐
│ Available Items                │
│ ────────────────               │
│ ☐ correctness                  │
│ ☐ test_support                 │
│ ☐ code_readability             │
│ ... (scrollable)               │
│                                │
│   [Add Selected Items ↓]       │ ← Full-width button
│                                │
│ Inventory Items (ordered)      │
│ ──────────────────────         │
│ 1. problem_clarity  [↑][↓][×]  │
│ 2. testability     [↑][↓][×]  │
│ 3. complexity      [↑][↓][×]  │
│ ... (scrollable)               │
│                                │
│    [Save Inventory]            │
└────────────────────────────────┘
```

**Interaction**:
- **Selection**: Multi-select checkboxes on Available Items
- **Add button**: Moves checked items to Inventory Items list
- **Reorder**: Up/down arrow buttons (or drag handles on touch)
- **Remove**: × button per item removes from inventory
- **All buttons**: Full-width, 44px height minimum

### 26.12.3 Decision Button Accordion (Moderator Mobile)

**Context**: Moderator Dashboard has 25 decision types across 7 categories.
**Mobile Solution**: Accordion sections with color-coded headers (Decision #4).

**Mobile Layout**:
```
┌────────────────────────────────┐
│ ▼ Quality Gate (3)        [🔵]│ ← Blue header, expanded
│   [Accept]                     │
│   [Request Changes]            │
│   [Reject]                     │
│                                │
│ ▶ Event Planning (2)       [🟢]│ ← Green header, collapsed
│                                │
│ ▶ Deferral (6)             [🟡]│ ← Yellow header, collapsed
│                                │
│ ... (5 more categories)        │
└────────────────────────────────┘
```

**Category Headers** (color-coded per Ch.17.8.3):
1. Quality Gate (blue: `bg-primary/10`, `text-primary`)
2. Event Planning (green: `bg-success/10`, `text-success`)
3. Sprint (purple: `bg-purple-bg`, `text-purple`)
4. Deferral (yellow: `bg-pending/10`, `text-pending`)
5. Drop (red: `bg-alert/10`, `text-alert`)
6. Close (purple: `bg-purple-bg`, `text-purple`)
7. Live (orange: `bg-warning-bg`, `text-warning`)

**Behavior**:
- Tap header to expand/collapse category
- Only one category open at a time (accordion)
- Buttons: Full-width, 44px height, colored per category
- Smooth 200ms height transition

**Desktop**: All categories visible, or keep accordion for consistency

### 26.12.4 Table-to-Card Transformation

**Pattern**: Responsive tables for admin data (User Management, Event List, etc.)

**Desktop Table** (≥768px):
```
| Email            | Name      | Role | Events | Actions |
|------------------|-----------|------|--------|---------|
| max@example.com  | Max M.    | Dev  | 5      | [⋮]     |
| eva@example.com  | Eva S.    | Mod  | 8      | [⋮]     |
```

**Mobile Cards** (<768px):
```
┌──────────────────────────────┐
│ Max Mustermann          [⋮]  │ ← Name + ActionMenu
│ max@example.com              │ ← Email
│ Developer • 5 events         │ ← Role + count
└──────────────────────────────┘

┌──────────────────────────────┐
│ Eva Schmidt (Moderator) [⋮]  │
│ eva@example.com              │
│ Moderator • 8 events         │
└──────────────────────────────┘
```

**Implementation**: Uses DataTable component (26.11.15) with automatic responsive transformation.

## 26.15 Chat UI Specification

**Added 2026-02-05**: Bubble-based messaging interface with threading, mentions, and reactions (Decision #19 from template session). Full specification for chat system replacing minimal flat layout.

### 26.15.1 Message Bubble Layout

Chat uses bubble-based interface similar to messaging apps (WhatsApp, iMessage) for familiarity and clarity.

**Own Messages** (current user):
- **Alignment**: Right side of container (`flex-end` or `ml-auto`)
- **Background**: `--color-chat-own` (#E3F2FD, light blue)
- **Border radius**: `12px 12px 0 12px` (square corner bottom-right, anchors to right edge)
- **Max width**: 75% of chat container width
- **Padding**: 8px horizontal, 12px vertical
- **Text color**: `--color-headers`
- **No border**: Background color provides sufficient contrast
- **No avatar**: Right-alignment makes ownership clear

**Other Users' Messages**:
- **Alignment**: Left side of container (`flex-start` or `mr-auto`)
- **Background**: `--color-card` (#FEFEFE, white)
- **Border radius**: `12px 12px 12px 0` (square corner bottom-left, anchors to left edge)
- **Border**: `1px solid var(--color-secondary)` (subtle edge definition)
- **Max width**: 75% of chat container width
- **Padding**: 8px horizontal, 12px vertical
- **Text color**: `--color-headers`
- **Avatar**: InitialAvatar (32px) positioned before bubble

**Moderator Messages** (special styling):
- **Alignment**: Left (same as other users)
- **Background**: `--color-chat-moderator` (#E8F4FD, lighter blue than own messages)
- **Border**: `1px solid var(--color-primary/30)`
- **Badge**: "Moderator" pill badge above bubble or inline with name
- **Distinct but subtle**: Clearly moderator, not overpowering

**System Messages** (bot, join/retire notifications):
- **Alignment**: Center (`mx-auto`, `text-center`)
- **Background**: `--color-canvas` (#F1F2F8, grey - same as canvas background)
- **Text**: Italic, `--color-meta`, smaller font (`text-xs`)
- **Format**: "─── {timestamp} {User} joined the team ───" (WhatsApp-style separators)
- **No border**: Minimal visual weight, subtle presence
- **No avatar**: System actor, not person

**Message Grouping** (consecutive messages from same user):
- **Trigger**: Messages from same user within 2 minutes
- **First message**: Show avatar + name + timestamp
- **Subsequent messages**: Bubble only, 4px gap between bubbles, no repeated avatar/name
- **Break grouping on**: Different user, >2 minute gap, or system message

### 26.15.2 Message Metadata Display

**Avatar Display**:
- **Own messages**: No avatar (right-alignment indicates ownership)
- **Other messages**: InitialAvatar (32px) on left side, before name/bubble
- **Moderator messages**: Same InitialAvatar, distinguished by bubble color + badge

**Name Display**:
- **Own messages**: Omitted (position indicates ownership)
- **Other messages**: Above bubble, `text-sm font-medium text-headers`
- **Format**: "Max Mustermann" or "Eva Schmidt (Moderator)" if moderator role
- **Role indication**: Inline with name if moderator/PO, or small badge

**Timestamp**:
- **Position**: Below bubble, right-aligned for own messages, left-aligned for others
- **Style**: `text-xs text-meta`
- **Format**: Relative time ("2m ago", "1h ago", "Yesterday 14:32" from formatRelative utility)
- **Hover/long-press**: Tooltip shows absolute timestamp ("Feb 5, 2026 14:32:15")

**Edited Indicator**:
- If message edited: "(edited)" text after timestamp, subtle, no emphasis

### 26.15.3 Threading UI on Mobile

Full threading support on mobile per Decision #18 (full-featured chat).

**Collapsed Thread Display**:
- **Indicator**: "▶ 3 replies" text below parent message
- **Style**: Small text (`text-xs`), subtle color (`text-meta`)
- **Interaction**: Tap to expand thread
- **Default**: Collapsed to reduce scroll length

**Expanded Thread Display**:
- **Indent**: Child messages indented 40px from parent message
- **Thread line**: Vertical 1px line (`border-l border-secondary`) connecting parent to children
- **Avatars**: Smaller size (24px) for reply messages
- **Quote indicator**: "Replying to {Name}" text above reply bubble (`text-xs text-meta`)
- **Collapse action**: Tap parent message header or tap outside thread area to collapse

**Maximum Depth**: 3 levels on mobile (parent → reply → reply-to-reply)
- **Deeper nesting**: Flatten to 3rd level with "In reply to {Name}" text indicator instead of visual nesting

**Threading Actions**:
- **Reply button**: Below message bubble, "Reply" text or icon
- **Tap reply**: Opens ChatInput with focus, optionally pre-fills "@{Name}" for mention
- **Cancel**: Clear button in input to exit reply mode

### 26.15.4 @Mention Autocomplete

**Trigger**: User types "@" character in chat input
**Dropdown**: Appears immediately showing team members

**Dropdown Positioning**:
- **Mobile**: Fixed positioning above keyboard (`bottom: calc(env(keyboard-inset-height) + 8px)`)
- Uses `window.visualViewport` API to detect keyboard and position accordingly
- **Desktop**: Positioned relative to cursor or input field

**Dropdown Contents**:
- **Empty "@"**: Shows all team members
- **Typed characters**: Filters in real-time ("@max" → shows only "Max Mustermann")
- **List items**: InitialAvatar (24px) + Name + Role
  - Format: "Max Mustermann (Developer)"
  - Highlight matched characters in name

**Interaction**:
- **Touch target**: 48px height per list item (mobile accessibility)
- **Selection**:
  - Mobile: Tap user to insert mention
  - Desktop: Arrow keys navigate + Enter to select, or mouse click
- **Insertion**: Replaces "@" with "@MaxMustermann" or chosen format
- **Continue typing**: User can immediately continue typing after selection

**Mobile Keyboard**:
- Input type: `text` (not search) to support "@" character
- Keyboard remains open during autocomplete interaction
- Autocomplete doesn't dismiss keyboard

**Visual**: Dropdown has `shadow-floating`, white background, scrollable if many members

### 26.15.5 Emoji Reactions Inline

**Reaction Display** (below message bubble):
- **Position**: Below bubble, aligned with bubble (left for left bubbles, right for right bubbles)
- **Layout**: Horizontal row of emoji + count badges
- **Format**: Individual badges per emoji - `👍 3` `❤️ 2` `💡 1`
- **Style**: Small badges (`text-xs`), subtle background (`bg-canvas`), rounded pills
- **Interaction**: Tap to add/remove your own reaction (toggle)
- **Long-press**: Tooltip showing who reacted with that emoji

**Reaction Picker**:
- **Trigger**: Tap + icon next to reactions, or long-press message bubble
- **Display**: Grid of 10 curated emojis (from emoji_catalog)
- **Mobile**: Bottom sheet with large emoji buttons (60×60px touch targets)
- **Desktop**: Popover grid with smaller emoji buttons (40×40px)
- **Selection**: Tap emoji to add reaction, auto-dismiss picker

**Curated Set** (10 emojis from Ch.31): 👍 👎 ❤️ 🎉 🤔 👀 🔥 ✅ 💡 🙏

---

*This addendum captures UI design decisions. Section 26.1-26.10 established 2026-01-29. Section 26.11 added 2026-02-04 documenting the shadcn-svelte component system. Sections 26.11.10-26.11.22, 26.12, and 26.15 added 2026-02-05 for mobile admin support and chat UI.*
