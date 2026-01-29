# Database Bootstrap – Pre-Population Pack (Items + Inventories)
Human-readable pre-population set (to be translated into SQL INSERTs later).
Assumes the latest schema:
- `items` are immutable versions referenced by `item_id` (UUID) and stable `item_key`
- `inventories` reference `item_key` via `inventory_items`
- Allowed `max_rating`: 1, 2, 3, 5, 7, 10
- Labels are stored in: label_min, label_low_mid, label_mid, label_high_mid, label_max
- Conventions used here:
  - max_rating=5 for most Likert items (fully verbalized)
  - max_rating=10 only where fine-grained “slider-like” resolution is beneficial (extremes labeled)

---

## 1) Items (insert into `items`)

### Scale label conventions used below
- For max_rating=5: all five labels are set
- For max_rating=10: only label_min and label_max are set (others NULL)

> All `retired_at` = NULL (active).  
> All IDs below are unique UUIDs (example values).

---

### 1.1 Core Outcome & Quality (implementation-focused)

- item_id: **0d2b6f6a-28c3-4d8b-9af6-3f9f9f6c4d01**
  item_key: **correctness**
  item_category: quality_core
  max_rating: **5**
  prompt_text: "Correctness: The solution meets the stated requirements (including edge cases) and behaves as intended."
  label_min: "Incorrect / misleading"
  label_low_mid: "Partly correct"
  label_mid: "Mostly correct"
  label_high_mid: "Correct with minor issues"
  label_max: "Fully correct"

- item_id: **8fa2e7a2-0e0a-4c6d-b8db-7b7a0c7e0a02**
  item_key: **test_support**
  item_category: quality_core
  max_rating: **5**
  prompt_text: "Test support: Evidence (tests or equivalent checks) convincingly supports correctness."
  label_min: "No evidence"
  label_low_mid: "Weak evidence"
  label_mid: "Some evidence"
  label_high_mid: "Strong evidence"
  label_max: "Convincing evidence"

- item_id: **c03a7f23-56df-4b65-a0a6-4b2a62fb0a03**
  item_key: **code_readability**
  item_category: code_quality
  max_rating: **5**
  prompt_text: "Readability: The code is easy to read and understand (naming, structure, local reasoning)."
  label_min: "Hard to read"
  label_low_mid: "Often unclear"
  label_mid: "Acceptable"
  label_high_mid: "Clear"
  label_max: "Exceptionally clear"

- item_id: **7e51a8e5-2f7a-46b1-9a0e-85f8b7f48a04**
  item_key: **simplicity**
  item_category: code_quality
  max_rating: **5**
  prompt_text: "Simplicity: The solution avoids unnecessary complexity and bloat."
  label_min: "Overcomplicated"
  label_low_mid: "Some bloat"
  label_mid: "Reasonable"
  label_high_mid: "Lean"
  label_max: "Minimal & sufficient"

- item_id: **b0f1c2c6-9f5e-43ff-9d1d-3f1e884b2a05**
  item_key: **elegance**
  item_category: code_quality
  max_rating: **5**
  prompt_text: "Elegance: The solution uses fitting language constructs and exhibits a clean, teachable structure."
  label_min: "Hacky / awkward"
  label_low_mid: "Somewhat clumsy"
  label_mid: "Fine"
  label_high_mid: "Clean"
  label_max: "Elegant & robust"

- item_id: **f6a94c2a-3a63-4cc3-9e4e-fc46c4c1aa06**
  item_key: **extensibility**
  item_category: architecture
  max_rating: **5**
  prompt_text: "Extensibility: The design can accommodate likely requirement changes with minimal rework (without overengineering)."
  label_min: "Fragile"
  label_low_mid: "Hard to extend"
  label_mid: "Moderately extendable"
  label_high_mid: "Easy to extend"
  label_max: "Highly extensible"

---

### 1.2 Task Completion & Efficiency (process-focused)

- item_id: **1c88d55b-3d2d-4d2d-9f1b-6f27c5f80b07**
  item_key: **completion_degree**
  item_category: outcome_process
  max_rating: **5**
  prompt_text: "Completion: How much of the intended task scope was achieved."
  label_min: "Not achieved"
  label_low_mid: "Small fraction"
  label_mid: "Partial"
  label_high_mid: "Almost complete"
  label_max: "Complete"

- item_id: **a54c2b9a-6f30-4a9c-a1d1-4bd33f6e6a08**
  item_key: **time_efficiency**
  item_category: outcome_process
  max_rating: **5**
  prompt_text: "Time efficiency: Given the time constraints, the approach produced strong progress per unit time."
  label_min: "Inefficient"
  label_low_mid: "Slow progress"
  label_mid: "OK"
  label_high_mid: "Fast progress"
  label_max: "Exceptional progress"

- item_id: **d0fb0c0f-4f2e-4d2a-9f52-8fda13b7aa09**
  item_key: **cognitive_load**
  item_category: human_factors
  max_rating: **10**
  prompt_text: "Mental load: How mentally demanding was it to follow, supervise, and validate the process?"
  label_min: "Very low load"
  label_max: "Extremely high load"
  (label_low_mid/label_mid/label_high_mid: NULL)

---

### 1.3 Problem Card / Requirements Quality (problem-centered)

- item_id: **2b6c0b5b-0a1f-4b5d-b5a4-4bd7e9a9aa10**
  item_key: **problem_clarity**
  item_category: problem_quality
  max_rating: **5**
  prompt_text: "Clarity: The problem statement is clear and unambiguous."
  label_min: "Very unclear"
  label_low_mid: "Unclear"
  label_mid: "Mixed"
  label_high_mid: "Clear"
  label_max: "Very clear"

- item_id: **5d6b1a32-9f1a-4a5a-bc3c-3e2d9b1caa11**
  item_key: **acceptance_criteria_quality**
  item_category: problem_quality
  max_rating: **5**
  prompt_text: "Acceptance criteria: The success conditions are explicit enough to judge outcomes."
  label_min: "Missing"
  label_low_mid: "Vague"
  label_mid: "Somewhat defined"
  label_high_mid: "Well defined"
  label_max: "Precisely defined"

- item_id: **9b9f3b1a-2c3a-4cba-a56d-8f0c1d9caa12**
  item_key: **testability**
  item_category: problem_quality
  max_rating: **5**
  prompt_text: "Testability: It is feasible to validate correctness via tests, checks, or reproducible procedures."
  label_min: "Not testable"
  label_low_mid: "Hard to test"
  label_mid: "Somewhat testable"
  label_high_mid: "Testable"
  label_max: "Highly testable"

- item_id: **6f5b2c21-08b4-4c1a-9d7f-2fa6f1c2aa13**
  item_key: **internal_structure**
  item_category: problem_quality
  max_rating: **5**
  prompt_text: "Internal structure: The task is decomposed into coherent sub-tasks or milestones."
  label_min: "No structure"
  label_low_mid: "Weak structure"
  label_mid: "Some structure"
  label_high_mid: "Well structured"
  label_max: "Excellent decomposition"

- item_id: **3d0e3c9a-5a61-4a55-8a8e-4d6b5a9eaa14**
  item_key: **complexity_fit**
  item_category: problem_quality
  max_rating: **5**
  prompt_text: "Complexity fit: The problem difficulty is appropriate for the meetup sprint format."
  label_min: "Too small / trivial"
  label_low_mid: "Somewhat small"
  label_mid: "Good fit"
  label_high_mid: "Somewhat too hard"
  label_max: "Too hard for sprint"

---

### 1.4 Business Value & Community Fit (selection-focused)

- item_id: **4a2f5e9c-7b4b-4b27-9f5e-4e8d1f9faa15**
  item_key: **personal_value**
  item_category: value
  max_rating: **5**
  prompt_text: "Personal value: If completed, I would personally benefit from or use this outcome."
  label_min: "No value to me"
  label_low_mid: "Low value"
  label_mid: "Some value"
  label_high_mid: "High value"
  label_max: "Very high value"

- item_id: **7b4f1a3d-5d9e-4bd1-8db5-5c9e1f0baa16**
  item_key: **general_importance**
  item_category: value
  max_rating: **5**
  prompt_text: "General importance: This seems broadly valuable or important to the community."
  label_min: "Not important"
  label_low_mid: "Low importance"
  label_mid: "Moderate"
  label_high_mid: "Important"
  label_max: "Very important"

- item_id: **1e9c2d7a-4c8f-4e27-8a1f-7a9b1c2caa17**
  item_key: **meetup_alignment**
  item_category: strategy
  max_rating: **5**
  prompt_text: "Meetup alignment: This problem supports comparing agentic coding approaches and requirements-driven quality thinking."
  label_min: "Not aligned"
  label_low_mid: "Weakly aligned"
  label_mid: "Somewhat aligned"
  label_high_mid: "Aligned"
  label_max: "Strongly aligned"

---

### 1.5 Engagement / Weighting (always last in most inventories)

- item_id: **0b7a9c2d-6d3e-4c2a-9a1f-3b7c9d1daa18**
  item_key: **engagement_intensity**
  item_category: metadata
  max_rating: **5**
  prompt_text: "Engagement: How intensively did you engage with this problem or solution before rating?"
  label_min: "Very little"
  label_low_mid: "Little"
  label_mid: "Moderate"
  label_high_mid: "Intensive"
  label_max: "Very intensive"

---

## 2) Inventories (insert into `inventories`)

> Each inventory has an inventory_id (UUID) and a stable inventory_key.

- inventory_id: **7d2b0f3a-2c7f-4b1e-9a6c-0f4c1a9b0b01**
  inventory_key: **problem_eval**
  title: "ProblemEval – Problem Quality & Hackathon Suitability"
  description: "Used for PO self-assessment, moderator quality gate, and agent pre-review (context-dependent)."

- inventory_id: **3a1c7b2d-6e5f-4a3b-9a2d-1c6e7f8a0b02**
  inventory_key: **quality_gate**
  title: "QualityGate – Moderator Pre-Screening"
  description: "Moderator screening: suitability, clarity, testability, alignment, plus value signals."

- inventory_id: **4c9a2b1d-8f7e-4c1a-9b3e-2d7e8f9a0b03**
  inventory_key: **pitch_assessment**
  title: "Pitch – Live Voting During Pitches"
  description: "Fast live rating during meetup pitches to guide selection."

- inventory_id: **9f0a1b2c-3d4e-4f5a-9b6c-3e4f5a6b0b04**
  inventory_key: **review_assessment**
  title: "Review – Post-Pitch / Post-Sprint Review"
  description: "Review of outcomes and solutions (manual first, later partly automated), including code quality dimensions."

- inventory_id: **2b3c4d5e-6f7a-4b8c-9d0e-4f5a6b7c0b05**
  inventory_key: **lessons_learned**
  title: "LessonsLearned – Delayed Reflection"
  description: "One-week-later reflection by PO; includes core quality/value items plus free-text (free-text stored elsewhere later)."

---

## 3) Inventory Composition (insert into `inventory_items`)
`inventory_items` references `item_key` and defines order (`position`).

### 3.1 problem_eval
inventory_key: **problem_eval**
1. problem_clarity
2. acceptance_criteria_quality
3. testability
4. internal_structure
5. complexity_fit
6. personal_value
7. general_importance
8. meetup_alignment
9. engagement_intensity

### 3.2 quality_gate
inventory_key: **quality_gate**
1. problem_clarity
2. acceptance_criteria_quality
3. testability
4. internal_structure
5. complexity_fit
6. meetup_alignment
7. general_importance
8. personal_value
9. engagement_intensity

### 3.3 pitch_assessment
inventory_key: **pitch_assessment**
1. general_importance
2. personal_value
3. meetup_alignment
4. complexity_fit
5. problem_clarity
6. engagement_intensity

### 3.4 review_assessment
inventory_key: **review_assessment**
1. correctness
2. test_support
3. code_readability
4. simplicity
5. elegance
6. extensibility
7. completion_degree
8. time_efficiency
9. cognitive_load   (10-point)
10. engagement_intensity

### 3.5 lessons_learned
inventory_key: **lessons_learned**
1. problem_clarity
2. acceptance_criteria_quality
3. testability
4. internal_structure
5. complexity_fit
6. meetup_alignment
7. general_importance
8. personal_value
9. engagement_intensity
(Free-text reflection fields are intentionally omitted here; they are not part of the current DB scope.)

---

## 4) Optional: Item Key Index (quick reference)
- correctness
- test_support
- code_readability
- simplicity
- elegance
- extensibility
- completion_degree
- time_efficiency
- cognitive_load
- problem_clarity
- acceptance_criteria_quality
- testability
- internal_structure
- complexity_fit
- personal_value
- general_importance
- meetup_alignment
- engagement_intensity
