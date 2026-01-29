-- VibeCoding Professionals Platform - Reference Data Seed
-- Run AFTER schema.sql: sqlite3 meetup.db < seed_reference_data.sql
--
-- Contents:
-- 1. Catalog tables (decision types, roles, states, contexts)
-- 2. Items (18 evaluation items from Ch.24)
-- 3. Inventories (5 inventories from Ch.24)
-- 4. Inventory compositions (inventory_items mappings)

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- 1. CATALOG TABLES
--------------------------------------------------------------------------------

-- Decision types (14 types - no recommended_* per Ch.10.2)
INSERT INTO decision_type_catalog (type_key, display_name, category, is_active, created_at) VALUES
  ('submitted', 'Submitted', 'readiness', 1, '2026-01-29T00:00:00Z'),
  ('accepted', 'Accepted', 'readiness', 1, '2026-01-29T00:00:00Z'),
  ('rejected', 'Rejected', 'readiness', 1, '2026-01-29T00:00:00Z'),
  ('selected_for_meetup', 'Selected for Meetup', 'action', 1, '2026-01-29T00:00:00Z'),
  ('deferred_po_absent', 'Deferred: PO Absent', 'action', 1, '2026-01-29T00:00:00Z'),
  ('deferred_low_priority', 'Deferred: Low Priority', 'action', 1, '2026-01-29T00:00:00Z'),
  ('deferred_complexity', 'Deferred: Complexity', 'action', 1, '2026-01-29T00:00:00Z'),
  ('deferred_future_capability', 'Deferred: Future Capability', 'action', 1, '2026-01-29T00:00:00Z'),
  ('dropped_low_relevance', 'Dropped: Low Relevance', 'action', 1, '2026-01-29T00:00:00Z'),
  ('dropped_insufficient_quality', 'Dropped: Insufficient Quality', 'action', 1, '2026-01-29T00:00:00Z'),
  ('opened_for_pitch_assessment', 'Opened for Pitch', 'assessment', 1, '2026-01-29T00:00:00Z'),
  ('closed_for_pitch_assessment', 'Closed for Pitch', 'assessment', 1, '2026-01-29T00:00:00Z'),
  ('opened_for_review', 'Opened for Review', 'assessment', 1, '2026-01-29T00:00:00Z'),
  ('closed_for_review', 'Closed for Review', 'assessment', 1, '2026-01-29T00:00:00Z');

-- User roles (7 roles)
INSERT INTO user_role_catalog (role_key, display_name, can_be_admin, is_active, created_at) VALUES
  ('observer', 'Observer', 0, 1, '2026-01-29T00:00:00Z'),
  ('developer', 'Developer', 0, 1, '2026-01-29T00:00:00Z'),
  ('coding_partner', 'Coding Partner', 0, 1, '2026-01-29T00:00:00Z'),
  ('problem_owner', 'Problem Owner', 0, 1, '2026-01-29T00:00:00Z'),
  ('moderator', 'Moderator', 1, 1, '2026-01-29T00:00:00Z'),
  ('admin', 'Administrator', 1, 1, '2026-01-29T00:00:00Z'),
  ('agent', 'Agent (AI)', 0, 1, '2026-01-29T00:00:00Z');

-- Readiness states (4 states)
INSERT INTO readiness_state_catalog (state_key, display_name, is_active, created_at) VALUES
  ('draft', 'Draft', 1, '2026-01-29T00:00:00Z'),
  ('submitted', 'Submitted', 1, '2026-01-29T00:00:00Z'),
  ('accepted', 'Accepted', 1, '2026-01-29T00:00:00Z'),
  ('rejected', 'Rejected', 1, '2026-01-29T00:00:00Z');

-- Action states (4 states)
INSERT INTO action_state_catalog (state_key, display_name, is_active, created_at) VALUES
  ('backlog', 'Backlog', 1, '2026-01-29T00:00:00Z'),
  ('selected_for_meetup', 'Selected for Meetup', 1, '2026-01-29T00:00:00Z'),
  ('deferred', 'Deferred', 1, '2026-01-29T00:00:00Z'),
  ('dropped', 'Dropped', 1, '2026-01-29T00:00:00Z');

-- Time contexts (5 contexts)
INSERT INTO time_context_catalog (context_key, display_name, is_active, created_at) VALUES
  ('pre_meetup', 'Pre-Meetup', 1, '2026-01-29T00:00:00Z'),
  ('pitch', 'Pitch', 1, '2026-01-29T00:00:00Z'),
  ('review', 'Review', 1, '2026-01-29T00:00:00Z'),
  ('post_meetup', 'Post-Meetup', 1, '2026-01-29T00:00:00Z'),
  ('late_reflection', 'Late Reflection', 1, '2026-01-29T00:00:00Z');

-- Queue states (4 states)
INSERT INTO queue_state_catalog (state_key, display_name, is_active, created_at) VALUES
  ('candidate', 'Candidate', 1, '2026-01-29T00:00:00Z'),
  ('selected_for_pitch', 'Selected for Pitch', 1, '2026-01-29T00:00:00Z'),
  ('selected_for_coding', 'Selected for Coding', 1, '2026-01-29T00:00:00Z'),
  ('completed', 'Completed', 1, '2026-01-29T00:00:00Z');

--------------------------------------------------------------------------------
-- 2. ITEMS (18 evaluation items from Ch.24)
--------------------------------------------------------------------------------

-- 1.1 Core Outcome & Quality (implementation-focused)
INSERT INTO items (item_id, item_key, short_label, full_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('0d2b6f6a-28c3-4d8b-9af6-3f9f9f6c4d01', 'correctness', 'Correctness', 'Correctness: The solution meets the stated requirements (including edge cases) and behaves as intended.', 5, 'Incorrect / misleading', 'Partly correct', 'Mostly correct', 'Correct with minor issues', 'Fully correct', '2026-01-29T00:00:00Z', NULL),
  ('8fa2e7a2-0e0a-4c6d-b8db-7b7a0c7e0a02', 'test_support', 'Test Support', 'Test support: Evidence (tests or equivalent checks) convincingly supports correctness.', 5, 'No evidence', 'Weak evidence', 'Some evidence', 'Strong evidence', 'Convincing evidence', '2026-01-29T00:00:00Z', NULL),
  ('c03a7f23-56df-4b65-a0a6-4b2a62fb0a03', 'code_readability', 'Readability', 'Readability: The code is easy to read and understand (naming, structure, local reasoning).', 5, 'Hard to read', 'Often unclear', 'Acceptable', 'Clear', 'Exceptionally clear', '2026-01-29T00:00:00Z', NULL),
  ('7e51a8e5-2f7a-46b1-9a0e-85f8b7f48a04', 'simplicity', 'Simplicity', 'Simplicity: The solution avoids unnecessary complexity and bloat.', 5, 'Overcomplicated', 'Some bloat', 'Reasonable', 'Lean', 'Minimal & sufficient', '2026-01-29T00:00:00Z', NULL),
  ('b0f1c2c6-9f5e-43ff-9d1d-3f1e884b2a05', 'elegance', 'Elegance', 'Elegance: The solution uses fitting language constructs and exhibits a clean, teachable structure.', 5, 'Hacky / awkward', 'Somewhat clumsy', 'Fine', 'Clean', 'Elegant & robust', '2026-01-29T00:00:00Z', NULL),
  ('f6a94c2a-3a63-4cc3-9e4e-fc46c4c1aa06', 'extensibility', 'Extensibility', 'Extensibility: The design can accommodate likely requirement changes with minimal rework (without overengineering).', 5, 'Fragile', 'Hard to extend', 'Moderately extendable', 'Easy to extend', 'Highly extensible', '2026-01-29T00:00:00Z', NULL);

-- 1.2 Task Completion & Efficiency (process-focused)
INSERT INTO items (item_id, item_key, short_label, full_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('1c88d55b-3d2d-4d2d-9f1b-6f27c5f80b07', 'completion_degree', 'Completion', 'Completion: How much of the intended task scope was achieved.', 5, 'Not achieved', 'Small fraction', 'Partial', 'Almost complete', 'Complete', '2026-01-29T00:00:00Z', NULL),
  ('a54c2b9a-6f30-4a9c-a1d1-4bd33f6e6a08', 'time_efficiency', 'Time Efficiency', 'Time efficiency: Given the time constraints, the approach produced strong progress per unit time.', 5, 'Inefficient', 'Slow progress', 'OK', 'Fast progress', 'Exceptional progress', '2026-01-29T00:00:00Z', NULL),
  ('d0fb0c0f-4f2e-4d2a-9f52-8fda13b7aa09', 'cognitive_load', 'Cognitive Load', 'Mental load: How mentally demanding was it to follow, supervise, and validate the process?', 10, 'Very low load', NULL, NULL, NULL, 'Extremely high load', '2026-01-29T00:00:00Z', NULL);

-- 1.3 Problem Card / Requirements Quality (problem-centered)
INSERT INTO items (item_id, item_key, short_label, full_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10', 'problem_clarity', 'Clarity', 'Clarity: The problem statement is clear and unambiguous.', 5, 'Very unclear', 'Unclear', 'Mixed', 'Clear', 'Very clear', '2026-01-29T00:00:00Z', NULL),
  ('5d6b1a32-9f1a-4a5a-bc3c-3e2d9b1caa11', 'acceptance_criteria_quality', 'Acceptance Criteria', 'Acceptance criteria: The success conditions are explicit enough to judge outcomes.', 5, 'Missing', 'Vague', 'Somewhat defined', 'Well defined', 'Precisely defined', '2026-01-29T00:00:00Z', NULL),
  ('9b9f3b1a-2c3a-4cba-a56d-8f0c1d9caa12', 'testability', 'Testability', 'Testability: It is feasible to validate correctness via tests, checks, or reproducible procedures.', 5, 'Not testable', 'Hard to test', 'Somewhat testable', 'Testable', 'Highly testable', '2026-01-29T00:00:00Z', NULL),
  ('6f5b2c21-08b4-4c1a-9d7f-2fa6f1c2aa13', 'internal_structure', 'Structure', 'Internal structure: The task is decomposed into coherent sub-tasks or milestones.', 5, 'No structure', 'Weak structure', 'Some structure', 'Well structured', 'Excellent decomposition', '2026-01-29T00:00:00Z', NULL),
  ('3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa14', 'complexity_fit', 'Complexity Fit', 'Complexity fit: The problem difficulty is appropriate for the meetup sprint format.', 5, 'Too small / trivial', 'Somewhat small', 'Good fit', 'Somewhat too hard', 'Too hard for sprint', '2026-01-29T00:00:00Z', NULL);

-- 1.4 Business Value & Community Fit (selection-focused)
INSERT INTO items (item_id, item_key, short_label, full_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15', 'personal_value', 'Personal Value', 'Personal value: If completed, I would personally benefit from or use this outcome.', 5, 'No value to me', 'Low value', 'Some value', 'High value', 'Very high value', '2026-01-29T00:00:00Z', NULL),
  ('7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16', 'general_importance', 'Importance', 'General importance: This seems broadly valuable or important to the community.', 5, 'Not important', 'Low importance', 'Moderate', 'Important', 'Very important', '2026-01-29T00:00:00Z', NULL),
  ('1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17', 'meetup_alignment', 'Meetup Alignment', 'Meetup alignment: This problem supports comparing agentic coding approaches and requirements-driven quality thinking.', 5, 'Not aligned', 'Weakly aligned', 'Somewhat aligned', 'Aligned', 'Strongly aligned', '2026-01-29T00:00:00Z', NULL);

-- 1.5 Engagement / Weighting
INSERT INTO items (item_id, item_key, short_label, full_text, max_rating, label_min, label_low_mid, label_mid, label_high_mid, label_max, created_at, retired_at) VALUES
  ('0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18', 'engagement_intensity', 'Engagement', 'Engagement: How intensively did you engage with this problem or solution before rating?', 5, 'Very little', 'Little', 'Moderate', 'Intensive', 'Very intensive', '2026-01-29T00:00:00Z', NULL);

--------------------------------------------------------------------------------
-- 3. INVENTORIES (5 inventories from Ch.24)
--------------------------------------------------------------------------------

INSERT INTO inventories (inventory_id, inventory_key, name, description, is_active, created_at, retired_at) VALUES
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'problem_eval', 'ProblemEval – Problem Quality & Hackathon Suitability', 'Used for PO self-assessment, moderator quality gate, and agent pre-review (context-dependent).', 1, '2026-01-29T00:00:00Z', NULL),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'quality_gate', 'QualityGate – Moderator Pre-Screening', 'Moderator screening: suitability, clarity, testability, alignment, plus value signals.', 1, '2026-01-29T00:00:00Z', NULL),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'pitch_assessment', 'Pitch – Live Voting During Pitches', 'Fast live rating during meetup pitches to guide selection.', 1, '2026-01-29T00:00:00Z', NULL),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'review_assessment', 'Review – Post-Pitch / Post-Sprint Review', 'Review of outcomes and solutions (manual first, later partly automated), including code quality dimensions.', 1, '2026-01-29T00:00:00Z', NULL),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'lessons_learned', 'LessonsLearned – Delayed Reflection', 'One-week-later reflection by PO; includes core quality/value items plus free-text (free-text stored elsewhere later).', 1, '2026-01-29T00:00:00Z', NULL);

--------------------------------------------------------------------------------
-- 4. INVENTORY COMPOSITIONS (inventory_items mappings from Ch.24)
--------------------------------------------------------------------------------

-- problem_eval (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'problem_clarity', 1),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'acceptance_criteria_quality', 2),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'testability', 3),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'internal_structure', 4),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'complexity_fit', 5),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'personal_value', 6),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'general_importance', 7),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'meetup_alignment', 8),
  ('7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01', 'engagement_intensity', 9);

-- quality_gate (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'problem_clarity', 1),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'acceptance_criteria_quality', 2),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'testability', 3),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'internal_structure', 4),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'complexity_fit', 5),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'meetup_alignment', 6),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'general_importance', 7),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'personal_value', 8),
  ('3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02', 'engagement_intensity', 9);

-- pitch_assessment (6 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'general_importance', 1),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'personal_value', 2),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'meetup_alignment', 3),
  ('4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03', 'complexity_fit', 4),
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
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'cognitive_load', 9),
  ('9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04', 'engagement_intensity', 10);

-- lessons_learned (9 items)
INSERT INTO inventory_items (inventory_id, item_key, position_index) VALUES
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'problem_clarity', 1),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'acceptance_criteria_quality', 2),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'testability', 3),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'internal_structure', 4),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'complexity_fit', 5),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'meetup_alignment', 6),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'general_importance', 7),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'personal_value', 8),
  ('2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05', 'engagement_intensity', 9);
