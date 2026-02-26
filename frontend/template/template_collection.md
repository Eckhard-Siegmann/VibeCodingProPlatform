# VibeCoding Frontend Template Collection

**Version**: 1.1.0
**Last Updated**: 2026-02-26
**Purpose**: Comprehensive design system and component library for the VibeCoding Professionals event platform

---

## Table of Contents

1. [Design System Foundation](#1-design-system-foundation)
2. [Base UI Templates](#2-base-ui-templates)
3. [Form Templates](#3-form-templates)
4. [Rating & Assessment Templates](#4-rating--assessment-templates)
5. [Data Display Templates](#5-data-display-templates)
6. [Navigation Templates](#6-navigation-templates)
7. [Problem Card Templates](#7-problem-card-templates)
8. [Dashboard Templates](#8-dashboard-templates)
9. [Live Interaction Templates](#9-live-interaction-templates)
10. [Results & Analytics Templates](#10-results--analytics-templates)
11. [Accessibility Patterns](#11-accessibility-patterns)
12. [Responsive Patterns](#12-responsive-patterns)
13. [Animation Patterns](#13-animation-patterns)
14. [Empty States](#14-empty-states)
15. [Design Token Quick Reference](#15-design-token-quick-reference)

---

## 0. Component Library Architecture (shadcn-svelte)

**Added 2026-02-04**: The platform uses a shadcn-svelte inspired component architecture.

### 0.1 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | SvelteKit 2.x + Svelte 5 | Uses runes (`$state`, `$derived`, `$props`) |
| Styling | Tailwind CSS 4.x | `@theme` directive in `app.css` |
| Component Primitives | bits-ui | Headless accessible components |
| Class Utilities | clsx + tailwind-merge | Via `cn()` helper |
| Icons | @lucide/svelte | Icon library |

### 0.2 Component Directory Structure

```
src/lib/components/ui/
├── card/                    # Card family (barrel export)
│   ├── card.svelte
│   ├── card-header.svelte
│   ├── card-title.svelte
│   ├── card-content.svelte
│   ├── card-footer.svelte
│   └── index.ts
├── badge/                   # Status badges (barrel export)
│   ├── badge.svelte
│   └── index.ts
├── button/                  # Action buttons (barrel export)
│   ├── button.svelte
│   └── index.ts
├── alert-dialog/            # Modal dialogs (bits-ui based)
│   ├── alert-dialog-*.svelte
│   └── index.ts
├── ConfirmDialog.svelte     # High-level confirmation modal
└── LoadingSpinner.svelte    # Loading indicator
```

### 0.3 Import Patterns

**REQUIRED**: Use barrel exports for shadcn-style components:

```svelte
<!-- Correct: Named imports from barrel -->
import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';

<!-- Correct: Direct import for standalone components -->
import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

<!-- WRONG: Old direct imports (DEPRECATED) -->
import Card from '$lib/components/ui/Card.svelte';      // NO!
import Button from '$lib/components/ui/Button.svelte';  // NO!
```

### 0.4 The cn() Utility

Located at `src/lib/utils.ts`, merges Tailwind classes with conflict resolution:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage in components:
```svelte
<div class={cn('base-class', condition && 'conditional', className)}>
```

### 0.5 Component Status Changes

| Component | Status | Notes |
|-----------|--------|-------|
| `ui/Card.svelte` | **REMOVED** | Replaced by `ui/card/` (barrel export) |
| `ui/Button.svelte` | **REMOVED** | Replaced by `ui/button/` (barrel export) |
| `ui/Separator.svelte` | **REMOVED** | Replaced by `ui/etched-separator/EtchedSeparator.svelte` |
| `ui/etched-separator/` | **AVAILABLE** | For major page section breaks only (see Section 2.3) |

**Design Principle Update (2026-02-05)**: Visual depth via shadow elevation for component-internal separation. Etched 3D separators for major page-level section breaks (un-deprecated per Decision #8).

---

## 1. Design System Foundation

### 1.1 Three-Layer Background Hierarchy

The core visual pattern creating depth through layered backgrounds:

**Layers**:
| Layer | Color | CSS Variable | Usage |
|-------|-------|--------------|-------|
| **Viewport** (Rear) | `#DCEBFF` | `--color-viewport` | Body background, immersive blue environment |
| **Canvas** (Middle) | `#F1F2F8` | `--color-canvas` | Container for content, light grey surface |
| **Card** (Front) | `#FEFEFE` | `--color-card` | Individual content blocks, white surface |

**Implementation**:
```svelte
<body class="bg-viewport">
  <div class="bg-canvas max-w-3xl mx-auto rounded-[var(--radius-card-lg)] shadow-[var(--shadow-canvas)]">
    <Card elevation="resting">
      <!-- Content here -->
    </Card>
  </div>
</body>
```

**Source**: Style Guide, `app.css:6-8`, `PageContainer.svelte`

### 1.2 Shadow & Elevation System

Graduated shadow system for depth perception:

| Elevation | Token | Value | Use Case |
|-----------|-------|-------|----------|
| **None** | `--shadow-none` | `none` | Flat elements, nested cards |
| **Small** | `--shadow-sm` | `0px 1px 2px rgba(0,0,0,0.03)` | Subtle lift, inactive states |
| **Card (Resting)** | `--shadow-card` | `0px 1px 3px rgba(0,0,0,0.05)` | Standard content cards |
| **Medium** | `--shadow-md` | `0px 4px 8px rgba(127,145,175,0.08)` | Hover states, active cards |
| **Large** | `--shadow-lg` | `0px 12px 24px rgba(127,145,175,0.12)` | Prominent panels |
| **Floating** | `--shadow-floating` | `0px 20px 40px rgba(127,145,175,0.15)` | Modals, popovers, critical dialogs |
| **Canvas** | `--shadow-canvas` | `0px 2px 6px rgba(127,145,175,0.06)` | Canvas container on viewport |

**Usage**: Always use via the `Card` component's `elevation` prop:
```svelte
<Card elevation="flat">Nested card</Card>
<Card elevation="resting">Standard card</Card>
<Card elevation="floating">Modal dialog</Card>
```

**Source**: Style Guide, `app.css:58-64`, `Card.svelte`

### 1.3 Typography System

| Role | Color | CSS Variable | Use Case |
|------|-------|--------------|----------|
| **Primary Headers** | `#192A4B` | `--color-headers` | H1-H3, important values, primary text |
| **Secondary/Labels** | `#7B7C90` | `--color-labels` | Descriptions, field labels, axis labels |
| **Meta/Tertiary** | `#7F91AF` | `--color-meta` | Timestamps, minor legends, helper text |

**Font Family**: System UI stack (defined in `app.css:79`)
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Source**: Style Guide:22-25, `app.css:10-14`

### 1.4 Color Tokens

**Primary & Secondary**:
```css
--color-primary: #2680F1          /* Blue - primary actions, links */
--color-primary-hover: #2A87F7    /* Hover state */
--color-secondary: #DCE4EA        /* Secondary UI elements */
--color-secondary-dark: #BEC8DD   /* Secondary hover */
```

**Status Colors**:
```css
--color-success: #55B368          /* Green - ready, accepted, saved */
--color-alert: #D95A5C            /* Red - rejected, error, dropped */
--color-pending: #EAB308          /* Yellow - submitted, needs_changes */
--color-warning: #EC7C26          /* Orange - needs attention */
--color-warning-bg: #FEF3E6       /* Warning background */
--color-purple: #8B5CF6           /* Purple - selected_for_coding */
--color-purple-bg: #F3F0FF        /* Purple background */
```

**Problem Visualization Colors** (8 colors for scatter/histogram):
```css
--color-problem-1: #D95A5C   /* Red */
--color-problem-2: #2680F1   /* Blue */
--color-problem-3: #55B368   /* Green */
--color-problem-4: #EAB308   /* Yellow */
--color-problem-5: #EC7C26   /* Orange */
--color-problem-6: #06B6D4   /* Cyan */
--color-problem-7: #D946EF   /* Magenta */
--color-problem-8: #84CC16   /* Lime */
```

**Separator (Etched 3D Effect)**:
```css
--color-etch-top: #EDEEF5       /* Inner shadow simulation */
--color-etch-bottom: #EFF1F5    /* Light catch simulation */
```

**Icons**:
```css
--color-icon: #455878           /* Dark blue-grey for icons */
```

**Source**: Style Guide, `app.css:4-49`

### 1.5 Border Radius

```css
--radius-card: 12px      /* Standard cards, buttons, inputs */
--radius-card-lg: 16px   /* Canvas container, large cards */
```

**Source**: Style Guide:43-45, `app.css:54-55`

### 1.6 Spacing Scale

Uses Tailwind's default spacing scale:
- `p-3` = 12px
- `p-4` = 16px
- `p-5` = 20px
- `p-6` = 24px
- `p-8` = 32px

**Gaps between cards**: `space-y-4` (16px) or `space-y-6` (24px)

### 1.7 Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default (mobile) | < 640px | Vertical stacks, full-width |
| `sm:` | >= 640px | Landscape phone |
| `md:` | >= 768px | Tablet, side-by-side layouts |
| `lg:` | >= 1024px | Desktop, multi-column |

**Source**: Ch.26.7.1

---

## 2. Base UI Templates

### 2.1 Button Component

**File**: `frontend/query/src/lib/components/ui/button/button.svelte`
**Import**: `import { Button } from '$lib/components/ui/button';`

**Purpose**: Primary interactive control across the platform

**Props Interface**:
```typescript
interface Props extends HTMLButtonAttributes {
  children: Snippet;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}
```

**Variants**:
| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `default` | `bg-primary` | `text-white` | None | Main CTAs, submit actions |
| `secondary` | `bg-secondary` | `text-headers` | `border-secondary-dark` | Cancel, secondary actions |
| `ghost` | `transparent` | `text-headers` | None | Tertiary actions, inline links |
| `destructive` | `bg-alert` | `text-white` | None | Dangerous/delete actions |
| `outline` | `transparent` | `text-headers` | `border-secondary-dark` | Alternative secondary |
| `link` | `transparent` | `text-primary` | None | Text-only link style |

**Sizes**:
| Size | Height | Padding | Font | Usage |
|------|--------|---------|------|-------|
| `sm` | `min-h-[36px]` | `px-3 py-1.5` | `text-sm` | Compact contexts |
| `md` | `min-h-[44px]` | `px-4 py-2` | `text-base` | Default, WCAG compliant |
| `lg` | `min-h-[52px]` | `px-6 py-3` | `text-lg` | Primary CTAs, mobile |

**States**:
- **Default**: Solid color, no shadow
- **Hover**: Darker shade (`bg-primary-hover`)
- **Active**: Same as hover (no distinct active state)
- **Disabled**: `opacity-50`, `cursor-not-allowed`
- **Focus**: 2px `outline-primary` with 2px offset

**Accessibility**:
- Minimum touch target: 44x44px (md size)
- Focus-visible outline
- Disabled state prevents interaction
- Full keyboard support (Space, Enter)

**Code Example**:
```svelte
<Button variant="default" size="md" onclick={handleSubmit}>
  Submit Assessment
</Button>

<Button variant="secondary" fullWidth onclick={handleCancel}>
  Cancel
</Button>

<Button variant="ghost" size="sm" disabled>
  Not Available
</Button>
```

**User Stories**: All interactive user stories (U1-U33, P1-P18, M1-M26, A1-A18)

**Source**: `ui/button/button.svelte`

### 2.2 Card Component

**File**: `frontend/query/src/lib/components/ui/card/card.svelte`
**Import**: `import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';`

**Purpose**: Container primitive for all content blocks, implements three-layer depth system

**Props Interface**:
```typescript
interface Props {
  children: Snippet;
  class?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'flat' | 'resting' | 'raised' | 'floating';
}
```

**Padding Options**:
| Padding | Classes | Usage |
|---------|---------|-------|
| `none` | No padding | Custom content, edge-to-edge images |
| `sm` | `p-3` (12px) | Compact cards |
| `md` | `p-4 md:p-5` (16px → 20px) | Default, most cards |
| `lg` | `p-5 md:p-6` (20px → 24px) | Prominent cards, dialogs |

**Elevation Options**:
| Elevation | Shadow | Usage |
|-----------|--------|-------|
| `flat` | `shadow-none` | Nested cards, no lift needed |
| `resting` | `shadow-card` | Default for content cards |
| `raised` | `shadow-md` | Hover states, active cards |
| `floating` | `shadow-floating` | Modals, popovers, dramatic lift |

**Code Example**:
```svelte
<!-- Standard content card -->
<Card elevation="resting" padding="md">
  <h2>Content Title</h2>
  <p>Card content...</p>
</Card>

<!-- Floating dialog -->
<Card elevation="floating" padding="lg">
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>
  <div class="flex gap-3">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</Card>

<!-- Nested card (flat) -->
<Card elevation="resting">
  <h2>Outer Card</h2>
  <Card elevation="flat" padding="sm">
    Nested content without additional shadow
  </Card>
</Card>
```

**Sub-components**:
- `CardHeader` — Flex container for title area
- `CardTitle` — Styled h3 heading
- `CardContent` — Content wrapper
- `CardFooter` — Footer with flex layout

**Accessibility**:
- Semantic `<div>` with no interactive role
- If clickable, wrap in `<button>` or add role/handlers

**User Stories**: All visual presentation (foundation for all content)

**Source**: `ui/card/card.svelte`

### 2.3 EtchedSeparator Component

**File**: `ui/etched-separator/etched-separator.svelte`
**Import**: `import { EtchedSeparator } from '$lib/components/ui/etched-separator';`

**Purpose**: Visual 3D groove separator for major page section breaks

**CRITICAL USAGE GUIDANCE**:
- **USE FOR**: Page-level major section divisions (between Cards on pages)
- **DO NOT USE FOR**: Component-internal separation (use spacing + shadows)

**Implementation**:
Two stacked 1px divs creating etched groove effect:
- Top line: `bg-[var(--color-etch-top)]` (#EDEEF5)
- Bottom line: `bg-[var(--color-etch-bottom)]` (#EFF1F5)
- Total height: 2px
- Full-width by default

**Props**:
```typescript
interface Props {
  orientation?: 'horizontal' | 'vertical';
  class?: string;
}
```

**Code Example**:
```svelte
<Card elevation="resting">
  <ProblemHeader />
  <ProblemContent />
</Card>

<EtchedSeparator />  <!-- Between major Cards -->

<Card elevation="resting">
  <AssessmentLinks />
</Card>

<EtchedSeparator />

<Card elevation="resting">
  <TeamSection />
</Card>
```

**Where Used**:
- Problem Card: Between Description | Assessments | Lessons | Team | Chat | Decisions
- Dashboards: Between major sections
- Admin pages: Between form sections

**Visual Principle**: Etched separator for page structure, spacing+shadows for component structure.

**Accessibility**: `role="separator"`, `aria-orientation="horizontal"`

**Source**: Style Guide "Etched 3D Separator Effect", Ch.26.11 (un-deprecation per Decision #8, 2026-02-05).

### 2.4 ConfirmDialog Component

**File**: `frontend/query/src/lib/components/ui/ConfirmDialog.svelte`
**Import**: `import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';`
**Built on**: `bits-ui` AlertDialog primitives (see `ui/alert-dialog/`)

**Purpose**: Modal confirmation for important or destructive actions

**Props Interface**:
```typescript
interface Props {
  open: boolean;                // bindable
  title: string;
  message: string;
  confirmLabel?: string;        // Default: 'Confirm'
  cancelLabel?: string;         // Default: 'Cancel'
  variant?: 'default' | 'danger';
  showCancel?: boolean;         // Default: true
  onConfirm: () => void;
  onCancel?: () => void;
}
```

**Variants**:
| Variant | Confirm Button Color | Usage |
|---------|---------------------|-------|
| `default` | `bg-primary` (blue) | Standard confirmations |
| `danger` | `bg-alert` (red) | Destructive actions (delete, drop) |

**Visual Specification**:
- Backdrop: `bg-black/50`, fixed inset-0, z-50
- Dialog: Card with floating shadow (40px shadow)
- Max width: 448px (`max-w-md`)
- Padding: 24px
- Button layout: Right-aligned flex with 12px gap

**Behavior**:
- Escape key closes (calls `onCancel`)
- Backdrop click closes (calls `onCancel`)
- Focus trap within dialog (via bits-ui AlertDialog)
- Animated transitions (fade, scale)

**States**:
- **Closed**: `open={false}`, component unmounted
- **Opening**: Fade-in + scale animation
- **Open**: Interactive, focus trapped
- **Closing**: Fade-out animation

**Accessibility** (via bits-ui AlertDialog):
- Proper focus management and trapping
- `aria-modal="true"`
- `aria-labelledby` for title
- `aria-describedby` for description
- Returns focus on close

**Code Example**:
```svelte
<script>
  let confirmOpen = $state(false);

  function handleDelete() {
    confirmOpen = true;
  }

  function confirmDelete() {
    // Perform deletion
    confirmOpen = false;
  }
</script>

<Button variant="secondary" onclick={handleDelete}>Delete Problem</Button>

<ConfirmDialog
  open={confirmOpen}
  title="Delete Problem?"
  message="This action cannot be undone. All versions and history will be deleted."
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => confirmOpen = false}
/>
```

**User Stories**: P15 (Clone), M22 (Drop), destructive actions across platform

**Source**: `ConfirmDialog.svelte:1-52`

### 2.5 LoadingSpinner Component

**File**: `frontend/query/src/lib/components/ui/LoadingSpinner.svelte`

**Purpose**: Visual loading indicator for async operations

**Props Interface**:
```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}
```

**Sizes**:
| Size | Dimensions | Usage |
|------|-----------|-------|
| `sm` | 16x16px | Inline with text, button loading |
| `md` | 24x24px | Default, card content loading |
| `lg` | 32x32px | Page-level loading |

**Visual**: SVG circle animation, `stroke: var(--color-primary)`

**Code Example**:
```svelte
<!-- Page loading -->
<div class="flex justify-center py-12">
  <LoadingSpinner size="lg" />
</div>

<!-- Button loading state -->
<Button disabled>
  <LoadingSpinner size="sm" class="mr-2" />
  Submitting...
</Button>
```

**Accessibility**:
- `role="status"`
- `aria-label="Loading"`
- Respects `prefers-reduced-motion` (static fallback)

**Source**: `LoadingSpinner.svelte`

### 2.6 Additional Core UI Components (2026-02-05 Update)

**37 new components added in template session**. Full specifications in Ch.26.11-26.15. Quick reference:

**Dialog System** (Section 2.6-2.8):
- `ui/form-dialog/` - Modal dialogs with form inputs (add resource, assign deputy, etc.)
- `ui/info-dialog/` - Read-only information dialogs (help, explanations)
- `ui/confirm-dialog/` - Yes/no confirmations (already documented above as 2.4)

**Feedback & Loading** (Section 2.9-2.10):
- `ui/toast/` - Toast, ToastQueue, Toaster (corner notifications, 4 variants)
- `ui/skeleton/` - SkeletonCard, SkeletonList, SkeletonText, SkeletonAvatar (loading placeholders)
- `ui/empty-state/` - Generic empty state with config objects

**Navigation & Interaction** (Section 2.11-2.13):
- `ui/initial-avatar/` - Colored circle with user initials (3 sizes, 8 colors)
- `ui/accordion-section/` - Collapsible sections with animation
- `ui/back-button/` - Hierarchical navigation
- `ui/action-menu/` - Three-dot menu (⋮)
- `ui/tooltip/` - Hover hints (bits-ui wrapper)
- `ui/info-panel/` - Expandable help panels

**Form Inputs** (documented in Section 3):
- `ui/select/` - Searchable dropdown (bits-ui)
- `ui/checkbox/` - Standard checkbox
- `ui/date-picker/` - Native mobile, bits-ui desktop
- `ui/time-picker/` - Native time input
- `ui/file-upload/` - Drag-drop desktop, click mobile

**Data Display** (documented in Section 5):
- `ui/data-table/` - Responsive table (desktop=table, mobile=cards)
- `ui/table-card/` - Mobile card view for table rows
- `ui/filter-bar/` - FilterBar, FilterBottomSheet, FilterDropdown, FilterCheckbox

**Scalable List Views** (added 2026-02-25, documented in Section 5.4–5.6):
- `ui/SearchBar.svelte` - Debounced search input (300ms, min 2 chars, Escape clears)
- `ui/ListFilterBar.svelte` - Desktop dropdown selects / mobile pill bar with AND logic
- `ui/Pagination.svelte` - Desktop numbered pages / mobile prev-next, standard response shape

**Charts** (documented in Section 10):
- `charts/BarChart.svelte` - Chart.js wrapper for bar charts
- `charts/LineChart.svelte` - Chart.js wrapper for line charts
- `charts/SparkLine.svelte` - Inline micro-visualizations

**See Ch.26.11-26.15 for complete specifications of all components.**

---

## 3. Form Templates

### 3.1 EditableField Component (Auto-Save Pattern)

**File**: `frontend/query/src/lib/components/problem/EditableField.svelte`

**Purpose**: Text input/textarea with debounced auto-save and visual feedback

**Props Interface**:
```typescript
interface Props {
  type: 'text' | 'textarea' | 'url' | 'number';
  value: string | number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;               // For textarea only
  maxlength?: number;
  required?: boolean;
  onchange: (value: string | number) => Promise<void>;
  class?: string;
}
```

**States**:
| State | Border Color | Status Text | Duration |
|-------|-------------|-------------|----------|
| **Idle** | `border-secondary` | (none) | -- |
| **Saving** | `border-pending` (yellow) | "Saving..." | Until save completes |
| **Saved** | `border-success` (green) | "Saved" | 2000ms, then revert to idle |
| **Error** | `border-alert` (red) | "Error: {message}" | Until next input |

**Debounce Behavior**:
- 300ms debounce on typing
- Immediate save on blur (focus loss)
- Status text shows under field

**Visual Specification**:
```svelte
<div class="space-y-1">
  {#if label}
    <label class="block text-sm font-medium text-headers">{label}</label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      class="w-full px-3 py-2 border-2 rounded-lg transition-colors
             {borderColorClass} focus:outline-none focus:ring-2 focus:ring-primary/50"
      bind:value={localValue}
      oninput={handleInput}
      onblur={handleBlur}
      {placeholder}
      {disabled}
      {rows}
      {maxlength}
    />
  {:else}
    <input
      {type}
      class="w-full px-3 py-2 border-2 rounded-lg transition-colors
             {borderColorClass} focus:outline-none focus:ring-2 focus:ring-primary/50"
      bind:value={localValue}
      oninput={handleInput}
      onblur={handleBlur}
      {placeholder}
      {disabled}
    />
  {/if}

  {#if statusText}
    <p class="text-xs {statusColorClass}">{statusText}</p>
  {/if}
</div>
```

**Accessibility**:
- Label associated with input
- Required fields marked
- Error messages use `role="alert"`
- Focus ring visible

**User Stories**: P2 (Auto-save), P5 (Update Problem), editable fields across platform

**Source**: `EditableField.svelte:1-89`, `ProblemHeader.svelte:30-76` (inline variant)

### 3.2 RoleSelector Component

**File**: `frontend/query/src/lib/components/assessment/RoleSelector.svelte`

**Purpose**: Self-declare role for assessment (once per problem)

**Props Interface**:
```typescript
interface Props {
  value: Role | null;
  onchange: (role: Role) => void;
  disabled?: boolean;
}

type Role = 'observer' | 'developer' | 'problem_owner' | 'moderator' | 'admin';
```

**Visual Design**: Radio card group (horizontal on desktop, vertical on mobile)

**Roles Displayed** (subset for assessment context):
| Role | Label | Description |
|------|-------|-------------|
| `observer` | Observer | Watching and learning |
| `developer` | Developer | Actively working on solutions |
| `problem_owner` | Problem Owner | Created this problem |

**States**:
- **Unselected**: Border `border-secondary`, background `bg-card`
- **Hover**: Border `border-primary/50`, background `bg-canvas/30`
- **Selected**: Border `border-primary`, background `bg-primary/5`
- **Disabled**: `opacity-50`, not interactive

**Code Example**:
```svelte
<RoleSelector
  value={currentRole}
  onchange={(role) => handleRoleChange(role)}
  disabled={submitting}
/>
```

**Accessibility**:
- `role="radiogroup"`
- Each card: `role="radio"`, `aria-checked`
- Keyboard: Arrow keys navigate, Space/Enter select

**User Stories**: U7 (Vote During Pitch), U15 (Set Presence), all assessments

**Source**: `RoleSelector.svelte:1-76`

---

## 4. Rating & Assessment Templates

### 4.1 ButtonScale Component (5-Point Scale)

**File**: `frontend/query/src/lib/components/rating/ButtonScale.svelte`

**Purpose**: Discrete button radio group for ratings <= 5 points

**Props Interface**:
```typescript
interface Props {
  itemId: string;
  itemLabel: string;
  headers: ScaleHeader[];       // [{rating_value: 1, label: "Poor"}, ...]
  value: number | null;
  disabled?: boolean;
  onchange: (itemId: string, value: number) => void;
}
```

**Responsive Layouts**:

**Mobile (<640px)**: Vertical stack, full-width tappable rows
```
┌───────────────────────┐
│ ○  Poor               │ 44px min-height
├───────────────────────┤
│ ○  Fair               │ 16px gap
├───────────────────────┤
│ ○  Good               │
├───────────────────────┤
│ ○  Very Good          │
├───────────────────────┤
│ ○  Excellent          │
└───────────────────────┘
```

**Desktop (>=768px)**: Horizontal radio buttons
```
○ Poor  ○ Fair  ○ Good  ○ Very Good  ○ Excellent
```

**States** (per button):
| State | Visual | Behavior |
|-------|--------|----------|
| **Unchecked** | Grey border circle, hollow | Clickable |
| **Hover** | Blue tint, border thickens | Shows interactivity |
| **Checked** | Blue filled circle with inner dot | Selected, can re-select another |
| **Disabled** | Grey, opacity-50 | Not clickable |

**Keyboard Navigation**:
- Tab: Focus group
- Arrow Left/Right: Navigate within group
- Arrow Up/Down: Navigate on mobile
- Home: Select min rating
- End: Select max rating
- Space/Enter: Confirm selection

**Accessibility**:
- `role="radiogroup"` on container
- `aria-label="{itemLabel}"` on group
- Each button: `role="radio"`, `aria-checked="{selected}"`
- Touch targets: 44x44px minimum
- 16px gap between buttons

**Code Example**:
```svelte
<ButtonScale
  itemId="correctness_01"
  itemLabel="Correctness"
  headers={[
    { rating_value: 1, label: "Poor" },
    { rating_value: 2, label: "Fair" },
    { rating_value: 3, label: "Good" },
    { rating_value: 4, label: "Very Good" },
    { rating_value: 5, label: "Excellent" }
  ]}
  value={currentRating}
  disabled={false}
  onchange={(id, val) => handleRatingChange(id, val)}
/>
```

**User Stories**: U7 (Vote Pitch), U17 (Review Assessment), all rating scenarios

**Source**: `ButtonScale.svelte:1-156`, Ch.26.5, Ch.26.6

### 4.2 SliderScale Component (10-Point Continuous)

**File**: `frontend/query/src/lib/components/rating/SliderScale.svelte`

**Purpose**: Continuous slider for 10-point ratings, NO numeric display

**Props Interface**:
```typescript
interface Props {
  itemId: string;
  itemLabel: string;
  labelMin: string;
  labelMax: string;
  value: number | null;
  disabled?: boolean;
  onchange: (itemId: string, value: number) => void;
}
```

**CRITICAL REQUIREMENT**: Slider MUST NOT display numeric values (Ch.26.2)

**Visual Specification**:

**Mobile (<640px)**: Vertical layout, labels above/below
```
┌─────────────────────┐
│ Very low            │
│  ●━━━━━━━━━━━━━━○   │  Gradient fill from start to thumb
│ Extremely high      │
└─────────────────────┘
```

**Desktop (>=768px)**: Horizontal with labels on sides
```
Very low load                                  Extremely high
    ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○
```

**States**:
| State | Thumb Opacity | Track Style | Data Value |
|-------|--------------|-------------|------------|
| **Untouched** | 50% | Dashed (to be impl.) | `null` |
| **Touched** | 100% | Solid with gradient fill | Pending |
| **Released** | 100% | Solid, confirmation animation | Integer 1-10 stored |

**Gradient Fill**: From slider start to thumb position, `bg-primary`

**Keyboard Navigation**:
- Arrow Left/Right: Move by +/-0.5
- Home: Jump to value 1
- End: Jump to value 10
- Tab: Focus next item

**Accessibility**:
- `role="slider"`
- `aria-label="{itemLabel}"`
- `aria-valuemin="1"`, `aria-valuemax="10"`
- `aria-valuenow="{currentValue}"`
- `aria-valuetext="{semanticValue}"` where:
  - 1-3: "Low"
  - 4-6: "Medium"
  - 7-10: "High"

**Code Example**:
```svelte
<SliderScale
  itemId="cognitive_load_01"
  itemLabel="Cognitive Load"
  labelMin="Very low load"
  labelMax="Extremely high"
  value={currentValue}
  disabled={false}
  onchange={(id, val) => handleRatingChange(id, val)}
/>
```

**User Stories**: Future mixed-matrix assessments (Ch.26.4.3)

**Source**: `SliderScale.svelte`, Ch.26.2, Ch.26.6.3

### 4.3 MatrixTable Component

**File**: `frontend/query/src/lib/components/assessment/MatrixTable.svelte`

**Purpose**: Responsive table layout for assessment items

**Props Interface**:
```typescript
interface Props {
  matrix: Matrix;
  responses: Map<string, number | null>;
  disabled?: boolean;
  onresponse: (itemId: string, value: number) => void;
}

interface Matrix {
  max_rating: number;
  common_headers: ScaleHeader[];
  rows: Item[];
}
```

**Desktop Layout (>=768px)**:
```
┌─────────────────────────────────────────────────────────┐
│ Criteria        │  Poor  │  Fair  │  Good  │  V.Good │  Exc. │
├─────────────────┼────────┼────────┼────────┼─────────┼───────┤
│ Correctness     │   ○    │   ○    │   ○    │    ○    │   ○   │ Even row: bg-card
├─────────────────┼────────┼────────┼────────┼─────────┼───────┤
│ Readability     │   ○    │   ○    │   ●    │    ○    │   ○   │ Odd row: bg-canvas/30
├─────────────────┼────────┼────────┼────────┼─────────┼───────┤
```

**Mobile (<640px)**: Stacked cards, one per item

**Accessibility**:
- Column headers use ScaleLabels component
- Each ItemRow is independently accessible
- No table semantics (uses divs for responsive flexibility)

**Code Example**:
```svelte
<MatrixTable
  matrix={assessmentMatrix}
  responses={$responsesStore.responses}
  disabled={submitting || !roleSelected}
  onresponse={(id, val) => responsesStore.setResponse(id, val)}
/>
```

**Source**: `MatrixTable.svelte:1-60`

### 4.4 ItemRow Component

**File**: `frontend/query/src/lib/components/assessment/ItemRow.svelte`

**Purpose**: Individual assessment item with responsive layout and adaptive scale

**Props Interface**:
```typescript
interface Props {
  item: Item;
  headers: ScaleHeader[];
  value: number | null;
  disabled?: boolean;
  index: number;              // For alternating row colors
  onchange: (itemId: string, value: number) => void;
}
```

**Layout Modes**:

**Desktop (>=768px)**: Two-column
```
┌─────────────────────────────────────────────────────────┐
│  1/3 width          │  2/3 width                         │
│  Label + Description│  ButtonScale or SliderScale        │
└─────────────────────────────────────────────────────────┘
```

**Mobile (<640px)**: Card layout
```
┌─────────────────────┐
│ Label               │
│ Description text... │
│                     │
│ ○  Poor             │
│ ○  Fair             │
│ ○  Good             │
└─────────────────────┘
```

**Alternating Rows**:
- Even index: `bg-card` (white)
- Odd index: `bg-canvas/30` (subtle grey)

**Scale Selection Logic**:
```typescript
if (item.max_rating <= 5) {
  // Use ButtonScale
} else {
  // Use SliderScale
}
```

**Code Example**:
```svelte
{#each matrix.rows as item, index}
  <ItemRow
    {item}
    headers={matrix.common_headers}
    value={responses.get(item.item_id)}
    disabled={submitting}
    {index}
    onchange={handleResponse}
  />
{/each}
```

**Source**: `ItemRow.svelte:1-96`

### 4.5 ProgressIndicator Component

**File**: `frontend/query/src/lib/components/assessment/ProgressIndicator.svelte`

**Purpose**: Shows count of answered items

**Props Interface**:
```typescript
interface Props {
  answered: number;
  total: number;
  class?: string;
}
```

**Visual**:
```
12 of 18 items answered
```

**Code Example**:
```svelte
<ProgressIndicator answered={$answeredCount} total={totalItems} class="mb-6" />
```

**Source**: `ProgressIndicator.svelte`

### 4.6 SubmitSection Component

**File**: `frontend/query/src/lib/components/assessment/SubmitSection.svelte`

**Purpose**: Submit button with skip count and state management

**Props Interface**:
```typescript
interface Props {
  canSubmit: boolean;
  submitting: boolean;
  answeredCount: number;
  totalCount: number;
  onsubmit: () => void;
}
```

**Visual**:
```
Skipping 6 items             [Submit Assessment →]
```

**States**:
- Disabled: `canSubmit=false` (no role selected or already submitted)
- Loading: `submitting=true`, shows LoadingSpinner in button

**Code Example**:
```svelte
<SubmitSection
  canSubmit={roleSelected && !submitted}
  {submitting}
  answeredCount={answered}
  totalCount={totalItems}
  onsubmit={handleSubmit}
/>
```

**Source**: `SubmitSection.svelte:1-27`

---

## 5. Data Display Templates

### 5.1 State Badge Pattern

**File**: `frontend/query/src/lib/components/problem/StateIndicators.svelte`
**Uses**: `import { Badge } from '$lib/components/ui/badge';`

**Purpose**: Display readiness and action state as colored pill badges

**Props Interface**:
```typescript
interface Props {
  readinessState: ReadinessState;
  actionState: ActionState;
  class?: string;
}

type ReadinessState = 'draft' | 'submitted' | 'needs_changes' | 'ready' | 'rejected';
type ActionState = 'backlog' | 'selected_for_event' | 'selected_for_coding' | 'deferred' | 'dropped' | 'closed';
```

**Badge Component** (`ui/badge/badge.svelte`):

The Badge component has built-in variants for all states. Import and use directly:
```svelte
import { Badge } from '$lib/components/ui/badge';

<Badge variant="ready">Ready</Badge>
<Badge variant="selected_for_coding">Coding</Badge>
```

**Readiness State Variants**:
| Variant | Background | Text | Meaning |
|---------|-----------|------|---------|
| `draft` | `bg-canvas` | `text-meta` | Being authored |
| `submitted` | `bg-amber-100` | `text-amber-700` | Under review |
| `needs_changes` | `bg-warning-bg` | `text-warning` | Feedback received |
| `ready` | `bg-green-100` | `text-success` | Quality gate passed |
| `rejected` | `bg-red-100` | `text-alert` | Did not pass review |

**Action State Variants**:
| Variant | Background | Text | Meaning |
|---------|-----------|------|---------|
| `backlog` | `bg-canvas` | `text-labels` | Available for future |
| `selected_for_event` | `bg-blue-100` | `text-primary` | Planned for event |
| `selected_for_coding` | `bg-purple-bg` | `text-purple` | Currently being worked on |
| `deferred` | `bg-warning-bg` | `text-warning` | Postponed |
| `dropped` | `bg-red-100` | `text-alert` | Removed from consideration |
| `closed` | `bg-green-100` | `text-success` | Completed |

**Generic Badge Variants** (for other uses):
| Variant | Usage |
|---------|-------|
| `default` | Primary blue tint |
| `secondary` | Gray background |
| `outline` | Border only |
| `destructive` | Red/alert style |

**Visual**: Rounded-full pill, `text-xs`, `font-medium`, `px-2.5 py-0.5`

**Enhancement Needed** (Ch.13.6.2): Add tooltip with explanation text:
```svelte
<span
  class="..."
  title="Quality gate passed! This problem can be pitched."
>
  Ready
</span>
```

**Code Example**:
```svelte
<StateIndicators
  readinessState="ready"
  actionState="selected_for_coding"
/>
```

**Source**: `StateIndicators.svelte:1-61`, Ch.13.1

### 5.2 VersionBadge Component

**File**: `frontend/query/src/lib/components/problem/VersionBadge.svelte`

**Purpose**: Display major and minor version identifiers

**Props Interface**:
```typescript
interface Props {
  majorVersion: number;
  minorVersion?: number | null;
  class?: string;
}
```

**Visual**: `v{major}.{minor}` format (e.g., "v2.03")

**Code Example**:
```svelte
<VersionBadge majorVersion={2} minorVersion={3} />
<!-- Displays: "v2.03" -->
```

**Source**: `VersionBadge.svelte:1-20`

### 5.3 DecisionTimeline Component

**File**: `frontend/query/src/lib/components/problem/DecisionTimeline.svelte`

**Purpose**: Chronological display of decision history grouped by date

**Props Interface**:
```typescript
interface Props {
  decisions: Decision[];
  class?: string;
}

interface Decision {
  decision_id: string;
  decision_type: string;
  category: string;
  actor_name: string;
  actor_role: string;
  rationale?: string;
  is_binding: boolean;
  created_at: string;
}
```

**Visual Format**:
```
Decision History
────────────────
Feb 3, 2026
  ● Problem created (Max Mustermann)
  ● Problem submitted (Max Mustermann)

Feb 5, 2026
  ● Quality gate needs changes (Eva Schmidt, moderator)
    "Please add acceptance criteria"

Feb 6, 2026
  ● Problem updated (Max Mustermann)
  ● Quality gate accepted (Eva Schmidt, moderator)
```

**Category Colors** (left border):
| Category | Color |
|----------|-------|
| creation | `border-primary` |
| quality_gate | `border-primary` |
| event_planning | `border-success` |
| sprint_planning | `border-purple` |
| deferral | `border-pending` |
| drop | `border-alert` |
| close | `border-purple` |
| live | `border-warning` |

**Grouping**: By date (format: "MMM D, YYYY")

**Code Example**:
```svelte
<DecisionTimeline decisions={problemDecisions} />
```

**User Stories**: U27 (View Decision History), transparency

**Source**: `DecisionTimeline.svelte:1-94`, Ch.13.6.4, Ch.10

### 5.4 SearchBar Component

**Added 2026-02-25**

**File**: `frontend/query/src/lib/components/ui/SearchBar.svelte`

**Purpose**: Debounced search input for server-side filtering of list views. Used on Problem Backlog, Events Listing, Admin pages, Queue Planning, and Attendance Tracking.

**Props Interface**:
```typescript
interface Props {
  value: string;
  placeholder?: string;          // default "Search..."
  debounceMs?: number;           // default 300
  minLength?: number;            // default 2 (below 2 chars, clears filter)
  onSearch: (query: string) => void;
  class?: string;
}
```

**Visual**:
```
┌──────────────────────────────────────────┐
│ 🔍 Search problems...___________    [×] │
└──────────────────────────────────────────┘
```

**Styling**:
- Container: `relative flex items-center`
- Input: `w-full pl-10 pr-10 py-2 bg-card border border-secondary rounded-lg text-sm`
- Search icon (Lucide `Search`): `absolute left-3 w-4 h-4 text-labels`
- Clear button (Lucide `X`): `absolute right-3 w-4 h-4 text-labels hover:text-headers`, visible only when value is non-empty
- Focus: `focus:ring-2 focus:ring-primary/20 focus:border-primary`

**Behavior**:
- Debounces keystrokes by `debounceMs` (default 300ms)
- Below `minLength` (default 2 chars): Calls `onSearch("")` to clear the filter
- Escape key: Clears input and calls `onSearch("")`
- No form submission on Enter (search is live)

**ARIA**:
- `role="searchbox"`
- `aria-label="Search"` (or custom via placeholder)
- Clear button: `aria-label="Clear search"`

**Code Example**:
```svelte
<script>
  import SearchBar from '$lib/components/ui/SearchBar.svelte';
  let searchQuery = $state('');
</script>

<SearchBar
  value={searchQuery}
  placeholder="Search problems..."
  onSearch={(q) => { searchQuery = q; goto(`?search=${q}&page=1`); }}
/>
```

**Spec Source**: Ch.12.10.2, Ch.26.17.2

### 5.5 ListFilterBar Component

**Added 2026-02-25**

**File**: `frontend/query/src/lib/components/ui/ListFilterBar.svelte`

**Purpose**: Multi-filter bar with dropdown selects (desktop) and horizontal scrollable pills (mobile). Filters combine with AND logic, each change resets to page 1.

**Props Interface**:
```typescript
interface FilterConfig {
  key: string;                // URL param name (e.g., 'readiness')
  label: string;              // Display label (e.g., 'Readiness')
  options: FilterOption[];    // Available options
  defaultValue?: string;      // Default = show all (empty)
}

interface FilterOption {
  value: string;
  label: string;
  separator?: boolean;        // Visual separator before this option
}

interface Props {
  filters: FilterConfig[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  showClearAll?: boolean;     // default true
  class?: string;
}
```

**Visual (Desktop ≥768px)** — Inline dropdown selects:
```
┌──────────────────────────────────────────────────────┐
│ Readiness [All ▼]  Type [All ▼]  Location [All ▼]   │
│                                        [Clear all]   │
└──────────────────────────────────────────────────────┘
```

**Visual (Mobile <768px)** — Horizontal scrollable pill bar:
```
┌──────────────────────────────────────────┐
│ [All States] [Greenfield ✓] [Cologne ✓] │ ← Scroll →
│                              [Clear all]  │
└──────────────────────────────────────────┘
```

**Styling**:
- Desktop container: `flex items-center gap-3 flex-wrap`
- Desktop select: `<select>` styled with `bg-card border border-secondary rounded-md px-3 py-1.5 text-sm`
- Mobile container: `flex gap-2 overflow-x-auto pb-2` (horizontal scroll)
- Mobile pill (inactive): `whitespace-nowrap rounded-full px-3 py-1 text-sm bg-canvas text-labels border border-secondary`
- Mobile pill (active): `bg-primary/10 text-primary border-primary`
- "Clear all" link: `text-sm text-primary hover:text-primary-hover cursor-pointer`, hidden when all filters are default

**Behavior**:
- Filter change → calls `onFilterChange(key, newValue)` → parent resets to page 1
- "Clear all" → resets all filters to default values
- Filters combine with AND logic (server-side)

**ARIA**:
- Each select: `aria-label="{filter label}"`
- Mobile pills: `role="listbox"`, each pill `role="option"`, `aria-selected`
- Clear all: `aria-label="Clear all filters"`

**Code Example**:
```svelte
<script>
  import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';

  const filters = [
    { key: 'readiness', label: 'Readiness', options: [
      { value: '', label: 'All States' },
      { value: 'ready', label: 'Ready' },
      { value: 'submitted', label: 'Submitted' },
    ]},
    { key: 'type', label: 'Type', options: [
      { value: '', label: 'All Types' },
      { value: 'greenfield', label: 'Greenfield' },
      { value: 'brownfield', label: 'Brownfield' },
    ]},
  ];

  let filterValues = $state({ readiness: '', type: '' });
</script>

<ListFilterBar
  {filters}
  values={filterValues}
  onFilterChange={(key, val) => {
    filterValues = { ...filterValues, [key]: val };
    goto(`?${new URLSearchParams(filterValues)}&page=1`);
  }}
/>
```

**Spec Source**: Ch.12.10.3, Ch.26.17.3

### 5.6 Pagination Component

**Added 2026-02-25**

**File**: `frontend/query/src/lib/components/ui/Pagination.svelte`

**Purpose**: Server-side pagination control with desktop numbered pages and mobile simplified prev/next. All paginated endpoints return the standard `{ items, pagination: { page, pageSize, totalItems, totalPages } }` response shape (Ch.12.10.1).

**Props Interface**:
```typescript
interface Props {
  page: number;               // Current page (1-indexed)
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  class?: string;
}
```

**Visual (Desktop ≥768px)** — Numbered pages:
```
┌───────────────────────────────────────────────────────┐
│ Showing 21-40 of 247         [◀] 1 2 [3] 4 … 13 [▶] │
└───────────────────────────────────────────────────────┘
```

**Visual (Mobile <768px)** — Simplified:
```
┌──────────────────────────────────────────┐
│ [◀ Prev]   Page 3 of 13   [Next ▶]      │
└──────────────────────────────────────────┘
```

**Styling**:
- Container: `flex items-center justify-between`
- "Showing X-Y of Z" label: `text-sm text-labels` (desktop only, hidden on mobile)
- Page buttons: `w-8 h-8 rounded-md text-sm flex items-center justify-center`
  - Current page: `bg-primary text-white font-semibold`
  - Other pages: `bg-card text-headers hover:bg-canvas border border-secondary`
  - Ellipsis: `text-labels cursor-default` (not clickable)
- Prev/Next buttons: `px-3 py-1.5 rounded-md text-sm bg-card border border-secondary text-headers hover:bg-canvas`
  - Disabled (first/last page): `opacity-50 cursor-not-allowed`

**Ellipsis Logic** (desktop):
- Always show: first page, last page, current page, 1 page on each side of current
- Gap of 2+ pages → show `…`
- Example: page 7 of 13 → `1 … 6 [7] 8 … 13`

**"Load More" Alternative**:

Some views use "Load More" instead of numbered pagination (activity feeds, attendance tracking, pending review backlog). These do NOT use the Pagination component — they use a simple button:
```svelte
<Button variant="outline" size="sm" onclick={loadMore}>
  Load {batchSize} more (showing {shown} of {total})
</Button>
```
The "Load More" pattern is preferred when:
- Users process items sequentially (queues, feeds)
- Checkbox state must survive across loads
- The list is a dashboard sub-section, not a standalone page

**ARIA**:
- Container: `<nav aria-label="Pagination">`
- Current page: `aria-current="page"`
- Prev button: `aria-label="Go to previous page"`
- Next button: `aria-label="Go to next page"`
- Page buttons: `aria-label="Go to page {n}"`

**Code Example**:
```svelte
<script>
  import Pagination from '$lib/components/ui/Pagination.svelte';
</script>

<Pagination
  page={3}
  totalPages={13}
  totalItems={247}
  pageSize={20}
  onPageChange={(p) => goto(`?page=${p}`)}
/>
```

**Spec Source**: Ch.12.10.1, Ch.12.10.6, Ch.26.17.1

---

## 6. Navigation Templates

### 6.1 Header Component

**File**: `frontend/query/src/lib/components/layout/Header.svelte`

**Purpose**: Page header with optional mode badge

**Props Interface**:
```typescript
interface Props {
  title: string;
  subtitle?: string;
  mode?: 'pitch' | 'review';
  class?: string;
}
```

**Mode Badge Colors**:
| Mode | Background | Text |
|------|-----------|------|
| `pitch` | `bg-primary/10` | `text-primary` |
| `review` | `bg-success/10` | `text-success` |

**Visual**:
```
[Pitch] Problem Title            ← Mode badge + title
Assessment Subtitle              ← Subtitle
```

**Typography**:
- Title: `text-2xl md:text-3xl`, `font-bold`, `text-headers`
- Subtitle: `text-sm md:text-base`, `text-labels`

**Code Example**:
```svelte
<Header
  title="API Rate Limiter"
  subtitle="Pitch Assessment"
  mode="pitch"
/>
```

**Source**: `Header.svelte:1-25`

### 6.2 PageContainer Component

**File**: `frontend/query/src/lib/components/layout/PageContainer.svelte`

**Purpose**: Three-layer background wrapper for all pages

**Props Interface**:
```typescript
interface Props {
  children: Snippet;
}
```

**Visual Structure**:
```
<body class="bg-viewport">                      ← #DCEBFF light blue
  <div class="min-h-screen">
    <main class="bg-canvas max-w-3xl mx-auto     ← #F1F2F8 light grey
                 rounded-[--radius-card-lg]
                 shadow-[--shadow-canvas]">
      <!-- Children (Cards) render here -->       ← #FEFEFE white cards
    </main>
  </div>
</body>
```

**Responsive Padding**:
- Mobile: `p-4` (16px)
- Tablet: `p-6` (24px)
- Desktop: `p-8` (32px)

**Code Example**:
```svelte
<PageContainer>
  <Header title="Assessment" />
  <Card elevation="resting">
    <p>Page content...</p>
  </Card>
</PageContainer>
```

**Source**: `PageContainer.svelte:1-19`

### 6.3 VersionNav Component

**File**: `frontend/query/src/lib/components/problem/VersionNav.svelte`

**Purpose**: Version selector with archive mode warning

**Props Interface**:
```typescript
interface Props {
  versions: ProblemVersion[];
  currentVersion: number;
  isArchiveView: boolean;
  onVersionChange: (version: number) => void;
  onReturnToCurrent: () => void;
}
```

**Visual**:
```
Versions:  [v1.00]  [v2.00]  [●v3.00]    ← Current highlighted

⚠️ History View - Contribution is blocked. [Revert to current version]
```

**Archive Warning Banner**:
- Background: `bg-warning-bg`
- Border: `border-l-4 border-warning`
- Text: `text-warning`
- Link: `text-primary`, underlined

**Code Example**:
```svelte
<VersionNav
  versions={problemVersions}
  currentVersion={selectedVersion}
  isArchiveView={selectedVersion !== latestVersion}
  onVersionChange={(v) => handleVersionChange(v)}
  onReturnToCurrent={() => handleVersionChange(latestVersion)}
/>
```

**User Stories**: U26 (View Historical Versions), audit trail

**Source**: `VersionNav.svelte:1-73`, Ch.13.5

### 6.4 TopAppBar Component (NEEDED)

**Added 2026-02-25**

**File**: `frontend/query/src/lib/components/layout/TopAppBar.svelte`

**Purpose**: Persistent top bar with platform brand (left) and user avatar (right). Provides identity anchor and account menu access on all authenticated pages.

**Props Interface**:
```typescript
interface Props {
  user: {
    display_name: string;
    user_id: string;
  } | null;
  class?: string;
}
```

**Visual**:
```
┌──────────────────────────────────────────┐
│  VibeCoding                      [EH]   │
└──────────────────────────────────────────┘
```

**Styling**:
- Position: `fixed top-0 left-0 right-0 z-50`
- Height: `h-[44px] md:h-[48px]`
- Background: `bg-card`
- Border: `border-b border-secondary`
- Shadow: `shadow-[--shadow-resting]`
- Layout: `flex items-center justify-between px-4 md:px-6`

**Left Region**:
- Text: "VibeCoding", `font-semibold text-lg text-headers`
- Desktop addition: Tagline "Professionals" in `text-sm text-labels ml-1`

**Right Region**:
- InitialAvatar (Ch.26.11.16), `size="sm"`
- `onclick` → open AccountMenu
- `aria-haspopup="menu"`, `aria-expanded`

**AccountMenu**:
- Desktop: DropdownMenu (bits-ui), aligned right
- Mobile: Bottom sheet (bits-ui Dialog)
- Items: Display name (header), email (sub), Settings, Profile, Logout
- Logout uses `text-alert` color

**Code Example**:
```svelte
<TopAppBar user={{ display_name: "Eva Schmidt", user_id: "abc-123" }} />
```

**User Stories**: U39 (Account Access via Avatar)

**Spec Source**: Ch.12.7.2, Ch.26.16.1

### 6.5 BottomNavBar Component (NEEDED)

**Added 2026-02-25**

**File**: `frontend/query/src/lib/components/layout/BottomNavBar.svelte`

**Purpose**: Fixed bottom navigation bar for single-tap screen switching. Always visible on authenticated pages. Replaces hamburger menus with direct, thumb-accessible route icons.

**Props Interface**:
```typescript
interface NavItem {
  icon: Component;       // Lucide icon component
  label: string;         // Short label (max 10 chars)
  href: string;          // Route path
  badge?: number;        // Optional notification count
  visibleTo?: string[];  // Role restriction
}

interface Props {
  items: NavItem[];
  currentPath: string;
  class?: string;
}
```

**Visual**:
```
┌──────────┬──────────┬──────────┐
│    ━━━   │          │          │   ← Active indicator (3px bar)
│    🏠    │    📅    │    📋    │
│   Home   │  Events  │ Problems │
│ (active) │          │          │
└──────────┴──────────┴──────────┘
```

**Styling**:
- Position: `fixed bottom-0 left-0 right-0 z-50`
- Height: `h-[56px] md:h-[60px]`
- Background: `bg-card`
- Border: `border-t border-secondary`
- Shadow: `shadow-[0px_-1px_3px_rgba(0,0,0,0.05)]`
- Layout: `flex items-center justify-around`
- Safe area: `pb-[env(safe-area-inset-bottom)]` (iPhone notch/home indicator)

**Item Layout**:
```
flex flex-col items-center justify-center gap-0.5
```
- Icon: 24px Lucide icon
- Label: `text-xs font-medium`
- Touch target: Entire column, min 48×48px

**States**:
| State | Icon | Label | Extra |
|-------|------|-------|-------|
| Inactive | `text-labels` | `text-labels` | — |
| Active | `text-primary` | `text-primary` | 3px `bg-primary` bar above icon |
| Hover | `text-headers` | `text-headers` | `bg-canvas` background |

**Badge**:
- Position: Top-right of icon, overlapping
- Dot only: `w-2 h-2 bg-alert rounded-full`
- With count: `w-4 h-4 bg-alert text-white text-[10px] rounded-full`

**Code Example**:
```svelte
<script>
  import { Home, Calendar, ClipboardList } from '@lucide/svelte';
  import BottomNavBar from '$lib/components/layout/BottomNavBar.svelte';
  import { page } from '$app/stores';

  const items = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Calendar, label: 'Events', href: '/events' },
    { icon: ClipboardList, label: 'Problems', href: '/problems' },
  ];
</script>

<BottomNavBar {items} currentPath={$page.url.pathname} />
```

**ARIA**:
- Container: `<nav role="navigation" aria-label="Main navigation">`
- Active item: `aria-current="page"`

**User Stories**: U38 (Switch Screens), U40 (Current Location), M29 (Moderator Access)

**Spec Source**: Ch.12.7.3, Ch.26.16.2

---

## 7. Problem Card Templates

### 7.1 Classification Badge (NEEDED)

**Purpose**: Prominent problem type display at top of Problem Card

**Props Interface**:
```typescript
interface Props {
  type: ProblemType;
  size?: 'sm' | 'md' | 'lg';
}

type ProblemType = 'explorative' | 'greenfield' | 'advanced_greenfield' | 'brownfield' | 'reverse_engineering' | 'other';
```

**Visual Specification**:
- Large pill badge with distinct color per type
- Positioned at very top of Problem Card (above header)
- Font: `font-bold`, uppercase or small-caps
- Padding: `px-4 py-2`
- Border radius: `rounded-[--radius-card]`

**Type Colors** (proposed):
| Type | Background | Text |
|------|-----------|------|
| `explorative` | `bg-purple-bg` | `text-purple` |
| `greenfield` | `bg-green-100` | `text-success` |
| `advanced_greenfield` | `bg-primary/10` | `text-primary` |
| `brownfield` | `bg-warning-bg` | `text-warning` |
| `reverse_engineering` | `bg-canvas` | `text-headers` |
| `other` | `bg-canvas` | `text-labels` |

**Code Example**:
```svelte
<ClassificationBadge type="greenfield" size="lg" />
```

**User Stories**: U6 (Browse Problems), P1 (Create Problem)

**Spec Source**: Ch.13.1, Ch.04

### 7.2 Visual Journey Map (NEEDED)

**Purpose**: Show dual-state progression (readiness + action journeys)

**Props Interface**:
```typescript
interface Props {
  currentReadiness: ReadinessState;
  currentAction: ActionState;
  collapsible?: boolean;     // Collapse on mobile
}
```

**Visual**:
```
Readiness Journey:
● Draft → ● Submitted → ○ Needs Changes → ● Ready
                                     ↘ ○ Rejected

Action Journey:
● Backlog → ● Selected for Event → ○ Coding → ○ Closed
         ↘ ○ Deferred           ↘ ○ Dropped
```

- **Current state**: Filled circle (●)
- **Past states**: Filled circle with checkmark
- **Future states**: Outline circle (○)
- **Arrows**: `→` and `↘`

**Responsive**:
- Desktop: Two rows side-by-side or stacked
- Mobile: Collapsible with "Show journey" toggle

**Code Example**:
```svelte
<VisualJourneyMap
  currentReadiness="ready"
  currentAction="selected_for_coding"
  collapsible={true}
/>
```

**User Stories**: U27 (Decision History), understanding state model

**Spec Source**: Ch.13.6.1

### 7.3 NextStepsGuidance Panel (NEEDED)

**Purpose**: Contextual guidance based on current state and user role

**Props Interface**:
```typescript
interface Props {
  state: { readiness: ReadinessState; action: ActionState };
  userRole: Role;
  actions: Action[];          // Available actions with handlers
}

interface Action {
  label: string;
  variant: 'primary' | 'secondary';
  onclick: () => void;
}
```

**Content by State + Role** (Examples):

**Problem Owner, Draft**:
```
┌─────────────────────────────────────────┐
│ Next Steps                              │
│ Ready to share? [Submit for Review]    │
└─────────────────────────────────────────┘
```

**Participant, Pitch Open**:
```
┌─────────────────────────────────────────┐
│ Next Steps                              │
│ Rate this problem now! [Vote]          │
└─────────────────────────────────────────┘
```

**Moderator, Submitted**:
```
┌───────────────────────────────────────────────┐
│ Next Steps                                    │
│ [Accept] [Request Changes] [Reject]          │
└───────────────────────────────────────────────┘
```

**Visual**: Card with `bg-canvas/50`, rounded, `p-4`, buttons right-aligned

**Code Example**:
```svelte
<NextStepsGuidance
  state={{ readiness: 'draft', action: 'backlog' }}
  userRole="problem_owner"
  actions={[
    { label: 'Submit for Review', variant: 'primary', onclick: handleSubmit }
  ]}
/>
```

**User Stories**: Contextual guidance across all roles

**Spec Source**: Ch.13.6.3

### 7.4 Lessons Learned Templates (NEEDED)

#### 7.4.1 LessonsLearnedLog Component

**Purpose**: Main lessons panel with filters and add button

**Props Interface**:
```typescript
interface Props {
  problemId: string;
  lessons: Lesson[];
  categories: string[];
  events: Event[];
  userRole: Role;
  onAddLesson: () => void;
  onFlagValuable: (lessonId: string) => void;
}
```

**Visual Layout**:
```
┌───────────────────────────────────────────────────────┐
│ Lessons Learned                      [+ Add Lesson]   │
│                                                        │
│ Category: [All ▼]  Event: [All ▼]  ☑ Valuable only   │
│                                                        │
│ [LessonCard 1]                                        │
│ [LessonCard 2]                                        │
│ [LessonCard 3]                                        │
└───────────────────────────────────────────────────────┘
```

**Filters**:
- Category dropdown: All, tooling, architecture, process, gotcha, performance, testing
- Event dropdown: All, {event name 1}, {event name 2}, ...
- Valuable toggle: Checkbox filter

**Source**: Ch.13.1

#### 7.4.2 LessonCard Component

**Purpose**: Individual lesson display

**Props Interface**:
```typescript
interface Props {
  lesson: Lesson;
  canFlagValuable: boolean;     // PO or moderator
  onFlagValuable: (lessonId: string) => void;
}

interface Lesson {
  lesson_id: string;
  category: string;
  content: string;
  tags: string[];
  author_name: string;
  event_name: string;
  created_at: string;
  valuable: boolean;
}
```

**Visual**:
```
┌──────────────────────────────────────────────────┐
│ [Architecture]  Jan 30, 2026 • Max Mustermann   │
│                                                  │
│ Using DSPy-style optimization for prompt tuning │
│ reduced iteration time by 40%. Key insight:     │
│ treat prompts as optimizable artifacts.         │
│                                                  │
│ #prompting #optimization            [★ Valuable]│
└──────────────────────────────────────────────────┘
```

**Category Badge**: Same styling as state badges, category-specific colors

**Tags**: `text-xs`, `text-meta`, `#hashtag` prefix

**Valuable Button**: Star icon, toggles `valuable` flag

**Source**: Ch.13.1

### 7.5 Team Section Templates (NEEDED)

#### 7.5.1 TeamSection Component

**Purpose**: Team members list, join/retire buttons, breakout URL

**Props Interface**:
```typescript
interface Props {
  team: TeamMember[];
  breakoutUrl?: string;
  userIsMember: boolean;
  userIsRetired: boolean;
  canJoin: boolean;              // Authenticated + coding active
  canEditBreakout: boolean;      // Team member
  onJoin: () => void;
  onRetire: () => void;
  onRejoin: () => void;
  onUpdateBreakout: (url: string) => void;
}
```

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ Team                                    │
│                                         │
│ • Max Mustermann (PO)                  │
│ • Eva Schmidt (PO deputy)              │
│ • Tom Weber                            │
│ • Lisa Chen (retired)                  │
│                                         │
│ Breakout Room: [Google Meet Link]     │
│                                         │
│ [Join as Dev]  or  [Retire from Team]  │
└─────────────────────────────────────────┘
```

**Team Member Ordering**:
1. PO (first, with "(PO)" suffix)
2. PO Deputy (second, with "(PO deputy)" suffix)
3. Active Coders (alphabetical, no suffix)
4. Retired Members (grey, italic, "(retired)" suffix)

**Breakout Room Display**:
- If set: Shows clickable link
- If editable: Shows EditableField for URL
- Text: `text-sm`, `text-primary` for link

**Source**: Ch.13.1, Ch.13.3, Ch.31.7

#### 7.5.2 TeamMemberList Component

**Purpose**: Ordered member display

**Props Interface**:
```typescript
interface Props {
  members: TeamMember[];
}

interface TeamMember {
  user_id: string;
  display_name: string;
  member_role: 'po' | 'po_deputy' | 'coder';
  status: 'active' | 'retired';
}
```

**Visual**: Bulleted list with role suffixes

**Source**: Ch.13.1

### 7.6 Assessment Links Grid (Existing)

**File**: `frontend/query/src/lib/components/problem/AssessmentLinks.svelte`

**Purpose**: 2×3 grid of assessment rate/view buttons

**Props Interface**:
```typescript
interface Props {
  assessments: {
    self?: Assessment;
    pitch?: Assessment;
    review?: Assessment;
  };
  flags: {
    canSelfRate: boolean;
    canRatePitch: boolean;
    canRateReview: boolean;
  };
}
```

**Grid Layout**:
```
┌───────────────┬───────────────┬───────────────┐
│ Self-Rate     │ Rate Pitch    │ Rate Review   │  ← Row 1: Action buttons
├───────────────┼───────────────┼───────────────┤
│ View Self     │ View Pitch    │ View Review   │  ← Row 2: Results links
│ 3 responses   │ 12 responses  │ 8 responses   │
└───────────────┴───────────────┴───────────────┘
```

**Button States**:
- Enabled: `bg-primary`, clickable
- Disabled: `bg-secondary`, `opacity-50`, tooltip explains why

**Response Counts**: Shown under View buttons

**Code Example**:
```svelte
<AssessmentLinks
  assessments={{
    self: { assessment_id: '...', response_count: 1 },
    pitch: { assessment_id: '...', response_count: 12, is_open: false },
    review: { assessment_id: '...', response_count: 8, is_open: true }
  }}
  flags={{
    canSelfRate: isProblemOwner,
    canRatePitch: isPitchOpen,
    canRateReview: isReviewOpen
  }}
/>
```

**Source**: `AssessmentLinks.svelte:1-129`, Ch.13.1

### 7.7 POActionBar Component (Existing)

**File**: `frontend/query/src/lib/components/problem/POActionBar.svelte`

**Purpose**: Sticky bottom bar with problem owner actions

**Props Interface**:
```typescript
interface Props {
  readinessState: ReadinessState;
  onSubmit: () => void;
  onModify: () => void;
  onClone: () => void;
}
```

**Visual**: Sticky bottom, flex row, right-aligned buttons

**Buttons Shown**:
| State | Buttons Visible |
|-------|----------------|
| Draft | [Submit Problem] |
| Submitted | [Modify Problem] [Clone Problem] |
| Ready | [Modify Problem] [Clone Problem] |

**Code Example**:
```svelte
<POActionBar
  readinessState={problem.readiness_state}
  onSubmit={handleSubmit}
  onModify={handleModify}
  onClone={handleClone}
/>
```

**Source**: `POActionBar.svelte:1-55`

---

## 8. Dashboard Templates

### 8.1 Event Card (NEEDED)

**Purpose**: Event display for landing page and dashboards

**Props Interface**:
```typescript
interface Props {
  event: Event;
  showRegistrationCount?: boolean;
}

interface Event {
  event_id: string;
  slug: string;
  title: string;
  starts_at: string;
  location_city: string;
  venue_name: string;
  partner_name: string;
  partner_logo_url?: string;
  registration_count: number;
  capacity: number;
  status: 'upcoming' | 'live' | 'past';
}
```

**Visual**:
```
┌─────────────────────────────────┐
│ [Event Image]                   │
│                                 │
│ VibeCoding Cologne Feb 2026     │
│ Feb 28, 2026 • 18:00-21:00     │
│ STARTPLATZ Cologne              │
│ [Partner Logo]                  │
│ 32/30 registered                │
└─────────────────────────────────┘
```

**States**:
- Upcoming: Default card, clickable to event detail
- Live: Accent border (`border-primary`), pulse animation
- Past: Greyed out, shows summary stats

**Code Example**:
```svelte
<EventCard
  event={upcomingEvent}
  showRegistrationCount={true}
/>
```

**Spec Source**: Ch.12.1, Ch.29.4

### 8.2 Contributor Wall Row (NEEDED)

**Purpose**: Single contributor display in top contributors list

**Props Interface**:
```typescript
interface Props {
  rank: number;
  contributor: Contributor;
}

interface Contributor {
  display_name: string;
  total_points: number;
  total_stars: number;
  contribution_count: number;
}
```

**Visual**:
```
1. Eva Schmidt         42 pts  ⭐⭐⭐    18 contributions
```

**Layout**: Fixed-width columns for alignment

**Code Example**:
```svelte
{#each topContributors as contributor, index}
  <ContributorRow rank={index + 1} {contributor} />
{/each}
```

**Spec Source**: Ch.12.1, Ch.33.6.2

---

## 9. Live Interaction Templates

### 9.1 Countdown Timer (NEEDED)

**Purpose**: Visual countdown with escalation for time-limited phases

**Props Interface**:
```typescript
interface Props {
  endTime: string;              // ISO 8601 timestamp
  onExpire: () => void;
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual Escalation**:
| Remaining | Color | Animation |
|-----------|-------|-----------|
| > 25% | `text-headers` | None |
| <= 25% | `text-pending` (yellow) | None |
| <= 10% | `text-alert` (red) | Pulse animation |
| Expired | `text-alert` | Stop animation |

**Display Format**: `MM:SS` (e.g., "03:42")

**Code Example**:
```svelte
<CountdownTimer
  endTime="2026-02-04T19:00:00Z"
  onExpire={handlePitchClose}
  size="lg"
/>
```

**Accessibility**:
- `role="timer"`
- `aria-live="polite"` (announces time remaining)
- Respects `prefers-reduced-motion` (no pulse animation)

**Spec Source**: Ch.14.5.1

### 9.2 Phase Transition Banner (NEEDED)

**Purpose**: "What's Happening Now?" sticky banner during live events

**Props Interface**:
```typescript
interface Props {
  state: EventState;
  problemTitle?: string;
  timeRemaining?: string;
  onClick?: () => void;
}

type EventState = 'idle' | 'pitch_active' | 'coding_active' | 'review_active' | 'not_started' | 'ended';
```

**Visual**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 LIVE: Pitching 'API Rate Limiter' — Vote now!          │
└─────────────────────────────────────────────────────────────┘
```

**Banner States**:
| State | Content | Color | Icon |
|-------|---------|-------|------|
| Idle | "Next: {Problem} pitch at {Time}" | Neutral | None |
| Pitch Active | "LIVE: Pitching '{Problem}' — Vote now!" | `bg-primary/10`, `text-primary` | 🔴 |
| Coding Active | "Coding: '{Problem}' — {Time} remaining" | `bg-purple-bg`, `text-purple` | 💻 |
| Review Active | "Review open: '{Problem}'" | `bg-success/10`, `text-success` | 📝 |
| Not Started | "{Event} starts at {Time}" | Neutral | None |
| Ended | "Event ended. Thank you!" | Neutral | None |

**Position**: `sticky top-0`, `z-40`, full-width

**Code Example**:
```svelte
<PhaseTransitionBanner
  state="pitch_active"
  problemTitle="API Rate Limiter"
  onClick={() => goto('/assess/...')}
/>
```

**Spec Source**: Ch.14.5.3

### 9.3 Active Indicator (NEEDED)

**Purpose**: "Airport timetable style" toggling green lamps

**Props Interface**:
```typescript
interface Props {
  active: boolean;
  size?: 'sm' | 'md';
}
```

**Visual**: Two green circles alternating on/off

```
●  ○  →  ○  ●  →  ●  ○  (toggles every 500ms)
```

**States**:
- `active=true`: Alternating animation
- `active=false`: Both grey, no animation

**Code Example**:
```svelte
<ActiveIndicator active={isSelectedForCoding && eventIsLive} size="md" />
```

**Spec Source**: Ch.31.11

---

## 10. Results & Analytics Templates

### 10.1 Results Table (NEEDED)

**Purpose**: Per-item statistical breakdown

**Props Interface**:
```typescript
interface Props {
  results: ItemResult[];
  filters: ResultsFilter;
  onFilterChange: (filter: ResultsFilter) => void;
}

interface ItemResult {
  item_key: string;
  short_label: string;
  n: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
}
```

**Visual**:
```
┌────────────────┬────┬──────┬──────┬─────┬─────┐
│ Item           │  N │ Mean │  SD  │ Min │ Max │
├────────────────┼────┼──────┼──────┼─────┼─────┤
│ Correctness    │ 12 │  4.2 │  0.8 │  3  │  5  │
│ Readability    │ 12 │  3.8 │  1.1 │  2  │  5  │
│ Test Coverage  │ 12 │  4.0 │  0.9 │  2  │  5  │
└────────────────┴────┴──────┴──────┴─────┴─────┘
```

**Decimal Precision**: 1 decimal place for mean and SD

**Spec Source**: Ch.15.1

### 10.2 Improvement Priorities Panel (NEEDED)

**Purpose**: Color-coded recommendations for problem owners

**Props Interface**:
```typescript
interface Props {
  priorities: Priority[];
}

interface Priority {
  item: string;
  score: number;
  level: 'needs_attention' | 'improvement' | 'strength';
  suggestion: string;
}
```

**Visual**:
```
Improvement Priorities
──────────────────────
1. 🔴 Testability (2.6/5) — Add acceptance criteria with test cases
2. 🟡 Scope (2.9/5) — Consider narrowing for sprint feasibility
3. 🟢 Clarity (4.2/5) — Strong! Maintain current approach
```

**Color Levels**:
| Level | Icon | Threshold | Color |
|-------|------|-----------|-------|
| Needs Attention | 🔴 | < 3.0 | `text-alert` |
| Room for Improvement | 🟡 | 3.0-3.5 | `text-pending` |
| Strength | 🟢 | > 3.5 | `text-success` |

**Spec Source**: Ch.15.4.5

---

## 11. Accessibility Patterns

### 11.1 Focus Ring Pattern

**Global Style** (`app.css:63-66`):
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Applied automatically to all interactive elements.

### 11.2 Keyboard Navigation Reference

| Component | Keys | Behavior |
|-----------|------|----------|
| Button | Space, Enter | Activate |
| ButtonScale | Arrow Left/Right | Navigate options |
| ButtonScale | Home, End | Jump to min/max |
| ButtonScale | Space, Enter | Confirm selection |
| SliderScale | Arrow Left/Right | Increment/decrement |
| SliderScale | Home, End | Jump to extremes |
| Dialog | Escape | Close |
| Tab Navigation | Tab, Shift+Tab | Move between controls |

### 11.3 ARIA Pattern Reference

**Radio Group** (ButtonScale):
```svelte
<div role="radiogroup" aria-label="{itemLabel}">
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

**Slider** (SliderScale):
```svelte
<div
  role="slider"
  aria-label="{itemLabel}"
  aria-valuemin="1"
  aria-valuemax="10"
  aria-valuenow="{currentValue}"
  aria-valuetext="{1-3: 'Low', 4-6: 'Medium', 7-10: 'High'}"
  tabindex="0"
/>
```

**Dialog** (ConfirmDialog):
```svelte
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">{title}</h2>
  <!-- Content -->
</div>
```

### 11.4 Touch Target Compliance

**Minimum Size**: 44×44 CSS pixels (WCAG 2.1 Level AAA Target Size)

**Implemented in**:
- Button `md` size: `min-h-[44px]`
- RadioButton: 44×44px touch area
- All clickable elements in assessment forms

**Minimum Gap**: 16px between adjacent interactive elements

**Source**: Ch.26.6.1

### 11.5 Reduced Motion Pattern

**Global Media Query** (`app.css:69-76`):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations respect this preference automatically.

---

## 12. Responsive Patterns

### 12.1 Mobile-First Breakpoint Strategy

**Pattern**: Default styles are mobile, enhance with `md:` and `lg:` prefixes

**Common Patterns**:

**Layout Direction**:
```svelte
<div class="flex flex-col md:flex-row">
  <!-- Vertical on mobile, horizontal on desktop -->
</div>
```

**Grid Columns**:
```svelte
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 column → 2 columns → 3 columns -->
</div>
```

**Typography**:
```svelte
<h1 class="text-2xl md:text-3xl lg:text-4xl">
  <!-- 24px → 30px → 36px -->
</h1>
```

**Padding**:
```svelte
<div class="p-4 md:p-6 lg:p-8">
  <!-- 16px → 24px → 32px -->
</div>
```

### 12.2 Assessment Form Responsive Pattern

**Mobile Strategy**: Cards with vertical stacking
```svelte
<div class="md:hidden">
  <!-- Mobile-specific layout: cards -->
  {#each items as item}
    <Card padding="sm" class="mb-2">
      <h3>{item.short_label}</h3>
      <p class="text-sm text-labels">{item.full_text}</p>
      <ButtonScale {item} vertical={true} />
    </Card>
  {/each}
</div>
```

**Desktop Strategy**: Table layout
```svelte
<div class="hidden md:block">
  <!-- Desktop: table with column headers -->
  <ScaleLabels {headers} />
  {#each items as item}
    <ItemRow {item} {headers} horizontal={true} />
  {/each}
</div>
```

**Source**: `ItemRow.svelte`, `MatrixTable.svelte`

### 12.3 Show/Hide by Breakpoint

**Utilities**:
- `md:hidden` - Hide on desktop, show on mobile
- `hidden md:block` - Hide on mobile, show on desktop
- `md:flex` - Change display mode at breakpoint

---

## 13. Animation Patterns

### 13.1 Transition Classes

**Color Transitions** (hover states):
```svelte
<button class="transition-colors duration-200 hover:bg-primary-hover">
```

**Opacity Transitions** (fade in/out):
```svelte
<div class="transition-opacity duration-200 {open ? 'opacity-100' : 'opacity-0'}">
```

**Transform Transitions** (scale, move):
```svelte
<div class="transition-transform duration-200 hover:scale-105">
```

### 13.2 Loading Spinner Animation

SVG circle with `stroke-dasharray` animation:
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 13.3 Countdown Timer Pulse (at 10%)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-critical {
  animation: pulse 1s ease-in-out infinite;
}
```

Only applied when `prefers-reduced-motion: no-preference`.

---

## 14. Empty States

### 14.1 Empty State Pattern

**Purpose**: Contextual guidance when no data exists

**Props Interface**:
```typescript
interface Props {
  icon?: string;                 // Emoji or icon component
  title: string;
  message: string;
  action?: {
    label: string;
    onclick: () => void;
  };
}
```

**Visual**:
```
┌─────────────────────────────────┐
│                                 │
│          📝                     │
│                                 │
│   No problems yet              │
│   Problems are challenges you  │
│   want to solve.               │
│                                 │
│   [Create your first problem]  │
│                                 │
└─────────────────────────────────┘
```

**Code Example**:
```svelte
<EmptyState
  icon="📝"
  title="No problems yet"
  message="Problems are challenges you want to solve."
  action={{
    label: 'Create your first problem',
    onclick: () => goto('/problem/new')
  }}
/>
```

**Context-Specific Messages** (Ch.32.4.3):
| Section | Message | CTA |
|---------|---------|-----|
| Problem list | "No problems yet. Problems are challenges you want to solve." | [Create your first problem] |
| Team chat | "Be the first to post! Introduce yourself or share your approach." | (none, show input) |
| Assessment results | "Results appear after the assessment closes and participants have voted." | (none) |
| Lessons learned | "No lessons yet. After working on a problem, capture what you learned." | (none) |

**Spec Source**: Ch.32.4.3

---

## 15. Design Token Quick Reference

### 15.1 Complete Token List

**Backgrounds**:
```css
--color-viewport: #DCEBFF
--color-canvas: #F1F2F8
--color-card: #FEFEFE
```

**Typography**:
```css
--color-headers: #192A4B
--color-labels: #7B7C90
--color-meta: #7F91AF
```

**Primary/Secondary**:
```css
--color-primary: #2680F1
--color-primary-hover: #2A87F7
--color-secondary: #DCE4EA
--color-secondary-dark: #BEC8DD
```

**Status**:
```css
--color-success: #55B368
--color-alert: #D95A5C
--color-pending: #EAB308
--color-warning: #EC7C26
--color-warning-bg: #FEF3E6
--color-purple: #8B5CF6
--color-purple-bg: #F3F0FF
```

**Separators**:
```css
--color-etch-top: #EDEEF5
--color-etch-bottom: #EFF1F5
```

**Shadows**:
```css
--shadow-none: none
--shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.03)
--shadow-card: 0px 1px 3px rgba(0, 0, 0, 0.05)
--shadow-md: 0px 4px 8px rgba(127, 145, 175, 0.08)
--shadow-lg: 0px 12px 24px rgba(127, 145, 175, 0.12)
--shadow-floating: 0px 20px 40px rgba(127, 145, 175, 0.15)
--shadow-canvas: 0px 2px 6px rgba(127, 145, 175, 0.06)
```

**Border Radius**:
```css
--radius-card: 12px
--radius-card-lg: 16px
```

### 15.2 Usage in Tailwind Classes

**Direct Token Access** (Tailwind v4):
```svelte
<div class="bg-primary">               <!-- Uses --color-primary -->
<div class="text-headers">             <!-- Uses --color-headers -->
<div class="shadow-[var(--shadow-card)]">  <!-- Explicit shadow -->
<div class="rounded-[var(--radius-card)]"> <!-- Explicit radius -->
```

**Never Hardcode Colors**: Always use design tokens for maintainability and theming.

---

## Appendix: Component Implementation Status

### Implemented Components (59 total) ✅

**Core UI (shadcn-svelte barrel exports)**:
- ✅ Card family (card, card-header, card-title, card-content, card-footer)
- ✅ Badge (with size variants: default, large)
- ✅ Button (6 variants, 4 sizes)
- ✅ AlertDialog family (alert-dialog-*)
- ✅ ConfirmDialog (high-level wrapper)
- ✅ LoadingSpinner
- ✅ EtchedSeparator (major page sections - UN-DEPRECATED 2026-02-05)
- ✅ InitialAvatar (3 sizes, 8 colors)
- ✅ AccordionSection (collapsible with animation)
- ✅ Tooltip (hover desktop, tap mobile)
- ✅ InfoPanel (expandable help)
- ✅ FormDialog (form inputs in modal)
- ✅ InfoDialog (read-only info modal)
- ✅ EmptyState (generic with config)
- ✅ BackButton (hierarchical navigation)

**Toast System**:
- ✅ Toast (4 variants)
- ✅ ToastQueue (container)
- ✅ Toaster (root provider)

**Skeleton Loading**:
- ✅ SkeletonCard
- ✅ SkeletonList
- ✅ SkeletonText
- ✅ SkeletonAvatar

**Form Inputs**:
- ✅ Select (searchable, bits-ui)
- ✅ Checkbox (bits-ui)
- ✅ DatePicker (responsive: native mobile, bits-ui desktop)
- ✅ TimePicker (native input)
- ✅ FileUpload (drag-drop desktop, click mobile)

**Data Display**:
- ✅ DataTable (responsive table)
- ✅ TableCard (mobile card view)
- ✅ ActionMenu (⋮ three-dot menu)

**Scalable List Views** (added 2026-02-25):
- ✅ SearchBar (debounced search input, 300ms, min 2 chars)
- ✅ ListFilterBar (dropdown selects desktop, pill bar mobile, AND logic)
- ✅ Pagination (numbered desktop, prev/next mobile, standard response shape)

**Filters** (legacy, predates scalable list view components):
- ✅ FilterBar (desktop inline)
- ✅ FilterBottomSheet (mobile drawer)
- ✅ FilterDropdown (primitive)
- ✅ FilterCheckbox (primitive)

**Layout**:
- ✅ PageContainer (three-layer depth)
- ✅ Header (with mode badge)

**Assessment**:
- ✅ AssessmentForm
- ✅ MatrixTable
- ✅ ItemRow
- ✅ ButtonScale (5-point)
- ✅ SliderScale (10-point)
- ✅ RadioButton
- ✅ ScaleLabels
- ✅ RoleSelector
- ✅ ProgressIndicator
- ✅ SubmitSection

**Problem Card**:
- ✅ ProblemCard (refactored with accordions)
- ✅ ProblemHeader (with avatar)
- ✅ ProblemContent
- ✅ StateIndicators (with tooltips)
- ✅ VersionNav
- ✅ VersionBadge
- ✅ DecisionTimeline
- ✅ AssessmentLinks (2×3 grid)
- ✅ POActionBar
- ✅ BestPracticesLink
- ✅ PrivateWarningBanner
- ✅ ClassificationBadge
- ✅ VisualJourneyMap
- ✅ NextStepsGuidance
- ✅ LessonsLearnedLog
- ✅ LessonCard
- ✅ ResourceList
- ✅ DualStateExplanation
- ✅ ModeratorControls
- ✅ EditableField (auto-save)

**Chat & Team**:
- ✅ ChatBubble (4 variants)
- ✅ ChatMessage
- ✅ ChatThread
- ✅ ChatMentionAutocomplete
- ✅ ChatInput
- ✅ ChatPanel
- ✅ TeamSection
- ✅ TeamMemberList

**Events & Registration**:
- ✅ EventCard
- ✅ EventGrid
- ✅ EventHeader
- ✅ RegistrationSection
- ✅ CapacityIndicator
- ✅ WaitlistNotice

**Dashboard**:
- ✅ ContributorWall (leaderboard with podium)
- ✅ ActivityFeed
- ✅ LiveBanner (sticky)
- ✅ CurrentActivity

**Admin & Moderation**:
- ✅ ItemEditor (vertical scroll mobile)
- ✅ InventoryEditor (shuttle: vertical mobile, side-by-side desktop)
- ✅ EventEditor
- ✅ UserList (with DataTable)
- ✅ CSVImportWizard (4 steps)
- ✅ PartnerEditor
- ✅ DecisionAccordion (7 color-coded categories)
- ✅ StarAwardsModal (full-screen mobile)

**Charts & Analytics**:
- ✅ BarChart (Chart.js wrapper)
- ✅ LineChart (Chart.js wrapper)
- ✅ SparkLine (inline mini-chart)
- ✅ ResultsTable
- ✅ ImprovementPriorities

**Total**: 62 components implemented (2026-02-25)

**Specification Reference**: See Ch.26.11-26.17 for complete component specifications and page design documents in `frontend/pagedesign/` for composition patterns.

### Future Components (Deferred)

- ⬜ Breadcrumbs (navigation, low priority)
- ⬜ NotificationCenter (centralized notifications, future)
- ⬜ UserProfile (profile pages, future)

---

**End of Template Collection v1.1.0**

This document provides the foundation for all frontend development on the VibeCoding Professionals platform. All implementations must follow these patterns, use these design tokens, and maintain the three-layer depth hierarchy that defines the platform's visual identity.
