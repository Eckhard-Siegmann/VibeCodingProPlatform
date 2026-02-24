# 13. Problem Card User Interface

The **Problem Card** is the central interaction surface of the entire system. It is the place where content, evaluation, discussion, and decision history converge. All users—participants, observers, moderators, administrators, and agents—interact with Problems primarily through the Problem Card, albeit with different permissions and controls.

This chapter specifies the **user interface and interaction model** of the Problem Card. It focuses exclusively on what is visible, actionable, and navigable on this screen. Data structures, decision semantics, and assessment logic are defined in other chapters and are only referenced here when necessary.

---

## 13.1 Public View

The **Public View** is accessible to any authenticated user via the problem URL (`/problem/{slug}`). It is designed to be safely shareable and suitable for screen sharing during events.

### Problem Card Layout (Top to Bottom)

**Mobile (<768px)**: Collapsible sections reduce scroll length (Decision #28).
**Desktop (≥768px)**: All sections always visible, no collapse.

```
┌─────────────────────────────────────────────────────────────────┐
│ CLASSIFICATION BADGE (prominent, top, size="large")             │
│   [Greenfield] or [Brownfield] or [Explorative] etc.           │
├─────────────────────────────────────────────────────────────────┤
│ HEADER                                                          │
│   [Avatar] Title | PO Name | Status | Version                  │
├─────────────────────────────────────────────────────────────────┤
│ ▼ DESCRIPTION & RESOURCES (collapsible on mobile, open default)│
│   • Description text                                            │
│   • Direct Resources list                                       │
│   • Helpful Artifacts list                                      │
├─────────────────────────────────────────────────────────────────┤
│ ▼ ASSESSMENT GRID (collapsible on mobile, open default)        │
│   Self-Rate | Rate Pitch | Rate Review                         │
│   View Self | View Pitch | View Review                         │
├─────────────────────────────────────────────────────────────────┤
│ ▶ LESSONS LEARNED LOG (collapsible on mobile, CLOSED default)  │
│   (Tap to expand)                                               │
├─────────────────────────────────────────────────────────────────┤
│ ▼ TEAM SECTION (collapsible on mobile, open default)           │
│   • Team Members with Avatars (PO → Deputy → Coders → Retired) │
│   • [Join as Dev] button (for non-members)                     │
│   • Breakout Room URL (prominent, not in chat)                 │
├─────────────────────────────────────────────────────────────────┤
│ ▼ TEAM CHAT (collapsible on mobile, open default)              │
│   • Bubble-style messages (own=right/blue, others=left/white)  │
│   • Threading support (collapse/expand)                        │
│   • @mention autocomplete, emoji reactions                     │
├─────────────────────────────────────────────────────────────────┤
│ ▶ DECISION HISTORY (collapsible on mobile, CLOSED default)     │
│   (Tap to expand)                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Collapsible Section Defaults** (mobile only):
- **Open**: Description, Assessments, Team, Chat (frequently accessed)
- **Closed**: Lessons Learned, Decision History (accessed less often)
- User can expand/collapse any section by tapping header

**Desktop Behavior**: All sections always visible, no collapsing (no accordion)

### Core Content Area
The public view displays the currently active **major version** of the Problem by default. The following elements are always visible:

- **Classification Badge** (at very top, prominent): Explorative, Greenfield, Advanced Greenfield, Brownfield, Reverse Engineering, or Other
- Problem title
- Short problem description
- **Direct Resources** list (repositories and resources directly relevant)
- **Helpful Artifacts** list (reference material and tools)
- Current readiness state and action state (read-only)
- Current major and minor version identifiers
- Git commit hash snapshot (if available)

All textual content is strictly read-only in the public view (unless user is PO or has edit rights).

### Assessment Access

The Problem Card displays a **2×3 assessment grid** providing structured access to all assessment types:

**Row 1 – Rate Buttons (heading: "Self-Assessment | Pitch Assessment | Review Assessment"):**
| Button | Behavior |
|--------|----------|
| **Self-Rate** | Disabled in public view (Problem Owner action only) |
| **Rate Pitch** | Enabled only when a Pitch Assessment is open (not closed). Links to the assessment form. Greyed out otherwise. |
| **Rate Review** | Enabled only when a Review Assessment is open (not closed). Links to the assessment form. Greyed out otherwise. |

**Row 2 – View Buttons:**
| Button | Behavior |
|--------|----------|
| **View Self ratings** | Links to aggregated results for self-assessments |
| **View Pitch ratings** | Links to aggregated results for pitch assessments |
| **View Review ratings** | Links to aggregated results for review assessments |

Below each View button, the current response count is displayed in small text (e.g., "12 responses").

Rate buttons are full-area clickable buttons (no separate "Open" button). Inactive buttons are visually greyed out with a tooltip explaining why they are disabled.

Starting an assessment never modifies the Problem Card itself; it opens a dedicated survey interface. The assessment form render structure is determined by the backend scale consistency checker (Chapter 7.4, Chapter 26.4), which ensures uniform presentation within each inventory.

### Lessons Learned Log Section

A dedicated **Lessons Learned Log** panel is displayed prominently **above** the team chat, providing structured capture of insights.

**UI Elements:**

| Element | Description |
|---------|-------------|
| **Add Lesson** | Button to add a new lesson learned (authenticated users) |
| **Category Filter** | Dropdown to filter by category (tooling, architecture, process, gotcha, performance, testing) |
| **Event Filter** | Dropdown to filter by event event |
| **Valuable Only** | Toggle to show only lessons flagged as valuable |
| **Lesson List** | Scrollable list of lessons, newest first |

**Lesson Card Display:**
```
┌──────────────────────────────────────────────────────┐
│ [Architecture]  Jan 30, 2026 • Max Mustermann       │
│                                                      │
│ Using DSPy-style optimization for prompt tuning     │
│ reduced iteration time by 40%. Key insight: treat   │
│ prompts as optimizable artifacts, not magic.        │
│                                                      │
│ #prompting #optimization                    [★ Valuable] │
└──────────────────────────────────────────────────────┘
```

**Interaction:**
- Any authenticated user can add a lesson
- PO and moderators can mark lessons as "valuable"
- Valuable lessons are surfaced to other locations (see Cross-Location Learning)
- Edit is allowed only by the lesson author

### Team Section

A dedicated **Team Section** displays team membership and collaboration controls:

**Team Members List:**
Displays all team members for the current problem version, in priority order:
1. **PO** — Problem Owner (first, with "(PO)" suffix)
2. **PO Deputy** — If assigned (second, with "(PO deputy)" suffix)
3. **Active Coders** — Alphabetical (no suffix)
4. **Retired Members** — Grey text, italic, with "(retired)" suffix

**Buttons:**
- **[Join as Dev]** — Visible to non-members. "Join the team working on this problem."
- **[Retire from Team]** — Visible to active team members
- **[Rejoin Team]** — Visible to retired team members

**Breakout Room URL:**
Displayed prominently (not buried in chat):
```
Breakout Room: [Google Meet] https://meet.google.com/abc-defg-hij
```
Any team member can set or update this URL. Storage details in Chapter 31.7 (`problem_teams` table).

### Team Chat Section

At the bottom of the Problem Card, a **Team Chat** panel displays discussion for this problem (see Chapter 31):

- Shows recent messages with author, role, and timestamp
- **Default filter**: Shows only messages from the current major version (see Ch.31.8 for version filter specification)
- Supports quick filters: All | Moderator | PO | Has URL
- Authenticated users can post messages
- Messages support threading, @mentions, and emoji reactions

### Team Formation Button ("Join as Dev")

A prominent **"Join as Dev"** button is visible when:
- User is authenticated
- User is not already an active team member for this problem version

**Button appearance:**
```
┌────────────────────────────────────────────────┐
│ [Join as Dev]                                  │
│ "Join the team working on this problem."       │
└────────────────────────────────────────────────┘
```

**Clicking this button:**
1. Creates a team (if none exists for this problem + event)
2. Adds the user to the team with `member_role = 'coder'`, `status = 'active'`
3. Posts system message in chat: "Max joined the team"
4. Shows team-specific controls (breakout room URL, member list)

See Chapter 31.7 for complete team formation logic, including PO auto-add, version-scoped membership, and role conversion semantics.

**Moderator Role Conversion:**
If a moderator clicks "Join as Dev":
- They become a coder **for this problem only**
- They lose moderator authority for this problem (no binding decisions)
- They retain moderator role for all other problems
- This preserves objectivity: you can't moderate a problem you're coding

### Safety Indicators
The public view contains **no editing controls** for Problem Card content (unless user is PO). It is intended for projection and wide distribution.

---

## 13.2 Owner View

The **Owner View** is displayed when the authenticated user is the **Problem Owner**. It is accessed via "My Problems" in the dashboard or directly via the problem URL.

### Edit Mode Indicator
At the top of the page, an indicator shows:
- "**You are the Problem Owner**"
- Current edit status (draft, submitted, etc.)

### Best Practices Link
In draft mode, a prominent link to the **Best Practices Guide** is displayed. This guide helps Problem Owners understand:
- How to write effective problem descriptions
- The spectrum from exploratory ideas to well-specified benchmarks
- Repository setup recommendations
- That rough, exploratory problems are welcome and moderators can help refine them

### Editable Content
In the private view, the Problem Owner may edit all Problem Card fields *as long as the Problem is not submitted*. Changes are:

- Persisted immediately on field modification
- Not versioned until an explicit “New Version” action is taken

Once the Problem is submitted, all fields become read-only.

### Submission and Versioning Controls
The private view exposes the following actions:

- **Submit Problem**  
  Transitions the Problem from draft to submitted state.
- **Modify / Update Problem**  
  Creates a new **major version**, copying all content and allowing edits.
- **Clone Problem**
  Creates a new Problem, without linking history.
- **Assign PO Deputy**
  Opens a FormDialog (Ch.26.11.10) where the PO searches registered users by name or email and assigns one as deputy. Sets `deputy_owner_user_id` on the `problems` table (Ch.19.3.10). The deputy gains the same edit and management rights as the PO for this problem. Only one deputy per problem; assigning a new one replaces the previous.

### Resource Management
Problem Owners can manage resource lists:
- Add Direct Resources (repositories, docs)
- Add Helpful Artifacts (references, tools)
- Approve/reject observer suggestions
- Edit or remove resources

### Assessment Access (Owner View)

The private view displays the same **2×3 assessment grid** as the public view, with the following differences:

**Row 1 – Rate Buttons:**
| Button | Behavior |
|--------|----------|
| **Self-Rate** | Enabled when a self-assessment (Problem Evaluation inventory) exists. Opens the assessment form for the Problem Owner to evaluate their own problem. |
| **Rate Pitch** | Enabled only when a Pitch Assessment is open. Greyed out otherwise. |
| **Rate Review** | Enabled only when a Review Assessment is open. Greyed out otherwise. |

**Row 2 – View Buttons:**
Same as public view – links to aggregated results with response counts displayed below.

The Problem Owner can use self-assessments to evaluate their problem's clarity, complexity, and suitability before or after submission. Completion status is inferred dynamically from existing responses; no explicit "completed" flags are stored.

---

## 13.3 Team Member View

When an authenticated user has "accepted the challenge" for this problem, they see additional **Team Controls**:

### Team Panel
A dedicated panel displays:

- **Team Members**: List of users who have joined the team
- **Breakout Room URL**: Video call link (if set)
  - Any team member can add/update this link
- **Solution Repositories**: Links shared by team members
  - Users can add their own solution repo

### Team Chat (Expanded)
The chat panel shows:
- Full team discussion history
- Team-specific messages (`team_id` filter)
- System messages for team activity ("Eva joined", "Max shared a repo")

### Resource Editing
Team members can:
- Add Direct Resources (auto-approved)
- Add Helpful Artifacts (auto-approved)
- See pending observer suggestions (for awareness)

---

## 13.4 Moderator and Admin Controls

Moderators and Administrators access additional controls when authenticated. These controls are visible in both public and private views but are clearly separated from content areas.

### Decision Controls
Moderators can trigger **single-click decisions**, including but not limited to:

- `selected_for_event` / `deselected_for_event`
- `selected_for_coding` / `deselected_for_coding`
- `opened_for_pitch_assessment` / `closed_for_pitch_assessment`
- `opened_for_review` / `closed_for_review`
- Quality gate decisions: `quality_gate_accepted`, `quality_gate_rejected`, `quality_gate_needs_changes`
- Deferral decisions: `deferred_po_absent`, `deferred_low_priority`, `deferred_skipped`, `deferred_too_complex`, `deferred_needs_refinement`, `deferred_future_capability`
- Drop decisions: `dropped_low_relevance`, `dropped_low_quality`
- Close decisions: `closed_complete`, `closed_partial`

Each action:

- Creates a Decision log entry
- Updates readiness and/or action states accordingly
- Is immediately reflected in dashboards and filters

### Group Decisions
Moderators may explicitly mark decisions as **group decisions**, reflecting live consensus during events. These decisions are logged identically but carry different authority semantics.

### Administrative Overrides
Administrators inherit all moderator capabilities and additionally may:

- Edit Items and Inventories
- Upgrade moderator accounts
- Inspect system-level diagnostics

Administrators act explicitly in their moderator role when interacting with Problems.

---

## 13.5 Version Navigation and Status Indicators

### Version Navigation
The Problem Card includes a **version navigation panel**:

- A list of all major versions, ordered chronologically
- The latest major version selected by default
- An optional toggle to display minor versions

Selecting an older version switches the view into **archive mode**.

### Archive Mode Indicators
When viewing a non-current version:

- A highlighted banner indicates “Archived Version”
- Editing and decision actions are disabled
- A single action is available:  
  **Promote this version to new major version**

Promotion creates a new major version referencing the selected archive.

### Status Indicators
Throughout the Problem Card, status indicators are displayed consistently:

- **Readiness state**: `draft`, `submitted`, `needs_changes`, `ready`, `rejected`
- **Action state**: `backlog`, `selected_for_event`, `selected_for_coding`, `deferred`, `dropped`, `closed`

These indicators are always derived from the **Decision log**, never edited directly. See Chapter 27 for complete state transition rules and decision types.

**Note on live context**: When a pitch or review assessment is open, the Problem Card may display a "Pitch Open" or "Review Open" indicator near the assessment grid (distinct from the action state badge in the header). This is derived from the `event_live_context` table (see Chapter 14) and represents a transient orchestration state, **not** an action state value.

---

## 13.6 State Visualization and Journey Display

The dual-state model (readiness + action) is powerful for the system but can confuse participants. This section specifies how to make state visible, understandable, and actionable.

### 13.6.1 Visual Journey Map Component

A compact visual showing the problem's path through the system (based on the state diagrams in Chapter 28):

**Readiness Journey:**
```
● Draft → ● Submitted → ○ Needs Changes → ● Ready
                                     ↘ ○ Rejected
```

**Action Journey:**
```
● Backlog → ● Selected → ○ Coding → ○ Closed
        ↘ ○ Deferred    ↘ ○ Dropped
```

**Current state** is highlighted (filled circle), **past states** shown as passed through, **future states** as outline.

**Placement:** Below the header, above the description. Collapsible on mobile.

### 13.6.2 State Badges with Explanations

Each state badge is clickable/hoverable to show explanation:

| Badge | Tooltip |
|-------|---------|
| `Draft` | "Problem is being authored. Only the PO can see it." |
| `Submitted` | "Submitted for review. Moderators will evaluate." |
| `Needs Changes` | "Feedback received. PO should update and resubmit." |
| `Ready` | "Quality gate passed! This problem can be pitched." |
| `Rejected` | "Did not pass quality review. Consider major revision." |
| `Backlog` | "Available for future events. Not yet selected." |
| `Selected for Event` | "Planned for an upcoming event." |
| `Selected for Coding` | "Currently being worked on!" |
| `Deferred` | "Postponed. See decision history for reason." |
| `Dropped` | "Removed from consideration." |
| `Closed` | "Completed! No further action needed." |

### 13.6.3 "Next Steps" Guidance Panel

Based on current state and user role, show contextual guidance:

**For Problem Owner:**

| Current State | Next Steps Panel |
|---------------|------------------|
| Draft | "Ready to share? [Submit for Review]" |
| Submitted | "Waiting for moderator review. Check chat for feedback." |
| Needs Changes | "Moderators requested updates. [Edit Problem] [View Feedback]" |
| Ready | "Your problem can now be selected for a event!" |
| Selected for Coding | "Teams are working! Check the chat for progress." |

**For Participants:**

| Current State | Next Steps Panel |
|---------------|------------------|
| Pitch Open | "Rate this problem now! [Vote]" |
| Selected for Coding | "Want to work on this? [Join as Dev]" |
| Review Open | "How did the solutions turn out? [Rate Review]" |

**For Moderators:**

| Current State | Next Steps Panel |
|---------------|------------------|
| Submitted | "[Accept] [Request Changes] [Reject]" |
| Ready (not selected) | "[Select for Event]" |
| Selected for Event | "[Open Pitch] [Defer] [Drop]" |
| Selected for Coding | "[Open Review] [Close for Coding]" |

### 13.6.4 Decision History Timeline

A visual timeline of state transitions, accessible via "History" tab:

```
Decision History
────────────────
Feb 3, 2026
  ● Problem created (Max Mustermann)
  ● Problem submitted (Max Mustermann)

Feb 5, 2026
  ● Quality gate needs changes (Eva Schmidt, moderator)
    "Please add acceptance criteria"

Feb 6, 2026
  ● Problem updated (Max Mustermann)
  ● Problem submitted (Max Mustermann)
  ● Quality gate accepted (Eva Schmidt, moderator)

Feb 10, 2026
  ● Selected for event (Tom Weber, moderator)
  ● Opened for pitch (Tom Weber, moderator)
  ● Closed for pitch (Tom Weber, moderator)
  ● Selected for coding (Tom Weber, moderator)
```

**Timeline Features:**
- Grouped by date
- Shows actor and role
- Shows rationale (if provided)
- Binding vs. non-binding indicated (subtle icon)
- Filtering: All | Quality Gate | Planning | Live

### 13.6.5 Dual-State Explanation Panel

An expandable "What are these states?" help panel:

```
Understanding Problem States
────────────────────────────
Problems have TWO independent states:

READINESS (Is it well-defined?)
  Your problem's quality status — has it passed review?
  • Draft → Submitted → Ready (or Needs Changes, Rejected)

ACTION (What's the community doing with it?)
  What the community intends to do with your problem.
  • Backlog → Selected → Coding → Closed (or Deferred, Dropped)

These are independent! A "Ready" problem might still be in "Backlog"
because no event has selected it yet.

[Got it]
```

---

## 13.7 Relationship to Other Chapters

The Problem Card UI is intentionally dense but predictable. It serves simultaneously as:
- a collaboration surface,
- a decision cockpit,
- a historical record,
- and a research artifact.

All other screens in the system either lead to the Problem Card or are launched from it.

**Related Chapters:**
- **Chapter 4**: Problem identity and state definitions
- **Chapter 10**: Decision types and semantics
- **Chapter 14**: Live interaction modes (pitch/review indicators)
- **Chapter 19**: Data model for problems, versions, decisions
- **Chapter 27**: State transition rules
- **Chapter 31**: Team chat integration
- **Chapter 32**: First-time user guidance on Problem Card
- **Chapter 33**: Milestone recognition on state transitions
