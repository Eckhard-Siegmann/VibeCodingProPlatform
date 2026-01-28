# 2. Conceptual Overview

This chapter establishes the **conceptual backbone** of the system. It defines the stable mental model that all subsequent chapters refine and operationalize. The goal is to provide a precise abstraction layer that allows readers to understand *what kind of system this is* before engaging with data models, UI flows, or role-specific behavior.

This chapter intentionally avoids implementation detail. Concepts defined here are referenced throughout the specification and should be treated as **foundational invariants**.

---

## 2.1 Core Domain Objects

The system is centered around a small number of **first-class domain objects**. Each of these objects exists independently, has a clear semantic boundary, and interacts with others through well-defined relations.

The most important domain objects are:

- **Problem**  
  A Problem represents a *challenge or task* that can be evaluated, discussed, selected, deferred, or rejected in the context of a meetup. It is the semantic anchor for everything else in the system.

- **Problem Card**  
  The Problem Card is the *canonical representation* of a Problem at a given point in time. It contains descriptive text, metadata, links to repositories, and serves as the primary surface for interaction. Conceptually, it plays a role analogous to *Model Cards* or *Agent Cards* in AI systems.

- **Inventory**  
  An Inventory is a structured collection of evaluation items. It defines *what aspects* of a Problem are being assessed in a given context, without containing any answers itself.

- **Item**  
  An Item is an immutable evaluation primitive. It defines a question, scale, and semantic intent. Items are reused across Inventories and across time.

- **Assessment**  
  An Assessment is the application of a specific Inventory to a specific Problem (and version), producing responses. Assessments are contextual, repeatable, and unlimited in number.

- **Decision**  
  A Decision is an explicit, timestamped act that changes the state of a Problem or records an authoritative outcome or recommendation. Decisions are logged, auditable, and distinct from votes or ratings.

These objects are designed to be **orthogonal**: none of them implicitly subsumes another, and each can evolve independently.

---

## 2.2 Separation of Concerns

A core design principle of the system is a strict separation between **content**, **evaluation**, and **decision-making**.

- **Content** is embodied in the Problem Card and its versions. It answers *what the problem is*.
- **Evaluation** is embodied in Assessments. It answers *how the problem is perceived* under specific criteria and contexts.
- **Decision-making** is embodied in Decisions. It answers *what is done* with respect to the problem.

This separation has several important consequences:

- A Problem can be evaluated multiple times without triggering any decision.
- Decisions can be made even in the absence of formal evaluations (e.g. live group decisions).
- Evaluations never directly change system state; only Decisions do.
- Historical data remains interpretable even as Inventories or practices evolve.

This architecture deliberately avoids collapsing these concerns into a single notion such as “status” or “vote result”. Instead, it favors **explicit artifacts** over inferred meaning.

---

## 2.3 Lifecycle Orientation

The system is inherently **lifecycle-oriented**, but not linear. Problems move through phases that may repeat, branch, or loop back.

At a conceptual level, a Problem may pass through the following lifecycle phases:

- **Drafting**  
  The Problem is being authored or refined by its owner. It may already exist in the system without being formally submitted.

- **Evaluation**  
  The Problem is assessed using one or more Inventories. This may happen before a meetup, during a meetup, or after.

- **Curation and Selection**  
  Moderators and participants decide whether the Problem is suitable for inclusion in a meetup, pitch session, or coding sprint.

- **Active Work**  
  The Problem is actively addressed during a meetup, typically involving coding, experimentation, or agent orchestration.

- **Reflection and Follow-up**  
  Additional assessments, comments, or decisions may occur after the meetup, including lessons learned or deferred planning.

Crucially, the lifecycle is **not enforced as a rigid workflow**. The system records *what happened*, not *what should have happened*. This makes it suitable for exploratory, agentic, and research-oriented contexts where strict process enforcement would be counterproductive.

---

## 2.4 Contextual Orthogonality

All evaluations and many decisions are contextualized along several **orthogonal axes**. These axes are not encoded implicitly but are made explicit so they can be analyzed independently.

Key contextual dimensions include:

- **Role**  
  Who is acting (e.g. Problem Owner, Developer, Observer, Moderator, Agent).

- **Time Context**  
  When the action occurs relative to the meetup lifecycle (e.g. pre-meetup, during pitch, during review, post-meetup).

- **Location Context**  
  Whether the actor is participating in presence or remotely.

- **Problem Version Context**  
  Which major and minor version of the Problem the action refers to.

These dimensions allow the system to support **longitudinal analysis**, **paired comparisons**, and **role-sensitive interpretation** without conflating distinct situations.

---

## 2.5 Transparency and Auditability as First-Class Goals

Rather than optimizing for minimal data storage or simplified state models, the system optimizes for:

- **Transparency**:  
  It should always be possible to reconstruct *why* a Problem is in its current state.

- **Auditability**:  
  All meaningful changes are recorded as explicit Decisions or Assessments with timestamps and actors.

- **Reproducibility**:  
  Historical evaluations remain interpretable even after Inventories, Items, or practices evolve.

This orientation reflects the system’s dual nature as both a **collaborative tool** and a **research instrument**. It is designed not only to support meetups, but also to generate high-quality, analyzable data about human–AI collaboration and decision-making.

---

## 2.6 Relationship to Other Chapters

This conceptual overview provides the vocabulary and mental model for the entire specification.

- The **formal definitions of roles** are specified in Chapter 3.
- The **detailed structure of Problems and Problem Cards** is specified in Chapter 4 and Chapter 5.
- The **mechanics of Inventories, Items, and Assessments** are specified in Chapters 7 and 8.
- The **Decision model and state transitions** are specified in Chapter 10.
- The **UI realizations** of these concepts are specified in Chapters 12–15.

Readers should return to this chapter whenever a later section appears complex: most complexity arises from *composing* these simple concepts, not from introducing new ones.
