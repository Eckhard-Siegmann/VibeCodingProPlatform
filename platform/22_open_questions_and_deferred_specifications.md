# 22. Open Questions and Deferred Specifications

This chapter documents **what is intentionally left open** at the current stage of the system design. It serves two purposes:  
(1) to make uncertainty and incompleteness explicit rather than implicit, and  
(2) to define *how* future refinements should be evaluated so the system evolves coherently rather than ad-hoc.

Nothing in this chapter represents a flaw or oversight. All items listed here are either consciously deferred, intentionally under-specified, or dependent on empirical learning from real event usage.

---

## 22.1 Known Underspecified Areas

The following areas are known to be underspecified or only partially defined. They are expected to be refined after several event cycles and based on observed behavior, data quality, and moderator workload.

**Decision Type Ontology Evolution**  
While a comprehensive set of decision types exists, the ontology may need refinement:
- Some decision types may collapse or split based on actual usage.
- Semantic overlap between certain deferred and dropped categories may emerge.
- Additional decision types may become necessary for edge cases not yet encountered.

**Assessment Inventory Granularity**
The current model allows unlimited Inventories and provides basic composition rules (Chapter 7.5), but:
- There is no formal guidance yet on *recommended inventory sizes* (optimal number of items per inventory).
- It is unclear when an Inventory should be split versus extended.
- The balance between short "quick-check" inventories and deep analytical inventories remains empirical and will be informed by event usage patterns.

**Agent Behavior and Autonomy**  
Agents are currently modeled as non-binding actors capable of recommendations:
- The degree of autonomy agents may have in triggering assessments or recommendations is not yet specified.
- No formal escalation rules exist for agent-initiated workflows.
- Trust calibration between human and agent recommendations is not yet modeled.

**Statistical Presentation Standards**  
While statistical summaries are defined at a basic level (N, mean, SD, min, max):
- No standards yet exist for advanced aggregation, weighting, or exclusion rules.
- The handling of sparse data or highly fragmented filters remains open.
- Visualization standards beyond tabular summaries are not yet defined.

---

## 22.2 Intentional Design Gaps

Some elements are **deliberately not specified**, because premature formalization would constrain experimentation or impose unnecessary complexity.

**No Enforced Workflow Engine**  
The system does not impose a strict state machine:
- Readiness and action states can be changed through Decisions, but are not auto-enforced.
- This avoids locking the event into a rigid process.
- Deviations are treated as data, not as errors.

**Minimal Identity for Problem Submission** *(RESOLVED)*

> **Update**: This design gap has been resolved. The platform now requires **mandatory authentication** for all users including Problem Owners. See Chapter 18 (Authentication) and Chapter 30 (Registration & Onboarding) for the current identity model.
>
> Key changes from the original design:
> - All users authenticate via email+password or OAuth (GitHub, LinkedIn)
> - Double opt-in email confirmation required
> - Private URL access pattern replaced by authenticated sessions
> - Terms acceptance required before participation
>
> The low-friction philosophy is preserved through OAuth options and a streamlined onboarding flow (Chapter 32).

**Admin Mobile Access** *(RESOLVED)*

> **Update 2026-02-05**: This design gap has been resolved. Chapter 17.0 (Mobile Administration Guarantee) now mandates full smartphone compatibility for all administrative interfaces. All admin functions verified at 375px viewport minimum (iPhone SE).
>
> Design patterns documented in Ch.26.12 (Mobile Admin Interface Patterns) including:
> - Vertical scroll for complex forms
> - Accordion organization for dense controls
> - Table→Card transformation for data lists
> - Wizard flows for multi-step operations
> - Native pickers for date/time inputs
>
> Chart library selection resolved: Chart.js 4.x (Ch.15.5).

**No Canonical "Correct" Inventory Set**  
There is intentionally no single “official” evaluation framework:
- Multiple Inventories may coexist, overlap, or even contradict.
- Competing evaluative paradigms are treated as productive tension.
- The system records differences rather than resolving them prematurely.

**No Automatic Decision Inference from Votes**  
Votes and assessments never automatically trigger decisions:
- Human judgment remains explicit and accountable.
- This avoids opaque threshold logic.
- It preserves the distinction between evaluation and authority.

---

## 22.3 Criteria for Future Refinement

Any future refinement of the system should be evaluated against the following criteria. These act as **guardrails**, not constraints.

**Empirical Justification**  
Changes should be driven by observed patterns:
- Repeated moderator friction
- Recurrent user confusion
- Clear data quality issues
- Measurable increases in interpretive clarity

**Preservation of Orthogonality**  
New features must not collapse distinct concepts:
- Evaluations must remain distinct from decisions.
- Content must remain distinct from process.
- Context dimensions (role, time, location) must remain independent.

**Auditability Over Convenience**  
When trade-offs arise:
- Prefer explicit logs over inferred states.
- Prefer reconstructability over UI simplicity.
- Prefer traceable decisions over automated shortcuts.

**Minimal Cognitive Load**  
Refinements should reduce—not increase—mental overhead:
- For Problem Owners
- For Moderators during live sessions
- For participants engaging casually
- For future analysts interpreting the data

**Reversibility**  
Whenever possible:
- New structures should be additive rather than destructive.
- Historical data should remain interpretable.
- Experimental features should be removable without schema collapse.

---

### Closing Note

This chapter is not a backlog—it is a **design conscience**.
Its purpose is to ensure that future evolution remains intentional, transparent, and aligned with the system’s core philosophy: enabling rigorous, reflective, and agent-aware collaboration without prematurely freezing the space of possibilities.

---

## 22.4 Recently Resolved Items

### Timer Closure Mechanism *(RESOLVED)*

**Original question**: How do countdown timers "fire" in a stateless web application with no background workers?

**Resolution**: Lazy evaluation on read. Whenever `event_live_context` is read and `timer_ends_at` is in the past, the system auto-closes the current mode via the standard `recordDecision()` path before returning the context. See **Chapter 14, §14.5.1.1** for full specification.

### API Error Response Patterns *(RESOLVED)*

**Original question**: What HTTP status codes and response shapes should API endpoints use for authorization failures?

**Resolution**: Consistent `401 Unauthorized` / `403 Forbidden` contract with `{ success: false, error: "<reason>" }` response shape. The objectivity constraint (moderator coding on a problem cannot make binding decisions for it) is enforced at the API level. See **Chapter 18, §18.14** for full specification.

### Queue Cleanup on Problem Ejection *(RESOLVED)*

**Original question**: When a problem is dropped or rejected, should its queue entry be automatically removed?

**Resolution**: Ejection decisions (`deselected_for_event`, `quality_gate_rejected`, `dropped_low_relevance`, `dropped_low_quality`) remove from queue and re-compact indices. Closing decisions transition queue state to `completed`. Deferral decisions leave queue entries untouched. See **Chapter 19, §19.3.19** for the ejection cleanup invariant.

### Decision Type Vocabulary Consistency *(RESOLVED)*

**Original question**: How to prevent drift between the database `decision_type_catalog` and frontend UI code?

**Resolution**: A centralized TypeScript constants module (`src/lib/constants/decisions.ts`) mirrors all 25 catalog entries. All UI components and repository functions import from this module — no inline string literals. See **Chapter 19, §19.2.3** implementation requirement note.

### Review Decision Type Naming *(RESOLVED)*

**Original question**: Inconsistency between spec (`opened_for_review_assessment`) and seed SQL (`opened_for_review`).

**Resolution**: The shorter form `opened_for_review` / `closed_for_review` is canonical, matching the seed SQL and all code. The spec catalog table in §19.2.3 and §19.2.4 has been corrected accordingly. The pitch types retain the `_assessment` suffix (`opened_for_pitch_assessment` / `closed_for_pitch_assessment`) as originally specified.
