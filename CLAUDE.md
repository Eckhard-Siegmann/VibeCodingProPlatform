# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **specification documentation project** (no code yet) for a professional, agentic, requirements-driven hackathon meetup system. The system enables humans and AI agents to jointly explore complex software problems through structured evaluation, decision-making, and longitudinal analysis.

**Philosophy**: "Pros for Pros" – low barriers, high trust, experienced practitioners who need little context.

**Two Use Cases**:
1. **Build the Platform**: Implement the meetup system according to the specification
2. **Teach the Culture**: Onboard participants to understand why this approach matters

---

## Document Structure

### Specification (Chapters 00-24)

The technical specification is organized as numbered markdown files:

| Chapters | Topics |
|----------|--------|
| **00-02** | Introduction, purpose, scope, design principles, conceptual overview |
| **03-05** | Roles/authority model, problems, problem cards, versioning |
| **06-09** | Repositories, inventories, items, assessments, voting |
| **10-11** | Decisions, state transitions, meetup model |
| **12-18** | UI specifications (dashboards, problem cards, live interaction, analytics, admin, auth) |
| **19-22** | Data model (PostgreSQL), system logs, extensibility, open questions |
| **23** | Appendix: User stories |
| **24** | Appendix: Item & inventory bootstrap data |

### Motivational & Vision Documents

| File | Purpose |
|------|---------|
| `Motivation HoliCASE_V0.6.md` | **North Star**: HoliCASE – Holistic Compliance & Audit Software Engineering. The 4LC taxonomy defining auditable, specification-driven software development |
| `Motivation DSPy like artifact optimization.md` | **Paradigm**: Treating skills and agents as optimizable artifacts against requirements and tests. The mechanism for systematic improvement |

### Participant-Facing Documents

| File | Purpose |
|------|---------|
| `Beginners_Intro.md` | **Presentation companion**: 10-page introduction explaining the meetup's purpose, quality dimensions, evaluation architecture, and vision (for onboarding presentations) |
| `problem_creation_best_practices.md` | **Guide for Problem Owners**: How to create effective Problem Cards, spectrum of readiness, tooling documentation |
| `Announcement_VibeCoding-Professionals_Meetup.md` | Event announcement with full agenda |
| `Announcement_VibeCoding-Professionals_Meetup_LinkedIn.md` | LinkedIn-style promotional text |

### Other

- `deprecated/`: Superseded drafts (ignore)

---

## Core Domain Concepts

- **Problem**: A challenge/task that persists across versions and meetups
- **Problem Card**: Versioned representation of a problem (analogous to Model Cards)
- **Inventory**: Structured collection of evaluation items (reusable instruments)
- **Item**: Immutable evaluation primitive with question, scale, and labels
- **Assessment**: Application of an inventory to a problem version
- **Decision**: Explicit, timestamped action that changes state or records outcomes
- **Comment**: Qualitative feedback stored separately from decisions

---

## Key Design Principles

1. **Immutability over Mutation**: Historical truth is never overwritten; changes create new versions
2. **Separation of Content/Evaluation/Decision**: These are independent artifacts, not conflated
3. **Explicit over Implicit**: All state changes recorded as Decisions with timestamps and actors
4. **Human-Centered First, Agent-Ready**: Workflows must work for humans; agents participate but cannot make binding decisions
5. **Decisions as Single Source of Truth**: No separate activity log; decisions table IS the event log
6. **Business Value First**: Problems are selected for personal/strategic value to participants; dogfooding is secondary

---

## Quality Dimensions (from Inventory Bootstrap)

The meetup measures code quality across these dimensions:

| Dimension | Meaning |
|-----------|---------|
| **Correctness** | Meets requirements, handles edge cases |
| **Test Support** | Evidence convincingly demonstrates correctness |
| **Readability** | Easy to understand (naming, structure, local reasoning) |
| **Simplicity** | No unnecessary complexity or bloat |
| **Elegance** | Fitting language constructs, clean teachable structure |
| **Extensibility** | Accommodates likely changes without overengineering |

These dimensions enable **semantic comparison** of solutions produced by different agentic tools (Claude Code, Cursor, Codex, Antigravity, etc.) even when syntactic implementations differ significantly.

---

## Dual-State Model for Problems

Problems have two orthogonal states:
- **Readiness State**: Intrinsic quality (draft, submitted, accepted, rejected)
- **Action State**: Community intent (backlog, selected_for_meetup, deferred, dropped)

---

## Identity Model

- **Problem Owners**: Email required at creation, no password. Access via private URL.
- **Moderators/Admins**: Email + password authentication
- **Agents**: First-class actors with `role = agent`, can only create non-binding decisions
- Same email reuses existing user record (enables attribution across problems)

---

## Database

PostgreSQL with append-only event sourcing. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Unified: humans + agents |
| `sessions` | Pseudonymous browser sessions |
| `meetups` | Meetup instances |
| `problems` | Problem identity + cached states |
| `problem_versions` | Major versions of Problem Cards |
| `problem_repo_snapshots` | Minor versions (commit hashes) |
| `inventories` | Evaluation instruments |
| `items` | Immutable evaluation items |
| `inventory_items` | Composition (references `item_key`) |
| `assessments` | Inventory applications |
| `responses` | Atomic answers (references `item_id`) |
| `decisions` | Event log for all state changes |
| `comments` | Qualitative feedback (separate from decisions) |
| `meetup_problem_queue` | Problem-meetup associations |

### Hybrid Item Reference Model

- `inventory_items` → references `item_key` (the concept)
- `responses` → references `item_id` (concrete version at response time)

---

## The Bigger Picture

The meetup platform is the **bootstrap engine** for a larger vision:

1. **HoliCASE** (Motivation doc) defines the destination: auditable, traceable, specification-driven software where every line of code satisfies a control, which satisfies a normative clause

2. **DSPy-style optimization** (Motivation doc) defines the mechanism: skills and agents as optimizable artifacts against requirements and tests – enabling systematic improvement and LLM migration

3. **The meetup** generates the quality benchmarks, comparative data, and institutional memory that make increasingly ambitious goals achievable

The evaluation data we collect feeds directly into understanding which tools and approaches produce code meeting professional quality standards.

---

## When Editing Specifications

- Chapter 1 (Purpose, Scope, Design Principles) is **normative**; later chapters must not contradict it
- Maintain separation between content, evaluation, and decision-making concepts
- Use past tense for decision_type enums
- Preserve append-only semantics for historical data
- Comments are stored in `comments` table, not as decisions
- Tooling documentation goes in PR descriptions, not in the database

## When Creating Participant Materials

- Reference `Beginners_Intro.md` for the canonical explanation of why the architecture matters
- Reference `problem_creation_best_practices.md` for Problem Owner guidance
- Emphasize business value first, dogfooding second
- Connect quality dimensions to the inventory items in Chapter 24