# 6. Repositories and External References

This chapter defines how **external technical artifacts**, in particular source code repositories, are integrated into the system. Repositories are treated as *authoritative but external* objects: they are referenced, contextualized, and partially fingerprinted, but never ingested or mirrored. The goal is to support rigorous evaluation and traceability without coupling the system to any specific development platform or workflow.

---

## 6.1 Primary Repository Constraints and Assumptions

Each Problem is associated with **exactly one primary repository**, which is assumed to be the canonical technical artifact representing the problem’s implementation context.

Key constraints and assumptions:

- The primary repository **must be a GitHub repository URL**.
- The URL is stored as a normalized, immutable reference per Problem version.
- The system does **not** clone, fork, or modify repositories.
- The system makes **no assumptions** about:
  - programming language
  - framework
  - repository structure
  - test setup
  - CI/CD configuration

The repository is treated as a *black box* whose internal evolution is outside the system’s control. All interaction is therefore observational, not operational.

Rationale:
- Keeps the system **LLM-, framework-, and toolchain-agnostic**.
- Avoids credential handling, webhooks, or write permissions.
- Ensures the system remains usable even if repositories are private, temporarily unavailable, or structurally unconventional.

From a conceptual perspective, the repository answers:
> “Where does the code live that this Problem refers to?”

It does **not** answer:
> “What exactly is the code?” or “How is it built?”

Those questions remain intentionally external.

---

## 6.2 Secondary URLs and Supporting Materials

In addition to the primary repository, a Problem may optionally reference **one secondary URL**.

Typical use cases include:
- documentation sites
- design documents
- demo deployments
- issue trackers
- whitepapers or technical blog posts

Constraints:
- The secondary URL is optional.
- It is not semantically interpreted by the system.
- It is displayed as-is on the Problem Card.
- It is never required for submission or evaluation.

The system does not attempt to classify or validate the content of secondary URLs. Their purpose is purely *contextual enrichment* for human participants.

This design choice reflects a deliberate balance:
- Enough flexibility to support diverse workflows.
- Enough restraint to avoid turning the system into a document management platform.

---

## 6.3 Lightweight Git Snapshot Integration

To enable **temporal traceability** between evaluations and repository state—without deep Git integration—the system supports a *lightweight snapshot mechanism* based on Git commit hashes.

### Core idea

For each Assessment and Decision, the system may record:
- the **major Problem version**
- the **minor repository snapshot**, represented as a Git commit hash (HEAD)

This snapshot is:
- informational
- optional
- non-authoritative

### Mechanism

- When an Assessment is submitted, the frontend may resolve the current HEAD commit hash of the GitHub repository.
- The resolved hash is sent alongside the Assessment.
- If the hash differs from the last recorded snapshot for that Problem version:
  - a new minor snapshot index is implicitly created
  - subsequent Assessments referencing the same hash reuse that index

The backend:
- does not verify repository contents
- does not enforce consistency
- does not reject missing or stale hashes

### Purpose

This mechanism allows analysts and participants to later answer questions such as:
- Were evaluations performed before or after significant repository changes?
- Did perceived quality improve while the codebase was evolving?
- Were conflicting evaluations based on different repository states?

Importantly, this **does not** create a hard coupling between repository state and Problem versioning:
- Major versions reflect *conceptual* changes to the Problem Card.
- Minor snapshots reflect *observed* repository evolution.

### Explicit non-goals

- No automatic diffing
- No semantic analysis of commits
- No enforcement of synchronization between Problem Card and repository

The snapshot mechanism is intentionally minimal: it preserves signal while avoiding operational complexity.

---

## 6.4 Tooling and Agent Documentation

When developers submit solutions via Pull Request, they are encouraged to document their **tooling setup** alongside their code.

### What to Document

- AI assistants / coding agents used (e.g., Claude Code, Cursor, Codex, Antigravity)
- Model versions (e.g., Claude Opus 4, GPT-4)
- Orchestration frameworks or custom workflows
- IDE integrations and extensions
- Prompting strategies or system prompts (if shareable)
- Multi-agent configurations
- What worked well and what didn't

### Documentation Location

The **PR description** is the canonical place for this information. A suggested template is provided in the Best Practices Guide (`problem_creation_best_practices.md`), but it is not enforced.

### Rationale

The meetup's core comparison is "one human with an orchestrated multi-agent system" versus alternative approaches (Introduction, Ch.0). Without tooling documentation, this comparison is impossible to make meaningfully.

The system deliberately **does not capture tooling data in its database**. The repository (via PR) remains the single source of truth for implementation artifacts. This keeps the system simple while enabling rich comparative analysis through the PRs themselves.

### Review Implications

Review Inventories may include Items assessing:
- Tooling transparency
- Reproducibility of the approach
- Documentation quality

These are optional and emerge from community practice rather than system enforcement.

---

In summary, repositories are treated as **external, authoritative, and evolving artifacts**. The system anchors itself to them just tightly enough to preserve interpretability—without sacrificing openness, simplicity, or generality.
