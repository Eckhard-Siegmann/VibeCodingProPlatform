# 14. Live Interaction Modes

This chapter specifies the **live interaction modes** that govern how participants engage with Problems during an active event. These modes define *when* and *how* collective attention, evaluation, and decision-making are synchronized in real time. They are deliberately lightweight, operator-driven, and optimized for hybrid (in-presence + remote) settings.

Live interaction modes do **not** introduce new domain objects. They orchestrate existing ones—Problems, Assessments, Inventories, and Decisions—under temporal control.

---

## 14.1 Pitch Mode

**Pitch Mode** is the live phase in which a Problem is presented to the group for the first time during a event.

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
- It may occur immediately after hacking, during open hacking, or asynchronously after the event.
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
- Review Mode may remain open beyond the event itself.
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
  - Common use case: keep Review Mode open until a specific date after the event.
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

## 14.4 Live Context Storage

Live interaction state is tracked separately from problem action state. The `event_live_context` table caches the current orchestration state:

- `current_mode`: `idle`, `pitch`, or `review`
- `current_problem_id`: the problem currently being pitched or reviewed (NULL when idle)
- `mode_opened_at`: when the current mode was opened

This is a **derived cache**, not a source of truth. The authoritative record remains the sequence of `opened_for_*` and `closed_for_*` decisions in the `decisions` table.

**Terminology**: This chapter uses "Pitch Mode" and "Review Mode" for readability. In the database (Chapter 19.3.9), these are stored as `current_mode = 'pitch'` and `current_mode = 'review'` in the `event_live_context` table.

**Important**: Live modes (`pitch`, `review`, `idle`) are **not** action states. A problem's `current_action_state` (e.g., `selected_for_event`, `selected_for_coding`) is not affected by opening or closing pitch/review modes.

---

## 14.5 Pace Support and Phase Awareness

During live events, cognitive load spikes. Participants juggle listening, evaluating, coding, and reviewing. The platform reduces "where are we?" friction through visible pace support and phase awareness indicators.

### 14.5.1 Countdown Timers

When time-boxed phases are active, display countdown timers prominently.

**Timer Display Contexts:**

| Phase | Timer Location | Default Duration | Visual Treatment |
|-------|----------------|------------------|------------------|
| Pitch voting | Assessment form header | 5 minutes | Prominent, animated last 60s |
| Coding sprint | Dashboard + Problem Card | Configurable (e.g., 90 min) | Persistent, warning at 15 min |
| Review submission | Assessment form header | Optional (often unlimited) | Subtle if set |

**Timer Behavior:**
- Timers are set by moderators when opening a phase
- Countdown visible to all participants
- Visual escalation as time runs low (color change at 25%, animation at 10%)
- **Audio cue option** (Decision #23): Optional beep at 1 minute remaining and at expiry
  - User preference: Enabled/disabled in account settings or localStorage
  - Default: Disabled (opt-in for sound)
  - Sounds: Gentle beep, not jarring alarm
  - Respects system audio settings

**Audio Implementation**:
- User setting: `audio_cues_enabled` boolean (persisted to user preferences)
- Sound files: `/static/sounds/timer-warning.mp3` (1min), `timer-expired.mp3` (0:00)
- Playback: audioStore.playTimerWarning() and playTimerExpired()
- Fallback: Visual-only if audio blocked or disabled

**Timer Configuration:**
```
Open Pitch Assessment

Problem: "API Rate Limiter"
Duration: [5 minutes ▼]  ☐ No time limit

[Open Pitch]
```

#### 14.5.1.1 Timer Auto-Closure Architecture

Since the platform runs as a **stateless web application** without background workers or cron jobs, timer expiry is evaluated **lazily on read**. There is no daemon that fires when a timer reaches zero.

**Lazy evaluation rule**: Whenever `event_live_context` is read (via GET endpoint or server load function), if ALL of the following are true:

1. `timer_ends_at` is non-null
2. `timer_ends_at` is in the past (compared to server-side `now()`)
3. `current_mode` is not `idle`

Then the system MUST, before returning the context:

1. Determine the correct close decision type from `current_mode`:
   - `pitch` → `closed_for_pitch_assessment`
   - `review` → `closed_for_review`
2. Record a decision via the standard `recordDecision()` path with:
   - `actor_user_id`: the event's host user (from `events.host_user_id`)
   - `rationale`: `"Timer expired (auto-closed)"`
   - All normal decision side-effects apply (live context → idle, assessment closed, queue state updated)
3. Return the **updated** (now idle) context to the caller

**Guarantees**:
- The timer always "fires" on the next read, even if no client polled during the expiry window
- Client-side countdown display is purely cosmetic — server-side lazy evaluation is **authoritative**
- Multiple concurrent reads that observe an expired timer are safe: the first to enter the transaction performs the close; subsequent reads see the already-idle context
- If the server is unreachable during expiry, the timer fires on the first request after the server resumes

### 14.5.2 Phase Transition Notifications

When phases change, notify participants clearly.

**Notification Types:**

| Transition | Notification | Delivery |
|------------|--------------|----------|
| Pitch opened | "🎤 Pitch started: {Problem Title}" | Banner + optional sound |
| Pitch closing soon | "⏰ Pitch closes in 1 minute" | Banner + animation |
| Pitch closed | "✓ Pitch closed. {N} votes collected." | Banner fade |
| Review opened | "📝 Review opened: {Problem Title}" | Banner |
| Coding started | "💻 Coding sprint started! {Duration}" | Banner + timer start |
| Coding ending soon | "⏰ 15 minutes remaining" | Banner + sound option |
| Coding ended | "🏁 Time's up! Wrap up your work." | Banner + timer stop |

**Sound Cues (Optional):**
- Short, pleasant chime for phase opens
- Warning tone for "closing soon"
- Completion tone for phase closes
- User preference to disable sounds

### 14.5.3 "What's Happening Now?" Banner

A persistent, prominent banner showing current event state.

**Banner States:**

| Event State | Banner Content | Color |
|-------------|----------------|-------|
| Idle (between phases) | "Next: {Problem Title} pitch at {Time}" | Neutral |
| Pitch active | "🔴 LIVE: Pitching '{Problem Title}' — Vote now!" | Accent color |
| Coding active | "💻 Coding: '{Problem Title}' — {Time} remaining" | Accent color |
| Review active | "📝 Review open: '{Problem Title}'" | Accent color |
| Event not started | "{Event Name} starts at {Time}" | Neutral |
| Event ended | "Event ended. Thank you for participating!" | Neutral |

**Banner Visibility:**
- Always visible at top of page during events
- Sticky on scroll
- Clickable to navigate to relevant page (pitch form, problem card, etc.)

### 14.5.4 Schedule Timeline Visualization

For moderators and optionally participants, show the event flow visually.

**Timeline Display:**
```
Event Timeline: VibeCoding Cologne February 2026
────────────────────────────────────────────────
18:00  ●──── Welcome & Intro
18:15  ●──── Problem Pitches (3 problems)
       │     ├─ API Rate Limiter ✓
       │     ├─ CLI Parser ✓
       │     └─ Database Migration ← NOW
18:45  ○──── Problem Selection
19:00  ○──── Coding Sprint (90 min)
20:30  ○──── Solution Reviews
21:00  ○──── Wrap-up & Lessons Learned
```

**Timeline Features:**
- Current phase highlighted
- Completed phases marked with checkmark
- Upcoming phases shown as outline
- Clickable phases link to relevant actions (moderators only)
- Responsive: collapses to compact view on mobile

### 14.5.5 Moderator Pace Controls

Moderators have additional pace control capabilities.

**Quick Actions:**
- "Extend by 5 minutes" — Add time to current countdown
- "Close now" — Immediately close current phase
- "Announce" — Push notification to all participants

**Event Agenda Management:**
```
Event Agenda
────────────
[+ Add phase]

1. Welcome & Intro (18:00-18:15)    [Edit] [Skip]
2. Pitches (18:15-18:45)            [Edit] [Active]
   ├─ API Rate Limiter              [Done]
   ├─ CLI Parser                    [Done]
   └─ Database Migration            [In Progress]
3. Problem Selection (18:45-19:00)  [Edit] [Start]
...
```

**Phase-Action Mapping:**

The following table maps event phases to the moderator actions and decision types that are typically relevant during each phase. This mapping is informational; per Chapter 22 ("No Enforced Workflow Engine"), the system does not enforce phase-action constraints.

| Event Phase | Relevant Decision Types | Timer Controls | UI Actions |
|-------------|------------------------|----------------|------------|
| **Pre-event (curation)** | `selected_for_event`, `deselected_for_event`, quality gate decisions | — | Reorder queue, filter backlog, review submissions |
| **Welcome / intro** | — | — | Send announcement, set status message |
| **Pitch phase** (per problem) | `opened_for_pitch_assessment`, `closed_for_pitch_assessment` | Pitch countdown (default 5 min), extend | Push "Vote now" notification |
| **Selection discussion** (after all pitches) | `selected_for_coding`, `deselected_for_coding`, `deferred_*` | — | View pitch results, reorder queue |
| **Coding sprint** | `deselected_for_coding` (if team fails to form) | Sprint countdown, extend | **Team formation** ("Join as Dev"), monitor team chat, send announcement |
| **Review phase** (per problem) | `opened_for_review`, `closed_for_review` | Optional review countdown | Push "Review now" notification |
| **Post-event wrap-up** | `closed_complete`, `closed_partial`, `dropped_*` | — | Award stars (Ch.33.6.4), capture lessons learned, mark attendance |

**Note**: Moderators are free to execute any available decision at any time. For example, a moderator may defer a problem during the pitch phase if the Problem Owner is unexpectedly absent (`deferred_po_absent`), or re-open a review during wrap-up if new information surfaces. The table above reflects the *typical* alignment, not a constraint.

**Visual representation**: See Chapter 28 for state transition diagrams and orchestration flowcharts that complement this phase-action mapping.

---

## Relationship to Other Chapters

- The **Decision entity** and its semantics are defined in Chapter 10.
- The **Dashboard UI** that controls these modes is specified in Chapter 12.
- The **Assessment and Inventory mechanics** used in Pitch and Review Modes are specified in Chapters 7 and 8.
- The **Problem Card UI** that reflects live state is specified in Chapter 13.
- The **Star Awards administration** used during post-event wrap-up is specified in Chapter 33 (33.6.4).
- The **`event_live_context` table** is defined in Chapter 19.
- The **State transition diagrams** including live event orchestration are in Chapter 28.
- The **Milestone recognition** for phase transitions is specified in Chapter 33.
- The **Onboarding guidance** for first-time live participation is specified in Chapter 32.

Live Interaction Modes are the operational heart of the event: they transform static Problems into shared, time-bound collaborative experiences while preserving full traceability.
