# 23. Appendix – User Stories

This appendix contains a complete, minimal set of user stories that together define a feature-complete platform.
The stories are grouped by role. Story identifiers (A1, M1, P1, …) are kept identical to preserve traceability.

---

## 23.1 Administrator User Stories

### A1 – Bootstrap the System
As an administrator, I want to create the initial event entry and basic configuration so the platform is ready for first use.
*(Spec: Ch.17.3, Ch.29.4)*

### A2 – Manage Moderator Accounts
As an administrator, I want to upgrade a moderator account to administrator so trusted moderators can manage inventories and items.
*(Spec: Ch.3.2, Ch.17.5)*

### A3 – Create and Edit Items
As an administrator, I want to create a new evaluation item with text, scale definition, and labels so it can be reused across inventories.
*(Spec: Ch.7.2, Ch.17.1)*

### A4 – Retire and Replace Items
As an administrator, I want to change an item's wording or scale while keeping the same item key, so historical data remains interpretable.
*(Spec: Ch.7.2, Ch.17.2)*

### A5 – Assemble an Inventory
As an administrator, I want to assemble an inventory by selecting and ordering item keys so evaluations are consistent.
*(Spec: Ch.7.5, Ch.17.1)*

### A6 – Clone an Inventory
As an administrator, I want to clone an existing inventory to create a variant for a different evaluation context.
*(Spec: Ch.7.1, Ch.17.1)*

### A7 – Retire an Inventory
As an administrator, I want to retire an inventory so it is no longer available for new assessments while preserving historical data.
*(Spec: Ch.17.2)*

### A8 – Create Partner Organizations
As an administrator, I want to create partner organizations with logo, website, and contact information so events can be attributed to hosting partners.
*(Spec: Ch.17.4, Ch.29.2)*

### A9 – Manage Locations and Rooms
As an administrator, I want to create locations (cities/venues) and rooms with capacity information so events can be scheduled with proper capacity management.
*(Spec: Ch.17.4, Ch.29.3)*

### A11 – Import Users via CSV
As an administrator, I want to bulk-import users from a partner-provided CSV file so attendees can be pre-registered for events.
*(Spec: Ch.17.5, Ch.30.4)*

### A12 – View and Manage User Accounts
As an administrator, I want to view all user accounts, their roles, and newsletter subscriptions so I can manage the community.
*(Spec: Ch.17.5)*

### A13 – Promote Users to Moderator
As an administrator, I want to promote regular users to moderator role so trusted community members can help orchestrate events.
*(Spec: Ch.3.2, Ch.17.5)*

### A14 – Configure Contributor Recognition and Catalog Tuning
As an administrator, I want to configure point weights for contribution actions and review weight multipliers so the recognition system can be tuned based on community feedback.
*(Spec: Ch.17.9.3, Ch.33.6.6, Ch.19.3.32, Ch.19.3.35)*

> **Note on catalog extensibility**: Catalog tables fall into two categories (see Ch.17.10). **Soft catalogs** (`problem_type_catalog`, `emoji_catalog`, `lesson_category_catalog`) and **weight catalogs** (`contribution_action_catalog`, `review_weight_catalog`) are admin-tunable at runtime — administrators can add entries, edit display metadata, adjust weights, and toggle active/inactive. **Structural catalogs** (readiness states, action states, decision types, time contexts, user roles, auth providers, etc.) are architectural constants that change only through the spec-first pipeline because they drive state machines, authorization logic, or assessment lifecycles. The VARCHAR+FK pattern (Ch.25.1) enables extensibility without migrations for all catalog types.

### A15 – View System Health
As an administrator, I want to view system status metrics and health indicators so I can monitor platform integrity and performance.
*(Spec: Ch.12.6)*

### A16 – Edit Event Details
As an administrator, I want to edit event details after creation so corrections and updates can be made.
*(Spec: Ch.17.3)*

### A17 – Export Data for Analysis
As an administrator, I want to download CSV exports from analytics views and audit screens so I can use external tools for research and debug data issues without needing direct database access.
*(Spec: Ch.12.6, Ch.15.3.4)*

### A18 – Search and Paginate Admin Lists
As an administrator, I want all admin list views (users, events, items, inventories) to support server-side pagination, keyword search, and role/status filtering so the UI remains responsive and usable when managing hundreds or thousands of entries.
*(Spec: Ch.12.10, Ch.17.5, Ch.26.17)*

### A19 – Filter Admin User List by Role
As an administrator, I want to filter the user list by role (observer, developer, moderator, admin, agent) and email confirmation status so I can quickly find specific user groups for management tasks like promotions or CSV export.
*(Spec: Ch.17.5, Ch.12.10.3)*

---

## 23.2 Moderator User Stories

### M1 – Create an Event
As a moderator, I want to create a new event with partner, room, hosts, dates, and external links so problems can be curated for a specific event and the community can see upcoming events. Administrators share this capability in their moderator capacity.
*(Spec: Ch.17.3, Ch.29.4)*

### M2 – View the Global Problem Backlog
As a moderator, I want to see all submitted problems sorted by creation date, with rejected problems hidden by default, using the Problem Backlog Page with moderator-only filter options to reveal rejected and dropped problems for curation purposes.
*(Spec: Ch.12.5, Ch.12.8)*

### M3 – Review a Newly Submitted Problem
As a moderator, I want to open a problem card and inspect its current version and metadata to judge suitability.
*(Spec: Ch.13.4)*

### M4 – Post in Problem Chat
As a moderator, I want to post messages in the problem chat (with distinct moderator styling) so the problem owner and participants can see official feedback.
*(Spec: Ch.31.4)*

### M5 – Record a Quality Gate Decision
As a moderator, I want to mark a problem as accepted or rejected with an optional rationale so the decision is documented.
*(Spec: Ch.10.3, Ch.27.3)*

### M6 – Select Problems for an Event
As a moderator, I want to select problems for the next event so they appear in the planned queue.
*(Spec: Ch.10.3, Ch.27.4)*

### M7 – Defer a Problem with Specific Reasons
As a moderator, I want to defer a problem with a specific reason such as PO absent, low priority, too complex, skipped, needs refinement, or future capability.
*(Spec: Ch.10.3, Ch.27.6)*

### M8 – Open a Pitch Session
As a moderator, I want to open a pitch assessment so participants can vote live.
*(Spec: Ch.14.1, Ch.14.3)*

### M9 – Close a Pitch Session
As a moderator, I want to close the pitch assessment so voting stops and results are finalized.
*(Spec: Ch.14.1, Ch.14.3)*

### M10 – View Pitch Results
As a moderator, I want to see aggregated pitch results to inform the group discussion.
*(Spec: Ch.15.1)*

### M11 – Select Problems for Coding
As a moderator, I want to mark one or more pitched problems as selected for coding so participants know what to work on.
*(Spec: Ch.10.3, Ch.27.5)*

### M12 – Open and Close Review Sessions
As a moderator, I want to open and later close review assessments that may stay open beyond the event.
*(Spec: Ch.14.2, Ch.14.3)*

### M13 – Reorder Queue
As a moderator, I want to reorder problems in the event queue so the order reflects current priorities.
*(Spec: Ch.29.8)*

### M14 – Track Event Attendance
As a moderator, I want to mark attendance at events so show-up rates can inform future overbooking decisions.
*(Spec: Ch.29.7)*

### M15 – View Cross-Location Activity
As a moderator, I want to view events and problems across all locations so I can coordinate the broader community.
*(Spec: Ch.12.5)*

### M16 – Set Countdown Timer for Phase
As a moderator, I want to set or extend a countdown timer when opening a pitch, review, or coding phase so participants know how much time remains and can pace themselves.
*(Spec: Ch.14.5.1, Ch.14.5.5)*

### M17 – Send Live Announcement
As a moderator, I want to post an announcement in the event-wide chat channel during a live event so I can communicate schedule changes, instructions, or encouragements — and the message persists for participants who join later.
*(Spec: Ch.14.5.5, Ch.31.16)*

### M17b – Monitor Automated System Activity
As a moderator, I want to view a chronological log of all communications and automated system actions (such as waitlist expirations and auto-invites) in the dashboard so I have full transparency into what the autonomous logic is doing behind the scenes.
*(Spec: Ch.19.3.10, ADR 010)*

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
As a moderator on mobile, I want decision buttons organized into collapsible categories (Quality Gate, Planning, Deferral, etc.) so I can quickly find and execute the right decision type without scrolling through 26 buttons.
*(Spec: Ch.12.5, Ch.26.12.3, Decision #4)*

### M28 – Control Timer Audio
As a moderator, I want to enable audio cues for countdown timers during live events so participants are alerted when time is running out.
*(Spec: Ch.14.5.1, Decision #23)*

### M29 – Access Moderator Dashboard via Bottom Navigation
As a moderator, I want a "Moderate" item in the bottom navigation bar so I can switch to the moderator dashboard with a single tap from any screen, including while walking around during a live event.
*(Spec: Ch.12.7.3, Ch.26.16.2)*

### M30 – Customize Event Reminder Content
As a moderator, I want to edit and save a new version of the event reminder template before it is sent to all registered participants (e.g., adding notes about special guests) so the communication is contextually relevant and the system retains a history of the templates.
*(Spec: Ch.16.6, Ch.19.3.9)*

### M31 – View Email Template History
As a moderator, I want to view previous versions of an event's email template so I can see what was communicated in the past and revert to an older version if necessary.
*(Spec: Ch.16.6, Ch.19.3.9)*

### M32 – Paginate Moderator Backlog Views
As a moderator, I want the problem backlog in the moderator dashboard to use server-side pagination and search so I can efficiently manage events even when the global backlog contains hundreds of problems.
*(Spec: Ch.12.5, Ch.12.10)*

---

## 23.3 Problem Owner User Stories

### P1 – Create a New Problem
As a problem owner, I want to create a new problem after logging in so I can start drafting with proper attribution.
*(Spec: Ch.4.2, Ch.13.2)*

### P2 – Edit a Draft Problem
As a problem owner, I want my edits to be auto-saved so I never lose my work.
*(Spec: Ch.13.2, Ch.25.4.2)*

### P3 – Perform a Self-Assessment
As a problem owner, I want to complete a self-review inventory to validate my problem before submission.
*(Spec: Ch.8.1)*

### P4 – Submit the Problem
As a problem owner, I want to submit my problem so moderators can review it.
*(Spec: Ch.10.3, Ch.27.2)*

### P5 – Update a Submitted Problem
As a problem owner, I want to create a new major version when I improve my problem after feedback.
*(Spec: Ch.5.1)*

### P6 – Attach Repository Updates
As a problem owner, I want the system to record the repository commit hash associated with a version so evaluations are traceable to specific code states.
*(Spec: Ch.5.2, Ch.19.3.12)*

### P7 – Promote an Earlier Version
As a problem owner, I want to promote an earlier version to become the new current version, so I can recover from undesirable changes.
*(Spec: Ch.5.1)*

### P8 – View Decision History
As a problem owner, I want to see all moderator decisions and chat messages related to my problem so I understand its status and feedback.
*(Spec: Ch.10.5, Ch.13.6.4)*

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
*(Spec: Ch.4.1, Ch.10.3, Ch.19.3.10)*

---

## 23.4 Participant / Observer User Stories

### U1 – Register an Account
As a new user, I want to register using email+password, GitHub OAuth, or LinkedIn OAuth, accepting terms and conditions, so I can participate in the community.
*(Spec: Ch.18.1, Ch.30.2)*

### U2 – Confirm Email Address
As a new user, I want to confirm my email address via a link sent to my inbox so I can receive newsletters and notifications.
*(Spec: Ch.18.5, Ch.30.2)*

### U3 – Browse Upcoming Events
As a visitor, I want to see upcoming events with images, dates, and locations on the landing page so I can decide which to attend. As an authenticated user, I want a dedicated Events Listing Page with temporal grouping (active, upcoming, past), location filters, and in-page registration so I can discover events across all locations.
*(Spec: Ch.12.1, Ch.12.9, Ch.29.4)*

### U4 – Register for an Event
As a registered user, I want to register for an event (in-presence or remote) so I can participate.
*(Spec: Ch.29.5, Ch.30.8)*

### U5 – Join Waitlist
As a registered user, when in-presence capacity is full, I want to join a waitlist so I can be notified if a spot opens.
*(Spec: Ch.29.6, Ch.30.8)*

### U6 – Browse Public Problems
As a participant, I want to browse all public problems on a dedicated Problem Backlog Page with filtering by readiness state, action state, and problem type, plus keyword search and sorting, so I can discover problems across the community.
*(Spec: Ch.12.8, Ch.13.1)*

### U7 – Vote During a Pitch
As a participant, I want to rate the current pitch using the active pitch inventory so my feedback is captured.
*(Spec: Ch.8.1, Ch.14.1)*

### U8 – Skip a Vote
As a participant, I want to continue without voting if I have no opinion so I'm not forced to provide uninformed ratings.
*(Spec: Ch.14.1)*

### U9 – Join a Problem Team
As a participant, I want to click "Challenge accepted" on a Problem Card to join the team working on that problem.
*(Spec: Ch.13.3, Ch.31.7)*

### U10 – Post in Problem Chat
As a participant, I want to post messages in the problem chat so I can collaborate with others interested in the same problem.
*(Spec: Ch.31.4)*

### U11 – Use Chat Filters
As a participant, I want to filter chat by moderator posts, PO posts, or messages with URLs so I can find relevant information quickly.
*(Spec: Ch.31.4)*

### U12 – Share Solution Repository
As a team member, I want to share my solution repository URL with my team so others can see my approach.
*(Spec: Ch.6.2, Ch.13.3)*

### U13 – Add Breakout Room URL
As a team member, I want to add a video call link (Google Meet, Zoom) so my team can coordinate in real-time.
*(Spec: Ch.13.3, Ch.31.7)*

### U14 – Manage Newsletter Subscription
As a registered user, I want to toggle my newsletter subscription so I can control what communications I receive.
*(Spec: Ch.30.6)*

### U15 – Set Presence Mode
As a participant, I want to indicate once at the start of a session whether I'm in-presence or remote, so my responses are correctly contextualized.
*(Spec: Ch.8.4)*

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

### U26 – Post in Event Chat
As a participant, I want to post messages in the event-wide chat channel (not tied to any specific problem) so I can share community links, learnings, and general discussion with all event attendees.
*(Spec: Ch.31.16)*

### U27 – View Historical Problem Versions
As a participant, I want to view historical versions of a problem card (read-only) so I can understand how it evolved.
*(Spec: Ch.13.5)*

### U28 – View Decision History Timeline
As a participant, I want to view the complete decision history timeline for a problem so I understand why it's in its current state.
*(Spec: Ch.13.6.4)*

### U29 – View Assessment Results
As a participant, I want to view aggregated assessment results with filters so I can see community feedback.
*(Spec: Ch.15.1, Ch.15.2)*

### U30 – Cancel Event Registration
As a registered user, I want to cancel my event registration so my spot can be offered to waitlisted users.
*(Spec: Ch.29.6)*

### U31 – Respond to Waitlist Invitation
As a waitlisted user, I want to confirm or decline my waitlist invitation within 24 hours so I can claim an available spot.
*(Spec: Ch.29.6, Ch.30.9)*

### U32 – Change Password
As a user with local authentication, I want to change my password so I can maintain account security.
*(Spec: Ch.18.2, Ch.30.10)*

### U33 – View Personal Contributions
As a participant, I want to view my points, stars, and contribution breakdown so I can track my own progress.
*(Spec: Ch.33.6.7)*

### U34 – Opt Out of Public Contributor Wall
As a participant, I want to opt out of appearing on the public contributor wall while still tracking my personal progress.
*(Spec: Ch.18.12, Ch.33.6.5)*

### U35 – Receive Toast Notifications
As a participant, I want to receive toast notifications for important events (assessment submitted, problem accepted, team member joined) so I get immediate feedback without page navigation.
*(Spec: Ch.26.11.12, Decision #3)*

### U36 – Collapse Long Sections
As a participant on mobile, I want to collapse less-frequently-used sections (lessons, decisions) on the Problem Card so I can focus on current work without excessive scrolling.
*(Spec: Ch.13, Ch.26.11.20, Decision #28)*

### U37 – Enable Audio Cues
As a participant, I want to enable audio alerts for countdown timers so I'm notified when time is running out even if I'm looking away from the screen.
*(Spec: Ch.14.5.1, Ch.19.3.1, Decision #23)*

### U38 – Switch Screens via Bottom Navigation
As a participant on mobile, I want a persistent bottom navigation bar showing the main screens (Home, Events, Problems) so I can switch between them with a single tap without navigating through menus.
*(Spec: Ch.12.7.3, Ch.26.16.2)*

### U39 – Access Account via Top-Right Avatar
As an authenticated user, I want to see my avatar in the top-right corner of every screen so I can confirm I'm logged in and access account actions (settings, logout) with a single tap.
*(Spec: Ch.12.7.2, Ch.26.16.1)*

### U40 – See Current Location in Navigation
As a participant, I want the bottom navigation bar to highlight which screen I'm currently on so I always know where I am in the app.
*(Spec: Ch.12.7.3, Ch.26.16.2)*

### U41 – Filter and Sort Problem Backlog
As a participant, I want to filter the problem backlog by readiness state, action state, and problem type, and sort by creation date or review count, so I can quickly find problems that match my interests or expertise.
*(Spec: Ch.12.8.4, Ch.12.10.3)*

### U42 – Search Problems by Keyword
As a participant, I want to type a keyword into the search bar on the Problem Backlog Page and see results updated live (debounced) so I can find specific problems without scrolling through long lists.
*(Spec: Ch.12.8.5, Ch.12.10.2, Ch.26.17.2)*

### U43 – Filter Events by Location
As a participant, I want to filter the Events Listing Page by location (Cologne, Aachen, etc.) and time range so I can find events relevant to my geography and availability.
*(Spec: Ch.12.9.4, Ch.12.10.3)*

### U44 – Share a Filtered View
As a participant, I want filters, search terms, and pagination to be reflected in the URL so I can share a specific filtered view with colleagues or bookmark it for later.
*(Spec: Ch.12.10.4)*

### U45 – Register for Event from Listing
As a participant, I want to register for an upcoming event directly from the Events Listing Page without navigating to the Event Detail Page, so I can sign up quickly when browsing.
*(Spec: Ch.12.9.2, Ch.29.5)*

---

## 23.5 Bot Management User Stories

### B1 – Create API Key for Bot
As a registered user, I want to create a secret API key for my bot so it can authenticate against the platform's REST API on my behalf.
*(Spec: Ch.18.13, Ch.19.3.39)*

### B2 – Revoke API Key
As a registered user, I want to revoke an API key so a compromised or retired bot immediately loses access.
*(Spec: Ch.18.13, Ch.19.3.39)*

### B3 – View My API Keys
As a registered user, I want to see all my API keys with their status (active, expired, revoked), display prefix, and linked bot names so I can manage my bot ecosystem.
*(Spec: Ch.18.13, Ch.19.3.39)*

### B4 – Bot Onboarding
As a registered user, I want the system to automatically create a bot user record (role = agent, display_name = "Bot of {my display_name}") when I create my first API key, so my bot has a proper identity for attribution.
*(Spec: Ch.3.2, Ch.19.3.1, Ch.19.3.39)*

---

## 23.6 Agent User Stories *(Future Scope)*

> **Note**: Agent stories G1–G4 describe the *agentic behaviors* that bots perform once authenticated via the API key mechanism defined in §23.5. The REST API specification enabling these behaviors is deferred to a dedicated "Agent API" chapter (see Ch.22). The user stories are retained here to define the target capability.

### G1 – Automated Pre-Review
As an evaluation agent, I want to run a pre-review inventory on submitted problems and record non-binding recommendations.
*(Spec: Ch.3.2, Ch.10.2)*

### G2 – Recommend Acceptance or Rejection
As an agent, I want to log acceptance or rejection recommendations without changing problem state so human moderators retain authority.
*(Spec: Ch.3.2, Ch.10.2)*

### G3 – Run Comparative Analysis
As an agent, I want to compare problems or versions using historical assessment data so patterns and insights can be surfaced.
*(Spec: Ch.8.5, Ch.15)*

### G4 – Post Analytical Messages
As an agent, I want to post analytical messages in problem chat (clearly marked as bot) so insights are captured without making formal recommendations.
*(Spec: Ch.3.2, Ch.31.4)*

---

## 23.7 Cross-Cutting System Stories

### S1 – Track Contextual Metadata
As the system, I want to store role, time context, event, location, and presence for every response so longitudinal analysis is possible.
*(Spec: Ch.8.4, Ch.19.3.17)*

### S2 – Maintain a Full Audit Trail
As the system, I want every meaningful action to be recorded as a decision so event history is fully reconstructible.
*(Spec: Ch.10.1, Ch.20.1)*

### S3 – Manage Waitlist Automatically
As the system, I want to automatically invite the next waitlist user when a registration is cancelled, with a 24-hour response window.
*(Spec: Ch.29.6, Ch.30.9)*

### S4 – Track Show-Up Rates
As the system, I want to track actual attendance vs. registrations so overbooking factors can be optimized.
*(Spec: Ch.29.7)*

### S5 – Send Onboarding Emails
As the system, I want to send onboarding emails with OTP to new users so they can complete registration.
*(Spec: Ch.16.4.1, Ch.30.7)*

### S6 – Email Uniqueness Enforcement
As the system, I want to ensure each email maps to exactly one user, reusing existing accounts when the same email registers again.
*(Spec: Ch.18.5, Ch.30.3)*

### S7 – Auto-Close Assessment on Timer Expiry
As the system, I want to automatically close pitch or review assessments when countdown timers expire so time limits are enforced without manual moderator action.
*(Spec: Ch.14.3, Ch.19.3.9)*

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
As the system, triggered by an external event (cron job or manual trigger by moderator), I want to send reminder emails before events using the currently active versioned template, so attendance is maximized.
*(Spec: Ch.16.6, Ch.29.11.1)*

### S13 – Manage Waitlist Queue and Expiration Constraints
As the system, I want to accurately track the chronological order of the waitlist and enforce the 24-hour expiration rule, ensuring that at most one active invitation exists per available spot.
*(Spec: Ch.19.3.7, Ch.29.6, ADR 010)*

### S14 – Inject Content into Versioned Templates
As the system, when automatically inviting a waitlisted user, I want to use the currently active version of the event's email template and append a 24-hour confirmation notice to it, so the user receives the latest contextual information alongside their specific waitlist constraints.
*(Spec: Ch.16.6)*
