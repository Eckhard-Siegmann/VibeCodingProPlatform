# 14. Live Interaction Modes

This chapter specifies the **live interaction modes** that govern how participants engage with Problems during an active meetup. These modes define *when* and *how* collective attention, evaluation, and decision-making are synchronized in real time. They are deliberately lightweight, operator-driven, and optimized for hybrid (in-presence + remote) settings.

Live interaction modes do **not** introduce new domain objects. They orchestrate existing ones—Problems, Assessments, Inventories, and Decisions—under temporal control.

---

## 14.1 Pitch Mode

**Pitch Mode** is the live phase in which a Problem is presented to the group for the first time during a meetup.

### Purpose
- Create shared situational awareness of the Problem.
- Enable immediate, structured feedback from the audience.
- Support paired pre-/post comparisons between expectations and understanding.

### Activation
- Pitch Mode is opened explicitly by a Moderator via the central Dashboard.
- Only one Problem can be in Pitch Mode at a time.
- Opening Pitch Mode creates a **binding Decision** (`opened_for_pitch_assessment`) associated with the current Problem and major version.

### Participant Experience
- All participants are directed (via screen sharing or link) to a **single active survey page**.
- The survey is generated from a predefined *Pitch Inventory*.
- Participants self-declare their **role** (PO / Developer / Observer) once per Problem.
- Ratings are optional; missingness is allowed by design.
- Submissions are idempotent and can be revised while Pitch Mode is open.

### Constraints
- Only Pitch Inventories may be answered during Pitch Mode.
- Other Assessments (e.g. Review, Quality Gate) remain accessible only through the Problem Card, not through the live interaction surface.

### Deactivation
- Pitch Mode is closed explicitly by a Moderator.
- Closing creates a **binding Decision** (`closed_for_pitch_assessment`).
- No further Pitch submissions are accepted after closure, but results remain visible.

---

## 14.2 Review Mode

**Review Mode** is the phase in which outcomes of the hackathon work are evaluated.

### Purpose
- Assess concrete artifacts produced during or after the hackathon.
- Enable deeper, more reflective evaluation than Pitch Mode.
- Collect data that supports both immediate discussion and long-term learning.

### Activation
- Review Mode is opened explicitly by a Moderator.
- It may occur immediately after hacking, during open hacking, or asynchronously after the meetup.
- Opening Review Mode creates a **binding Decision** (`opened_for_review`).

### Participant Experience
- Participants access the Review via:
  - A direct link from the Dashboard, or
  - The Review section of the Problem Card.
- The Review Inventory may overlap with the Pitch Inventory but can include:
  - Correctness-related items
  - Code quality and elegance
  - Completion and scope coverage
  - Reflective or comparative items
- Engagement/Intensity is typically included as a final item.

### Duration and Asynchronicity
- Review Mode may remain open beyond the meetup itself.
- Participants can submit or update responses until closure.
- This supports:
  - Remote participants
  - Post-event reflection
  - Follow-up analysis

### Deactivation
- Review Mode is closed explicitly or automatically (see 14.3).
- Closure creates a **binding Decision** (`closed_for_review`).
- After closure, responses become read-only.

---

## 14.3 Time-Controlled Open/Close Mechanics

Live interaction modes rely on explicit **open/close semantics** rather than implicit state.

### Design Principles
- No automatic opening of Pitch or Review Modes.
- No implicit transitions based on time alone.
- Explicit moderator intent is always recorded as a Decision.

### Time Control Options
For each live mode (Pitch or Review), the system supports:

- **Manual control**  
  Moderators open and close modes via buttons on the Dashboard.

- **Scheduled closure**  
  A Moderator may define a future timestamp at which the mode closes automatically.
  - Common use case: keep Review Mode open until a specific date after the meetup.
  - Automatic closure still creates a `closed_*` Decision with a system timestamp and human initiator.

### Visibility Guarantees
- At any time, the system guarantees:
  - At most one *interactive* Pitch is open.
  - Review Modes may be open concurrently for multiple Problems, but only one may be highlighted as *currently interactive* on the Dashboard.

### Failure and Edge Cases
- If a mode is left open unintentionally, Moderators can close it retroactively.
- Late submissions after closure are rejected without error.
- All open/close actions are logged and auditable.

---

## Relationship to Other Chapters

- The **Decision entity** and its semantics are defined in Chapter 10.
- The **Dashboard UI** that controls these modes is specified in Chapter 12.
- The **Assessment and Inventory mechanics** used in Pitch and Review Modes are specified in Chapters 7 and 8.
- The **Problem Card UI** that reflects live state is specified in Chapter 13.

Live Interaction Modes are the operational heart of the meetup: they transform static Problems into shared, time-bound collaborative experiences while preserving full traceability.
