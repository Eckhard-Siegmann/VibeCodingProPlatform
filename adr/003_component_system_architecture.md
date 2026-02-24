# ADR 003: Component System Architecture

## Status

**Accepted** (2026-02-04)

## Context

The frontend (see ADR 002) needs a component system that provides:

- Accessible UI primitives (dialogs, popovers, dropdowns) with ARIA compliance
- Consistent visual styling aligned with the platform's design system
- Clean import patterns for developer ergonomics
- Compatibility with Svelte 5 runes

## Decision

### Architecture: shadcn-svelte Pattern on bits-ui Primitives

The component system follows a **shadcn-svelte inspired** architecture:

- **bits-ui** provides headless, accessible primitives (AlertDialog, Dialog, Select, Popover, etc.)
- Custom styling layers apply the platform's design tokens on top
- Components are **owned by the project** (not installed from a package registry) — they live in `src/lib/components/ui/`

### Import Convention: Barrel Exports

Each component family uses a folder with an `index.ts` barrel export:

```
ui/card/
├── card.svelte
├── card-header.svelte
├── card-title.svelte
├── card-content.svelte
├── card-footer.svelte
└── index.ts          # Re-exports all as named exports
```

Consumers import via named imports from the folder:
```
import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
```

High-level composed components use direct imports:
```
import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
```

### cn() Utility for Class Merging

A `cn()` utility function combines conditional CSS classes with Tailwind conflict resolution:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This enables clean prop forwarding of `class` attributes while resolving Tailwind class conflicts.

### CSS Design Tokens

All components reference CSS custom properties defined in `app.css` via Tailwind's `@theme` directive:

**Background layers:**
- `--color-card`, `--color-canvas`, `--color-viewport`

**Interactive elements:**
- `--color-primary`, `--color-primary-hover`

**Typography:**
- `--color-headers`, `--color-labels`, `--color-meta`

**Status:**
- `--color-success`, `--color-alert`, `--color-warning`, `--color-pending`

**Shadows (elevation system):**
- `--shadow-card` (resting), `--shadow-md` (raised), `--shadow-floating` (modals/popovers)

### Chart Library

**Chart.js 4.x** is used for data visualizations (bar charts, line charts, sparklines). No Svelte wrapper library is used because existing wrappers are incompatible with Svelte 5 runes. Instead, Svelte components manage Chart.js lifecycle directly via `$effect`.

### Dependencies

| Package | Purpose |
|---------|---------|
| `bits-ui` | Headless accessible primitives (AlertDialog, Dialog, Select, etc.) |
| `clsx` | Conditional class joining |
| `tailwind-merge` | Tailwind class conflict resolution |
| `@lucide/svelte` | Icon library |
| `chart.js` | Data visualization (4.x) |

## Consequences

### Positive

- **Full control**: Components are project-owned, not black-box dependencies
- **Accessible by default**: bits-ui handles ARIA, keyboard navigation, focus management
- **Design system alignment**: CSS tokens ensure visual consistency across all components
- **Clean DX**: Barrel exports and `cn()` utility reduce import boilerplate

### Negative

- **Maintenance burden**: Project owns component code — bugs must be fixed in-house
- **bits-ui coupling**: Upgrading bits-ui may require updating component wrappers
- **No Svelte 5 Chart.js wrapper**: Manual lifecycle management for chart components

## References

- Platform Spec Chapter 26: UI Specification Addendum (component behavioral specs)
- ADR 002: Frontend Technology Stack
- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/)
- [bits-ui Documentation](https://www.bits-ui.com/)
