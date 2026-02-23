# 17. Administration Interfaces

This chapter describes the **administrative user interfaces** of the system. These interfaces are intentionally minimal and optimized for correctness, traceability, and low operational overhead rather than visual polish. Administration is treated as a *meta-activity* that shapes the statistical and semantic integrity of the entire system.

Administrators are trusted actors. The UI is therefore designed to make powerful actions explicit, deliberate, and reversible by design (through versioning and logging), rather than by restrictive guardrails.

---

## 17.0 Mobile Administration Guarantee

**CRITICAL REQUIREMENT**: All administration interfaces MUST work on smartphones.

Moderators and administrators frequently need to make decisions during live events while moving around the room, checking in participants at the door, or responding to issues from any location. The platform guarantees full administrative functionality on devices as small as **375px width (iPhone SE)**.

**Design patterns for mobile admin**:
- **Vertical scroll for complex forms** - All fields visible via scrolling, no side-by-side layouts forced
- **Touch-friendly controls** - 44×44px minimum touch targets for all interactive elements
- **Accordion organization** - Dense decision sets grouped into collapsible categories
- **Wizard flows** - Multi-step operations (CSV import, event creation) broken into manageable steps
- **Responsive tables** - Transform to card layouts on mobile devices
- **Full-width inputs** - Form fields expand to viewport width minus standard margins

**No administrative function may be marked "desktop-only" or require landscape mode to be usable.** While some complex tasks (inventory shuttle, CSV preview) may be more comfortable on larger screens, they remain fully functional on smartphones.

---

## 17.1 Item and Inventory Management

### Purpose and Scope

The Item and Inventory Management interface is the **semantic control center** of the system. It governs what can be measured, how it is measured, and in which structured contexts measurements are applied.

Because all Assessments, statistics, and longitudinal analyses ultimately depend on Items and Inventories, this interface is restricted to Administrators.

---

### Item Management UI

The Item Management screen presents a **flat, complete list of all Items**, with a clear distinction between active and retired Items.

Key characteristics:

- Single-table overview of Items (responsive: table on desktop, cards on mobile)
- No pagination expected (low item count by design)
- Clicking a row reveals a detailed editor panel
- **Mobile**: Item list displays as cards, editor shows all fields via vertical scroll

Each Item row exposes, at minimum:

- Item key (immutable identifier)
- Short label / mnemonic
- Max rating (1, 2, 3, 5, 7, or 10)
- Active / retired status
- Creation timestamp
- Retirement timestamp (if applicable)

---

### Item Editor

Selecting an Item opens a detailed editor view that displays **all render-relevant fields** of the Item in expanded form, including:

- Full item text
- Scale definition (via max_rating)
- All label text fields corresponding to the scale
- Item category / type
- Optional internal notes for administrators

The editor supports three explicit actions:

- **Create New Item**  
  Starts from a blank template or from an optional existing Item as a template.  
  The Item key must be newly defined and unique.

- **Change Item**  
  The Item key is locked and cannot be edited.  
  Any change (text, scale, labels, metadata) results in:
  - Automatic retirement of the old Item version
  - Creation of a new Item row with the same Item key
  - Atomic guarantee that only one active Item exists per key

- **Retire Item**
  Only permitted if the Item is not referenced by any Inventory and has no responses.
  If referenced or has responses, retirement is blocked and the UI explains why.
  Items are never deleted; they are retired by setting `retired_at` timestamp.

Administrators do not manage version numbers manually. Versioning is implicit through immutability and timestamps.

---

### Inventory Management UI

Inventories define **ordered sets of Item keys**. They do not duplicate Item content.

The Inventory Management screen provides:

- A list of all Inventories (active and retired)
- Inventory name, purpose, and context
- Active / retired status

---

### Inventory Editor

Creating or editing an Inventory opens a **dual-list shuttle interface**.

**Desktop Layout** (≥768px): Side-by-side dual lists as shown below.
**Mobile Layout** (<768px): Vertical stacking - Available Items section above Inventory Items section, full-width shuttle buttons.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Inventory Editor                                 │
├───────────────────────────┬─────┬───────────────────────────────────┤
│   Available Items         │     │   Inventory Items (ordered)       │
├───────────────────────────┤     ├───────────────────────────────────┤
│ ☐ correctness             │     │ 1. problem_clarity            [↑] │
│ ☐ test_support            │ [>] │ 2. acceptance_criteria_quality[↓] │
│ ☐ code_readability        │     │ 3. testability                    │
│ ☐ simplicity              │ [<] │ 4. complexity_fit                 │
│ ☐ elegance                │     │ 5. engagement_intensity           │
│ ☐ extensibility           │     │                                   │
│ ...                       │     │                                   │
└───────────────────────────┴─────┴───────────────────────────────────┘
                                                        [Cancel] [Save]
```

**Left panel**: All active items (not retired) that are NOT currently in the inventory.

**Right panel**: Items included in the inventory, displayed in their `position_index` order.

**Controls**:
- `[>]` button: Move selected items from left panel to right panel (adds to inventory)
- `[<]` button: Move selected items from right panel to left panel (removes from inventory)
- `[↑]` / `[↓]` buttons: Reorder selected item in right panel

**Workflow**:
1. For a new inventory, left panel shows all active items, right panel is empty
2. Administrator selects one or more items in left panel
3. Click `[>]` to add selected items to inventory
4. Select item in right panel, use `[↑]`/`[↓]` to adjust order
5. Click `[Save]` to persist the inventory with computed `position_index` values

**Design rationale**: This explicit shuttle pattern avoids drag-and-drop complexity, works reliably across browsers, and makes the add/remove/reorder operations unambiguous. No item categories or automatic grouping—the administrator explicitly curates each inventory.

Actions supported:

- **Create Inventory**
- **Clone Inventory**
- **Change Inventory**
- **Retire Inventory**

As with Items, changing an Inventory results in retirement of the previous version and creation of a new one. Existing Assessments remain linked to the historical Inventory version.

---

## 17.2 Versioning and Retirement of Items

### Immutability as a Design Principle

All Items and Inventories are **immutable once used**. This ensures that historical data remains interpretable and statistically valid.

Administrators never overwrite existing semantics. Instead, they:

- Retire outdated definitions
- Introduce improved successors
- Preserve continuity via stable Item keys

This approach aligns the system with best practices from scientific measurement theory and requirements engineering.

---

### Active vs. Retired Semantics

An Item or Inventory is considered:

- **Active** if `retired_at` is NULL
- **Retired** if `retired_at` contains a timestamp

There is no separate boolean flag. Temporal validity is derived solely from timestamps.

The Admin UI enforces the invariant:

> For any given Item key, at most one Item may be active at a time.

This invariant is enforced both at the UI level and transactionally at the database level.

---

### Administrative Guarantees

The Administration Interfaces guarantee:

- No silent semantic drift
- No retroactive modification of measurement instruments
- Clear lineage from historical data to the definitions that produced it

These guarantees are critical for later automated evaluation, agent-based meta-analysis, and longitudinal research.

---

## 17.3 Event Management

### Purpose

Events are the core organizational unit for the community. The Event Administration interface allows creation and management of events across all locations.

### Event Creation

Administrators (and Moderators) can create events with:

- Title and description
- Partner selection (from partner list)
- Room selection (determines location and capacity)
- Start time and planned end time
- Host and co-host assignments (must have moderator role)
- External links (website, LinkedIn, X)
- Overbooking factor (default 130%)
- Optional custom image

### Event Management

For existing events, administrators can:

- Edit event details
- View and manage registrations
- View waitlist and process invitations
- Track attendance for show-up rate analysis
- Associate problems with the event
- View event chat activity

---

## 17.4 Partner and Location Management

### Partner Management

Administrators manage partner organizations that host events.

**Partner Creation/Editing**:
- Name and description
- Logo URL (used for auto-generated event images)
- Website URL
- Contact person name and email
- Partner type (co-working, university, company, community)

### Location Management

Administrators manage physical venues.

**Location Creation/Editing**:
- Name (e.g., "STARTPLATZ Köln")
- Address
- City

### Room Management

Within each location, administrators manage rooms.

**Room Creation/Editing**:
- Name (e.g., "Workshop Room A")
- Location assignment
- Capacity with tables
- Capacity without tables

---

## 17.5 User Management

### User List

Administrators can view all users with:

- Email and display name
- Role
- Registration date
- Email confirmation status
- Newsletter subscription status
- Events attended

### CSV Import

Administrators can bulk-import users from partner-provided lists.

**Import Process**:
1. Upload CSV file with columns: email, display_name, event_slug (optional), in_presence (optional)
2. System processes each row:
   - New emails: create user, generate OTP, queue onboarding email
   - Existing emails: skip user creation, use existing user_id
   - If event_slug provided: create event registration
3. View import report with results

**See Chapter 30 for detailed CSV format and import logic.**

### Role Management

Administrators can:
- Promote users to Moderator
- Promote Moderators to Administrator
- View role history

### Newsletter Management

Administrators can:
- View newsletter subscription list
- Export subscriber list
- (Future) Trigger newsletter sends

---

## 17.6 System Configuration

System-wide configuration is intentionally minimal and conservative.

Configurable elements include:

- Which Inventories are available for which contexts
- Default Inventories for Problem registration, Pitch, Review, and Follow-up
- Time windows for automatic opening/closing of Assessments
- Visibility defaults for dashboards and public pages

All system configuration changes are logged and auditable, but they do not retroactively affect existing data.

---

## 17.7 Role Interaction Model

Administrators implicitly inherit all Moderator capabilities.

Typical usage patterns include:

- Logging in as Administrator for setup, semantic changes, and user management
- Acting operationally as Moderator during live events
- Avoiding role switching overhead during time-critical sessions

This pragmatic model prioritizes **flow and reliability** over strict separation, while still preserving accountability through role-aware logging.

---

## 17.8 Moderator Decision Support

During live events, moderators make decisions under time pressure. The system provides contextual support to reduce cognitive load and increase decision quality.

### 17.8.1 Contextual Decision Suggestions

Based on problem state and history, suggest appropriate next actions:

**Decision Suggestion Panel (on Problem Card for Moderators):**

```
Suggested Actions
─────────────────
Problem state: Submitted → Ready for quality gate decision

Recommended: [Accept] — Problem meets clarity and scope criteria
Alternative: [Request Changes] — If acceptance criteria need refinement

Common patterns for this problem type (greenfield):
• 78% are accepted on first submission
• Average review time: 2 days
```

**Suggestion Rules:**

| Current State | Suggested Action | Rationale |
|---------------|------------------|-----------|
| Submitted | Accept / Request Changes / Reject | Quality gate decision needed |
| Ready, not selected | Select for Event | Available for upcoming events |
| Selected for Event, pitch done | Select for Coding / Defer | Post-pitch decision |
| Selected for Coding, sprint done | Open Review | Evaluation phase |
| Review closed, scores available | Award Stars | Recognition phase |

### 17.8.2 Decision Type Quick-Reference

During live events, moderators have quick access to decision types organized by category. For the complete decision type catalog and state transition rules, see Chapter 10 (Decisions and Decision History).

The moderator UI presents these decisions with color-coding (see Section 17.8.3) for visual clarity during time-pressured orchestration.

### 17.8.3 Color-Coded Decision Categories

In the moderator UI, decision buttons are color-coded by category:

| Category | Color | Examples |
|----------|-------|----------|
| Quality Gate | Blue | Accept, Request Changes, Reject |
| Planning | Green | Select for Event, Deselect |
| Sprint | Teal | Select for Coding, Deselect |
| Deferral | Yellow | All deferred_* types |
| Drop | Red | dropped_low_relevance, dropped_low_quality |
| Close | Purple | closed_complete, closed_partial |
| Live | Orange | Open/close pitch, Open/close review |

### 17.8.4 "Why Was This Deferred?" Visibility

When a problem is deferred, the specific reason is visible to Problem Owners:

```
Problem Status: Deferred
────────────────────────
Reason: Too Complex
Recorded by: Eva Schmidt (moderator)
Date: Feb 3, 2026

Moderator note: "Great problem, but too ambitious for a 90-minute sprint.
Consider splitting into phases or simplifying scope."

What to do:
• Revise the problem to reduce scope
• [Create New Version] to resubmit
• Contact the moderator with questions
```

---

## 17.9 Star Awards Administration

Moderators award stars for hacking excellence based on review assessment scores.

### 17.9.1 Star Awards UI

After review assessments close, moderators see an awards panel:

```
Star Awards: "API Rate Limiter" (VibeCoding Cologne Feb 2026)
──────────────────────────────────────────────────────────────

Review scores (weighted):
────────────────────────
1. Team Max (Max, Eva)        Score: 4.2 ⭐⭐⭐ Suggested: 1st place
2. Team Lisa (Lisa, Tom)      Score: 3.8 ⭐⭐   Suggested: 2nd place
3. Team Anna (Anna)           Score: 3.5 ⭐     Suggested: 3rd place

[Confirm Awards] [Adjust Rankings]
```

### 17.9.2 Award Confirmation Flow

1. **Scores calculated** from weighted review assessments
   - Live reviews: 1.0x weight
   - Post-event reviews: 1.5x weight
   - Agent reviews: 0.5x weight

2. **Rankings suggested** based on scores

3. **Moderator reviews** and can adjust if circumstances warrant
   - Ties handled by moderator judgment
   - Extraordinary circumstances can override scores

4. **Awards confirmed** and recorded in `star_awards` table

5. **Contributors notified** via dashboard update

### 17.9.3 Contributor Recognition Configuration

Administrators can configure point weights for the contributor recognition system.

**Point Actions and Weights**: See Chapter 19.3.32 (`contribution_action_catalog`) for the complete point-earning action list and Chapter 33.6.3 for the scoring model. Default: 1 point per action (review completion, valuable contributions, problem submission, selection for pitch/coding).

**Review Weights for Star Calculation**: See Chapter 19.3.35 (`review_weight_catalog`) and Chapter 33.6.4 for the complete weighting system. Defaults: live reviews 1.0x, post-event reviews 1.5x, agent reviews 0.5x.

The admin UI allows adjusting `current_points` values for each action and review weight multipliers without schema changes.

---

## 17.10 Relationship to Other Chapters

- The **data structures underlying Items and Inventories** are defined in Chapter 7.
- The **Decision logging model** referenced by administrative actions is specified in Chapter 10.
- The **Moderator-facing operational dashboards** are specified in Chapter 12.
- The **statistical presentation and aggregation** are discussed in Chapter 15.
- The **persistence model** is specified in Chapter 19.
- The **events, partners, and locations model** is specified in Chapter 29.
- The **registration and CSV import** is specified in Chapter 30.
- The **contributor recognition system** is specified in Chapter 33.
- The **onboarding for first-time moderators** is specified in Chapter 32.

Administration Interfaces are deliberately simple—but they govern the semantic integrity of the entire system. Their correctness matters more than any other UI in the platform.
