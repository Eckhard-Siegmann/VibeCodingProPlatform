# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **specification documentation project** for a professional, agentic, requirements-driven hackathon event system. The system enables humans and AI agents to jointly explore complex software problems through structured evaluation, decision-making, and longitudinal analysis.

**Philosophy**: "Pros for Pros" – low barriers, high trust, experienced practitioners who need little context.

**Two Use Cases**:
1. **Build the Platform**: Implement the event system according to the specification
2. **Teach the Culture**: Onboard participants to understand why this approach matters

---

## SPEC-FIRST Development Principle

**CRITICAL**: This project follows a strict **specification-first** approach.

### Rules

1. **Specification BEFORE Code**: All features must be fully specified in the `platform/` markdown documents before any implementation begins
2. **No Open Questions**: Coding is ONLY allowed when the specification is complete and no design questions remain open
3. **Amend Specs First**: When discussing new features or design decisions, always update the specification documents first
4. **Capture All Ideas**: Design discussions, alternatives, and future ideas must be recorded in the specs (use "Future Directions" or "Open Questions" sections)
5. **Database Schema in Spec**: Schema changes must be documented in Chapter 19 before modifying `database/schema.sql`

### Workflow

```
1. Discuss feature requirements
2. Identify open questions
3. Resolve questions with stakeholder
4. Document ALL decisions in platform/*.md
5. Update schema spec in Chapter 19
6. ONLY THEN proceed to implementation
```

### Where to Document

| Content Type | Location |
|-------------|----------|
| Feature specification | `platform/XX_chapter_name.md` |
| Schema changes | `platform/19_data_model_and_persistence.md` |
| UI specifications | `platform/13_problem_card_user_interface.md` or `platform/26_specification_addendum_UI.md` |
| Future ideas (not MVP) | Section "Future Directions" in relevant chapter |
| Open questions | `platform/22_open_questions_and_deferred_specifications.md` |

---

## Document Structure

### Specification (`platform/` directory, Chapters 00-33)

The technical specification is organized as numbered markdown files in the `platform/` directory:

| Chapters | Topics |
|----------|--------|
| **00-02** | Introduction, purpose, scope, design principles, conceptual overview |
| **03-05** | Roles/authority model, problems, problem cards, versioning |
| **06-09** | Repositories, inventories, items, assessments, voting |
| **10-11** | Decisions, state transitions, event model |
| **12-18** | UI specifications (dashboards, problem cards, live interaction, team chat, admin, auth) |
| **19-22** | Data model (PostgreSQL), system logs, extensibility, open questions |
| **23-24** | Appendix: User stories, item & inventory bootstrap data |
| **25-26** | Addenda: Interview findings, UI specification addendum |
| **27-28** | Appendix: Problem transitions, transition diagram |
| **29-33** | Community platform: Events/locations, registration, team chat, onboarding, participant experience |

### Motivational & Vision Documents (root directory)

| File | Purpose |
|------|---------|
| `Motivation HoliCASE_V0.6.md` | **North Star**: HoliCASE – Holistic Compliance & Audit Software Engineering. The 4LC taxonomy defining auditable, specification-driven software development |
| `Motivation DSPy like artifact optimization.md` | **Paradigm**: Treating skills and agents as optimizable artifacts against requirements and tests. The mechanism for systematic improvement |

### Participant-Facing Documents (root directory)

| File | Purpose |
|------|---------|
| `Beginners_Intro.md` | **Presentation companion**: 10-page introduction explaining the event's purpose, quality dimensions, evaluation architecture, and vision (for onboarding presentations) |
| `problem_creation_best_practices.md` | **Guide for Problem Owners**: How to create effective Problem Cards, spectrum of readiness, tooling documentation |
| `Announcement_VibeCoding-Professionals_Meetup.md` | Event announcement with full agenda |
| `Announcement_VibeCoding-Professionals_Meetup_LinkedIn.md` | LinkedIn-style promotional text |

### Other

- `manual/`: Additional guides (e.g., writing and maintaining problem cards)
- `deprecated/`: Superseded drafts (ignore)

---

## Core Domain Concepts

- **Problem**: A challenge/task that persists across versions and events
- **Problem Card**: Versioned representation of a problem (analogous to Model Cards)
- **Inventory**: Structured collection of evaluation items (reusable instruments)
- **Item**: Immutable evaluation primitive with question, scale, and labels
- **Assessment**: Application of an inventory to a problem version
- **Decision**: Explicit, timestamped action that changes state or records outcomes
- **Comment**: Qualitative feedback stored separately from decisions

---

## Key Design Principles

1. **Immutability over Mutation**: Historical truth is never overwritten; changes create new versions
2. **Separation of Content/Evaluation/Decision**: These are independent artifacts, not conflated
3. **Explicit over Implicit**: All state changes recorded as Decisions with timestamps and actors
4. **Human-Centered First, Agent-Ready**: Workflows must work for humans; agents participate but cannot make binding decisions
5. **Decisions as Single Source of Truth**: No separate activity log; decisions table IS the event log
6. **Business Value First**: Problems are selected for personal/strategic value to participants; dogfooding is secondary

---

## Quality Dimensions (from Inventory Bootstrap)

The event measures code quality across these dimensions:

| Dimension | Meaning |
|-----------|---------|
| **Correctness** | Meets requirements, handles edge cases |
| **Test Support** | Evidence convincingly demonstrates correctness |
| **Readability** | Easy to understand (naming, structure, local reasoning) |
| **Simplicity** | No unnecessary complexity or bloat |
| **Elegance** | Fitting language constructs, clean teachable structure |
| **Extensibility** | Accommodates likely changes without overengineering |

These dimensions enable **semantic comparison** of solutions produced by different agentic tools (Claude Code, Cursor, Codex, Antigravity, etc.) even when syntactic implementations differ significantly.

---

## Dual-State Model for Problems

Problems have two orthogonal states:
- **Readiness State**: Intrinsic quality (draft, submitted, needs_changes, ready, rejected)
- **Action State**: Community intent (backlog, selected_for_event, selected_for_coding, deferred, dropped, closed)

---

## Authentication and Identity Model

**All users must authenticate** to participate (Chapter 18):

### Authentication Methods
- **Local**: Email + password (10+ chars, uppercase, lowercase, numbers)
- **GitHub OAuth**: Convenient for developers
- **LinkedIn OAuth**: Professional networking context

### Identity Principles
- **Email as unique identifier**: Same email = same user across events and locations
- **Persistent attribution**: Contributions tracked across events in Cologne, Aachen, etc.
- **No anonymous participation**: All actions attributable to authenticated users
- **Privacy controls**: Users can opt out of public contributor wall

### User Types
- **Problem Owners**: Create and edit problems (authenticated required)
- **Developers**: Join teams, contribute solutions (authenticated required)
- **Observers**: Vote, chat, participate (authenticated required)
- **Moderators**: Email + password + elevated privileges (global scope across locations)
- **Administrators**: Full system access including inventory management
- **Agents**: First-class actors with `role = agent`, can only create non-binding decisions

---

## Database

PostgreSQL with append-only event sourcing. SQLite supported for development. Key tables:

### Core Domain Tables
| Table | Purpose |
|-------|---------|
| `users` | Unified: humans + agents, with authentication (email, password_hash, OAuth IDs) |
| `problems` | Problem identity + cached states (readiness + action) |
| `problem_versions` | Major versions of Problem Cards |
| `problem_repo_snapshots` | Minor versions (commit hashes) |
| `inventories` | Evaluation instruments |
| `items` | Immutable evaluation items (unified 5-point scale) |
| `inventory_items` | Composition (references `item_key`) |
| `assessments` | Inventory applications |
| `responses` | Atomic answers (references `item_id`, requires `user_id` NOT NULL) |
| `decisions` | Event log for all state changes (IS the activity log) |

### Community Platform Tables
| Table | Purpose |
|-------|---------|
| `partners` | Partner organizations hosting events |
| `locations` | Physical venues (cities/addresses) |
| `rooms` | Specific rooms with capacity info |
| `events` | Event instances with hosts, dates, venues, overbooking factor |
| `event_registrations` | User registrations with waitlist support |
| `event_attendance` | Actual attendance tracking for overbooking optimization |
| `event_live_context` | Current live orchestration state (pitch/review modes, countdown timers) |
| `event_problem_queue` | Problem-event associations |

### Team Collaboration Tables
| Table | Purpose |
|-------|---------|
| `problem_teams` | Teams formed around problems (one per problem per event) |
| `problem_team_members` | Team membership (version-scoped onboarding) |
| `problem_resources` | URLs and resources linked to problems (direct vs helpful) |
| `chat_messages` | Real-time team chat with threading, @mentions, reactions |
| `chat_mentions` | @mentions in chat for notifications |
| `chat_reactions` | Emoji reactions (curated set of 10) |
| `lessons_learned` | Structured insights captured post-event |

### Recognition & Engagement Tables
| Table | Purpose |
|-------|---------|
| `contribution_points` | Append-only points ledger (effort/content quality) |
| `star_awards` | Hacking excellence awards (1st/2nd/3rd place) |
| `user_milestones` | First-time achievements tracking |
| `user_hint_dismissals` | Onboarding guidance state |

### Catalog Tables (Controlled Vocabularies - VARCHAR + FK pattern)
| Table | Purpose |
|-------|---------|
| `readiness_state_catalog` | 5 readiness states (draft, submitted, needs_changes, ready, rejected) |
| `action_state_catalog` | 6 action states (backlog, selected_for_event, selected_for_coding, deferred, dropped, closed) |
| `decision_type_catalog` | 25 decision types across 8 categories |
| `decision_state_effects` | Maps decisions to state changes |
| `time_context_catalog` | Assessment time contexts (pre_event, pitch, review, post_event, late_reflection) |
| `user_role_catalog` | 7 roles (observer, developer, coding_partner, problem_owner, moderator, admin, agent) |
| `auth_provider_catalog` | Authentication methods (local, github, linkedin) |
| `partner_type_catalog` | Partner organization types |
| `chat_context_catalog` | Chat situational contexts |
| `resource_type_catalog` | Resource types (direct, helpful) |
| `problem_type_catalog` | Problem classifications (explorative, greenfield, advanced_greenfield, brownfield, reverse_engineering, other) |
| `team_member_role_catalog` | Team roles (po, po_deputy, coder) |
| `team_member_status_catalog` | Membership status (active, retired) |
| `contribution_action_catalog` | Point-earning actions (admin-configurable weights) |
| `review_weight_catalog` | Review weighting for star calculations |
| `emoji_catalog` | Curated set of 10 reaction emojis |
| `lesson_category_catalog` | Lesson learned categories (tooling, architecture, process, gotcha, performance, testing) |

### Deprecated/Removed Tables
| Table | Status | Notes |
|-------|--------|-------|
| `sessions` | **REMOVED** | All participation requires mandatory authentication (Ch.18, Ch.19.3.2) |
| `comments` | **DEPRECATED** | Retained for historical data only; new feedback uses `chat_messages` (Ch.31, Ch.19.3.19) |

### Hybrid Item Reference Model

- `inventory_items` → references `item_key` (the concept)
- `responses` → references `item_id` (concrete version at response time)

---

## The Bigger Picture

The event platform is the **bootstrap engine** for a larger vision:

1. **HoliCASE** (Motivation doc) defines the destination: auditable, traceable, specification-driven software where every line of code satisfies a control, which satisfies a normative clause

2. **DSPy-style optimization** (Motivation doc) defines the mechanism: skills and agents as optimizable artifacts against requirements and tests – enabling systematic improvement and LLM migration

3. **The community events** generate the quality benchmarks, comparative data, and institutional memory that make increasingly ambitious goals achievable

The evaluation data we collect feeds directly into understanding which tools and approaches produce code meeting professional quality standards.

---

## Multi-Location Community Model

The platform supports **multiple locations** within a unified community:
- **Currently**: Cologne (STARTPLATZ) and Aachen
- **Problems travel** between locations — discussed in Cologne, picked up in Aachen
- **Moderators have global scope** — can moderate any event at any location
- **Knowledge sharing** via lessons learned flagged as "valuable" surfaces across locations
- **Unified contributor recognition** — points and stars accumulate across entire community
- **Cross-pollination** — insights and solutions flow between locations

---

## When Editing Specifications

- Chapter 01 (`platform/01_purpose_scope_and_design_principles.md`) is **normative**; later chapters must not contradict it
- Maintain separation between content, evaluation, and decision-making concepts
- Use past tense for decision_type catalog entries
- Preserve append-only semantics for historical data
- **New qualitative feedback uses `chat_messages`**, not deprecated `comments` table
- Tooling documentation goes in PR descriptions, not in the database
- Controlled vocabularies use **VARCHAR + FK reference tables** (not enums) for extensibility without migration

### Soft SSOT Principle (Balancing Single Source of Truth with Readability)

The specification follows a **balanced approach** to cross-chapter duplication:

**When duplication is ALLOWED (for readability):**
- Short definitions and concepts (1-2 sentences) that provide local context
- Brief reminders of key constraints when relevant to understanding
- Essential context needed to comprehend a section without constant cross-referencing
- Small lists (≤5 items) that aid comprehension

**When duplication should be REMOVED (SSOT principle):**
- Long explanations (>3 paragraphs) — replace with cross-references
- Complete catalog tables and definitions — appear once in Ch.19, referenced elsewhere
- Detailed procedures and workflows — single authoritative chapter, others reference it
- Rationales and design justifications — belong in conceptual/design chapters

**Cross-referencing best practices:**
- Use explicit chapter references: "See Chapter 18 for authentication specification"
- For catalog tables: "From `time_context_catalog` (Chapter 19.2.5)"
- For complex topics: Brief 1-sentence summary + reference to authoritative chapter

**Examples of good balance:**
- ✓ Ch.09 briefly states "All participation requires mandatory authentication (Chapter 18)" — provides context + reference
- ✓ Ch.08 lists seven roles inline when explaining response metadata — aids local comprehension
- ✗ Duplicating full authentication flow across Ch.09 and Ch.18 — violates SSOT
- ✗ Repeating entire decision type catalog in multiple chapters — belongs in Ch.19 only

## When Creating Participant Materials

- Reference `Beginners_Intro.md` for the canonical explanation of why the architecture matters
- Reference `problem_creation_best_practices.md` for Problem Owner guidance
- Emphasize business value first, dogfooding second
- Connect quality dimensions to the inventory items in `platform/24_appendix_item_inventory_bootstrap.md`

---

## Frontend Design & Development Workflow

### MANDATORY Design-First Sequence

All frontend work follows a strict 4-step process:

1. **SPECIFICATION FIRST** (`platform/*.md`)
   - Merge UI design decisions into relevant specification chapters
   - Resolve any conflicts with existing specs
   - Document component behavior, states, and interactions
   - Chapters 12-14, 26: Primary UI specification chapters

2. **TEMPLATE CREATION/AMENDMENT** (`frontend/templates/`)
   - Update `template_collection.md` with new patterns
   - Create reusable Svelte components in `frontend/templates/components/`
   - Document when and how to use each template
   - Ensure accessibility compliance (WCAG 2.1 AA)

3. **SITE DESIGN DOCUMENTS** (`frontend/pagedesign/`)
   - Create detailed page-specific specifications
   - Document which templates are used and how they compose
   - Specify role-based visibility and state management
   - Problem Card has 3 perspectives: PO/Deputy, Observer, Moderator/Admin

4. **IMPLEMENTATION** (`frontend/query/src/`)
   - Implement using documented templates and patterns
   - **MANDATORY**: Use `frontend-design` skill for all UI work
   - Follow established component architecture
   - Maintain design system consistency

### Page Design Documents

Each UI page requires a design specification in `frontend/pagedesign/`:

| File | Purpose | Status |
|------|---------|--------|
| `assessment_form_design.md` | Survey/pitch/review rating interface | **To be created retroactively** |
| `finished_popup_design.md` | Assessment completion confirmation | **To be created retroactively** |
| `problem_card_design.md` | Problem Card with 3 perspectives | **To be created** |
| `dashboard_design.md` | Participant and moderator dashboards | TBD |
| `event_detail_design.md` | Event information and registration | TBD |
| `landing_page_design.md` | Public landing page | TBD |

**Problem Card Perspectives** (must be documented in `problem_card_design.md`):
1. **Problem Owner / Deputy PO**: Edit controls, submission, resource management
2. **Observer**: View-only, assessment links when open, suggestion capability
3. **Moderator / Admin**: All decision controls, quality gate, event selection

### Design System Foundation

**Style Guide**: `frontend/template/frontend style guide.md`
- Three-layer background: viewport (#DCEBFF) → canvas (#F1F2F8) → card (#FEFEFE)
- Etched 3D separator technique
- Shadow system: resting (minimal) and floating (elevated)
- Full color token system in `frontend/query/src/app.css`

**Visual References**:
- `frontend/template/template example.png` - Dashboard with proper shadows
- `frontend/template/5-point-likert-scale.png` - Rating matrix pattern

### Skill Usage

**MANDATORY**: The `frontend-design` skill MUST be invoked for:
- Creating new UI components
- Modifying existing component designs
- Implementing page layouts
- Styling and visual refinement
- Ensuring design system consistency

Do NOT implement frontend code without first using the `frontend-design` skill.

---

## Lessons Learned

### Web Crypto API Requires Secure Context

**Problem**: `crypto.subtle` (used for SHA-256 hashing) is only available in secure contexts (HTTPS or localhost). When testing on mobile devices via local network IP address (`http://192.168.x.x:5173`), the API is undefined and operations fail silently.

**Symptoms**: Features work on localhost but fail on mobile devices connected via HTTP over local network. Crypto-dependent functionality breaking only on mobile.

**Solution**: Always provide fallbacks for `crypto.subtle`:

```typescript
export async function hashData(data: string): Promise<string> {
  // crypto.subtle is only available in secure contexts (HTTPS or localhost)
  if (crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple hash for development over HTTP
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(16).padStart(8, '0');
}
```

**Related considerations**:
- Relax validation schemas for development (e.g., hash length)
- Add try/catch around localStorage access (may be blocked in private browsing)
- Test on actual mobile devices over network, not just browser dev tools mobile emulation

### Team Chat Replaces Comments

**Decision**: The `comments` table is **deprecated** (Ch.16, Ch.19.3.19). All new qualitative feedback flows through the `chat_messages` system (Ch.31).

**Rationale**:
- Chat provides richer context (problem, event, team, situation)
- Real-time updates during events
- Threading, @mentions, and emoji reactions
- Better discoverability via filters
- Supports team formation and collaboration

**Migration**: Historical comments remain in the database for audit. New features should use chat exclusively.

### Contributor Recognition: Points vs Stars

**Two distinct recognition types** (Ch.33):
- **Points**: Reward quality content contribution (assessments, reviews, valuable chat/lessons)
- **Stars**: Reward hacking excellence (1st/2nd/3rd place based on review scores)

**Weights** (admin-configurable in `contribution_action_catalog` and `review_weight_catalog`):
- Review assessment completed: 1 point
- Valuable contribution (≥2 👍 or 💡 reactions): 1 point
- Problem submitted: 1 point
- Problem pitched: 1 point
- Problem coded: 1 point

**Review weighting for stars**:
- Live reviews: 1.0x
- Post-event reviews: 1.5x (more time to verify)
- Agent reviews: 0.5x (supporting, not authoritative)

---

## Frontend Development Quick Reference

This section provides essential guidance for agents working on frontend implementation.

### Project Structure

```
frontend/
├── query/                      # SvelteKit application
│   ├── src/
│   │   ├── app.css             # Tailwind + design tokens (@theme)
│   │   ├── lib/
│   │   │   ├── utils.ts        # cn() utility for class merging
│   │   │   ├── config.ts       # App configuration constants
│   │   │   ├── stores/         # Svelte stores (responses, session)
│   │   │   ├── server/         # Server-only code
│   │   │   │   ├── db.ts       # Database connection (better-sqlite3)
│   │   │   │   ├── auth.ts     # Authentication (demo: hardcoded user)
│   │   │   │   └── repositories/  # Data access layer
│   │   │   └── components/
│   │   │       ├── ui/         # Primitive components (shadcn-style)
│   │   │       │   ├── card/   # Card, CardHeader, CardTitle, etc.
│   │   │       │   ├── badge/  # Badge with state variants
│   │   │       │   ├── button/ # Button with variants
│   │   │       │   ├── alert-dialog/  # Modal dialogs (bits-ui)
│   │   │       │   ├── ConfirmDialog.svelte
│   │   │       │   └── LoadingSpinner.svelte
│   │   │       ├── layout/     # PageContainer, Header
│   │   │       ├── rating/     # ButtonScale, SliderScale
│   │   │       ├── assessment/ # AssessmentForm, ItemRow, etc.
│   │   │       └── problem/    # ProblemCard and sub-components
│   │   └── routes/             # SvelteKit routes
│   │       ├── +page.svelte    # Landing page
│   │       ├── problem/[slug]/ # Problem Card views
│   │       ├── assess/[assessmentId]/ # Assessment form
│   │       └── api/            # API endpoints
│   └── package.json
├── template/                   # Design system documentation
│   └── frontend style guide.md
├── templates/                  # Reusable patterns
│   └── template_collection.md
└── pagedesign/                 # Page-specific designs
    └── *.md
database/
├── schema.sql                  # Full database schema
├── seed_reference_data.sql     # Catalogs, items, inventories
├── seed_demo_data.sql          # Demo users, problems, assessments
└── .sqlite-tools/              # SQLite binaries (Windows)
    └── sqlite3.exe
```

### Database Setup (REQUIRED before running frontend)

The frontend requires a SQLite database at `database/event.db`. If it doesn't exist or routes return 500 errors:

```bash
# Navigate to database directory
cd database

# Windows (PowerShell or Git Bash):
./.sqlite-tools/sqlite3.exe event.db ".read schema.sql"
./.sqlite-tools/sqlite3.exe event.db ".read seed_reference_data.sql"
./.sqlite-tools/sqlite3.exe event.db ".read seed_demo_data.sql"

# Verify tables exist:
./.sqlite-tools/sqlite3.exe event.db ".tables"
```

**Seed files must run in order:**
1. `schema.sql` — Creates all tables
2. `seed_reference_data.sql` — Populates catalogs (items, inventories, decision types, etc.)
3. `seed_demo_data.sql` — Creates demo users, problems, assessments

### Starting/Stopping the Dev Server

```bash
# Navigate to frontend
cd frontend/query

# Install dependencies (first time or after package.json changes)
npm install

# Start dev server
npm run dev

# Start with network access (for mobile testing)
npm run dev -- --host

# Build for production (also validates TypeScript)
npm run build

# Type-check without building
npm run check
```

**Dev server URLs:**
- Local: `http://localhost:5173`
- Network: `http://<your-ip>:5173` (with `--host`)

**Demo routes to test:**
| Route | Description |
|-------|-------------|
| `/` | Landing page with demo links |
| `/problem/111` | Problem Card (PO/owner view, editable) |
| `/problem/11` | Problem Card (public view, read-only) |
| `/assess/pitch-11` | Pitch assessment form |
| `/assess/review-11` | Review assessment form |

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | SvelteKit 2.x + Svelte 5 | Uses runes (`$state`, `$derived`, `$props`) |
| Styling | Tailwind CSS 4.x | `@theme` directive in app.css, NOT tailwind.config.js |
| Components | shadcn-svelte style | Built on bits-ui primitives |
| Database | better-sqlite3 | SQLite for dev, PostgreSQL for prod |
| Validation | Zod | Schema validation for API payloads |

### Component System (shadcn-svelte)

**Import pattern** — Use barrel exports:
```svelte
import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
```

**Card** — Visual containment with elevation:
```svelte
<Card elevation="resting">  <!-- flat | resting | raised | floating -->
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <!-- content -->
</Card>
```

**Badge** — Status indicators with semantic variants:
```svelte
<!-- Readiness states -->
<Badge variant="draft">Draft</Badge>
<Badge variant="submitted">Submitted</Badge>
<Badge variant="ready">Ready</Badge>

<!-- Action states -->
<Badge variant="backlog">Backlog</Badge>
<Badge variant="selected_for_event">Selected</Badge>
```

**Button** — Actions with variants:
```svelte
<Button variant="default">Primary Action</Button>   <!-- blue -->
<Button variant="secondary">Secondary</Button>      <!-- gray -->
<Button variant="ghost">Tertiary</Button>           <!-- transparent -->
<Button variant="destructive">Danger</Button>       <!-- red -->
```

**cn() utility** — Merge Tailwind classes safely:
```typescript
import { cn } from '$lib/utils';
<div class={cn('base-class', condition && 'conditional', className)}>
```

### Applying Specifications

**Before implementing ANY feature:**

1. **Find relevant spec chapters:**
   - UI behavior → Ch.12-14, Ch.26
   - Data model → Ch.19
   - Problem states → Ch.5, Ch.27
   - Assessments → Ch.8-9
   - Authentication → Ch.18

2. **Check page design docs** (`frontend/pagedesign/`):
   - Component composition
   - State management
   - Role-based visibility

3. **Reference the style guide** (`frontend/template/frontend style guide.md`):
   - Color tokens
   - Shadow system
   - Spacing conventions

4. **Update spec if needed** — New UI patterns must be documented in Ch.26.11 before implementation.

### Common Pitfalls

| Problem | Cause | Solution |
|---------|-------|----------|
| 500 error on all routes | Database missing | Run schema.sql + seed files |
| `item_text` vs `full_text` | Column name mismatch | Repository uses `item_text AS full_text` |
| FK constraint on insert | Invalid catalog value | Check `*_catalog` tables for valid values |
| Component not found | Wrong import path | Use `$lib/components/ui/card` not `$lib/components/ui/Card.svelte` |
| Styles not applying | Tailwind v4 syntax | Use `@theme` in app.css, not tailwind.config.js |
| crypto.subtle undefined | HTTP over network | Use localhost or provide fallback (see Lessons Learned) |

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/app.css` | Design tokens (`@theme`), color system, shadows |
| `src/lib/utils.ts` | `cn()` class merge utility |
| `src/lib/server/db.ts` | Database connection singleton |
| `src/lib/server/auth.ts` | Demo auth (returns hardcoded user) |
| `src/lib/server/repositories/*.ts` | Data access (problems, assessments, items) |
| `src/lib/stores/responses.ts` | Assessment response state |
| `src/lib/stores/session.ts` | User session state |

### Testing Changes

After any change:
```bash
# Quick validation
npm run build

# Or run dev and check routes manually
npm run dev
# Then visit: /, /problem/111, /assess/pitch-11
```

All routes should return HTTP 200. Check browser console for client-side errors.