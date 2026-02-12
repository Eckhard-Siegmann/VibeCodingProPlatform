# 4. Problems and Problem Cards

This chapter defines the **Problem** as the central domain object and introduces the **Problem Card** as its primary working surface. It clarifies how problems are identified, versioned, shared, evaluated, and transitioned through the meetup lifecycle, while maintaining strict separation between content, evaluation, and decisions.

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

Creating a problem requires providing an **email address**. This email:
- Creates a password-less user record (or reuses an existing one with the same email)
- Enables attribution of the problem to its owner
- Allows moderators to contact Problem Owners when needed

No password is set; the Problem Owner does not "log in" to edit their problem. Instead, access is granted via the private URL.

### Dual URL Model

Each Problem is associated with **two immutable, hash-based URLs**, generated once at creation and never modified:

- **Public URL (Viewer URL)**
  - Read-only access.
  - Intended for sharing, discussion, and transparency.
  - Visible to anyone with the link.
  - Allows commenting and viewing assessments, but no editing.

- **Private URL (Editor URL)**
  - Full edit access to the Problem Card.
  - Treated as confidential ("security by obscurity").
  - Clearly marked in the UI with warnings such as *"Do not share this screen"*.
  - Intended for the Problem Owner (PO) and trusted collaborators.

Upon creation, the private URL is:
- **Displayed immediately** on screen (with a prompt to bookmark it)
- **Sent via email** to the provided address

These URLs exist independently of authentication. However, authenticated users (e.g. Moderators, Admins) may additionally gain controlled access via login-based permissions.

### Best Practices and Help

During drafting, the Problem Card UI displays a link to the **Best Practices Guide** (`problem_creation_best_practices.md`). This guide covers:
- How to write effective problem descriptions
- The spectrum from exploratory ideas to well-specified benchmarks
- Repository setup recommendations
- Tooling documentation for PR submissions

**Exploratory and rough problems are welcome.** The meetup culture encourages submitting ideas that aren't fully formed. Moderators can help refine rough concepts into workable problems. A great intuition is more valuable than a mediocre specification.

### Archival Behavior

Problems can be archived or rendered inactive for future meetups. Archiving:

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
- Repository URL (primary, typically GitHub)
- Optional secondary URL (documentation, demo, etc.)
- Structural metadata (e.g. problem type, complexity indicators)
- Version metadata and change comments
- Links to assessments, decisions, and comments

The Problem Card is intentionally **content-focused**. It does not store votes, ratings, or decisions directly; instead, it acts as the anchor that those artifacts reference.

### Versioning Model

Problem Cards are **versioned explicitly**:

- **Major Versions**  
  Represent deliberate, user-triggered updates (e.g. “Modify / Update Problem”).  
  Examples:
  - Refinement of the problem statement
  - Structural changes to the task
  - Alignment after moderator feedback
  - Rollback to an earlier version (implemented as a new major version)

- **Minor Versions**  
  Represent repository-level evolution, captured automatically via lightweight GitHub snapshots (e.g. HEAD commit hash).  
  Minor versions:
  - Do not change the Problem Card text.
  - Provide contextual grounding for assessments and votes.
  - Enable fine-grained temporal analysis when repositories evolve during evaluations.

At any time, **only one major version is active**. Earlier versions remain accessible in read-only “archived view” mode.

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

Typical readiness states include (conceptually):

- Draft (not yet submitted)
- Submitted
- Accepted (possibly with objections)
- Rejected (e.g. low quality, unclear, unsuitable)

Readiness answers questions such as:

- Is the problem well-defined?
- Is it understandable and testable?
- Is it aligned with the meetup’s quality standards?

Readiness is primarily influenced by:
- Problem Owner actions
- Moderator or agent assessments
- Quality-gate decisions

---

### Action State

The **Action State** reflects *what the community intends to do* with the Problem in the meetup context.

Examples include:

- Selected for meetup
- Selected for pitch
- Selected for coding
- Deferred (for various reasons)
- Dropped

Action answers questions such as:

- Will this problem be pitched?
- Will it be worked on in this meetup?
- Is it postponed to a future meetup?

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
