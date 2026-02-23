# 6. Repositories and External References

This chapter defines how **external technical artifacts**, in particular source code repositories, are integrated into the system. Repositories are treated as *authoritative but external* objects: they are referenced, contextualized, and partially fingerprinted, but never ingested or mirrored. The goal is to support rigorous evaluation and traceability without coupling the system to any specific development platform or workflow.

---

## 6.1 Repository and Resource Model

Each Problem maintains **resource lists** that link to external technical artifacts, with the primary repository being the canonical implementation artifact.

### Resource Types

Problems maintain two distinct resource lists (stored in the `problem_resources` table, see Chapter 4.2):

**Direct Resources** (`resource_type = 'direct'`):
- The problem's own repository (typically GitHub, required)
- Related specifications or documentation
- Test suites or validation tools
- Resources essential for understanding/solving the problem

**Helpful Artifacts** (`resource_type = 'helpful'`):
- Reference implementations
- Similar projects for inspiration
- Learning resources
- Tools and libraries that may help

### Repository Constraints and Assumptions

While the system supports multiple resources, the **primary repository** (the problem's own codebase) has specific constraints:

- The primary repository **should be a GitHub repository URL** for optimal integration
- Other Git platforms (GitLab, Bitbucket) are accepted but may have limited snapshot support
- The URL is stored as a normalized reference in the `problem_resources` table
- The system does **not** clone, fork, or modify repositories
- The system makes **no assumptions** about:
  - programming language
  - framework
  - repository structure
  - test setup
  - CI/CD configuration

Repositories are treated as *black boxes* whose internal evolution is outside the system's control. All interaction is therefore observational, not operational.

Rationale:
- Keeps the system **LLM-, framework-, and toolchain-agnostic**
- Avoids credential handling, webhooks, or write permissions
- Ensures the system remains usable even if repositories are private, temporarily unavailable, or structurally unconventional
- Supports collaborative resource curation through team contributions

From a conceptual perspective, the resource lists answer:
> "Where does the code live, and what supporting materials exist?"

They do **not** answer:
> "What exactly is the code?" or "How is it built?"

Those questions remain intentionally external.

---

## 6.2 Resource Management and Permissions

Resources are managed collaboratively with role-based permissions (see Chapter 4.2):

| Actor | Direct Resources | Helpful Artifacts |
|-------|-----------------|-------------------|
| Problem Owner | Add/Edit | Add/Edit |
| Team Members | Add/Edit | Add/Edit |
| Moderators | Add (auto-approved) | Add (auto-approved) |
| Observers | Suggest (PO approves) | Suggest (PO approves) |

### Resource Approval Workflow

- Resources added by Problem Owners, team members, and moderators are **auto-approved**
- Resources suggested by observers require Problem Owner approval
- Approved resources appear immediately on the Problem Card
- Pending suggestions are visible to the Problem Owner with approve/reject controls

This collaborative model enables:
- Team members to share helpful references during sprints
- Moderators to suggest high-quality resources
- Community participation while maintaining Problem Owner curation authority

The system does not attempt to classify or deeply validate resource URLs beyond format checking. Their purpose is *contextual enrichment* for participants.

This design choice reflects a deliberate balance:
- Enough flexibility to support diverse workflows and collaborative resource discovery
- Enough restraint to avoid turning the system into a document management platform

**Note on Traceability**: Resource additions, suggestions, and approvals are tracked in the `problem_resources` table with timestamps and actor attribution (`added_by_user_id`, `approved_by_user_id`), but they do NOT create entries in the decisions table. Resource management represents collaborative content curation rather than binding state transitions. For decision-based state changes, see Chapter 10.

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

The event's core comparison is "one human with an orchestrated multi-agent system" versus alternative approaches (Introduction, Ch.0). Without tooling documentation, this comparison is impossible to make meaningfully.

The system deliberately **does not capture tooling data in its database**. The repository (via PR) remains the single source of truth for implementation artifacts. This keeps the system simple while enabling rich comparative analysis through the PRs themselves.

### Review Implications

Review Inventories may include Items assessing:
- Tooling transparency
- Reproducibility of the approach
- Documentation quality

These are optional and emerge from community practice rather than system enforcement.

---

In summary, repositories are treated as **external, authoritative, and evolving artifacts**. The system anchors itself to them just tightly enough to preserve interpretability—without sacrificing openness, simplicity, or generality.
