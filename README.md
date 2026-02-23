# VibeCoding Professionals Platform

**Specification Repository for the Event Evaluation & Collaboration System**

---

## Upcoming Events

Check our event announcements for the next event dates and locations.

| | |
|---|---|
| **Locations** | Cologne (STARTPLATZ), expanding to Aachen and beyond |
| **Format** | Monthly events with hackathon sprints |
| **Philosophy** | Pros for Pros — bring your own problem, compare agentic approaches |

Bring your own repo. Bring your own problem. Join the 30-minute hackathon sprint. Compare agentic coding approaches in real-time.

---

## Welcome, VibeCoding Professional!

You're looking at the specification for the platform we're building together. Before diving into the technical details, we recommend starting with the companion text for our introductory presentation:

**[Read the Introduction](Beginners_Intro.md)** — Understand why we're building this, what "excellent software" means in our context, and how structured evaluation creates comparative benchmarks that help everyone improve.

---

## What Is This?

This repository contains the complete specification for the **VibeCoding Professionals Event Platform** — a system designed to:

- **Track problems** submitted by practitioners for hackathon sprints
- **Capture structured evaluations** using defined quality inventories
- **Enable comparative analysis** across different agentic coding tools and approaches
- **Build institutional memory** that compounds with each event

The platform embodies our core philosophy: **Pros for Pros**. Low barriers to entry, high trust, real problems, measurable quality.

---

## Specification Overview

The specification is organized into numbered chapters:

### Foundation (Chapters 00–02)
| Chapter | Topic |
|---------|-------|
| [00](platform/00_introduction.md) | Introduction |
| [01](platform/01_purpose_scope_and_design_principles.md) | Purpose, Scope & Design Principles |
| [02](platform/02_conceptual_overview.md) | Conceptual Overview |

### Core Domain (Chapters 03–11)
| Chapter | Topic |
|---------|-------|
| [03](platform/03_roles_actors_and_authority_model.md) | Roles, Actors & Authority Model |
| [04](platform/04_problems_and_problem_cards.md) | Problems & Problem Cards |
| [05](platform/05_problem_versioning_model.md) | Problem Versioning Model |
| [06](platform/06_Repositories_and_external_references.md) | Repositories & External References |
| [07](platform/07_inventories_and_items.md) | Inventories & Items |
| [08](platform/08_assessments.md) | Assessments |
| [09](platform/09_voting_and_data_capture.md) | Voting & Data Capture |
| [10](platform/10_decisions_and_decision_history.md) | Decisions & Decision History |
| [11](platform/11_event_model.md) | Event Model |

### User Interface & Interaction (Chapters 12–18)
| Chapter | Topic |
|---------|-------|
| [12](platform/12_dashboards_and_system_views.md) | Dashboards & System Views |
| [13](platform/13_problem_card_user_interface.md) | Problem Card User Interface |
| [14](platform/14_live_Interaction_modes.md) | Live Interaction Modes |
| [15](platform/15_results_and_analytics.md) | Results & Analytics |
| [17](platform/17_administration_interfaces.md) | Administration Interfaces |
| [18](platform/18_authentication_and_access_control.md) | Authentication & Access Control |

### Technical & Future (Chapters 19–22)
| Chapter | Topic |
|---------|-------|
| [19](platform/19_data_model_and_persistence.md) | Data Model & Persistence |
| [20](platform/20_system_logs_and_traceability.md) | System Logs & Traceability |
| [21](platform/21_extensibility_and_future_directions.md) | Extensibility & Future Directions |
| [22](platform/22_open_questions_and_deferred_specifications.md) | Open Questions & Deferred Specifications |

### Appendices & Addenda (Chapters 23–28)
| Chapter | Topic |
|---------|-------|
| [23](platform/23_appendix_user_stories.md) | Appendix: User Stories |
| [24](platform/24_appendix_item_inventory_bootstrap.md) | Appendix: Item & Inventory Bootstrap Data |
| [25](platform/25_specification_addendum_interview_findings.md) | Addendum: Interview Findings |
| [26](platform/26_specification_addendum_UI.md) | Addendum: UI Specification |
| [27](platform/27_appendix_problem_transitions.md) | Appendix: Problem Transitions |
| [28](platform/28_appendix_problem_transition_diagram.md) | Appendix: Transition Diagram |

### Community Platform (Chapters 29–33)
| Chapter | Topic |
|---------|-------|
| [29](platform/29_events_and_locations.md) | Events & Locations |
| [30](platform/30_registration_and_onboarding.md) | Registration & Onboarding |
| [31](platform/31_team_chat_and_collaboration.md) | Team Chat & Collaboration |
| [32](platform/32_onboarding_and_guided_experience.md) | Onboarding & Guided Experience |
| [33](platform/33_participant_experience_and_emotional_design.md) | Participant Experience & Emotional Design |

---

## Key Concepts

**Problems** are submitted by Problem Owners and progress through two orthogonal states:
- **Readiness states** (intrinsic quality): draft → submitted → needs_changes → ready (or rejected)
- **Action states** (community intent): backlog → selected_for_event → selected_for_coding → deferred/dropped/closed

**Evaluations** use structured **Inventories** containing **Items** — each item is a rated dimension like correctness, elegance, or test support. All items currently use a unified 5-point scale (Poor → Fair → Good → Very Good → Excellent) for cognitive efficiency during live assessments.

**Decisions** are the single source of truth. Every state change is recorded with attribution, timestamp, and rationale. The `decisions` table IS the activity log — there is no separate activity_log table.

**Immutability** is a core principle. Historical records are never modified. Changes create new versions.

**Authentication** is mandatory. All users authenticate via email+password, GitHub OAuth, or LinkedIn OAuth for persistent identity across events and locations.

**Teams** form organically through "Challenge accepted" on Problem Cards, with real-time chat, breakout room coordination, and version-scoped membership.

**Recognition** combines points (for quality content contribution) and stars (for hacking excellence), with a public contributor wall and privacy controls.

---

## Supporting Documents

| Document | Purpose |
|----------|---------|
| [Beginners_Intro.md](Beginners_Intro.md) | Presentation companion — start here |
| [problem_creation_best_practices.md](problem_creation_best_practices.md) | Guide for Problem Owners |
| [CLAUDE.md](CLAUDE.md) | AI assistant guidance for working with this repo |

### Vision & Motivation
| Document | Purpose |
|----------|---------|
| [Motivation HoliCASE_V0.6.md](Motivation%20HoliCASE_V0.6.md) | North Star: Holistic audit framework vision |
| [Motivation DSPy like artifact optimization.md](Motivation%20DSPy%20like%20artifact%20optimization.md) | Paradigm: Agents as optimizable artifacts |

---

## The Bigger Picture

This event platform is more than event software. It's a **bootstrap engine** for a larger vision:

1. **Today**: Generate high-quality evaluation data through structured event activities across multiple locations
2. **Tomorrow**: Use that data to optimize agentic coding tools against quality dimensions
3. **Future**: Enable specification-driven, auditable software development at scale

The quality dimensions we measure here — correctness, test support, readability, simplicity, elegance, extensibility — are the same dimensions that regulated industries require. We're building the foundation for a future where excellent software is the norm, not the exception.

The platform supports a **multi-location community** (Cologne, Aachen, expanding) where knowledge sharing and cross-pollination of ideas occur through structured team collaboration, real-time chat, and lessons learned that travel between locations.

---

## Contributing

This is a living specification. If you're an event participant and want to contribute:

1. Read the relevant chapters
2. Discuss at the event or via issues
3. Submit PRs with your proposed changes

## Implementation Status

The platform is currently under development:
- **Specification**: Complete (Chapters 00-33)
- **Frontend**: SvelteKit 2.x + Tailwind CSS 4.x (in progress)
- **Backend**: Node.js + PostgreSQL (planned)
- **Database**: SQLite for development, PostgreSQL for production

---

## License

This project is licensed under the [MIT License](LICENSE).

---

*Pros for Pros. The future of software development is being written now. Let's make sure it's written well.*
