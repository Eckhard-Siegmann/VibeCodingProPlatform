# 17. Administration Interfaces

This chapter describes the **administrative user interfaces** of the system. These interfaces are intentionally minimal, desktop-oriented, and optimized for correctness, traceability, and low operational overhead rather than visual polish. Administration is treated as a *meta-activity* that shapes the statistical and semantic integrity of the entire system.

Administrators are trusted actors. The UI is therefore designed to make powerful actions explicit, deliberate, and reversible by design (through versioning and logging), rather than by restrictive guardrails.

---

## 17.1 Item and Inventory Management

### Purpose and Scope

The Item and Inventory Management interface is the **semantic control center** of the system. It governs what can be measured, how it is measured, and in which structured contexts measurements are applied.

Because all Assessments, statistics, and longitudinal analyses ultimately depend on Items and Inventories, this interface is restricted to Administrators.

---

### Item Management UI

The Item Management screen presents a **flat, complete list of all Items**, with a clear distinction between active and retired Items.

Key characteristics:

- Desktop-only interface
- Single-table overview of Items
- No pagination expected (low item count by design)
- Clicking a row reveals a detailed editor panel

Each Item row exposes, at minimum:

- Item key (immutable identifier)
- Short label / mnemonic
- Max rating (1, 2, 3, 5, 7, or 10)
- Active / retired status
- Creation timestamp
- Retirement timestamp (if applicable)

---

### Item Editor

Selecting an Item opens a detailed editor view that displays **all render-relevant fields** of the Item in expanded form, including:

- Full item text
- Scale definition (via max_rating)
- All label text fields corresponding to the scale
- Item category / type
- Optional internal notes for administrators

The editor supports three explicit actions:

- **Create New Item**  
  Starts from a blank template or from an optional existing Item as a template.  
  The Item key must be newly defined and unique.

- **Change Item**  
  The Item key is locked and cannot be edited.  
  Any change (text, scale, labels, metadata) results in:
  - Automatic retirement of the old Item version
  - Creation of a new Item row with the same Item key
  - Atomic guarantee that only one active Item exists per key

- **Delete Item**  
  Only permitted if the Item is not referenced by any active Inventory.  
  If referenced, deletion is blocked and the UI explains why.

Administrators do not manage version numbers manually. Versioning is implicit through immutability and timestamps.

---

### Inventory Management UI

Inventories define **ordered sets of Item keys**. They do not duplicate Item content.

The Inventory Management screen provides:

- A list of all Inventories (active and retired)
- Inventory name, purpose, and context
- Active / retired status

Editing an Inventory opens a **dual-list interface**:

- Left panel: all active Item keys
- Right panel: Items included in the Inventory, in fixed order

Items are added and ordered via simple interactions (e.g. drag-and-drop or sequential selection). Filtering and advanced tooling are intentionally omitted to keep the UI robust and predictable.

Actions supported:

- **Create Inventory**
- **Clone Inventory**
- **Change Inventory**
- **Retire Inventory**

As with Items, changing an Inventory results in retirement of the previous version and creation of a new one. Existing Assessments remain linked to the historical Inventory version.

---

## 17.2 Versioning and Retirement of Items

### Immutability as a Design Principle

All Items and Inventories are **immutable once used**. This ensures that historical data remains interpretable and statistically valid.

Administrators never overwrite existing semantics. Instead, they:

- Retire outdated definitions
- Introduce improved successors
- Preserve continuity via stable Item keys

This approach aligns the system with best practices from scientific measurement theory and requirements engineering.

---

### Active vs. Retired Semantics

An Item or Inventory is considered:

- **Active** if `retired_at` is NULL
- **Retired** if `retired_at` contains a timestamp

There is no separate boolean flag. Temporal validity is derived solely from timestamps.

The Admin UI enforces the invariant:

> For any given Item key, at most one Item may be active at a time.

This invariant is enforced both at the UI level and transactionally at the database level.

---

### Administrative Guarantees

The Administration Interfaces guarantee:

- No silent semantic drift
- No retroactive modification of measurement instruments
- Clear lineage from historical data to the definitions that produced it

These guarantees are critical for later automated evaluation, agent-based meta-analysis, and longitudinal research.

---

## 17.3 Meetup and System Configuration

### Meetup Management

Meetups are configurable entities that define **temporal and organizational scope** for Problems, Assessments, and Decisions.

The Meetup Administration interface allows Moderators (and Administrators) to:

- Create new Meetups
- Define start and end timestamps
- Mark Meetups as upcoming, active, or completed
- Associate Problems with Meetups for planning and backlog views

Meetup creation does **not** require Administrator privileges. This reflects the operational reality that Moderators frequently need to set up Meetups dynamically.

---

### System Configuration

System-wide configuration is intentionally minimal and conservative.

Configurable elements include:

- Which Inventories are available for which contexts
- Default Inventories for Problem registration, Pitch, Review, and Follow-up
- Time windows for automatic opening/closing of Assessments
- Visibility defaults for dashboards and public pages

All system configuration changes are logged and auditable, but they do not retroactively affect existing data.

---

### Role Interaction Model

Administrators implicitly inherit all Moderator capabilities.

Typical usage patterns include:

- Logging in as Administrator for setup and semantic changes
- Acting operationally as Moderator during live Meetups
- Avoiding role switching overhead during time-critical sessions

This pragmatic model prioritizes **flow and reliability** over strict separation, while still preserving accountability through role-aware logging.

---

### Relationship to Other Chapters

- The **data structures underlying Items and Inventories** are defined in Chapter 7.
- The **Decision logging model** referenced by administrative actions is specified in Chapter 10.
- The **Moderator-facing operational dashboards** are specified in Chapter 12.
- The **statistical presentation and aggregation** are discussed in Chapter 15.
- The **persistence model** is specified in Chapter 19.

Administration Interfaces are deliberately simple—but they govern the semantic integrity of the entire system. Their correctness matters more than any other UI in the platform.
