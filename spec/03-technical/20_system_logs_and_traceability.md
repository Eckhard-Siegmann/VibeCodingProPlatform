# 20. System Logs and Traceability

This chapter specifies how the system ensures **observability, traceability, and analytical rigor** across time. Logging is not treated as an operational afterthought, but as a **core epistemic capability**: the system is designed to explain itself, reconstruct past states, and support longitudinal research on human–AI collaboration, decision-making, and agentic workflows.

The logging model is intentionally explicit, append-only, and actor-attributed. Nothing “just happens” in the system without leaving a traceable artifact.

---

## 20.1 Activity Logging via Decisions

### Design Principle: Decisions as the Activity Log

There is **no separate activity_log table**. The `decisions` table serves as the authoritative event log for the entire system. This design follows the principle that **decisions are the single source of truth**.

### Purpose and Scope

The decisions table provides a **chronological, human-readable record** of what happened in the system. It answers questions such as:

- What happened, in what order?
- Who (or what) initiated an action?
- In which context did the action occur?
- How did the system evolve during a meetup?

Decision records are **descriptive**, not normative in themselves—but binding decisions do determine system state.

---

### What Gets Logged

All meaningful state changes are recorded as decisions, including:

- Submission, acceptance, and rejection of Problems
- Selection, deferral, and dropping of Problems
- Opening and closing of Assessments (pitch, review, post-meetup, etc.)
- Moderator actions such as opening a pitch, closing a review, or initiating a group decision
- Agent-generated recommendations (non-binding)

Each decision entry records:

- Timestamp
- Actor identity (human or agent)
- Whether the decision is binding or a recommendation
- Target Problem and version
- Decision type (verb in past tense)
- Optional rationale

**Comments** are stored separately in the `comments` table but can be queried alongside decisions for a complete activity view.

---

### Visibility and Usage

Activity views are **projections over the decisions table**:

- **Problem Card – Decision History**:
  Shows all decisions related to that Problem, useful for POs and moderators.
- **Moderator Dashboard – Activity Feed**:
  Recent decisions filtered by meetup, supporting situational awareness.
- **Administrative Views**:
  Full system-wide decision access for debugging, auditing, and research purposes.

Decisions are **append-only**. They are never edited or deleted.

---

## 20.2 Decision and Assessment Traceability

While activity logs answer *what happened*, traceability answers *why the system is in its current state*.

To achieve this, the system distinguishes sharply between:
- **Assessments** (evaluations, ratings, reflections)
- **Decisions** (state-changing or authoritative acts)

Both are fully traceable and cross-linked.

---

### Decision Traceability

Every Decision is stored as a first-class entity and linked to:

- The Problem it concerns
- The **major version** of the Problem at the time of decision
- Optionally, the **minor version** (e.g. repository snapshot hash)
- The actor who made the decision
- The actor’s role
- Whether the decision is **binding** or a **recommendation**
- A decision type (controlled vocabulary, past tense)
- An optional comment or rationale

This enables reconstruction of:

- The full decision history of a Problem
- Diverging recommendations versus final binding decisions
- Group decisions versus individual moderator decisions
- Changes in readiness or action state over time

On the Problem Card, decisions appear as a **Decision History** timeline, forming the authoritative narrative of how the Problem progressed.

---

### Assessment Traceability

Assessments are traceable along complementary dimensions:

- Which Inventory was used
- Which Items were presented
- Which version of the Problem was assessed
- In which situational context (time phase, role, location)
- Whether the assessment occurred pre-meetup, during pitch, during review, or post-meetup

Assessment responses are never overwritten. This allows:

- Comparison of assessments across Problem versions
- Paired pre/post analyses
- Role-based stratification (e.g. PO vs Observer vs Developer)
- Detection of shifts in perception over time

Crucially, **Assessments do not change system state**. Their influence is mediated only through Decisions, preserving a clean causal chain.

---

## 20.3 Reproducibility and Longitudinal Research Support

The combined logging and traceability model enables the system to function not only as an operational tool, but as a **longitudinal research platform**.

---

### Reproducibility Guarantees

The system is designed so that any historical state can be reconstructed with high fidelity:

- Problem versions are immutable once archived.
- Items are immutable; changes create new Items.
- Inventories are versioned implicitly via their Item composition.
- Assessments reference concrete Item IDs and Problem versions.
- Decisions explicitly record when and by whom state changes occurred.

As a result, historical analyses are not corrupted by later schema or wording changes.

---

### Longitudinal Analysis Capabilities

The data model supports analyses such as:

- How perceived clarity or complexity of a Problem evolves across versions
- Whether moderator recommendations align with later group decisions
- How agent-generated recommendations compare to human judgments
- How the same Problem is evaluated differently before and after live discussion
- Which types of Problems tend to be deferred, rejected, or selected over time

Because situational dimensions (time phase, role, presence) are orthogonal and explicit, researchers can isolate effects without confounding.

---

### Research-by-Design Philosophy

Traceability is not bolted on after the fact. It is a **design constraint**:

- Every meaningful action leaves a trace.
- Every trace has an actor and a context.
- No inference is required to understand causality.

This makes the system particularly suitable for:
- Studying agentic coding practices
- Benchmarking human–AI collaboration
- Evaluating decision-making quality under time pressure
- Comparing frameworks, tools, and orchestration strategies over multiple meetups

In short, the system does not merely *host* hackathons — it **remembers them in a form that can be studied, challenged, and learned from**.
