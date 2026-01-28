# 10. Decisions and Decision History

This chapter defines **Decisions** as a core abstraction of the system. Decisions are the authoritative mechanism by which Problems move through their lifecycle, visibility changes, and meetup-relevant actions are triggered. Unlike assessments or votes, decisions are *intentional acts* that alter the effective state of the system or record a formal recommendation.

---

## 10.1 Decisions as First-Class Entities

A **Decision** is a standalone, persistent entity that represents an explicit action taken by an identifiable actor at a specific point in time, in relation to a Problem.

Decisions are first-class because they:
- Exist independently of assessments, votes, or UI state.
- Are never inferred or derived implicitly.
- Are immutable once recorded.
- Are always attributable to an actor and a role.
- Are always timestamped.

Every meaningful state change of a Problem is the result of exactly one Decision. This includes transitions such as submission, acceptance, selection for a meetup, deferral, rejection, or opening/closing of pitch or review phases.

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
- A moderator marking a problem as *selected for meetup* is a binding decision.
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
- **Readiness state** (e.g. drafting, submitted, ready, needs_changes, rejected)
- **Action state** (e.g. unplanned, selected_for_meetup, pitch_open, review_open, deferred, dropped)

A decision type may:
- Update one state axis,
- Update both,
- Or update neither (purely informational decisions, such as comments).

State transitions are deterministic and derived exclusively from the decision log. There is no direct mutation of Problem state outside this mechanism.

Importantly:
- Decisions are always associated with a **specific major version** of a Problem.
- Minor version context (e.g. repository commit hash) may be recorded for informational purposes but does not affect validity.

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
- The authority scope may reference a group context (e.g. “moderator team”, “meetup group”) without changing binding semantics.
- The binding nature of the decision is independent of whether it was reached individually or collectively.

This design avoids artificial constructs such as “system decisions” or “automatic transitions” and keeps responsibility explicit and human-readable.

---

## 10.5 Decision Log and Audit Trail

All Decisions are appended to a **Decision Log** associated with each Problem.

The Decision Log:
- Is strictly append-only.
- Preserves full chronological order.
- Includes binding and non-binding decisions.
- Includes comments as a specific decision type.
- Is never rewritten, compacted, or summarized destructively.

From the Decision Log, the system derives:
- Current readiness and action states.
- Visibility on dashboards.
- Eligibility for meetup phases.
- Historical explanations (“why is this problem here?”).

In the Problem Card UI, the Decision Log is rendered as a **decision history timeline**, allowing users to:
- Trace the evolution of a Problem across versions and meetups.
- Understand rationale through optional comments.
- Distinguish recommendations from authoritative outcomes.

The Decision Log is the system’s **single source of truth** for governance, accountability, and post-hoc analysis. All higher-level views, filters, and dashboards are projections over this log.
