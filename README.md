# VibeCoding Professionals Platform

**Specification Repository for the Meetup Evaluation & Collaboration System**

---

## First Meetup: January 30, 2026

| | |
|---|---|
| **Date** | Friday, January 30, 2026 |
| **Time** | 16:00 – 21:30 CET |
| **Location** | STARTPLATZ Köln, Im Mediapark 5, 50670 Köln |

**[Register Now](https://www.startplatz.de/event/vibecoding-professionals-meetup-januar-2026/)**

Bring your own repo. Bring your own problem. Join the 30-minute hackathon sprint. Compare agentic coding approaches in real-time.

---

## Welcome, VibeCoding Professional!

You're looking at the specification for the platform we're building together. Before diving into the technical details, we recommend starting with the companion text for our introductory presentation:

**[Read the Introduction](Beginners_Intro.md)** — Understand why we're building this, what "excellent software" means in our context, and how structured evaluation creates comparative benchmarks that help everyone improve.

---

## What Is This?

This repository contains the complete specification for the **VibeCoding Professionals Meetup Platform** — a system designed to:

- **Track problems** submitted by practitioners for hackathon sprints
- **Capture structured evaluations** using defined quality inventories
- **Enable comparative analysis** across different agentic coding tools and approaches
- **Build institutional memory** that compounds with each meetup

The platform embodies our core philosophy: **Pros for Pros**. Low barriers to entry, high trust, real problems, measurable quality.

### Domain Model at a Glance

![VibeCoding Domain Model](images/01-domain-model-hero.png)

*Six core entities with immutable decision audit trail — the conceptual backbone of the platform.*

---

## Specification Overview

The specification is organized into numbered chapters:

### Foundation (Chapters 00–02)
| Chapter | Topic |
|---------|-------|
| [00](00_introduction.md) | Introduction |
| [01](01_purpose_scope_and_design_principles.md) | Purpose, Scope & Design Principles |
| [02](02_conceptual_overview.md) | Conceptual Overview |

### Core Domain (Chapters 03–11)
| Chapter | Topic |
|---------|-------|
| [03](03_roles_actors_and_authority_model.md) | Roles, Actors & Authority Model |
| [04](04_problems_and_problem_cards.md) | Problems & Problem Cards |
| [05](05_problem_versioning_model.md) | Problem Versioning Model |
| [06](06_Repositories_and_external_references.md) | Repositories & External References |
| [07](07_inventories_and_items.md) | Inventories & Items |
| [08](08_assessments.md) | Assessments |
| [09](09_voting_and_data_capture.md) | Voting & Data Capture |
| [10](10_decisions_and_decision_history.md) | Decisions & Decision History |
| [11](11_meetup_model.md) | Meetup Model |

### User Interface & Interaction (Chapters 12–18)
| Chapter | Topic |
|---------|-------|
| [12](12_dashboards_and_system_views.md) | Dashboards & System Views |
| [13](13_problem_card_user_interface.md) | Problem Card User Interface |
| [14](14_live_Interaction_modes.md) | Live Interaction Modes |
| [15](15_results_and_analytics.md) | Results & Analytics |
| [16](16_commenting_and_qualitative_feedback.md) | Commenting & Qualitative Feedback |
| [17](17_administration_interfaces.md) | Administration Interfaces |
| [18](18_authentication_and_access_control.md) | Authentication & Access Control |

### Technical & Future (Chapters 19–22)
| Chapter | Topic |
|---------|-------|
| [19](19_data_model_and_persistence.md) | Data Model & Persistence |
| [20](20_system_logs_and_traceability.md) | System Logs & Traceability |
| [21](21_extensibility_and_future_directions.md) | Extensibility & Future Directions |
| [22](22_open_questions_and_deferred_specifications.md) | Open Questions & Deferred Specifications |

### Appendices (Chapters 23–24)
| Chapter | Topic |
|---------|-------|
| [23](23_appendix_user_stories.md) | User Stories |
| [24](24_appendix_item_inventory_bootstrap.md) | Item & Inventory Bootstrap Data |

---

## Key Concepts

**Problems** are submitted by Problem Owners and progress through readiness states (Draft → Submitted → Accepted) and action states (queued, pitched, coded, reviewed).

**Evaluations** use structured **Inventories** containing **Items** — each item is a rated dimension like correctness, elegance, or test support. This produces comparable data across solutions.

**Decisions** are the single source of truth. Every state change is recorded with attribution, timestamp, and rationale.

**Immutability** is a core principle. Historical records are never modified. Changes create new versions.

### Who Does What?

![Role Authority Matrix](images/05-role-authority-matrix.png)

*The platform separates binding authority (Moderator/Admin) from evaluation participation (all roles).*

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

This meetup platform is more than event software. It's a **bootstrap engine** for a larger vision:

1. **Today**: Generate high-quality evaluation data through structured meetup activities
2. **Tomorrow**: Use that data to optimize agentic coding tools against quality dimensions
3. **Future**: Enable specification-driven, auditable software development at scale

The quality dimensions we measure here — correctness, test support, readability, simplicity, elegance, extensibility — are the same dimensions that regulated industries require. We're building the foundation for a future where excellent software is the norm, not the exception.

---

## Contributing

This is a living specification. If you're a meetup participant and want to contribute:

1. Read the relevant chapters
2. Discuss at the meetup or via issues
3. Submit PRs with your proposed changes

---

## License

This project is licensed under the [MIT License](LICENSE).

---

*Pros for Pros. The future of software development is being written now. Let's make sure it's written well.*
