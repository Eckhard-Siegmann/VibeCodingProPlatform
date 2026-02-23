# Assessment Form Page Design

**Status**: Retroactive (documenting existing implementation)
**Route**: `/assess/[assessmentId]`
**File**: `frontend/query/src/routes/assess/[assessmentId]/+page.svelte`
**Created**: 2026-02-04

---

## Overview

Unified assessment interface for pitch, review, and self-assessments. Backend-driven rendering based on inventory structure. Supports both single-matrix (all items same scale) and future mixed-matrix (different scales per item) rendering.

**Philosophy**: "Guide, don't overwhelm" — show only what's needed, implicit skip, real-time progress feedback.

---

## URL Pattern

`/assess/[assessmentId]`

**Dynamic Segment**: `assessmentId` (UUID) from database
**Query Params**: None (all context loaded via page data)

---

## User Stories Covered

- **U7**: Vote During Pitch — Participants rate problems during pitch phase
- **U8**: Skip Items — Implicit skip (untouched items not submitted)
- **U15**: Set Presence Mode — In-presence vs remote attendance tracking
- **U17**: Review Assessment — Post-coding solution evaluation
- **U18**: Post-Event Reflection — Late reviews and reflections
- **P3**: Self-Assessment — Problem owners evaluate their own problems

**Specification Sources**: Ch.08 (Assessments), Ch.09 (Voting), Ch.26 (Rating UI)

---

## Component Hierarchy

```
PageContainer (three-layer depth)
└─ {#if !assessment.is_open}
   │  └─ Card (elevation="resting")
   │     └─ "Assessment Closed" message
   │
   └─ {#else}
      ├─ Header (with mode badge: pitch/review)
      │
      └─ Card (elevation="resting")
         └─ AssessmentForm
            ├─ RoleSelector (first time only per problem)
            ├─ Separator
            ├─ ProgressIndicator (answered / total)
            ├─ MatrixTable
            │  ├─ ScaleLabels (desktop only, >=768px)
            │  └─ ItemRow[] (one per item)
            │     ├─ {item info}
            │     └─ ButtonScale (if max_rating <= 5)
            │         └─ RadioButton[] (one per rating value)
            │
            ├─ {#if error}
            │  └─ Error message (bg-alert/10, border-alert)
            │
            └─ SubmitSection
               ├─ "Skipping X items" text
               └─ Submit button (disabled if no role)
```

**Alternative: Success State** (after submission):
```
PageContainer
└─ Card (elevation="resting")
   └─ Success message
      ├─ Checkmark icon (✓)
      ├─ "Assessment Submitted" heading
      └─ "You rated X of Y items" text
```

---

## Templates Used

| Component | Props | Elevation | Source File |
|-----------|-------|-----------|-------------|
| **PageContainer** | `children` | N/A | `layout/PageContainer.svelte` |
| **Header** | `title, subtitle, mode` | N/A | `layout/Header.svelte` |
| **Card** | `elevation="resting", padding="md"` | Resting shadow | `ui/Card.svelte` |
| **AssessmentForm** | `assessmentId, matrix, timeContext, onSubmitSuccess` | N/A (wrapper) | `assessment/AssessmentForm.svelte` |
| **RoleSelector** | `value, onchange, disabled` | N/A | `assessment/RoleSelector.svelte` |
| **Separator** | `class` | N/A | `ui/Separator.svelte` |
| **ProgressIndicator** | `answered, total, class` | N/A | `assessment/ProgressIndicator.svelte` |
| **MatrixTable** | `matrix, responses, disabled, onresponse` | N/A (container) | `assessment/MatrixTable.svelte` |
| **ScaleLabels** | `headers` | N/A | `rating/ScaleLabels.svelte` |
| **ItemRow** | `item, headers, value, disabled, index, onchange` | N/A | `assessment/ItemRow.svelte` |
| **ButtonScale** | `itemId, itemLabel, headers, value, disabled, onchange` | N/A | `rating/ButtonScale.svelte` |
| **RadioButton** | `value, label, selected, disabled, orientation, onclick` | N/A | `rating/RadioButton.svelte` |
| **SubmitSection** | `canSubmit, submitting, answeredCount, totalCount, onsubmit` | N/A | `assessment/SubmitSection.svelte` |
| **Button** | `variant="primary", size="md", fullWidth` | N/A | `ui/Button.svelte` |
| **LoadingSpinner** | `size="sm"` (in button) | N/A | `ui/LoadingSpinner.svelte` |

---

## Page States & Transitions

```
┌──────────┐
│ LOADING  │ Fetching render structure from API
└────┬─────┘
     │
     v
┌──────────┐
│ CLOSED   │ Assessment is not open, show warning
└──────────┘

     OR

┌──────────┐
│ FORM     │ Assessment open, role not selected
└────┬─────┘     Submit disabled
     │
     │ (select role)
     v
┌──────────┐
│ RATABLE  │ Role selected, items answerable
└────┬─────┘     Submit enabled
     │
     │ (answer items)
     v
┌──────────┐
│ READY    │ At least one item answered
└────┬─────┘     Submit enabled
     │
     │ (click submit)
     v
┌──────────┐
│SUBMITTING│ API call in progress
└────┬─────┘     Submit button shows spinner
     │
     │ (success)
     v
┌──────────┐
│ SUCCESS  │ Show checkmark and confirmation
└────┬─────┘     3 seconds, then optional redirect
     │
     │ (OR error)
     v
┌──────────┐
│  ERROR   │ Red alert box, can retry
└──────────┘
```

---

## API Integration

### Server Load Function

**File**: `assess/[assessmentId]/+page.server.ts`

**Endpoint Called**: `GET /api/assessments/{assessmentId}/render-structure`

**Server Load Logic**:
```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const { assessmentId } = params;

  // Fetch assessment data with render structure
  const response = await fetch(`${API_BASE}/assessments/${assessmentId}/render-structure`);
  const assessment = await response.json();

  return { assessment };
};
```

**Page Data Shape**:
```typescript
interface PageData {
  assessment: {
    assessment_id: string;
    problem_title: string;
    inventory_name: string;
    time_context: 'pitch' | 'review' | 'pre_event' | 'post_event';
    is_open: boolean;
    matrix: Matrix;
  };
}
```

### Render Structure Endpoint

**File**: `routes/api/assessments/[assessmentId]/render-structure/+server.ts`

**Response** (MVP: single matrix, all items same scale):
```json
{
  "assessment_id": "abc-123",
  "problem_title": "API Rate Limiter",
  "inventory_key": "review_assessment",
  "inventory_name": "Review Assessment",
  "time_context": "review",
  "is_open": true,
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
        "position_index": 0,
        "item_id": "uuid-1",
        "item_key": "correctness",
        "short_label": "Correctness",
        "full_text": "The solution meets the stated requirements...",
        "max_rating": 5,
        "current_rating": null
      },
      // ... 17 more items
    ]
  }
}
```

**Source**: Ch.26.4, `render-structure/+server.ts:1-88`

### Response Submission Endpoint

**File**: `routes/api/assessments/[assessmentId]/responses/+server.ts`

**Method**: `POST`

**Request Payload**:
```json
{
  "session_hash": "abc123...",
  "role": "developer",
  "time_context": "review",
  "in_presence": true,
  "responses": [
    { "item_id": "uuid-1", "rating_value": 4 },
    { "item_id": "uuid-2", "rating_value": 3 },
    { "item_id": "uuid-3", "rating_value": 5 }
  ]
}
```

**Response** (Success):
```json
{
  "success": true,
  "responses_created": 3
}
```

**Error** (400/500):
```json
{
  "error": "Validation failed",
  "details": "..."
}
```

**Source**: `responses/+server.ts:1-67`, Ch.09.5

---

## State Management

### responsesStore

**File**: `lib/stores/responses.ts`

**State Shape**:
```typescript
interface ResponsesState {
  assessmentId: string;
  role: Role | null;
  timeContext: TimeContext;
  responses: Map<string, number>;    // itemId → rating
  touched: Set<string>;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}
```

**Derived Stores**:
- `answeredCount`: Number of items in responses Map
- `canSubmit`: `role !== null && !submitting && !submitted`

**Methods**:
- `initialize(assessmentId, timeContext)`
- `setRole(role)`
- `setResponse(itemId, value)`
- `setSubmitting(boolean)`
- `setSubmitted()`
- `setError(message)`

**Source**: `responses.ts:1-104`

### sessionStore

**File**: `lib/stores/session.ts`

**State Shape**:
```typescript
interface SessionState {
  sessionHash: string;
  inPresence: boolean;
  initialized: boolean;
}
```

**Methods**:
- `initialize()` - Generates session hash, loads presence from localStorage
- `setInPresence(boolean)` - Persists to localStorage

**Source**: `session.ts:1-48`

---

## Responsive Behavior

### Mobile (<640px)

**Layout**:
- Header: Title wraps, subtitle below
- RoleSelector: Vertical stack of 3 role cards, full-width tappable
- MatrixTable: Hidden (uses card layout instead)
- ItemRow: Card layout per item:
  ```
  ┌─────────────────────┐
  │ Short Label         │
  │ Full text...        │
  │ ○  Poor             │ ← Vertical button stack
  │ ○  Fair             │
  │ ○  Good             │
  │ ○  Very Good        │
  │ ○  Excellent        │
  └─────────────────────┘
  ```
- SubmitSection: Full-width button

### Tablet/Desktop (>=768px)

**Layout**:
- Header: Single line, mode badge inline
- RoleSelector: Horizontal row of 3 cards
- MatrixTable: Visible with column headers
- ItemRow: Two-column layout (1/3 label, 2/3 scale):
  ```
  ┌──────────────────┬────────────────────────────────┐
  │ Correctness      │ ○ Poor ○ Fair ○ Good ...      │
  │ The solution...  │                                │
  └──────────────────┴────────────────────────────────┘
  ```
- ScaleLabels: Column headers above first ItemRow
- SubmitSection: Right-aligned button

---

## Accessibility Compliance

### WCAG 2.1 AA Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Touch Targets** | 44×44px minimum | ✅ RadioButton, Button md size |
| **Touch Gaps** | 16px between adjacent | ✅ ButtonScale spacing |
| **Color Contrast** | >= 4.5:1 | ✅ All design tokens tested |
| **Focus Ring** | 2px primary, 2px offset | ✅ Global `*:focus-visible` |
| **Keyboard Nav** | Full keyboard access | ✅ See below |
| **Reduced Motion** | Respects preference | ✅ `@media` query in app.css |

### Keyboard Navigation

| Context | Keys | Behavior | Status |
|---------|------|----------|--------|
| **Role Selection** | Arrow keys | Navigate between role cards | ✅ |
| **Role Selection** | Space, Enter | Select role | ✅ |
| **Button Scale** | Tab | Focus item group | ✅ |
| **Button Scale** | Arrow Left/Right | Navigate within scale | ✅ |
| **Button Scale** | Home | Select min rating (1) | ✅ |
| **Button Scale** | End | Select max rating (5) | ✅ |
| **Button Scale** | Space, Enter | Confirm selection | ✅ |
| **Slider Scale** | Arrow Left/Right | Increment/decrement | ✅ |
| **Slider Scale** | Home, End | Jump to extremes | ✅ |
| **Form** | Tab | Move between items | ✅ |
| **Submit Button** | Space, Enter | Submit form | ✅ |

### ARIA Attributes

**RoleSelector**:
```svelte
<div role="radiogroup" aria-label="Select your role">
  {#each roles as role}
    <div role="radio" aria-checked={selected === role}>
      {role.label}
    </div>
  {/each}
</div>
```

**ButtonScale**:
```svelte
<div role="radiogroup" aria-label="{item.short_label}">
  {#each headers as header}
    <button
      role="radio"
      aria-checked={value === header.rating_value}
      aria-label={header.label}
    >
      {header.label}
    </button>
  {/each}
</div>
```

**SliderScale**:
```svelte
<input
  type="range"
  role="slider"
  aria-label="{item.short_label}"
  aria-valuemin="1"
  aria-valuemax="10"
  aria-valuenow="{value}"
  aria-valuetext="{1-3: 'Low', 4-6: 'Medium', 7-10: 'High'}"
/>
```

**Error Alert**:
```svelte
<div role="alert" class="...">
  {error}
</div>
```

---

## Data Flow & Lifecycle

### 1. Page Load (Server)

```typescript
+page.server.ts: load()
  ↓
GET /api/assessments/{id}/render-structure
  ↓
Returns: { assessment_id, matrix, is_open, ... }
  ↓
Page renders with data
```

### 2. Client Initialization (onMount)

```typescript
onMount() {
  sessionStore.initialize()      // Generate session hash
  responsesStore.initialize(assessmentId, timeContext)
}
```

### 3. User Interaction Flow

```
User lands on page
  ↓
(if !is_open) Show "Assessment Closed" card → DONE
  ↓
(if is_open) Show form
  ↓
User selects role (RoleSelector)
  ↓
responsesStore.setRole(role)
  ↓
Form items become interactive
  ↓
User answers items (ButtonScale/SliderScale)
  ↓
responsesStore.setResponse(itemId, value)
  ↓
Progress updates ($answeredCount increments)
  ↓
User clicks Submit
  ↓
handleSubmit():
  - Build payload from stores
  - POST /api/assessments/{id}/responses
  - responsesStore.setSubmitting(true)
  ↓
(on success)
  - responsesStore.setSubmitted()
  - Show success state
  - Call onSubmitSuccess() (optional redirect)
  ↓
(on error)
  - responsesStore.setError(message)
  - Show error alert
  - User can retry
```

---

## Role-Based Visibility

| User Role | Can Access When | Special Rules |
|-----------|----------------|---------------|
| **Observer** | Assessment is open (`is_open=true`) | Can rate pitch/review |
| **Developer** | Assessment is open | Can rate pitch/review |
| **Problem Owner** | Always (self-assessment always available) | Can rate pitch/review when open |
| **Moderator** | Always | Can rate even when closed (for testing) |
| **Admin** | Always | Same as moderator |

**Implementation**: Checked server-side in `+page.server.ts` load function. Client receives `is_open` flag.

---

## Responsive Breakpoint Behavior

### Mobile (<640px)

**Header**:
- Title: `text-2xl`, wraps
- Subtitle: `text-sm`, below title
- Mode badge: `text-xs`, above title

**RoleSelector**:
- Vertical stack
- Cards full-width
- 44×44px min-height per card

**MatrixTable**:
- `md:hidden` class hides desktop table
- Shows card layout instead

**ItemRow (Card Layout)**:
- Short label: `font-medium`, `text-base`
- Full text: `text-sm`, `text-labels`, below label
- ButtonScale: Vertical stack, 5 rows, 44×44px each
- 16px gap between buttons

**SubmitSection**:
- "Skipping X" text: `text-xs`, above button
- Button: `fullWidth=true`, `size="lg"` (52px height)

### Desktop (>=768px)

**Header**:
- Title: `text-3xl`
- Mode badge: `text-sm`, inline left

**RoleSelector**:
- Horizontal flexbox
- 3 cards, equal width

**MatrixTable**:
- `hidden md:block` shows desktop layout
- Column headers (ScaleLabels) visible
- Fixed-width columns

**ItemRow (Table Layout)**:
- Two-column: 33% label, 67% scale
- Short label: `font-medium`
- Full text: `text-sm`, below label, same column
- ButtonScale: Horizontal row, 5 columns

**SubmitSection**:
- "Skipping X" text: `text-sm`, left
- Button: Right-aligned, `size="md"` (44px height)

---

## Visual Design Details

### Three-Layer Depth

**Viewport** (`body`): `bg-viewport` (#DCEBFF - light blue)
**Canvas** (PageContainer): `bg-canvas` (#F1F2F8 - light grey) with `shadow-canvas`
**Form Card** (Card): `bg-card` (#FEFEFE - white) with `shadow-card` (elevation="resting")

**Spacing**: 16px padding on viewport, 16-24px padding on canvas, 16-20px padding on card

### Alternating Row Backgrounds

**ItemRow** uses index-based alternating:
- **Even rows** (0, 2, 4, ...): `bg-card` (white, matches card background)
- **Odd rows** (1, 3, 5, ...): `bg-canvas/30` (subtle grey tint)

Creates visual rhythm in long assessment lists.

### Mode Badge Styling

**Pitch**:
- Background: `bg-primary/10` (very light blue)
- Text: `text-primary` (blue)
- Content: "Pitch"

**Review**:
- Background: `bg-success/10` (very light green)
- Text: `text-success` (green)
- Content: "Review"

Shape: `rounded-full px-3 py-1 text-xs font-medium`

### Success State Styling

**Checkmark Icon**:
- Color: `text-success` (green)
- Size: `text-5xl` (48px)
- Symbol: `&#10003;` (✓)

**Heading**: `text-xl font-semibold text-headers`
**Body**: `text-labels`

**Card**: Centered text (`text-center`), generous padding (`py-8`)

---

## Error Handling

### Validation Errors

**Client-Side** (before submission):
- Role not selected: Submit button disabled, no error shown
- No items answered: Submit button enabled (skip all is valid)

**Server-Side** (from API):
- Invalid payload: 400 error, shows message
- Server error: 500 error, shows generic "Failed to submit assessment"

**Error Display**:
```svelte
{#if error}
  <div class="mt-4 p-3 bg-alert/10 border border-alert/30 rounded-lg text-alert text-sm">
    {error}
  </div>
{/if}
```

Position: Above SubmitSection, below MatrixTable

---

## Implementation Notes

### Implicit Skip Pattern (Ch.26.3)

**No explicit skip button**. Items not answered are simply omitted from submission:

```typescript
// Only items in responses Map are submitted
const payload = {
  responses: Array.from(responses.entries()).map(([item_id, rating_value]) => ({
    item_id,
    rating_value
  }))
};
```

Skipped items produce no `responses` table row.

### Scale Type Switching (Ch.26.4)

**ItemRow** delegates to ButtonScale or SliderScale based on `max_rating`:

```typescript
{#if item.max_rating <= 5}
  <ButtonScale {item} ... />
{:else}
  <SliderScale {item} ... />
{/if}
```

Current implementation: All items use ButtonScale (max_rating=5). Future: Mixed matrices with sliders.

### Session Tracking (Ch.09.3)

**Session Hash**: SHA-256 hash of browser fingerprint (or fallback for non-HTTPS)
**Persistence**: Stored in localStorage as `session_hash`
**Purpose**: Link multiple assessment responses from same participant
**Privacy**: Anonymous - no user_id in MVP (future: authenticated sessions)

**Source**: `session-id.ts:1-31`, `sessionStore.ts:1-48`

---

## Future Enhancements (Out of Scope for MVP)

### Mixed Matrix Rendering (Ch.26.4.3)

Support for inventories with different scales per item:

```json
{
  "render_type": "mixed_matrices",
  "matrices": [
    {
      "render_mode": "matrix",
      "max_rating": 5,
      "rows": [/* 16 items with 5-point scale */]
    },
    {
      "render_mode": "slider",
      "max_rating": 10,
      "rows": [/* 2 items with continuous slider */]
    }
  ]
}
```

Frontend renders sections sequentially.

### Authenticated Sessions (Ch.18)

Replace `session_hash` with `user_id` (NOT NULL) in responses table. Requires:
- Authentication system
- User login/registration
- `authStore` to track current user
- Server-side session validation

**Source**: Ch.09.3.2 Note, Ch.18

### Haptic Feedback (Ch.26.9)

For native mobile apps:
- Vibration on slider touch
- Vibration on button selection
- Vibration on form submission success

---

## Performance Considerations

### Render Structure Caching

**Page Load**: Single server fetch of render structure
**Client Caching**: Data stored in page component, no refetch unless page reload
**Size**: 18 items × ~200 bytes = ~3.6 KB JSON payload

### Store Reactivity

**Svelte 5 Runes**: Fine-grained reactivity, minimal re-renders
**Derived Stores**: `answeredCount` and `canSubmit` only recompute when dependencies change
**Map/Set State**: Direct mutation triggers reactivity

### Submission Optimization

**Payload Size**: Only touched items sent (not all 18)
**Example**: 12 items answered = ~400 bytes payload vs. 18 items = ~600 bytes

---

## Testing Checklist

### Functional Tests (Playwright)

- [ ] Page loads with assessment data
- [ ] "Assessment Closed" shown when `is_open=false`
- [ ] Role selector allows choosing role
- [ ] Role selection enables item interaction
- [ ] Answering item updates progress indicator
- [ ] Submit button disabled without role
- [ ] Submit button enabled with role + 0 items (skip all is valid)
- [ ] Submit sends correct payload to API
- [ ] Success state shown after successful submit
- [ ] Error state shown on API failure
- [ ] Form can be abandoned (navigate away) without submission

### Accessibility Tests

- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical (role → items → submit)
- [ ] Arrow key navigation works in button scales
- [ ] Focus ring visible on all controls
- [ ] ARIA attributes present and correct
- [ ] Screen reader announces states correctly
- [ ] Touch targets meet 44×44px minimum
- [ ] Color contrast >= 4.5:1

### Responsive Tests

- [ ] Mobile layout shows cards, not table
- [ ] Desktop layout shows table with headers
- [ ] Breakpoint transition smooth at 768px
- [ ] Touch areas adequate on mobile
- [ ] Full-width button on mobile
- [ ] Right-aligned button on desktop

---

## Related Specifications

- **Ch.08**: Assessments (inventory application, time contexts)
- **Ch.09**: Voting and Data Capture (response model, session tracking)
- **Ch.26**: Rating UI Specification (button scales, sliders, accessibility)
- **Ch.23**: User Stories U7, U8, U15, U17, U18, P3

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-04
**Status**: Implementation Complete, Documentation Complete
