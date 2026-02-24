# 25. Specification Addendum: Interview Findings

This addendum captures functional and non-functional requirements clarified through structured interview on 2026-01-28. These findings refine, extend, or override the base specification (Chapters 00-24).

---

## Problem Statement

The base specification (25 chapters) provides comprehensive conceptual architecture but leaves certain operational behaviors, failure modes, and implementation constraints underspecified. With the first event in ~2 days, these gaps could cause implementation ambiguity or runtime failures.

## Objective

Produce a clear, implementation-ready addendum that:
- Resolves ambiguities in failure handling and edge cases
- Specifies non-functional requirements (latency, recovery, backup)
- Captures technology stack decisions
- Documents schema refinements needed

## Success Criteria

- [ ] All 20 interview questions resolved with clear answers
- [ ] Schema changes identified and documented
- [ ] Tech stack specified
- [ ] Document suitable for handoff to implementation agent

---

## Interview Record

### Theme 1: Failure Handling & Graceful Degradation

**Q: What happens if GitHub API is unavailable when resolving commit hash for assessment?**
A: Proceed without minor version. Assessment stored with NULL minor_version; graceful degradation.

**Q: If a Moderator account is compromised and malicious binding decisions are made, what's the recovery?**
A: Decisions are irrevocable. Append-only is absolute. Recovery via new "reversal" decisions only; original preserved for audit.

**Q: If email delivery fails for notification emails?**
A: No recovery path. User's responsibility to provide correct email during registration. Email can be updated in account settings.

**Q: If participant clears browser storage mid-event, losing session identity?**
A: Accept data loss. Statistical pairing is nice-to-have; losing some pairs is acceptable.

### Theme 2: Performance & Operational Constraints

**Q: Latency target for assessment submission during live pitch (50 concurrent users)?**
A: Best effort. No specific latency requirement; eventual consistency sufficient.

**Q: Backup strategy for SQLite during first event?**
A: Manual file copy before event starts. Accept data loss risk for MVP; improve later.

### Theme 3: Data Model & Schema

**Q: PostgreSQL enums vs VARCHAR for decision_type, readiness_state, etc.?**
A: **VARCHAR + FK reference tables**. Matches Item Key pattern; avoids migration overhead for new enum values.

[Research note: SQLite has no native enum support; VARCHAR+FK works identically on both databases]

**Q: Responses table UNIQUE constraint conflicts with "revisions allowed while assessment open". How to handle?**
A: **INSERT + supersede model**. New row inserted; previous row marked superseded via `superseded_at` timestamp. Both preserved.

**Schema change required in Ch.19.2.11:**
```sql
-- Remove: UNIQUE (assessment_id, item_id, session_id)
-- Add: superseded_at TIMESTAMP nullable
-- Add: superseded_by_response_id UUID nullable FK → responses
-- Current response: WHERE superseded_at IS NULL
```

**Q: Minimum N for displaying aggregated statistics?**
A: Always show all stats with N displayed. User interprets validity. No hiding based on sample size.

**Q: Scale sizes (Ch.7.3 specifies 1,2,3,5,7,10). Can new sizes be added?**
A: **Yes, extensible**. Add new max_rating values as needed. UI must be tested for responsive rendering on desktop, mobile, tablet for any new scale size. Current implementation uses sliders for max_rating > 5 (see ItemRow.svelte line 38).

### Theme 4: Behavioral Rules & Constraints

**Q: What happens if Moderator opens second pitch while one is already open?**
A: **Auto-close previous**. Opening new pitch implicitly closes the current one. Creates `closed_for_pitch_assessment` decision automatically.

**Q: Deferral reasons not in enum (e.g., "legal review pending")?**
A: Use closest match from existing enum + detailed rationale in comment field. No freeform decision types.

**Q: Problem Card content validation on submission?**
A: **Moderator judgment only**. No automated validation; required fields non-empty, URL format valid, no length requirements.

**Q: Who assigns which Inventories are available for event contexts?**
A: **Admin configures globally**. Moderators use system defaults; cannot override per-event.

### Theme 5: Agent Integration

**Q: How do agents authenticate to submit assessments?**
A: **Service account with JWT/token**. Agent has user record with special auth; can act autonomously within non-binding constraints.

### Theme 6: Future Scope (Not for MVP)

**Q: Comparative views for tool comparison (Claude Code vs Cursor)?**
A: Future scope. System captures data; comparison analysis done outside platform for now.

**Q: Tooling capture in database?**
A: Future scope. Agents will mine PR descriptions later. Manual inspection for first event.

---

## Assumption Corrections

| Original Assumption | Who Held It | Source of Correction | Corrected Understanding |
|---------------------|-------------|----------------------|-------------------------|
| PostgreSQL enums for controlled vocabularies | Spec (Ch.19) | Interview + SQLite constraint | VARCHAR + FK reference tables for extensibility |
| Responses are strictly immutable | Claude (from Ch.1.3) | Interview clarification | Responses can be superseded while assessment open; INSERT + mark model |
| Moderator Dashboard needs presentation mode | Claude | Interview clarification | Auth-based button visibility is sufficient; no separate mode needed |

---

## Schema Refinements Required

### 25.1 Replace Enums with Reference Tables

Create catalog tables for controlled vocabularies:

```sql
CREATE TABLE decision_type_catalog (
  type_key VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  category VARCHAR, -- e.g., 'readiness', 'action', 'assessment'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE readiness_state_catalog (
  state_key VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE action_state_catalog (
  state_key VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE time_context_catalog (
  context_key VARCHAR PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL
);
```

### 25.2 Responses Table Revision

Replace the UNIQUE constraint with supersession tracking:

```sql
-- Ch.19.2.11 responses table update
ALTER TABLE responses
  DROP CONSTRAINT responses_assessment_item_session_unique;

ALTER TABLE responses
  ADD COLUMN superseded_at TIMESTAMP,
  ADD COLUMN superseded_by_response_id UUID REFERENCES responses(response_id);

-- Current response query pattern:
-- SELECT * FROM responses
-- WHERE assessment_id = ? AND item_id = ? AND session_id = ?
-- AND superseded_at IS NULL;
```

### 25.3 Scale Size Extensibility

The `items.max_rating` column should accept any positive integer, not be constrained to specific values. Validation moves to application layer with configurable allowed values.

---

## Open Questions

- [ ] **Andreas server Node.js version**: Does the webserver support Node.js 18+ for Next.js 14?
  - Fallback: Use static export mode if Node.js unavailable

---

## 25.4 Error Prevention and Recovery Patterns

The platform should handle errors gracefully, guiding users toward resolution rather than leaving them stranded.

### 25.4.1 Graceful Degradation Messages

When errors occur, show **user-facing guidance**, not technical errors:

| Error Type | User-Facing Message |
|------------|---------------------|
| GitHub API unavailable | "Repository status couldn't be verified. Your submission is saved — we'll check the repo later." |
| Email delivery failed | "We couldn't send the email. Please check your email address in settings." |
| Assessment closed during submission | "The assessment just closed. Your response couldn't be recorded — the moderator may reopen it." |
| Network error during save | "Connection lost. We'll retry automatically when you're back online." |
| Session expired | "Your session expired. Please log in again to continue." |

### 25.4.2 Draft Auto-Save and Recovery

For long-form content (problem descriptions, lessons learned), implement auto-save:

**Auto-Save Behavior:**
- Save draft every 30 seconds while user is editing
- Save on blur (when user clicks away)
- Save before navigation (with confirmation if unsaved)

**Recovery Prompt:**
```
Welcome back!

We found an unsaved draft for "API Rate Limiter"
Last edited: 2 minutes ago

[Restore draft] [Discard draft]
```

**Implementation:**
- Store drafts in localStorage (client-side)
- Expire drafts after 7 days
- Clear draft on successful submission

### 25.4.3 Confirmation Dialogs

For destructive or significant actions, require confirmation:

| Action | Confirmation Dialog |
|--------|---------------------|
| Delete problem | "Delete '{Title}'? This cannot be undone. All versions, chat, and assessments will be lost." |
| Retire from team | "Leave this team? You can rejoin later, but you'll need to re-accept the challenge." |
| Drop problem | "Drop '{Title}' from consideration? It will be marked as dropped and won't be selected for future events." |
| Reject problem | "Reject '{Title}'? The Problem Owner will be notified. Consider 'Request Changes' instead if refinement is possible." |

**Design:**
- Confirmation dialogs are modal (block other actions)
- Destructive action button is visually distinct (red)
- Include "Cancel" as the default/safe option
- Don't show for reversible actions (selecting, deselecting)

### 25.4.4 Proactive Validation Patterns

Catch errors before submission:

**Problem Submission:**
```
Pre-Submission Check
────────────────────
✓ Title is clear and concise
✓ Description explains the challenge
⚠️ Repository URL: returns 404 — is it public?
✓ At least one acceptance criterion defined

[Submit anyway] [Fix issues first]
```

**URL Validation:**
- Check format immediately on input
- Verify accessibility via HEAD request (non-blocking)
- Warn if URL returns error, but allow submission

**Email Validation:**
- Format validation on input
- Domain check (warn if uncommon domain)
- No real-time delivery verification (privacy concern)

### 25.4.5 Error Recovery Flows

When things go wrong, guide users toward resolution:

**Problem rejected:**
```
Your problem was rejected
─────────────────────────

Moderator feedback:
"The problem description doesn't clearly explain what needs to be built.
 Consider adding specific acceptance criteria."

Options:
• [Create new version] — Revise and resubmit
• [Clone as new problem] — Start fresh with a new problem
• [Contact moderator] — Ask questions in chat
```

**Assessment failed to save:**
```
Oops! We couldn't save your response
────────────────────────────────────

What happened:
The assessment closed while you were responding.

Your responses were:
• Clarity: 4/5
• Complexity: 3/5
(saved locally)

Options:
• [Copy to clipboard] — Save your responses for later
• Ask the moderator to reopen the assessment
```

### 25.4.6 Offline Support (Future Direction)

**Not MVP scope**, but captured for future:
- Service worker for offline access to problem cards
- Queue submissions when offline, sync when online
- "Offline mode" indicator in header

---

## Relationship to Base Specification

This addendum **refines** but does not contradict Chapter 1 (Purpose, Scope, Design Principles). Key alignments:

- Graceful degradation (GitHub unavailable) aligns with "Human-Centered First"
- INSERT + supersede preserves "Immutability over Mutation" (no data deleted)
- Accept data loss for session aligns with "Minimal Trust, Maximum Traceability" (we trace what we can)
- VARCHAR + FK aligns with "Future-proofing" principle from Ch.19.1
- Error prevention aligns with "Human-Centered First" (reduce cognitive load)

**Ch.19 (Data Model) requires updates** to reflect:
- Reference table pattern for enums
- Responses supersession model
- Scale size extensibility

**Related Chapters:**
- **Chapter 13**: Problem Card includes validation feedback
- **Chapter 32**: First-time user flows include error guidance
- **Chapter 33**: Error recovery framed as encouragement, not judgment

---

## 25.5 Template & Mobile Design Session (2026-02-05)

**Context**: Following initial implementation by 7 Opus agents, design session resolved 24 template decisions and reinforced mobile-first requirements.

### Decisions Made

**Dialog System** (3 types):
- ConfirmDialog: Yes/no decisions (existing)
- FormDialog: Dialogs with form inputs (NEW)
- InfoDialog: Read-only help content (NEW)

**Empty States**: Generic EmptyState component + domain config objects in `lib/config/empty-states.ts`

**Feedback UI**: Toast notification system (corner popups, auto-dismiss) replacing inline success states

**Loading UI**: LoadingSpinner + Skeleton screens (SkeletonCard, SkeletonList, SkeletonText)

**Form Inputs**: shadcn-svelte style components (Select, Checkbox, DatePicker, TimePicker, FileUpload)

**Data Tables**: Responsive (desktop=table, mobile=cards via DataTable component)

**Help System**: Two-tier (Tooltip for hints, InfoPanel for explanations)

**Separators**: Etched 3D separator UN-DEPRECATED for major page sections (not for component-internal use)

**Navigation**: BackButton component for hierarchical navigation

**Filters**: FilterBar (desktop inline, mobile bottom sheet)

**List Actions**: Three-dot ActionMenu (⋮) for per-item actions

**Badge Sizes**: Two sizes (default for states, large for classification)

**Date Formatting**: Utility functions (formatDate, formatTime, formatRelative)

**Chat Style**: Bubble UI (own=right/blue, others=left/white)

**Countdown Timers**: Visual escalation + optional audio (user preference)

**Collapsible Sections**: Problem Card sections collapse on mobile

### Mobile Admin Reinforcement

Session reinforced absolute requirement for smartphone compatibility:
- All admin interfaces must work on 375px viewport
- No "desktop-only" language permitted
- Testing requirement: All admin functions verified on iPhone SE
- Patterns: Vertical scroll, accordion organization, wizard flows, table→card transforms

### Implementation Impact

- 37 new components specified
- 11 new pages created
- 5 utility files added
- 2 store files added
- ~60 lines CSS additions
- All components built by parallel Opus agents following specifications

### Specification Updates Required

This session revealed need for:
- Complete all 18 chapter updates (5 done, 13 pending)
- Create 6 page design documents (0 done, 6 needed)
- Update Template Collection (not done)
- Migrate database schema for audio preferences

See Quality Assurance Report 2026-02-05 for complete issue list and remediation plan.

---

*This addendum captures interview decisions made 2026-01-28 and template design decisions made 2026-02-05. Implementation should treat these as authoritative refinements to the base specification.*
