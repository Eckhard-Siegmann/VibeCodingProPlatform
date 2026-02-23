# Finished Popup Design (Survey Completion Confirmation)

**Status**: Retroactive (documenting existing implementation) + Enhancement Recommendations
**Component**: ConfirmDialog
**Context**: Assessment submission success feedback
**Created**: 2026-02-04

---

## Overview

Confirmation dialog shown after successful assessment submission. Provides immediate visual feedback that the submission was received and recorded. Currently implemented as inline success state; can be enhanced to floating dialog.

**Purpose**: Close the feedback loop, confirm user action, provide next steps.

---

## Trigger Conditions

**When Displayed**:
1. User completes assessment form
2. User clicks "Submit Assessment" button
3. POST to `/api/assessments/[assessmentId]/responses` returns `200 OK`
4. `responsesStore.setSubmitted()` is called
5. Component shows success state

**Current Implementation**: Inline Card with success message
**Enhanced Implementation**: Floating ConfirmDialog with elevation

---

## Current Implementation (Inline Success)

### Component Hierarchy

```
PageContainer
└─ Card (elevation="resting")
   └─ Success Content
      ├─ Checkmark Icon (✓)
      ├─ Heading: "Assessment Submitted"
      └─ Body: "Thank you for your feedback! You rated X of Y items."
```

**File**: `assessment/AssessmentForm.svelte:87-96`

**Visual**:
```
┌─────────────────────────────────────┐
│                                     │
│              ✓                      │  ← 48px green checkmark
│                                     │
│     Assessment Submitted            │  ← text-xl font-semibold
│                                     │
│  Thank you for your feedback!       │  ← text-labels
│  You rated 12 of 18 items.          │
│                                     │
└─────────────────────────────────────┘
```

**Styling**:
- Checkmark: `text-success text-5xl mb-4`
- Heading: `text-xl font-semibold text-headers mb-2`
- Body: `text-labels`
- Card: `text-center py-8`

### Behavior

**Current**:
- Success state replaces entire form
- User must navigate away manually (no auto-redirect)
- No auto-close
- No explicit "Close" or "Next" button

---

## Enhanced Implementation (Floating Dialog) - RECOMMENDED

### Component Hierarchy

```
PageContainer (backdrop remains visible)
└─ ConfirmDialog (elevation="floating")
   └─ Card Content
      ├─ Success Icon (✓)
      ├─ Heading: "Thanks for your rating!"
      ├─ Body: "Your feedback has been recorded."
      └─ Action Buttons
         ├─ [Back to Problem Card] (primary)
         └─ [Close] (secondary) OR auto-close
```

**Visual**:
```
Backdrop: Semi-transparent black (50% opacity)

         ┌─────────────────────────────┐
         │                             │  ← Floating shadow (40px blur)
         │          ✓                  │
         │                             │
         │  Thanks for your rating!    │
         │                             │
         │  Your feedback has been     │
         │  recorded.                  │
         │                             │
         │  [Back to Problem Card]     │
         │                             │
         └─────────────────────────────┘
```

### Templates Used

| Component | Props | Elevation | Source |
|-----------|-------|-----------|--------|
| **ConfirmDialog** | `open=true, title, message, variant="default", showCancel=false` | N/A (wrapper) | `ui/ConfirmDialog.svelte` |
| **Card** | `elevation="floating", padding="lg"` | Floating (40px shadow) | `ui/Card.svelte` |
| **Button** | `variant="primary", size="md"` | N/A | `ui/Button.svelte` |

### Behavior Enhancements

| Behavior | Specification |
|----------|---------------|
| **Backdrop** | Dark (`bg-black/50`), prevents interaction with form behind |
| **Escape Key** | Closes dialog |
| **Backdrop Click** | Closes dialog |
| **Auto-Close** | Optional: 3-second timer, then close automatically |
| **Focus Trap** | Focus locked within dialog (to be added) |
| **Return Focus** | Returns focus to submit button when closed (to be added) |
| **Redirect** | Optional: Navigate to problem card or dashboard after close |

### Code Example

```svelte
<script>
  let showSuccess = $state(false);
  let submitted = $derived($responsesStore.submitted);

  // Trigger dialog when submission succeeds
  $effect(() => {
    if (submitted) {
      showSuccess = true;

      // Optional: Auto-close after 3 seconds
      setTimeout(() => {
        showSuccess = false;
        // Optional: Redirect to problem card
        // goto(`/problem/${problemSlug}`);
      }, 3000);
    }
  });
</script>

<ConfirmDialog
  open={showSuccess}
  title="Thanks for your rating!"
  message="Your feedback has been recorded."
  confirmLabel="Back to Problem Card"
  showCancel={false}
  variant="default"
  onConfirm={() => {
    showSuccess = false;
    goto(`/problem/${problemSlug}`);
  }}
/>
```

---

## Visual Design Details

### Floating Shadow Effect

**Critical**: Dialog MUST use `elevation="floating"` for dramatic lift:
```
shadow-floating: 0px 20px 40px rgba(127, 145, 175, 0.15)
```

This creates clear visual hierarchy:
1. Viewport (blue background) - furthest back
2. Canvas (grey) - middle layer
3. Form card (white, resting shadow) - front layer
4. Dialog (white, **floating shadow**) - elevated above all

### Backdrop Depth

**Backdrop**: `bg-black/50` creates depth perception
**Z-Index**: `z-50` ensures dialog is above all page content
**Transition**: Fade in/out over 200ms

### Success Icon

**Checkmark Styling**:
- Unicode: `\u2713` or HTML entity `&#10003;`
- Color: `text-success` (#55B368 green)
- Size: `text-5xl` (48px) for emphasis
- Spacing: `mb-4` below icon

**Alternative Icons**:
- Circular checkmark: Use SVG with circle + checkmark
- Animated checkmark: Draw stroke animation (respects reduced-motion)

---

## Accessibility Compliance

### ARIA Attributes

```svelte
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="success-title"
  aria-describedby="success-message"
>
  <h2 id="success-title">Thanks for your rating!</h2>
  <p id="success-message">Your feedback has been recorded.</p>
</div>
```

### Keyboard Behavior

| Key | Behavior | Status |
|-----|----------|--------|
| **Escape** | Close dialog | ✅ Implemented |
| **Tab** | Cycle through buttons | ✅ Implemented |
| **Shift+Tab** | Reverse cycle | ✅ Implemented |
| **Enter/Space** | Activate focused button | ✅ Implemented |

### Focus Management

| Event | Focus Behavior | Status |
|-------|---------------|--------|
| **Dialog Opens** | Focus moves to confirm button | ⚠️ TO BE ADDED |
| **Dialog Closes** | Focus returns to submit button | ⚠️ TO BE ADDED |
| **Tab at last element** | Wraps to first (focus trap) | ⚠️ TO BE ADDED |

**Enhancement Needed**: Add focus trap using `onMount` and `onDestroy` lifecycle:

```typescript
let confirmButtonRef: HTMLButtonElement;
let previousFocus: HTMLElement | null = null;

onMount(() => {
  previousFocus = document.activeElement as HTMLElement;
  confirmButtonRef?.focus();
});

onDestroy(() => {
  previousFocus?.focus();
});
```

### Screen Reader Announcements

**When Dialog Opens**:
- `aria-live="polite"` region announces title
- `role="dialog"` + `aria-modal="true"` signals modal context

**Status Icons**:
- Checkmark has `aria-hidden="true"` (decorative)
- Semantic meaning conveyed through text

---

## Animation Specification

### Opening Animation

**Backdrop**:
```css
transition: opacity 200ms ease-out
opacity: 0 → 1
```

**Dialog**:
```css
transition: transform 200ms ease-out, opacity 200ms ease-out
transform: scale(0.95) → scale(1.0)
opacity: 0 → 1
```

### Closing Animation

Reverse of opening (200ms duration)

### Reduced Motion

If `prefers-reduced-motion: reduce`:
- Backdrop: Instant appearance (no fade)
- Dialog: Instant appearance (no scale)
- Auto-close still works, but no fade-out

**Implementation**: Handled by global media query in `app.css:69-76`

---

## Responsive Behavior

### Mobile (<640px)

**Dialog Width**: `max-w-md` (448px max), `mx-4` (16px horizontal margins)
**Padding**: `lg` (20px via Card component)
**Button Layout**: Full-width button, no cancel button

### Desktop (>=768px)

**Dialog Width**: Same `max-w-md`, more breathing room due to larger viewport
**Padding**: `lg` (24px via Card component)
**Button Layout**: Right-aligned, normal width

---

## Variants

### Single-Button Variant (Current + Recommended)

**Use Case**: Non-critical confirmations, success states
**Buttons**: Only confirm button (primary variant)
**Props**: `showCancel={false}`

**Visual**:
```
┌─────────────────────────────┐
│      Thanks for rating!     │
│  Your feedback is recorded. │
│                             │
│     [Back to Problem Card]  │
└─────────────────────────────┘
```

### Two-Button Variant

**Use Case**: Critical confirmations, destructive actions (not for success state)
**Buttons**: Cancel (secondary) + Confirm (primary or danger)
**Props**: `showCancel={true}, variant="default"|"danger"`

**Visual**:
```
┌─────────────────────────────┐
│      Delete Problem?        │
│  This cannot be undone.     │
│                             │
│  [Cancel]  [Delete]         │
└─────────────────────────────┘
```

---

## Integration Points

### In AssessmentForm.svelte

**Current Approach** (Inline):
```svelte
{#if submitted}
  <Card elevation="resting" class="text-center py-8">
    <div class="text-success text-5xl mb-4">&#10003;</div>
    <h2 class="text-xl font-semibold text-headers mb-2">Assessment Submitted</h2>
    <p class="text-labels">
      Thank you for your feedback! You rated {answered} of {totalItems} items.
    </p>
  </Card>
{:else}
  <!-- Form content -->
{/if}
```

**Enhanced Approach** (Floating Dialog):
```svelte
<script>
  let showSuccessDialog = $state(false);

  async function handleSubmit() {
    // ... submission logic
    if (success) {
      responsesStore.setSubmitted();
      showSuccessDialog = true;

      // Auto-close after 3s and redirect
      setTimeout(() => {
        showSuccessDialog = false;
        goto(`/problem/${problemSlug}`);
      }, 3000);
    }
  }
</script>

<!-- Form always visible -->
<Card elevation="resting">
  <form>...</form>
</Card>

<!-- Floating success dialog -->
<ConfirmDialog
  open={showSuccessDialog}
  title="Thanks for your rating!"
  message="Your feedback has been recorded. You rated {answered} of {totalItems} items."
  confirmLabel="Back to Problem Card"
  showCancel={false}
  onConfirm={() => {
    showSuccessDialog = false;
    goto(`/problem/${problemSlug}`);
  }}
/>
```

### In +page.svelte

**Pass Problem Slug** (for redirect):
```typescript
// In +page.server.ts
return {
  assessment: { ...assessmentData, problem_slug: problem.slug }
};

// In +page.svelte
function handleSubmitSuccess() {
  // Redirect to problem card after success
  goto(`/problem/${data.assessment.problem_slug}`);
}
```

---

## Accessibility Gaps (To Be Fixed)

### Missing: Focus Trap

**Issue**: User can Tab out of dialog to background content
**Fix**: Implement focus trap using event listeners

```typescript
function handleFocusTrap(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;

  const focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
```

### Missing: Return Focus

**Issue**: When dialog closes, focus is lost
**Fix**: Store previous focus element and return to it

```typescript
let previousFocus: HTMLElement | null = null;

$effect(() => {
  if (open) {
    previousFocus = document.activeElement as HTMLElement;
    // Focus confirm button when dialog opens
    tick().then(() => confirmButtonRef?.focus());
  } else if (previousFocus) {
    previousFocus.focus();
    previousFocus = null;
  }
});
```

### Missing: Semantic Success Announcement

**Issue**: Screen readers may not announce success
**Fix**: Add `aria-live` region

```svelte
{#if submitted}
  <div role="status" aria-live="polite" class="sr-only">
    Assessment successfully submitted. You rated {answered} of {totalItems} items.
  </div>
{/if}
```

---

## Visual Design Details

### Floating Elevation

**Shadow**: `shadow-floating` (0px 20px 40px rgba(127,145,175,0.15))
**Purpose**: Creates dramatic lift, signals importance
**Context**: Dialog appears to float significantly above canvas layer

### Backdrop Treatment

**Color**: `bg-black/50` (50% opacity black)
**Purpose**:
- Creates depth (canvas layer visible but darkened)
- Focuses attention on dialog
- Prevents accidental interaction with background

**Transition**: 200ms fade in/out

### Icon-Text-Button Spacing

**Vertical Rhythm**:
- Icon: `mb-4` (16px below)
- Heading: `mb-2` (8px below)
- Body: `mb-6` (24px below)
- Button: No bottom margin

### Card Padding

**Dialog Card**: `padding="lg"`
- Mobile: `p-5` (20px)
- Desktop: `p-6` (24px)

Creates generous breathing room around content.

---

## Responsive Behavior

### Mobile (<640px)

**Dialog**:
- Width: `max-w-md` (448px max) with `mx-4` (16px side margins)
- Effectively: ~360px wide on 390px viewport
- Padding: 20px all sides

**Button**:
- Width: Auto (content-based), centered
- Height: 44px minimum (WCAG compliance)

### Desktop (>=768px)

**Dialog**:
- Width: Same `max-w-md` (448px)
- More breathing room on large screens
- Padding: 24px all sides

**Button**:
- Same sizing, more horizontal space available

---

## Animation Details

### Dialog Entry Animation

**Backdrop** (200ms):
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Dialog** (200ms):
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1.0);
  }
}
```

### Optional: Checkmark Draw Animation

**Enhancement**: Animated SVG checkmark stroke

```svelte
<svg viewBox="0 0 24 24" class="w-12 h-12 text-success mx-auto mb-4">
  <path
    d="M5 13l4 4L19 7"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="checkmark-path"
  />
</svg>

<style>
  .checkmark-path {
    stroke-dasharray: 20;
    stroke-dashoffset: 20;
    animation: draw 0.5s ease-out forwards;
  }

  @keyframes draw {
    to { stroke-dashoffset: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .checkmark-path {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
</style>
```

---

## User Stories Covered

- **U7**: Vote During Pitch — Confirms pitch rating recorded
- **U17**: Review Assessment — Confirms review rating recorded
- **U18**: Post-Event Reflection — Confirms late reflection recorded
- **P3**: Self-Assessment — Confirms self-rating recorded

**Specification Source**: Implicit in Ch.09 (response capture), general UX best practices

---

## Alternative Implementations

### Option A: Inline Success (Current)

**Pros**:
- Simpler implementation
- No z-index complexity
- Form clearly replaced with confirmation

**Cons**:
- Less visually impactful
- No clear "next action" (user must navigate manually)
- Occupies full page space

### Option B: Floating Dialog (Recommended)

**Pros**:
- More visually striking
- Clear call-to-action (redirect button)
- Feels like system acknowledgment
- Consistent with other modal dialogs

**Cons**:
- Slightly more complex (focus trap, backdrop)
- Requires proper z-index layering

### Option C: Toast Notification

**Pros**:
- Minimal disruption
- Auto-dismissing
- Can stay on form (see responses)

**Cons**:
- Less celebratory
- Might be missed
- Not suitable for first-time users

**Recommendation**: Use Option B (Floating Dialog) for assessment submissions. Toasts are better for minor actions like "Lesson saved" or "Resource added".

---

## Implementation Checklist

### Current State ✅
- [x] Success state displayed after submission
- [x] Checkmark icon shown
- [x] Confirmation message clear
- [x] Uses design tokens (text-success, text-headers)
- [x] Centered layout

### Enhancements Needed ⬜
- [ ] Use ConfirmDialog with `elevation="floating"`
- [ ] Add backdrop for depth
- [ ] Implement focus trap
- [ ] Return focus to submit button on close
- [ ] Add "Back to Problem Card" button with redirect
- [ ] Optional: 3-second auto-close timer
- [ ] Optional: Animated checkmark SVG
- [ ] Add `aria-live="polite"` announcement

---

## Testing Scenarios

### Functional Tests
- [ ] Dialog appears after successful POST
- [ ] Dialog does not appear on POST error
- [ ] Escape key closes dialog
- [ ] Backdrop click closes dialog
- [ ] Confirm button closes dialog and redirects
- [ ] Auto-close works (if implemented)

### Accessibility Tests
- [ ] Focus moves to confirm button on open
- [ ] Tab key trapped within dialog
- [ ] Escape key closes dialog
- [ ] Focus returns to submit button on close
- [ ] Screen reader announces success
- [ ] Dialog has `role="dialog"` and `aria-modal="true"`

### Visual Tests
- [ ] Backdrop darkens page (50% black)
- [ ] Dialog has floating shadow (40px blur)
- [ ] Dialog centered in viewport
- [ ] Checkmark is green (#55B368)
- [ ] Text hierarchy clear (heading > body)
- [ ] Margins and spacing consistent with design system

---

## Related Components

- **ConfirmDialog**: Used for destructive confirmations (delete, drop, close)
- **Success Inline State**: Alternative pattern for low-emphasis confirmations
- **Toast Notification** (future): For minor success messages

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-04
**Status**: Implementation Exists (Inline), Enhancement Recommended (Floating Dialog)
