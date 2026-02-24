# ADR 006: Decision Recording Architecture

## Status

**Accepted** (2026-02-24)

## Context

The platform specification defines 26 decision types across 8 categories (Ch.10, Ch.19 §19.2.3), a `decision_state_effects` mapping table (Ch.19 §19.2.4), an ejection cleanup invariant for the event queue (Ch.19 §19.3.19), and lazy timer auto-closure (Ch.14 §14.5.1.1). Each decision may trigger multiple side-effects: state changes on the problem, live context transitions, assessment lifecycle events, and queue mutations.

These side-effects must be orchestrated atomically — a partial application (e.g., decision inserted but queue not updated) would leave the system in an inconsistent state. The specification defines WHAT happens; this ADR captures HOW the side-effects are orchestrated in a single code path.

## Decision

All side-effects of a decision are executed in a **single database transaction**, in a **fixed order**, through a single orchestrator function (`recordDecision()`). No other code path may modify problem states, live context, or assessment lifecycle directly — all state changes flow through this function.

### Transaction Chain

The `recordDecision()` function executes the following steps within one transaction:

| Step | Action | Source Spec |
|------|--------|-------------|
| 1 | Fetch problem's current `readiness_state` and `action_state` | Ch.10 |
| 2 | Fetch `decision_state_effects` row for the decision type | Ch.19 §19.2.4 |
| 3 | Ensure `event_live_context` row exists (lazy initialization) | Ch.14 |
| 4 | Auto-close previous pitch if opening a new one (S8 invariant) | Ch.14 §14.5.1 |
| 5 | INSERT decision row into `decisions` table | Ch.10 |
| 6a | Apply readiness/action state effects to `problems` table | Ch.19 §19.2.4 |
| 6b | Ejection safety: if ejecting the currently active problem, force live context to idle and close open assessments | Ch.19 §19.3.19 |
| 7 | Update `event_live_context` (mode, timer, problem pointer) | Ch.14 §14.5 |
| 8 | Assessment lifecycle: create on open, close on close | Ch.08 |
| 9 | Queue sync: add, remove, or update `event_problem_queue` | Ch.19 §19.3.19 |

Step ordering is significant:
- Step 4 before Step 5: the auto-close decision must be recorded before the new decision.
- Step 6b before Step 9: ejection safety clears live context before queue removal, preventing a window where the queue lacks an entry that live context still references.
- Step 8 before Step 9: assessment closure must happen before queue removal, since assessment queries may join on queue entries.

### Semantic Decision Groupings

The centralized constants module (per Ch.19 §19.2.3 implementation requirement) defines typed sets for decision classification:

| Grouping | Members | Purpose |
|----------|---------|---------|
| `EJECTION_DECISIONS` | `deselected_for_event`, `quality_gate_rejected`, `dropped_low_relevance`, `dropped_low_quality` | Remove from queue + re-compact position indices |
| `CLOSING_DECISIONS` | `closed_complete`, `closed_partial` | Transition queue entry to `completed` state |
| `LIVE_DECISIONS` | `opened_for_pitch_assessment`, `closed_for_pitch_assessment`, `opened_for_review`, `closed_for_review` | Live context mode transitions |
| `MODE_CLOSE_DECISION` | `pitch` → `closed_for_pitch_assessment`, `review` → `closed_for_review` | Maps `current_mode` to the correct close decision type for timer auto-closure |

These groupings replace scattered inline string comparisons with a single typed vocabulary that mirrors the database catalog.

### Repository Module Pattern

Decision recording is split across two repository modules with clear ownership boundaries:

**`events` repository** — owns `recordDecision()`:
- The single orchestrator for all 26 decision types
- Owns `event_live_context` reads and writes
- Owns lazy timer evaluation (`checkAndCloseExpiredTimer()`)
- Calls into the queue repository for queue mutations

**`queue` repository** — owns queue CRUD:
- `addToQueue()` — appends to end, idempotent (returns existing if already present)
- `removeFromQueueRaw()` — deletes entry and re-compacts indices; **has no own transaction**, safe for use inside the outer decision transaction
- `removeFromQueue()` — wraps `removeFromQueueRaw()` in its own transaction for standalone API use
- `updateQueueState()` — updates `queue_state` column
- `reorderQueue()` — drag-and-drop reordering with own transaction

The `Raw` suffix convention signals that a function is designed for composition inside an existing transaction. Functions without the suffix manage their own transaction boundaries and are safe for direct API route use.

### Lazy Timer Evaluation

Per Ch.14 §14.5.1.1, `getLiveContext()` calls `checkAndCloseExpiredTimer()` before returning data. If the timer has expired, the function calls `recordDecision()` with:
- `decisionType`: looked up from `MODE_CLOSE_DECISION[current_mode]`
- `actorUserId`: the event's `host_user_id`
- `rationale`: `"Timer expired (auto-closed)"`

This reuses the full transaction chain — all side-effects (assessment closure, queue update, live context reset) apply identically to a manual close.

## Consequences

### Positive

- **Atomicity**: All side-effects succeed or fail together. No partial state on database errors.
- **Single code path**: All 26 decision types flow through one function, making behavior auditable and testable.
- **Timer reuse**: Lazy timer closure reuses `recordDecision()` rather than implementing a separate close path, ensuring identical side-effects.
- **Typed vocabulary**: Semantic groupings (`EJECTION_DECISIONS`, etc.) eliminate string comparison bugs and make decision classification explicit.

### Negative / Trade-offs

- **Large transaction scope**: The single transaction touches up to 5 tables (`decisions`, `problems`, `event_live_context`, `assessments`, `event_problem_queue`). Under high-throughput conditions this could cause lock contention. Acceptable at current scale (dozens of participants, ~50 decisions per event).
- **Monolithic orchestrator**: `recordDecision()` handles all decision types in one function with conditional branches. If decision types grow significantly beyond 25, consider a strategy pattern with per-category handlers. Not warranted at current scale.
- **Transaction nesting constraint**: `removeFromQueueRaw()` must not open its own transaction because SQLite (dev engine) does not support nested transactions. The `Raw` suffix convention must be followed consistently.

## References

- Platform Spec Ch.10 — Decision model
- Platform Spec Ch.14 §14.5.1.1 — Timer auto-closure architecture
- Platform Spec Ch.19 §19.2.3 — Decision type catalog + implementation requirement
- Platform Spec Ch.19 §19.2.4 — Decision state effects mapping
- Platform Spec Ch.19 §19.3.19 — Ejection cleanup invariant
- ADR 001 — Database engine strategy (SQLite dev / PostgreSQL prod)
- ADR 002 — Frontend technology stack (constants module convention)
