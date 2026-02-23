# 10. Decisions and Decision History

This chapter defines **Decisions** as a core abstraction of the system. Decisions are the authoritative mechanism by which Problems move through their lifecycle, visibility changes, and event-relevant actions are triggered. Unlike assessments or votes, decisions are *intentional acts* that alter the effective state of the system or record a formal recommendation.

---

## 10.1 Decisions as First-Class Entities

A **Decision** is a standalone, persistent entity that represents an explicit action taken by an identifiable actor at a specific point in time, in relation to a Problem.

Decisions are first-class because they:
- Exist independently of assessments, votes, or UI state.
- Are never inferred or derived implicitly.
- Are immutable once recorded.
- Are always attributable to an actor and a role.
- Are always timestamped.

Every meaningful state change of a Problem is the result of exactly one Decision. This includes transitions such as submission, acceptance, selection for a event, deferral, rejection, or opening/closing of pitch or review phases.

Decisions form the **authoritative event log** of the system. Any current state presented in the UI is a projection derived from the ordered sequence of Decisions associated with a Problem.

---

## 10.2 Binding vs. Non-Binding Decisions

The system distinguishes strictly between **binding decisions** and **non-binding decisions (recommendations)**.

- **Binding decisions** have immediate effect on the Problem’s state. They define what *is* the case.
- **Non-binding decisions** express an opinion, recommendation, or preparatory judgment. They define what *should be considered*, but do not change the active state.

This distinction is explicit and orthogonal to decision type:
- A recommendation is never implicitly binding.
- A binding decision is never inferred from multiple recommendations.

Typical examples:
- A moderator marking a problem as *selected for event* is a binding decision.
- An agent suggesting *acceptance with conditions* is a non-binding decision.
- Multiple moderator recommendations do not become binding unless an authorized actor records a binding decision.

This separation allows the system to:
- Capture deliberation processes without ambiguity.
- Preserve minority opinions and preparatory signals.
- Support asynchronous and distributed decision-making.

---

## 10.3 Decision Types and State Transitions

Each Decision has a **decision type** expressed in past tense (e.g. *submitted*, *accepted*, *deferred_low_priority*). Decision types are semantic labels that describe *what happened*, not *what should happen next*.

Decision types are mapped to **state transitions** on the Problem along two orthogonal axes:

- **Readiness state**: `draft`, `submitted`, `needs_changes`, `ready`, `rejected`
- **Action state**: `backlog`, `selected_for_event`, `selected_for_coding`, `deferred`, `dropped`, `closed`

A decision type may:
- Update one state axis,
- Update both,
- Or update neither (live orchestration decisions like opening/closing pitch or review).

**Important distinction**: Live orchestration modes (`pitch`, `review`, `idle`) are **not** action states. They are transient operational contexts tracked separately in the `event_live_context` table. Decisions like `opened_for_pitch_assessment` and `closed_for_review_assessment` affect the live context, not the problem's cached action state.

State transitions are deterministic and derived exclusively from the decision log. There is no direct mutation of Problem state outside this mechanism.

Importantly:
- Decisions are always associated with a **specific major version** of a Problem.
- Minor version context (e.g. repository commit hash) may be recorded for informational purposes but does not affect validity.

### Decision Type Taxonomy

The system defines 25 decision types across 8 categories:

**Lifecycle (4)**: Problem creation and evolution
- `problem_created`, `problem_cloned`, `problem_submitted`, `problem_updated`

**Quality Gate (3)**: Moderator review outcomes
- `quality_gate_accepted`, `quality_gate_rejected`, `quality_gate_needs_changes`

**Planning (2)**: Event agenda curation
- `selected_for_event`, `deselected_for_event`

**Sprint (2)**: Active work selection
- `selected_for_coding`, `deselected_for_coding`

**Deferral (6)**: Postponement with specific reasons
- `deferred_po_absent`, `deferred_low_priority`, `deferred_skipped`, `deferred_too_complex`, `deferred_needs_refinement`, `deferred_future_capability`

**Drop (2)**: Removal from consideration
- `dropped_low_relevance`, `dropped_low_quality`

**Close (2)**: Successful completion
- `closed_complete`, `closed_partial`

**Live (4)**: Assessment window orchestration
- `opened_for_pitch_assessment`, `closed_for_pitch_assessment`, `opened_for_review_assessment`, `closed_for_review_assessment`

See Chapter 19 for the complete `decision_type_catalog` with state effect mappings.

---

## 10.4 Authority Scope and Group Decisions

Every Decision records **who made it** and **in what capacity**.

Authority is determined by role and context:
- Problem Owners can submit, update, and comment on their own Problems.
- Moderators can curate, select, defer, and open/close pitch or review phases.
- Administrators can perform all moderator actions.
- Agents can only create **non-binding** decisions (recommendations).
- Observers may only comment.

Group decisions are supported without introducing a separate actor type:
- A single moderator may record a decision that represents a *group consensus*.
- The authority scope may reference a group context (e.g. “moderator team”, “event group”) without changing binding semantics.
- The binding nature of the decision is independent of whether it was reached individually or collectively.

This design avoids artificial constructs such as “system decisions” or “automatic transitions” and keeps responsibility explicit and human-readable.

---

## 10.5 Decision Log and Audit Trail

All Decisions are appended to a **Decision Log** associated with each Problem.

The Decision Log:
- Is strictly append-only.
- Preserves full chronological order.
- Includes binding and non-binding decisions.
- Does **not** include comments (qualitative feedback is captured via team chat in the `chat_messages` table per Chapter 31).
- Is never rewritten, compacted, or summarized destructively.

From the Decision Log, the system derives:
- Current readiness and action states.
- Visibility on dashboards.
- Eligibility for event phases.
- Historical explanations (“why is this problem here?”).

In the Problem Card UI, the Decision Log is rendered as a **decision history timeline**, allowing users to:
- Trace the evolution of a Problem across versions and events.
- Understand rationale through optional comments.
- Distinguish recommendations from authoritative outcomes.

The Decision Log is the system’s **single source of truth** for governance, accountability, and post-hoc analysis. All higher-level views, filters, and dashboards are projections over this log.
