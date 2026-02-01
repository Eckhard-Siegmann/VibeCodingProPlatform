# 19. Data Model and Persistence

This chapter specifies the **consolidated persistence model** of the system. It reflects all conceptual decisions from the specification and is designed to support transparency, longitudinal analysis, agentic participation, and pragmatic meetup operations while remaining structurally elegant and extensible.

The database is assumed to be PostgreSQL, with SQLite supported for development (per Chapter 25 interview findings).

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
| `ready` | Ready | Quality gate passed, suitable for meetup | FALSE | 4 |
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
| `backlog` | Backlog | General pool, available for future meetups | FALSE | 1 |
| `selected_for_meetup` | Selected for Meetup | Planned for upcoming/current meetup | FALSE | 2 |
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
| `selected_for_meetup` | Selected for Meetup | planning | FALSE | TRUE |
| `deselected_for_meetup` | Deselected for Meetup | planning | FALSE | TRUE |
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
| `opened_for_review` | Opened for Review | live | FALSE | FALSE |
| `closed_for_review` | Closed for Review | live | FALSE | FALSE |

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
| `selected_for_meetup` | NULL | selected_for_meetup | NULL |
| `deselected_for_meetup` | NULL | backlog | NULL |
| `selected_for_coding` | NULL | selected_for_coding | NULL |
| `deselected_for_coding` | NULL | selected_for_meetup | NULL |
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
| `opened_for_review` | NULL | NULL | review |
| `closed_for_review` | NULL | NULL | idle |

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
| `pre_meetup` | Pre-Meetup | Before the meetup begins | 1 |
| `pitch` | Pitch | During or immediately after live pitch | 2 |
| `review` | Review | After coding/hacking, evaluating outcomes | 3 |
| `post_meetup` | Post-Meetup | Shortly after meetup ends | 4 |
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
| `moderator` | Moderator | TRUE | TRUE | Curates problems, orchestrates meetups | 5 |
| `admin` | Administrator | TRUE | TRUE | Full system access, manages items/inventories | 6 |
| `agent` | Agent | FALSE | FALSE | AI system, non-binding recommendations only | 7 |

---

## 19.3 Core Tables

### 19.3.1 `users`

Unified table for **all actors**: human participants, moderators, administrators, and agents. Distinctions are expressed through roles and flags rather than separate entities.

**Purpose**
- Authentication (for moderators/admins)
- Attribution of actions, decisions, assessments, comments
- Unified handling of humans and agents

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | UUID | PK | |
| `email` | VARCHAR | UNIQUE, nullable | Required for humans; NULL for agents |
| `display_name` | VARCHAR | NOT NULL | |
| `password_hash` | VARCHAR | nullable | NULL for password-less POs and agents |
| `role` | VARCHAR(20) | NOT NULL, FK → user_role_catalog | |
| `is_admin` | BOOLEAN | NOT NULL, default FALSE | Admins subsume moderator rights |
| `created_at` | TIMESTAMP | NOT NULL | |
| `last_login_at` | TIMESTAMP | nullable | |

**Invariants**
- Agents always have `role = 'agent'` and `is_admin = false`
- Problem Owners have `password_hash = NULL` (access via private URL)
- Same email reuses existing user record (lookup before insert)

---

### 19.3.2 `sessions`

Represents pseudonymous browser sessions used for voting and assessments without mandatory login.

**Purpose**
- Pairing pre/post responses
- Persisting presence/remote flag
- Lightweight participant tracking

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `session_id` | UUID | PK | |
| `session_hash` | VARCHAR | UNIQUE, NOT NULL | Salted hash from client |
| `user_id` | UUID | FK → users, nullable | Links to authenticated user if logged in |
| `in_presence` | BOOLEAN | NOT NULL | Set once per session |
| `created_at` | TIMESTAMP | NOT NULL | |
| `last_seen_at` | TIMESTAMP | NOT NULL | |

**Invariants**
- Sessions exist independently of authentication
- A logged-in user may have multiple sessions

---

### 19.3.3 `meetups`

Represents a concrete meetup instance (e.g., January 2026 edition).

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `meetup_id` | UUID | PK | |
| `title` | VARCHAR | NOT NULL | |
| `starts_at` | TIMESTAMP | NOT NULL | |
| `ends_at` | TIMESTAMP | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Notes**
- Meetup phase (pitching, review, etc.) is derived from decisions, not stored

---

### 19.3.4 `meetup_live_context`

Caches the **current live orchestration state** for a meetup. This is a derived/cached view, updated by triggers or application logic when live decisions are recorded.

**Purpose**
- Fast queries for "what's happening now" during live meetups
- Supports dashboard display without scanning decision history
- Source of truth remains the `decisions` table

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `meetup_id` | UUID | PK, FK → meetups | |
| `current_problem_id` | UUID | FK → problems, nullable | NULL when idle |
| `current_mode` | VARCHAR(10) | NOT NULL, default 'idle', CHECK IN ('idle', 'pitch', 'review') | |
| `mode_opened_at` | TIMESTAMP | nullable | When current mode was opened |
| `updated_at` | TIMESTAMP | NOT NULL | |

**State Transitions (driven by decisions)**
| Decision | Updates to |
|----------|------------|
| `opened_for_pitch_assessment` | `current_mode = 'pitch'`, `current_problem_id = X` |
| `closed_for_pitch_assessment` | `current_mode = 'idle'`, `current_problem_id = NULL` |
| `opened_for_review` | `current_mode = 'review'`, `current_problem_id = X` |
| `closed_for_review` | `current_mode = 'idle'`, `current_problem_id = NULL` |

**Invariants**
- This table is a **cache**, not a source of truth
- At most one pitch can be open at a time (opening a new pitch auto-closes the previous one per Ch.25)

---

### 19.3.5 `problems`

Represents the **identity of a problem across all versions**. Contains immutable identifiers plus cached state for efficient querying.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `problem_id` | UUID | PK | |
| `created_by_user_id` | UUID | FK → users, NOT NULL | The PO who created the problem |
| `public_slug` | VARCHAR | UNIQUE, NOT NULL | Immutable, generated at creation |
| `private_slug` | VARCHAR | UNIQUE, NOT NULL | Immutable, generated at creation |
| `created_at` | TIMESTAMP | NOT NULL | |
| `archived_at` | TIMESTAMP | nullable | Soft archive |
| `current_major_version` | INTEGER | NOT NULL | Cached for performance |
| `current_readiness_state` | VARCHAR(30) | NOT NULL, FK → readiness_state_catalog, default 'draft' | |
| `current_action_state` | VARCHAR(30) | NOT NULL, FK → action_state_catalog, default 'backlog' | |

**Invariants**
- Slugs are generated once and never change
- Cached states are updated transactionally with binding decisions
- Archival hides problem from default listings but preserves all data

---

### 19.3.6 `problem_versions`

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

### 19.3.7 `problem_repo_snapshots`

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

### 19.3.8 `inventories`

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

### 19.3.9 `items`

Defines **immutable evaluation items**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `item_id` | UUID | PK | |
| `item_key` | VARCHAR | NOT NULL | Conceptual identity |
| `short_label` | VARCHAR | NOT NULL | Mnemonic |
| `full_text` | TEXT | NOT NULL | Complete question text |
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
- **All active items standardize on `max_rating = 5`** with fully verbalized labels (label_min through label_max all set)
  - This ensures optimal cognitive efficiency in live assessments
  - Future migration to alternative scales (slider, 7-point, binary) supported via item versioning
  - The backend's scale consistency checker (Chapter 7.4, Chapter 9.4) determines render strategy

---

### 19.3.10 `inventory_items`

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

### 19.3.11 `assessments`

Represents one application of an inventory to a problem.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `assessment_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | nullable | |
| `inventory_id` | UUID | FK → inventories, NOT NULL | |
| `meetup_id` | UUID | FK → meetups, nullable | |
| `opened_at` | TIMESTAMP | NOT NULL | |
| `closed_at` | TIMESTAMP | nullable | |

---

### 19.3.12 `responses`

Stores **atomic answers to items**, with full contextual metadata per response.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `response_id` | UUID | PK | |
| `assessment_id` | UUID | FK → assessments, NOT NULL | |
| `item_id` | UUID | FK → items, NOT NULL | Concrete version at response time |
| `session_id` | UUID | FK → sessions, NOT NULL | |
| `user_id` | UUID | FK → users, nullable | If authenticated |
| `role` | VARCHAR(20) | NOT NULL, FK → user_role_catalog | |
| `time_context` | VARCHAR(20) | NOT NULL, FK → time_context_catalog | |
| `in_presence` | BOOLEAN | NOT NULL | TRUE = in-presence, FALSE = remote |
| `rating_value` | INTEGER | nullable | NULL = skipped |
| `created_at` | TIMESTAMP | NOT NULL | |
| `superseded_at` | TIMESTAMP | nullable | When this response was replaced |
| `superseded_by_response_id` | UUID | FK → responses, nullable | The newer response that replaced this one |

**Notes**
- Missing responses are represented by absence of a row, not NULL rating_value
- `item_id` locks to concrete item version used at response time
- Responses can be superseded while assessment is open (INSERT + mark model per Ch.25)
- Current response: `WHERE superseded_at IS NULL`

---

### 19.3.13 `decisions`

Canonical **event log** for all decisions, recommendations, and state transitions. This table serves as the activity log for the entire system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `decision_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | nullable | |
| `meetup_id` | UUID | FK → meetups, nullable | |
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

### 19.3.14 `comments`

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

---

### 19.3.15 `meetup_problem_queue`

Associates problems with meetups for **backlog management and sprint planning**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `queue_id` | UUID | PK | |
| `meetup_id` | UUID | FK → meetups, NOT NULL | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `queue_state` | VARCHAR(30) | NOT NULL | candidate, selected_for_pitch, selected_for_coding, completed |
| `position_index` | INTEGER | nullable | For ordering |
| `added_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`meetup_id`, `problem_id`)

---

## 19.4 Integrity Constraints and Key Guarantees

- **One active major version per problem**: Enforced via `is_current` flag with unique partial index
- **One active item per item_key**: Enforced via application logic and partial unique index on `retired_at IS NULL`
- **Decisions are append-only**: No UPDATE or DELETE operations on decisions table
- **Cached states updated transactionally**: `problems.current_*_state` updated atomically with binding decisions
- **Snapshots uniquely map commit SHA → minor_version**: Composite unique constraints
- **Response supersession**: Old responses marked `superseded_at` when replaced, preserving history
- **Foreign key integrity**: All VARCHAR references to catalog tables are enforced via FK constraints

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
- Dashboard "activity feeds" query recent decisions filtered by meetup or problem

This design follows the principle: **decisions are the single source of truth**.

---

## 19.7 Live Context vs. Cached State

The system maintains a clear separation between:

1. **Cached Problem State** (`problems.current_readiness_state`, `problems.current_action_state`)
   - Updated transactionally when binding decisions are recorded
   - Represents the "strategic disposition" of a problem
   - Enables efficient filtering without scanning decision history

2. **Live Orchestration Context** (`meetup_live_context`)
   - Derived from live decisions (`opened_for_pitch_assessment`, etc.)
   - Represents "what's happening right now" during a meetup
   - Ephemeral; only meaningful during active meetups

This separation ensures that transient operational states (pitch open, review open) do not pollute the problem's durable state model.

---

## 19.8 Relationship to Other Chapters

- **Chapter 3**: Roles and authority model → `user_role_catalog`, `users.role`
- **Chapter 4**: Problem identity and versioning → `problems`, `problem_versions`, `readiness_state_catalog`, `action_state_catalog`
- **Chapter 7**: Inventories and items → `inventories`, `items`, `inventory_items`
- **Chapter 8**: Assessments → `assessments`, `responses`
- **Chapter 9**: Voting and data capture → `responses` with contextual metadata, `time_context_catalog`
- **Chapter 10**: Decisions → `decisions`, `decision_type_catalog`, `decision_state_effects`
- **Chapter 11**: Meetup model → `meetups`, `meetup_problem_queue`, `meetup_live_context`
- **Chapter 14**: Live interaction modes → `meetup_live_context`
- **Chapter 16**: Comments → `comments` table
- **Chapter 20**: Traceability → `decisions` as activity log
- **Chapter 25**: Interview findings → Reference tables pattern, response supersession model
