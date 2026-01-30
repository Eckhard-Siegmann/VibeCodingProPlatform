# 27. Appendix: Problem State Transitions

This appendix specifies how a **Problem** moves through the platform over time. It is a normative reference that operationalizes the conceptual model defined in Chapters 4, 10, 11, 14, and 19.

The system maintains two **orthogonal cached state dimensions** on each Problem:

- **`current_readiness_state`** — intrinsic quality and preparedness of the Problem Card
- **`current_action_state`** — community intent and workflow disposition

All meaningful state transitions are driven by **Decisions** (Chapter 10). Decisions are recorded in the `decisions` table and update the cached states on the `problems` table transactionally when binding.

---

## 27.1 State Dimensions

### Readiness States (5 states)

Per `readiness_state_catalog` (Ch.19.2.1):

| State Key | Meaning |
|-----------|---------|
| `draft` | Problem being authored, not yet submitted for review |
| `submitted` | Submitted for review, awaiting quality gate evaluation |
| `needs_changes` | Quality gate feedback received, refinement required before acceptance |
| `ready` | Quality gate passed, suitable for meetup consideration |
| `rejected` | Quality gate failed, not suitable in current form (terminal) |

### Action States (6 states)

Per `action_state_catalog` (Ch.19.2.2):

| State Key | Meaning |
|-----------|---------|
| `backlog` | General pool, available for future meetups |
| `selected_for_meetup` | Planned for upcoming/current meetup agenda |
| `selected_for_coding` | Actively being worked on in sprint (subset of selected for meetup) |
| `deferred` | Postponed to future (specific reason recorded in decision_type) |
| `dropped` | Removed from consideration, will not continue (terminal) |
| `closed` | Completed successfully, no further action needed (terminal) |

### Live Context (Separate from Action State)

**Important**: Live orchestration modes (`idle`, `pitch`, `review`) are **not** action states. They are tracked separately in the `meetup_live_context` table (Ch.19.3.4) and represent transient operational context during active meetups. Opening or closing a pitch/review assessment does not change the Problem's `current_action_state`.

---

## 27.2 Decision Types and State Effects

All state transitions are driven by decisions. The `decision_type_catalog` (Ch.19.2.3) defines 25 decision types across 8 categories. The `decision_state_effects` table (Ch.19.2.4) maps each decision type to its resulting state changes.

### Decision Type Summary

| Category | Decision Types | Affects Readiness | Affects Action |
|----------|---------------|-------------------|----------------|
| **Lifecycle** | `problem_created`, `problem_cloned`, `problem_submitted`, `problem_updated` | Yes | Some |
| **Quality Gate** | `quality_gate_accepted`, `quality_gate_rejected`, `quality_gate_needs_changes` | Yes | No |
| **Planning** | `selected_for_meetup`, `deselected_for_meetup` | No | Yes |
| **Sprint** | `selected_for_coding`, `deselected_for_coding` | No | Yes |
| **Deferral** | `deferred_po_absent`, `deferred_low_priority`, `deferred_skipped`, `deferred_too_complex`, `deferred_needs_refinement`, `deferred_future_capability` | No | Yes |
| **Drop** | `dropped_low_relevance`, `dropped_low_quality` | No | Yes |
| **Close** | `closed_complete`, `closed_partial` | No | Yes |
| **Live** | `opened_for_pitch_assessment`, `closed_for_pitch_assessment`, `opened_for_review`, `closed_for_review` | No | No |

### Key Invariants

1. **Binding vs. Non-binding**: Only binding decisions (`is_binding = true`) update cached states. Non-binding decisions (recommendations) enrich the audit trail but do not change state.

2. **Agents cannot bind**: Decisions created by actors with `role = 'agent'` are always `is_binding = false` (Ch.3.5, Ch.10.4).

3. **Comments are separate**: Comments are stored in the `comments` table (Ch.16, Ch.19.3.14), not as decisions. They do not affect state.

4. **Decisions are append-only**: Decisions are never edited or deleted. State changes are effected by appending new decisions that supersede earlier ones.

---

## 27.3 Walkthrough: From Draft to Quality Gate Acceptance

### Step 1: Problem Creation

A Problem begins in **draft** state. The Problem Owner (PO) creates a Problem (or clones one), receives immutable public/private URLs, and edits the Problem Card. Draft edits are auto-saved but not versioned until submission.

**Decision**: `problem_created` (binding, PO) or `problem_cloned` (binding, PO)

**Resulting States**:
- `current_readiness_state` = `draft`
- `current_action_state` = `backlog`

### Step 2: PO Self-Assessment (Optional)

The PO may complete a self-assessment using an Inventory (e.g., `problem_eval`). This produces **Assessment + Responses** but does not change state. Assessments are evaluative, not decisional (Ch.2.2, Ch.8).

### Step 3: Submission

The PO submits the Problem Card. Submission creates **Major Version 1** and locks the textual fields of that version. Further changes require creating a new major version.

**Decision**: `problem_submitted` (binding, PO)

**Resulting States**:
- `current_readiness_state` → `submitted`
- `current_action_state` unchanged (`backlog`)

### Step 4: Quality Gate Review

Moderators review the submitted Problem. They may:

1. **Leave comments** (stored in `comments` table, no state change)
2. **Request changes**: `quality_gate_needs_changes` (binding) → readiness becomes `needs_changes`
3. **Reject**: `quality_gate_rejected` (binding) → readiness becomes `rejected`
4. **Accept**: `quality_gate_accepted` (binding) → readiness becomes `ready`

### Step 5: Non-Binding Recommendations

Before a binding decision, moderators or agents may create **non-binding recommendations**:

**Decision**: `quality_gate_accepted` with `is_binding = false` (moderator or agent)

This enriches the audit trail and guides human decision-makers but does **not** update cached states.

### Step 6: Refinement Cycle (If Needed)

If `quality_gate_needs_changes` was recorded:

1. PO creates a new major version: `problem_updated` (binding, PO) → readiness returns to `draft`
2. PO refines the Problem Card
3. PO resubmits: `problem_submitted` (binding, PO) → readiness becomes `submitted`
4. Moderators re-evaluate

### Step 7: Binding Acceptance

A moderator (or moderator team) issues the binding decision to accept:

**Decision**: `quality_gate_accepted` (binding, moderator)

**Resulting States**:
- `current_readiness_state` → `ready`
- `current_action_state` unchanged

### Reversion Capability

At any point, moderators may reverse course by issuing a later binding decision:

- From `ready` back to `needs_changes`: `quality_gate_needs_changes` (binding)
- From `needs_changes` back to `ready`: `quality_gate_accepted` (binding)

The system reflects **what was decided last** while preserving the full decision history.

---

## 27.4 Curation Phase: Selecting for Meetup

After a Problem passes the Quality Gate (or even while still improving), moderators curate which Problems are planned for an upcoming meetup.

**Decision**: `selected_for_meetup` (binding, moderator)

**Resulting States**:
- `current_action_state` → `selected_for_meetup`
- `current_readiness_state` unchanged

**Decision**: `deselected_for_meetup` (binding, moderator)

**Resulting States**:
- `current_action_state` → `backlog`

This is **distinct from live orchestration**. Selection for meetup is queue/curation; opening a pitch is live orchestration tracked in `meetup_live_context`.

---

## 27.5 Live Meetup Phase: Pitch and Review

### Opening a Pitch Assessment

During the meetup, a moderator opens a pitch assessment for a Problem.

**Decision**: `opened_for_pitch_assessment` (binding, moderator)

**Effect on `meetup_live_context`**:
- `current_mode` = `pitch`
- `current_problem_id` = the Problem being pitched

**Effect on Problem states**: **None**. The Problem's `current_action_state` remains `selected_for_meetup`.

### Closing a Pitch Assessment

**Decision**: `closed_for_pitch_assessment` (binding, moderator)

**Effect on `meetup_live_context`**:
- `current_mode` = `idle`
- `current_problem_id` = NULL

### Selection for Coding

After pitch results and group discussion, a moderator records the sprint selection.

**Decision**: `selected_for_coding` (binding, moderator)

**Resulting States**:
- `current_action_state` → `selected_for_coding`

### Deselection from Coding

If a problem was selected for coding but participants lose interest:

**Decision**: `deselected_for_coding` (binding, moderator)

**Resulting States**:
- `current_action_state` → `selected_for_meetup` (not backlog—the problem was presented)

### Opening a Review Assessment

**Decision**: `opened_for_review` (binding, moderator)

**Effect on `meetup_live_context`**:
- `current_mode` = `review`
- `current_problem_id` = the Problem being reviewed

**Effect on Problem states**: **None**.

### Closing a Review Assessment

**Decision**: `closed_for_review` (binding, moderator)

**Effect on `meetup_live_context`**:
- `current_mode` = `idle`
- `current_problem_id` = NULL

Review assessments may remain open for extended periods (days or weeks) to support asynchronous participation.

---

## 27.6 Deferrals, Drops, and Closures

### Deferral Decisions

Deferral indicates a Problem remains valuable but is **not acted upon now**. All deferral decisions set `current_action_state` → `deferred`:

| Decision Type | Meaning |
|--------------|---------|
| `deferred_po_absent` | Problem Owner not available for this meetup |
| `deferred_low_priority` | Lower priority relative to other problems |
| `deferred_skipped` | Ran out of time, no judgment on problem quality |
| `deferred_too_complex` | Too complex for current sprint format |
| `deferred_needs_refinement` | Needs more work before ready for sprint |
| `deferred_future_capability` | Waiting for tools/skills not yet available |

Deferred problems remain visible in backlog views and can be reactivated via `selected_for_meetup`.

### Drop Decisions

Dropping indicates a Problem is **intentionally removed from further consideration**. All drop decisions set `current_action_state` → `dropped`:

| Decision Type | Meaning |
|--------------|---------|
| `dropped_low_relevance` | No longer relevant to meetup goals |
| `dropped_low_quality` | Fundamentally unsuitable, will not continue |

Dropped problems are excluded from default backlog views but remain auditable. The decision and rationale are preserved in the decision history.

### Close Decisions

Closure indicates successful completion. All close decisions set `current_action_state` → `closed`:

| Decision Type | Meaning |
|--------------|---------|
| `closed_complete` | Problem solved, goals fully achieved |
| `closed_partial` | Partially solved, good enough, moving on |

### Reactivation

Even after deferral, drop, or closure, a later binding decision may reactivate a Problem:

**Decision**: `selected_for_meetup` (binding, moderator)

**Resulting States**:
- `current_action_state` → `selected_for_meetup`

This demonstrates the system's core property: **decisions are append-only and any state can be superseded by a later binding decision**.

---

## 27.7 Asynchronous Team Decision Pattern

Moderators may operate synchronously or asynchronously. A common asynchronous pattern:

1. **Moderator A** posts a non-binding recommendation:
   - `selected_for_meetup` with `is_binding = false`

2. **Moderator B** posts the binding decision:
   - `selected_for_meetup` with `is_binding = true`

The invariant: **recommendations never change state; binding decisions do**.

This pattern applies to all decision types and supports distributed moderation across time zones or schedules.

---

## 27.8 Summary of Governing Rules

1. **Assessments produce data** — Responses are recorded but do not change state.

2. **Comments provide context** — Stored in `comments` table, never change state.

3. **Decisions change states** — Only binding decisions update cached states.

4. **All decisions are append-only** — History is never rewritten.

5. **States are revertible** — Any prior state can be superseded by a later binding decision.

6. **Readiness and action states are orthogonal** — They evolve independently based on different decision categories.

7. **Live context is transient** — Pitch/review modes are tracked in `meetup_live_context`, not in action state.

---

## 27.9 Relationship to Other Chapters

- **Chapter 4**: Defines readiness state and action state concepts
- **Chapter 10**: Defines decisions as first-class entities, binding vs. non-binding semantics
- **Chapter 11**: Defines meetup model and selection/deferral/drop semantics
- **Chapter 14**: Defines live interaction modes and their separation from action states
- **Chapter 16**: Defines comments as separate from decisions
- **Chapter 19**: Provides the complete data model including catalog tables and state effect mappings
