# 12. Dashboards and System Views

This chapter describes the **global system views** that provide orientation, coordination, and control across the entire meetup lifecycle. Unlike Problem Cards or Survey pages, dashboards are not centered on a single Problem but on the *state of the system as a whole*.

Dashboards are role-sensitive: all users can access the Public Meetup Dashboard, while Moderators and Administrators see progressively richer controls and decision affordances. The visual structure is deliberately simple, optimized for live use during meetups, screen sharing, and rapid situational awareness.

---

## 12.1 Public Meetup Dashboard

The Public Meetup Dashboard is the **central shared surface** for all participants, both in-person and remote. It is designed to be safely screen-shared and publicly accessible without authentication.

### Purpose
- Provide a live, authoritative overview of the current meetup state
- Allow participants to follow along without verbal coordination
- Offer clear entry points to currently relevant interactions (e.g. voting)

### Core Elements

**Meetup Header**
- Meetup name, date, and location
- Current phase indicator (e.g. *Pre-Meetup*, *Pitching*, *Review*, *Open Hacking*)
- Optional short status message set by Moderators

**Current Interactive Activity (Prominent Section)**
- If an interactive assessment is open:
  - Clear banner: *“Now Open for Rating”*
  - Problem title and short description
  - Primary button: *Go to Rating*
- If no interactive activity is open:
  - Neutral message: *“No interactive rating open”*

This section always reflects **exactly one** interactive context, even if other assessments are open elsewhere.

**Selected Problems for This Meetup**
- Ordered list of Problems selected for the current meetup
- Each entry shows:
  - Problem title
  - Owner name (or pseudonym)
  - Current readiness and action state (read-only)
  - Link to Problem Card (public view)
- Visual cues indicate whether a Problem has already been pitched, reviewed, or worked on

**Backlog Preview (Condensed)**
- Small, non-intrusive list of:
  - Newly submitted Problems
  - Deferred-for-future Problems
- No action buttons, informational only

### Interaction Constraints
- No decisions can be triggered from the Public Dashboard
- No state changes are possible
- All buttons lead to read-only views or rating pages

The Public Dashboard establishes **shared reality**: everyone sees the same thing, at the same time.

---

## 12.2 Moderator Dashboard

The Moderator Dashboard extends the Public Dashboard with **operational controls**. It is optimized for live facilitation and may be used on desktop or mobile devices.

Moderators must be authenticated to access this view.

### Purpose
- Curate and steer the meetup flow
- Trigger assessments and decisions with minimal friction
- Serve as the control surface during screen sharing

### Structural Relationship
The Moderator Dashboard:
- Reuses all elements of the Public Dashboard
- Adds decision buttons, filters, and planning tools
- Never hides public information; it only augments it

### Additional Elements

**Moderator Control Panel**
A persistent panel (or expandable section) visible only to Moderators.

Includes:
- Buttons to open or close:
  - Pitch assessments
  - Review assessments
- Selector to choose which Problem is:
  - Currently open for pitch
  - Currently open for review
- Quick-action decision buttons (color-coded):
  - Selected for meetup (green)
  - Deferred (multiple yellow variants)
  - Dropped (red variants)

**Meetup Planning View**
- Full list of Problems with extended metadata
- Advanced filtering:
  - By meetup
  - By readiness state
  - By action state
  - By decision history
- Sorting by creation date, last decision, or priority

This view supports **pre-meetup curation** and **in-meetup reprioritization**.

**Live Decision Execution**
- Moderators can execute decisions with a single click
- Decisions are immediately logged and reflected across all views
- Optional comment field appears contextually when required (e.g. rejections)

**Activity Log Shortcut**
- Compact feed of recent Decisions and Comments
- Each entry links directly to the relevant Problem Card
- Designed to replace ad-hoc messaging tools for internal coordination

### Screen-Sharing Safety
- Moderator-only controls are visually distinct
- Public-facing content remains readable and stable
- Sensitive URLs or private views are never exposed in this dashboard

---

## 12.3 Administrator Overview

The Administrator Overview is a **meta-level system view** intended for maintenance, configuration, and oversight. It is not used during live meetup facilitation except in exceptional cases.

Administrators are authenticated users with superset permissions over Moderators.

### Purpose
- Maintain system integrity and consistency
- Configure Inventories and Items
- Oversee long-term data quality

### Core Sections

**System Status Overview**
- Summary metrics:
  - Number of Problems
  - Number of Assessments
  - Number of Decisions
- Health indicators for:
  - Active meetups
  - Open assessments
  - Retired items or inventories

**Inventory and Item Management**
- Access to Inventory definitions
- Ability to:
  - Create new Inventories
  - Clone existing Inventories
  - Retire Inventories
- Item management with strict controls:
  - Create from template
  - Change (retire + replace)
  - Prevent deletion if in use

**User and Role Oversight**
- List of authenticated users
- Ability to:
  - Upgrade Moderator accounts to Administrator
  - Inspect role usage (no impersonation)

**Global Audit Views**
- Cross-meetup views of:
  - Decision histories
  - State transitions
  - Assessment usage
- Designed for analysis, not live operations

### Design Philosophy
The Administrator Overview favors **clarity over speed**:
- No destructive actions without confirmation
- No hidden automation
- All changes leave audit traces

Administrators are trusted actors, but the system still assumes that **future analysis depends on today’s discipline**.

---

Together, these three dashboards form a coherent system of views:
- **Public Dashboard** for shared awareness
- **Moderator Dashboard** for live orchestration
- **Administrator Overview** for structural stewardship

They ensure that complex, agentic, and human-centered workflows remain navigable, transparent, and resilient.
