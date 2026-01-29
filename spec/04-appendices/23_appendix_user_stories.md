# 23. Appendix – User Stories

This appendix contains a complete, minimal set of user stories that together define a feature-complete platform.
The stories are grouped by role. Story identifiers (A1, M1, P1, …) are kept identical to preserve traceability.

---

## 23.1 Administrator User Stories

### A1 – Bootstrap the System
As an administrator, I want to create the initial meetup entry and basic configuration so the platform is ready for first use.

### A2 – Manage Moderator Accounts
As an administrator, I want to upgrade a moderator account to administrator so trusted moderators can manage inventories and items.

### A3 – Create and Edit Items
As an administrator, I want to create a new evaluation item with text, scale definition, and labels so it can be reused across inventories.

### A4 – Retire and Replace Items
As an administrator, I want to change an item's wording or scale while keeping the same item key, so historical data remains interpretable.

### A5 – Assemble an Inventory
As an administrator, I want to assemble an inventory by selecting and ordering item keys so evaluations are consistent.

### A6 – Clone an Inventory
As an administrator, I want to clone an existing inventory to create a variant for a different evaluation context.

### A7 – Retire an Inventory
As an administrator, I want to retire an inventory so it is no longer available for new assessments while preserving historical data.

---

## 23.2 Moderator User Stories

### M1 – Create a Meetup
As a moderator, I want to create a new meetup entry so problems can be curated for a specific event.

### M2 – View the Global Problem Backlog
As a moderator, I want to see all submitted problems sorted by creation date, with rejected problems hidden by default.

### M3 – Review a Newly Submitted Problem
As a moderator, I want to open a problem card and inspect its current version and metadata to judge suitability.

### M4 – Leave a Review Comment
As a moderator, I want to leave a comment on a problem without changing its state so the problem owner can address feedback.

### M5 – Record a Quality Gate Decision
As a moderator, I want to mark a problem as accepted or rejected with an optional rationale so the decision is documented.

### M6 – Select Problems for a Meetup
As a moderator, I want to select problems for the next meetup so they appear in the planned queue.

### M7 – Defer a Problem with Specific Reasons
As a moderator, I want to defer a problem with a specific reason such as PO absent, low priority, complexity, or future capability.

### M8 – Open a Pitch Session
As a moderator, I want to open a pitch assessment so participants can vote live.

### M9 – Close a Pitch Session
As a moderator, I want to close the pitch assessment so voting stops and results are finalized.

### M10 – View Pitch Results
As a moderator, I want to see aggregated pitch results to inform the group discussion.

### M11 – Select Problems for Coding
As a moderator, I want to mark one or more pitched problems as selected for coding so participants know what to work on.

### M12 – Open and Close Review Sessions
As a moderator, I want to open and later close review assessments that may stay open beyond the meetup.

### M13 – Reorder Queue
As a moderator, I want to reorder problems in the meetup queue so the order reflects current priorities.

---

## 23.3 Problem Owner User Stories

### P1 – Create a New Problem
As a problem owner, I want to create a new problem by providing only my email, so I can start drafting without creating a password or logging in.

### P2 – Edit a Draft Problem
As a problem owner, I want my edits to be auto-saved so I never lose my work.

### P3 – Perform a Self-Assessment
As a problem owner, I want to complete a self-review inventory to validate my problem before submission.

### P4 – Submit the Problem
As a problem owner, I want to submit my problem so moderators can review it.

### P5 – Update a Submitted Problem
As a problem owner, I want to create a new major version when I improve my problem after feedback.

### P6 – Attach Repository Updates
As a problem owner, I want the system to record the repository commit hash associated with a version so evaluations are traceable to specific code states.

### P7 – Promote an Earlier Version
As a problem owner, I want to promote an earlier version to become the new current version, so I can recover from undesirable changes.

### P8 – View Decision History
As a problem owner, I want to see all moderator decisions and comments related to my problem so I understand its status and feedback.

---

## 23.4 Participant / Observer User Stories

### U1 – Browse Public Problems
As a participant, I want to browse all public problems on the meetup homepage so I can see what's available.

### U2 – Vote During a Pitch
As a participant, I want to rate the current pitch using the active pitch inventory so my feedback is captured.

### U3 – Skip a Vote
As a participant, I want to continue without voting if I have no opinion so I'm not forced to provide uninformed ratings.

### U4 – Comment on a Problem
As a participant, I want to leave a public comment on a problem card so I can share feedback or ask questions.

### U5 – Set Presence Mode
As a participant, I want to indicate once at the start of a session whether I'm in-presence or remote, so my responses are correctly contextualized.

---

## 23.5 Agent User Stories

### G1 – Automated Pre-Review
As an evaluation agent, I want to run a pre-review inventory on submitted problems and record non-binding recommendations.

### G2 – Recommend Acceptance or Rejection
As an agent, I want to log acceptance or rejection recommendations without changing problem state so human moderators retain authority.

### G3 – Run Comparative Analysis
As an agent, I want to compare problems or versions using historical assessment data so patterns and insights can be surfaced.

### G4 – Leave Analytical Comments
As an agent, I want to leave analytical comments on problems so insights are captured without making formal recommendations.

---

## 23.6 Cross-Cutting System Stories

### S1 – Track Contextual Metadata
As the system, I want to store role, time context, and presence for every response so longitudinal analysis is possible.

### S2 – Maintain a Full Audit Trail
As the system, I want every meaningful action to be recorded as a decision so meetup history is fully reconstructible.
