# Problem Card Page Design (3 Perspectives)

**Status**: Partially Retroactive (basic implementation exists) + Proactive (missing sections)
**Route**: `/problem/[slug]`
**File**: `frontend/query/src/routes/problem/[slug]/+page.svelte`
**Created**: 2026-02-04

---

## Overview

Core UI for problem display with **role-based visibility**. The Problem Card is the central interaction surface for the entire platform, serving as the workspace for problem owners, collaboration hub for teams, voting interface for participants, and decision control panel for moderators.

**Three Distinct Perspectives**:
1. **Problem Owner / Deputy PO** — Edit, submit, manage
2. **Observer** — View, rate, suggest, join
3. **Moderator / Admin** — All decision controls, quality gate, event selection

**Philosophy**: Same URL, same content, different controls based on authentication and role.

---

## URL Pattern

`/problem/[slug]`

**Dynamic Segment**: `slug` (human-readable, unique identifier)
**Query Params**:
- `?v=N` — View historical version (optional)

**Examples**:
- `/problem/api-rate-limiter` — Current version
- `/problem/api-rate-limiter?v=1` — View version 1.00 (historical)

---

## User Stories Covered

### Problem Owner Stories (P1-P18)
- P1: Create Problem
- P2: Auto-save
- P3: Self-Assessment
- P4: Submit Problem
- P5: Update Problem
- P6: Attach Repository
- P7: Promote Version
- P8: View Decisions
- P9: Assign Deputy
- P10: Manage Resources
- P11: Approve Suggestions
- P12: Add Lessons
- P13: Flag Valuable
- P14: Set Breakout URL
- P15: Clone Problem
- P16: Team Chat
- P17: View Results
- P18: Archive Problem

### Observer Stories (U6-U28)
- U6: Browse Problems
- U7: Vote During Pitch
- U8: Skip Items
- U9: Join Team
- U10: Post in Chat
- U11: Chat Filters
- U12: Share Repository
- U13: Add Breakout URL
- U16: Suggest Resource
- U22: Add Lessons Learned
- U23-U24: Retire/Rejoin Team
- U25: Filter Chat by Version
- U26: View Historical Versions
- U27: View Decision History
- U28: View Assessment Results

### Moderator Stories (M3-M26)
- M3: Review Problem
- M4: Post in Chat
- M5: Quality Gate Decision
- M6: Select for Event
- M7: Defer Problem
- M8-M9: Open/Close Pitch
- M11: Select for Coding
- M12: Open/Close Review
- M18: Deselect from Coding
- M19: Award Stars
- M21: Close Problem
- M22: Drop Problem
- M25: Flag Lessons as Valuable
- M26: Delete Messages

**Specification Sources**: Ch.13 (Problem Card UI), Ch.04 (Problems), Ch.10 (Decisions), Ch.31 (Team Chat)

---

## THREE PERSPECTIVES

## PERSPECTIVE 1: Problem Owner / Deputy PO

### Unique Visibility

**What PO Sees (vs. Others)**:
- ✅ Edit Mode Indicator banner ("You are the Problem Owner")
- ✅ Best Practices Link (draft mode only)
- ✅ Editable fields (draft mode only): Title, Description, Acceptance Criteria, Classification
- ✅ Auto-save feedback on editable fields
- ✅ Submission controls: Submit, Modify, Clone, Archive
- ✅ Self-assessment access (Self-Rate button always enabled)
- ✅ Resource management: Add/edit/delete Direct Resources and Helpful Artifacts
- ✅ Deputy assignment control
- ⬜ Approve/reject observer resource suggestions (API exists, UI pending)

### Edit Mode (Draft State Only)

**Editable Fields**:

| Field | Component | Auto-Save | Debounce |
|-------|-----------|-----------|----------|
| **Title** | ProblemHeader with inline EditableField | Yes | 300ms |
| **Description** | EditableField (textarea) | Yes | 300ms |
| **Acceptance Criteria** | EditableField (textarea) | Yes | 300ms |
| **Classification** | Dropdown (select) | Yes | Immediate |
| **Direct Resources** | List with add/edit/delete | Per-item | Immediate |
| **Helpful Artifacts** | List with add/edit/delete | Per-item | Immediate |

**Visual Feedback**: Border color changes (idle → saving → saved → error)
**API**: PATCH `/api/problems/[problemId]/versions/[versionId]`
**Source**: `EditableField.svelte`, `ProblemHeader.svelte:30-76`

### Submission Controls

**POActionBar Component** (sticky bottom, draft mode):
```
┌──────────────────────────────────────────────┐
│                    [Submit Problem] →        │
└──────────────────────────────────────────────┘
```

**POActionBar Component** (sticky bottom, submitted/ready modes):
```
┌──────────────────────────────────────────────┐
│           [Modify Problem]  [Clone Problem]  │
└──────────────────────────────────────────────┘
```

**Button Actions**:
| Button | State | Action | Confirmation |
|--------|-------|--------|--------------|
| **Submit Problem** | Draft only | POST `/api/problems/[id]/submit` | ConfirmDialog |
| **Modify Problem** | Submitted/Ready | POST `/api/problems/[id]/versions` | ConfirmDialog ("Creates new version") |
| **Clone Problem** | Any | POST `/api/problems/[id]/clone` | ConfirmDialog ("Creates independent copy") |
| **Archive Problem** | Any (future) | PATCH with archived flag | ConfirmDialog |

**Source**: `POActionBar.svelte:1-55`, Ch.13.2

### Deputy Assignment (NOT YET IMPLEMENTED)

**UI**: Dropdown or autocomplete search for users
**Location**: Below header, above description (or in expandable "Settings" panel)
**API**: POST `/api/problems/[id]/deputy` with `deputy_user_id`
**Permissions**: Only PO can assign/change deputy

**Source**: Ch.13.3, User Story P9

### Resource Management (PARTIALLY IMPLEMENTED)

**Direct Resources List**:
- Display: Clickable links with labels
- PO Actions: [+ Add], [Edit], [Delete] per item
- API: POST/PATCH/DELETE `/api/problems/[id]/resources`

**Helpful Artifacts List**:
- Same as Direct Resources

**Observer Suggestions (NOT YET IMPLEMENTED)**:
- Observers see [+ Suggest Resource] button
- Suggestions show as pending in PO view
- PO can [Approve] or [Reject]
- Approved resources move to main list

**Source**: Ch.13.2, User Stories P10, P11, U16

### Assessment Grid Access

**Self-Rate Button**: Always enabled for PO (can self-assess anytime)
**Rate Pitch**: Enabled when pitch assessment is open
**Rate Review**: Enabled when review assessment is open

**Source**: `AssessmentLinks.svelte:1-129`, Ch.13.1

---

## PERSPECTIVE 2: Observer

### What Observers See

**Read-Only Content**:
- ✅ Classification badge (prominent, top)
- ✅ Problem title, description, acceptance criteria
- ✅ Direct resources and helpful artifacts (as clickable links)
- ✅ Current readiness and action states
- ✅ Version information
- ✅ Decision history timeline
- ⬜ Lessons learned log (read-only, can add new lessons)
- ⬜ Team section (view team members, breakout URL)
- ⬜ Team chat (read-only unless on team)

**Interactive Elements (Conditional)**:
- ✅ Rate Pitch button (when pitch assessment is open)
- ✅ Rate Review button (when review assessment is open)
- ✅ View Results links (for completed assessments)
- ⬜ [Join as Dev] button (when problem is selected_for_coding and event is live)
- ⬜ [+ Suggest Resource] (authenticated observers)
- ⬜ [+ Add Lesson Learned] (authenticated observers)
- ⬜ Chat reactions (emoji reactions on messages)

**Hidden Elements**:
- ❌ Edit controls (no auto-save fields)
- ❌ Submission controls (Submit, Modify, Clone buttons)
- ❌ Resource management (Add/Edit/Delete)
- ❌ Moderator decision buttons
- ❌ Self-Rate button (PO only)

### Join Team Flow (NOT YET IMPLEMENTED)

**Button Visibility**:
```typescript
const canJoinTeam = (
  isAuthenticated &&
  !isActiveMember &&
  problem.action_state === 'selected_for_coding' &&
  event.isLive
);
```

**Visual**:
```
┌────────────────────────────────┐
│ Team                           │
│                                │
│ • Max Mustermann (PO)         │
│ • Eva Schmidt                 │
│                                │
│ [Join as Dev] ←                │
└────────────────────────────────┘
```

**Action**: POST `/api/problems/[id]/team/join`
**Effect**:
- Creates team if none exists
- Adds user as `member_role='coder'`, `status='active'`
- Posts system message in chat: "— {timestamp} {User} joined —"
- Refreshes page to show team controls

**Source**: Ch.31.7, Ch.13.1, User Story U9

### Resource Suggestions (NOT YET IMPLEMENTED)

**Button**: [+ Suggest Resource]
**Modal**: Form with fields:
- Resource type: Direct / Helpful
- Label: Text input
- URL: URL input
- Description (optional): Textarea

**Submission**: POST `/api/problems/[id]/resources/suggest`
**Pending State**: Observer sees "Pending approval" badge
**PO View**: Shows suggestion with [Approve] [Reject] buttons

**Source**: Ch.13.2, User Story U16

---

## PERSPECTIVE 3: Moderator / Admin

### What Moderators See (Additional)

**Decision Control Panel** (NOT YET IMPLEMENTED):

Displayed as persistent panel or expandable section at bottom of Problem Card.

**Quality Gate Decisions**:
```
┌────────────────────────────────────────────┐
│ Moderator Actions                          │
│                                            │
│ Quality Gate:                              │
│ [Accept] [Request Changes] [Reject]        │
└────────────────────────────────────────────┘
```

**Event Planning Decisions**:
```
Event Planning:
[Select for Event] [Deselect from Event]

Deferral:
[Defer: PO Absent] [Defer: Low Priority] [Defer: Too Complex]
[Defer: Skipped] [Defer: Needs Refinement] [Defer: Future Capability]

Drop:
[Drop: Low Relevance] [Drop: Low Quality]
```

**Sprint Planning Decisions**:
```
Sprint:
[Select for Coding] [Deselect from Coding]

Close:
[Close: Complete] [Close: Partial]
```

**Live Assessment Controls**:
```
Live Assessments:
[Open Pitch] [Close Pitch]
[Open Review] [Close Review]
```

**Decision Button Colors** (Ch.17.8.3):
| Category | Color | Buttons |
|----------|-------|---------|
| Quality Gate | Blue | Accept, Request Changes, Reject |
| Event Planning | Green | Select for Event, Deselect |
| Sprint Planning | Teal/Purple | Select for Coding, Deselect |
| Deferral | Yellow | All deferred_* variants |
| Drop | Red | dropped_low_relevance, dropped_low_quality |
| Close | Purple | closed_complete, closed_partial |
| Live | Orange | Open/close pitch/review |

### Chat Moderation

**Moderator Message Styling**:
- Background: `bg-primary/5` (light blue tint)
- Badge: "Moderator" pill, `bg-primary/10 text-primary`
- Name color: `text-primary` (distinct)

**Delete Message Action**:
- [×] icon or [Delete] link on hover
- Soft delete: Sets `visible=FALSE`
- Shows placeholder: "Message deleted" in grey italic
- Available to moderator on any message

**Source**: Ch.31.6, User Story M26

### Flag Lessons as Valuable

**UI**: Star icon or [★ Flag as Valuable] toggle on lesson cards
**Visibility**: Moderators see toggle on all lessons
**Effect**: Sets `valuable=TRUE`, surfaces lesson to other locations
**Visual**: Flagged lessons show gold star badge

**Source**: Ch.13.1, Ch.32.5, User Story M25

### Star Awards (NOT YET IMPLEMENTED)

**When Shown**: After review assessment closes
**Location**: Expandable panel or modal

**UI**:
```
┌───────────────────────────────────────────────┐
│ Star Awards: API Rate Limiter                 │
│                                               │
│ Review Scores (weighted):                     │
│ 1. Team Max (4.2)    ⭐⭐⭐  [1st Place]      │
│ 2. Team Lisa (3.8)   ⭐⭐    [2nd Place]      │
│ 3. Team Anna (3.5)   ⭐      [3rd Place]      │
│                                               │
│           [Confirm Awards] [Adjust Rankings]  │
└───────────────────────────────────────────────┘
```

**Source**: Ch.17.9.1, Ch.33.6.4, User Story M19

### Moderator Role Conversion

**Special Rule**: If moderator clicks "Join as Dev":
- Added as coder to `problem_team_members`
- **Loses moderator powers for THIS problem only**
- Decision control panel hidden
- Retains global moderator role for other problems

**Implementation**: Check `problem_team_members` for user + problem:
```typescript
const isMemberOfThisProblem = teamMembers.some(
  m => m.user_id === currentUser.id && m.member_role === 'coder'
);

const effectiveRole = isMemberOfThisProblem ? 'developer' : currentUser.role;
```

**Source**: Ch.12.5, Ch.31.7

---

## Complete Component Hierarchy (All Perspectives)

```
PageContainer (three-layer depth)
└─ ProblemCard
   ├─ {#if isOwnerViewingDraft}
   │  └─ PrivateWarningBanner ("You are the Problem Owner")
   │
   ├─ {#if isOwnerAndDraft}
   │  └─ BestPracticesLink
   │
   ├─ {#if isArchiveView}
   │  └─ HistoryWarningBanner ("History View - Contribution blocked")
   │
   ├─ VersionNav (dropdown + archive banner)
   │  ├─ Version pill buttons (v1.00, v2.00, ●v3.00)
   │  └─ {#if isArchiveView}
   │     └─ Warning banner with [Revert to current version]
   │
   ├─ ClassificationBadge (prominent, top) ⬜ NOT YET IMPLEMENTED
   │  └─ "Greenfield" | "Brownfield" | ...
   │
   ├─ ProblemHeader
   │  ├─ {#if isOwnerAndDraft}
   │  │  └─ EditableField[title] (auto-save)
   │  ├─ {#else}
   │  │  └─ Static title text
   │  │
   │  └─ StateIndicators
   │     ├─ StateBadge[readiness] (draft/submitted/needs_changes/ready/rejected)
   │     ├─ StateBadge[action] (backlog/selected_for_event/selected_for_coding/...)
   │     └─ VersionBadge (v2.03)
   │
   ├─ VisualJourneyMap ⬜ NOT YET IMPLEMENTED
   │  ├─ Readiness journey: Draft → Submitted → Ready
   │  └─ Action journey: Backlog → Selected → Coding → Closed
   │
   ├─ NextStepsGuidance (role-specific) ⬜ NOT YET IMPLEMENTED
   │  └─ Contextual actions based on state + role
   │
   ├─ ProblemContent
   │  ├─ {#if isOwnerAndDraft}
   │  │  ├─ EditableField[description] (textarea, auto-save)
   │  │  ├─ EditableField[acceptance_criteria] (textarea, auto-save)
   │  │  └─ EditableField[classification] (select dropdown)
   │  ├─ {#else}
   │  │  ├─ Static description text
   │  │  └─ Static acceptance criteria text
   │  │
   │  ├─ ResourceList[direct] ⬜ PARTIALLY IMPLEMENTED
   │  │  ├─ {#if isOwner}
   │  │  │  └─ [+ Add Direct Resource] → Modal form
   │  │  ├─ {#each resources as resource}
   │  │  │  ├─ Link display
   │  │  │  └─ {#if isOwner} [Edit] [Delete]
   │  │  └─ {#if isOwner && hasSuggestions}
   │  │     └─ Pending suggestions with [Approve] [Reject]
   │  │
   │  └─ ResourceList[helpful] ⬜ PARTIALLY IMPLEMENTED
   │     └─ Same as direct resources
   │
   ├─ Separator
   │
   ├─ AssessmentLinks (2×3 grid)
   │  ├─ Row 1: Rate Buttons
   │  │  ├─ {#if isOwner || flags.canSelfRate}
   │  │  │  └─ [Self-Rate] (always enabled for PO)
   │  │  ├─ {#if flags.canRatePitch}
   │  │  │  └─ [Rate Pitch] (enabled when pitch open)
   │  │  └─ {#if flags.canRateReview}
   │  │     └─ [Rate Review] (enabled when review open)
   │  │
   │  └─ Row 2: View Results Links
   │     ├─ [View Self] ({N} responses)
   │     ├─ [View Pitch] ({N} responses)
   │     └─ [View Review] ({N} responses)
   │
   ├─ Separator
   │
   ├─ LessonsLearnedLog ⬜ NOT YET IMPLEMENTED
   │  ├─ Header: "Lessons Learned" + [+ Add Lesson]
   │  ├─ Filters:
   │  │  ├─ Category dropdown (All, tooling, architecture, ...)
   │  │  ├─ Event dropdown (All, {event 1}, {event 2}, ...)
   │  │  └─ ☑ Valuable only (checkbox)
   │  │
   │  └─ {#each filteredLessons as lesson}
   │     └─ LessonCard
   │        ├─ Category badge
   │        ├─ Date + Author
   │        ├─ Content text
   │        ├─ Tags (#hashtag)
   │        └─ {#if isModerator || isOwner}
   │           └─ [★ Flag as Valuable] (toggle)
   │
   ├─ Separator
   │
   ├─ TeamSection ⬜ NOT YET IMPLEMENTED
   │  ├─ Header: "Team"
   │  ├─ TeamMembersList
   │  │  ├─ Max Mustermann (PO)
   │  │  ├─ Eva Schmidt (PO deputy)
   │  │  ├─ Tom Weber
   │  │  └─ Lisa Chen (retired) ← grey, italic
   │  │
   │  ├─ Breakout Room URL
   │  │  ├─ {#if isTeamMember}
   │  │  │  └─ EditableField (URL input, auto-save)
   │  │  └─ {#else}
   │  │     └─ Clickable link display
   │  │
   │  └─ Team Action Buttons
   │     ├─ {#if !isTeamMember && canJoin}
   │     │  └─ [Join as Dev]
   │     ├─ {#if isActiveMember}
   │     │  └─ [Retire from Team]
   │     └─ {#if isRetiredMember}
   │        └─ [Rejoin Team]
   │
   ├─ Separator
   │
   ├─ TeamChat ⬜ NOT YET IMPLEMENTED
   │  ├─ Header: "Team Chat"
   │  ├─ Filters:
   │  │  ├─ Version toggle: [Current] [All Versions]
   │  │  └─ Quick filters: [All] [Moderator] [PO] [Has URL]
   │  │
   │  ├─ MessageList (scrollable, 4000px max-height)
   │  │  └─ {#each messages as message}
   │  │     ├─ {#if message.is_bot}
   │  │     │  └─ ChatSystemMessage ("— timestamp User joined —")
   │  │     ├─ {#else if message.author_role === 'moderator'}
   │  │     │  └─ ChatMessageModerator (highlighted background, badge)
   │  │     └─ {#else}
   │  │        └─ ChatMessage
   │  │           ├─ Author + Role + Timestamp
   │  │           ├─ Content (with @mentions highlighted)
   │  │           ├─ {#if message.reply_to}
   │  │           │  └─ Thread indicator (collapsed/expanded)
   │  │           ├─ EmojiReactions (curated 10 emojis, show counts)
   │  │           └─ {#if isModerator}
   │  │              └─ [Delete] action
   │  │
   │  └─ {#if !isArchiveView && isAuthenticated}
   │     └─ ChatInput
   │        ├─ Textarea (2000 char limit)
   │        └─ [Send] button
   │
   ├─ Separator
   │
   ├─ DecisionTimeline
   │  └─ {#each decisionsGroupedByDate as group}
   │     ├─ Date header (Feb 3, 2026)
   │     └─ {#each group.decisions as decision}
   │        └─ DecisionEntry
   │           ├─ Category-colored left border
   │           ├─ Decision type + actor
   │           └─ {#if decision.rationale}
   │              └─ Rationale text (quoted)
   │
   └─ {#if isOwner}
      └─ POActionBar (sticky bottom)
         └─ [Submit] | [Modify] [Clone]
```

### Moderator Decision Buttons

Decision buttons use the **`DecisionAccordion` component** specified in `moderator_dashboard_design.md` §Decision Accordion. The same 7-category accordion, color scheme, comment requirements, and state-dependent availability rules apply (see §Decision Availability Rules in that document).

**Wrapper**: `ModeratorControlPanel` — wraps `DecisionAccordion` in a `Card` with `CardHeader` title "Moderator Decisions". Receives `problemId`, `currentReadinessState`, `currentActionState` from the page server load. Visible only when `flags.canMakeDecisions = true`.

**Difference from Dashboard**: No problem selector needed (problem is implicit from the route). The accordion receives the problem identity directly from the page context rather than from a queue selection.

**Source**: Ch.10, Ch.12.5; see `moderator_dashboard_design.md` for full accordion specification

### Moderator Chat Controls

**Delete Message**:
- Hover over any message shows [×] or [Delete]
- Click triggers soft delete (no confirmation for moderators)
- Message content replaced with "Message deleted" placeholder

**Distinct Styling**:
- Moderator's own messages: Highlighted background, "Moderator" badge
- Clear visual differentiation from regular users

**Source**: Ch.31.6, User Story M26

---

## Common Component Hierarchy Details

### Classification Badge (NEEDED)

**Location**: Very top of Problem Card, above header
**Size**: `text-lg font-bold`, `px-4 py-2`, `rounded-[--radius-card]`
**Colors** (proposed):
| Type | Background | Text |
|------|-----------|------|
| Explorative | `bg-purple-bg` | `text-purple` |
| Greenfield | `bg-green-100` | `text-success` |
| Advanced Greenfield | `bg-primary/10` | `text-primary` |
| Brownfield | `bg-warning-bg` | `text-warning` |
| Reverse Engineering | `bg-canvas` | `text-headers` |
| Other | `bg-secondary` | `text-labels` |

**Source**: Ch.13.1, Ch.04 (problem_type_catalog)

### Visual Journey Map (NEEDED)

**Purpose**: Help users understand dual-state model

**Layout**:
```
Readiness Journey:
● Draft → ● Submitted → ○ Needs Changes → ● Ready
                                     ↘ ○ Rejected

Action Journey:
● Backlog → ● Selected for Event → ○ Coding → ○ Closed
         ↘ ○ Deferred           ↘ ○ Dropped
```

**Legend**:
- ● Filled circle: Current or past state
- ○ Outline circle: Future state
- Arrows: Possible transitions

**Responsive**: Collapsible on mobile (toggle to expand/collapse)

**Source**: Ch.13.6.1

### State Badges with Tooltips (ENHANCEMENT NEEDED)

**Current**: State badges show state name only
**Needed**: Add tooltip with explanation

**Implementation**:
```svelte
<span
  class="... {readinessColorClasses}"
  title="Quality gate passed! This problem can be pitched."
  role="tooltip"
>
  Ready
</span>
```

**Tooltip Content** (Ch.13.1):
| State | Tooltip Text |
|-------|-------------|
| Draft | "Problem is being authored. Only the PO can see it." |
| Submitted | "Submitted for review. Moderators will evaluate." |
| Needs Changes | "Feedback received. PO should update and resubmit." |
| Ready | "Quality gate passed! This problem can be pitched." |
| Rejected | "Did not pass quality review. Consider major revision." |
| Backlog | "Available for future events. Not yet selected." |
| Selected for Event | "Planned for an upcoming event." |
| Selected for Coding | "Currently being worked on!" |
| Deferred | "Postponed. See decision history for reason." |
| Dropped | "Removed from consideration." |
| Closed | "Completed! No further action needed." |

**Source**: Ch.13.1, Ch.13.6.2

### Assessment Links Grid (EXISTING)

**File**: `AssessmentLinks.svelte:1-129`

**Layout**: 2×3 grid, responsive

**Desktop**:
```
┌──────────────┬──────────────┬──────────────┐
│ Self-Rate    │ Rate Pitch   │ Rate Review  │
├──────────────┼──────────────┼──────────────┤
│ View Self    │ View Pitch   │ View Review  │
│ 1 response   │ 12 responses │ 8 responses  │
└──────────────┴──────────────┴──────────────┘
```

**Mobile**: Stacked cards, one per assessment type

**Button States**:
- Enabled: Full opacity, `bg-primary`, clickable
- Disabled: `opacity-50`, `bg-secondary`, tooltip explains why

**Source**: Ch.13.1, existing implementation

### Decision Timeline (EXISTING)

**File**: `DecisionTimeline.svelte:1-94`

**Layout**: Chronological, grouped by date

**Visual**:
```
Decision History
────────────────
Feb 3, 2026
  ● Problem created (Max Mustermann)
  ● Problem submitted (Max Mustermann)

Feb 5, 2026
  ● Quality gate needs changes (Eva Schmidt, moderator)
    "Please add acceptance criteria"
```

**Category Colors** (left border):
- Creation: `border-primary`
- Quality Gate: `border-primary`
- Event Planning: `border-success`
- Sprint Planning: `border-purple`
- Deferral: `border-pending`
- Drop: `border-alert`
- Close: `border-purple`
- Live: `border-warning`

**Source**: Ch.13.6.4, Ch.10

---

## API Integration

### Server Load Function

**File**: `problem/[slug]/+page.server.ts`

**Load Logic**:
```typescript
export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { slug } = params;
  const versionParam = url.searchParams.get('version');

  // Load problem with specified or latest version
  const problem = await problemRepository.getBySlug(slug, versionParam);

  // Compute visibility flags based on user role
  const flags = computeVisibilityFlags(problem, locals.user);

  return { problem, flags };
};
```

**Flags Object**:
```typescript
interface VisibilityFlags {
  isOwner: boolean;
  isDeputy: boolean;
  isTeamMember: boolean;
  isRetiredMember: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  canEdit: boolean;              // isOwner && readiness === 'draft'
  canSubmit: boolean;            // isOwner && readiness === 'draft'
  canModify: boolean;            // isOwner && readiness !== 'draft'
  canSelfRate: boolean;          // isOwner
  canRatePitch: boolean;         // pitch_assessment.is_open
  canRateReview: boolean;        // review_assessment.is_open
  canJoinTeam: boolean;          // !isMember && action === 'selected_for_coding' && event.isLive
  canRetire: boolean;            // isActiveMember
  canRejoin: boolean;            // isRetiredMember
  canMakeDecisions: boolean;     // isModerator && !isTeamMember
  canEditBreakout: boolean;      // isTeamMember
  isArchiveView: boolean;        // viewing old version
}
```

**Source**: `problem/[slug]/+page.server.ts:1-137`

### Problem Data Endpoints

**Primary Load**: GET `/api/problems/[slug]?version={N}`
**Auto-Save**: PATCH `/api/problems/[id]/versions/[versionId]`
**Submit**: POST `/api/problems/[id]/submit`
**Modify**: POST `/api/problems/[id]/versions`
**Clone**: POST `/api/problems/[id]/clone`
**Resources**: POST/PATCH/DELETE `/api/problems/[id]/resources`
**Team Join**: POST `/api/problems/[id]/team/join`
**Team Retire**: POST `/api/problems/[id]/team/retire`
**Team Rejoin**: POST `/api/problems/[id]/team/rejoin`
**Chat**: GET/POST `/api/problems/[id]/chat`
**Lessons**: POST `/api/problems/[id]/lessons`
**Decisions**: POST `/api/decisions` (with problem_id)

---

## Role-Based Visibility Matrix

| Component | Observer | PO (own) | PO (other) | Team Member | Moderator* | Admin* |
|-----------|----------|----------|------------|-------------|-----------|-------|
| Classification Badge | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Title (editable) | — | Draft only | — | — | — | — |
| Title (static) | ✓ | Submitted+ | ✓ | ✓ | ✓ | ✓ |
| State Badges | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Visual Journey Map | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Next Steps Guidance | ✓ | ✓ (PO variant) | ✓ | ✓ | ✓ (Mod variant) | ✓ |
| Description (editable) | — | Draft only | — | — | — | — |
| Description (static) | ✓ | Submitted+ | ✓ | ✓ | ✓ | ✓ |
| Resources (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Resources (add/edit) | — | ✓ | — | ✓ | — | — |
| Suggest Resource | ✓ (auth) | — | ✓ (auth) | — | ✓ (auth) | ✓ (auth) |
| Self-Rate | — | ✓ | — | — | — | — |
| Rate Pitch | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional |
| Rate Review | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional |
| View Results | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lessons (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Lesson | ✓ (auth) | ✓ | ✓ (auth) | ✓ | ✓ | ✓ |
| Flag Valuable | — | ✓ | — | — | ✓ | ✓ |
| Team List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Breakout URL (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Breakout URL (edit) | — | — | — | ✓ | — | — |
| Join as Dev | Conditional | — | Conditional | — | Conditional** | Conditional** |
| Retire from Team | — | — | — | ✓ (active) | — | — |
| Rejoin Team | — | — | — | ✓ (retired) | — | — |
| Chat (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chat (post) | ✓ (if member) | ✓ | ✓ (if member) | ✓ | ✓ | ✓ |
| Chat (delete) | — | — | — | — | ✓ | ✓ |
| Decision Timeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Decision Buttons | — | — | — | — | ✓ | ✓ |
| Submit/Modify/Clone | — | ✓ | — | — | — | — |

*Moderators/Admins who join as Dev lose decision powers for that problem
**Moderator/Admin clicking Join converts them to developer for this problem

**Source**: Ch.12.5 (Role-Conditional Control Visibility), `+page.server.ts`

---

## State Transitions & Effects

### Problem Owner State Transitions

```
DRAFT
  ├─ [Submit] → SUBMITTED
  └─ [Archive] → CLOSED (future)

SUBMITTED
  ├─ [Moderator: Accept] → READY
  ├─ [Moderator: Request Changes] → NEEDS_CHANGES
  ├─ [Moderator: Reject] → REJECTED
  └─ [Modify] → New version created → DRAFT

NEEDS_CHANGES
  ├─ [Modify] → New version → DRAFT
  └─ [Resubmit] → SUBMITTED (same version)

READY
  ├─ [Modify] → New version → DRAFT
  └─ [Moderator: Select for Event] → READY + SELECTED_FOR_EVENT

REJECTED
  └─ [Modify] → New version → DRAFT
```

### Moderator Action State Transitions

```
BACKLOG
  ├─ [Select for Event] → SELECTED_FOR_EVENT
  ├─ [Defer: Reason] → DEFERRED
  └─ [Drop: Reason] → DROPPED

SELECTED_FOR_EVENT
  ├─ [Deselect] → BACKLOG
  ├─ [Select for Coding] → SELECTED_FOR_CODING
  ├─ [Defer: Reason] → DEFERRED
  └─ [Drop: Reason] → DROPPED

SELECTED_FOR_CODING
  ├─ [Deselect from Coding] → SELECTED_FOR_EVENT
  ├─ [Close: Complete] → CLOSED
  ├─ [Close: Partial] → CLOSED
  └─ [Drop: Reason] → DROPPED

DEFERRED
  ├─ [Select for Event] → SELECTED_FOR_EVENT
  └─ [Drop: Reason] → DROPPED

DROPPED
  └─ (Terminal state, no transitions)

CLOSED
  └─ (Terminal state, no transitions)
```

**Source**: Ch.27 (Problem Transitions), Ch.10

---

## Responsive Behavior

### Mobile (<640px)

**Layout**:
- All sections stacked vertically
- Full-width cards
- AssessmentLinks: 3×2 grid (3 rows, 2 columns: Rate | View)
- TeamMembersList: Vertical list, full names
- Chat: Full-width, scrollable
- POActionBar: Sticky bottom, full-width buttons

### Desktop (>=768px)

**Layout**:
- Content max-width: `max-w-4xl` or `max-w-5xl`
- AssessmentLinks: 2×3 grid (2 rows, 3 columns)
- TeamMembersList: Horizontal flex or grid
- Chat: Fixed height panel
- POActionBar: Sticky bottom, right-aligned buttons

---

## Accessibility Compliance

### Keyboard Navigation

**Page-Level**:
- Tab: Navigate through all interactive elements
- Skip links: "Skip to content", "Skip to chat" (future)

**Component-Level**:
- Edit fields: Standard input keyboard behavior
- Assessment buttons: Navigate to `/assess/[id]` (standard link)
- Team buttons: Space/Enter activate
- Decision buttons: Space/Enter activate
- Chat input: Standard textarea behavior

### ARIA Landmarks

```svelte
<article role="article" aria-labelledby="problem-title">
  <header role="banner">
    <h1 id="problem-title">{problem.title}</h1>
  </header>

  <section aria-labelledby="description-heading">
    <h2 id="description-heading">Description</h2>
    ...
  </section>

  <section aria-labelledby="team-heading">
    <h2 id="team-heading">Team</h2>
    ...
  </section>

  <section role="complementary" aria-label="Team chat">
    ...
  </section>
</article>
```

### Screen Reader Announcements

**State Changes**:
- Add `aria-live="polite"` region for state badge updates
- Announce: "Problem state changed to Ready"

**Team Changes**:
- System messages in chat serve as announcements
- "Eva joined the team" visible to screen readers

---

## Performance Considerations

### Data Loading Strategy

**Server Load**:
- Single query loads problem + version + assessments + team + chat (initial 20 messages)
- Computed flags on server (reduces client logic)

**Client Polling** (Ch.31.9):
- Active event: Poll chat every 3 seconds
- No active event: Poll every 10 seconds
- Tab not visible: Pause or 30 seconds

**Chat Message Limit**:
- Initial: Load 20 most recent messages
- Scroll to load more: Fetch older messages in batches of 20
- Max height: 4000px (~50 messages typical)

### Optimistic Updates

**Auto-save fields**: Show "Saving..." immediately, confirm on server response
**Chat posting**: Show message immediately, confirm/reorder on server response
**Team actions**: Update UI immediately, roll back on error

---

## Visual Design Details

### Three-Layer Depth (Full Stack)

**Viewport** (#DCEBFF):
```
<body class="bg-viewport">
```

**Canvas** (#F1F2F8):
```
<div class="bg-canvas max-w-5xl mx-auto rounded-[--radius-card-lg] shadow-[--shadow-canvas]">
```

**Content Sections** (#FEFEFE):
```
<Card elevation="resting">
  <ProblemHeader />
  <ProblemContent />
</Card>

<Separator />

<Card elevation="resting">
  <AssessmentLinks />
</Card>

<Separator />

<Card elevation="resting">
  <LessonsLearnedLog />
</Card>
```

**Dialogs** (Floating above all):
```
<ConfirmDialog elevation="floating">
  Confirmation content
</ConfirmDialog>
```

### Section Spacing

**Between Cards**: `space-y-4` (16px) or `space-y-6` (24px)
**Within Cards**: Sections separated by Separator component (etched 3D groove)

### Sticky Action Bar

**POActionBar** (owner view):
- `fixed bottom-0` or `sticky bottom-0`
- Full-width, slight shadow above
- Background: `bg-card` to match content
- Z-index: `z-10` to stay above content during scroll

---

## Implementation Notes

### Flags-Based Visibility Pattern

**Core Pattern**: Server computes `flags` object, client uses for conditional rendering

```svelte
{#if flags.canEdit}
  <EditableField ... />
{:else}
  <p>{staticText}</p>
{/if}

{#if flags.canMakeDecisions}
  <ModeratorControlPanel ... />
{/if}
```

This pattern:
- ✅ Simplifies client logic
- ✅ Single source of truth (server)
- ✅ Prevents client-side bypasses
- ✅ Scales to complex role combinations

**Source**: `+page.server.ts:90-137`

### Version-Scoped Team Membership

**Rule**: Team membership is tied to `problem_version_id`

**Effect**: When PO creates new major version:
1. PO/Deputy automatically added to new version
2. Coders **not** automatically added (must rejoin)
3. Chat history preserved across versions
4. System message posted: "— PO created version 2.00, offboarding all coders —"

**UI Impact**:
- Version filter in chat defaults to "Current version"
- Historical versions show old team composition
- "Join as Dev" button reappears for previous team members

**Source**: Ch.31.7.2, Ch.13.5

### Chat Filtering

**Version Filter** (default: current):
- [Current Version] — `WHERE major_version = {current}`
- [All Versions] — No version filter

**Quick Filters**:
- [All] — No role filter
- [Moderator] — `WHERE author_role = 'moderator'`
- [PO] — `WHERE author_role = 'problem_owner'`
- [Has URL] — `WHERE url_disclosed = TRUE`

**Combination**: Version filter AND quick filter (intersectional)

**Source**: Ch.31.1, Ch.31.8

---

## Future Enhancements (Out of Scope)

### Social Presence Indicators (Ch.31.16)

**Team Online Status**:
```
● Eva Schmidt (PO)        — online
● Max Mustermann         — online
○ Lisa Chen              — last seen 2h ago
```

**Currently Viewing**:
```
👁️ 3 others viewing: Eva, Max, Tom
```

**Implementation**: Heartbeat mechanism (15s interval) + presence cache

### Search Within Chat

**UI**: Search input at top of chat panel
**Behavior**: Filter messages by keyword
**Highlight**: Matched terms in message content

### Thread View (Enhanced)

**Current**: Collapsed threads show "3 replies"
**Enhanced**:
- Expand to show full thread tree
- Indent nested replies
- Visual thread lines connecting messages

---

## Testing Checklist

### Functional Tests (All Perspectives)

**Problem Owner**:
- [ ] Can edit fields in draft mode
- [ ] Auto-save triggers and shows feedback
- [ ] Can submit problem (transitions to submitted)
- [ ] Can modify problem (creates new version)
- [ ] Can clone problem (independent copy)
- [ ] Self-rate button always enabled

**Observer**:
- [ ] Cannot edit any fields
- [ ] Can view all content
- [ ] Can rate when assessments open
- [ ] Can join team when coding active
- [ ] Can suggest resources (future)
- [ ] Can add lessons learned

**Moderator**:
- [ ] Decision buttons visible and functional
- [ ] Single-click decisions logged
- [ ] State updates immediately
- [ ] Can delete any chat message
- [ ] Can flag lessons as valuable
- [ ] Loses mod powers when joining team

### Accessibility Tests
- [ ] All sections keyboard navigable
- [ ] State badges have tooltips
- [ ] Decision buttons keyboard accessible
- [ ] Chat input keyboard accessible
- [ ] Focus management correct
- [ ] ARIA landmarks present

---

## Templates Used (Summary)

| Template | Usage Count | Notes |
|----------|-------------|-------|
| **Card** | 6+ | All major sections wrapped in cards |
| **Separator** | 5+ | Between major sections |
| **Button** | 10+ | All actions (submit, modify, join, etc.) |
| **EditableField** | 3 | Title, description, acceptance criteria (draft) |
| **StateIndicators** | 1 | Readiness + action badges |
| **VersionNav** | 1 | Version selector + archive warning |
| **AssessmentLinks** | 1 | 2×3 assessment grid |
| **DecisionTimeline** | 1 | Decision history |
| **ConfirmDialog** | 3+ | Submit, Modify, Clone confirmations |
| **ClassificationBadge** | 1 | Problem type (needed) |
| **VisualJourneyMap** | 1 | Dual-state visualization (needed) |
| **NextStepsGuidance** | 1 | Role-specific actions (needed) |
| **LessonsLearnedLog** | 1 | Lessons panel (needed) |
| **LessonCard** | N | Per lesson (needed) |
| **TeamSection** | 1 | Team panel (needed) |
| **TeamMemberList** | 1 | Member roster (needed) |
| **ChatPanel** | 1 | Chat interface (needed) |
| **ChatMessage** | N | Per message (needed) |
| **ChatSystemMessage** | N | Per system event (needed) |
| **ResourceList** | 2 | Direct + helpful (partial) |
| **ModeratorControlPanel** | 1 | Card wrapper around DecisionAccordion (see moderator_dashboard_design.md) |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-04
**Status**: Partially Implemented (header, states, version, assessment links, decision timeline) + Specification Complete (all 3 perspectives documented)
