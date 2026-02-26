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

-- Human users (api_key_id = NULL for all humans)
INSERT INTO users (user_id, email, display_name, password_hash, auth_provider, role, is_admin, email_confirmed, login_enabled, get_infoletter, terms_accepted_at, show_on_contributor_wall, show_first_time_hints, api_key_id, created_at) VALUES
  ('demo-user-001', 'max.mustermann@startplatz.de', 'Max Mustermann', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-15T10:00:00Z', 1, 1, NULL, '2026-01-15T10:00:00Z'),
  ('demo-user-002', 'eva.schmidt@example.com', 'Eva Schmidt', NULL, 'local', 'moderator', 0, 1, 1, 1, '2026-01-10T09:00:00Z', 1, 1, NULL, '2026-01-10T09:00:00Z'),
  ('demo-user-003', 'tom.weber@example.com', 'Tom Weber', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-20T14:00:00Z', 1, 1, NULL, '2026-01-20T14:00:00Z'),
  ('demo-user-004', 'lisa.chen@example.com', 'Lisa Chen', NULL, 'local', 'developer', 0, 1, 1, 1, '2026-01-22T11:00:00Z', 1, 1, NULL, '2026-01-22T11:00:00Z'),
  ('demo-admin-001', 'admin@vibecoding.dev', 'Admin User', NULL, 'local', 'admin', 1, 1, 1, 1, '2026-01-01T00:00:00Z', 0, 0, NULL, '2026-01-01T00:00:00Z');

-- Demo API key owned by Admin User
INSERT INTO api_keys (api_key_id, owner_user_id, key_hash, display_prefix, label, valid_from, valid_until, revoked_at, created_at) VALUES
  ('demo-apikey-001', 'demo-admin-001',
   'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',  -- SHA-256 of '123' (demo only)
   'demo1234', 'Demo Review Bot', '2026-01-01T00:00:00Z', NULL, NULL, '2026-01-01T00:00:00Z');

-- Bot user linked to the demo API key (display_name = "Bot of {owner.display_name}")
INSERT INTO users (user_id, email, display_name, password_hash, auth_provider, role, is_admin, email_confirmed, login_enabled, get_infoletter, terms_accepted_at, show_on_contributor_wall, show_first_time_hints, api_key_id, created_at) VALUES
  ('demo-bot-001', NULL, 'Bot of Admin User', NULL, 'local', 'agent', 0, 0, 0, 0, NULL, 0, 0, 'demo-apikey-001', '2026-01-01T00:00:00Z');

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
-- 5b. PROBLEM RESOURCES (Ch.6.2, Ch.19.3.24)
--------------------------------------------------------------------------------

-- RAG problem: Direct resources (auto-approved by PO)
INSERT INTO problem_resources (resource_id, problem_id, url, title, resource_type, added_by_user_id, approved, approved_by_user_id, created_at) VALUES
  ('res-rag-01', 'prob-rag-001', 'https://github.com/demo/rag-retrieval-quality', 'Main Repository', 'direct', 'demo-user-001', 1, 'demo-user-001', '2026-01-20T10:30:00Z'),
  ('res-rag-02', 'prob-rag-001', 'https://github.com/demo/rag-test-suite', 'Test Suite', 'direct', 'demo-user-001', 1, 'demo-user-001', '2026-01-20T10:35:00Z');

-- RAG problem: Helpful artifacts
INSERT INTO problem_resources (resource_id, problem_id, url, title, resource_type, added_by_user_id, approved, approved_by_user_id, created_at) VALUES
  ('res-rag-03', 'prob-rag-001', 'https://docs.llamaindex.ai/en/stable/', 'LlamaIndex Documentation', 'helpful', 'demo-user-003', 1, 'demo-user-003', '2026-01-25T15:00:00Z'),
  ('res-rag-04', 'prob-rag-001', 'https://arxiv.org/abs/2312.10997', 'RAG Survey Paper (2024)', 'helpful', 'demo-user-004', 0, NULL, '2026-02-10T09:00:00Z');

-- Code Eval problem: Direct resource
INSERT INTO problem_resources (resource_id, problem_id, url, title, resource_type, added_by_user_id, approved, approved_by_user_id, created_at) VALUES
  ('res-eval-01', 'prob-eval-002', 'https://github.com/demo/code-eval-agent', 'Main Repository', 'direct', 'demo-user-003', 1, 'demo-user-003', '2026-01-25T14:10:00Z');

-- DSPy problem: Direct resource
INSERT INTO problem_resources (resource_id, problem_id, url, title, resource_type, added_by_user_id, approved, approved_by_user_id, created_at) VALUES
  ('res-dspy-01', 'prob-dspy-003', 'https://github.com/stanfordnlp/dspy', 'DSPy Framework', 'helpful', 'demo-user-001', 1, 'demo-user-001', '2026-02-01T09:30:00Z');

--------------------------------------------------------------------------------
-- 5c. REPO SNAPSHOTS (Ch.5.2, Ch.19.3.14)
--------------------------------------------------------------------------------

-- RAG problem v2: One snapshot recorded during pitch assessment
INSERT INTO problem_repo_snapshots (snapshot_id, problem_id, major_version, minor_version, head_commit_sha, first_seen_at) VALUES
  ('snap-rag-01', 'prob-rag-001', 2, 1, 'a1b2c3d4e5f6789012345678901234567890abcd', '2026-02-28T17:20:00Z');

--------------------------------------------------------------------------------
-- 6. ASSESSMENTS (linked to problems for the assess/ routes)
--------------------------------------------------------------------------------

-- Pitch assessment for RAG problem (closed — demo for pitch results summary)
INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at, closed_at) VALUES
  ('pitch-11', 'prob-rag-001', 2, '4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'event-feb-2026', '2026-02-28T17:15:00Z', '2026-02-28T17:25:00Z');

-- Review assessment for RAG problem (open)
INSERT INTO assessments (assessment_id, problem_id, major_version, inventory_id, event_id, opened_at, closed_at) VALUES
  ('review-11', 'prob-rag-001', 2, '9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'event-feb-2026', '2026-02-28T19:30:00Z', NULL);

-- Demo pitch responses for RAG problem (3 respondents × 6 items = 18 responses)
-- Respondent 1: demo-user-003 (Lisa)
INSERT INTO responses (response_id, assessment_id, item_id, user_id, role, time_context, in_presence, rating_value, review_weight_key, created_at) VALUES
  ('pr-001', 'pitch-11', '7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16', 'demo-user-003', 'observer', 'pitch', 1, 4, NULL, '2026-02-28T17:16:00Z'),
  ('pr-002', 'pitch-11', '4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15', 'demo-user-003', 'observer', 'pitch', 1, 5, NULL, '2026-02-28T17:16:00Z'),
  ('pr-003', 'pitch-11', '1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17', 'demo-user-003', 'observer', 'pitch', 1, 4, NULL, '2026-02-28T17:16:00Z'),
  ('pr-004', 'pitch-11', '3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa15', 'demo-user-003', 'observer', 'pitch', 1, 3, NULL, '2026-02-28T17:16:00Z'),
  ('pr-005', 'pitch-11', '2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10', 'demo-user-003', 'observer', 'pitch', 1, 4, NULL, '2026-02-28T17:16:00Z'),
  ('pr-006', 'pitch-11', '0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18', 'demo-user-003', 'observer', 'pitch', 1, 4, NULL, '2026-02-28T17:16:00Z');
-- Respondent 2: demo-user-004 (Tom)
INSERT INTO responses (response_id, assessment_id, item_id, user_id, role, time_context, in_presence, rating_value, review_weight_key, created_at) VALUES
  ('pr-007', 'pitch-11', '7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16', 'demo-user-004', 'developer', 'pitch', 1, 3, NULL, '2026-02-28T17:17:00Z'),
  ('pr-008', 'pitch-11', '4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15', 'demo-user-004', 'developer', 'pitch', 1, 4, NULL, '2026-02-28T17:17:00Z'),
  ('pr-009', 'pitch-11', '1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17', 'demo-user-004', 'developer', 'pitch', 1, 3, NULL, '2026-02-28T17:17:00Z'),
  ('pr-010', 'pitch-11', '3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa15', 'demo-user-004', 'developer', 'pitch', 1, 4, NULL, '2026-02-28T17:17:00Z'),
  ('pr-011', 'pitch-11', '2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10', 'demo-user-004', 'developer', 'pitch', 1, 3, NULL, '2026-02-28T17:17:00Z'),
  ('pr-012', 'pitch-11', '0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18', 'demo-user-004', 'developer', 'pitch', 1, 3, NULL, '2026-02-28T17:17:00Z');
-- Respondent 3: demo-user-002 (Eva/moderator)
INSERT INTO responses (response_id, assessment_id, item_id, user_id, role, time_context, in_presence, rating_value, review_weight_key, created_at) VALUES
  ('pr-013', 'pitch-11', '7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16', 'demo-user-002', 'moderator', 'pitch', 1, 4, NULL, '2026-02-28T17:18:00Z'),
  ('pr-014', 'pitch-11', '4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15', 'demo-user-002', 'moderator', 'pitch', 1, 4, NULL, '2026-02-28T17:18:00Z'),
  ('pr-015', 'pitch-11', '1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17', 'demo-user-002', 'moderator', 'pitch', 1, 5, NULL, '2026-02-28T17:18:00Z'),
  ('pr-016', 'pitch-11', '3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa15', 'demo-user-002', 'moderator', 'pitch', 1, 4, NULL, '2026-02-28T17:18:00Z'),
  ('pr-017', 'pitch-11', '2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10', 'demo-user-002', 'moderator', 'pitch', 1, 5, NULL, '2026-02-28T17:18:00Z'),
  ('pr-018', 'pitch-11', '0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18', 'demo-user-002', 'moderator', 'pitch', 1, 4, NULL, '2026-02-28T17:18:00Z');

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

--------------------------------------------------------------------------------
-- 9. EMAIL TEMPLATE (V1 default for demo event)
--------------------------------------------------------------------------------

INSERT INTO event_email_templates (template_id, event_id, version, subject, body_markdown, created_at, created_by_user_id, is_current) VALUES
  ('tmpl-001', 'event-feb-2026', 1,
   'Reminder: VibeCoding Cologne February 2026 starts soon!',
   'Hi {{display_name}},

This is a reminder that **VibeCoding Cologne February 2026** is starting soon.

**When:** February 28, 2026 at 17:00
**Where:** STARTPLATZ Cologne, Im Mediapark 5, 50670 Köln

We look forward to seeing you there!

Best,
The VibeCoding Team',
   '2026-02-01T12:00:00Z', 'demo-user-002', 1);

--------------------------------------------------------------------------------
-- 10. LESSONS LEARNED (Ch.4.2, Ch.19.3.29, TICKET-15)
-- Demo lessons across problems to populate the Knowledge Base
--------------------------------------------------------------------------------

INSERT INTO lessons_learned (lesson_id, problem_id, event_id, user_id, content, category, tags, valuable, created_at) VALUES
  ('lesson-001', 'prob-rag-001', 'event-feb-2026', 'demo-user-001', 'Using DSPy-style optimization for prompt tuning reduced iteration time by 40%. Key insight: treat prompts as optimizable artifacts, not magic strings you fiddle with manually.', 'architecture', '["prompting","optimization","dspy"]', 1, '2026-03-01T09:15:00Z'),
  ('lesson-002', 'prob-rag-001', 'event-feb-2026', 'demo-user-003', 'RAG with SQLite FTS5 is surprisingly capable for small-to-medium datasets. No need for a vector database if your corpus fits in a single file and you only need keyword retrieval.', 'tooling', '["rag","sqlite","fts5"]', 1, '2026-03-01T10:30:00Z'),
  ('lesson-003', 'prob-rag-001', 'event-feb-2026', 'demo-user-004', 'Always open the test file in a separate editor tab when prompting Claude Code for TDD. Claude performs significantly better when the test file is visible in context.', 'process', '["claude","tdd","workflow"]', 0, '2026-03-02T14:00:00Z'),
  ('lesson-004', 'prob-eval-002', NULL, 'demo-user-003', 'Evaluation pipelines need a "fast fail" path. If the first few test cases fail badly, abort early rather than running the full 100-case suite. Saved us 20 minutes per iteration.', 'performance', '["testing","evaluation","early-exit"]', 0, '2026-02-20T11:00:00Z'),
  ('lesson-005', 'prob-eval-002', NULL, 'demo-user-002', 'Gotcha: Claude Sonnet 4.5 interprets "score 1-5" as inclusive of 0 unless you explicitly state "integer between 1 and 5 inclusive, never 0". Wasted an hour on mysterious 0-scores.', 'gotcha', '["claude","prompt-engineering","scoring"]', 1, '2026-02-21T09:45:00Z'),
  ('lesson-006', 'prob-dspy-003', NULL, 'demo-user-001', 'When exploring greenfield problems, start with the simplest possible implementation first, then measure. Every premature abstraction we added in hour 1 had to be ripped out in hour 2.', 'process', '["architecture","simplicity","greenfield"]', 0, '2026-02-10T16:30:00Z');

--------------------------------------------------------------------------------
-- 11. CONTRIBUTION POINTS (Ch.33.6.3, Ch.19.3.35)
-- Seeded for existing decisions to populate the contributor wall.
-- All within the 6-week window of today (2026-02-25) to appear on wall.
-- source_id has no FK constraint — references logical source records.
--------------------------------------------------------------------------------

INSERT INTO contribution_points (contribution_id, user_id, action_key, points_awarded, source_type, source_id, event_id, awarded_at) VALUES
  -- Max Mustermann (3 pts): problem submitted twice, elected for pitch
  ('cp-001', 'demo-user-001', 'problem_submitted', 1, 'decision', 'dec-rag-02', 'event-feb-2026', '2026-01-20T10:30:00Z'),
  ('cp-002', 'demo-user-001', 'problem_submitted', 1, 'decision', 'dec-rag-05', 'event-feb-2026', '2026-01-28T15:30:00Z'),
  ('cp-003', 'demo-user-001', 'problem_elected_pitch', 1, 'decision', 'dec-rag-07', 'event-feb-2026', '2026-02-01T10:00:00Z'),
  -- Tom Weber (1 pt): problem submitted
  ('cp-004', 'demo-user-003', 'problem_submitted', 1, 'decision', 'dec-eval-02', 'event-feb-2026', '2026-01-25T14:30:00Z'),
  -- Eva Schmidt (2 pts): review assessments (historical, no event context)
  ('cp-005', 'demo-user-002', 'review_assessment_completed', 1, 'response', 'resp-historic-01', NULL, '2026-01-15T20:00:00Z'),
  ('cp-006', 'demo-user-002', 'review_assessment_completed', 1, 'response', 'resp-historic-02', NULL, '2026-01-29T21:00:00Z'),
  -- Lisa Chen (1 pt): valuable chat contribution
  ('cp-007', 'demo-user-004', 'valuable_contribution', 1, 'chat_message', 'msg-historic-01', NULL, '2026-02-10T11:00:00Z');

--------------------------------------------------------------------------------
-- 12. USER MILESTONES (Ch.33.2, Ch.19.3.40)
-- First-time achievements for demo users based on seeded actions.
--------------------------------------------------------------------------------

INSERT INTO user_milestones (milestone_id, user_id, milestone_key, achieved_at, context_id, context_type) VALUES
  -- Max: first submission, first acceptance, first event
  ('ms-001', 'demo-user-001', 'first_problem_submitted', '2026-01-20T10:30:00Z', 'prob-rag-001', 'problem'),
  ('ms-002', 'demo-user-001', 'first_problem_accepted', '2026-01-29T11:00:00Z', 'prob-rag-001', 'problem'),
  ('ms-003', 'demo-user-001', 'first_event_attended', '2026-02-28T17:00:00Z', 'event-feb-2026', 'event'),
  -- Tom: first submission, first event
  ('ms-004', 'demo-user-003', 'first_problem_submitted', '2026-01-25T14:30:00Z', 'prob-eval-002', 'problem'),
  ('ms-005', 'demo-user-003', 'first_event_attended', '2026-02-28T17:00:00Z', 'event-feb-2026', 'event'),
  -- Eva: first assessment, first event (moderator, long-tenured)
  ('ms-006', 'demo-user-002', 'first_assessment_completed', '2026-01-15T20:00:00Z', NULL, NULL),
  ('ms-007', 'demo-user-002', 'first_event_attended', '2026-02-28T17:00:00Z', 'event-feb-2026', 'event'),
  -- Lisa: first event
  ('ms-008', 'demo-user-004', 'first_event_attended', '2026-02-28T17:00:00Z', 'event-feb-2026', 'event');

--------------------------------------------------------------------------------
-- 13. CHAT MESSAGES (Ch.31, TICKET-26)
-- Demo conversation on RAG problem (v2) with threading
--------------------------------------------------------------------------------

-- Top-level messages (reply_to_message_id IS NULL)
INSERT INTO chat_messages (message_id, user_id, problem_id, problem_version_id, major_version, event_id, team_id, context_situation, content, reply_to_message_id, url_disclosed, is_bot, author_role, visible, created_at) VALUES
  ('chat-001', 'demo-user-001', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Has anyone worked with LlamaIndex''s evaluation framework? I''m trying to decide between their built-in metrics and rolling our own.', NULL, 0, 0, 'developer', 1, '2026-02-20T14:00:00Z'),
  ('chat-002', 'demo-user-002', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Good question. From the moderator side — whatever you choose, make sure we can reproduce the benchmark results deterministically. That''s key for the review phase.', NULL, 0, 0, 'moderator', 1, '2026-02-20T14:05:00Z'),
  ('chat-003', 'demo-user-003', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'I found this useful comparison: https://docs.llamaindex.ai/en/stable/module_guides/evaluating/ — covers precision, recall, and faithfulness metrics.', NULL, 1, 0, 'developer', 1, '2026-02-20T14:10:00Z'),
  ('chat-004', 'demo-user-004', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Just a heads up — I''ll be working on this during the event. Planning to use SQLite FTS5 for the retrieval layer since the corpus is small enough.', NULL, 0, 0, 'developer', 1, '2026-02-21T10:30:00Z'),
  ('chat-005', 'demo-user-001', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Quick question for everyone: should we standardize on a specific embedding model for the benchmark, or allow any model and compare results?', NULL, 0, 0, 'developer', 1, '2026-02-22T09:00:00Z');

-- Replies to chat-001 (thread with 3 replies)
INSERT INTO chat_messages (message_id, user_id, problem_id, problem_version_id, major_version, event_id, team_id, context_situation, content, reply_to_message_id, url_disclosed, is_bot, author_role, visible, created_at) VALUES
  ('chat-006', 'demo-user-003', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'I used LlamaIndex''s evaluation in a previous project. The built-in metrics are solid for a quick start, but you''ll want custom metrics for domain-specific evaluation.', 'chat-001', 0, 0, 'developer', 1, '2026-02-20T14:12:00Z'),
  ('chat-007', 'demo-user-001', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Thanks @TomWeber — that''s exactly what I was thinking. We could start with their defaults and extend with custom faithfulness scoring.', 'chat-001', 0, 0, 'developer', 1, '2026-02-20T14:15:00Z'),
  ('chat-008', 'demo-user-004', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Agreed. I''d suggest we use RAGAS as a second validation — it gives slightly different angles on faithfulness and answer relevancy.', 'chat-001', 0, 0, 'developer', 1, '2026-02-20T14:20:00Z');

-- Replies to chat-005 (thread with 2 replies, including a nested reply)
INSERT INTO chat_messages (message_id, user_id, problem_id, problem_version_id, major_version, event_id, team_id, context_situation, content, reply_to_message_id, url_disclosed, is_bot, author_role, visible, created_at) VALUES
  ('chat-009', 'demo-user-002', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'I''d say: pick one default (e.g. text-embedding-3-small) but allow overriding via config. That way we have comparable baselines.', 'chat-005', 0, 0, 'moderator', 1, '2026-02-22T09:15:00Z'),
  ('chat-010', 'demo-user-003', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'Good call. OpenAI''s text-embedding-3-small is a reasonable default — cheap, fast, and well-documented.', 'chat-009', 0, 0, 'developer', 1, '2026-02-22T09:20:00Z');

-- Reply to chat-003 (single reply)
INSERT INTO chat_messages (message_id, user_id, problem_id, problem_version_id, major_version, event_id, team_id, context_situation, content, reply_to_message_id, url_disclosed, is_bot, author_role, visible, created_at) VALUES
  ('chat-011', 'demo-user-001', 'prob-rag-001', 'pv-rag-v2', 2, 'event-feb-2026', NULL, 'pre_discussion',
   'That doc is exactly what I needed. The faithfulness evaluator section is particularly relevant for our use case.', 'chat-003', 0, 0, 'developer', 1, '2026-02-20T14:25:00Z');

-- Chat reactions (to give visual richness)
INSERT INTO chat_reactions (reaction_id, message_id, user_id, emoji, created_at) VALUES
  ('react-001', 'chat-003', 'demo-user-001', '👍', '2026-02-20T14:11:00Z'),
  ('react-002', 'chat-003', 'demo-user-002', '💡', '2026-02-20T14:12:00Z'),
  ('react-003', 'chat-002', 'demo-user-001', '✅', '2026-02-20T14:06:00Z'),
  ('react-004', 'chat-004', 'demo-user-001', '🔥', '2026-02-21T10:31:00Z'),
  ('react-005', 'chat-009', 'demo-user-001', '👍', '2026-02-22T09:16:00Z'),
  ('react-006', 'chat-009', 'demo-user-003', '👍', '2026-02-22T09:17:00Z');
