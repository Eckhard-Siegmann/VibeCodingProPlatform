# 8. Assessments

Assessments are the central mechanism by which perceptions, judgments, and structured feedback about Problems are captured. They deliberately separate *evaluation* from *decision-making* and from *problem content*. This chapter defines what Assessments are, how they are used, and how they enable longitudinal and cross-context analysis.

---

## 8.1 Assessment Types and Use Cases

An **Assessment** is the application of a specific **Inventory** to a specific **Problem**, at a specific **major and minor version**, under a defined context. Assessments are not limited in number: a single Problem may have many Assessments of different types over its lifetime.

Assessment types are not hardcoded workflows but **semantic conventions** that emerge from how Inventories are used. Typical Assessment types include:

- **Problem Evaluation Assessments**  
  Used to judge the intrinsic quality and suitability of a Problem (e.g. clarity, structure, complexity, testability). These are commonly used during problem registration, refinement, and moderation.

- **Pitch Assessments**  
  Used during or immediately after a live pitch. They capture first impressions, perceived value, and suitability for collective work.

- **Review Assessments**  
  Used after coding or hacking phases. They focus on correctness, simplicity, elegance, and solution quality relative to the stated problem.

- **Alignment and Strategy Assessments**  
  Used primarily by moderators or agents to judge alignment with meetup goals (e.g. requirements-driven work, agent orchestration potential).

- **Reflection and Lessons-Learned Assessments**  
  Used post-meetup, often asynchronously, to capture delayed insights, reframed judgments, and experiential learnings.

The system does not enforce which Inventories may be used in which situations. This openness is intentional: new Assessment types can be introduced without schema changes, simply by defining new Inventories and applying them to Problems.

---

## 8.2 Assessment Contexts (Pre-Meetup, Pitch, Review, Post-Meetup)

Every Assessment is contextualized along a **time-related dimension** that situates it within the lifecycle of a Problem and a meetup.

Commonly used contexts include:

- **Pre-Meetup**  
  Assessments conducted before a meetup takes place. These often include self-assessments by Problem Owners, moderator quality gates, or agent-based pre-reviews.

- **Pitch**  
  Assessments conducted during or immediately after a live problem pitch. These are typically fast, impression-oriented, and comparable across participants.

- **Review**  
  Assessments conducted after active work on a Problem has taken place. These focus on outcomes rather than intentions.

- **Post-Meetup / Late Reflection**  
  Assessments conducted after temporal distance has allowed deeper reflection. These often surface issues not apparent during live interaction.

These contexts are recorded explicitly rather than inferred. This allows the same Inventory to be used across contexts while still enabling clean analytical separation (e.g. comparing pre-pitch vs. post-review ratings).

---

## 8.3 Engagement and Contextual Metadata

In addition to Item-level responses, Assessments capture **metadata** that qualifies how strongly a given Assessment should be interpreted.

A key element is **engagement intensity**: a self-reported measure of how deeply the assessor engaged with the Problem. This is typically captured as a final Item in an Inventory and can later be used for:

- Stratified analysis (e.g. only highly engaged reviewers)
- Weighted aggregation (without altering raw responses)
- Interpretation of variance and disagreement

Further contextual metadata includes:

- **Role at the time of assessment**  
  (e.g. Problem Owner, Developer, Observer, Moderator, Agent)

- **Participation mode**  
  (in-presence vs. remote)

- **Temporal markers**  
  Precise timestamps and meetup references that situate the Assessment within the broader event timeline.

Crucially, this metadata does not modify the meaning of individual Item responses. Instead, it provides the necessary structure to interpret them responsibly.

---

## 8.4 Longitudinal and Cross-Version Analysis

One of the primary motivations for the Assessment model is to enable **longitudinal analysis** across time, versions, and contexts.

Because Assessments are explicitly linked to:

- a **Problem identifier** (stable across versions),
- a **major version** (semantic changes),
- and optionally a **minor version** (repository state),

it becomes possible to analyze trajectories such as:

- How perceived clarity changes from version 1 to version 3.
- Whether moderation feedback leads to measurable improvement.
- How pitch impressions differ from post-review judgments.
- Whether repository evolution (captured via minor version hashes) correlates with evaluation shifts.

Assessments are never overwritten. New Assessments accumulate alongside older ones, forming a dense evaluative history. This makes the system suitable not only for operational meetup coordination, but also for:

- studying human–AI collaboration dynamics,
- evaluating agent-assisted problem refinement,
- and building datasets for future automated evaluators.

In this sense, Assessments are treated as **primary data artifacts**, not ephemeral inputs. Their design prioritizes interpretability, comparability, and reuse over immediacy or simplification.
