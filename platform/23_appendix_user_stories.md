# 23. Appendix – User Stories

This appendix contains a complete, minimal set of user stories that together define a feature-complete platform.
The stories are grouped by role. Story identifiers (A1, M1, P1, …) are kept identical to preserve traceability.

---

## 23.1 Administrator User Stories

### A1 – Bootstrap the System
As an administrator, I want to create the initial event entry and basic configuration so the platform is ready for first use.

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

### A8 – Create Partner Organizations
As an administrator, I want to create partner organizations with logo, website, and contact information so events can be attributed to hosting partners.

### A9 – Manage Locations and Rooms
As an administrator, I want to create locations (cities/venues) and rooms with capacity information so events can be scheduled with proper capacity management.

### A10 – Create Events
As an administrator, I want to create events with partner, room, hosts, dates, and external links so the community can see upcoming events.

### A11 – Import Users via CSV
As an administrator, I want to bulk-import users from a partner-provided CSV file so attendees can be pre-registered for events.

### A12 – View and Manage User Accounts
As an administrator, I want to view all user accounts, their roles, and newsletter subscriptions so I can manage the community.

### A13 – Promote Users to Moderator
As an administrator, I want to promote regular users to moderator role so trusted community members can help orchestrate events.

### A14 – Configure Contributor Recognition Weights
As an administrator, I want to configure point weights for contribution actions and review weight multipliers so the recognition system can be tuned based on community feedback.
*(Spec: Ch.17.9.3, Ch.33.6.6)*

### A15 – Manage Catalog Tables
As an administrator, I want to add new values to catalog tables (decision types, time contexts, lesson categories, emojis) so the system can evolve without schema migrations.
*(Spec: Ch.19.2, Ch.25)*

### A16 – View System Health
As an administrator, I want to view system status metrics and health indicators so I can monitor platform integrity and performance.
*(Spec: Ch.12.6)*

### A17 – Edit Event Details
As an administrator, I want to edit event details after creation so corrections and updates can be made.
*(Spec: Ch.17.3)*

### A18 – Export Data for Analysis
As an administrator, I want to export assessment data, decision histories, and aggregated results so external analysis tools can be used for research.
*(Spec: Ch.15.3.4)*

---

## 23.2 Moderator User Stories

### M1 – Create an Event
As a moderator, I want to create a new event entry so problems can be curated for a specific event.

### M2 – View the Global Problem Backlog
As a moderator, I want to see all submitted problems sorted by creation date, with rejected problems hidden by default.

### M3 – Review a Newly Submitted Problem
As a moderator, I want to open a problem card and inspect its current version and metadata to judge suitability.

### M4 – Post in Problem Chat
As a moderator, I want to post messages in the problem chat (with distinct moderator styling) so the problem owner and participants can see official feedback.

### M5 – Record a Quality Gate Decision
As a moderator, I want to mark a problem as accepted or rejected with an optional rationale so the decision is documented.

### M6 – Select Problems for a Event
As a moderator, I want to select problems for the next event so they appear in the planned queue.

### M7 – Defer a Problem with Specific Reasons
As a moderator, I want to defer a problem with a specific reason such as PO absent, low priority, too complex, skipped, needs refinement, or future capability.

### M8 – Open a Pitch Session
As a moderator, I want to open a pitch assessment so participants can vote live.

### M9 – Close a Pitch Session
As a moderator, I want to close the pitch assessment so voting stops and results are finalized.

### M10 – View Pitch Results
As a moderator, I want to see aggregated pitch results to inform the group discussion.

### M11 – Select Problems for Coding
As a moderator, I want to mark one or more pitched problems as selected for coding so participants know what to work on.

### M12 – Open and Close Review Sessions
As a moderator, I want to open and later close review assessments that may stay open beyond the event.

### M13 – Reorder Queue
As a moderator, I want to reorder problems in the event queue so the order reflects current priorities.

### M14 – Track Event Attendance
As a moderator, I want to mark attendance at events so show-up rates can inform future overbooking decisions.

### M15 – View Cross-Location Activity
As a moderator, I want to view events and problems across all locations so I can coordinate the broader community.

### M16 – Set Countdown Timer for Phase
As a moderator, I want to set or extend a countdown timer when opening a pitch, review, or coding phase so participants know how much time remains and can pace themselves.
*(Spec: Ch.14.5.1, Ch.14.5.5)*

### M17 – Send Live Announcement
As a moderator, I want to send an announcement to all event participants during a live event so I can communicate schedule changes, instructions, or encouragements.
*(Spec: Ch.14.5.5)*

### M18 – Deselect Problem from Coding
As a moderator, I want to deselect a problem from coding when no team forms or participants lose interest so the problem returns to the event agenda rather than the general backlog.
*(Spec: Ch.27.5)*

### M19 – Award Stars After Review
As a moderator, I want to award star rankings (1st, 2nd, 3rd place) after review assessments close so outstanding solutions receive visible recognition.
*(Spec: Ch.17.9, Ch.33.6.4)*

### M20 – Review Learnings from Previous Event
As a moderator, I want to view lessons learned and late reviews from the previous event (own location and cross-location) so I can prepare a brief wrap-up summary for the current event's introduction.
*(Spec: Ch.12.5)*

### M21 – Close Problem After Sprint
As a moderator, I want to mark a problem as closed (complete or partial) after the coding sprint so its lifecycle status accurately reflects the outcome.
*(Spec: Ch.10.3, Ch.27.6)*

### M22 – Drop Problem from Consideration
As a moderator, I want to drop a problem from consideration with a specific reason (low relevance or low quality) so it is removed from active backlog views while preserving the decision rationale.
*(Spec: Ch.10.3, Ch.27.6)*

### M23 – Manage Event Agenda
As a moderator, I want to add, reorder, skip, and track phases in the event agenda so I can adapt the event flow to the actual pace and participant needs.
*(Spec: Ch.14.5.5)*

### M24 – View Moderator Feedback Summary
As a moderator, I want to view an aggregated feedback summary across all problems in an event (pitch clarity scores, review quality scores, cross-location insights) so I can identify patterns and prepare informed commentary.
*(Spec: Ch.15)*

### M25 – Flag Lessons as Valuable
As a moderator, I want to flag lessons learned as valuable so they are shared with other locations for cross-community learning.
*(Spec: Ch.13.1, Ch.15.2.4)*

### M26 – Delete Inappropriate Messages
As a moderator, I want to delete inappropriate chat messages (soft delete) so community guidelines are maintained.
*(Spec: Ch.31.4)*

### M27 – Organize Decisions by Category
As a moderator on mobile, I want decision buttons organized into collapsible categories (Quality Gate, Planning, Deferral, etc.) so I can quickly find and execute the right decision type without scrolling through 25 buttons.
*(Spec: Ch.12.5, Ch.26.12.3, Decision #4)*

### M28 – Control Timer Audio
As a moderator, I want to enable audio cues for countdown timers during live events so participants are alerted when time is running out.
*(Spec: Ch.14.5.1, Decision #23)*

---

## 23.3 Problem Owner User Stories

### P1 – Create a New Problem
As a problem owner, I want to create a new problem after logging in so I can start drafting with proper attribution.

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

### P9 – Assign Problem Owner Deputy
As a problem owner, I want to assign a PO Deputy with the same rights as me so ownership can be shared or continued when I'm unavailable.
*(Spec: Ch.3.2, Ch.19.3.10)*

### P10 – Manage Problem Resources
As a problem owner, I want to add and edit direct resources and helpful artifacts so participants have the context they need.
*(Spec: Ch.4.2, Ch.6.2)*

### P11 – Approve Observer Resource Suggestions
As a problem owner, I want to approve or reject resource suggestions from observers so I maintain curation authority while enabling community contributions.
*(Spec: Ch.6.2)*

### P12 – Add Lessons Learned
As a problem owner, I want to add lessons learned to my problem so insights are captured for future participants and other locations.
*(Spec: Ch.4.2, Ch.13.1, Ch.19.3.27)*

### P13 – Flag Lessons as Valuable
As a problem owner, I want to flag my lessons learned as valuable so they are shared with other locations in the community.
*(Spec: Ch.13.1, Ch.15.2.4)*

### P14 – Set Breakout Room URL
As a problem owner, I want to set a video call URL for my problem team so we can coordinate in real-time during sprints.
*(Spec: Ch.13.3, Ch.31.7)*

### P15 – Clone Problem
As a problem owner, I want to clone my existing problem as a new problem so I can explore variations without linking history.
*(Spec: Ch.13.2)*

### P16 – Participate in Team Chat
As a problem owner, I want to participate in my problem's team chat so I can answer questions and coordinate with the team.
*(Spec: Ch.13.1, Ch.31)*

### P17 – View Assessment Results
As a problem owner, I want to view aggregated assessment results with actionable feedback so I understand what to improve.
*(Spec: Ch.13.2, Ch.15.4.1)*

### P18 – Archive Problem
As a problem owner, I want to archive a problem when it's no longer relevant so it's removed from active listings while preserving history.
*(Spec: Ch.4.1)*

---

## 23.4 Participant / Observer User Stories

### U1 – Register an Account
As a new user, I want to register using email+password, GitHub OAuth, or LinkedIn OAuth, accepting terms and conditions, so I can participate in the community.

### U2 – Confirm Email Address
As a new user, I want to confirm my email address via a link sent to my inbox so I can receive newsletters and notifications.

### U3 – Browse Upcoming Events
As a visitor, I want to see upcoming events with images, dates, and locations on the landing page so I can decide which to attend.

### U4 – Register for an Event
As a registered user, I want to register for an event (in-presence or remote) so I can participate.

### U5 – Join Waitlist
As a registered user, when in-presence capacity is full, I want to join a waitlist so I can be notified if a spot opens.

### U6 – Browse Public Problems
As a participant, I want to browse all public problems so I can see what's available for discussion.

### U7 – Vote During a Pitch
As a participant, I want to rate the current pitch using the active pitch inventory so my feedback is captured.

### U8 – Skip a Vote
As a participant, I want to continue without voting if I have no opinion so I'm not forced to provide uninformed ratings.

### U9 – Join a Problem Team
As a participant, I want to click "Challenge accepted" on a Problem Card to join the team working on that problem.

### U10 – Post in Problem Chat
As a participant, I want to post messages in the problem chat so I can collaborate with others interested in the same problem.

### U11 – Use Chat Filters
As a participant, I want to filter chat by moderator posts, PO posts, or messages with URLs so I can find relevant information quickly.

### U12 – Share Solution Repository
As a team member, I want to share my solution repository URL with my team so others can see my approach.

### U13 – Add Breakout Room URL
As a team member, I want to add a video call link (Google Meet, Zoom) so my team can coordinate in real-time.

### U14 – Manage Newsletter Subscription
As a registered user, I want to toggle my newsletter subscription so I can control what communications I receive.

### U15 – Set Presence Mode
As a participant, I want to indicate once at the start of a session whether I'm in-presence or remote, so my responses are correctly contextualized.

### U16 – Suggest Resource as Observer
As an observer, I want to suggest a helpful resource for a problem (pending PO approval) so I can contribute without being on the team.
*(Spec: Ch.6.2)*

### U17 – Complete Review Assessment
As a participant, I want to complete review assessments after the coding sprint so I can evaluate solution quality.
*(Spec: Ch.8.1, Ch.14.2)*

### U18 – Complete Post-Event Reflection
As a participant, I want to complete post-event or late reflection assessments so delayed insights are captured.
*(Spec: Ch.8.1, Ch.8.3)*

### U19 – React to Chat Messages
As a participant, I want to react to chat messages with emoji (from curated set of 10) so I can express agreement or appreciation efficiently.
*(Spec: Ch.31.4)*

### U20 – Reply to Chat Messages
As a participant, I want to reply to specific chat messages to create threaded discussions so conversations stay organized.
*(Spec: Ch.31.4)*

### U21 – Mention Users in Chat
As a participant, I want to @mention other users in chat so they receive notifications and the conversation is directed.
*(Spec: Ch.31.4)*

### U22 – Add Lessons Learned
As a participant, I want to add lessons learned to problems I've worked on so insights are preserved for future teams.
*(Spec: Ch.4.2, Ch.13.1)*

### U23 – Retire from Team
As a team member, I want to retire from a problem team when I can no longer contribute so my status is accurate.
*(Spec: Ch.31.7)*

### U24 – Rejoin Team
As a retired team member, I want to rejoin a problem team so I can resume participation.
*(Spec: Ch.31.7)*

### U25 – Filter Chat by Version
As a participant, I want to filter chat messages by problem version (current or all) so I see relevant discussion context.
*(Spec: Ch.31.8)*

### U26 – View Historical Problem Versions
As a participant, I want to view historical versions of a problem card (read-only) so I can understand how it evolved.
*(Spec: Ch.13.5)*

### U27 – View Decision History Timeline
As a participant, I want to view the complete decision history timeline for a problem so I understand why it's in its current state.
*(Spec: Ch.13.6.4)*

### U28 – View Assessment Results
As a participant, I want to view aggregated assessment results with filters so I can see community feedback.
*(Spec: Ch.15.1, Ch.15.2)*

### U29 – Cancel Event Registration
As a registered user, I want to cancel my event registration so my spot can be offered to waitlisted users.
*(Spec: Ch.29.6)*

### U30 – Respond to Waitlist Invitation
As a waitlisted user, I want to confirm or decline my waitlist invitation within 24 hours so I can claim an available spot.
*(Spec: Ch.29.6, Ch.30.9)*

### U31 – Change Password
As a user with local authentication, I want to change my password so I can maintain account security.
*(Spec: Ch.18.2, Ch.30.10)*

### U32 – View Personal Contributions
As a participant, I want to view my points, stars, and contribution breakdown so I can track my own progress.
*(Spec: Ch.33.6.7)*

### U33 – Opt Out of Public Contributor Wall
As a participant, I want to opt out of appearing on the public contributor wall while still tracking my personal progress.
*(Spec: Ch.18.12, Ch.33.6.5)*

### U34 – Receive Toast Notifications
As a participant, I want to receive toast notifications for important events (assessment submitted, problem accepted, team member joined) so I get immediate feedback without page navigation.
*(Spec: Ch.26.11.12, Decision #3)*

### U35 – Collapse Long Sections
As a participant on mobile, I want to collapse less-frequently-used sections (lessons, decisions) on the Problem Card so I can focus on current work without excessive scrolling.
*(Spec: Ch.13, Ch.26.11.20, Decision #28)*

### U36 – Enable Audio Cues
As a participant, I want to enable audio alerts for countdown timers so I'm notified when time is running out even if I'm looking away from the screen.
*(Spec: Ch.14.5.1, Ch.19.3.1, Decision #23)*

---

## 23.5 Agent User Stories

### G1 – Automated Pre-Review
As an evaluation agent, I want to run a pre-review inventory on submitted problems and record non-binding recommendations.

### G2 – Recommend Acceptance or Rejection
As an agent, I want to log acceptance or rejection recommendations without changing problem state so human moderators retain authority.

### G3 – Run Comparative Analysis
As an agent, I want to compare problems or versions using historical assessment data so patterns and insights can be surfaced.

### G4 – Post Analytical Messages
As an agent, I want to post analytical messages in problem chat (clearly marked as bot) so insights are captured without making formal recommendations.

---

## 23.6 Cross-Cutting System Stories

### S1 – Track Contextual Metadata
As the system, I want to store role, time context, event, location, and presence for every response so longitudinal analysis is possible.

### S2 – Maintain a Full Audit Trail
As the system, I want every meaningful action to be recorded as a decision so event history is fully reconstructible.

### S3 – Manage Waitlist Automatically
As the system, I want to automatically invite the next waitlist user when a registration is cancelled, with a 24-hour response window.

### S4 – Track Show-Up Rates
As the system, I want to track actual attendance vs. registrations so overbooking factors can be optimized.

### S5 – Send Onboarding Emails
As the system, I want to send onboarding emails with OTP to new users so they can complete registration.

### S6 – Email Uniqueness Enforcement
As the system, I want to ensure each email maps to exactly one user, reusing existing accounts when the same email registers again.

### S7 – Auto-Close Assessment on Timer Expiry
As the system, I want to automatically close pitch or review assessments when countdown timers expire so time limits are enforced without manual moderator action.
*(Spec: Ch.14.3, Ch.19.3.9)*

### S8 – Auto-Close Previous Pitch
As the system, I want to automatically close the currently open pitch when a new pitch is opened so only one pitch is interactive at a time.
*(Spec: Ch.25)*

### S9 – Award Contribution Points
As the system, I want to automatically award contribution points when qualifying actions occur so contributors are recognized immediately.
*(Spec: Ch.33.6.3)*

### S10 – Update Live Context Cache
As the system, I want to update the event_live_context cache when live decisions are recorded so dashboards show current state efficiently.
*(Spec: Ch.19.3.9)*

### S11 – Track User Milestones
As the system, I want to detect and record first-time achievements so celebration messages are shown only once per milestone.
*(Spec: Ch.19.3.37, Ch.33.2)*

### S12 – Send Event Reminder Emails
As the system, I want to send reminder emails 24 hours before events to registered users so attendance is maximized.
*(Spec: Ch.29.11.1)*
