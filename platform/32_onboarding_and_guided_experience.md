# 32. Onboarding and Guided Experience

This chapter specifies how the platform **reduces cognitive load** for new and returning users. Rather than presenting all functionality at once, the system guides users through context-appropriate flows, progressively reveals features, and maintains continuity across sessions.

---

## 32.1 Design Philosophy

### Guiding Principles

The platform serves "Pros for Pros" — experienced practitioners who need little context. However, even experts need orientation to a new system. The onboarding approach balances respect for user competence with effective guidance.

**Core Principles:**

1. **Guide, Don't Overwhelm**: Show what's relevant now; hide what isn't
2. **Context Over Features**: Present actions in context, not as feature lists
3. **Progressive Disclosure**: Reveal complexity only when users are ready
4. **Continuity**: Remember where users left off; welcome them back
5. **Respect Competence**: Provide guidance, not tutorials; hints, not hand-holding

### Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Instead |
|--------------|--------------|---------|
| Feature tours on first login | Overwhelming, often skipped | Contextual hints when relevant |
| Mandatory tutorials | Condescending to professionals | Optional "Learn more" links |
| Empty dashboards with no guidance | Users don't know what to do | Smart empty states with clear CTAs |
| Hiding all complexity | Users can't find advanced features | Progressive disclosure with discoverability |

---

## 32.2 Role-Specific First-Time Flows

Each role has a distinct first experience. The system detects first-time users and adapts accordingly.

### 32.2.1 Problem Owner First Submission Journey

**Trigger**: User creates their first problem

**Flow Steps**:

1. **Welcome Panel** (inline, dismissible)
   ```
   Welcome to your first Problem Card!

   A good problem has:
   ✓ Clear description of what you want to build
   ✓ Acceptance criteria (how will we know it's done?)
   ✓ A linked repository (even if empty)

   [Got it] [Learn more about Problem Cards]
   ```

2. **Field-Level Hints** (on focus, first time only)
   - Title: "Keep it concise — this appears in lists and during pitches"
   - Description: "Explain the 'why' — what value does solving this create?"
   - Acceptance Criteria: "Be specific — evaluators will rate against these"

3. **Self-Assessment Prompt** (after saving draft)
   ```
   Before submitting, consider running the self-assessment.
   It helps you spot gaps before moderators review.

   [Run Self-Assessment] [Skip for now]
   ```

4. **Submission Confirmation**
   ```
   Your problem is now submitted for review!

   What happens next:
   • Moderators will review within a few days
   • You'll see feedback in the chat section below
   • You can update your problem anytime

   [View my problem] [Submit another]
   ```

**Emotional Beat** *(rationale)*: First submission is a moment of vulnerability — user is putting their idea out for judgment. Confirmation should feel supportive, not transactional.

---

### 32.2.2 Participant First Event Journey

**Trigger**: User registers for their first event

**Flow Steps**:

1. **Registration Confirmation**
   ```
   You're registered for {Event Name}!

   What to expect:
   • Arrive 10 minutes early for setup
   • Problems are pitched, then you vote
   • Teams form around selected problems
   • Code, learn, review together

   [Browse problems for this event]
   ```

2. **Pre-Event Reminder** (24h before, via email)
   - Event details (time, location, how to find room)
   - "Browse the problems" CTA
   - Community guidelines summary

3. **First Pitch Voting** (contextual, during first pitch)
   ```
   This is your first live pitch!

   Rate each dimension based on what you just heard.
   Don't overthink it — first impressions are valuable.
   Skip dimensions you're unsure about.

   [Got it]
   ```

4. **First Team Join** (after clicking "Join as Dev")
   ```
   Welcome to the team!

   • Post in the chat to introduce yourself
   • Share your approach as you work
   • Ask questions — that's what the team is for

   [Go to team chat]
   ```

**Emotional Beat** *(rationale)*: First event can feel intimidating — unfamiliar people, unfamiliar process. Guidance should normalize the experience and reduce anxiety.

---

### 32.2.3 Moderator First Orchestration Journey

**Trigger**: User with moderator role opens Moderator Dashboard for first time

**Flow Steps**:

1. **Dashboard Overview Panel** (dismissible)
   ```
   Welcome to moderation!

   Key actions during events:
   • Open/close pitch phases (one at a time)
   • Record decisions (accept, defer, select for coding)
   • Monitor the activity feed

   Problems flow: Backlog → Quality Gate → Selected → Pitched → Coded

   [Show me the controls] [I've got this]
   ```

2. **First Decision Recording** (contextual)
   ```
   Recording your first decision!

   • Binding decisions change problem state
   • Add rationale to help POs understand
   • Decision history is visible to everyone

   [Record decision]
   ```

3. **First Pitch Opening** (contextual)
   ```
   Opening a pitch assessment:

   • Participants can now vote on this problem
   • Previous pitch (if any) auto-closes
   • Close manually when discussion is done

   [Open pitch]
   ```

**Emotional Beat** *(rationale)*: First-time moderators carry responsibility for the event's success. Guidance should build confidence without being condescending.

---

## 32.3 Progressive Feature Disclosure

Features are revealed based on user context and demonstrated need, not all at once.

### Disclosure Levels

| Level | When Revealed | Examples |
|-------|---------------|----------|
| **Core** | Always visible | Dashboard, Problem List, Event List |
| **Contextual** | When relevant context exists | Team chat (when on a team), Review results (after reviews exist) |
| **Advanced** | After demonstrated engagement | Lesson learned export, Cross-location insights |
| **Admin** | Role-based | Inventory management, User management |

### Implementation Pattern

```
IF user.has_participated_in_event THEN
  show: Lessons Learned section
  show: Historical event navigation

IF user.is_team_member(problem) THEN
  show: Team chat tab
  show: Breakout room URL field

IF user.role IN (moderator, admin) THEN
  show: Moderator Dashboard link
  show: Decision recording UI
```

### Feature Discovery Hints

For hidden-but-available features, provide discovery paths:

- **Empty states**: "Once you join a team, you'll see team chat here"
- **Contextual prompts**: "Reviewed a solution? Add a Lesson Learned"
- **Settings page**: All features listed with status (active/available/locked)

---

## 32.4 Contextual Help System

### 32.4.1 Inline Tooltips

Short explanations triggered by hover or tap on help icons.

| Element | Tooltip Text |
|---------|--------------|
| Readiness State badge | "Quality status: draft → submitted → ready (or rejected)" |
| Action State badge | "Community intent: backlog → selected → coding → closed" |
| Engagement slider | "How deeply did you examine this before rating?" |
| Binding/Non-binding | "Binding = changes state. Non-binding = recommendation only." |

### 32.4.2 "What's This?" Panels

Expandable explanations for complex concepts. Accessible via `(?)` icon.

**Example: Dual State Model**
```
What are Readiness and Action states?

Problems have two independent statuses:

READINESS (quality): Is the problem well-defined?
  draft → submitted → ready (or needs_changes, rejected)

ACTION (intent): What's the community doing with it?
  backlog → selected_for_event → selected_for_coding → closed

These are independent — a "ready" problem might still be in "backlog"
because no event has selected it yet.

[Close]
```

### 32.4.3 Empty State Messages

When a section has no content, guide users rather than showing nothing.

| Section | Empty State Message |
|---------|---------------------|
| Problem list (new user) | "No problems yet. Problems are challenges you want to solve. [Create your first problem]" |
| Team chat (no messages) | "Be the first to post! Introduce yourself or share your approach." |
| Assessment results (none) | "Results appear after the assessment closes and participants have voted." |
| Lessons learned (none) | "No lessons yet. After working on a problem, capture what you learned." |

---

## 32.5 Personal History and Continuity

### 32.5.1 Welcome Back Messages

Returning users see context-aware greetings based on their history.

| Condition | Message |
|-----------|---------|
| Has upcoming registered event | "Welcome back! {Event Name} is in {N} days." |
| Last visited > 7 days, has active problem | "Welcome back! Your problem '{Title}' has new activity." |
| Participated in last event | "Welcome back! Want to add lessons learned from {Last Event}?" |
| No recent activity | "Welcome back! See what's new in the community." |

### 32.5.2 Personal Dashboard Section

A dedicated section showing the user's own activity:

```
Your Activity
─────────────
Problems: 3 submitted, 2 accepted, 1 in progress
Events: 5 attended, 2 upcoming
Teams: Member of 4 teams across 3 events
Points: 12 | Stars: ⭐⭐ (2)

Recent:
• Joined team for "API Rate Limiter" (2 days ago)
• Completed review assessment (5 days ago)
• Problem "CLI Parser" accepted (1 week ago)
```

### 32.5.3 Resume Where You Left Off

For in-progress actions, offer to resume:

```
You have a draft problem: "Database Migration Tool"
Last edited 3 days ago.

[Continue editing] [Start fresh]
```

---

## 32.6 Preference Management

### 32.6.1 User Preferences

User preferences are stored in the `users` table (see Chapter 19.3.1 for field definitions and constraints). Key preferences:

- **Contributor wall visibility**: Control public profile appearance
- **Newsletter subscription**: Manage communication preferences
- **First-time hints**: Toggle contextual onboarding guidance
- **Dashboard default**: Set preferred landing view

All preferences default to TRUE (opt-out model) except `default_dashboard_view` which defaults to 'upcoming_events'.

### 32.6.2 Notification Preferences (Future)

| Notification Type | Default | Description |
|-------------------|---------|-------------|
| Event reminders | ON | 24h before registered events |
| Problem feedback | ON | When moderator posts on your problem |
| Team activity | ON | When teammates post in chat |
| Mention alerts | ON | When @mentioned in chat |

### 32.6.3 Saved Filters (Future)

Users can save filter configurations for quick access:

- "My problems" — Problems I created
- "Cologne events" — Events in Cologne only
- "Greenfield problems" — Problem type filter

---

## 32.7 Relationship to Other Chapters

- **Chapter 12**: Dashboard views incorporate progressive disclosure
- **Chapter 13**: Problem Card UI includes inline help and empty states
- **Chapter 18**: Authentication provides user identity for personalization
- **Chapter 19**: `users` table stores preferences (`show_on_contributor_wall`, etc.)
- **Chapter 29**: Events display includes registration guidance
- **Chapter 30**: Registration flows feed into onboarding journey
- **Chapter 31**: Team chat includes first-time guidance
- **Chapter 33**: Milestone recognition builds on onboarding moments
