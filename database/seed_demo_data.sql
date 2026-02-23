-- VibeCoding Professionals Platform - Demo / Prepopulation Data
-- Creates demo users, problems, versions, decisions, and assessments
-- Run AFTER: schema.sql and seed_reference_data.sql
--
-- Demo user IDs match the hardcoded auth in lib/server/auth.ts
-- Problem slugs match the links on the landing page (+page.svelte)

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- 1. DEMO USERS
--------------------------------------------------------------------------------

INSERT INTO users (user_id, email, display_name, password_hash, auth_provider, role, is_admin, email_confirmed, login_enabled, get_infoletter, terms_accepted_at, show_on_contributor_wall, show_first_time_hints, created_at) VALUES
  ('demo-user-001', 'max.mustermann@startplatz.de', 'Max Mustermann', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-15T10:00:00Z', 1, 1, '2026-01-15T10:00:00Z'),
  ('demo-user-002', 'eva.schmidt@example.com', 'Eva Schmidt', NULL, 'local', 'moderator', 0, 1, 1, 1, '2026-01-10T09:00:00Z', 1, 1, '2026-01-10T09:00:00Z'),
  ('demo-user-003', 'tom.weber@example.com', 'Tom Weber', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-20T14:00:00Z', 1, 1, '2026-01-20T14:00:00Z'),
  ('demo-user-004', 'lisa.chen@example.com', 'Lisa Chen', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-22T11:00:00Z', 1, 1, '2026-01-22T11:00:00Z'),
  ('demo-admin-001', 'admin@vibecoding.dev', 'Admin User', NULL, 'local', 'admin', 1, 1, 1, 1, '2026-01-01T00:00:00Z', 0, 0, '2026-01-01T00:00:00Z');

--------------------------------------------------------------------------------
-- 2. PARTNER, LOCATION, ROOM, EVENT (for assessment context)
--------------------------------------------------------------------------------

INSERT INTO partners (partner_id, name, logo_url, website_url, contact_name, contact_email, partner_type, description, created_at) VALUES
  ('partner-startplatz', 'STARTPLATZ', 'https://startplatz.de/logo.png', 'https://startplatz.de', 'Maria Koenig', 'maria@startplatz.de', 'coworking', 'STARTPLATZ Cologne coworking and startup incubator', '2026-01-01T00:00:00Z');

INSERT INTO locations (location_id, name, address, city, created_at) VALUES
  ('loc-cologne', 'STARTPLATZ Cologne', 'Im Mediapark 5, 50670 Köln', 'Cologne', '2026-01-01T00:00:00Z');

INSERT INTO rooms (room_id, location_id, name, max_pax_tables, max_pax_no_tables, created_at) VALUES
  ('room-main', 'loc-cologne', 'Main Event Space', 30, 50, '2026-01-01T00:00:00Z');

INSERT INTO events (event_id, slug, partner_id, room_id, title, description, starts_at, planned_ends_at, host_user_id, website_url, overbooking_factor, created_at) VALUES
  ('event-feb-2026', 'cologne-feb-2026', 'partner-startplatz', 'room-main', 'VibeCoding Cologne February 2026', 'Monthly VibeCoding Professionals meetup at STARTPLATZ Cologne. Explore AI-assisted coding tools and compare approaches.', '2026-02-28T17:00:00Z', '2026-02-28T20:00:00Z', 'demo-user-002', 'https://vibecoding.dev/events/cologne-feb-2026', 1.30, '2026-02-01T00:00:00Z');

--------------------------------------------------------------------------------
-- 3. PROBLEMS (3 demo problems matching landing page slugs)
--------------------------------------------------------------------------------

-- Problem 1: RAG Retrieval Quality (slug 11 / 111) — ready, selected_for_event
INSERT INTO problems (problem_id, created_by_user_id, problem_type, public_slug, private_slug, created_at, current_major_version, current_readiness_state, current_action_state) VALUES
  ('prob-rag-001', 'demo-user-001', 'greenfield', '11', '111', '2026-01-20T10:00:00Z', 2, 'ready', 'selected_for_event');

-- Problem 2: Code Evaluation Agent (slug 22 / 222) — submitted, backlog
INSERT INTO problems (problem_id, created_by_user_id, problem_type, public_slug, private_slug, created_at, current_major_version, current_readiness_state, current_action_state) VALUES
  ('prob-eval-002', 'demo-user-003', 'advanced_greenfield', '22', '222', '2026-01-25T14:00:00Z', 1, 'submitted', 'backlog');

-- Problem 3: DSPy Optimization (slug 33 / 333) — draft, backlog
INSERT INTO problems (problem_id, created_by_user_id, problem_type, public_slug, private_slug, created_at, current_major_version, current_readiness_state, current_action_state) VALUES
  ('prob-dspy-003', 'demo-user-001', 'explorative', '33', '333', '2026-02-01T09:00:00Z', 1, 'draft', 'backlog');

--------------------------------------------------------------------------------
-- 4. PROBLEM VERSIONS
--------------------------------------------------------------------------------

-- RAG Problem: v1 (historical) + v2 (current)
INSERT INTO problem_versions (problem_version_id, problem_id, major_version, title, description, value_statement, repo_url_primary, repo_url_secondary, task_count, created_at, created_by_user_id, commit_message, is_current) VALUES
  ('pv-rag-v1', 'prob-rag-001', 1,
   'RAG Retrieval Quality Benchmark',
   'Build a benchmark suite that measures retrieval quality in Retrieval-Augmented Generation (RAG) systems. The tool should evaluate precision, recall, and relevance of retrieved context chunks against a known ground truth dataset.',
   'Enables systematic comparison of RAG pipeline configurations — embedding models, chunk sizes, retrieval strategies — using objective quality metrics instead of subjective impressions.',
   'https://github.com/demo/rag-benchmark', NULL, 5,
   '2026-01-20T10:00:00Z', 'demo-user-001', 'Initial draft', 0);

INSERT INTO problem_versions (problem_version_id, problem_id, major_version, title, description, value_statement, repo_url_primary, repo_url_secondary, task_count, created_at, created_by_user_id, commit_message, is_current) VALUES
  ('pv-rag-v2', 'prob-rag-001', 2,
   'RAG Retrieval Quality Benchmark',
   'Build a benchmark suite that measures retrieval quality in Retrieval-Augmented Generation (RAG) systems. The tool should evaluate precision, recall, and relevance of retrieved context chunks against a known ground truth dataset.

Acceptance Criteria:
1. CLI tool that accepts a dataset of questions + known relevant passages
2. Runs retrieval against a configurable RAG pipeline
3. Computes precision@k, recall@k, and MRR for each query
4. Outputs results as JSON and a summary table
5. Supports at least 2 embedding models (OpenAI, local)',
   'Enables systematic comparison of RAG pipeline configurations — embedding models, chunk sizes, retrieval strategies — using objective quality metrics instead of subjective impressions.',
   'https://github.com/demo/rag-benchmark', NULL, 5,
   '2026-01-28T15:00:00Z', 'demo-user-001', 'Added detailed acceptance criteria after moderator feedback', 1);

-- Code Eval Problem: v1 (current, submitted)
INSERT INTO problem_versions (problem_version_id, problem_id, major_version, title, description, value_statement, repo_url_primary, repo_url_secondary, task_count, created_at, created_by_user_id, commit_message, is_current) VALUES
  ('pv-eval-v1', 'prob-eval-002', 1,
   'Code Evaluation Agent',
   'Create an AI agent that evaluates code quality along the six dimensions defined by the VibeCoding quality model: Correctness, Test Support, Readability, Simplicity, Elegance, and Extensibility.

Acceptance Criteria:
1. Agent accepts a GitHub repo URL and a problem description
2. Produces structured ratings (1-5) for each quality dimension
3. Provides rationale for each rating with code references
4. Outputs a JSON report compatible with the VibeCoding assessment format
5. Works with Python and TypeScript repositories',
   'Bootstraps the agent-assisted review pipeline that the VibeCoding community needs for scaling code quality assessment beyond live events.',
   'https://github.com/demo/code-eval-agent', NULL, 5,
   '2026-01-25T14:00:00Z', 'demo-user-003', NULL, 1);

-- DSPy Problem: v1 (current, draft)
INSERT INTO problem_versions (problem_version_id, problem_id, major_version, title, description, value_statement, repo_url_primary, repo_url_secondary, task_count, created_at, created_by_user_id, commit_message, is_current) VALUES
  ('pv-dspy-v1', 'prob-dspy-003', 1,
   'DSPy Prompt Optimization Pipeline',
   'Implement a DSPy-based optimization pipeline that treats LLM prompts as optimizable artifacts. Given a set of test cases (input/expected output pairs), the pipeline should iteratively refine prompts to maximize accuracy.

This is an explorative problem — the goal is to learn whether DSPy-style optimization is practical for the kinds of tasks we encounter in our community.',
   'If successful, this becomes a reusable methodology for every problem that involves LLM prompting — systematic improvement instead of manual trial-and-error.',
   'https://github.com/demo/dspy-pipeline', NULL, 3,
   '2026-02-01T09:00:00Z', 'demo-user-001', NULL, 1);

--------------------------------------------------------------------------------
-- 5. DECISIONS (history for demo problems)
--------------------------------------------------------------------------------

-- RAG Problem decisions (rich history)
INSERT INTO decisions (decision_id, problem_id, major_version, decision_type, is_binding, actor_user_id, rationale, created_at) VALUES
  ('dec-rag-01', 'prob-rag-001', 1, 'problem_created', 1, 'demo-user-001', NULL, '2026-01-20T10:00:00Z'),
  ('dec-rag-02', 'prob-rag-001', 1, 'problem_submitted', 1, 'demo-user-001', NULL, '2026-01-20T10:30:00Z'),
  ('dec-rag-03', 'prob-rag-001', 1, 'quality_gate_needs_changes', 1, 'demo-user-002', 'Good problem! Please add specific acceptance criteria and clarify which embedding models should be supported.', '2026-01-22T09:00:00Z'),
  ('dec-rag-04', 'prob-rag-001', 2, 'problem_updated', 1, 'demo-user-001', 'Added detailed acceptance criteria per moderator feedback', '2026-01-28T15:00:00Z'),
  ('dec-rag-05', 'prob-rag-001', 2, 'problem_submitted', 1, 'demo-user-001', NULL, '2026-01-28T15:30:00Z'),
  ('dec-rag-06', 'prob-rag-001', 2, 'quality_gate_accepted', 1, 'demo-user-002', 'Acceptance criteria are now clear and testable. Ready for pitching.', '2026-01-29T11:00:00Z'),
  ('dec-rag-07', 'prob-rag-001', 2, 'selected_for_event', 1, 'demo-user-002', 'Selected for February 2026 Cologne event', '2026-02-01T10:00:00Z');

-- Code Eval decisions (submitted, awaiting review)
INSERT INTO decisions (decision_id, problem_id, major_version, decision_type, is_binding, actor_user_id, rationale, created_at) VALUES
  ('dec-eval-01', 'prob-eval-002', 1, 'problem_created', 1, 'demo-user-003', NULL, '2026-01-25T14:00:00Z'),
  ('dec-eval-02', 'prob-eval-002', 1, 'problem_submitted', 1, 'demo-user-003', NULL, '2026-01-25T14:30:00Z');

-- DSPy decisions (just created, still draft)
INSERT INTO decisions (decision_id, problem_id, major_version, decision_type, is_binding, actor_user_id, rationale, created_at) VALUES
  ('dec-dspy-01', 'prob-dspy-003', 1, 'problem_created', 1, 'demo-user-001', NULL, '2026-02-01T09:00:00Z');

--------------------------------------------------------------------------------
-- 6. ASSESSMENTS (linked to problems for the assess/ routes)
--------------------------------------------------------------------------------

-- Pitch assessment for RAG problem (open)
INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at, closed_at) VALUES
  ('pitch-11', 'prob-rag-001', 2, '4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'event-feb-2026', '2026-02-28T17:15:00Z', NULL);

-- Review assessment for RAG problem (open)
INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at, closed_at) VALUES
  ('review-11', 'prob-rag-001', 2, '9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'event-feb-2026', '2026-02-28T19:30:00Z', NULL);

--------------------------------------------------------------------------------
-- 7. EVENT REGISTRATIONS (some demo registrations)
--------------------------------------------------------------------------------

INSERT INTO event_registrations (registration_id, event_id, user_id, in_presence, registered_at) VALUES
  ('reg-001', 'event-feb-2026', 'demo-user-001', 1, '2026-02-05T10:00:00Z'),
  ('reg-002', 'event-feb-2026', 'demo-user-003', 1, '2026-02-06T14:00:00Z'),
  ('reg-003', 'event-feb-2026', 'demo-user-004', 1, '2026-02-07T11:00:00Z');

--------------------------------------------------------------------------------
-- 8. EVENT PROBLEM QUEUE
--------------------------------------------------------------------------------

INSERT INTO event_problem_queue (queue_id, event_id, problem_id, queue_state, position_index, added_at, updated_at) VALUES
  ('epq-001', 'event-feb-2026', 'prob-rag-001', 'selected_for_pitch', 1, '2026-02-01T10:00:00Z', '2026-02-01T10:00:00Z');
