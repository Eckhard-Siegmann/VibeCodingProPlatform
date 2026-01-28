# 11. Meetup Model

This chapter defines the **Meetup** as a first-class organizing construct. While Problems, Assessments, and Decisions exist independently of any meetup, the Meetup provides the **temporal, social, and procedural frame** in which many of these artifacts are created, interpreted, and acted upon.

The Meetup model is deliberately lightweight: it structures coordination and visibility without imposing rigid workflows. Its primary purpose is to support *live orchestration*, *shared decision-making*, and *transparent backlog evolution*.

---

## 11.1 Meetup Entity and Temporal Structure

A Meetup represents a **bounded temporal event** with a clear start and end, typically recurring in a series (e.g. monthly). Conceptually, a Meetup is defined by:

- A **time window** (begin and end timestamps)
- A **human context** (participants, moderators, remote vs. in-presence mix)
- A **decision context** in which Problems are evaluated, selected, deferred, or dropped

The Meetup does **not** own Problems. Instead, it provides a temporal lens through which Problems are viewed and acted upon.

Within the broader lifecycle of Problems, a Meetup introduces several distinct temporal phases that may overlap or extend beyond the physical event:

- **Pre-meetup phase**  
  Problems may be registered, refined, pre-reviewed, and evaluated before the Meetup begins.

- **Live meetup phase**  
  Pitches, live assessments, group discussions, and selections occur while participants are co-present (physically or virtually).

- **Extended review phase**  
  Reviews and reflections may remain open after the Meetup, potentially until shortly before the next Meetup.

The system explicitly supports this extended temporal scope, recognizing that insight and evaluation often continue after the live session ends.

---

## 11.2 Problem Backlog and Sprint Planning

Each Meetup maintains a **problem backlog view**: a curated, filtered projection over all known Problems.

This backlog serves multiple purposes:

- As a **preparation tool** for moderators
- As a **shared situational awareness surface** for participants
- As the **primary interface** for live decision-making

Key characteristics of the Meetup backlog:

- It includes Problems from different origins:
  - Newly registered Problems
  - Deferred Problems from previous Meetups
  - Problems carried forward for reconsideration
- It is **filterable and sortable**, for example by:
  - Creation time
  - Readiness state
  - Previous decisions
  - Planned association with upcoming Meetups
- It hides Problems explicitly marked as rejected or dropped by default, while allowing moderators to reveal them when needed.

Sprint planning in this context is **lightweight and situational**. Rather than defining a fixed plan upfront, moderators and participants progressively shape the active set of Problems through decisions made before and during the Meetup.

Importantly, a Problem can be associated with a Meetup in different capacities:
- As a *candidate* for pitching
- As *selected* for live coding
- As *deferred* for future consideration

These associations are expressed through Decisions, not through static fields on the Problem itself.

---

## 11.3 Selection, Deferral, and Dropping Semantics

A central responsibility of the Meetup model is to support **clear, explicit outcomes** for Problems once collective attention has been applied.

The system distinguishes sharply between different reasons why a Problem is not worked on:

### Selection
A Problem is *selected* when the group decides to actively invest time and effort into it during the Meetup (e.g. for pitching or coding). Selection signals intent, not success.

### Deferral
Deferral indicates that a Problem remains valuable but is **not acted upon now**. Multiple deferral semantics are supported, such as:
- Problem Owner absent
- Lower priority relative to other Problems
- Skipped due to time constraints
- Deferred for future capability improvements
- Deferred due to excessive complexity at present

Deferral explicitly keeps the Problem in the backlog and preserves its visibility for future Meetups.

### Dropping
Dropping indicates that a Problem is **intentionally removed from further consideration**. Typical reasons include low relevance or fundamentally insufficient quality.

Crucially:
- Dropping a Problem does not erase it.
- The decision and its rationale remain visible in the decision history.
- Dropped Problems are excluded from default backlog views but remain auditable.

By modeling these outcomes explicitly, the system avoids ambiguous states such as “not chosen” or “forgotten” and instead records *why attention was allocated elsewhere*.

---

## 11.4 Live Orchestration During Meetups

During a live Meetup, the system shifts from preparation to **real-time orchestration**.

The central artifact for this phase is the **Meetup Dashboard**, which provides a shared, continuously updated view of:
- Which Problem is currently active
- Which assessments are open
- What decisions are being made in real time

Moderators operate the Dashboard, often while sharing their screen. From this interface, they can:
- Open or close pitch and review assessments
- Select or deselect Problems for active work
- Record group decisions with a single action
- Transition Problems between states in response to live discussion

Participants interact with the system primarily through:
- Problem Cards
- Assessment pages corresponding to the currently active context

A key design principle is **single-focus interactivity**:
At any given moment, there is at most one *interactive* assessment context presented as “currently open” for the Meetup. This avoids confusion and keeps group attention aligned.

If no interactive context is open, participants are clearly informed that no live rating is active, while still retaining access to Problem Cards and historical information.

Through this mechanism, the Meetup model supports:
- Fluid transitions between Problems
- Collective sense-making
- Minimal friction in live decision-making

without requiring rigid scripts or predefined agendas.

---

The Meetup model thus acts as a **coordination layer**: it does not replace Problems, Assessments, or Decisions, but brings them together in time, enabling structured yet flexible collaboration.
