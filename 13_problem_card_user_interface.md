# 13. Problem Card User Interface

The **Problem Card** is the central interaction surface of the entire system. It is the place where content, evaluation, discussion, and decision history converge. All users—participants, observers, moderators, administrators, and agents—interact with Problems primarily through the Problem Card, albeit with different permissions and controls.

This chapter specifies the **user interface and interaction model** of the Problem Card. It focuses exclusively on what is visible, actionable, and navigable on this screen. Data structures, decision semantics, and assessment logic are defined in other chapters and are only referenced here when necessary.

---

## 13.1 Public View

The **Public View** is accessible to anyone who has the public URL of a Problem. It is designed to be safely shareable and suitable for screen sharing during meetups.

### Core Content Area
The public view displays the currently active **major version** of the Problem by default. The following elements are always visible:

- Problem title
- Short problem description
- Problem type indicators (e.g. Explorative, Early Greenfield, Advanced Greenfield, Brownfield)
- Primary repository URL (read-only link)
- Optional secondary URL
- Current readiness state and action state (read-only)
- Current major and minor version identifiers
- Git commit hash snapshot (if available)

All textual content is strictly read-only in the public view.

### Assessment Access
From the public view, users may:

- Start a new **Assessment**, choosing from the list of Inventories applicable to the Problem
- View aggregated **rating results** (if enabled for that context)

Starting an assessment never modifies the Problem Card itself; it opens a dedicated survey interface.

### Commenting
A **Comment** button is visible in the public view.
Comments submitted here are:

- Stored in the dedicated `comments` table (separate from decisions)
- Attributed to the actor role of the commenter (Observer, Moderator, etc.)
- Non-binding by default – they do not change system state
- Displayed in the Comment Log section of the Problem Card

### Safety Indicators
The public view contains **no editing controls** and does not expose any private URLs or credentials. It is explicitly intended for projection and wide distribution.

---

## 13.2 Private View

The **Private View** is accessed via a private, non-guessable URL or through authenticated access to “My Problems”. It is intended exclusively for the Problem Owner and administrators.

### Visual Warning
At the top of the page, a prominent warning banner is displayed:

- "**Private View – Do not share this screen**"
- A secondary reminder to bookmark the page for future access

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
  Creates a new Problem with fresh URLs and versioning, without linking history.

### Self-Assessments
The Problem Owner can initiate self-assessments using any available Inventory. Completion status is inferred dynamically from existing Assessments; no explicit “completed” flags are stored.

---

## 13.3 Moderator and Admin Controls

Moderators and Administrators access additional controls when authenticated. These controls are visible in both public and private views but are clearly separated from content areas.

### Decision Controls
Moderators can trigger **single-click decisions**, including but not limited to:

- Select / deselect for meetup
- Open / close pitch assessment
- Open / close review assessment
- Defer (with multiple defer categories)
- Drop (with relevance or quality reasons)

Each action:

- Creates a Decision log entry
- Updates readiness and/or action states accordingly
- Is immediately reflected in dashboards and filters

### Group Decisions
Moderators may explicitly mark decisions as **group decisions**, reflecting live consensus during meetups. These decisions are logged identically but carry different authority semantics.

### Administrative Overrides
Administrators inherit all moderator capabilities and additionally may:

- Edit Items and Inventories
- Upgrade moderator accounts
- Inspect system-level diagnostics

Administrators act explicitly in their moderator role when interacting with Problems.

---

## 13.4 Version Navigation and Status Indicators

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

- Readiness state (e.g. Drafting, Ready, Needs Changes, Rejected)
- Action state (e.g. Planned, Pitch Open, Review Closed, Deferred, Dropped)

These indicators are always derived from the **Decision log**, never edited directly.

---

The Problem Card UI is intentionally dense but predictable. It serves simultaneously as:
- a collaboration surface,
- a decision cockpit,
- a historical record,
- and a research artifact.

All other screens in the system either lead to the Problem Card or are launched from it.
