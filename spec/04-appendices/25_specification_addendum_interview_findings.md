# 25. Specification Addendum: Interview Findings

This addendum captures functional and non-functional requirements clarified through structured interview on 2026-01-28. These findings refine, extend, or override the base specification (Chapters 00-24).

---

## Problem Statement

The base specification (25 chapters) provides comprehensive conceptual architecture but leaves certain operational behaviors, failure modes, and implementation constraints underspecified. With the first meetup in ~2 days, these gaps could cause implementation ambiguity or runtime failures.

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

**Q: If email delivery fails for Problem Owner private URL?**
A: No recovery path. User's responsibility to provide correct email. Clone as workaround if needed.

**Q: If participant clears browser storage mid-meetup, losing session identity?**
A: Accept data loss. Statistical pairing is nice-to-have; losing some pairs is acceptable.

### Theme 2: Performance & Operational Constraints

**Q: Latency target for assessment submission during live pitch (50 concurrent users)?**
A: Best effort. No specific latency requirement; eventual consistency sufficient.

**Q: Backup strategy for SQLite during first meetup?**
A: Manual file copy before meetup starts. Accept data loss risk for MVP; improve later.

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
A: **Yes, extensible**. Add new max_rating values as needed. UI must be tested for responsive rendering on desktop, mobile, tablet for any new scale size.

### Theme 4: Behavioral Rules & Constraints

**Q: What happens if Moderator opens second pitch while one is already open?**
A: **Auto-close previous**. Opening new pitch implicitly closes the current one. Creates `closed_for_pitch_assessment` decision automatically.

**Q: Deferral reasons not in enum (e.g., "legal review pending")?**
A: Use closest match from existing enum + detailed rationale in comment field. No freeform decision types.

**Q: Problem Card content validation on submission?**
A: **Moderator judgment only**. No automated validation; required fields non-empty, URL format valid, no length requirements.

**Q: Who assigns which Inventories are available for meetup contexts?**
A: **Admin configures globally**. Moderators use system defaults; cannot override per-meetup.

### Theme 5: Agent Integration

**Q: How do agents authenticate to submit assessments?**
A: **Service account with JWT/token**. Agent has user record with special auth; can act autonomously within non-binding constraints.

### Theme 6: Future Scope (Not for MVP)

**Q: Comparative views for tool comparison (Claude Code vs Cursor)?**
A: Future scope. System captures data; comparison analysis done outside platform for now.

**Q: Tooling capture in database?**
A: Future scope. Agents will mine PR descriptions later. Manual inspection for first meetup.

---

## Assumption Corrections

| Original Assumption | Who Held It | Source of Correction | Corrected Understanding |
|---------------------|-------------|----------------------|-------------------------|
| PostgreSQL enums for controlled vocabularies | Spec (Ch.19) | Interview + SQLite constraint | VARCHAR + FK reference tables for extensibility |
| Responses are strictly immutable | Claude (from Ch.1.3) | Interview clarification | Responses can be superseded while assessment open; INSERT + mark model |
| Moderator Dashboard needs presentation mode | Claude | Interview clarification | Auth-based button visibility is sufficient; no separate mode needed |

---

## Tech Stack Decision

**Decision: Next.js 14 (App Router) + shadcn/ui + Drizzle ORM**

**Rationale:**
- shadcn/ui has excellent responsive form components (RadioGroup, Slider) for survey rendering
- Drizzle ORM works with both SQLite (MVP) and PostgreSQL (production) with same code
- 2-day timeline requires component assembly, not custom building
- Static export possible for traditional hosting on Andreas's webserver

**Critical UI requirement:** Survey elements must render ergonomically and beautifully on arbitrary devices. Test all scale sizes (1,2,3,5,7,10, plus any new sizes) for responsive behavior.

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

## Relationship to Base Specification

This addendum **refines** but does not contradict Chapter 1 (Purpose, Scope, Design Principles). Key alignments:

- Graceful degradation (GitHub unavailable) aligns with "Human-Centered First"
- INSERT + supersede preserves "Immutability over Mutation" (no data deleted)
- Accept data loss for session aligns with "Minimal Trust, Maximum Traceability" (we trace what we can)
- VARCHAR + FK aligns with "Future-proofing" principle from Ch.19.1

**Ch.19 (Data Model) requires updates** to reflect:
- Reference table pattern for enums
- Responses supersession model
- Scale size extensibility

---

*This addendum captures interview decisions made 2026-01-28. Implementation should treat these as authoritative refinements to the base specification.*
