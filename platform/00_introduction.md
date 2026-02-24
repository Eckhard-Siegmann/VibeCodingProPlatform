# Introduction

This specification describes the conceptual, technical, and organizational foundation of a **professional, agentic, requirements-driven community platform** for hackathon-style events. It is not merely about running events, comparing tools, or evaluating code. It is about creating a **shared experimental space** where humans and AI systems jointly explore how complex software problems can be understood, structured, solved, evaluated, and improved over time.

The platform supports a **multi-location community** (currently Cologne and Aachen, with potential expansion), enabling knowledge sharing and cross-pollination of ideas across events and locations.

**All participants must authenticate** via email+password or OAuth (GitHub/LinkedIn) to enable persistent identity, contribution attribution, and GDPR-compliant communication across the community.

The events this system supports are intentionally different from typical hackathons or demo-driven AI events. The community spirit can be summarized as:

- **Pros for Pros**
  This is a space for experienced practitioners who care about correctness, architecture, auditability, and long-term maintainability — not just speed or spectacle.

- **From Greenfield to Brownfield**  
  While generative AI excels on greenfield prompts, real professional value lies in brownfield systems, evolving requirements, partial specifications, and legacy constraints. The event explicitly embraces this complexity.

- **Humans + Multi-Agent Systems**  
  The core comparison is not “human vs AI”, but *one human with an orchestrated multi-agent system* versus alternative approaches. The event treats agents, skills, and workflows as first-class artifacts.

- **Learning through Contrast, not Claims**  
  Frameworks, models, tools, and paradigms are not debated abstractly. They are contrasted empirically, through shared problems, competing approaches, and structured evaluation.

To make this possible, the community requires more than slides or shared repos. It requires a **dedicated platform** that treats problems, evaluations, and decisions as durable, analyzable artifacts rather than ephemeral event byproducts. The platform provides:

- **Persistent identity** across events and locations
- **Team formation** with real-time chat
- **Event management** with partner organizations and venue capacity
- **Structured evaluation** that persists beyond individual events

---

## Why a Dedicated System Is Necessary

In most events and hackathons, crucial information is lost:

- Why was a problem selected?
- How did perceptions change from pitch to review?
- Which aspects improved after refinement?
- Which problems were rejected due to quality, relevance, timing, or complexity?
- How did different roles (POs, developers, observers, agents) perceive the same artifact?
- What was evaluated, when, under which assumptions, and against which version?

Answering these questions **cannot be retrofitted** from chat logs, GitHub comments, or slide decks.

This system therefore introduces a **consistent data structure** that:

- Separates *content*, *evaluation*, and *decision-making*
- Preserves historical context across versions and events
- Supports longitudinal and paired analysis
- Enables both human judgment and future agent-based evaluation
- Scales from a single event to a multi-location community archive
- Provides real-time collaboration through team chat

The platform is not just an entry point. It is the **shared operational interface** for participants, moderators, and agents — before, during, and after each event.

---

## What This Platform Is (and Isn't)

This clarification is important to set expectations and prevent scope creep:

**IS:**
- **Event-focused engagement tool** for hackathon events (in-presence and remote)
- **Knowledge condensation engine** capturing lessons learned and insights
- **Data platform** for longitudinal quality analysis across events and locations
- **Bootstrap engine** for agentic tool optimization (the evaluation data we collect feeds into improving AI-assisted development)

**IS NOT:**
- A Slack/WhatsApp replacement for daily team communication
- A general-purpose collaboration tool
- A social network or community forum

The evaluation data we collect feeds directly into the larger vision:
- **HoliCASE**: Audit-grade, specification-driven software development where every line of code satisfies a Control, which satisfies a Normative Clause
- **DSPy-style optimization**: Skills and agents as optimizable artifacts against requirements and tests

---

## The Role of Chat

Team chat serves multiple purposes beyond real-time conversation:

1. **Activity Log**: Chat documents changes and events (version transitions, team joins/retires, assessment openings) as system messages

2. **Agent Workspace**: Agents can post messages, evaluations, and recommendations in chat. Agents are clearly marked (stored with `role = 'agent'` in the users table, rendered with `is_bot = TRUE` flag in chat messages)

3. **Link Repository**: Larger evaluations, detailed analyses, and extensive content are posted as URLs (not inline). Chat becomes a curated index of valuable external resources

4. **Knowledge Trail**: Chat history persists across problem versions, providing context for future participants and enabling longitudinal analysis

5. **Event Channel**: A problem-detached chat per event where moderator announcements, phase transitions, and community links are shared. Messages accumulate across events at the same location, forming a persistent community timeline per city (see Chapter 31.16)

---

## Team Formation and Problem Team Dynamics

Teams form **organically through self-organization**, not through centralized assignment or formal authority structures:

### How Teams Form

1. **Problem Owners (POs) pitch their problems** during the event
2. **Interested participants click "Join as Dev"** to signal intent
3. **Teams self-assemble** through mutual interest and capability matching
4. **No formal team formation authority exists** — there are no gatekeepers controlling who can join

### When Teams Don't Form

If a Problem Owner **does not attract enough team members**:

- **PO initiates contact** with moderators
- **Moderator de-activates the problem** for the current coding phase (`deselected_for_coding`)
- **Team members disperse** to join other active problem teams
- **Problem returns to selected_for_event status** (remains on event agenda but not actively coded)

### Philosophy

This self-organizing approach reflects the **"Pros for Pros"** culture:

- **Trust over Control**: Experienced practitioners self-select into problems that interest them
- **Emergent Quality**: Problems that attract teams demonstrate genuine community interest
- **No Bureaucracy**: No forms, approvals, or artificial team size requirements
- **PO Responsibility**: Problem Owners engage directly with moderators when support is needed

Teams use **real-time chat** (Chapter 31) for coordination and breakout rooms for synchronous work. The system provides infrastructure but does not dictate team composition.

---

## What This Specification Covers

This document is intentionally comprehensive. It does not only describe a website or a database, but a **socio-technical system** that aligns community culture, evaluation rigor, and agentic experimentation.

At a high level, the chapters are organized as follows:

- **Chapter 01** introduces the system scope, assumptions, and non-goals.
- **Chapter 02** (Conceptual Overview) defines the core domain concepts that underpin everything else.
- **Chapters 03–05** formalize roles, problems, and problem versioning.
- **Chapters 06–09** describe repositories/resources, inventories, items, assessments, and data capture.
- **Chapters 10–11** define decisions, state transitions, and the event model.
- **Chapters 12–15** specify dashboards, problem card UI, live interaction modes, and results/analytics.
- **Chapter 16** defines e-mail communication policies and delivery triggers.
- **Chapter 17** covers administration interfaces.
- **Chapter 18** specifies authentication and access control (mandatory for all users).
- **Chapters 19–20** address the data model, persistence, and system logs/traceability.
- **Chapters 21–22** outline extensibility, future directions, and open questions.
- **Chapters 23–28** provide appendices: user stories (23), bootstrap data (24), interview findings (25), UI addendum (26), and state transition specifications (27-28).
- **Chapters 29–33** specify the community platform: events/locations (29), registration/onboarding (30), team chat/collaboration (31), guided experience (32), and participant engagement/recognition (33).

Each chapter builds on the previous ones. Readers are encouraged to treat this document not as linear prose, but as a **reference architecture**: concepts introduced once are reused consistently throughout.

---

## A Living System, Not a Finished Product

Finally, it is important to emphasize that this specification does not aim to freeze the community into a rigid process. Quite the opposite.

The system is designed to:

- Allow new inventories to be added without schema changes
- Allow new assessment types to emerge organically
- Allow agents to participate as evaluators, advisors, and analysts
- Allow the community to evolve its own standards of quality and relevance
- Allow new locations and partners to be added as the community grows
- Allow problems to travel between locations and accumulate insights

In this sense, the platform and its data structures are **infrastructure for collective learning**. They enable events to remain lightweight in execution while becoming increasingly powerful in insight across the entire community.

The chapters that follow translate this vision into precise, testable, and implementable structures.
