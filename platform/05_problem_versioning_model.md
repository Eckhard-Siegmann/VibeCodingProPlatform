# 5. Problem Versioning Model

This chapter defines the **versioning semantics of Problems and Problem Cards**. Versioning is a foundational mechanism that enables longitudinal evaluation, reproducibility, and transparent evolution of problem statements over time.

The model deliberately distinguishes **semantic change** from **repository activity**. These are captured through **Major Versions** and **Minor Versions**, respectively. Together, they allow precise attribution of evaluations, decisions, and discussions to the exact state of a Problem at a given point in time.

---

## 5.1 Major Versions (Semantic Changes, Submissions, Rollbacks)

A **Major Version** represents a *semantic snapshot* of a Problem Card. It captures a coherent state of the problem definition, including its descriptive text, metadata, constraints, and intent.

### Definition and Purpose
Major Versions exist to answer the question:  
**“What was the problem, as defined, at the time this was evaluated or decided upon?”**

A new Major Version is created whenever:
- A Problem Owner submits a draft for formal consideration.
- A previously submitted Problem is intentionally modified (e.g. clarified, restructured, re-scoped).
- A rollback is performed to reinstate an earlier semantic state.

Major Versions are:
- Identified by monotonically increasing integers (1, 2, 3, …).
- Immutable once created.
- Mutually exclusive in terms of validity: **only one Major Version is active at any time**.

### Drafting vs. Persisted Versions
During drafting, edits are applied directly and continuously. These edits are not versioned.  
A Major Version is only created at the moment of **intentional promotion** (e.g. “Submit Problem”, “Update Problem”).

Version `0` exists conceptually during drafting but is **never persisted**. Persisted history begins at Major Version `1`.

### Submissions and Locking
Once a Major Version is created:
- Its textual fields are locked.
- Further changes require explicit creation of a new Major Version.
- This ensures that evaluations and decisions always reference a stable semantic target.

### Rollbacks as Forward Operations
Rollbacks do not revert history. Instead:
- An earlier Major Version can be promoted again.
- This creates a **new Major Version** whose content is identical to the earlier one.
- The rollback is recorded as an explicit act, with an auto-generated or user-provided comment.

This preserves a linear, auditable history while allowing recovery from undesirable changes.

---

## 5.2 Minor Versions (Repository Snapshots via Commit Hashes)

While Major Versions capture *semantic intent*, **Minor Versions capture repository state**.

### Definition and Purpose
A **Minor Version** represents the state of the linked repository at the moment an interaction occurs, encoded via a **commit hash** (typically the HEAD commit).

Minor Versions answer the question:  
**“Which concrete repository state was this evaluation based on?”**

They are:
- Derived automatically from the repository URL.
- Represented implicitly as an integer index mapped to a commit hash.
- Always associated with a specific Major Version.

### Automatic Minor Version Creation
Minor Versions are created lazily:
- When an Assessment is submitted, the frontend retrieves the current commit hash.
- If this hash has not yet been seen for the active Major Version, a new Minor Version index is created.
- Subsequent assessments referencing the same hash reuse the existing Minor Version.

This allows multiple participants to evaluate slightly different repository states **without forcing explicit version creation by the Problem Owner**.

### Orthogonality to Semantic Changes
Minor Versions do **not** imply semantic change:
- Repository activity may occur without updating the Problem Card.
- Conversely, the Problem Card may change without repository updates.

By separating these concerns, the system avoids conflating:
- “The problem was redefined”
- “The implementation evolved”

Both dimensions remain analyzable independently.

---

## 5.3 GitHub Availability and Minor Version Nullability

Minor Versions require access to the repository's HEAD commit hash. In cases where GitHub is unavailable (network issues, API limits, rate limiting, or private repositories), the system allows assessments to proceed with `minor_version = NULL`.

This pragmatic accommodation ensures:
- Evaluations can continue even when repository snapshots cannot be captured
- The system remains usable under degraded conditions
- Human-centered workflows take priority over technical completeness

See Chapter 19 (Data Model) for schema implementation and Chapter 25 (Interview Findings) for the graceful degradation strategy.

---

## 5.4 Versioning and Event Association

When problems are associated with events (see Chapter 29), assessments and team participation reference **specific major versions**. This enables:

**Version-Scoped Evaluation**:
- Participants evaluate the version that was active when the event began
- Assessment data remains linked to the semantic snapshot being evaluated
- Version changes between events enable longitudinal quality analysis

**Team Membership Scoping**:
- Teams form around a specific major version (see Chapter 31)
- When Problem Owners create new major versions, team membership resets
- This prepares problems for fresh collaboration across multiple events

**Longitudinal Analysis**:
- How problem definitions evolve based on event feedback
- Whether version refinements correlate with improved evaluations
- Cross-event patterns in problem maturity and solution quality

See Chapter 29.8 for event-problem association mechanics.

---

## Relationship to Other Chapters

- **Chapter 4**: Defines Problems and Problem Cards as the versioned artifacts
- **Chapter 6**: Repositories and external references tracked via minor versions
- **Chapter 8**: Assessments reference specific problem versions
- **Chapter 10**: Version creation and rollback operations are logged as decisions
- **Chapter 13**: Problem Card UI displays version navigation and historical views
- **Chapter 19**: Data model for `problem_versions` and `problem_repo_snapshots` tables

---

## Summary

The Problem Versioning Model establishes a **two-layered, orthogonal notion of change**:

- **Major Versions** capture intentional, semantic evolution of the problem definition.
- **Minor Versions** capture incidental, technical evolution of the repository.

Together, they enable:
- Reproducible evaluation.
- Transparent decision histories.
- Longitudinal insight into how problems mature across events and agentic workflows.

This model underpins the system’s ability to treat Problems as *living artifacts* without sacrificing rigor or traceability.
