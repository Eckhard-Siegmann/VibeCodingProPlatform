# ADR 002: Frontend Technology Stack

## Status

**Accepted** (2026-01-29, supersedes earlier Next.js 14 evaluation)

## Context

The platform requires a web frontend that:

- Renders assessment forms with multiple scale types (button scales, sliders) responsively across devices
- Supports server-side rendering for initial page loads
- Works on smartphones (375px viewport minimum) for all features including admin
- Enables rapid development with component-level reuse

An earlier evaluation (Ch.25 interview, 2026-01-28) selected Next.js 14 + shadcn/ui. After further assessment, the stack was changed before implementation began.

## Decision

### Core Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **SvelteKit 2.x** (Svelte 5 with runes) | Lighter weight than Next.js, excellent DX, built-in SSR, smaller bundle sizes |
| Styling | **Tailwind CSS 4.x** | Utility-first, responsive breakpoints (`sm:`, `md:`, `lg:`), `@theme` directive for design tokens |
| Form handling | **Superforms + Zod** | Progressive enhancement, schema-based validation |
| ORM | **Drizzle or Kysely** (open) | Type-safe queries compatible with both SQLite and PostgreSQL (see ADR 001) |

### Svelte 5 Runes

The project uses Svelte 5's runes API exclusively:

- `$state` for reactive state
- `$derived` for computed values
- `$props` for component properties
- `$effect` for side effects

No legacy Svelte 4 reactive syntax (`$:`, `export let`).

### Component Architecture

```
src/lib/
├── utils.ts                    # Utility functions (class merging, formatting)
├── config.ts                   # Application configuration constants
├── constants/                  # Centralized catalog mirrors
├── stores/                     # Client-side state (responses, session, toast)
├── server/                     # Server-only code
│   ├── db.ts                   # Database connection
│   ├── auth.ts                 # Authentication
│   └── repositories/           # Data access layer
└── components/
    ├── ui/                     # Primitive components (see ADR 003)
    ├── layout/                 # Page layout (PageContainer, Header)
    ├── rating/                 # Scale input components (ButtonScale, SliderScale)
    ├── assessment/             # Assessment form composition
    ├── problem/                # Problem Card sub-components
    ├── dashboard/              # Dashboard-specific components
    ├── moderation/             # Moderation controls
    └── charts/                 # Data visualization
```

### Scale Selection Logic

The framework's template syntax determines which rating component renders based on `max_rating`:

- `max_rating <= 7`: Button scale (discrete labeled buttons)
- `max_rating > 7`: Continuous slider (anti-anchoring for longitudinal comparison)

### Tailwind CSS 4.x Configuration

Design tokens are defined via `@theme` directive in `app.css` (not `tailwind.config.js`). This includes:

- Background layers: viewport, canvas, card
- Interactive element colors: primary, primary-hover
- Typography scale: headers, labels, meta
- Status colors: success, alert, warning, pending
- Shadow system: card, md, floating

## Consequences

### Positive

- **Smaller bundles**: Svelte compiles away the framework; no virtual DOM overhead
- **SSR built-in**: SvelteKit provides server-side rendering without additional configuration
- **Type safety**: Svelte 5 + TypeScript + Zod provide end-to-end type checking
- **Rapid iteration**: Hot module replacement, fast builds

### Negative

- **Smaller ecosystem**: Fewer pre-built components than React/Next.js
- **Svelte 5 is newer**: Some third-party libraries may not support runes API yet (e.g., Chart.js wrappers — see ADR 003)
- **Team familiarity**: Contributors may need to learn Svelte if coming from React background

### Superseded

- **Next.js 14 + shadcn/ui** (Ch.25 interview, 2026-01-28) — evaluated but not implemented

## References

- Platform Spec Chapter 26: UI Specification Addendum (behavioral requirements)
- Platform Spec Chapter 25: Interview Findings (original tech stack discussion)
- ADR 003: Component System Architecture (UI primitives)
