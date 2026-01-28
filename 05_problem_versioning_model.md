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

## 5.3 Version Navigation and Historical Views

The Problem Card UI exposes versioning explicitly and transparently.

### Default View
By default, users see:
- The **latest Major Version**.
- Its **latest Minor Version**.
- All evaluations and decisions filtered accordingly.

This ensures that the default experience always reflects the current state of the Problem.

### Major Version Navigation
Users can:
- View a list of all Major Versions.
- Switch the active view to any prior Major Version.
- Clearly see when a version is historical.

Historical views are visually marked (e.g. warning banner) to prevent accidental confusion with the active version.

### Minor Version Expansion
Optionally, users can:
- Expand a Major Version to reveal its Minor Versions.
- Select one or multiple Minor Versions.
- Aggregate or compare evaluations across repository states.

This is particularly important for:
- Understanding rapid iteration during live hacking.
- Analyzing whether perceived quality improvements track repository evolution.

### Filter Integration
Version selection integrates with other filters, such as:
- Time context (pre-meetup, pitch, review, post-meetup).
- Assessment type.
- Role and participation mode.

This allows fine-grained, statistically meaningful analysis without duplicating or mutating historical data.

---

## Summary

The Problem Versioning Model establishes a **two-layered, orthogonal notion of change**:

- **Major Versions** capture intentional, semantic evolution of the problem definition.
- **Minor Versions** capture incidental, technical evolution of the repository.

Together, they enable:
- Reproducible evaluation.
- Transparent decision histories.
- Longitudinal insight into how problems mature across meetups and agentic workflows.

This model underpins the system’s ability to treat Problems as *living artifacts* without sacrificing rigor or traceability.
