# 19. Data Model and Persistence

This chapter specifies the **consolidated persistence model** of the system. It reflects all conceptual decisions from the specification and is designed to support transparency, longitudinal analysis, agentic participation, and pragmatic meetup operations while remaining structurally elegant and extensible.

The database is assumed to be PostgreSQL.

---

## 19.1 Design Principles

- **Immutability by default**: Assessments, responses, decisions, and item definitions are never mutated after creation.
- **Versioning over mutation**: Problems evolve via major versions; older versions remain queryable.
- **Orthogonality**: Contextual dimensions (role, time, location) are recorded explicitly and independently.
- **Auditability**: Every meaningful action is traceable via explicit entities.
- **Decisions as single source of truth**: All state changes flow through the decisions table.
- **Minimal coupling**: UI state, workflow state, and analytical state are not conflated.
- **Future-proofing**: New inventories, agents, and assessment types require no schema migration.

---

## 19.2 Core Tables

### 19.2.1 `users`

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
| `role` | ENUM | NOT NULL | observer, developer, problem_owner, moderator, admin, agent |
| `is_admin` | BOOLEAN | NOT NULL, default FALSE | Admins subsume moderator rights |
| `created_at` | TIMESTAMP | NOT NULL | |
| `last_login_at` | TIMESTAMP | nullable | |

**Invariants**
- Agents always have `role = agent` and `is_admin = false`
- Problem Owners have `password_hash = NULL` (access via private URL)
- Same email reuses existing user record (lookup before insert)

---

### 19.2.2 `sessions`

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

### 19.2.3 `meetups`

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

### 19.2.4 `problems`

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
| `current_readiness_state` | ENUM | NOT NULL | draft, submitted, accepted, rejected |
| `current_action_state` | ENUM | NOT NULL | backlog, selected_for_meetup, deferred, dropped |

**Invariants**
- Slugs are generated once and never change
- Cached states are updated transactionally with binding decisions
- Archival hides problem from default listings but preserves all data

---

### 19.2.5 `problem_versions`

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

### 19.2.6 `problem_repo_snapshots`

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

### 19.2.7 `inventories`

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

### 19.2.8 `items`

Defines **immutable evaluation items**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `item_id` | UUID | PK | |
| `item_key` | VARCHAR | NOT NULL | Conceptual identity |
| `short_label` | VARCHAR | NOT NULL | Mnemonic |
| `full_text` | TEXT | NOT NULL | Complete question text |
| `max_rating` | INTEGER | NOT NULL | Allowed: 1, 2, 3, 5, 7, 10 |
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

---

### 19.2.9 `inventory_items`

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

### 19.2.10 `assessments`

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

### 19.2.11 `responses`

Stores **atomic answers to items**, with full contextual metadata per response.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `response_id` | UUID | PK | |
| `assessment_id` | UUID | FK → assessments, NOT NULL | |
| `item_id` | UUID | FK → items, NOT NULL | Concrete version at response time |
| `session_id` | UUID | FK → sessions, NOT NULL | |
| `user_id` | UUID | FK → users, nullable | If authenticated |
| `role` | ENUM | NOT NULL | problem_owner, developer, coding_partner, observer, agent |
| `time_context` | ENUM | NOT NULL | pre_meetup, pitch, review, post_meetup, late_reflection |
| `location_context` | ENUM | NOT NULL | in_presence, remote |
| `rating_value` | INTEGER | nullable | NULL = skipped |
| `created_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`assessment_id`, `item_id`, `session_id`)

**Notes**
- Missing responses are represented by absence of a row, not NULL rating_value
- `item_id` locks to concrete item version used at response time

---

### 19.2.12 `decisions`

Canonical **event log** for all decisions, recommendations, and state transitions. This table serves as the activity log for the entire system.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `decision_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `major_version` | INTEGER | NOT NULL | |
| `minor_version` | INTEGER | nullable | |
| `meetup_id` | UUID | FK → meetups, nullable | |
| `decision_type` | ENUM | NOT NULL | Past tense verbs |
| `is_binding` | BOOLEAN | NOT NULL | |
| `actor_user_id` | UUID | FK → users, NOT NULL | |
| `authority_reference` | UUID | FK → users, nullable | For group decisions |
| `rationale` | TEXT | nullable | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Decision Types (past tense)**
- `submitted`, `accepted`, `rejected`
- `selected_for_meetup`, `deferred_po_absent`, `deferred_low_priority`, `deferred_complexity`, `deferred_future_capability`, `dropped_low_relevance`, `dropped_insufficient_quality`
- `opened_for_pitch_assessment`, `closed_for_pitch_assessment`
- `opened_for_review`, `closed_for_review`
- `recommended_acceptance`, `recommended_rejection`, `recommended_deferral`

**Invariants**
- Agents may only create `is_binding = false` entries
- Decisions are append-only, never updated or deleted

---

### 19.2.13 `comments`

Stores **qualitative feedback** separately from decisions.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `comment_id` | UUID | PK | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `problem_version_id` | UUID | FK → problem_versions, nullable | If tied to specific version |
| `session_id` | UUID | FK → sessions, NOT NULL | |
| `user_id` | UUID | FK → users, nullable | If authenticated |
| `actor_role` | ENUM | NOT NULL | problem_owner, developer, observer, moderator, agent |
| `comment_text` | TEXT | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Invariants**
- Comments are append-only, never edited or deleted
- Non-binding by default; do not change system state

---

### 19.2.14 `meetup_problem_queue`

Associates problems with meetups for **backlog management and sprint planning**.

**Columns**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `queue_id` | UUID | PK | |
| `meetup_id` | UUID | FK → meetups, NOT NULL | |
| `problem_id` | UUID | FK → problems, NOT NULL | |
| `queue_state` | ENUM | NOT NULL | candidate, selected_for_pitch, selected_for_coding, completed |
| `position_index` | INTEGER | nullable | For ordering |
| `added_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Constraints**
- UNIQUE (`meetup_id`, `problem_id`)

---

## 19.3 Enumerations

Implemented as PostgreSQL enums:

```sql
CREATE TYPE user_role AS ENUM (
  'observer', 'developer', 'coding_partner', 'problem_owner',
  'moderator', 'admin', 'agent'
);

CREATE TYPE readiness_state AS ENUM (
  'draft', 'submitted', 'accepted', 'rejected'
);

CREATE TYPE action_state AS ENUM (
  'backlog', 'selected_for_meetup', 'deferred', 'dropped'
);

CREATE TYPE time_context AS ENUM (
  'pre_meetup', 'pitch', 'review', 'post_meetup', 'late_reflection'
);

CREATE TYPE location_context AS ENUM (
  'in_presence', 'remote'
);

CREATE TYPE queue_state AS ENUM (
  'candidate', 'selected_for_pitch', 'selected_for_coding', 'completed'
);

CREATE TYPE decision_type AS ENUM (
  'submitted', 'accepted', 'rejected',
  'selected_for_meetup',
  'deferred_po_absent', 'deferred_low_priority',
  'deferred_complexity', 'deferred_future_capability',
  'dropped_low_relevance', 'dropped_insufficient_quality',
  'opened_for_pitch_assessment', 'closed_for_pitch_assessment',
  'opened_for_review', 'closed_for_review',
  'recommended_acceptance', 'recommended_rejection', 'recommended_deferral'
);
```

---

## 19.4 Integrity Constraints and Key Guarantees

- **One active major version per problem**: Enforced via `is_current` flag with unique partial index
- **One active item per item_key**: Enforced via application logic and partial unique index on `retired_at IS NULL`
- **Idempotent session-based responses**: UNIQUE constraint on (`assessment_id`, `item_id`, `session_id`)
- **Decisions are append-only**: No UPDATE or DELETE operations on decisions table
- **Cached states updated transactionally**: `problems.current_*_state` updated atomically with binding decisions
- **Snapshots uniquely map commit SHA → minor_version**: Composite unique constraints

---

## 19.5 Temporal Consistency and Immutability

The system enforces **time-aware consistency** through design rather than heavy locking:

- Items and Inventories are immutable once used in assessments
- Assessments and responses are never updated, only inserted
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

## 19.7 Relationship to Other Chapters

- **Chapter 3**: Roles and authority model → `users.role`, `is_admin`
- **Chapter 4**: Problem identity and versioning → `problems`, `problem_versions`
- **Chapter 7**: Inventories and items → `inventories`, `items`, `inventory_items`
- **Chapter 8**: Assessments → `assessments`, `responses`
- **Chapter 9**: Voting and data capture → `responses` with contextual metadata
- **Chapter 10**: Decisions → `decisions` table
- **Chapter 11**: Meetup model → `meetups`, `meetup_problem_queue`
- **Chapter 16**: Comments → `comments` table
- **Chapter 20**: Traceability → `decisions` as activity log
