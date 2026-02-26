# 9. Voting and Data Capture

This chapter specifies how human (and agent) input is captured in a precise, analyzable, and future-proof way. It defines the atomic structure of responses, how absence of responses is handled, how participants are authenticated, and how contextual dimensions are orthogonalized to support longitudinal and comparative analysis.

The design goal is to ensure that **every recorded data point is interpretable in isolation**, while still supporting rich aggregation and filtering across time, roles, and situations.

---

## 9.1 Atomic Response Representation

At the lowest level, the system records **atomic responses**. An atomic response represents a single answer to a single Item, under a specific contextual configuration.

Each atomic response is defined by the following conceptual components:

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
  A single integer value, consistent with the Item's `max_rating`.
  No transformations, weights, or normalizations are applied at capture time.

- **Timestamp**
  The exact time at which the response was submitted.

Crucially, **responses are never stored as aggregates**. All higher-level statistics (means, distributions, deltas, comparisons) are derived from atomic responses at query time. This ensures:

- Full reproducibility
- Retrospective re-analysis with new hypotheses
- Compatibility with statistical and ML workflows

Responses are append-only. They are superseded (not deleted) when revised, preserving full history even if later decisions change their relevance.

---

## 9.2 Missingness and Optional Responses

The system adopts a deliberate and explicit approach to **missing data**.

Key principles:

- **All survey items are optional by default.**
- The UI always allows the user to proceed without answering an item.
- There is no explicit “I don’t know” or “N/A” response option.

If a participant does not provide a response for an Item:

- **No atomic response is recorded** for that Item.
- Missingness is represented implicitly by absence, not by a special value.

This approach has several advantages:

- It avoids conflating *lack of opinion* with *neutral opinion*.
- It preserves statistical clarity (missing ≠ zero ≠ midpoint).
- It simplifies the data model and downstream analysis.

Missingness itself is analytically meaningful and can be studied via:

- Response counts (`N`) per Item
- Comparisons between contexts (e.g. fewer answers during live pitch vs. post-event)
- Correlation with engagement/intensity items captured elsewhere

The system explicitly favors **data honesty over forced completeness**.

---

## 9.3 Authentication Requirements

All participation requires **mandatory authentication** (see Chapter 18 for complete authentication specification).

Key implications for response capture:

- All responses are linked to authenticated user accounts via `user_id` (NOT NULL)
- Each response captures the user's role at submission time
- All votes and assessments are attributable to specific users
- No anonymous or pseudonymous participation is supported

This enables accountability, longitudinal tracking across events, and role-aware analysis.

---

## 9.4 Backend-Prepared Assessment Render Structures

The system uses backend-prepared render structures to optimize assessment display. The backend performs scale consistency validation and returns render-ready JSON; see Chapter 7.4 for complete specification.

---

## 9.5 Context Orthogonalization (Role, Time, Participation Mode)

Every atomic response is contextualized along a set of **orthogonal dimensions**. These dimensions are recorded explicitly and independently, rather than inferred from surrounding state.

### 9.5.1 Role Context

Each response is associated with exactly one role at the time of submission, using the seven canonical roles defined in Chapter 3.10:

- Observer
- Developer
- Coding Partner
- Problem Owner
- Moderator
- Administrator
- Agent (non-binding evaluations only)

Roles are self-declared per assessment context and are not assumed to be stable across problems or time.

---

### 9.5.2 Time Context

Responses are tagged with a discrete **time context**, representing their position in the event lifecycle. The canonical values from `time_context_catalog` (Chapter 19.2.5) are:

- **Pre-event** — Before the event begins
- **Pitch** — During or immediately after live pitch
- **Review** — After coding/hacking, evaluating outcomes
- **Post-event** — Shortly after event ends
- **Late reflection** — Days/weeks later, delayed insights

This allows fine-grained temporal analysis without relying solely on timestamps, which may be ambiguous across events and sessions.

---

### 9.5.3 Participation Mode Context

Each authenticated user declares a stable **participation mode** at the start of their event participation:

- In presence (physical attendance)
- Remote (virtual participation)

This flag is captured once when the user begins interacting with event assessments and applied consistently to all responses during that event. It enables analysis of hybrid event dynamics without repeated user input.

**Note**: This is distinct from **geographic location** (Cologne, Aachen, etc.), which is specified at the event level (see Chapter 29).

---

### 9.5.4 Orthogonality as a Design Invariant

None of these contextual dimensions imply or constrain the others:

- A Problem Owner may submit responses remotely or in presence.
- A response during review may occur pre-event or post-event.
- Agents may evaluate at any time context, but never with binding authority.

This orthogonal design ensures that:

- New roles or time contexts can be added without schema changes.
- Complex filters and contrasts are possible without data duplication.
- The system remains extensible for future research and tooling.

### 9.5.5 Review Weight Context

For **review assessments**, each response carries an additional `review_weight_key` (FK to `review_weight_catalog`, Chapter 19.3.37) that determines the multiplier applied during star award calculations (Chapter 33.6.4). The weight is assigned server-side at insertion time based on the response's time context and role:

- `time_context = 'review'` → `live_review` (1.0x)
- `time_context = 'post_event'` or `'late_reflection'` → `post_event_review` (1.5x)
- `role = 'agent'` (overrides time context) → `agent_review` (0.5x)

For non-review assessments (pitch, self-assessment), `review_weight_key` is `NULL`. See Chapter 14.2 for the complete review weight assignment specification.

---

Together, the mechanisms described in this chapter ensure that response data is **precise, minimal, interpretable, and analytically powerful**, forming a solid empirical foundation for everything built on top of it.

The backend-prepared render structures ensure that evaluators always see **optimally-formatted assessments** regardless of scale heterogeneity, while the frontend remains focused purely on presentation.
