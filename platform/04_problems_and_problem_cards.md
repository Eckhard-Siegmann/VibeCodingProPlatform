# 4. Problems and Problem Cards

This chapter defines the **Problem** as the central domain object and introduces the **Problem Card** as its primary working surface. It clarifies how problems are identified, versioned, shared, evaluated, and transitioned through the event lifecycle, while maintaining strict separation between content, evaluation, and decisions.

---

## 4.1 Problem Identity and Immutable URLs (Public vs. Private)

A **Problem** represents a persistent conceptual entity: *“this challenge”*, independent of how it is described, refined, or evaluated over time.  
Its identity is established **once**, at creation, and never changes.

### Immutable Problem Identity

Each Problem is assigned a stable internal identifier at creation time. This identifier:

- Remains constant across all versions of the Problem Card.
- Is independent of repository state, assessments, or decisions.
- Serves as the anchor for all evaluations, decisions, and historical analysis.

### Problem Creation and Identity

Creating a problem requires **authentication** (see Chapter 18). The authenticated user becomes the Problem Owner (PO).

- The user's email ensures persistent identity across the platform
- The user can create multiple problems
- Attribution is tied to their authenticated account
- Moderators can contact Problem Owners through the platform

### URL Model

Each Problem has a **public URL** using a human-readable slug:

```
/problem/{slug}
```

Examples:
- `/problem/rag-retrieval-quality`
- `/problem/code-eval-agent`

Access control is **role-based**, not URL-based:
- All authenticated users can view public problem details
- Only the Problem Owner can edit their problems
- Moderators and Admins have elevated access

**Note**: The previous "private URL" model (security by obscurity) is deprecated. Access is now controlled via authentication.

### Best Practices and Help

During drafting, the Problem Card UI displays a link to the **Best Practices Guide** (`problem_creation_best_practices.md`). This guide covers:
- How to write effective problem descriptions
- The spectrum from exploratory ideas to well-specified benchmarks
- Repository setup recommendations
- Tooling documentation for PR submissions

**Exploratory and rough problems are welcome.** The event culture encourages submitting ideas that aren't fully formed. Moderators can help refine rough concepts into workable problems. A great intuition is more valuable than a mediocre specification.

### Archival Behavior

Problems can be archived by the Problem Owner via a binding `problem_archived` decision (Ch.10.3). This decision sets the `archived_at` timestamp on the `problems` table (Ch.19.3.10) and is recorded in the decision log like any other state change.

Archiving does **not** change readiness or action state. It is an orthogonal flag:

- Removes the Problem from default listings and dashboards.
- Does **not** invalidate existing URLs.
- Preserves all historical data for reference and analysis.
- Prevents further edits unless explicitly cloned or reactivated via a new version.

---

## 4.2 Problem Card as Central Working Artifact

The **Problem Card** is the canonical, versioned representation of a Problem.  
It is the *single source of truth* for everything that describes, contextualizes, and frames the Problem.

### Scope and Responsibilities

A Problem Card typically contains:

- Title and concise problem statement
- Detailed description and motivation
- Expected value or relevance
- **Direct Resources**: Repositories and resources directly relevant to the problem
- **Helpful Artifacts**: Repositories and resources with useful reference material
- Structural metadata (problem type, task count) — see "Informative Metadata" below
- Version metadata and change notes
- Team chat display (see Chapter 31)
- "Challenge accepted" button for team formation

The Problem Card is intentionally **content-focused**. It does not store votes, ratings, or decisions directly; instead, it acts as the anchor that those artifacts reference.

### Resource Lists

Each problem maintains **two distinct resource lists**:

**Direct Resources** (`resource_type = 'direct'`)
- The problem's own repository
- Related specifications or documentation
- Test suites or validation tools
- Resources essential for understanding/solving the problem

**Helpful Artifacts** (`resource_type = 'helpful'`)
- Reference implementations
- Similar projects for inspiration
- Learning resources
- Tools and libraries that may help

#### Edit Permissions for Resources

| Actor | Direct Resources | Helpful Artifacts |
|-------|-----------------|-------------------|
| Problem Owner | Add/Edit | Add/Edit |
| Team Members | Add/Edit | Add/Edit |
| Moderators | Add (auto-approved) | Add (auto-approved) |
| Observers | Suggest (PO approves) | Suggest (PO approves) |

### Team Formation

Users can join a problem's team by clicking **"Join as Dev"** on the Problem Card. Team members gain access to shared chat, can contribute resources, and collaborate on solutions. See Chapter 31 for the complete team formation specification and Chapter 13 for UI details.

### Breakout Room URL

Each problem-event team has an optional **breakout room URL** (e.g., Google Meet, Zoom):

- Can be added by PO, moderator, or any team member
- Displayed prominently in the Problem Card when team is formed
- Facilitates video collaboration during sprints

### Lessons Learned Log

Each Problem has a distinct **Lessons Learned Log** — a structured repository of insights that emerge from working on the problem. Unlike chat messages (which flow chronologically), lessons learned are curated, categorized knowledge artifacts.

**Note**: This is distinct from the `lessons_learned` **inventory** (Ch.24), which is a post-event assessment questionnaire using structured rating items. The Lessons Learned **Log** captures freeform insights; the `lessons_learned` **inventory** captures quantitative reflections.

**Why separate from chat?**
- Insights often emerge days or weeks after an event
- Lessons need structure (categories, tags, valuable flags) for analysis
- Agents can mine lessons learned for pattern detection
- Cross-location knowledge sharing requires filterable insights

**Structure:**
- **Content**: The insight text
- **Category**: Predefined (tooling, architecture, process, gotcha, performance, testing)
- **Tags**: Optional freeform tags for additional context
- **Valuable flag**: Marked for cross-location sharing
- **Event context**: Which event this insight came from

**Visibility:**
- Displayed prominently on Problem Card, **above** the team chat
- Allows filtering by category and event
- "Valuable" lessons are surfaced to other locations

See Chapter 13 for UI specification and Chapter 19 for data model.

### Versioning Model

Problem Cards are **versioned explicitly** through a two-layered model:

- **Major Versions** represent deliberate semantic changes to the problem definition
- **Minor Versions** track repository state evolution via commit hashes

Only one major version is active at any time. Earlier versions remain accessible in read-only historical view mode.

**See Chapter 5** for the complete versioning specification, including version creation triggers, rollback semantics, and repository snapshot mechanics.

### Informative Metadata

The following fields on problems and problem versions are **purely informative** — they aid human understanding and future analytics but do not drive workflow logic or trigger any automated behavior.

**Problem Type** (`problem_type`)

Classifies the nature of the problem:

| Type | Description |
|------|-------------|
| `explorative` | Early-stage idea exploration, not yet fully formed |
| `greenfield` | New project from scratch, no existing code |
| `advanced_greenfield` | Building on existing greenfield work |
| `brownfield` | Existing codebase with constraints |
| `reverse_engineering` | Understanding and documenting existing system |
| `other` | Does not fit other categories |

**Task Count** (`task_count`)

The number of sub-tasks or milestones identified in the problem. This is a **complexity indicator** that shows structural evolution across versions:

- v1 with `task_count = 1` → monolithic, undifferentiated problem
- v2 with `task_count = 4` → decomposed into sub-tasks

Task details themselves live in the repository (in markdown, issues, or project boards). The platform does not track individual tasks — only the count as metadata.

**Future direction**: Agents may analyze repositories to suggest subtask decomposition and automate task counting.

**Why informative only?**

These fields help moderators and participants understand the problem's nature at a glance. They enable filtering and analytics (e.g., "How do greenfield problems compare to brownfield?"). But they do not affect state transitions, permissions, or workflow — those are driven exclusively by decisions (see Chapter 10).

### Editing and Submission Semantics

- Editing is autosaved while a Problem is in *draft* state.
- Once a Problem is **submitted**, its current major version becomes immutable.
- Further changes require creating a **new major version**.
- This ensures that all assessments and decisions are always tied to a well-defined, stable snapshot.

---

## 4.3 Readiness State vs. Action State

To avoid overloaded or ambiguous status flags, the system separates the notion of *what a Problem is like* from *what is being done with it*.

This is achieved through two orthogonal state dimensions:

---

### Readiness State

The **Readiness State** reflects the *intrinsic quality and preparedness* of the Problem Card itself.

The system defines five readiness states:

- **Draft** — Problem being authored, not yet submitted for review
- **Submitted** — Submitted for review, awaiting quality gate evaluation
- **Needs Changes** — Quality gate feedback received, refinement required before acceptance
- **Ready** — Quality gate passed, suitable for event consideration
- **Rejected** — Quality gate failed, not suitable in current form

Readiness answers questions such as:

- Is the problem well-defined?
- Is it understandable and testable?
- Is it aligned with the event’s quality standards?

Readiness is primarily influenced by:
- Problem Owner actions
- Moderator or agent assessments
- Quality-gate decisions

---

### Action State

The **Action State** reflects *what the community intends to do* with the Problem in the event context.

The system defines six action states:

- **Backlog** — General pool, available for future events
- **Selected for Event** — Planned for upcoming/current event agenda
- **Selected for Coding** — Actively being worked on in sprint (subset of selected for event)
- **Deferred** — Postponed to future (with specific reason recorded in decision)
- **Dropped** — Removed from consideration, will not continue
- **Closed** — Completed successfully, no further action needed

Note: Live orchestration modes (pitch open, review open) are **not** action states. They are transient operational contexts derived from decisions and tracked separately in the `event_live_context` table. See Chapter 14 for live interaction modes.

Action answers questions such as:

- Will this problem be pitched?
- Will it be worked on in this event?
- Is it postponed to a future event?

Action State is typically driven by:
- Moderator decisions
- Group decisions during live sessions
- Practical constraints (time, attendance, focus)

---

### Why the Separation Matters

Separating readiness from action enables important distinctions:

- A high-quality problem may be deferred due to time constraints.
- A low-priority problem may be well-defined but intentionally skipped.
- A rejected problem may be rejected for *relevance*, not *quality*.
- A deferred problem may later be reactivated without re-evaluating quality.

This dual-state model ensures that the system can represent real-world decision-making without forcing false equivalences or losing nuance.

---

Together, immutable Problem identity, the Problem Card as a versioned working artifact, and the dual-state model form the structural core on which assessments, decisions, dashboards, and analytics are built.

---

## 4.4 Mobile Interface Patterns

**Added 2026-02-05**: Mobile-specific display patterns for Problem Card.

### Collapsible Sections

**Mobile (<768px)**: Problem Card sections are collapsible to reduce scroll length (Decision #28).

**Default Collapsed**:
- Lessons Learned Log
- Decision History

**Default Open**:
- Description & Resources
- Assessments
- Team Section
- Team Chat

**Implementation**: AccordionSection component (Ch.26.11.20)
- Tap section header to expand/collapse
- Smooth 200ms height animation
- Chevron icon rotates to indicate state

**Desktop (≥768px)**: All sections always visible, no collapsing. Accordion disabled for optimal information density.

### Avatar Display

**Added 2026-02-05**: Visual identity for users throughout Problem Card.

**Problem Owner in Header**:
- InitialAvatar component (size="lg", 48px)
- Colored circle with initials (e.g., "MM" for Max Mustermann)
- Deterministic color from user_id (8-color palette)
- Positioned before problem title

**Team Members**:
- InitialAvatar (size="md", 36px) before each name
- Ordering: PO (first) → Deputy → Active Coders → Retired
- Online indicator: Green dot if user currently viewing problem (future)

**Chat Messages**:
- InitialAvatar (size="sm", 32px) before message bubbles
- Omitted for own messages (right-alignment indicates ownership)
- Grouped messages: Avatar shown only on first in group

**Specification**: See Ch.26.11.16 for complete avatar specification and Ch.26.15.2 for chat-specific usage.
