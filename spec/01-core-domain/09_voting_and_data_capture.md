# 9. Voting and Data Capture

This chapter specifies how human (and agent) input is captured in a precise, analyzable, and future-proof way. It defines the atomic structure of votes, how absence of votes is handled, how participants are identified without accounts, and how contextual dimensions are orthogonalized to support longitudinal and comparative analysis.

The design goal is to ensure that **every recorded data point is interpretable in isolation**, while still supporting rich aggregation and filtering across time, roles, and situations.

---

## 9.1 Atomic Vote Representation

At the lowest level, the system records **atomic votes**. An atomic vote represents a single response to a single Item, under a specific contextual configuration.

Each atomic vote is defined by the following conceptual components:

- **Item reference**  
  Identifies *what* was evaluated. Items are immutable and fully define scale semantics (max rating, labels, intent).

- **Problem reference**  
  Identifies *which problem* the vote refers to.

- **Problem version reference**  
  Captures both:
  - **Major version** (semantic version of the Problem Card)
  - **Minor version** (repository snapshot indicator, derived from Git HEAD hash when available)

- **Assessment reference**  
  Identifies *which assessment instance* this vote belongs to (e.g. Pitch Assessment, Review Assessment, Self-Assessment).

- **Raw value**  
  A single integer value, consistent with the Item’s `max_rating`.  
  No transformations, weights, or normalizations are applied at capture time.

- **Timestamp**  
  The exact time at which the vote was submitted.

Crucially, **votes are never stored as aggregates**. All higher-level statistics (means, distributions, deltas, comparisons) are derived from atomic votes at query time. This ensures:

- Full reproducibility
- Retrospective re-analysis with new hypotheses
- Compatibility with statistical and ML workflows

Votes are append-only. They are never mutated or deleted, even if later decisions supersede their relevance.

---

## 9.2 Missingness and Optional Responses

The system adopts a deliberate and explicit approach to **missing data**.

Key principles:

- **All survey items are optional by default.**
- The UI always allows the user to proceed without answering an item.
- There is no explicit “I don’t know” or “N/A” response option.

If a participant does not provide a response for an Item:

- **No atomic vote is recorded** for that Item.
- Missingness is represented implicitly by absence, not by a special value.

This approach has several advantages:

- It avoids conflating *lack of opinion* with *neutral opinion*.
- It preserves statistical clarity (missing ≠ zero ≠ midpoint).
- It simplifies the data model and downstream analysis.

Missingness itself is analytically meaningful and can be studied via:

- Response counts (`N`) per Item
- Comparisons between contexts (e.g. fewer answers during live pitch vs. post-meetup)
- Correlation with engagement/intensity items captured elsewhere

The system explicitly favors **data honesty over forced completeness**.

---

## 9.3 Session Identity and Pseudonymity

Participants are identified through **pseudonymous session identities**, not user accounts.

Core properties of session identity:

- A **random client-generated identifier** is created on first interaction.
- The identifier is stored in browser local storage.
- On the server side, only a **hashed representation** of this identifier is persisted.
- No cookies, fingerprinting, or IP-based heuristics are required.

This mechanism provides:

- **Intra-session consistency**  
  Multiple votes from the same participant can be linked.

- **Pre/Post pairing**  
  Changes in individual responses across time can be analyzed.

- **Low barrier to participation**  
  No login is required for voting or assessments.

Session identities are intentionally fragile across devices and browsers. This is considered acceptable and even desirable, as the system prioritizes:

- Privacy and minimal personal data
- Lightweight participation
- Statistical signal at group level rather than individual tracking

For moderators and administrators, authenticated accounts exist, but **these identities are not reused for voting contexts**. When moderators vote, they do so under the same pseudonymous model as all other participants.

---

## 9.4 Context Orthogonalization (Role, Time, Location)

Every atomic vote is contextualized along a set of **orthogonal dimensions**. These dimensions are recorded explicitly and independently, rather than inferred from surrounding state.

### Role Context

Each vote is associated with exactly one role at the time of voting, such as:

- Problem Owner
- Developer
- Coding Partner
- Observer
- Agent (non-binding evaluations only)

Roles are self-declared per assessment context and are not assumed to be stable across problems or time.

---

### Time Context

Votes are tagged with a discrete **time context**, representing their position in the meetup lifecycle, for example:

- Pre-drafting
- Pre-meetup
- Pre-refinement
- During pitch
- During review
- Post-meetup
- Late reflection

This allows fine-grained temporal analysis without relying solely on timestamps, which may be ambiguous across meetups and sessions.

---

### Location Context

Each session declares a stable **location context**:

- In presence
- Remote

This flag is captured once per session and applied consistently to all votes from that session. It enables analysis of hybrid meetup dynamics without repeated user input.

---

### Orthogonality as a Design Invariant

None of these contextual dimensions imply or constrain the others:

- A Problem Owner may vote remotely or in presence.
- A vote during review may occur pre-meetup or post-meetup.
- Agents may evaluate at any time context, but never with binding authority.

This orthogonal design ensures that:

- New roles or time contexts can be added without schema changes.
- Complex filters and contrasts are possible without data duplication.
- The system remains extensible for future research and tooling.

---

Together, the mechanisms described in this chapter ensure that voting data is **precise, minimal, interpretable, and analytically powerful**, forming a solid empirical foundation for everything built on top of it.
