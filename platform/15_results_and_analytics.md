# 15. Results and Analytics

This chapter specifies how **assessment results and decisions are transformed into interpretable analytics**. It focuses on *views*, *filters*, and *statistical summaries* that support moderators, problem owners, and researchers in understanding outcomes without over-interpreting raw data. The chapter intentionally limits itself to presentation and aggregation semantics; data provenance, item definitions, and decision logic are defined elsewhere.

---

## 15.1 Rating Results Views

Rating Results Views provide **read-only, aggregated representations** of assessment data associated with a Problem Card. They are accessible from the Problem Card via explicit navigation (e.g., “See rating results”) and never modify underlying data.

**Primary characteristics:**
- Results are displayed **per Inventory**, grouped by Item short title.
- Each Item row presents **descriptive statistics**, not raw individual responses.
- Views default to the **current major and latest minor version** of the Problem.
- Results are clearly labeled with **contextual scope** (version, phase, role, location).

**Standard metrics displayed per Item:**
- `N` (number of valid responses)
- `Mean (M)`
- `Standard Deviation (SD)`
- `Minimum (min)`
- `Maximum (max)`

**Design principles:**
- **Pitch assessments**: No rankings or automatic winner indicators. Focus on descriptive statistics to inform discussion.
- **Review assessments**: Rankings and comparative displays are shown after moderator confirmation. Star awards (1st/2nd/3rd place) are based on weighted review scores (Chapter 33.6.4) with moderator adjustment authority for extraordinary circumstances. Awards require explicit moderator decision (Chapter 10).
- Visual encoding favors clarity over persuasion (tables first, charts optional).
- All competitive indicators (rankings, stars) require explicit moderator decisions and do not automatically change system state.

**Audience alignment:**
- Moderators: quick situational overview during live discussions.
- Problem Owners: structured feedback on clarity, suitability, and outcomes.
- Analysts: clean entry point for deeper statistical interpretation.

---

## 15.2 Filtering by Version, Context, and Phase

All analytics are governed by **explicit, user-controlled filters**. No implicit aggregation across incompatible contexts is permitted.

### 15.2.1 Version Filtering
- **Major Version**: selectable list; default is latest major version.
- **Minor Version**: hidden by default; expandable (“Show minor versions”).
- Multi-selection is supported to enable **longitudinal comparison**.
- Archived versions are clearly labeled as historical snapshots.

### 15.2.2 Contextual Filters
Users may constrain analytics along orthogonal dimensions:

- **Time Context / Phase** (from `time_context_catalog`, Chapter 19.2.5)
  - Pre-event
  - Pitch
  - Review
  - Post-event
  - Late reflection

- **Role** (all seven roles)
  - Observer
  - Developer
  - Coding Partner
  - Problem Owner
  - Moderator
  - Administrator
  - Agent

- **Location**
  - In presence
  - Remote

- **Geographic Location**
  - Cologne
  - Aachen
  - All locations

- **Event**
  - Specific event (e.g., "Cologne March 2026")
  - All events at location
  - All events (cross-location)

Each filter can be toggled independently. Active filters are always visible and can be reset with a single action.

### 15.2.4 Cross-Location Learning

The platform supports a **multi-location community** (Cologne, Aachen, with potential expansion). Analytics and lessons learned follow the cross-location hierarchy defined in Chapter 12.5: own location (primary), other locations' valuable lessons (secondary), all-time valuable insights (tertiary).

**Valuable lessons** refers to:
1. Structured entries in the `lessons_learned` table flagged with `valuable = TRUE` (Chapter 4.2, Chapter 31)
2. Chat messages flagged with `valuable_insight = TRUE` (Chapter 31.12)

Both sources feed cross-location analytics when flagged by Problem Owners or moderators.

**Lessons Learned Aggregation:**
| View | Scope |
|------|-------|
| Problem-specific | All lessons for that problem across all events |
| Event-specific | All lessons from problems at that event |
| Location-specific | All lessons from events at that location |
| Cross-location | Valuable lessons from all locations (filtered) |

### 15.2.3 Filter Semantics
- Filters are **intersectional** (AND logic), not hierarchical.
- Empty result sets are valid and explicitly indicated.
- Filter changes are non-destructive and reversible.

This design ensures that analytics remain **context-faithful**, preventing accidental mixing of incomparable situations (e.g., pre-event self-assessments with live pitch reviews).

---

## 15.3 Statistical Aggregation and Presentation

The system supports **descriptive statistics only** at the UI level. Inferential statistics are intentionally out of scope for built-in views, preserving neutrality and methodological openness.

### 15.3.1 Aggregation Rules
- All aggregations operate on **integer-coded item responses**. Responses are stored as integers (1-10) regardless of input method (button scale, slider, etc. per Chapter 26); aggregations treat all values uniformly.
- Missing responses are excluded listwise per Item.
- No weighting is applied unless explicitly selected (e.g., engagement-based stratification).
- Aggregations are recalculated dynamically based on active filters.

### 15.3.2 Presentation Standards
- Tables are the canonical format.
- Charts (if enabled) are secondary and optional.
- Numeric precision is consistent and modest (e.g., one decimal place for means).
- Confidence intervals and p-values are not shown by default.

### 15.3.3 Interpretive Guardrails
To prevent misuse or over-interpretation:
- Small-N warnings are displayed when appropriate.
- Heterogeneous context warnings appear when broad filters are applied.
- Decisions are never derived automatically from statistics.

### 15.3.4 Export and Downstream Use

Every analytics view and audit screen that displays tabular data includes a **"Download CSV"** button (admin-only). The export captures exactly what the current view shows, including all active filters.

**Export-enabled views**:
- Rating results (Ch.15.1) — per-inventory aggregates with N, Mean, SD, Min, Max
- Decision history timeline (Ch.13.6.4) — full decision log for a problem
- Global audit views (Ch.12.6) — cross-event decision histories, assessment usage, show-up rates
- Contributor wall / points ledger (Ch.33.6) — points breakdown by user

**Export behavior**:
- CSV format with UTF-8 BOM for Excel compatibility
- Filename convention: `{view_name}_{ISO_date}.csv` (e.g., `rating_results_2026-02-25.csv`)
- Includes all columns visible in the current filtered view
- No row limit — exports the full dataset matching the active filters
- Triggered client-side from the rendered data; no separate server-side export endpoint required

**Design rationale**: CSV export from existing views keeps the implementation minimal — no new API endpoints, no format negotiation, no pagination. It also doubles as a **debugging aid**: administrators can verify what the system displays matches expectations. For programmatic access, the future Agent REST API (Ch.22) will provide JSON endpoints that subsume this capability.

The underlying analytics layer is designed so that:
- All displayed aggregates can be reproduced via database queries.
- External tools (e.g., statistical software) can consume the same data without semantic loss.

---

## 15.4 Actionable Feedback System

Raw statistics inform but don't guide. This section specifies how assessment results are translated into **actionable guidance** for Problem Owners and participants.

### 15.4.1 Problem Owner Feedback View

After assessments close, Problem Owners see a dedicated feedback panel:

```
Feedback for "API Rate Limiter"
────────────────────────────────

Overall Assessment
──────────────────
Your problem scored well on Clarity (4.2/5) and Complexity (3.8/5).
Areas for improvement: Scope Definition (2.9/5) and Test Coverage (2.6/5).

Specific Recommendations
────────────────────────
📝 Scope: Consider narrowing the acceptance criteria. Reviewers found
   the current scope "ambitious for a 90-minute sprint."

🧪 Testing: Add specific test scenarios to the problem description.
   Reviewers noted "unclear what 'correct' means for edge cases."

Comparative Context
───────────────────
• Your Clarity score (4.2) is above average for greenfield problems (3.6)
• Your Complexity score (3.8) is typical for this problem type (3.7)

What's Next?
────────────
• Consider these insights when refining for the next event
• [Create New Version] to incorporate feedback
• [View Full Results] for detailed breakdown
```

### 15.4.2 Rule-Based Recommendations

Recommendations are generated based on score thresholds and patterns:

| Condition | Recommendation |
|-----------|----------------|
| Clarity score < 3.0 | "Reviewers found the description unclear. Consider adding more context or examples." |
| Complexity score > 4.0 | "This problem may be too complex for a single sprint. Consider splitting into phases." |
| Testability score < 3.0 | "Add explicit test scenarios or acceptance criteria to help evaluators." |
| High SD (> 1.5) on any item | "Reviewers disagreed on {item}. This might indicate ambiguity to address." |
| Low N (< 5 responses) | "Limited feedback available. Results may not be representative." |

### 15.4.3 Comparative Context

To help interpret scores, show comparative baselines:

| Comparison Type | Description |
|-----------------|-------------|
| Problem type average | "Greenfield problems average 3.6 on Clarity" |
| Location average | "Cologne events average 3.8 on this dimension" |
| Historical trend | "Your v2 scored higher than v1 on Scope (+0.6)" |
| All-time benchmarks | "Top 10% of problems score 4.5+ on Clarity" |

**Note:** Comparisons are informational, not competitive. Language avoids "better/worse" framing.

### 15.4.4 Version Trend Visualization

For problems with multiple versions, show improvement over time:

```
Version Progress: "API Rate Limiter"
────────────────────────────────────

         Clarity  Complexity  Testability
v1.00      2.8       4.2         2.1
v2.00      3.6       3.8         3.2
v3.00      4.2       3.6         3.8

Trend: ↗️ Improving across all dimensions
```

**Visualization Options:**
- Simple table (default)
- Line chart (optional)
- Sparklines inline (compact)

### 15.4.5 "What to Improve" Summary

A concise, prioritized list of improvement opportunities:

```
Improvement Priorities
──────────────────────
1. 🔴 Testability (2.6/5) — Add acceptance criteria with test cases
2. 🟡 Scope (2.9/5) — Consider narrowing for sprint feasibility
3. 🟢 Clarity (4.2/5) — Strong! Maintain current approach
```

**Priority Colors:**
- 🔴 Red: Score < 3.0 (needs attention)
- 🟡 Yellow: Score 3.0-3.5 (room for improvement)
- 🟢 Green: Score > 3.5 (strength)

### 15.4.6 Review Assessment Feedback (Post-Sprint)

After coding sprints, show solution-focused feedback:

```
Solution Feedback: "API Rate Limiter"
─────────────────────────────────────

Your Team's Solution
────────────────────
Correctness: 4.2/5
Readability: 3.8/5
Test Coverage: 4.0/5
Elegance: 3.5/5

Community Comparison (3 solutions reviewed)
───────────────────────────────────────────
        Yours   Team B   Team C   Average
Correct  4.2     4.0      3.6      3.9
Tests    4.0     3.2      3.8      3.7
Overall  4.0     3.5      3.5      3.7

Your solution ranked #1 — Congratulations! ⭐⭐⭐
```

### 15.4.7 Moderator Feedback Summary

Moderators see aggregated feedback across problems:

```
Event Feedback Summary: VibeCoding Cologne Feb 2026
───────────────────────────────────────────────────

Problems Pitched: 3
Average Clarity Score: 3.9
Problems Needing Attention: 1 (Database Migration - scope too broad)

Solutions Reviewed: 6
Average Quality Score: 3.8
Outstanding Solutions: 2 (API Rate Limiter, CLI Parser)

Cross-Location Insights (from Aachen):
• "TDD with Claude works best when test file is open first"
• "Greenfield problems under 3 tasks get higher completion rates"
```

---

## 15.5 Chart Components and Visualizations

**Added 2026-02-05**: Chart library integration for visual data display (Decision #22).

### Chart Library Selection

**Library**: Chart.js 4.x
- Mature, well-documented, widely used
- Responsive canvas-based rendering
- Extensive customization options
- Good mobile support (touch-friendly tooltips)
- Accessible (screen reader support via aria-label on canvas)

**Integration**: Svelte wrapper components (not svelte-chartjs due to Svelte 5 incompatibility)
- Custom lifecycle management (onMount, onDestroy)
- Reactive props
- Design system integration (uses color tokens)

### Chart Component Specifications

**BarChart.svelte** (`charts/BarChart.svelte`):
- Purpose: Compare scores across items or problems
- Usage: Item-by-item mean scores, problem comparison
- Props: labels[], datasets[], height, horizontal, showLegend
- Colors: Uses problem color palette (--color-problem-1 through 8) for multi-series
- Mobile: Horizontal scroll if >10 bars, legend below chart

**LineChart.svelte** (`charts/LineChart.svelte`):
- Purpose: Trends over time or versions
- Usage: Version progression (v1 → v2 → v3 scores), temporal trends
- Props: labels[], datasets[], height, yMin, yMax
- Mobile: Legend below, pinch-to-zoom enabled
- Desktop: Legend right side

**SparkLine.svelte** (`charts/SparkLine.svelte`):
- Purpose: Inline micro-visualizations
- Usage: Trend indicators in tables, compact charts
- Props: values[], color, width (60px), height (20px)
- No axes, no labels, no tooltips - pure line
- Fixed size (not responsive)

### Responsive Chart Behavior

**Mobile (<768px)**:
- Canvas width: 100% of container
- Height: Fixed (300px default)
- Horizontal scroll: Enabled for wide charts (>10 data points)
- Tooltips: Tap to show (not hover), dismiss on tap elsewhere
- Legend: Always below chart (vertical space)

**Desktop (≥1024px)**:
- Canvas width: 100% up to max-width
- Height: 400px default (more vertical space)
- Tooltips: Hover to show
- Legend: Right side (uses horizontal space)

### Accessibility for Charts

**Canvas Accessibility**:
- `aria-label` describing chart content: "Bar chart showing mean scores per item"
- `role="img"` on canvas container
- Fallback: ResultsTable visible as alternative (table data more accessible than chart)

**Color Independence**:
- Chart data distinguishable without color (patterns, labels, tooltips)
- Don't rely solely on color for multi-series
- Use patterns or different bar styles if needed

**Reduced Motion**:
- No animated chart entry (instant render)
- Static charts for users with prefers-reduced-motion
- Defined in Chart.js config: `animation: { duration: reducedMotion ? 0 : 500 }`

### Chart Color Usage

**Single Series**: Use --color-primary (blue)
**Multi-Series** (comparing problems): Use problem color palette in pitch order
- Problem 1 (pitched first): --color-problem-1 (red)
- Problem 2 (pitched second): --color-problem-2 (blue)
- etc.

**Background**: Ensure sufficient contrast on --color-viewport or --color-canvas backgrounds

See Ch.26.11.21 for complete component specifications and Ch.26.12 for mobile patterns.

---

## 15.6 Relationship to Other Chapters

**Positioning within the system:**
Results and Analytics close the loop between *assessment* and *decision* without collapsing them. They provide shared situational awareness while preserving the system's core commitment to transparency, contextual integrity, and methodological humility.

**Related Chapters:**
- **Chapter 7**: Item definitions and inventory structure
- **Chapter 8**: Assessment mechanics
- **Chapter 12**: Dashboard views link to analytics and display contributor wall
- **Chapter 13**: Problem Card displays feedback links and assessment results navigation
- **Chapter 19**: Data model for responses and aggregations
- **Chapter 33**: Star awards based on review assessment scores
