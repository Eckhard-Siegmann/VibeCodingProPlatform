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

Actors are identified either implicitly (anonymous/pseudonymous users) or explicitly (authenticated users such as Moderators and Administrators).

---

## 3.2 Actor Types

The system supports the following actor types:

- **Human (Password-less)**
  Participants who provide an email address but do not have login credentials. This includes **Problem Owners**, who are identified by email at problem creation but access their Problem Cards via private URLs rather than authentication. Observers submitting assessments interact via pseudonymous sessions without any identity requirement.

- **Human (Authenticated)**
  Users with email and password credentials (Moderators and Administrators). Authentication grants access to privileged UI controls but does not automatically confer contextual authority.

- **Agent (AI System)**
  Non-human actors that can perform assessments and issue *non-binding* decision recommendations. Agents are first-class actors but are explicitly constrained in authority.

There is **no generic "system" actor**. All logged actions are attributable to a human or agent actor.

**Note on Problem Owner identity**: Problem Owners provide an email address when creating a problem. This creates a user record without a password. The same email reuses the existing user record, enabling attribution across multiple problems. Access to edit a Problem Card is granted via the private URL (security by obscurity), not via login.

---

## 3.3 Contextual Participant Roles

Participant roles describe *how an actor relates to a specific Problem* at a given moment. These roles are typically self-declared or inferred from interaction context.

The core participant roles are:

- **Problem Owner (PO)**  
  The actor responsible for authoring and maintaining the Problem Card and associated repository links.

- **Developer**  
  An actor actively coding or orchestrating agents to work on the Problem during a meetup.

- **Coding Partner**  
  A second human collaborating at the same workstation as a Developer (e.g. pair programming). Treated analytically as a Developer, but distinguishable as a role.

- **Observer**  
  An actor who watches, evaluates, or comments without directly coding.

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

- Curate Problems for a meetup
- Open and close pitch and review phases
- Trigger group decisions during live sessions
- Submit binding decisions on behalf of the group
- View moderation dashboards and activity logs

Moderators are central to the live orchestration of a meetup.

### Administrator

An Administrator is a superset of Moderator capabilities, with additional authority to:

- Create and modify Items and Inventories
- Manage Moderator accounts and upgrade privileges
- Perform administrative maintenance and debugging
- Override system constraints when necessary

Administrators are expected to understand the system deeply and act responsibly. For pragmatic reasons, an Administrator can perform all Moderator actions without role switching.

---

## 3.5 Authority vs. Role: Decision Power Model

Decision power is **not encoded directly in roles**, but through explicit authority rules:

- **Problem Owners**  
  Can submit, update, and version their own Problems. They cannot make binding meetup-level decisions.

- **Moderators**  
  Can issue *binding decisions* affecting Problem state, meetup selection, and workflow progression.

- **Administrators**  
  Can issue binding decisions and also modify the evaluative framework itself.

- **Agents**  
  Can issue *non-binding decision recommendations only*. They are explicitly prohibited from issuing binding decisions.

Authority is always explicit, logged, and contextual.

---

## 3.6 Binding vs. Non-Binding Actions

The system distinguishes between:

- **Binding actions**  
  Actions that change the authoritative state of a Problem or meetup. These are recorded as Decisions with `is_binding = true`.

- **Non-binding actions**  
  Recommendations, assessments, comments, or preparatory actions that inform later decisions but do not change state.

This distinction is critical for:
- Auditability
- Mixed human–AI workflows
- Asynchronous moderation

Agents, observers, and even moderators (when acting individually) may issue non-binding recommendations that later culminate in a binding group decision.

---

## 3.7 Group Decisions and Representation

Some decisions are made explicitly **on behalf of a group**, typically during live meetups.

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

This clarity is essential for scaling from informal meetups to more research-oriented or enterprise-grade usage without redesigning core assumptions.

---

## 3.10 Relationship to Other Chapters

- Decision authority and logging are specified in **Chapter 10 (Decisions and State Transitions)**.
- Role-dependent UI affordances are specified in **Chapter 12 (Dashboards and Navigation)**.
- Assessment context and role-aware analysis are specified in **Chapter 8 (Assessments)**.

This chapter should be considered normative for interpreting any action taken within the system.
