# 16. Commenting and Qualitative Feedback

This chapter specifies how **free-form qualitative input** is handled in the system. Commenting is intentionally modeled as a lightweight but first-class mechanism to support clarification, negotiation, reflection, and coordination—without collapsing into decisions, votes, or assessments.

Comments are not an auxiliary feature; they are a **core connective tissue** between structured artifacts (Problem Cards, Assessments, Decisions) and the social reality of a live or asynchronous meetup.

---

## 16.1 Comment Log as Structured Dialogue

Each Problem Card maintains an associated **Comment Log**. Conceptually, this log represents a *chronological dialogue* around the Problem, not merely an unstructured chat.

Key properties of the Comment Log:

- **Append-only**:  
  Comments are never edited or deleted. Corrections or follow-ups are expressed as new comments.

- **Chronological ordering**:  
  Comments are displayed strictly by timestamp, forming a readable narrative of discussion over time.

- **Contextual anchoring**:  
  Each comment is implicitly associated with:
  - a specific Problem,
  - the current major version of that Problem at the time of commenting,
  - the role and identity of the commenter,
  - the situational context (time context, presence/remote).

- **Non-binding by default**:  
  Comments do not change any system state. They are expressive, not operative.

The Comment Log is deliberately minimalistic: it supports *dialogue*, not workflow. There are no threads, reactions, or rich formatting in the initial design. This keeps cognitive overhead low during live meetups and preserves interpretability for later analysis.

From a user perspective, the Comment Log serves three main purposes:

1. **Clarification**  
   Asking questions or pointing out ambiguities in the Problem Card or repository.

2. **Feedback**  
   Providing constructive qualitative input that does not fit into predefined Items or Inventories.

3. **Coordination**  
   Documenting informal agreements, requests for changes, or follow-up intentions.

---

## 16.2 Roles and Visibility of Comments

Commenting is intentionally **inclusive**, but visibility and authorship are role-sensitive.

### Who can comment

- **Problem Owner (PO)**  
  Can comment from the Private View of the Problem Card. These comments are typically used to:
  - respond to feedback,
  - explain design decisions,
  - acknowledge requested changes.

- **Moderators (including Admins acting as Moderators)**  
  Can comment while logged in. Moderator comments often serve to:
  - summarize group sentiment,
  - request refinements,
  - document moderation-level observations.

- **Observers / Participants**  
  Can comment from the Public View without authentication beyond session context. These comments represent:
  - spontaneous feedback,
  - clarifying questions,
  - lightweight peer input.

- **Agents**  
  Agents may generate comments as *non-binding analytical output*, clearly labeled as such. Agent comments are treated identically to human comments in storage, but are distinguishable by actor role.

### Visibility rules

- **Public View**  
  Displays all comments, regardless of author role. Transparency is the default.

- **Private View**  
  Displays the same comments, but additionally emphasizes:
  - which comments were authored by the PO,
  - which comments originate from Moderators or Agents.

There is no concept of “private comments” or hidden moderator notes in the base system. If something must not be visible to all participants, it should not be placed in the Comment Log.

---

## 16.3 Relation Between Comments and Decisions

Comments and Decisions are **explicitly separated**, both conceptually and structurally.

### Comments do not imply decisions

- A comment expressing approval, concern, or suggestion has **no direct effect** on:
  - readiness state,
  - action state,
  - selection or deferral outcomes.

- Even strongly worded comments (“this should be rejected”) remain non-binding unless followed by an explicit Decision.

This avoids ambiguity and prevents post-hoc reinterpretation of comments as implicit votes or actions.

### Decisions may reference comments

While comments do not cause decisions, decisions may *refer back* to comments:

- A Decision may include a free-text justification that paraphrases or references earlier comments.
- In the UI, Decisions are often displayed *after* the relevant discussion in the Comment Log, creating a natural narrative flow:
  - discussion → recommendation → binding decision.

This pattern supports both live moderation (where decisions may be taken quickly) and asynchronous governance (where recommendations accumulate before a final decision is made).

### Comments as decision preparation

In practice, comments frequently function as **decision preparation artifacts**:

- Moderators may comment with preliminary assessments.
- Agents may comment with analytical summaries or detected issues.
- Observers may surface concerns that influence later outcomes.

However, the system intentionally avoids encoding this preparatory role formally. The transition from *discussion* to *decision* is always marked by an explicit Decision entry, preserving clarity and auditability.

---

In summary, the Comment Log provides a **low-friction, high-signal channel** for qualitative input. It complements—but never replaces—structured Assessments and explicit Decisions, ensuring that human judgment and social context remain visible without undermining the system’s formal rigor.
