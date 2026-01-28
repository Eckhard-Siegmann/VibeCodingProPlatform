# 22. Open Questions and Deferred Specifications

This chapter documents **what is intentionally left open** at the current stage of the system design. It serves two purposes:  
(1) to make uncertainty and incompleteness explicit rather than implicit, and  
(2) to define *how* future refinements should be evaluated so the system evolves coherently rather than ad-hoc.

Nothing in this chapter represents a flaw or oversight. All items listed here are either consciously deferred, intentionally under-specified, or dependent on empirical learning from real meetup usage.

---

## 22.1 Known Underspecified Areas

The following areas are known to be underspecified or only partially defined. They are expected to be refined after several meetup cycles and based on observed behavior, data quality, and moderator workload.

**Decision Type Ontology Evolution**  
While a comprehensive set of decision types exists, the ontology may need refinement:
- Some decision types may collapse or split based on actual usage.
- Semantic overlap between certain deferred and dropped categories may emerge.
- Additional decision types may become necessary for edge cases not yet encountered.

**Assessment Inventory Granularity**  
The current model allows unlimited Inventories, but:
- There is no formal guidance yet on *recommended inventory sizes*.
- It is unclear when an Inventory should be split versus extended.
- The balance between short “quick-check” inventories and deep analytical inventories remains empirical.

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
- This avoids locking the meetup into a rigid process.
- Deviations are treated as data, not as errors.

**Minimal Identity for Problem Submission**
Problem submission requires an email address but no password:
- Problem Owners provide email at creation (for attribution and contact)
- Access to edit is via private URL, not login
- Same email reuses existing user record across problems
- This preserves low-friction entry while enabling attribution and moderator outreach

**No Canonical “Correct” Inventory Set**  
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
