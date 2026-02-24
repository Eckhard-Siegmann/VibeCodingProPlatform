# 3. Roles, Actors, and Authority Model

This chapter defines **who can act in the system**, **in which capacity**, and **with what authority**. It introduces a clear separation between *actors*, *roles*, and *authority*, avoiding implicit permissions and making all power structures explicit and auditable.

The role model is intentionally minimal, extensible, and orthogonal to content, evaluation, and decision logic.

---

## 3.1 Actors vs. Roles: Fundamental Distinction

The system distinguishes sharply between **actors** and **roles**:

- An **actor** is an entity that can perform actions in the system.
- A **role** is the *contextual function* an actor assumes when interacting with a specific Problem, Assessment, or Decision.

This distinction is essential because:
- The same actor may assume different roles at different times.
- Roles are *situational*, not permanent attributes of a person.
- Authority is derived from role *in context*, not from identity alone.

All human actors are identified through **mandatory authentication** (see Chapter 18). This provides persistent identity across events, locations, and time.

### Dual-Role System

The platform uses a **dual-role model**:

**Base Operational Role** (stored in `users.role`):
- Persistent system-level role: observer, developer, coding_partner, problem_owner, moderator, admin, agent
- Determines system-level capabilities (e.g., moderators can create binding decisions)
- Assigned at registration or promotion

**Contextual Participant Role** (stored in context-specific tables):
- Captured per-response in `responses.role` (observer, developer, coding_partner, problem_owner, moderator, admin, agent)
- Captured per-team in `problem_team_members.member_role` (po, po_deputy, coder)
- Self-declared during assessments or inferred from relationship to problem
- Enables role-switching: a moderator can assess as an observer

**For decisions**: Role is inferred from `users.role` via JOIN. Chat logs document the active contextual role for transparency.

---

## 3.2 Actor Types

The system supports the following actor types:

- **Human (Authenticated)**
  All human participants must authenticate to use the platform. Authentication is via email + password, GitHub OAuth, or LinkedIn OAuth (see Chapter 18). This ensures persistent identity across events and locations, enables team formation, and supports GDPR-compliant communication.

- **Agent (AI System)**
  Non-human actors that can perform assessments and issue *non-binding* decision recommendations. Agents authenticate via API tokens and are explicitly constrained in authority.

There is **no generic "system" actor**. All logged actions are attributable to a human or agent actor.

**Note on identity**: All users are identified by email address. The same email always maps to the same user record, enabling attribution across multiple problems, events, and locations. This supports the multi-location community model (Cologne, Aachen, etc.).

---

## 3.3 Contextual Participant Roles

Participant roles describe *how an actor relates to a specific Problem* at a given moment. These roles are typically self-declared or inferred from interaction context.

The core participant roles are:

- **Problem Owner (PO)**
  The actor responsible for authoring and maintaining the Problem Card and associated repository links. Problem Owners can perform self-assessments, manage resources, and create new versions of their problems.

- **Problem Owner Deputy (PO Deputy)**
  An optional co-owner assigned by the Problem Owner who has the same rights as the PO for that specific problem. Used for shared ownership or continuity when the original PO is unavailable.

- **Developer**
  An actor actively coding or orchestrating agents to work on the Problem during an event.

- **Coding Partner**
  A second human collaborating at the same workstation as a Developer (e.g. pair programming). Treated analytically as a Developer, but distinguishable as a role.

- **Observer**
  An actor who watches, evaluates, or provides feedback without directly coding. Observers can suggest resources (requires PO approval) and participate in assessments.

These roles are primarily used to:
- Contextualize assessments
- Enable role-based filtering in analysis
- Interpret changes in perception over time

They do **not** grant decision authority by themselves.

---

## 3.4 Operational Roles: Moderator and Administrator

Operational roles govern **system-level capabilities** rather than problem-specific participation.

### Moderator

A Moderator is an authenticated human actor with authority to:

- Curate Problems for events across **all locations** (global scope)
- Create and manage events
- Open and close pitch and review phases
- Trigger group decisions during live sessions
- Submit binding decisions on behalf of the group
- Award stars based on review assessment scores (1st/2nd/3rd place)
- View moderation dashboards and activity logs
- Post in team chats with distinguished visual styling
- Manage countdown timers and event pace controls (see Ch.14)

Moderators are central to the live orchestration of events and have **global visibility** — they can see and moderate events in Cologne, Aachen, or any future location. This ensures operational flexibility and knowledge sharing across the community.

**Moderator Objectivity Constraint**: When a moderator joins a problem team as a developer ("Join as Dev"), they forfeit binding decision authority for that specific problem only, preserving objectivity. They retain moderator authority for all other problems (see Ch.13, Ch.31).

### Administrator

An Administrator is a superset of Moderator capabilities, with additional authority to:

- Create and modify Items and Inventories
- Manage Partners, Locations, and Rooms
- Import users via CSV
- Manage user accounts and upgrade privileges
- Perform administrative maintenance and debugging
- Override system constraints when necessary

Administrators are expected to understand the system deeply and act responsibly. For pragmatic reasons, an Administrator can perform all Moderator actions without role switching.

---

## 3.5 Authority vs. Role: Decision Power Model

Decision power is **not encoded directly in roles**, but through explicit authority rules:

- **Problem Owners**  
  Can submit, update, and version their own Problems. They cannot make binding event-level decisions.

- **Moderators**  
  Can issue *binding decisions* affecting Problem state, event selection, and workflow progression.

- **Administrators**  
  Can issue binding decisions and also modify the evaluative framework itself.

- **Agents**  
  Can issue *non-binding decision recommendations only*. They are explicitly prohibited from issuing binding decisions.

Authority is always explicit, logged, and contextual.

---

## 3.6 Binding vs. Non-Binding Actions

The system distinguishes between:

- **Binding actions**  
  Actions that change the authoritative state of a Problem or event. These are recorded as Decisions with `is_binding = true`.

- **Non-binding actions**  
  Recommendations, assessments, chat messages, or preparatory actions that inform later decisions but do not change state.

This distinction is critical for:
- Auditability
- Mixed human–AI workflows
- Asynchronous moderation

Agents, observers, and even moderators (when acting individually) may issue non-binding recommendations that later culminate in a binding group decision.

---

## 3.7 Group Decisions and Representation

Some decisions are made explicitly **on behalf of a group**, typically during live events.

In such cases:
- A single Moderator records the decision.
- The decision is marked as a *group decision*.
- The actor represents the collective outcome, not personal preference.

This model avoids the complexity of multi-signature decisions while preserving accountability and clarity.

---

## 3.8 Role Persistence and Session Scope

Roles are **contextual and session-scoped**:

- A user may be a Problem Owner for one Problem and an Observer for another.
- A Moderator may temporarily act as an Observer when submitting a personal assessment.
- Location (in-presence vs. remote) is orthogonal to role and persists across a session.

The system avoids permanent role assignment beyond what is strictly necessary for operational security.

---

## 3.9 Design Rationale and Non-Goals

This role and authority model is intentionally:

- **Minimal** – to reduce cognitive load during live events
- **Explicit** – to avoid hidden power structures
- **Extensible** – to accommodate future roles or agent capabilities

It explicitly avoids:
- Fine-grained permission matrices
- Implicit authority inference
- Overloaded “status” concepts that mix evaluation and decision-making

This clarity is essential for scaling from informal events to more research-oriented or enterprise-grade usage without redesigning core assumptions.

---

## 3.10 Complete Role Enumeration

For reference, the system defines exactly **seven roles** stored in the `user_role_catalog` table:

| Role Key | Display Name | Can Bind | Is Human | Description |
|----------|--------------|----------|----------|-------------|
| `observer` | Observer | No | Yes | Watches and evaluates, does not code |
| `developer` | Developer | No | Yes | Actively codes on problems |
| `coding_partner` | Coding Partner | No | Yes | Pairs with developer at same workstation |
| `problem_owner` | Problem Owner | No | Yes | Authors and maintains problem cards |
| `moderator` | Moderator | Yes | Yes | Curates problems, orchestrates events (global scope) |
| `admin` | Administrator | Yes | Yes | Full system access, manages items/inventories/partners |
| `agent` | Agent | No | No | AI system, non-binding recommendations only |

Only `moderator` and `admin` roles can create binding decisions. The `agent` role is explicitly non-human and cannot issue binding decisions under any circumstances.

---

## 3.11 Relationship to Other Chapters

- Authentication requirements are specified in **Chapter 18 (Authentication and Access Control)**.
- Decision authority and logging are specified in **Chapter 10 (Decisions and State Transitions)**.
- Role-dependent UI affordances are specified in **Chapter 12 (Dashboards and Navigation)**.
- Assessment context and role-aware analysis are specified in **Chapter 8 (Assessments)**.
- Team formation and chat are specified in **Chapter 31 (Team Chat and Collaboration)**.

This chapter should be considered normative for interpreting any action taken within the system.
