-- VibeCoding Professionals Platform - SQLite Schema
-- Generated from specification chapters 19 + 25 (addendum)
--
-- Run with: sqlite3 meetup.db < schema.sql
-- NOTE: PRAGMA foreign_keys = ON must be set at connection time

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- CATALOG TABLES (Reference Data - extensible vocabularies)
--------------------------------------------------------------------------------

-- Decision types (14 types - no recommended_* per Ch.10.2 orthogonality)
CREATE TABLE decision_type_catalog (
  type_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'readiness', 'action', 'assessment'
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- User roles (7 roles)
CREATE TABLE user_role_catalog (
  role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  can_be_admin INTEGER NOT NULL DEFAULT 0 CHECK(can_be_admin IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- Problem readiness states (4 states)
CREATE TABLE readiness_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- Problem action states (4 states)
CREATE TABLE action_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- Time contexts for responses (5 contexts)
CREATE TABLE time_context_catalog (
  context_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- Queue states for meetup problem queue (4 states)
CREATE TABLE queue_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

--------------------------------------------------------------------------------
-- CORE TABLES
--------------------------------------------------------------------------------

-- 19.2.1 users
-- Unified table for all actors: humans and agents
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE,  -- Required for humans; NULL for agents
  display_name TEXT NOT NULL,
  password_hash TEXT,  -- NULL for password-less POs and agents
  role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0,1)),
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

-- 19.2.2 sessions
-- Pseudonymous browser sessions for voting/assessments
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  session_hash TEXT UNIQUE NOT NULL,  -- Salted hash from client
  user_id TEXT REFERENCES users(user_id),  -- Links to authenticated user if logged in
  in_presence INTEGER NOT NULL CHECK(in_presence IN (0,1)),  -- Set once per session
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

-- 19.2.3 meetups
-- Concrete meetup instances
CREATE TABLE meetups (
  meetup_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 19.2.4 problems
-- Problem identity across all versions + cached state
CREATE TABLE problems (
  problem_id TEXT PRIMARY KEY,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  public_slug TEXT UNIQUE NOT NULL,  -- Immutable, generated at creation
  private_slug TEXT UNIQUE NOT NULL,  -- Immutable, generated at creation
  created_at TEXT NOT NULL,
  archived_at TEXT,  -- Soft archive
  current_major_version INTEGER NOT NULL,
  current_readiness_state TEXT NOT NULL REFERENCES readiness_state_catalog(state_key),
  current_action_state TEXT NOT NULL REFERENCES action_state_catalog(state_key)
);

-- 19.2.5 problem_versions
-- Major versions of Problem Cards
CREATE TABLE problem_versions (
  problem_version_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL CHECK(major_version >= 1),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  value_statement TEXT,
  repo_url_primary TEXT NOT NULL,  -- GitHub URL
  repo_url_secondary TEXT,  -- Docs, demo, etc.
  task_count INTEGER NOT NULL CHECK(task_count >= 1),
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  commit_message TEXT,
  is_current INTEGER NOT NULL CHECK(is_current IN (0,1)),
  UNIQUE(problem_id, major_version)
);

-- Enforce: exactly one is_current = 1 per problem_id
CREATE UNIQUE INDEX idx_one_current_version
ON problem_versions(problem_id) WHERE is_current = 1;

-- 19.2.6 problem_repo_snapshots
-- GitHub commit hashes → minor versions
CREATE TABLE problem_repo_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER NOT NULL,
  head_commit_sha TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  UNIQUE(problem_id, major_version, head_commit_sha),
  UNIQUE(problem_id, major_version, minor_version)
);

-- 19.2.7 inventories
-- Reusable evaluation instruments
CREATE TABLE inventories (
  inventory_id TEXT PRIMARY KEY,
  inventory_key TEXT UNIQUE NOT NULL,  -- Human-readable identifier
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL,
  retired_at TEXT
);

-- 19.2.8 items
-- Immutable evaluation items
CREATE TABLE items (
  item_id TEXT PRIMARY KEY,
  item_key TEXT NOT NULL,  -- Conceptual identity
  short_label TEXT NOT NULL,  -- Mnemonic
  full_text TEXT NOT NULL,  -- Complete question text
  max_rating INTEGER NOT NULL,  -- Scale size (e.g., 5, 7, 10)
  label_min TEXT,
  label_low_mid TEXT,  -- For 5+ point scales
  label_mid TEXT,
  label_high_mid TEXT,  -- For 5+ point scales
  label_max TEXT,
  created_at TEXT NOT NULL,
  retired_at TEXT
);

-- Enforce: at most one active item per item_key
CREATE UNIQUE INDEX idx_one_active_item_per_key
ON items(item_key) WHERE retired_at IS NULL;

-- 19.2.9 inventory_items
-- Composition and order of inventory
CREATE TABLE inventory_items (
  inventory_id TEXT NOT NULL REFERENCES inventories(inventory_id),
  item_key TEXT NOT NULL,  -- References concept, not specific version
  position_index INTEGER NOT NULL,
  PRIMARY KEY (inventory_id, item_key),
  UNIQUE(inventory_id, position_index)
);

-- 19.2.10 assessments
-- Application of inventory to problem
CREATE TABLE assessments (
  assessment_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER,  -- From repo snapshot; nullable per Ch.25
  inventory_id TEXT NOT NULL REFERENCES inventories(inventory_id),
  meetup_id TEXT REFERENCES meetups(meetup_id),
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

-- 19.2.11 responses
-- Atomic answers to items with contextual metadata
-- Per Ch.25: supports supersession (INSERT + mark old as superseded)
CREATE TABLE responses (
  response_id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id),
  item_id TEXT NOT NULL REFERENCES items(item_id),  -- Concrete version at response time
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  user_id TEXT REFERENCES users(user_id),  -- If authenticated
  role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  time_context TEXT NOT NULL REFERENCES time_context_catalog(context_key),
  in_presence INTEGER NOT NULL CHECK(in_presence IN (0,1)),  -- TRUE = in-presence, FALSE = remote
  rating_value INTEGER,  -- NULL = skipped
  created_at TEXT NOT NULL,
  -- Supersession tracking (per Ch.25 interview)
  superseded_at TEXT,
  superseded_by_response_id TEXT REFERENCES responses(response_id)
);

-- Note: No UNIQUE constraint - allows supersession per Ch.25 interview decision

-- 19.2.12 decisions
-- Event log for all decisions and state transitions
CREATE TABLE decisions (
  decision_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER,
  meetup_id TEXT REFERENCES meetups(meetup_id),
  decision_type TEXT NOT NULL REFERENCES decision_type_catalog(type_key),
  is_binding INTEGER NOT NULL CHECK(is_binding IN (0,1)),  -- Orthogonal to type per Ch.10.2
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  authority_reference TEXT REFERENCES users(user_id),  -- For group decisions
  rationale TEXT,
  created_at TEXT NOT NULL
);

-- 19.2.13 comments
-- Qualitative feedback (separate from decisions)
CREATE TABLE comments (
  comment_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  problem_version_id TEXT REFERENCES problem_versions(problem_version_id),
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  user_id TEXT REFERENCES users(user_id),  -- If authenticated
  actor_role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  comment_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 19.2.14 meetup_problem_queue
-- Problem-meetup associations for backlog management
CREATE TABLE meetup_problem_queue (
  queue_id TEXT PRIMARY KEY,
  meetup_id TEXT NOT NULL REFERENCES meetups(meetup_id),
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  queue_state TEXT NOT NULL REFERENCES queue_state_catalog(state_key),
  position_index INTEGER,
  added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(meetup_id, problem_id)
);

--------------------------------------------------------------------------------
-- INDEXES for common queries
--------------------------------------------------------------------------------

-- Fast lookup of problems by owner
CREATE INDEX idx_problems_by_owner ON problems(created_by_user_id);

-- Fast lookup of current responses (not superseded)
CREATE INDEX idx_current_responses ON responses(assessment_id, item_id, session_id)
WHERE superseded_at IS NULL;

-- Fast lookup of decisions by problem
CREATE INDEX idx_decisions_by_problem ON decisions(problem_id, created_at);

-- Fast lookup of assessments by problem
CREATE INDEX idx_assessments_by_problem ON assessments(problem_id);

-- Fast lookup of queue by meetup
CREATE INDEX idx_queue_by_meetup ON meetup_problem_queue(meetup_id, position_index);
