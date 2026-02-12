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

### Supported Scale Sizes

The system supports the following scale sizes:

- **1** (binary / presence indicator)
- **2**
- **3**
- **5**
- **7**
- **10**

The scale size is defined per Item via `max_rating`.

### Labeling Semantics

Label availability depends on scale size:

- **1**  
  - `mid_label`
- **2, 10**  
  - `min_label`, `max_label`
- **3, 7**  
  - `min_label`, `mid_label`, `max_label`
- **5**  
  - `min_label`, `low_mid_label`, `mid_label`, `high_mid_label`, `max_label`

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

## 7.4 Inventory Composition and Ordering

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
