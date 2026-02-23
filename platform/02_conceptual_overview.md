# 2. Conceptual Overview

This chapter establishes the **conceptual backbone** of the system. It defines the stable mental model that all subsequent chapters refine and operationalize. The goal is to provide a precise abstraction layer that allows readers to understand *what kind of system this is* before engaging with data models, UI flows, or role-specific behavior.

This chapter intentionally avoids implementation detail. Concepts defined here are referenced throughout the specification and should be treated as **foundational invariants**.

---

## 2.1 Core Domain Objects

The system is centered around a small number of **first-class domain objects**. Each of these objects exists independently, has a clear semantic boundary, and interacts with others through well-defined relations.

The most important domain objects are:

- **Problem**
  A Problem represents a *challenge or task* that can be evaluated, discussed, selected, deferred, or rejected in the context of events. It is the semantic anchor for everything else in the system. Problems exist independently of any specific event or location.

- **Problem Card**
  The Problem Card is the *canonical representation* of a Problem at a given point in time. It contains descriptive text, metadata, links to repositories, and serves as the primary surface for interaction. Conceptually, it plays a role analogous to *Model Cards* or *Agent Cards* in AI systems.

- **Event**
  An Event represents a *bounded occurrence* of the community coming together at a specific time and place. Events are hosted by partner organizations at specific locations. Problems are discussed, teams are formed, and decisions are made within the context of events. The same Problem can appear across multiple events.

- **Inventory**
  An Inventory is a structured collection of evaluation items. It defines *what aspects* of a Problem are being assessed in a given context, without containing any answers itself.

- **Item**
  An Item is an immutable evaluation primitive. It defines a question, scale, and semantic intent. Items are reused across Inventories and across time.

- **Assessment**
  An Assessment is the application of a specific Inventory to a specific Problem (and version), producing responses. Assessments are contextual, repeatable, and unlimited in number.

- **Decision**
  A Decision is an explicit, timestamped act that changes the state of a Problem or records an authoritative outcome or recommendation. Decisions are logged, auditable, and distinct from votes or ratings.

- **Team**
  A Team represents participants who have committed to working on a Problem during a specific Event. Teams form dynamically via "Challenge accepted" and have access to shared chat and breakout room coordination.

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
  The Problem is assessed using one or more Inventories. This may happen before an Event, during an Event, or after.

- **Curation and Selection**
  Moderators and participants decide whether the Problem is suitable for inclusion in an Event, pitch session, or coding sprint.

- **Active Work**
  The Problem is actively addressed during an Event, typically involving coding, experimentation, or agent orchestration.

- **Reflection and Follow-up**
  Additional assessments, comments, or decisions may occur after the Event, including lessons learned or deferred planning.

Crucially, the lifecycle is **not enforced as a rigid workflow**. The system records *what happened*, not *what should have happened*. This makes it suitable for exploratory, agentic, and research-oriented contexts where strict process enforcement would be counterproductive.

---

## 2.4 Contextual Orthogonality

All evaluations and many decisions are contextualized along several **orthogonal axes**. These axes are not encoded implicitly but are made explicit so they can be analyzed independently.

Key contextual dimensions include:

- **Role**
  Who is acting (e.g. Problem Owner, Developer, Observer, Moderator, Agent).

- **Time Context**
  When the action occurs relative to the Event lifecycle (e.g. pre-event, during pitch, during review, post-event).

- **Participation Mode**
  Whether the actor is participating in-presence or remotely.

- **Event Context**
  Which event the action is associated with (enabling cross-event analysis).

- **Location Context**
  Which physical location/city the event is held in (enabling cross-location analysis).

- **Problem Version Context**
  Which major and minor version of the Problem the action refers to.

These dimensions allow the system to support **longitudinal analysis**, **cross-location comparisons**, **paired comparisons**, and **role-sensitive interpretation** without conflating distinct situations.

---

## 2.5 Transparency and Auditability as First-Class Goals

Rather than optimizing for minimal data storage or simplified state models, the system optimizes for:

- **Transparency**:  
  It should always be possible to reconstruct *why* a Problem is in its current state.

- **Auditability**:  
  All meaningful changes are recorded as explicit Decisions or Assessments with timestamps and actors.

- **Reproducibility**:  
  Historical evaluations remain interpretable even after Inventories, Items, or practices evolve.

This orientation reflects the system’s dual nature as both a **collaborative tool** and a **research instrument**. It is designed not only to support events, but also to generate high-quality, analyzable data about human–AI collaboration and decision-making.

---

## 2.6 Relationship to Other Chapters

This conceptual overview provides the vocabulary and mental model for the entire specification.

- The **formal definitions of roles** are specified in Chapter 3.
- The **detailed structure of Problems and Problem Cards** is specified in Chapter 4 and Chapter 5.
- The **mechanics of Inventories, Items, and Assessments** are specified in Chapters 7 and 8.
- The **Decision model and state transitions** are specified in Chapter 10.
- The **Event model** is specified in Chapter 11.
- The **UI realizations** of these concepts are specified in Chapters 12–15.
- The **administration interfaces** are specified in Chapter 17.
- The **authentication model** is specified in Chapter 18.
- The **data model and persistence** are specified in Chapter 19.
- The **appendices** provide user stories (Ch.23), bootstrap data (Ch.24), interview findings (Ch.25), UI addendum (Ch.26), and state diagrams (Ch.27-28).
- The **events, partners, and locations** are specified in Chapter 29.
- The **registration and onboarding** is specified in Chapter 30.
- The **team chat and collaboration** (replacing deprecated comments) is specified in Chapter 31.
- The **onboarding and guided experience** is specified in Chapter 32.
- The **participant experience and emotional design** (including contributor recognition) is specified in Chapter 33.

Readers should return to this chapter whenever a later section appears complex: most complexity arises from *composing* these simple concepts, not from introducing new ones.
