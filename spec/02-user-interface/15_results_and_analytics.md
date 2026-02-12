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
- No rankings or composite scores are computed by default.
- No automatic “winner” or “best solution” indicators are inferred.
- Visual encoding favors clarity over persuasion (tables first, charts optional).

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

- **Time Context / Phase**
  - Pre-meetup
  - Pitch
  - Review
  - Post-meetup / Late reflection

- **Role**
  - Problem Owner
  - Developer
  - Observer
  - Moderator
  - Agent

- **Location**
  - In presence
  - Remote

Each filter can be toggled independently. Active filters are always visible and can be reset with a single action.

### 15.2.3 Filter Semantics
- Filters are **intersectional** (AND logic), not hierarchical.
- Empty result sets are valid and explicitly indicated.
- Filter changes are non-destructive and reversible.

This design ensures that analytics remain **context-faithful**, preventing accidental mixing of incomparable situations (e.g., pre-meetup self-assessments with live pitch reviews).

---

## 15.3 Statistical Aggregation and Presentation

The system supports **descriptive statistics only** at the UI level. Inferential statistics are intentionally out of scope for built-in views, preserving neutrality and methodological openness.

### 15.3.1 Aggregation Rules
- All aggregations operate on **integer-coded item responses**.
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
While not a core UI feature, the analytics layer is designed so that:
- All displayed aggregates can be reproduced via database queries.
- External tools (e.g., statistical software) can consume the same data without semantic loss.

---

**Positioning within the system:**  
Results and Analytics close the loop between *assessment* and *decision* without collapsing them. They provide shared situational awareness while preserving the system’s core commitment to transparency, contextual integrity, and methodological humility.
