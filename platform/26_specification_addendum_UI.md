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

## Sources

- [NN/g: Slider Design Rules of Thumb](https://www.nngroup.com/articles/gui-slider-controls/)
- [Smashing Magazine: Designing the Perfect Slider](https://www.smashingmagazine.com/2017/07/designing-perfect-slider/)
- [MeasuringU: Sliders vs Numeric Scales](https://measuringu.com/uxlite-numeric-slider-desktop-mobile/)
- [Baymard: Slider Interface Requirements](https://baymard.com/blog/slider-interfaces/)
- [IxDF: Rating Scales in UX Research](https://www.interaction-design.org/literature/article/rating-scales-for-ux-research)
- [Material Design 3: Slider Accessibility](https://m3.material.io/components/sliders/accessibility)

---

*This addendum captures UI design decisions made 2026-01-29. Implementation should treat these as authoritative requirements for the rating/assessment interface.*
