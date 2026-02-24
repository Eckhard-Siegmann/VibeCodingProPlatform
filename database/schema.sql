-- VibeCoding Professionals Platform - SQLite Schema
-- Generated from specification Chapter 19 (Data Model and Persistence)
-- Updated: 2026-02-02 - Added events/locations/partners/registrations per Ch.29/30
--
-- Run with: sqlite3 event.db < schema.sql
-- Then run: sqlite3 event.db < seed_reference_data.sql
-- NOTE: PRAGMA foreign_keys = ON must be set at connection time

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- CATALOG TABLES (Reference Data - extensible vocabularies per Ch.19.2)
-- These must be created first as they are referenced by core tables
--------------------------------------------------------------------------------

-- 19.2.1 readiness_state_catalog
-- Defines the intrinsic quality states of a Problem Card (5 states)
CREATE TABLE readiness_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  is_terminal INTEGER NOT NULL DEFAULT 0 CHECK(is_terminal IN (0,1)),
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.2 action_state_catalog
-- Defines the community intent states for a Problem (6 states)
CREATE TABLE action_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  is_terminal INTEGER NOT NULL DEFAULT 0 CHECK(is_terminal IN (0,1)),
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.3 decision_type_catalog
-- Defines all decision types that can be recorded (26 types across 8 categories)
CREATE TABLE decision_type_catalog (
  type_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- lifecycle, quality_gate, planning, sprint, deferral, drop, close, live
  affects_readiness INTEGER NOT NULL DEFAULT 0 CHECK(affects_readiness IN (0,1)),
  affects_action INTEGER NOT NULL DEFAULT 0 CHECK(affects_action IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.4 decision_state_effects
-- Maps each decision type to its resulting state changes
CREATE TABLE decision_state_effects (
  decision_type TEXT PRIMARY KEY REFERENCES decision_type_catalog(type_key),
  new_readiness_state TEXT REFERENCES readiness_state_catalog(state_key),
  new_action_state TEXT REFERENCES action_state_catalog(state_key),
  new_live_mode TEXT CHECK(new_live_mode IN ('idle', 'pitch', 'review'))
);

-- 19.2.5 time_context_catalog
-- Defines temporal contexts for assessments (5 contexts)
CREATE TABLE time_context_catalog (
  context_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.6 user_role_catalog
-- Defines all user roles in the system (7 roles)
CREATE TABLE user_role_catalog (
  role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  can_bind INTEGER NOT NULL DEFAULT 0 CHECK(can_bind IN (0,1)),
  is_human INTEGER NOT NULL DEFAULT 1 CHECK(is_human IN (0,1)),
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.7 auth_provider_catalog
-- Defines authentication providers (local, github, linkedin)
CREATE TABLE auth_provider_catalog (
  provider_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.8 partner_type_catalog
-- Defines types of partner organizations
CREATE TABLE partner_type_catalog (
  type_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.9 chat_context_catalog
-- Context situations for chat messages
CREATE TABLE chat_context_catalog (
  context_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.2.10 resource_type_catalog
-- Types of resources linked to problems (direct, helpful)
CREATE TABLE resource_type_catalog (
  type_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- Queue states for event problem queue (4 states)
CREATE TABLE queue_state_catalog (
  state_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- problem_type_catalog
-- Defines problem classification types (6 types)
CREATE TABLE problem_type_catalog (
  type_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- lesson_category_catalog
-- Predefined categories for lessons learned
CREATE TABLE lesson_category_catalog (
  category_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- team_member_role_catalog
-- Roles within a problem team
CREATE TABLE team_member_role_catalog (
  role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- team_member_status_catalog
-- Status of team membership
CREATE TABLE team_member_status_catalog (
  status_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- emoji_catalog (must be before chat_reactions)
-- Curated set of 10 emojis for reactions
CREATE TABLE emoji_catalog (
  emoji TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);

-- 19.3.32 contribution_action_catalog
-- Point action types with configurable weights (Ch.33)
CREATE TABLE contribution_action_catalog (
  action_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  default_points INTEGER NOT NULL,
  current_points INTEGER NOT NULL,  -- Admin-editable weight
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- 19.3.35 review_weight_catalog
-- Review weightings for star award calculations (Ch.33)
CREATE TABLE review_weight_catalog (
  weight_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  weight_multiplier REAL NOT NULL,  -- 1.0, 1.5, 0.5, etc.
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- milestone_key_catalog
-- Standard milestones for first-time achievements (Ch.33)
CREATE TABLE milestone_key_catalog (
  milestone_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  context_type TEXT,  -- 'problem', 'event', 'team', or NULL
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

-- hint_key_catalog
-- Standard hints for onboarding (Ch.32)
CREATE TABLE hint_key_catalog (
  hint_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  where_shown TEXT,  -- Location in UI
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL
);

--------------------------------------------------------------------------------
-- CORE TABLES
--------------------------------------------------------------------------------

-- 19.3.1 users
-- Unified table for all actors: humans and agents
-- Extended with auth fields per Ch.18 and Ch.30
-- Extended with preference fields per Ch.32 and Ch.33
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE,  -- Required for humans; NULL for agents
  display_name TEXT NOT NULL,
  password_hash TEXT,  -- NULL for OAuth users and agents
  auth_provider TEXT NOT NULL DEFAULT 'local' REFERENCES auth_provider_catalog(provider_key),
  github_id TEXT UNIQUE,  -- GitHub user ID for OAuth
  linkedin_id TEXT UNIQUE,  -- LinkedIn user ID for OAuth
  role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0,1)),
  email_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(email_confirmed IN (0,1)),
  email_confirm_hash TEXT,  -- Confirmation token
  email_confirm_expires_at TEXT,  -- 24h validity
  login_enabled INTEGER NOT NULL DEFAULT 0 CHECK(login_enabled IN (0,1)),  -- FALSE until password set via OTP
  otp_hash TEXT,  -- One-time password hash (for password initialization, not login)
  otp_is_initial INTEGER NOT NULL DEFAULT 0 CHECK(otp_is_initial IN (0,1)),
  get_infoletter INTEGER NOT NULL DEFAULT 1 CHECK(get_infoletter IN (0,1)),
  terms_accepted_at TEXT,  -- When T&C were accepted
  show_on_contributor_wall INTEGER NOT NULL DEFAULT 1 CHECK(show_on_contributor_wall IN (0,1)),  -- Ch.33: Opt-out from public wall
  show_first_time_hints INTEGER NOT NULL DEFAULT 1 CHECK(show_first_time_hints IN (0,1)),  -- Ch.32: Show onboarding hints
  audio_cues_enabled INTEGER NOT NULL DEFAULT 0 CHECK(audio_cues_enabled IN (0,1)),  -- Ch.14.5.1: Countdown timer audio alerts
  api_key_id TEXT REFERENCES api_keys(api_key_id),  -- Links bot users to their API key (NULL for humans)
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

-- 19.3.2 sessions table REMOVED
-- All participation requires authentication (mandatory user_id)

-- 19.3.39 api_keys
-- API keys for bot authentication (created and revoked by human users)
-- Temporal validity follows waitlist_expires_at pattern from event_registrations
-- Note: users.api_key_id references this table; circular dependency resolved by
-- creating api_keys after users (SQLite validates FKs at DML time, not DDL time)
CREATE TABLE api_keys (
  api_key_id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(user_id),
  key_hash TEXT NOT NULL,  -- SHA-256 hash of the API key (plaintext never stored)
  display_prefix TEXT NOT NULL,  -- First 8 chars of key for identification in UI
  label TEXT,  -- Human-readable label (e.g., "My Claude bot")
  valid_from TEXT NOT NULL,  -- Key becomes active at this time
  valid_until TEXT,  -- Key expires at this time; NULL = no expiry
  revoked_at TEXT,  -- Set when owner revokes; NULL = not revoked
  created_at TEXT NOT NULL
);

-- 19.3.3 partners
-- Partner organizations that host or co-host events
CREATE TABLE partners (
  partner_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  partner_type TEXT NOT NULL REFERENCES partner_type_catalog(type_key),
  description TEXT,
  created_at TEXT NOT NULL
);

-- 19.3.4 locations
-- Physical venues where events can be held
CREATE TABLE locations (
  location_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 19.3.5 rooms
-- Specific rooms within a location with capacity
CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(location_id),
  name TEXT NOT NULL,
  max_pax_tables INTEGER NOT NULL,
  max_pax_no_tables INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- 19.3.6 events
-- Concrete event instances (replaces simpler events table)
CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,  -- Human-readable URL slug
  partner_id TEXT NOT NULL REFERENCES partners(partner_id),
  room_id TEXT NOT NULL REFERENCES rooms(room_id),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  planned_ends_at TEXT NOT NULL,
  host_user_id TEXT NOT NULL REFERENCES users(user_id),
  co_host_1_user_id TEXT REFERENCES users(user_id),
  co_host_2_user_id TEXT REFERENCES users(user_id),
  website_url TEXT,
  linkedin_url TEXT,
  x_post_url TEXT,
  image_url TEXT,
  overbooking_factor REAL NOT NULL DEFAULT 1.30,
  created_at TEXT NOT NULL
);

-- 19.3.7 event_registrations
-- User registrations for events with waitlist support
CREATE TABLE event_registrations (
  registration_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(event_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  in_presence INTEGER NOT NULL DEFAULT 1 CHECK(in_presence IN (0,1)),
  waitlist_position INTEGER,  -- NULL if not on waitlist
  waitlist_invited_at TEXT,
  waitlist_expires_at TEXT,  -- 24h from invite
  registered_at TEXT NOT NULL,
  cancelled_at TEXT,
  UNIQUE(event_id, user_id)
);

-- 19.3.8 event_attendance
-- Tracks actual attendance for overbooking optimization
CREATE TABLE event_attendance (
  attendance_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(event_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  showed_up INTEGER NOT NULL CHECK(showed_up IN (0,1)),
  recorded_at TEXT NOT NULL,
  UNIQUE(event_id, user_id)
);

-- 19.3.9 problems
-- Problem identity across all versions + cached state
CREATE TABLE problems (
  problem_id TEXT PRIMARY KEY,
  created_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  deputy_owner_user_id TEXT REFERENCES users(user_id),
  problem_type TEXT NOT NULL DEFAULT 'greenfield' REFERENCES problem_type_catalog(type_key),
  public_slug TEXT UNIQUE NOT NULL,
  private_slug TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT,
  current_major_version INTEGER NOT NULL,
  current_readiness_state TEXT NOT NULL DEFAULT 'draft' REFERENCES readiness_state_catalog(state_key),
  current_action_state TEXT NOT NULL DEFAULT 'backlog' REFERENCES action_state_catalog(state_key)
);

-- 19.3.10 problem_versions
-- Major versions of Problem Cards
CREATE TABLE problem_versions (
  problem_version_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL CHECK(major_version >= 1),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  value_statement TEXT,
  repo_url_primary TEXT NOT NULL,
  repo_url_secondary TEXT,
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

-- 19.3.11 problem_repo_snapshots
-- GitHub commit hashes mapped to minor versions
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

-- 19.3.12 problem_resources
-- URLs and resources associated with problems
CREATE TABLE problem_resources (
  resource_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL REFERENCES resource_type_catalog(type_key),
  added_by_user_id TEXT NOT NULL REFERENCES users(user_id),
  approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1)),
  approved_by_user_id TEXT REFERENCES users(user_id),
  created_at TEXT NOT NULL
);

-- 19.3.13 event_live_context
-- Caches the current live orchestration state for an event
-- Extended with timer fields per Ch.14.5
CREATE TABLE event_live_context (
  event_id TEXT PRIMARY KEY REFERENCES events(event_id),
  current_problem_id TEXT REFERENCES problems(problem_id),
  current_mode TEXT NOT NULL DEFAULT 'idle' CHECK(current_mode IN ('idle', 'pitch', 'review')),
  mode_opened_at TEXT,
  timer_duration_minutes INTEGER,  -- Ch.14.5: Countdown timer duration
  timer_ends_at TEXT,  -- Ch.14.5: When countdown expires (NULL = no timer)
  updated_at TEXT NOT NULL
);

-- 19.3.14 inventories
-- Reusable evaluation instruments
CREATE TABLE inventories (
  inventory_id TEXT PRIMARY KEY,
  inventory_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL,
  retired_at TEXT
);

-- 19.3.15 items
-- Immutable evaluation items
CREATE TABLE items (
  item_id TEXT PRIMARY KEY,
  item_key TEXT NOT NULL,
  short_label TEXT NOT NULL,
  item_text TEXT NOT NULL,  -- Complete question text (renamed from full_text)
  max_rating INTEGER NOT NULL,
  label_min TEXT,
  label_low_mid TEXT,
  label_mid TEXT,
  label_high_mid TEXT,
  label_max TEXT,
  created_at TEXT NOT NULL,
  retired_at TEXT
);

-- Enforce: at most one active item per item_key
CREATE UNIQUE INDEX idx_one_active_item_per_key
ON items(item_key) WHERE retired_at IS NULL;

-- 19.3.16 inventory_items
-- Composition and order of inventory
CREATE TABLE inventory_items (
  inventory_id TEXT NOT NULL REFERENCES inventories(inventory_id),
  item_key TEXT NOT NULL,
  position_index INTEGER NOT NULL,
  PRIMARY KEY (inventory_id, item_key),
  UNIQUE(inventory_id, position_index)
);

-- 19.3.17 assessments
-- Application of inventory to problem
CREATE TABLE assessments (
  assessment_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER,
  inventory_id TEXT NOT NULL REFERENCES inventories(inventory_id),
  event_id TEXT REFERENCES events(event_id),
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

-- 19.3.18 responses
-- Atomic answers to items with contextual metadata
-- All responses require authentication (user_id NOT NULL)
-- Extended with review_weight_key per Ch.33
CREATE TABLE responses (
  response_id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(assessment_id),
  item_id TEXT NOT NULL REFERENCES items(item_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  time_context TEXT NOT NULL REFERENCES time_context_catalog(context_key),
  in_presence INTEGER NOT NULL CHECK(in_presence IN (0,1)),
  rating_value INTEGER,
  review_weight_key TEXT REFERENCES review_weight_catalog(weight_key),  -- Ch.33: Weight context for star calculations
  created_at TEXT NOT NULL,
  superseded_at TEXT,
  superseded_by_response_id TEXT REFERENCES responses(response_id)
);

-- 19.3.19 decisions
-- Canonical event log for all decisions and state transitions
CREATE TABLE decisions (
  decision_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER,
  event_id TEXT REFERENCES events(event_id),
  decision_type TEXT NOT NULL REFERENCES decision_type_catalog(type_key),
  is_binding INTEGER NOT NULL CHECK(is_binding IN (0,1)),
  actor_user_id TEXT NOT NULL REFERENCES users(user_id),
  authority_reference TEXT REFERENCES users(user_id),
  rationale TEXT,
  created_at TEXT NOT NULL
);

-- 19.3.19 event_problem_queue
-- Problem-event associations for backlog management
CREATE TABLE event_problem_queue (
  queue_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(event_id),
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  queue_state TEXT NOT NULL REFERENCES queue_state_catalog(state_key),
  position_index INTEGER,
  added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(event_id, problem_id)
);

--------------------------------------------------------------------------------
-- TEAM AND COLLABORATION TABLES
--------------------------------------------------------------------------------

-- 19.3.22 problem_teams
-- Teams formed around a problem at a specific event
CREATE TABLE problem_teams (
  team_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  event_id TEXT NOT NULL REFERENCES events(event_id),
  breakout_room_url TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(problem_id, event_id)
);

-- 19.3.23 problem_team_members
-- Team membership with version-scoped onboarding
CREATE TABLE problem_team_members (
  team_id TEXT NOT NULL REFERENCES problem_teams(team_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  problem_version_id TEXT NOT NULL REFERENCES problem_versions(problem_version_id),
  joined_at TEXT NOT NULL,
  solution_repo_url TEXT,
  member_role TEXT NOT NULL DEFAULT 'coder' REFERENCES team_member_role_catalog(role_key),
  status TEXT NOT NULL DEFAULT 'active' REFERENCES team_member_status_catalog(status_key),
  retired_at TEXT,
  rejoined_at TEXT,
  PRIMARY KEY (team_id, user_id, problem_version_id)
);

--------------------------------------------------------------------------------
-- LESSONS LEARNED TABLE
--------------------------------------------------------------------------------

-- 19.3.24 lessons_learned
-- Structured capture of insights per problem
CREATE TABLE lessons_learned (
  lesson_id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  event_id TEXT REFERENCES events(event_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  content TEXT NOT NULL,
  category TEXT REFERENCES lesson_category_catalog(category_key),
  tags TEXT,  -- JSON array
  valuable INTEGER NOT NULL DEFAULT 0 CHECK(valuable IN (0,1)),
  created_at TEXT NOT NULL,
  edited_at TEXT
);

--------------------------------------------------------------------------------
-- CHAT TABLES
--------------------------------------------------------------------------------

-- 19.3.25 chat_messages
-- Atomic chat messages with rich contextual metadata
CREATE TABLE chat_messages (
  message_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  problem_id TEXT REFERENCES problems(problem_id),
  problem_version_id TEXT REFERENCES problem_versions(problem_version_id),
  major_version INTEGER NOT NULL,
  minor_version INTEGER,
  event_id TEXT REFERENCES events(event_id),
  team_id TEXT REFERENCES problem_teams(team_id),
  context_situation TEXT NOT NULL REFERENCES chat_context_catalog(context_key),
  content TEXT NOT NULL,
  reply_to_message_id TEXT REFERENCES chat_messages(message_id),
  url_disclosed INTEGER NOT NULL DEFAULT 0 CHECK(url_disclosed IN (0,1)),
  valuable_insight INTEGER NOT NULL DEFAULT 0 CHECK(valuable_insight IN (0,1)),
  valuable_link INTEGER NOT NULL DEFAULT 0 CHECK(valuable_link IN (0,1)),
  is_bot INTEGER NOT NULL DEFAULT 0 CHECK(is_bot IN (0,1)),
  author_role TEXT NOT NULL REFERENCES user_role_catalog(role_key),
  visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN (0,1)),
  created_at TEXT NOT NULL,
  edited_at TEXT
);

-- 19.3.26 chat_mentions
-- @mention tracking for notifications
CREATE TABLE chat_mentions (
  mention_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES chat_messages(message_id),
  mentioned_user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TEXT NOT NULL,
  UNIQUE(message_id, mentioned_user_id)
);

-- 19.3.27 chat_reactions
-- Emoji reactions to messages (emoji_catalog defined earlier)
CREATE TABLE chat_reactions (
  reaction_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES chat_messages(message_id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  emoji TEXT NOT NULL REFERENCES emoji_catalog(emoji),
  created_at TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

--------------------------------------------------------------------------------
-- CONTRIBUTOR RECOGNITION TABLES (Ch.33)
--------------------------------------------------------------------------------

-- 19.3.33 contribution_points
-- Append-only ledger of points awarded to users
CREATE TABLE contribution_points (
  contribution_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  action_key TEXT NOT NULL REFERENCES contribution_action_catalog(action_key),
  points_awarded INTEGER NOT NULL,  -- Snapshot of current_points at award time
  source_type TEXT NOT NULL,  -- 'response', 'chat_message', 'decision', 'problem', 'lesson'
  source_id TEXT NOT NULL,  -- FK to source record (validated at app layer)
  event_id TEXT REFERENCES events(event_id),  -- NULL for non-event actions
  awarded_at TEXT NOT NULL,
  UNIQUE(user_id, action_key, source_type, source_id)  -- Prevent double-awarding
);

-- 19.3.34 star_awards
-- Hacking excellence awards (1st, 2nd, 3rd place)
CREATE TABLE star_awards (
  award_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  problem_id TEXT NOT NULL REFERENCES problems(problem_id),
  event_id TEXT NOT NULL REFERENCES events(event_id),
  place INTEGER NOT NULL CHECK(place IN (1, 2, 3)),
  stars_awarded INTEGER NOT NULL,  -- 3 for 1st, 2 for 2nd, 1 for 3rd
  awarded_by_user_id TEXT NOT NULL REFERENCES users(user_id),  -- Moderator
  awarded_at TEXT NOT NULL,
  UNIQUE(problem_id, event_id, place),  -- One award per place per problem per event
  UNIQUE(problem_id, event_id, user_id)  -- One user can only win one place per problem
);

--------------------------------------------------------------------------------
-- ONBOARDING AND ENGAGEMENT TABLES (Ch.32, Ch.33)
--------------------------------------------------------------------------------

-- 19.3.37 user_milestones
-- Tracks first-time achievements for celebration moments
CREATE TABLE user_milestones (
  milestone_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  milestone_key TEXT NOT NULL REFERENCES milestone_key_catalog(milestone_key),
  achieved_at TEXT NOT NULL,
  context_id TEXT,  -- Related entity (problem_id, event_id, etc.)
  context_type TEXT,  -- Type of context ('problem', 'event', 'team')
  UNIQUE(user_id, milestone_key)  -- Each milestone achieved once per user
);

-- 19.3.38 user_hint_dismissals
-- Tracks dismissed onboarding hints
CREATE TABLE user_hint_dismissals (
  user_id TEXT NOT NULL REFERENCES users(user_id),
  hint_key TEXT NOT NULL REFERENCES hint_key_catalog(hint_key),
  dismissed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, hint_key)
);

--------------------------------------------------------------------------------
-- INDEXES for common queries
--------------------------------------------------------------------------------

-- Problems
CREATE INDEX idx_problems_by_owner ON problems(created_by_user_id);

-- Responses
CREATE INDEX idx_current_responses ON responses(assessment_id, item_id, user_id)
WHERE superseded_at IS NULL;

-- Decisions
CREATE INDEX idx_decisions_by_problem ON decisions(problem_id, created_at);
CREATE INDEX idx_binding_decisions ON decisions(problem_id, is_binding, created_at)
WHERE is_binding = 1;

-- Assessments
CREATE INDEX idx_assessments_by_problem ON assessments(problem_id);

-- Event queue
CREATE INDEX idx_queue_by_event ON event_problem_queue(event_id, position_index);

-- Items
CREATE INDEX idx_active_items ON items(item_key) WHERE retired_at IS NULL;

-- Teams
CREATE INDEX idx_teams_by_problem ON problem_teams(problem_id);
CREATE INDEX idx_team_members_by_team ON problem_team_members(team_id);
CREATE INDEX idx_active_team_members ON problem_team_members(team_id, user_id)
WHERE status = 'active';

-- Lessons
CREATE INDEX idx_lessons_by_problem ON lessons_learned(problem_id, created_at);
CREATE INDEX idx_valuable_lessons ON lessons_learned(problem_id)
WHERE valuable = 1;

-- Chat
CREATE INDEX idx_chat_by_problem ON chat_messages(problem_id, created_at);
CREATE INDEX idx_chat_by_version ON chat_messages(problem_id, major_version, created_at);
CREATE INDEX idx_chat_by_team ON chat_messages(team_id, created_at);
CREATE INDEX idx_visible_chat ON chat_messages(problem_id, created_at)
WHERE visible = 1;
CREATE INDEX idx_mentions_by_user ON chat_mentions(mentioned_user_id);
CREATE INDEX idx_reactions_by_message ON chat_reactions(message_id);

-- Events
CREATE INDEX idx_events_by_partner ON events(partner_id);
CREATE INDEX idx_events_by_date ON events(starts_at);
CREATE INDEX idx_registrations_by_event ON event_registrations(event_id);
CREATE INDEX idx_registrations_by_user ON event_registrations(user_id);

-- Resources
CREATE INDEX idx_resources_by_problem ON problem_resources(problem_id);

-- Contributor Recognition (Ch.33)
CREATE INDEX idx_contribution_points_by_user ON contribution_points(user_id, awarded_at);
CREATE INDEX idx_contribution_points_recent ON contribution_points(awarded_at);
CREATE INDEX idx_star_awards_by_user ON star_awards(user_id);
CREATE INDEX idx_star_awards_by_problem ON star_awards(problem_id, event_id);

-- User Milestones (Ch.33)
CREATE INDEX idx_milestones_by_user ON user_milestones(user_id);

-- User Hints (Ch.32)
CREATE INDEX idx_hints_by_user ON user_hint_dismissals(user_id);

-- API Keys (Ch.18.13, Ch.19.3.39)
CREATE INDEX idx_api_keys_by_owner ON api_keys(owner_user_id);
CREATE INDEX idx_api_keys_active ON api_keys(key_hash)
WHERE revoked_at IS NULL;
CREATE INDEX idx_users_by_api_key ON users(api_key_id)
WHERE api_key_id IS NOT NULL;
