# 19. Data Model and Persistence

This chapter specifies the **consolidated persistence model** of the system. It reflects all conceptual decisions from the specification and is designed to support transparency, longitudinal analysis, agentic participation, and pragmatic **multi-location community operations** while remaining structurally elegant and extensible.

The database is assumed to be PostgreSQL, with SQLite supported for development (per Chapter 25 interview findings).

**Note**: This chapter was significantly expanded to support the community platform model with mandatory authentication, events with partners and venues, team chat, and team formation (see Chapters 18, 29, 30, 31).

---

## 19.1 Design Principles

- **Immutability by default**: Assessments, responses, decisions, and item definitions are never mutated after creation.
- **Versioning over mutation**: Problems evolve via major versions; older versions remain queryable.
- **Orthogonality**: Contextual dimensions (role, time, location) are recorded explicitly and independently.
- **Auditability**: Every meaningful action is traceable via explicit entities.
- **Decisions as single source of truth**: All state changes flow through the decisions table.
- **Minimal coupling**: UI state, workflow state, and analytical state are not conflated.
- **Future-proofing**: New inventories, agents, and assessment types require no schema migration.
- **Reference tables over enums**: Controlled vocabularies use VARCHAR + FK reference tables for extensibility without migration overhead (per Chapter 25).

---

## 19.2 Catalog Tables (Controlled Vocabularies)

Per Chapter 25 interview findings, controlled vocabularies are implemented as **reference tables with VARCHAR primary keys** rather than PostgreSQL enums. This enables adding new values without schema migration.

### 19.2.1 `readiness_state_catalog`

Defines the **intrinsic quality states** of a Problem Card.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `state_key` | VARCHAR(30) | PK | Canonical identifier |
| `display_name` | VARCHAR(50) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | Explanation of state meaning |
| `is_terminal` | BOOLEAN | NOT NULL, default FALSE | Whether this is an end state |
| `sort_order` | INTEGER | NOT NULL | Display ordering |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Whether currently in use |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (5 states)**
| state_key | display_name | description | is_terminal | sort_order |
|-----------|--------------|-------------|-------------|------------|
| `draft` | Draft | Problem being authored, not yet submitted | FALSE | 1 |
| `submitted` | Submitted | Submitted for review, awaiting quality gate | FALSE | 2 |
| `needs_changes` | Needs Changes | Quality gate feedback received, refinement required | FALSE | 3 |
| `ready` | Ready | Quality gate passed, suitable for event | FALSE | 4 |
| `rejected` | Rejected | Quality gate failed, not suitable | TRUE | 5 |

---

### 19.2.2 `action_state_catalog`

Defines the **community intent states** for a Problem.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `state_key` | VARCHAR(30) | PK | Canonical identifier |
| `display_name` | VARCHAR(50) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | Explanation of state meaning |
| `is_terminal` | BOOLEAN | NOT NULL, default FALSE | Whether this is an end state |
| `sort_order` | INTEGER | NOT NULL | Display ordering |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Whether currently in use |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (6 states)**
| state_key | display_name | description | is_terminal | sort_order |
|-----------|--------------|-------------|-------------|------------|
| `backlog` | Backlog | General pool, available for future events | FALSE | 1 |
| `selected_for_event` | Selected for Event | Planned for upcoming/current event | FALSE | 2 |
| `selected_for_coding` | Selected for Coding | Actively being worked on in sprint | FALSE | 3 |
| `deferred` | Deferred | Postponed to future (reason in decision_type) | FALSE | 4 |
| `dropped` | Dropped | Removed from consideration, will not continue | TRUE | 5 |
| `closed` | Closed | Completed successfully, no further action needed | TRUE | 6 |

---

### 19.2.3 `decision_type_catalog`

Defines all **decision types** that can be recorded in the system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `type_key` | VARCHAR(40) | PK | Canonical identifier (past tense) |
| `display_name` | VARCHAR(60) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | Explanation of decision meaning |
| `category` | VARCHAR(20) | NOT NULL | Grouping: lifecycle, quality_gate, planning, sprint, deferral, drop, close, live |
| `affects_readiness` | BOOLEAN | NOT NULL, default FALSE | Whether this decision changes readiness_state |
| `affects_action` | BOOLEAN | NOT NULL, default FALSE | Whether this decision changes action_state |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Whether currently in use |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (25 decision types)**

| type_key | display_name | category | affects_readiness | affects_action |
|----------|--------------|----------|-------------------|----------------|
| `problem_created` | Problem Created | lifecycle | TRUE | TRUE |
| `problem_cloned` | Problem Cloned | lifecycle | TRUE | TRUE |
| `problem_submitted` | Problem Submitted | lifecycle | TRUE | FALSE |
| `problem_updated` | Problem Updated | lifecycle | TRUE | FALSE |
| `quality_gate_accepted` | Quality Gate Accepted | quality_gate | TRUE | FALSE |
| `quality_gate_rejected` | Quality Gate Rejected | quality_gate | TRUE | FALSE |
| `quality_gate_needs_changes` | Quality Gate Needs Changes | quality_gate | TRUE | FALSE |
| `selected_for_event` | Selected for Event | planning | FALSE | TRUE |
| `deselected_for_event` | Deselected for Event | planning | FALSE | TRUE |
| `selected_for_coding` | Selected for Coding | sprint | FALSE | TRUE |
| `deselected_for_coding` | Deselected for Coding | sprint | FALSE | TRUE |
| `deferred_po_absent` | Deferred: PO Absent | deferral | FALSE | TRUE |
| `deferred_low_priority` | Deferred: Low Priority | deferral | FALSE | TRUE |
| `deferred_skipped` | Deferred: Skipped | deferral | FALSE | TRUE |
| `deferred_too_complex` | Deferred: Too Complex | deferral | FALSE | TRUE |
| `deferred_needs_refinement` | Deferred: Needs Refinement | deferral | FALSE | TRUE |
| `deferred_future_capability` | Deferred: Future Capability | deferral | FALSE | TRUE |
| `dropped_low_relevance` | Dropped: Low Relevance | drop | FALSE | TRUE |
| `dropped_low_quality` | Dropped: Low Quality | drop | FALSE | TRUE |
| `closed_complete` | Closed: Complete | close | FALSE | TRUE |
| `closed_partial` | Closed: Partial | close | FALSE | TRUE |
| `opened_for_pitch_assessment` | Opened for Pitch | live | FALSE | FALSE |
| `closed_for_pitch_assessment` | Closed for Pitch | live | FALSE | FALSE |
| `opened_for_review_assessment` | Opened for Review | live | FALSE | FALSE |
| `closed_for_review_assessment` | Closed for Review | live | FALSE | FALSE |

Note: There are no separate "recommendation" decision types. Bindingness is orthogonal to decision type (see Ch.10.2). An agent recommending acceptance uses `decision_type = 'quality_gate_accepted'` with `is_binding = false`.

---

### 19.2.4 `decision_state_effects`

Maps each decision type to its resulting state changes. This table enables deterministic state derivation from decisions.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `decision_type` | VARCHAR(40) | PK, FK → decision_type_catalog | |
| `new_readiness_state` | VARCHAR(30) | FK → readiness_state_catalog, nullable | NULL if no readiness change |
| `new_action_state` | VARCHAR(30) | FK → action_state_catalog, nullable | NULL if no action change |
| `new_live_mode` | VARCHAR(10) | CHECK IN ('idle', 'pitch', 'review'), nullable | For live context updates |

**Mapping Data**
| decision_type | new_readiness_state | new_action_state | new_live_mode |
|---------------|---------------------|------------------|---------------|
| `problem_created` | draft | backlog | NULL |
| `problem_cloned` | draft | backlog | NULL |
| `problem_submitted` | submitted | NULL | NULL |
| `problem_updated` | draft | NULL | NULL |
| `quality_gate_accepted` | ready | NULL | NULL |
| `quality_gate_rejected` | rejected | NULL | NULL |
| `quality_gate_needs_changes` | needs_changes | NULL | NULL |
| `selected_for_event` | NULL | selected_for_event | NULL |
| `deselected_for_event` | NULL | backlog | NULL |
| `selected_for_coding` | NULL | selected_for_coding | NULL |
| `deselected_for_coding` | NULL | selected_for_event | NULL |
| `deferred_po_absent` | NULL | deferred | NULL |
| `deferred_low_priority` | NULL | deferred | NULL |
| `deferred_skipped` | NULL | deferred | NULL |
| `deferred_too_complex` | NULL | deferred | NULL |
| `deferred_needs_refinement` | NULL | deferred | NULL |
| `deferred_future_capability` | NULL | deferred | NULL |
| `dropped_low_relevance` | NULL | dropped | NULL |
| `dropped_low_quality` | NULL | dropped | NULL |
| `closed_complete` | NULL | closed | NULL |
| `closed_partial` | NULL | closed | NULL |
| `opened_for_pitch_assessment` | NULL | NULL | pitch |
| `closed_for_pitch_assessment` | NULL | NULL | idle |
| `opened_for_review_assessment` | NULL | NULL | review |
| `closed_for_review_assessment` | NULL | NULL | idle |

---

### 19.2.5 `time_context_catalog`

Defines temporal contexts for assessments.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `context_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | |
| `sort_order` | INTEGER | NOT NULL | Temporal ordering |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (5 contexts)**
| context_key | display_name | description | sort_order |
|-------------|--------------|-------------|------------|
| `pre_event` | Pre-Event | Before the event begins | 1 |
| `pitch` | Pitch | During or immediately after live pitch | 2 |
| `review` | Review | After coding/hacking, evaluating outcomes | 3 |
| `post_event` | Post-Event | Shortly after event ends | 4 |
| `late_reflection` | Late Reflection | Days/weeks later, delayed insights | 5 |

---

### 19.2.6 `user_role_catalog`

Defines all user roles in the system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `role_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | |
| `can_bind` | BOOLEAN | NOT NULL, default FALSE | Can create binding decisions |
| `is_human` | BOOLEAN | NOT NULL, default TRUE | FALSE for agents |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (7 roles)**
| role_key | display_name | can_bind | is_human | description | sort_order |
|----------|--------------|----------|----------|-------------|------------|
| `observer` | Observer | FALSE | TRUE | Watches and evaluates, does not code | 1 |
| `developer` | Developer | FALSE | TRUE | Actively codes on problems | 2 |
| `coding_partner` | Coding Partner | FALSE | TRUE | Pairs with developer at same workstation | 3 |
| `problem_owner` | Problem Owner | FALSE | TRUE | Authors and maintains problem cards | 4 |
| `moderator` | Moderator | TRUE | TRUE | Curates problems, orchestrates events | 5 |
| `admin` | Administrator | TRUE | TRUE | Full system access, manages items/inventories | 6 |
| `agent` | Agent | FALSE | FALSE | AI system, non-binding recommendations only | 7 |

---

### 19.2.7 `auth_provider_catalog`

Defines authentication providers supported by the system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `provider_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | Human-readable label |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (3 providers)**
| provider_key | display_name |
|--------------|--------------|
| `local` | Email + Password |
| `github` | GitHub OAuth |
| `linkedin` | LinkedIn OAuth |

---

### 19.2.8 `partner_type_catalog`

Defines types of partner organizations.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `type_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (4 types)**
| type_key | display_name |
|----------|--------------|
| `coworking` | Co-Working Space |
| `university` | University |
| `company` | Company |
| `community` | Community |

---

### 19.2.9 `chat_context_catalog`

Defines the situational context for chat messages.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `context_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (4 contexts)**
| context_key | display_name | sort_order |
|-------------|--------------|------------|
| `pre_discussion` | Pre-Discussion | 1 |
| `pitch_discussion` | Pitch Discussion | 2 |
| `while_building` | While Building | 3 |
| `while_reviewing` | While Reviewing | 4 |

---

### 19.2.10 `resource_type_catalog`

Defines types of resources linked to problems.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `type_key` | VARCHAR(20) | PK | Canonical identifier |
| `display_name` | VARCHAR(30) | NOT NULL | |
| `description` | TEXT | nullable | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Catalog Data (2 types)**
| type_key | display_name | description |
|----------|--------------|-------------|
| `direct` | Direct Resource | Repositories and resources directly relevant for the problem |
| `helpful` | Helpful Artifact | Repositories and resources with helpful reference material |

---

## 19.3 Core Tables

### 19.3.1 `users`

Unified table for **all actors**: human participants, moderators, administrators, and agents. Distinctions are expressed through roles and flags rather than separate entities.

**Purpose**
- Authentication (mandatory for all humans, see Chapter 18)
- Attribution of actions, decisions, assessments, chat messages
- Unified handling of humans and agents

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | UUID | PK | |
| `email` | VARCHAR | UNIQUE, nullable | Required for humans; NULL for agents |
| `display_name` | VARCHAR | NOT NULL | |
| `password_hash` | VARCHAR | nullable | NULL for OAuth users and agents |
| `auth_provider` | VARCHAR(20) | FK → auth_provider_catalog, default 'local' | local, github, linkedin |
| `github_id` | VARCHAR | UNIQUE, nullable | GitHub user ID for OAuth |
| `linkedin_id` | VARCHAR | UNIQUE, nullable | LinkedIn user ID for OAuth |
| `role` | VARCHAR(20) | NOT NULL, FK → user_role_catalog | |
| `is_admin` | BOOLEAN | NOT NULL, default FALSE | Admins subsume moderator rights |
| `email_confirmed` | BOOLEAN | NOT NULL, default FALSE | Double opt-in confirmed |
| `email_confirm_hash` | VARCHAR | nullable | Confirmation token |
| `email_confirm_expires_at` | TIMESTAMP | nullable | 24h validity |
| `otp_hash` | VARCHAR | nullable | One-time password hash |
| `otp_is_initial` | BOOLEAN | NOT NULL, default FALSE | Must change on first login |
| `get_infoletter` | BOOLEAN | NOT NULL, default TRUE | Newsletter subscription |
| `terms_accepted_at` | TIMESTAMP | nullable | When T&C were accepted |
| `show_on_contributor_wall` | BOOLEAN | NOT NULL, default TRUE | Opt-out from public contributor wall (Chapter 33) |
| `show_first_time_hints` | BOOLEAN | NOT NULL, default TRUE | Show contextual onboarding hints (Chapter 32) |
| `audio_cues_enabled` | BOOLEAN | NOT NULL, default FALSE | User preference for countdown timer audio alerts (Ch.14.5.1) |
| `default_dashboard_view` | VARCHAR(50) | nullable, default 'upcoming_events' | Default dashboard section on login (Chapter 32) |
| `api_token_hash` | VARCHAR | nullable | For agent authentication (hashed token) |
| `api_token_expires_at` | TIMESTAMP | nullable | Agent token expiration |
| `created_at` | TIMESTAMP | NOT NULL | |
| `last_login_at` | TIMESTAMP | nullable | |

**Password Policy** (see Chapter 18)
- Minimum 10 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Invariants**
- Agents always have `role = 'agent'` and `is_admin = false`
- OAuth users have `password_hash = NULL` and appropriate `github_id` or `linkedin_id`
- Local auth users must have `password_hash` set (after OTP change)
- Same email reuses existing user record (lookup before insert)
- `terms_accepted_at` must be set before user can participate in events

**Audio Preferences**:
- Audio cues for countdown timers (warning at 1min, expiry at 0:00)
- Default disabled (opt-in for sound)
- Persists across sessions and devices
- Fallback: localStorage if DB not available

**Schema Migration**:
```sql
-- Add audio preference field to users table
ALTER TABLE users ADD COLUMN audio_cues_enabled INTEGER NOT NULL DEFAULT 0;
```

---

### 19.3.2 `sessions` *(REMOVED)*

> **REMOVED**: This table has been eliminated. All participation requires mandatory authentication (Chapter 18).
>
> All responses are now directly linked to authenticated users via `user_id NOT NULL` in the `responses` table.
> The system no longer supports pseudonymous or unauthenticated participation.

---

### 19.3.3 `partners`

Represents **partner organizations** that host or co-host events.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `partner_id` | UUID | PK | |
| `name` | VARCHAR | NOT NULL | |
| `logo_url` | VARCHAR | nullable | URL to partner logo |
| `website_url` | VARCHAR | nullable | |
| `contact_name` | VARCHAR | nullable | Primary contact person |
| `contact_email` | VARCHAR | nullable | |
| `partner_type` | VARCHAR(20) | FK → partner_type_catalog, NOT NULL | coworking, university, company, community |
| `description` | TEXT | nullable | Partner bio/description |
| `created_at` | TIMESTAMP | NOT NULL | |

---

### 19.3.4 `locations`

Represents **physical venues** where events can be held.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `location_id` | UUID | PK | |
| `name` | VARCHAR | NOT NULL | e.g., "STARTPLATZ Köln" |
| `address` | VARCHAR | NOT NULL | Street address |
| `city` | VARCHAR | NOT NULL | e.g., "Cologne", "Aachen" |
| `created_at` | TIMESTAMP | NOT NULL | |

---

### 19.3.5 `rooms`

Represents **specific rooms** within a location with capacity information.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `room_id` | UUID | PK | |
| `location_id` | UUID | FK → locations, NOT NULL | |
| `name` | VARCHAR | NOT NULL | e.g., "Workshop Room A" |
| `max_pax_tables` | INTEGER | NOT NULL | Capacity with tables |
| `max_pax_no_tables` | INTEGER | NOT NULL | Capacity without tables (standing/theater) |
| `created_at` | TIMESTAMP | NOT NULL | |

---

### 19.3.6 `events`

Represents a **concrete event instance** (replaces the simpler `events` table). This is the primary entity for the multi-location community platform.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `event_id` | UUID | PK | |
| `slug` | VARCHAR | UNIQUE, NOT NULL | Human-readable URL slug, e.g., "cologne-march-2026" |
| `partner_id` | UUID | FK → partners, NOT NULL | Hosting partner |
| `room_id` | UUID | FK → rooms, NOT NULL | Venue room |
| `title` | VARCHAR | NOT NULL | |
| `description` | TEXT | nullable | Event description |
| `starts_at` | TIMESTAMP | NOT NULL | |
| `planned_ends_at` | TIMESTAMP | NOT NULL | |
| `host_user_id` | UUID | FK → users, NOT NULL | Primary host |
| `co_host_1_user_id` | UUID | FK → users, nullable | Optional co-host |
| `co_host_2_user_id` | UUID | FK → users, nullable | Optional co-host |
| `website_url` | VARCHAR | nullable | External event page |
| `linkedin_url` | VARCHAR | nullable | LinkedIn announcement |
| `x_post_url` | VARCHAR | nullable | X/Twitter announcement |
| `image_url` | VARCHAR | nullable | Custom image (overrides auto-generated) |
| `overbooking_factor` | DECIMAL(3,2) | NOT NULL, default 1.30 | e.g., 1.30 = 130% |
| `created_at` | TIMESTAMP | NOT NULL | |

**Notes**
- Event phase (pitching, review, etc.) is derived from decisions, not stored
- Deep link format: `/event/{slug}`
- Default image auto-generated from partner logo + event title (see Chapter 29)
- Capacity derived from `rooms.max_pax_tables` × `overbooking_factor`

**Display Capacity Logic** (see Chapter 29)
- 0-70% of base capacity: show actual registered count
- 70%+: show `max(registered, overbooking_capacity - registered)` to hide overbooking

---

### 19.3.7 `event_registrations`

Tracks **user registrations** for events with waitlist support.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `registration_id` | UUID | PK | |
| `event_id` | UUID | FK → events, NOT NULL | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `in_presence` | BOOLEAN | NOT NULL, default TRUE | FALSE = remote participation |
| `waitlist_position` | INTEGER | nullable | NULL if not on waitlist |
| `waitlist_invited_at` | TIMESTAMP | nullable | When invite was sent |
| `waitlist_expires_at` | TIMESTAMP | nullable | 24h from invite |
| `registered_at` | TIMESTAMP | NOT NULL | |
| `cancelled_at` | TIMESTAMP | nullable | Soft cancel |

**Constraints**
- UNIQUE (`event_id`, `user_id`)

**Waitlist Logic** (see Chapter 29)
- When in-presence capacity reached, new registrations get `waitlist_position`
- On cancellation, top waitlist user gets invite (24h response window)
- If no response, invite moves to next in queue

---

### 19.3.8 `event_attendance`

Tracks **actual attendance** for overbooking optimization.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `attendance_id` | UUID | PK | |
| `event_id` | UUID | FK → events, NOT NULL | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `showed_up` | BOOLEAN | NOT NULL | |
| `recorded_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`event_id`, `user_id`)

**Notes**
- Used to calculate show-up rate for overbooking factor optimization

---

### 19.3.9 `event_live_context`

Caches the **current live orchestration state** for an event. This is a derived/cached view, updated by triggers or application logic when live decisions are recorded.

**Purpose**
- Fast queries for "what's happening now" during live events
- Supports dashboard display without scanning decision history
- Source of truth remains the `decisions` table

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `event_id` | UUID | PK, FK → events | |
| `current_problem_id` | UUID | FK → problems, nullable | NULL when idle |
| `current_mode` | VARCHAR(10) | NOT NULL, default 'idle', CHECK IN ('idle', 'pitch', 'review') | |
| `mode_opened_at` | TIMESTAMP | nullable | When current mode was opened |
| `timer_duration_minutes` | INTEGER | nullable | Countdown duration set by moderator (Chapter 14.5) |
| `timer_ends_at` | TIMESTAMP | nullable | When countdown expires; NULL = no timer |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Timer Behavior**
- When moderator opens a phase with a timer, `timer_duration_minutes` and `timer_ends_at` are set
- Client polls `timer_ends_at` to display countdown
- Auto-close on timer expiry creates decision with system actor
- Moderator can extend timer by updating `timer_ends_at`

**State Transitions (driven by decisions)**
| Decision | Updates to |
|----------|------------|
| `opened_for_pitch_assessment` | `current_mode = 'pitch'`, `current_problem_id = X` |
| `closed_for_pitch_assessment` | `current_mode = 'idle'`, `current_problem_id = NULL` |
| `opened_for_review_assessment` | `current_mode = 'review'`, `current_problem_id = X` |
| `closed_for_review_assessment` | `current_mode = 'idle'`, `current_problem_id = NULL` |

**Invariants**
- This table is a **cache**, not a source of truth
- At most one pitch can be open at a time (opening a new pitch auto-closes the previous one per Ch.25)

---

### 19.3.10 `problems`

Represents the **identity of a problem across all versions**. Contains immutable identifiers plus cached state for efficient querying.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `problem_id` | UUID | PK | |
| `created_by_user_id` | UUID | FK → users, NOT NULL | The PO who created the problem |
| `deputy_owner_user_id` | UUID | FK → users, nullable | PO Deputy (same rights as PO) |
| `problem_type` | VARCHAR(30) | FK → problem_type_catalog, NOT NULL, default 'greenfield' | Classification badge |
| `public_slug` | VARCHAR | UNIQUE, NOT NULL | Immutable, generated at creation |
| `private_slug` | VARCHAR | UNIQUE, NOT NULL | Immutable, generated at creation |
| `created_at` | TIMESTAMP | NOT NULL | |
| `archived_at` | TIMESTAMP | nullable | Soft archive |
| `current_major_version` | INTEGER | NOT NULL | Cached for performance |
| `current_readiness_state` | VARCHAR(30) | NOT NULL, FK → readiness_state_catalog, default 'draft' | |
| `current_action_state` | VARCHAR(30) | NOT NULL, FK → action_state_catalog, default 'backlog' | |

**PO Deputy**
- Has same rights as PO for this problem
- Did not create the problem (distinguished from PO)
- One deputy per problem (not per version)
- Assigned by PO via Problem Card

**Problem Type (Classification)**
- Displayed as prominent badge at top of Problem Card
- Values: explorative, greenfield, advanced_greenfield, brownfield, reverse_engineering, other

**Invariants**
- Slugs are generated once and never change
- Cached states are updated transactionally with binding decisions
- Archival hides problem from default listings but preserves all data

---

### 19.3.11 `problem_versions`

Stores **major versions** of a Problem Card. Exactly one version per problem is current at any time.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `problem_version_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL, >= 1 | Monotonically increasing |
| `title` | VARCHAR | NOT NULL | |
| `description` | TEXT | NOT NULL | |
| `value_statement` | TEXT | nullable | |
| `repo_url_primary` | VARCHAR | NOT NULL | GitHub URL |
| `repo_url_secondary` | VARCHAR | nullable | Docs, demo, etc. |
| `task_count` | INTEGER | NOT NULL, >= 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `created_by_user_id` | UUID | FK → users, NOT NULL | |
| `commit_message` | TEXT | nullable | Change description |
| `is_current` | BOOLEAN | NOT NULL | |

**Constraints**
- UNIQUE (`problem_id`, `major_version`)
- Exactly one `is_current = true` per `problem_id`

---

### 19.3.12 `problem_repo_snapshots`

Maps **GitHub head commits to minor versions** within a given major version.

**Purpose**
- Track repository drift during assessments
- Support minor-version filtering in analysis
- Enable lightweight repo snapshotting without deep Git integration

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `snapshot_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | NOT NULL | Auto-increment per major |
| `head_commit_sha` | VARCHAR(40) | NOT NULL | |
| `first_seen_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`problem_id`, `major_version`, `head_commit_sha`)
- UNIQUE (`problem_id`, `major_version`, `minor_version`)

---

### 19.3.13 `inventories`

Defines a reusable **evaluation instrument**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `inventory_id` | UUID | PK | |
| `inventory_key` | VARCHAR | UNIQUE, NOT NULL | Human-readable identifier |
| `name` | VARCHAR | NOT NULL | |
| `description` | TEXT | nullable | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `retired_at` | TIMESTAMP | nullable | |

---

### 19.3.14 `items`

Defines **immutable evaluation items**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `item_id` | UUID | PK | |
| `item_key` | VARCHAR | NOT NULL | Conceptual identity |
| `short_label` | VARCHAR | NOT NULL | Mnemonic |
| `item_text` | TEXT | NOT NULL | Complete question text |
| `max_rating` | INTEGER | NOT NULL | Any positive integer (validated at application layer) |
| `label_min` | VARCHAR | nullable | |
| `label_low_mid` | VARCHAR | nullable | For 5-point scales |
| `label_mid` | VARCHAR | nullable | |
| `label_high_mid` | VARCHAR | nullable | For 5-point scales |
| `label_max` | VARCHAR | nullable | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `retired_at` | TIMESTAMP | nullable | |

**Invariants**
- At most one active row per `item_key` (`retired_at IS NULL`)
- Changes require retiring old item and creating new one with same `item_key`
- **All MVP items use `max_rating = 5`** with fully verbalized labels (label_min through label_max all set) for optimal cognitive efficiency in live assessments
  - Alternative scale support (button scales ≤7, sliders >7) is specified in Chapter 26 and supported via item versioning
  - The backend's scale consistency checker (Chapter 7.4) determines render strategy based on max_rating and labels
  - Items with different max_rating values are grouped into separate matrices or rendered with appropriate UI (Chapter 26.4)

---

### 19.3.15 `inventory_items`

Defines the **composition and order** of an inventory.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `inventory_id` | UUID | FK → inventories, NOT NULL | |
| `item_key` | VARCHAR | NOT NULL | References concept, not specific version |
| `position_index` | INTEGER | NOT NULL | |

**Constraints**
- PK (`inventory_id`, `item_key`)
- UNIQUE (`inventory_id`, `position_index`)

**Notes**
- References `item_key`, not `item_id`
- Item version resolved at response time (use active item for key)

---

### 19.3.16 `assessments`

Represents one application of an inventory to a problem.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `assessment_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | nullable | |
| `inventory_id` | UUID | FK → inventories, NOT NULL | |
| `event_id` | UUID | FK → events, nullable | |
| `opened_at` | TIMESTAMP | NOT NULL | |
| `closed_at` | TIMESTAMP | nullable | |

---

### 19.3.17 `responses`

Stores **atomic answers to items**, with full contextual metadata per response.

> **Updated**: All responses require authentication. The `session_id` column has been removed. All responses are now directly linked to authenticated users.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `response_id` | UUID | PK | |
| `assessment_id` | UUID | FK → assessments, NOT NULL | |
| `item_id` | UUID | FK → items, NOT NULL | Concrete version at response time |
| `user_id` | UUID | FK → users, NOT NULL | **Authentication required** |
| `role` | VARCHAR(20) | NOT NULL, FK → user_role_catalog | |
| `time_context` | VARCHAR(20) | NOT NULL, FK → time_context_catalog | |
| `in_presence` | BOOLEAN | NOT NULL | TRUE = in-presence, FALSE = remote |
| `rating_value` | INTEGER | nullable | NULL = skipped |
| `review_weight_key` | VARCHAR(30) | FK → review_weight_catalog, nullable | Weight context for star calculations (Chapter 33) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `superseded_at` | TIMESTAMP | nullable | When this response was replaced |
| `superseded_by_response_id` | UUID | FK → responses, nullable | The newer response that replaced this one |

**Notes**
- All participation requires authentication (Chapter 18)
- Missing responses are represented by absence of a row, not NULL rating_value
- `item_id` locks to concrete item version used at response time
- Responses can be superseded while assessment is open (INSERT + mark model per Ch.25)
- Current response: `WHERE superseded_at IS NULL`

---

### 19.3.18 `decisions`

Canonical **event log** for all decisions, recommendations, and state transitions. This table serves as the activity log for the entire system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `decision_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | nullable | |
| `event_id` | UUID | FK → events, nullable | |
| `decision_type` | VARCHAR(40) | NOT NULL, FK → decision_type_catalog | |
| `is_binding` | BOOLEAN | NOT NULL | |
| `actor_user_id` | UUID | FK → users, NOT NULL | |
| `authority_reference` | UUID | FK → users, nullable | For group decisions |
| `rationale` | TEXT | nullable | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Invariants**
- Agents may only create `is_binding = false` entries
- Decisions are append-only, never updated or deleted

---

### 19.3.19 `comments` *(DEPRECATED)*

> **DEPRECATED**: This table is retained for historical data only. New qualitative feedback is captured via the **team chat system** (see `chat_messages` table and Chapter 31). The chat system provides richer context, threading, and real-time collaboration.

Stores **qualitative feedback** separately from decisions.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `comment_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `problem_version_id` | UUID | FK → problem_versions, nullable | If tied to specific version |
| `session_id` | UUID | FK → sessions, NOT NULL | |
| `user_id` | UUID | FK → users, nullable | If authenticated |
| `actor_role` | VARCHAR(20) | NOT NULL, FK → user_role_catalog | |
| `comment_text` | TEXT | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Invariants**
- Comments are append-only, never edited or deleted
- Non-binding by default; do not change system state
- **New comments should use `chat_messages` instead**

---

### 19.3.20 `event_problem_queue`

Associates problems with events for **backlog management and sprint planning**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `queue_id` | UUID | PK | |
| `event_id` | UUID | FK → events, NOT NULL | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `queue_state` | VARCHAR(30) | NOT NULL | candidate, selected_for_pitch, selected_for_coding, completed |
| `position_index` | INTEGER | nullable | For ordering |
| `added_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`event_id`, `problem_id`)

---

### 19.3.21 `problem_teams`

Represents a **team formed around a problem** at a specific event. Created when participants click "Challenge accepted" on a Problem Card.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `team_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `event_id` | UUID | FK → events, NOT NULL | |
| `breakout_room_url` | VARCHAR | nullable | Google Meet, Zoom, etc. |
| `created_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`problem_id`, `event_id`) — one team per problem per event

**Notes**
- Team automatically includes the Problem Owner
- Breakout room URL can be added by PO, moderator, or any team member

---

### 19.3.22 `problem_team_members`

Tracks **membership** in problem teams with **version-scoped onboarding**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `team_id` | UUID | FK → problem_teams, NOT NULL | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `problem_version_id` | UUID | FK → problem_versions, NOT NULL | Version scope for membership |
| `joined_at` | TIMESTAMP | NOT NULL | |
| `solution_repo_url` | VARCHAR | nullable | Team member's solution repository |
| `member_role` | VARCHAR(20) | FK → team_member_role_catalog, NOT NULL, default 'coder' | po, po_deputy, coder |
| `status` | VARCHAR(20) | FK → team_member_status_catalog, NOT NULL, default 'active' | active, retired |
| `retired_at` | TIMESTAMP | nullable | When retired (NULL if never) |
| `rejoined_at` | TIMESTAMP | nullable | When rejoined (NULL if never) |

**Constraints**
- PK (`team_id`, `user_id`, `problem_version_id`)

**Version-Scoped Onboarding**
- Team membership is tied to a **major version** of the problem
- When PO creates a new major version:
  - Only PO (and deputy, if assigned) are auto-added to new version
  - All coders are **not** automatically added (clean slate)
  - Previous version's memberships remain (historical record)
  - Chat history preserved across versions

**Membership State Machine**
```
[Not a member] → Join → [active coder]
[active coder] → Retire → [retired coder]
[retired coder] → Rejoin → [active coder]
```

**Chat Display Context**
| Status | Display Format |
|--------|----------------|
| PO | "Max (PO)" |
| PO Deputy | "Max (PO deputy)" |
| Active coder | "Max" |
| Retired | "Max (retired)" |
| Non-member moderator | "Max (moderator)" |
| Non-member observer | "Max (guest)" |

**Notes**
- Solution repo sharing is encouraged but not required
- Multiple team members may contribute separate repos
- Moderators who join become coders FOR THIS PROBLEM only

---

### 19.3.23 `problem_resources`

Tracks **URLs and resources** associated with problems. Supports two lists: directly relevant resources and helpful artifacts.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `resource_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `url` | VARCHAR | NOT NULL | |
| `title` | VARCHAR | NOT NULL | Display title |
| `resource_type` | VARCHAR(20) | FK → resource_type_catalog, NOT NULL | direct, helpful |
| `added_by_user_id` | UUID | FK → users, NOT NULL | |
| `approved` | BOOLEAN | NOT NULL, default FALSE | |
| `approved_by_user_id` | UUID | FK → users, nullable | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Approval Logic** (see Chapter 4, Chapter 13)
- PO and team members: auto-approved (`approved = TRUE`)
- Moderators: auto-approved
- Observers: requires PO approval (`approved = FALSE` until approved)

---

### 19.3.24 `chat_messages`

Stores **atomic chat messages** with rich contextual metadata. Replaces the deprecated `comments` table (see Chapter 31).

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `message_id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `problem_id` | UUID | FK → problems, nullable | NULL for event-wide chat |
| `problem_version_id` | UUID | FK → problem_versions, nullable | Version context for display |
| `major_version` | INTEGER | NOT NULL | **Direct version for efficient filtering** |
| `minor_version` | INTEGER | nullable | Nullable per Ch.25 (GitHub may be unavailable) |
| `event_id` | UUID | FK → events, nullable | NULL for cross-event discussion |
| `team_id` | UUID | FK → problem_teams, nullable | NULL if not team-specific |
| `context_situation` | VARCHAR(20) | FK → chat_context_catalog, NOT NULL | pre_discussion, pitch_discussion, while_building, while_reviewing |
| `content` | TEXT | NOT NULL | Message content (**max 2000 chars, enforced at app layer**) |
| `reply_to_message_id` | UUID | FK → chat_messages, nullable | For threading |
| `url_disclosed` | BOOLEAN | NOT NULL, default FALSE | Message contains URL (auto-detected) |
| `valuable_insight` | BOOLEAN | NOT NULL, default FALSE | Flagged as valuable |
| `valuable_link` | BOOLEAN | NOT NULL, default FALSE | Flagged as valuable link |
| `is_bot` | BOOLEAN | NOT NULL, default FALSE | System notification or AI |
| `author_role` | VARCHAR(20) | FK → user_role_catalog, NOT NULL | **Cached author role at message creation** |
| `visible` | BOOLEAN | NOT NULL, default TRUE | Soft delete |
| `created_at` | TIMESTAMP | NOT NULL | |
| `edited_at` | TIMESTAMP | nullable | NULL if never edited |

**Version Tracking Rationale**
- `major_version` stored directly for efficient filtering without JOIN
- `minor_version` nullable because GitHub snapshot may not be available (per Ch.25)
- Default chat view filters to current major version only
- Cross-version chat history accessible via filter change

**Content Limits**
- Maximum 2000 characters (enforced at application layer)
- URL detection via regex: `https?://[^\s<>"{}|\\^\[\]`]+`

**Edit Policy**
- Users can edit their own messages within 15 minutes of creation
- Edits update `edited_at` timestamp

**Visibility/Deletion**
- Soft delete sets `visible = FALSE`
- Historical messages remain for audit

**Bot Messages**
- System notifications (user joined, pitch started) have `is_bot = TRUE`
- AI assistant messages have `is_bot = TRUE`
- Bot display name format: `function-title (bot)` e.g., `repo-validator (bot)`
- Bot messages rendered visually distinct (see Chapter 31)

**Indexes**
- `idx_chat_by_problem`: `(problem_id, created_at)` - For problem-scoped queries
- `idx_chat_by_version`: `(problem_id, major_version, created_at)` - **For version-filtered queries**
- `idx_chat_by_team`: `(team_id, created_at)` - For team chat queries
- `idx_visible_chat`: `(problem_id, created_at) WHERE visible = TRUE`

**Notes**
- Chat is a **filterable view** over atomic messages
- Filters: by problem, by event, by team, by role, by version, contains_URL, moderator posts, PO posts
- Polling: 3s during active event, 10s otherwise

---

### 19.3.25 `chat_mentions`

Tracks **@mentions** in chat messages for notifications.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `mention_id` | UUID | PK | |
| `message_id` | UUID | FK → chat_messages, NOT NULL | |
| `mentioned_user_id` | UUID | FK → users, NOT NULL | |

**Constraints**
- UNIQUE (`message_id`, `mentioned_user_id`)

---

### 19.3.26 `chat_reactions`

Tracks **emoji reactions** on chat messages.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `reaction_id` | UUID | PK | |
| `message_id` | UUID | FK → chat_messages, NOT NULL | |
| `user_id` | UUID | FK → users, NOT NULL | |
| `emoji` | VARCHAR(10) | FK → emoji_catalog, NOT NULL | **Must be from curated set** |
| `created_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`message_id`, `user_id`, `emoji`) - User can only react once with each emoji

---

### 19.3.27 `emoji_catalog`

**Curated set of 10 emojis** for reactions (see Chapter 31.4 for rationale).

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `emoji` | VARCHAR(10) | PK | Unicode emoji character |
| `display_name` | VARCHAR(50) | NOT NULL | Human-readable name |
| `sort_order` | INTEGER | NOT NULL | Display order in picker |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Can be disabled without deletion |

**Seed Data**
| emoji | display_name | sort_order |
|-------|--------------|------------|
| 👍 | Thumbs Up | 1 |
| 👎 | Thumbs Down | 2 |
| ❤️ | Heart | 3 |
| 🎉 | Celebrate | 4 |
| 🤔 | Thinking | 5 |
| 👀 | Eyes | 6 |
| 🔥 | Fire | 7 |
| ✅ | Check | 8 |
| 💡 | Idea | 9 |
| 🙏 | Thanks | 10 |

**Rationale**
- Limited set keeps UI clean
- Ensures reactions have shared meaning across users
- Users can see who reacted (tooltip shows user list)

---

### 19.3.27 `lessons_learned`

Captures **structured insights** from working on problems. Unlike chat messages (chronological flow), lessons learned are curated, categorized knowledge artifacts.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `lesson_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `event_id` | UUID | FK → events, nullable | Which event context (NULL for cross-event) |
| `user_id` | UUID | FK → users, NOT NULL | Who created the lesson |
| `content` | TEXT | NOT NULL | The insight text |
| `category` | VARCHAR(30) | FK → lesson_category_catalog, nullable | Predefined category |
| `tags` | TEXT | nullable | JSON array of freeform tags |
| `valuable` | BOOLEAN | NOT NULL, default FALSE | Flagged for cross-location sharing |
| `created_at` | TIMESTAMP | NOT NULL | |
| `edited_at` | TIMESTAMP | nullable | NULL if never edited |

**Categories** (from `lesson_category_catalog`)
| Category | Description |
|----------|-------------|
| `tooling` | Insights about agentic tools, IDEs, configurations |
| `architecture` | Design patterns, structure, system organization |
| `process` | Workflow, collaboration, methodology learnings |
| `gotcha` | Pitfalls, surprises, things that caught us off guard |
| `performance` | Speed, efficiency, optimization insights |
| `testing` | Test strategies, coverage, verification approaches |

**Cross-Location Learning**
- Lessons flagged as `valuable = TRUE` are surfaced to other locations
- Own location sees all lessons; other locations see only valuable ones
- Supports moderator wrap-up preparation for next event

**Notes**
- Lessons often emerge days/weeks after an event
- Unlike chat, lessons are designed for analysis and pattern mining
- Future agents can process lessons for knowledge condensation

---

### 19.3.28 `lesson_category_catalog`

Reference table for predefined lesson categories.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `category_key` | VARCHAR(30) | PK | |
| `display_name` | VARCHAR(50) | NOT NULL | |
| `description` | TEXT | nullable | |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

---

### 19.3.29 `problem_type_catalog`

Reference table for problem classification types.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `type_key` | VARCHAR(30) | PK | |
| `display_name` | VARCHAR(50) | NOT NULL | |
| `description` | TEXT | nullable | |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Standard Types**
| Type | Description |
|------|-------------|
| `explorative` | Early-stage idea exploration |
| `greenfield` | New project from scratch |
| `advanced_greenfield` | Building on existing greenfield work |
| `brownfield` | Existing codebase with constraints |
| `reverse_engineering` | Understanding existing system |
| `other` | Does not fit other categories |

---

### 19.3.30 `team_member_role_catalog`

Reference table for team member roles.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `role_key` | VARCHAR(20) | PK | |
| `display_name` | VARCHAR(50) | NOT NULL | |
| `description` | TEXT | nullable | |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Standard Roles**
| Role | Description |
|------|-------------|
| `po` | Problem Owner (created the problem) |
| `po_deputy` | PO Deputy (same rights as PO, assigned by PO) |
| `coder` | Team member working on the solution |

---

### 19.3.31 `team_member_status_catalog`

Reference table for team membership status.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `status_key` | VARCHAR(20) | PK | |
| `display_name` | VARCHAR(50) | NOT NULL | |
| `description` | TEXT | nullable | |
| `sort_order` | INTEGER | NOT NULL | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Standard Statuses**
| Status | Description |
|--------|-------------|
| `active` | Currently active team member |
| `retired` | Retired from team, can rejoin |

---

### 19.3.32 `contribution_action_catalog`

Reference table for **point-earning actions** in the contributor recognition system. Weights are admin-configurable.

**Design Philosophy** (see Chapter 33)
- **Points** = time invested in quality content (assessments, reviews, problem refinement)
- **Stars** = hacking excellence (best solutions)

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `action_key` | VARCHAR(40) | PK | Canonical identifier |
| `display_name` | VARCHAR(60) | NOT NULL | Human-readable label |
| `description` | TEXT | nullable | What triggers this action |
| `default_points` | INTEGER | NOT NULL | Original point value |
| `current_points` | INTEGER | NOT NULL | Admin-editable weight |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Can be disabled |
| `created_at` | TIMESTAMP | NOT NULL | |

**Seed Data**
| action_key | display_name | default_points | description |
|------------|--------------|----------------|-------------|
| `review_assessment_completed` | Review Assessment | 1 | Completed a pre- or post-event review assessment |
| `valuable_contribution` | Valuable Contribution | 1 | Chat message or lesson learned with ≥2 thumbs-up (👍) or lightbulb (💡) reactions |
| `problem_submitted` | Problem Submitted | 1 | Submitted a problem for review |
| `problem_elected_pitch` | Problem Pitched | 1 | Own problem was selected for pitch phase |
| `problem_elected_coding` | Problem Coded | 1 | Own problem was selected for coding sprint |

**Notes**
- Admin can adjust `current_points` without changing `default_points` (audit trail)
- New action types can be added without schema migration
- Points reward engagement breadth; stars reward hacking excellence

---

### 19.3.33 `contribution_points`

**Append-only ledger** of points awarded to users. Each row represents one point-earning event.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `contribution_id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | Who earned the points |
| `action_key` | VARCHAR(40) | FK → contribution_action_catalog, NOT NULL | What action triggered it |
| `points_awarded` | INTEGER | NOT NULL | Points at time of award (snapshot of `current_points`) |
| `source_type` | VARCHAR(30) | NOT NULL | 'response', 'chat_message', 'decision', 'problem', 'lesson' |
| `source_id` | UUID | NOT NULL | FK to the source record |
| `event_id` | UUID | FK → events, nullable | NULL for non-event actions |
| `awarded_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`user_id`, `action_key`, `source_type`, `source_id`) — prevents double-awarding

**Source Types**
| source_type | source_id references | Example |
|-------------|---------------------|---------|
| `response` | `responses.response_id` | Review assessment completed |
| `chat_message` | `chat_messages.message_id` | Valuable chat contribution |
| `decision` | `decisions.decision_id` | Problem selected for pitch/coding |
| `problem` | `problems.problem_id` | Problem submitted |
| `lesson` | `lessons_learned.lesson_id` | Valuable lesson learned |

**Invariants**
- Append-only: points are never revoked or edited
- Points snapshot: `points_awarded` captures value at award time (immune to later weight changes)
- Duplicate prevention: unique constraint prevents gaming via repeated actions

---

### 19.3.34 `star_awards`

Tracks **hacking excellence awards** (1st, 2nd, 3rd place) for best solutions per problem per event.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `award_id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | Who received the award |
| `problem_id` | UUID | FK → problems, NOT NULL | Which problem |
| `event_id` | UUID | FK → events, NOT NULL | Which event |
| `place` | INTEGER | NOT NULL, CHECK (place IN (1, 2, 3)) | 1st, 2nd, or 3rd |
| `stars_awarded` | INTEGER | NOT NULL | 3 for 1st, 2 for 2nd, 1 for 3rd |
| `awarded_by_user_id` | UUID | FK → users, NOT NULL | Moderator who recorded the award |
| `awarded_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`problem_id`, `event_id`, `place`) — one award per place per problem per event
- UNIQUE (`problem_id`, `event_id`, `user_id`) — one user can only win one place per problem

**Determination Mechanism** (see Chapter 33)
- Based on **aggregated review assessment scores**
- Human votes are ground truth
- Post-event reviews weighted higher than live reviews (1.5x vs 1.0x)
- Agent reviews contribute but at lower weight (0.5x)
- System evolves with better agents, but human judgment remains authoritative

**Place-to-Stars Mapping**
| Place | Stars |
|-------|-------|
| 1st | 3 |
| 2nd | 2 |
| 3rd | 1 |

---

### 19.3.35 `review_weight_catalog`

Reference table for **review weightings** used in star award calculations. Different review contexts have different authority.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `weight_key` | VARCHAR(30) | PK | Canonical identifier |
| `display_name` | VARCHAR(50) | NOT NULL | Human-readable label |
| `weight_multiplier` | DECIMAL(3,2) | NOT NULL | Multiplier applied to review scores |
| `description` | TEXT | nullable | When this weight applies |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Seed Data**
| weight_key | display_name | weight_multiplier | description |
|------------|--------------|-------------------|-------------|
| `live_review` | Live Review | 1.00 | Review during event (time-constrained) |
| `post_event_review` | Post-Event Review | 1.50 | Review after event ends (more time to verify repo) |
| `agent_review` | Agent Review | 0.50 | AI agent assessment (supporting, not authoritative) |

**Rationale**
- Post-event reviews have more time to examine the repository thoroughly
- Agent reviews contribute but human judgment is ground truth
- Weights are admin-configurable for future tuning

---

### 19.3.36 `contributor_wall_6week` (View)

**Aggregation view** for the public contributor wall. Shows top-10 contributors over a rolling 6-week window.

```sql
CREATE VIEW contributor_wall_6week AS
SELECT
  u.user_id,
  u.display_name,
  COALESCE(SUM(cp.points_awarded), 0) AS total_points,
  COALESCE(SUM(sa.stars_awarded), 0) AS total_stars,
  COUNT(DISTINCT cp.contribution_id) AS contribution_count
FROM users u
LEFT JOIN contribution_points cp ON u.user_id = cp.user_id
  AND cp.awarded_at >= NOW() - INTERVAL '6 weeks'
LEFT JOIN star_awards sa ON u.user_id = sa.user_id
  AND sa.awarded_at >= NOW() - INTERVAL '6 weeks'
WHERE u.show_on_contributor_wall = TRUE
GROUP BY u.user_id, u.display_name
ORDER BY total_points DESC, contribution_count DESC
LIMIT 10;
```

**Sorting Logic**
1. Primary: `total_points` descending
2. Tie-breaker: `contribution_count` descending (more contributions wins)

**Privacy**
- Only users with `show_on_contributor_wall = TRUE` appear
- Opt-out users are excluded from public display
- Points/stars still tracked for personal dashboard

---

### 19.3.37 `user_milestones`

Tracks **first-time achievements** for milestone recognition (Chapter 33). Used to trigger celebration moments and avoid repeated notifications.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `milestone_id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | Who achieved the milestone |
| `milestone_key` | VARCHAR(50) | NOT NULL | Milestone type identifier |
| `achieved_at` | TIMESTAMP | NOT NULL | When milestone was achieved |
| `context_id` | UUID | nullable | Related entity (problem_id, event_id, etc.) |
| `context_type` | VARCHAR(30) | nullable | Type of context ('problem', 'event', 'team') |

**Constraints**
- UNIQUE (`user_id`, `milestone_key`) — each milestone achieved once per user

**Standard Milestones**
| milestone_key | Description | context_type |
|---------------|-------------|--------------|
| `first_problem_submitted` | First problem submitted for review | problem |
| `first_problem_accepted` | First problem passed quality gate | problem |
| `first_assessment_completed` | First pitch or review assessment | NULL |
| `first_team_joined` | First team membership | team |
| `first_event_attended` | First event with confirmed attendance | event |
| `first_lesson_learned` | First lesson learned added | NULL |
| `first_star_earned` | First star award received | problem |

**Usage Pattern**
```sql
-- Check if milestone exists before showing celebration
SELECT * FROM user_milestones
WHERE user_id = ? AND milestone_key = 'first_problem_submitted';

-- If no row, insert and trigger celebration
INSERT INTO user_milestones (milestone_id, user_id, milestone_key, achieved_at, context_id, context_type)
VALUES (?, ?, 'first_problem_submitted', NOW(), ?, 'problem');
```

---

### 19.3.38 `user_hint_dismissals`

Tracks **dismissed onboarding hints** so users don't see the same guidance repeatedly (Chapter 32).

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | UUID | FK → users, NOT NULL | |
| `hint_key` | VARCHAR(50) | NOT NULL | Hint identifier |
| `dismissed_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- PK (`user_id`, `hint_key`)

**Standard Hints**
| hint_key | Where Shown | Description |
|----------|-------------|-------------|
| `first_problem_welcome` | Problem creation | Welcome panel for first problem |
| `first_pitch_voting` | Pitch assessment | Explanation of pitch voting |
| `first_team_join` | Problem Card | Guidance after joining team |
| `dual_state_explanation` | Problem Card | Readiness vs Action state explanation |
| `assessment_skip_ok` | Assessment form | "It's OK to skip dimensions" |
| `dashboard_overview` | Dashboard | First-time dashboard orientation |

**Usage Pattern**
```sql
-- Check if hint should be shown
SELECT 1 FROM user_hint_dismissals
WHERE user_id = ? AND hint_key = 'first_problem_welcome';

-- If no row, show hint; on dismiss:
INSERT INTO user_hint_dismissals (user_id, hint_key, dismissed_at)
VALUES (?, 'first_problem_welcome', NOW());
```

**Note:** Users can reset all hints via Account Settings if `show_first_time_hints` is toggled.

---

## 19.4 Integrity Constraints and Key Guarantees

- **One active major version per problem**: Enforced via `is_current` flag with unique partial index
- **One active item per item_key**: Enforced via application logic and partial unique index on `retired_at IS NULL`
- **Decisions are append-only**: No UPDATE or DELETE operations on decisions table
- **Cached states updated transactionally**: `problems.current_*_state` updated atomically with binding decisions
- **Snapshots uniquely map commit SHA → minor_version**: Composite unique constraints
- **Response supersession**: Old responses marked `superseded_at` when replaced, preserving history
- **Foreign key integrity**: All VARCHAR references to catalog tables are enforced via FK constraints
- **Email uniqueness**: Each email maps to exactly one user (deduplication at registration)
- **One team per problem per event**: Enforced via unique constraint on (`problem_id`, `event_id`)
- **Event registration uniqueness**: One registration per user per event via unique constraint
- **Chat message soft delete**: Deletion sets `visible = FALSE`, preserving audit trail

---

## 19.5 Temporal Consistency and Immutability

The system enforces **time-aware consistency** through design rather than heavy locking:

- Items and Inventories are immutable once used in assessments
- Assessments and responses are never updated, only inserted (supersession for responses)
- Decisions form a complete, ordered history
- State rollback is implemented as forward-only events (new decisions)
- Minor versions capture transient repository state without invalidating earlier assessments

This guarantees that historical analyses remain valid even as practices, tools, and agentic capabilities evolve.

---

## 19.6 Activity Log Pattern

There is **no separate activity_log table**. The `decisions` table serves as the authoritative event log:

- All meaningful state changes are recorded as decisions
- Activity views are projections over the decisions table
- Comments are stored separately but are queryable alongside decisions
- Dashboard "activity feeds" query recent decisions filtered by event or problem

This design follows the principle: **decisions are the single source of truth**.

---

## 19.7 Live Context vs. Cached State

The system maintains a clear separation between:

1. **Cached Problem State** (`problems.current_readiness_state`, `problems.current_action_state`)
   - Updated transactionally when binding decisions are recorded
   - Represents the "strategic disposition" of a problem
   - Enables efficient filtering without scanning decision history

2. **Live Orchestration Context** (`event_live_context`)
   - Derived from live decisions (`opened_for_pitch_assessment`, etc.)
   - Represents "what's happening right now" during an event
   - Ephemeral; only meaningful during active events

This separation ensures that transient operational states (pitch open, review open) do not pollute the problem's durable state model.

---

## 19.8 Relationship to Other Chapters

- **Chapter 3**: Roles and authority model → `user_role_catalog`, `users.role`
- **Chapter 4**: Problem identity and versioning → `problems`, `problem_versions`, `problem_resources`, `readiness_state_catalog`, `action_state_catalog`
- **Chapter 7**: Inventories and items → `inventories`, `items`, `inventory_items`
- **Chapter 8**: Assessments → `assessments`, `responses`
- **Chapter 9**: Voting and data capture → `responses` with contextual metadata, `time_context_catalog`
- **Chapter 10**: Decisions → `decisions`, `decision_type_catalog`, `decision_state_effects`
- **Chapter 11**: Event model → `events`, `event_problem_queue`, `event_live_context`
- **Chapter 13**: Problem Card UI → `problem_resources`, `problem_teams`, `problem_team_members`
- **Chapter 14**: Live interaction modes → `event_live_context` (including timer fields for pace support)
- **Chapter 16**: Comments → `comments` table *(DEPRECATED, see Chapter 31)*
- **Chapter 18**: Authentication → `users` (auth fields), `auth_provider_catalog`, `users.show_on_contributor_wall`
- **Chapter 20**: Traceability → `decisions` as activity log
- **Chapter 25**: Interview findings → Reference tables pattern, response supersession model
- **Chapter 29**: Events and locations → `events`, `partners`, `locations`, `rooms`, `event_registrations`, `event_attendance`
- **Chapter 30**: Registration and onboarding → `users` (confirmation fields), `event_registrations`
- **Chapter 31**: Team chat → `chat_messages`, `chat_mentions`, `chat_reactions`, `problem_teams`, `problem_team_members`
- **Chapter 32**: Onboarding and guided experience → `users.show_first_time_hints`, `user_hint_dismissals`
- **Chapter 33**: Contributor recognition → `contribution_action_catalog`, `contribution_points`, `star_awards`, `review_weight_catalog`, `user_milestones`, `responses.review_weight_key`, `users.show_on_contributor_wall`
