# 11. Event Model

This chapter defines the **Event** as a first-class organizing construct. While Problems, Assessments, and Decisions exist independently of any event, the Event provides the **temporal, social, and procedural frame** in which many of these artifacts are created, interpreted, and acted upon.

The Event model is deliberately lightweight: it structures coordination and visibility without imposing rigid workflows. Its primary purpose is to support *live orchestration*, *shared decision-making*, *transparent backlog evolution*, and *multi-location community coordination*.

**Note**: This chapter uses "Event" to refer to the primary organizational unit. The platform supports events across multiple locations (e.g., Cologne, Aachen), each hosted by partner organizations. See Chapter 29 for the full events, partners, and locations specification.

---

## 11.1 Event Entity and Temporal Structure

An Event represents a **bounded temporal occurrence** with a clear start and end, typically recurring in a series (e.g., monthly). Events can occur at different locations hosted by different partners.

Conceptually, an Event is defined by:

- A **time window** (begin and end timestamps)
- A **location** (partner venue with specific room and capacity)
- A **human context** (participants, moderators, hosts, remote vs. in-presence mix)
- A **decision context** in which Problems are evaluated, selected, deferred, or dropped
- A **team formation context** in which participants join problem teams

For the physical venue model (partners, locations, rooms) and capacity management, see Chapter 29.

The Event does **not** own Problems. Instead, it provides a temporal and spatial lens through which Problems are viewed and acted upon. The same Problem can be discussed at multiple events across locations.

Within the broader lifecycle of Problems, an Event introduces several distinct temporal phases that may overlap or extend beyond the physical event:

- **Pre-event phase**
  Problems may be registered, refined, pre-reviewed, and evaluated before the Event begins.

- **Live event phase**
  Pitches, live assessments, group discussions, team formation, and selections occur while participants are co-present (physically or virtually).

- **Extended review phase**
  Reviews and reflections may remain open after the Event, potentially until shortly before the next Event.

The system explicitly supports this extended temporal scope, recognizing that insight and evaluation often continue after the live session ends.

---

## 11.2 Problem Backlog and Sprint Planning

Each Event maintains a **problem backlog view**: a curated, filtered projection over all known Problems.

This backlog serves multiple purposes:

- As a **preparation tool** for moderators
- As a **shared situational awareness surface** for participants
- As the **primary interface** for live decision-making

Key characteristics of the Event backlog:

- It includes Problems from different origins:
  - Newly registered Problems
  - Deferred Problems from previous Events
  - Problems carried forward for reconsideration
  - Problems discussed at other locations (cross-pollination)
- It is **filterable and sortable**, for example by:
  - Creation time
  - Readiness state
  - Previous decisions
  - Location / partner association
  - Planned association with upcoming Events
- It hides Problems explicitly marked as rejected or dropped by default, while allowing moderators to reveal them when needed.

Sprint planning in this context is **lightweight and situational**. Rather than defining a fixed plan upfront, moderators and participants progressively shape the active set of Problems through decisions made before and during the Event.

Importantly, a Problem can be associated with an Event in different capacities:
- As *selected for event* (`selected_for_event`) — on the agenda for pitching consideration
- As *selected for coding* (`selected_for_coding`) — chosen for active sprint work (a subset of selected)
- As *deferred* (`deferred`) — postponed for future consideration

When a problem is `deselected_for_coding` (e.g., insufficient participant interest after pitch), it returns to `selected_for_event` status, not to backlog. The problem was presented at the event; it simply didn't receive a coding team.

These associations are expressed through Decisions, not through static fields on the Problem itself.

**Event-Specific Queue Tracking**: In addition to the Problem's global action state, each event maintains event-specific queue states (`candidate`, `selected_for_pitch`, `selected_for_coding`, `completed`) in the `event_problem_queue` table. These queue states are orthogonal to action states and enable event-specific backlog management. See Chapter 29.8 for the complete event-problem association specification.

---

## 11.3 Selection, Deferral, and Dropping Semantics

A central responsibility of the Event model is to support **clear, explicit outcomes** for Problems once collective attention has been applied.

The system distinguishes sharply between different reasons why a Problem is not worked on:

### Selection
A Problem is *selected* when the group decides to actively invest time and effort into it during the Event (e.g. for pitching or coding). Selection signals intent, not success.

### Deferral
Deferral indicates that a Problem remains valuable but is **not acted upon now**. The system supports six specific deferral decision types:

- `deferred_po_absent` — Problem Owner not available for this event
- `deferred_low_priority` — Lower priority relative to other problems
- `deferred_skipped` — Ran out of time, no judgment on problem quality
- `deferred_too_complex` — Too complex for current sprint format
- `deferred_needs_refinement` — Needs more work before ready for sprint
- `deferred_future_capability` — Waiting for tools/skills not yet available

Deferral explicitly keeps the Problem in the backlog (action state: `deferred`) and preserves its visibility for future Events. Deferred problems can be reactivated via a `selected_for_event` decision.

### Dropping
Dropping indicates that a Problem is **intentionally removed from further consideration**. The system supports two drop decision types:

- `dropped_low_relevance` — No longer relevant to community goals
- `dropped_low_quality` — Fundamentally unsuitable, will not continue

Crucially:
- Dropping a Problem does not erase it.
- The decision and its rationale remain visible in the decision history.
- Dropped Problems (action state: `dropped`) are excluded from default backlog views but remain auditable.

### Closure
Closure indicates that a Problem has been successfully worked on and reached completion. The system supports two close decision types:

- `closed_complete` — Problem solved, goals fully achieved
- `closed_partial` — Partially solved, good enough, moving on

Closed problems (action state: `closed`) represent successful outcomes and are preserved in the decision history for longitudinal analysis.

By modeling these outcomes explicitly, the system avoids ambiguous states such as "not chosen" or "forgotten" and instead records *why attention was allocated elsewhere*.

---

## 11.4 Live Orchestration During Events

During a live Event, the system shifts from preparation to **real-time orchestration**.

The central artifact for this phase is the **Event Dashboard**, which provides a shared, continuously updated view of:
- Which Problem is currently active
- Which assessments are open
- What decisions are being made in real time
- Team formation activity ("Challenge accepted")

Moderators operate the Dashboard, often while sharing their screen. From this interface, they can:
- Open or close pitch and review assessments
- Select or deselect Problems for active work
- Record group decisions with a single action
- Transition Problems between states in response to live discussion

Participants interact with the system primarily through:
- Problem Cards (with team chat and team formation via "Join as Dev" button)
- Assessment pages corresponding to the currently active context
- Team chat for real-time collaboration

When a problem transitions to `selected_for_coding`, the "Join as Dev" button becomes active on the Problem Card, enabling team formation (see Chapter 31.7).

A key design principle is **single-focus interactivity**:
At any given moment, there is at most one *interactive* assessment context presented as "currently open" for the Event. This avoids confusion and keeps group attention aligned.

If no interactive context is open, participants are clearly informed that no live rating is active, while still retaining access to Problem Cards, team chat, and historical information.

Through this mechanism, the Event model supports:
- Fluid transitions between Problems
- Collective sense-making
- Team formation and collaboration
- Minimal friction in live decision-making

without requiring rigid scripts or predefined agendas.

### Mobile Dashboard Priority Order

**Added 2026-02-05**: For Event Dashboard on mobile devices (Decision #26).

**Mobile (<768px) - Vertical Stack Priority**:
1. **Event Header** - Sticky or at top
2. **Live Banner** - Sticky (what's happening now)
3. **Current Interactive Activity** - Prominent (pitch/review/coding status)
4. **Selected Problems** - Scrollable list (problems for this event)
5. **Team Chat Preview** - Last 10 messages across all problems
6. **Backlog Preview** - Condensed (newly submitted, deferred-for-future)

**Collapsible Sections** (mobile):
- Current Activity: Collapsed if no active assessment
- Selected Problems: Collapsed if >5 problems
- Team Chat Preview: Default open, can collapse
- Backlog Preview: Default collapsed

**Rationale**: Most important information first. During live events, participants need current activity and selected problems immediately visible. Chat and backlog are secondary.

**Desktop (≥768px)**: Two or three-column layout with all sections visible simultaneously.

See Ch.12.4 for complete Event Dashboard specification.

---

## 11.5 Cross-Location Coordination

The Event model supports **multiple locations** within the same community:

- Problems exist independently of location
- A Problem discussed in Cologne can be picked up in Aachen
- Moderators have global visibility across all locations
- Decision history accumulates across events

This enables:
- **Cross-pollination**: Ideas and solutions travel between locations
- **Shared learning**: Patterns emerge across the community
- **Continuity**: Problems evolve through multiple events

---

The Event model thus acts as a **coordination layer**: it does not replace Problems, Assessments, or Decisions, but brings them together in time and space, enabling structured yet flexible collaboration across the community.
