-- VibeCoding Professionals Platform - Reference Data Seed
-- Run AFTER schema.sql: sqlite3 event.db < seed_reference_data.sql
--
-- Contents:
-- 1. Catalog tables (states, decision types, roles, contexts) per Ch.19.2
-- 2. Decision state effects mapping per Ch.19.2.4
-- 3. Items (18 evaluation items from Ch.24)
-- 4. Inventories (5 inventories from Ch.24)
-- 5. Inventory compositions (inventory_items mappings)

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- 1. CATALOG TABLES
--------------------------------------------------------------------------------

-- 19.2.1 Readiness states (5 states per Ch.4.3, Ch.19.2.1)
INSERT INTO readiness_state_catalog (state_key, display_name, description, is_terminal, sort_order, is_active, created_at) VALUES
  ('draft', 'Draft', 'Problem being authored, not yet submitted for review', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('submitted', 'Submitted', 'Submitted for review, awaiting quality gate evaluation', 0, 2, 1, '2026-01-30T00:00:00Z'),
  ('needs_changes', 'Needs Changes', 'Quality gate feedback received, refinement required before acceptance', 0, 3, 1, '2026-01-30T00:00:00Z'),
  ('ready', 'Ready', 'Quality gate passed, suitable for event consideration', 0, 4, 1, '2026-01-30T00:00:00Z'),
  ('rejected', 'Rejected', 'Quality gate failed, not suitable in current form', 1, 5, 1, '2026-01-30T00:00:00Z');

-- 19.2.2 Action states (6 states per Ch.4.3, Ch.19.2.2)
INSERT INTO action_state_catalog (state_key, display_name, description, is_terminal, sort_order, is_active, created_at) VALUES
  ('backlog', 'Backlog', 'General pool, available for future events', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('selected_for_event', 'Selected for Event', 'Planned for upcoming/current event agenda', 0, 2, 1, '2026-01-30T00:00:00Z'),
  ('selected_for_coding', 'Selected for Coding', 'Actively being worked on in sprint', 0, 3, 1, '2026-01-30T00:00:00Z'),
  ('deferred', 'Deferred', 'Postponed to future (specific reason in decision_type)', 0, 4, 1, '2026-01-30T00:00:00Z'),
  ('dropped', 'Dropped', 'Removed from consideration, will not continue', 1, 5, 1, '2026-01-30T00:00:00Z'),
  ('closed', 'Closed', 'Completed successfully, no further action needed', 1, 6, 1, '2026-01-30T00:00:00Z');

-- 19.2.3 Decision types (25 types across 8 categories per Ch.10.3, Ch.19.2.3)
-- Category: lifecycle (4)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('problem_created', 'Problem Created', 'New problem created by Problem Owner', 'lifecycle', 1, 1, 1, '2026-01-30T00:00:00Z'),
  ('problem_cloned', 'Problem Cloned', 'Problem cloned from existing problem', 'lifecycle', 1, 1, 1, '2026-01-30T00:00:00Z'),
  ('problem_submitted', 'Problem Submitted', 'Problem submitted for quality gate review', 'lifecycle', 1, 0, 1, '2026-01-30T00:00:00Z'),
  ('problem_updated', 'Problem Updated', 'New major version created after changes', 'lifecycle', 1, 0, 1, '2026-01-30T00:00:00Z');

-- Category: quality_gate (3)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('quality_gate_accepted', 'Quality Gate Accepted', 'Problem passes quality gate, ready for event', 'quality_gate', 1, 0, 1, '2026-01-30T00:00:00Z'),
  ('quality_gate_rejected', 'Quality Gate Rejected', 'Problem rejected at quality gate', 'quality_gate', 1, 0, 1, '2026-01-30T00:00:00Z'),
  ('quality_gate_needs_changes', 'Quality Gate Needs Changes', 'Problem requires refinement before acceptance', 'quality_gate', 1, 0, 1, '2026-01-30T00:00:00Z');

-- Category: planning (2)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('selected_for_event', 'Selected for Event', 'Problem added to upcoming event agenda', 'planning', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deselected_for_event', 'Deselected for Event', 'Problem removed from event agenda, returns to backlog', 'planning', 0, 1, 1, '2026-01-30T00:00:00Z');

-- Category: sprint (2)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('selected_for_coding', 'Selected for Coding', 'Problem selected for active sprint work', 'sprint', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deselected_for_coding', 'Deselected for Coding', 'Problem removed from sprint, returns to selected_for_event', 'sprint', 0, 1, 1, '2026-01-30T00:00:00Z');

-- Category: deferral (6)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('deferred_po_absent', 'Deferred: PO Absent', 'Problem Owner not available for this event', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deferred_low_priority', 'Deferred: Low Priority', 'Lower priority relative to other problems', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deferred_skipped', 'Deferred: Skipped', 'Ran out of time, no judgment on problem quality', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deferred_too_complex', 'Deferred: Too Complex', 'Too complex for current sprint format', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deferred_needs_refinement', 'Deferred: Needs Refinement', 'Needs more work before ready for sprint', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('deferred_future_capability', 'Deferred: Future Capability', 'Waiting for tools/skills not yet available', 'deferral', 0, 1, 1, '2026-01-30T00:00:00Z');

-- Category: drop (2)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('dropped_low_relevance', 'Dropped: Low Relevance', 'No longer relevant to event goals', 'drop', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('dropped_low_quality', 'Dropped: Low Quality', 'Fundamentally unsuitable, will not continue', 'drop', 0, 1, 1, '2026-01-30T00:00:00Z');

-- Category: close (2)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('closed_complete', 'Closed: Complete', 'Problem solved, goals fully achieved', 'close', 0, 1, 1, '2026-01-30T00:00:00Z'),
  ('closed_partial', 'Closed: Partial', 'Partially solved, good enough, moving on', 'close', 0, 1, 1, '2026-01-30T00:00:00Z');

-- Category: live (4)
INSERT INTO decision_type_catalog (type_key, display_name, description, category, affects_readiness, affects_action, is_active, created_at) VALUES
  ('opened_for_pitch_assessment', 'Opened for Pitch', 'Pitch assessment window opened for this problem', 'live', 0, 0, 1, '2026-01-30T00:00:00Z'),
  ('closed_for_pitch_assessment', 'Closed for Pitch', 'Pitch assessment window closed', 'live', 0, 0, 1, '2026-01-30T00:00:00Z'),
  ('opened_for_review', 'Opened for Review', 'Review assessment window opened for this problem', 'live', 0, 0, 1, '2026-01-30T00:00:00Z'),
  ('closed_for_review', 'Closed for Review', 'Review assessment window closed', 'live', 0, 0, 1, '2026-01-30T00:00:00Z');

-- 19.2.4 Decision state effects mapping
INSERT INTO decision_state_effects (decision_type, new_readiness_state, new_action_state, new_live_mode) VALUES
  ('problem_created', 'draft', 'backlog', NULL),
  ('problem_cloned', 'draft', 'backlog', NULL),
  ('problem_submitted', 'submitted', NULL, NULL),
  ('problem_updated', 'draft', NULL, NULL),
  ('quality_gate_accepted', 'ready', NULL, NULL),
  ('quality_gate_rejected', 'rejected', NULL, NULL),
  ('quality_gate_needs_changes', 'needs_changes', NULL, NULL),
  ('selected_for_event', NULL, 'selected_for_event', NULL),
  ('deselected_for_event', NULL, 'backlog', NULL),
  ('selected_for_coding', NULL, 'selected_for_coding', NULL),
  ('deselected_for_coding', NULL, 'selected_for_event', NULL),
  ('deferred_po_absent', NULL, 'deferred', NULL),
  ('deferred_low_priority', NULL, 'deferred', NULL),
  ('deferred_skipped', NULL, 'deferred', NULL),
  ('deferred_too_complex', NULL, 'deferred', NULL),
  ('deferred_needs_refinement', NULL, 'deferred', NULL),
  ('deferred_future_capability', NULL, 'deferred', NULL),
  ('dropped_low_relevance', NULL, 'dropped', NULL),
  ('dropped_low_quality', NULL, 'dropped', NULL),
  ('closed_complete', NULL, 'closed', NULL),
  ('closed_partial', NULL, 'closed', NULL),
  ('opened_for_pitch_assessment', NULL, NULL, 'pitch'),
  ('closed_for_pitch_assessment', NULL, NULL, 'idle'),
  ('opened_for_review', NULL, NULL, 'review'),
  ('closed_for_review', NULL, NULL, 'idle');

-- 19.2.5 Time contexts (6 contexts per user decision)
INSERT INTO time_context_catalog (context_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('pre_event', 'Pre-Event', 'Before the event begins', 1, 1, '2026-01-30T00:00:00Z'),
  ('pitch', 'Pitch', 'During or immediately after live pitch', 2, 1, '2026-01-30T00:00:00Z'),
  ('coding', 'Coding', 'During the coding sprint phase', 3, 1, '2026-02-03T00:00:00Z'),
  ('review', 'Review', 'After coding/hacking, evaluating outcomes', 4, 1, '2026-01-30T00:00:00Z'),
  ('post_event', 'Post-Event', 'Shortly after event ends', 5, 1, '2026-01-30T00:00:00Z'),
  ('late_reflection', 'Late Reflection', 'Days/weeks later, delayed insights', 6, 1, '2026-01-30T00:00:00Z');

-- 19.2.6 User roles (7 roles per Ch.3.10, Ch.19.2.6)
INSERT INTO user_role_catalog (role_key, display_name, description, can_bind, is_human, sort_order, is_active, created_at) VALUES
  ('observer', 'Observer', 'Watches and evaluates, does not code', 0, 1, 1, 1, '2026-01-30T00:00:00Z'),
  ('developer', 'Developer', 'Actively codes on problems', 0, 1, 2, 1, '2026-01-30T00:00:00Z'),
  ('coding_partner', 'Coding Partner', 'Pairs with developer at same workstation', 0, 1, 3, 1, '2026-01-30T00:00:00Z'),
  ('problem_owner', 'Problem Owner', 'Authors and maintains problem cards', 0, 1, 4, 1, '2026-01-30T00:00:00Z'),
  ('po_deputy', 'Deputy Problem Owner', 'Co-authors and maintains problem cards', 0, 1, 4, 1, '2026-01-30T00:00:00Z'),
  ('moderator', 'Moderator', 'Curates problems, orchestrates events', 1, 1, 5, 1, '2026-01-30T00:00:00Z'),
  ('admin', 'Administrator', 'Full system access, manages items/inventories', 1, 1, 6, 1, '2026-01-30T00:00:00Z'),
  ('agent', 'Agent', 'AI system, non-binding recommendations only', 0, 0, 7, 1, '2026-01-30T00:00:00Z');

-- 19.2.7 Auth providers (3 providers per Ch.18, Ch.19.2.7)
INSERT INTO auth_provider_catalog (provider_key, display_name, is_active, created_at) VALUES
  ('local', 'Email + Password', 1, '2026-01-30T00:00:00Z'),
  ('github', 'GitHub OAuth', 1, '2026-01-30T00:00:00Z'),
  ('linkedin', 'LinkedIn OAuth', 1, '2026-01-30T00:00:00Z');

-- 19.2.8 Partner types (4 types per Ch.29, Ch.19.2.8)
INSERT INTO partner_type_catalog (type_key, display_name, is_active, created_at) VALUES
  ('coworking', 'Co-Working Space', 1, '2026-01-30T00:00:00Z'),
  ('university', 'University', 1, '2026-01-30T00:00:00Z'),
  ('company', 'Company', 1, '2026-01-30T00:00:00Z'),
  ('community', 'Community', 1, '2026-01-30T00:00:00Z');

-- 19.2.9 Chat contexts (4 situations per Ch.31)
INSERT INTO chat_context_catalog (context_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('pre_discussion', 'Pre-Discussion', 'Before event, general discussion', 1, 1, '2026-02-02T00:00:00Z'),
  ('pitch_discussion', 'Pitch Discussion', 'During pitch phase', 2, 1, '2026-02-02T00:00:00Z'),
  ('while_building', 'While Building', 'During coding sprint', 3, 1, '2026-02-02T00:00:00Z'),
  ('while_reviewing', 'While Reviewing', 'During review phase', 4, 1, '2026-02-02T00:00:00Z');

-- 19.2.10 Resource types (2 types per Ch.4, Ch.19.2.10)
INSERT INTO resource_type_catalog (type_key, display_name, description, is_active, created_at) VALUES
  ('direct', 'Direct Resource', 'Repositories and resources directly relevant for the problem', 1, '2026-01-30T00:00:00Z'),
  ('helpful', 'Helpful Artifact', 'Repositories and resources with helpful reference material', 1, '2026-01-30T00:00:00Z');

-- Queue states (4 states for event_problem_queue)
INSERT INTO queue_state_catalog (state_key, display_name, description, is_active, created_at) VALUES
  ('candidate', 'Candidate', 'Problem is a candidate for this event', 1, '2026-01-30T00:00:00Z'),
  ('selected_for_pitch', 'Selected for Pitch', 'Problem will be pitched at this event', 1, '2026-01-30T00:00:00Z'),
  ('selected_for_coding', 'Selected for Coding', 'Problem selected for sprint work at this event', 1, '2026-01-30T00:00:00Z'),
  ('completed', 'Completed', 'Problem work completed at this event', 1, '2026-01-30T00:00:00Z');

-- Problem type catalog (6 types per Ch.4)
INSERT INTO problem_type_catalog (type_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('explorative', 'Explorative', 'Early-stage idea exploration, not yet fully formed', 1, 1, '2026-02-02T00:00:00Z'),
  ('greenfield', 'Greenfield', 'New project from scratch, no existing code', 2, 1, '2026-02-02T00:00:00Z'),
  ('advanced_greenfield', 'Advanced Greenfield', 'Building on existing greenfield work', 3, 1, '2026-02-02T00:00:00Z'),
  ('brownfield', 'Brownfield', 'Existing codebase with constraints', 4, 1, '2026-02-02T00:00:00Z'),
  ('reverse_engineering', 'Reverse Engineering', 'Understanding and documenting existing system', 5, 1, '2026-02-02T00:00:00Z'),
  ('other', 'Other', 'Does not fit other categories', 6, 1, '2026-02-02T00:00:00Z');

-- Lesson category catalog (6 categories per Ch.4)
INSERT INTO lesson_category_catalog (category_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('tooling', 'Tooling', 'Insights about agentic tools, IDEs, configurations', 1, 1, '2026-02-02T00:00:00Z'),
  ('architecture', 'Architecture', 'Design patterns, structure, system organization', 2, 1, '2026-02-02T00:00:00Z'),
  ('process', 'Process', 'Workflow, collaboration, methodology learnings', 3, 1, '2026-02-02T00:00:00Z'),
  ('gotcha', 'Gotcha', 'Pitfalls, surprises, things that caught us off guard', 4, 1, '2026-02-02T00:00:00Z'),
  ('performance', 'Performance', 'Speed, efficiency, optimization insights', 5, 1, '2026-02-02T00:00:00Z'),
  ('testing', 'Testing', 'Test strategies, coverage, verification approaches', 6, 1, '2026-02-02T00:00:00Z');

-- Team member role catalog (3 roles per Ch.31)
INSERT INTO team_member_role_catalog (role_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('po', 'Problem Owner', 'Created the problem, full ownership rights', 1, 1, '2026-02-02T00:00:00Z'),
  ('po_deputy', 'PO Deputy', 'Same rights as PO, assigned by PO', 2, 1, '2026-02-02T00:00:00Z'),
  ('coder', 'Coder', 'Team member working on the solution', 3, 1, '2026-02-02T00:00:00Z');

-- Team member status catalog (2 statuses per Ch.31)
INSERT INTO team_member_status_catalog (status_key, display_name, description, sort_order, is_active, created_at) VALUES
  ('active', 'Active', 'Currently active team member', 1, 1, '2026-02-02T00:00:00Z'),
  ('retired', 'Retired', 'Retired from team, can rejoin', 2, 1, '2026-02-02T00:00:00Z');

-- Emoji catalog (10 curated emojis for reactions)
INSERT INTO emoji_catalog (emoji, display_name, sort_order, is_active) VALUES
  ('👍', 'Thumbs Up', 1, 1),
  ('👎', 'Thumbs Down', 2, 1),
  ('❤️', 'Heart', 3, 1),
  ('🎉', 'Celebrate', 4, 1),
  ('🤔', 'Thinking', 5, 1),
  ('👀', 'Eyes', 6, 1),
  ('🔥', 'Fire', 7, 1),
  ('✅', 'Check', 8, 1),
  ('💡', 'Idea', 9, 1),
  ('🙏', 'Thanks', 10, 1);

-- 19.3.32 Contribution action catalog (Ch.33 - Contributor Recognition)
INSERT INTO contribution_action_catalog (action_key, display_name, description, default_points, current_points, is_active, created_at) VALUES
  ('review_assessment_completed', 'Review Assessment', 'Completed a pre- or post-event review assessment', 1, 1, 1, '2026-02-03T00:00:00Z'),
  ('valuable_contribution', 'Valuable Contribution', 'Chat message or lesson learned with ≥2 thumbs-up or lightbulb reactions', 1, 1, 1, '2026-02-03T00:00:00Z'),
  ('problem_submitted', 'Problem Submitted', 'Submitted a problem for quality gate review', 1, 1, 1, '2026-02-03T00:00:00Z'),
  ('problem_elected_pitch', 'Problem Pitched', 'Own problem was selected for pitch phase', 1, 1, 1, '2026-02-03T00:00:00Z'),
  ('problem_elected_coding', 'Problem Coded', 'Own problem was selected for coding sprint', 1, 1, 1, '2026-02-03T00:00:00Z');

-- 19.3.35 Review weight catalog (Ch.33 - Star Award Calculations)
INSERT INTO review_weight_catalog (weight_key, display_name, weight_multiplier, description, is_active, created_at) VALUES
  ('live_review', 'Live Review', 1.0, 'Review during event (time-constrained)', 1, '2026-02-03T00:00:00Z'),
  ('post_event_review', 'Post-Event Review', 1.5, 'Review after event ends (more time to verify repo)', 1, '2026-02-03T00:00:00Z'),
  ('agent_review', 'Agent Review', 0.5, 'AI agent assessment (supporting, not authoritative)', 1, '2026-02-03T00:00:00Z');

-- 19.3.37 Milestone key catalog (Ch.33 - First-Time Achievements)
INSERT INTO milestone_key_catalog (milestone_key, display_name, description, context_type, is_active, created_at) VALUES
  ('first_problem_submitted', 'First Problem Submitted', 'First problem submitted for review', 'problem', 1, '2026-02-03T00:00:00Z'),
  ('first_problem_accepted', 'First Problem Accepted', 'First problem passed quality gate', 'problem', 1, '2026-02-03T00:00:00Z'),
  ('first_assessment_completed', 'First Assessment Completed', 'First pitch or review assessment', NULL, 1, '2026-02-03T00:00:00Z'),
  ('first_team_joined', 'First Team Joined', 'First team membership', 'team', 1, '2026-02-03T00:00:00Z'),
  ('first_event_attended', 'First Event Attended', 'First event with confirmed attendance', 'event', 1, '2026-02-03T00:00:00Z'),
  ('first_lesson_learned', 'First Lesson Learned', 'First lesson learned added', NULL, 1, '2026-02-03T00:00:00Z'),
  ('first_star_earned', 'First Star Earned', 'First star award received', 'problem', 1, '2026-02-03T00:00:00Z');

-- 19.3.38 Hint key catalog (Ch.32 - Onboarding Hints)
INSERT INTO hint_key_catalog (hint_key, display_name, description, where_shown, is_active, created_at) VALUES
  ('first_problem_welcome', 'First Problem Welcome', 'Welcome panel for first problem creation', 'Problem creation', 1, '2026-02-03T00:00:00Z'),
  ('first_pitch_voting', 'First Pitch Voting', 'Explanation of pitch voting process', 'Pitch assessment', 1, '2026-02-03T00:00:00Z'),
  ('first_team_join', 'First Team Join', 'Guidance after joining first team', 'Problem Card', 1, '2026-02-03T00:00:00Z'),
  ('dual_state_explanation', 'Dual State Explanation', 'Readiness vs Action state explanation', 'Problem Card', 1, '2026-02-03T00:00:00Z'),
  ('assessment_skip_ok', 'Assessment Skip OK', 'It is OK to skip dimensions you are unsure about', 'Assessment form', 1, '2026-02-03T00:00:00Z'),
  ('dashboard_overview', 'Dashboard Overview', 'First-time dashboard orientation', 'Dashboard', 1, '2026-02-03T00:00:00Z'),
  ('moderator_dashboard_intro', 'Moderator Dashboard Intro', 'First-time moderator dashboard orientation', 'Moderator Dashboard', 1, '2026-02-03T00:00:00Z');

--------------------------------------------------------------------------------
-- 2. ITEMS (18 evaluation items from Ch.24)
--------------------------------------------------------------------------------

-- 1.1 Core Outcome & Quality (implementation-focused)
INSERT INTO items (item_id, item_key, short_label, item_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('0d2b6f6a-28c3-4d8b-9af6-3f9f9f6c4d01', 'correctness', 'Correctness', 'Correctness: The solution meets the stated requirements (including edge cases) and behaves as intended.', 5, 'Incorrect / misleading', 'Partly correct', 'Mostly correct', 'Correct with minor issues', 'Fully correct', '2026-01-30T00:00:00Z', NULL),
  ('8fa2e7a2-0e0a-4c6d-b8db-7b7a0c7e0a02', 'test_support', 'Test Support', 'Test support: Evidence (tests or equivalent checks) convincingly supports correctness.', 5, 'No evidence', 'Weak evidence', 'Some evidence', 'Strong evidence', 'Convincing evidence', '2026-01-30T00:00:00Z', NULL),
  ('c03a7f23-56df-4b65-a0a6-4b2a62fb0a03', 'code_readability', 'Readability', 'Readability: The code is easy to read and understand (naming, structure, local reasoning).', 5, 'Hard to read', 'Often unclear', 'Acceptable', 'Clear', 'Exceptionally clear', '2026-01-30T00:00:00Z', NULL),
  ('7e51a8e5-2f7a-46b1-9a0e-85f8b7f48a04', 'simplicity', 'Simplicity', 'Simplicity: The solution avoids unnecessary complexity and bloat.', 5, 'Overcomplicated', 'Some bloat', 'Reasonable', 'Lean', 'Minimal & sufficient', '2026-01-30T00:00:00Z', NULL),
  ('b0f1c2c6-9f5e-43ff-9d1d-3f1e884b2a05', 'elegance', 'Elegance', 'Elegance: The solution uses fitting language constructs and exhibits a clean, teachable structure.', 5, 'Hacky / awkward', 'Somewhat clumsy', 'Fine', 'Clean', 'Elegant & robust', '2026-01-30T00:00:00Z', NULL),
  ('f6a94c2a-3a63-4cc3-9e4e-fc46c4c1aa06', 'extensibility', 'Extensibility', 'Extensibility: The design can accommodate likely requirement changes with minimal rework (without overengineering).', 5, 'Fragile', 'Hard to extend', 'Moderately extendable', 'Easy to extend', 'Highly extensible', '2026-01-30T00:00:00Z', NULL);

-- 1.2 Task Completion & Efficiency (process-focused)
INSERT INTO items (item_id, item_key, short_label, item_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('1c88d55b-3d2d-4d2d-9f1b-6f27c5f80b07', 'completion_degree', 'Completion', 'Completion: How much of the intended task scope was achieved.', 5, 'Not achieved', 'Small fraction', 'Partial', 'Almost complete', 'Complete', '2026-01-30T00:00:00Z', NULL),
  ('a54c2b9a-6f30-4a9c-a1d1-4bd33f6e6a08', 'time_efficiency', 'Time Efficiency', 'Time efficiency: Given the time constraints, the approach produced strong progress per unit time.', 5, 'Inefficient', 'Slow progress', 'OK', 'Fast progress', 'Exceptional progress', '2026-01-30T00:00:00Z', NULL),
  ('d0fb0c0f-4f2e-4d2a-9f52-8fda13b7aa09', 'cognitive_ease', 'Cognitive Ease', 'Cognitive Ease: How would you rate the cognitive ease of understanding and supervising this process?', 10, 'Very demanding', NULL, NULL, NULL, 'Effortless', '2026-01-30T00:00:00Z', NULL);

-- 1.3 Problem Card / Requirements Quality (problem-centered)
INSERT INTO items (item_id, item_key, short_label, item_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10', 'problem_clarity', 'Clarity', 'Clarity: The problem statement is clear and unambiguous.', 5, 'Very unclear', 'Unclear', 'Mixed', 'Clear', 'Very clear', '2026-01-30T00:00:00Z', NULL),
  ('5d6b1a32-9f1a-4a5a-bc3c-3e2d9b1caa11', 'acceptance_criteria_quality', 'Acceptance Criteria', 'Acceptance criteria: The success conditions are explicit enough to judge outcomes.', 5, 'Missing', 'Vague', 'Somewhat defined', 'Well defined', 'Precisely defined', '2026-01-30T00:00:00Z', NULL),
  ('9b9f3b1a-2c3a-4cba-a56d-8f0c1d9caa12', 'testability', 'Testability', 'Testability: It is feasible to validate correctness via tests, checks, or reproducible procedures.', 5, 'Not testable', 'Hard to test', 'Somewhat testable', 'Testable', 'Highly testable', '2026-01-30T00:00:00Z', NULL),
  ('6f5b2c21-08b4-4c1a-9d7f-2fa6f1c2aa13', 'internal_structure', 'Structure', 'Internal structure: The task is decomposed into coherent sub-tasks or milestones.', 5, 'No structure', 'Weak structure', 'Some structure', 'Well structured', 'Excellent decomposition', '2026-01-30T00:00:00Z', NULL),
  ('3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa15', 'complexity_suitability', 'Suitability', 'Complexity suitability: Is this problem appropriately sized for a event sprint? (Rate "Poor" if too trivial OR too complex)', 5, 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent', '2026-01-30T00:00:00Z', NULL);

-- 1.4 Business Value & Community Fit (selection-focused)
INSERT INTO items (item_id, item_key, short_label, item_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15', 'personal_value', 'Personal Value', 'Personal value: If completed, I would personally benefit from or use this outcome.', 5, 'No value to me', 'Low value', 'Some value', 'High value', 'Very high value', '2026-01-30T00:00:00Z', NULL),
  ('7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16', 'general_importance', 'Importance', 'General importance: This seems broadly valuable or important to the community.', 5, 'Not important', 'Low importance', 'Moderate', 'Important', 'Very important', '2026-01-30T00:00:00Z', NULL),
  ('1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17', 'event_alignment', 'Event Alignment', 'Event alignment: This problem supports comparing agentic coding approaches and requirements-driven quality thinking.', 5, 'Not aligned', 'Weakly aligned', 'Somewhat aligned', 'Aligned', 'Strongly aligned', '2026-01-30T00:00:00Z', NULL);

-- 1.5 Engagement / Weighting
INSERT INTO items (item_id, item_key, short_label, item_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18', 'engagement_intensity', 'Engagement', 'Engagement: How intensively did you engage with this problem or solution before rating?', 5, 'Very little', 'Little', 'Moderate', 'Intensive', 'Very intensive', '2026-01-30T00:00:00Z', NULL);

--------------------------------------------------------------------------------
-- 3. INVENTORIES (5 inventories from Ch.24)
--------------------------------------------------------------------------------

INSERT INTO inventories (inventory_id, inventory_key, name, description, is_active, created_at, retired_at) VALUES
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'problem_eval', 'ProblemEval – Problem Quality & Hackathon Suitability', 'Used for PO self-assessment, moderator quality gate, and agent pre-review (context-dependent).', 1, '2026-01-30T00:00:00Z', NULL),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'quality_gate', 'QualityGate – Moderator Pre-Screening', 'Moderator screening: suitability, clarity, testability, alignment, plus value signals.', 1, '2026-01-30T00:00:00Z', NULL),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'pitch_assessment', 'Pitch – Live Voting During Pitches', 'Fast live rating during event pitches to guide selection.', 1, '2026-01-30T00:00:00Z', NULL),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'review_assessment', 'Review – Post-Pitch / Post-Sprint Review', 'Review of outcomes and solutions (manual first, later partly automated), including code quality dimensions.', 1, '2026-01-30T00:00:00Z', NULL),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'lessons_learned', 'LessonsLearned – Delayed Reflection', 'One-week-later reflection by PO; includes core quality/value items plus free-text (free-text stored elsewhere later).', 1, '2026-01-30T00:00:00Z', NULL);

--------------------------------------------------------------------------------
-- 4. INVENTORY COMPOSITIONS (inventory_items mappings from Ch.24)
--------------------------------------------------------------------------------

-- problem_eval (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'problem_clarity', 1),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'acceptance_criteria_quality', 2),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'testability', 3),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'internal_structure', 4),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'complexity_suitability', 5),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'personal_value', 6),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'general_importance', 7),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'event_alignment', 8),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'engagement_intensity', 9);

-- quality_gate (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'problem_clarity', 1),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'acceptance_criteria_quality', 2),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'testability', 3),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'internal_structure', 4),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'complexity_suitability', 5),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'event_alignment', 6),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'general_importance', 7),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'personal_value', 8),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'engagement_intensity', 9);

-- pitch_assessment (6 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'general_importance', 1),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'personal_value', 2),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'event_alignment', 3),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'complexity_suitability', 4),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'problem_clarity', 5),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'engagement_intensity', 6);

-- review_assessment (10 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'correctness', 1),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'test_support', 2),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'code_readability', 3),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'simplicity', 4),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'elegance', 5),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'extensibility', 6),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'completion_degree', 7),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'time_efficiency', 8),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'engagement_intensity', 9),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'cognitive_ease', 10);

-- lessons_learned (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'problem_clarity', 1),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'acceptance_criteria_quality', 2),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'testability', 3),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'internal_structure', 4),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'complexity_suitability', 5),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'event_alignment', 6),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'general_importance', 7),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'personal_value', 8),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'engagement_intensity', 9);
