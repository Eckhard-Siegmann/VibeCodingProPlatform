# 7. Inventories and Items

This chapter defines the **evaluation substrate** of the system: Inventories and Items. Together, they form the reusable, analyzable, and evolvable foundation for all structured assessments carried out on Problems.  
The design deliberately favors immutability, clarity, and longitudinal comparability over short-term flexibility.

---

## 7.1 Inventory Concept and Purpose

An **Inventory** is a named, ordered collection of Items that represents a *specific evaluative perspective* on a Problem.

Conceptually, an Inventory answers the question:

> *“Which dimensions do we want to look at right now, and in which order?”*

Key properties of Inventories:

- An Inventory contains **no answers**, only references to Items.
- Inventories are **contextual**, not universal:
  - The same Problem may be evaluated with different Inventories at different times.
  - Examples include:  
    *Problem suitability*, *Pitch assessment*, *Review assessment*, *Lessons learned*, *Meetup alignment*.
- Inventories are **version-stable but replaceable**:
  - If an Inventory needs conceptual change, a new Inventory is created.
  - Historical assessments remain interpretable because they reference the original Inventory definition.

Inventories serve multiple roles simultaneously:
- They structure human evaluation during live meetups.
- They enable paired pre/post measurements.
- They act as stable targets for agent-based evaluation and optimization.
- They provide the semantic frame for statistical aggregation and comparison.

An Inventory is therefore not a “form” but a **semantic lens**.

---

## 7.2 Immutable Items and Item Keys

An **Item** is the smallest immutable unit of evaluation.

An Item defines:
- A *single evaluative dimension* (e.g. clarity, elegance, complexity).
- The *scale* on which it is measured.
- The *semantic intent* of the measurement.

### Immutability Principle

Items are **strictly immutable**.

If any of the following change:
- wording,
- scale size,
- scale semantics,
- labeling,
- rendering intent,

then a **new Item** is created.

The original Item is retained indefinitely to preserve:
- reproducibility,
- longitudinal comparability,
- statistical validity of historical data.

### Item Keys

Each Item has a stable, human-readable **Item Key** that expresses its conceptual identity
(e.g. `code_clarity`, `solution_elegance`, `mental_load`).

Rules governing Item Keys:

- At any point in time, **exactly one active Item exists per Item Key**.
- Updating an Item does not mutate it:
  - the old Item is retired,
  - a new Item with the same Item Key becomes active.

This design cleanly separates:
- *conceptual continuity* (Item Key),
- from *technical immutability* (Item ID).

### Hybrid Reference Model

The system uses a **hybrid approach** to Item references:

- **Inventory composition** (`inventory_items` table) references the **Item Key**.
  This means inventories define *which concepts* to measure, allowing the active version of each item to be used when rendering the survey.

- **Response storage** (`responses` table) references the **concrete Item ID**.
  This locks each response to the exact wording, scale, and labels that were presented at response time.

This hybrid ensures:
- Inventories remain conceptually stable even as item wording improves
- Historical responses are always interpretable against the exact item definition used
- Longitudinal analysis can account for item version changes

---

## 7.3 Scale Definitions and Rating Semantics

All quantitative evaluations are encoded as **integer ratings**.  
There are no free-form categorical responses and no floating-point scales.

### Supported Scale Sizes (Initial Release)

The system currently standardizes on:

- **5** (Likert: Poor, Fair, Good, Very Good, Excellent)

All items use a unified 5-point scale to minimize cognitive load for evaluators while maintaining semantic clarity across all evaluation contexts.

### Future: Scale Expansion Path

If longitudinal evaluation data reveals insufficient granularity (measured via signal-to-noise ratio, inter-rater agreement, or variance analysis), items can migrate to alternative scales:

- **Continuous slider** (0-100): For dimensions requiring finer granularity
- **7-point Likert**: For expanded categorical distinctions
- **Binary/ternary scales**: For high-stakes binary decisions
- **Other scales**: Extensible without schema changes

Migration occurs by creating a new Item version with the same `item_key` but different `max_rating` and labels. Historical assessments remain valid (tied to old `item_id`), and the inventory automatically uses the new active version. The backend's scale consistency checker determines rendering strategy (see Section 7.5).

### Labeling Semantics

### Label Availability (5-Point Scale)

All items use exactly five labels:
- `label_min` (Poor)
- `label_low_mid` (Fair)
- `label_mid` (Good)
- `label_high_mid` (Very Good)
- `label_max` (Excellent)

This unified labeling reduces cognitive overhead for evaluators while preserving semantic granularity.

### Labels for Alternative Scales (Future)

If items migrate to alternative scales:
- **Slider (0-100)**: Only `label_min` and `label_max` set; others NULL
- **7-point Likert**: All seven positions labeled (or only extremes + mid)
- **Binary (2-point)**: `label_min` and `label_max` only

Labels are part of the Item definition and therefore immutable.

### Missingness

- Providing a rating is **always optional**.
- Skipping an Item produces **no response** (NULL / absent row).
- There is no explicit “don’t know” option.

This design choice:
- reduces cognitive friction in live settings,
- preserves analytic clarity,
- avoids conflating uncertainty with neutral ratings.

### Semantic Interpretation

Items are designed so that:
- higher values always indicate “more” of the measured construct,
- interpretation is monotonic,
- aggregation (mean, distribution) is meaningful.

Reverse-coded or ambiguous scales are intentionally excluded.

---

## 7.4 Scale Consistency and Backend-Prepared Render Structures

When an Assessment is requested (applying an Inventory to a Problem), the backend performs a critical validation step:

### Scale Consistency Checking

The backend checks whether all items in the inventory share identical scale properties:
- Same `max_rating`
- Same label set (`label_min`, `label_low_mid`, `label_mid`, `label_high_mid`, `label_max`)

**If consistent**: All items can be rendered in a single matrix with common column headers.
**If inconsistent**: Items are grouped by scale and rendered in multiple sections or with individual labels.

### Backend Endpoint: GET /assessments/{assessmentId}/render-structure

The backend does NOT expose raw items to the frontend. Instead, it returns a single, render-ready JSON object:

```json
{
  "render_type": "single_matrix" | "mixed_matrices",
  "matrix": {
    "max_rating": 5,
    "common_headers": [
      {"rating_value": 1, "label": "Poor"},
      {"rating_value": 2, "label": "Fair"},
      ...
    ],
    "rows": [
      {
        "item_id": "uuid",
        "item_key": "correctness",
        "short_label": "Correctness",
        "max_rating": 5,
        "current_rating": null
      },
      ...
    ]
  }
}
```

Or for mixed scales:

```json
{
  "render_type": "mixed_matrices",
  "matrices": [
    {
      "description": "Quality Assessment (5-point)",
      "render_mode": "matrix",
      "rows": [...]
    },
    {
      "description": "Cognitive Load (slider)",
      "render_mode": "slider",
      "rows": [...]
    }
  ]
}
```

### Frontend Rendering

The frontend is a stateless renderer that:
- Fetches the render structure
- Renders the appropriate UI based on `render_type` and `render_mode`
- Contains no scale logic or validation

This separation ensures:
- Scale consistency is validated once at the backend
- The frontend has no rendering conditionals beyond layout
- New scales (7-point, slider, binary) can be added without frontend changes
- Future scale migrations are transparent to the UI

---

## 7.5 Inventory Composition and Ordering

Inventories are **explicitly ordered** sequences of Items.

Ordering is not cosmetic; it has semantic and cognitive significance:

- Early Items often capture *global impressions*.
- Later Items capture *refined or reflective judgments*.
- Some Items are intentionally placed last (e.g. engagement or effort).

### Composition Rules

- An Item may appear in **multiple Inventories**.
- An Inventory may contain Items from different conceptual domains.
- The same Item may appear in different positions in different Inventories.

Inventories may overlap heavily while still serving different purposes, enabling:
- paired comparisons across contexts,
- reuse of validated Items,
- reduced cognitive load for participants.

### Inventory Stability

Once an Inventory is used in active assessments:
- its composition and order are fixed,
- changes require creating a new Inventory.

This guarantees that:
- assessments remain interpretable,
- results can be compared across Problems, versions, and time.

---

Inventories and Items together form the **measurement grammar** of the system.  
They allow human judgment, agent evaluation, and statistical analysis to coexist without collapsing into ad-hoc forms or opaque scoring schemes.
