# 33. Participant Experience and Emotional Design

This chapter specifies how the platform creates **engagement through emotional resonance**, not just functional correctness. It covers milestone recognition, encouragement patterns, journey narratives, and the **contributor recognition system** with public visibility.

---

## 33.1 Design Philosophy

### Engagement Is Emotional, Not Just Functional

The platform's technical architecture is optimized for auditability and traceability. But participants don't need audit trails — they need to feel **guided, supported, and celebrated**.

**Core Principles:**

1. **Moments Matter**: Submissions, completions, team joins — these are milestones, not transactions
2. **Visibility as Reward**: Public recognition motivates continued contribution
3. **Encouragement Over Judgment**: Support hesitant participants rather than gatekeeping
4. **Momentum Is Visible**: Show community activity to create social proof
5. **Points for Effort, Stars for Excellence**: Distinguish quality content contribution from hacking mastery

### The Engagement Equation

```
Engagement = (Competence × Autonomy × Relatedness) + Recognition

Where:
- Competence: "I can do this" (clear paths, achievable goals)
- Autonomy: "I choose to do this" (not forced)
- Relatedness: "I belong here" (social connection)
- Recognition: "My contributions matter" (visibility)
```

---

## 33.2 Milestone Recognition System

### 33.2.1 First-Time Achievements

Acknowledge meaningful firsts with brief, warm confirmations.

| Milestone | Message | Visual |
|-----------|---------|--------|
| First problem submitted | "Your first problem is submitted! Moderators will review soon." | Success toast (3s auto-dismiss) |
| First assessment completed | "Thanks for your first rating! Your input shapes decisions." | Success toast (3s) |
| First team joined | "You're on the team! Check the chat to connect." | Success toast (3s) |
| First event attended | "Welcome to the community! Great to have you." | Success toast (3s) |
| First lesson learned added | "Insight captured! Others can learn from this." | Success toast (3s) |

**Update 2026-02-05**: Milestone achievements trigger toast notifications (Ch.26.11.12) instead of inline banners. Toasts auto-dismiss after 3 seconds while preserving celebratory moment. For major milestones (first problem accepted), toast persists with manual dismiss option.

### 33.2.2 Progress Acknowledgments

For ongoing engagement, provide periodic recognition.

| Threshold | Message |
|-----------|---------|
| 5 assessments completed | "You've rated 5 problems — your perspective matters." |
| 10 assessments completed | "10 ratings! You're becoming a trusted evaluator." |
| 3 problems submitted | "Your 3rd problem! You're shaping the community's challenges." |
| First problem accepted | "Your problem passed quality review — it's ready for pitching!" |
| Problem selected for coding | "Your problem was selected! Teams are working on it now." |

### 33.2.3 Team Formation Celebrations

When team composition changes, acknowledge it warmly.

| Event | System Message (in chat) | Format |
|-------|-------------------------|--------|
| User joins | "─── {timestamp} {User} joined ───" | WhatsApp-style |
| User retires | "─── {timestamp} {User} retired from team ───" | WhatsApp-style |
| User rejoins | "─── {timestamp} {User} rejoined the team ───" | WhatsApp-style |
| Team reaches 3 members | "Team is growing! 3 members now." | Subtle highlight |

---

## 33.3 Encouragement Patterns

### 33.3.1 Hesitation Support

When users hesitate (e.g., long time on draft, empty assessment), offer gentle encouragement.

| Situation | Encouragement |
|-----------|---------------|
| Draft saved but not submitted (> 7 days) | "Your draft is ready when you are. Even rough ideas are welcome." |
| Assessment started but not completed | "No need to rate every dimension — skip what you're unsure about." |
| Viewing problems but not registering | "Events are informal — join one and see what it's like." |
| On team but no chat activity | "Don't be shy! Say hi to your teammates." |

### 33.3.2 Rough Ideas Welcome

The platform should signal that perfection isn't required.

**Problem submission encouragement:**
```
Problems don't need to be perfect.

Submit your rough idea — moderators will help refine it.
Better to start messy than never start at all.
```

**Assessment encouragement:**
```
First impressions are valuable.

Don't overthink your ratings.
Your gut reaction is data we can learn from.
```

### 33.3.3 Failure Recovery

When things don't go as planned, reframe constructively.

| Situation | Reframe |
|-----------|---------|
| Problem rejected | "This version didn't pass review. Check the feedback and consider resubmitting." |
| Problem deferred | "Your problem was deferred — it's still in the backlog for future events." |
| Solution didn't get stars | "Not every solution wins stars. The learning matters most." |
| Low assessment scores | "Scores reveal areas to improve. Iterate and resubmit." |

---

## 33.4 Participant Journey Narratives

Functional walkthroughs of each role's experience, with emotional context as rationale.

### 33.4.1 Problem Owner Journey Map

**Phase 1: Ideation**
```
Start: User has a challenge they want help with

Steps:
1. Visit platform → See "Create Problem" CTA
2. Click create → Enter draft mode
3. Fill title, description → Auto-save active
4. Link repository → Even empty repos welcome

Emotional context: Vulnerability — putting an idea out for judgment.
Design response: Supportive empty states, field hints, "rough ideas welcome" messaging.
```

**Phase 2: Submission & Review**
```
Start: Draft is ready

Steps:
1. Run self-assessment (optional) → Spot gaps early
2. Submit → Status changes to "submitted"
3. Wait for review → Check chat for moderator feedback
4. Address feedback → Create new version if needed
5. Accepted → Status changes to "ready"

Emotional context: Anticipation, potential rejection anxiety.
Design response: Clear timeline, visible progress, constructive rejection messaging.
```

**Phase 3: Selection & Sprint**
```
Start: Problem is accepted

Steps:
1. Problem appears in event backlog
2. Moderator selects for event
3. Pitch phase → PO presents (or moderator summarizes)
4. Votes collected → Community weighs in
5. Selected for coding → Teams form
6. Sprint → Teams work on solutions

Emotional context: Pride when selected, investment in outcome.
Design response: Recognition when selected, team activity visibility.
```

**Phase 4: Review & Recognition**
```
Start: Sprint ends

Steps:
1. Review assessment opens
2. Participants rate solutions
3. Scores aggregated
4. Stars awarded (1st, 2nd, 3rd place)
5. Lessons learned captured

Emotional context: Validation or disappointment based on outcome.
Design response: Celebrate all participation, stars for excellence, points for effort.
```

---

### 33.4.2 Developer/Coder Journey Map

**Phase 1: Discovery**
```
Start: User registered for event

Steps:
1. Browse event problem list
2. Read problem cards → Evaluate interest
3. Attend event → See pitches live

Emotional context: Curiosity, evaluation mode.
Design response: Clear problem cards, complexity indicators, value statements.
```

**Phase 2: Team Formation**
```
Start: Pitch phase complete, coding selection made

Steps:
1. "Join as Dev" on selected problem
2. Introduced in team chat
3. Find/share breakout room URL
4. Coordinate approach with team

Emotional context: Belonging, starting energy.
Design response: Warm welcome, clear team presence.
```

**Phase 3: Sprint**
```
Start: Coding begins

Steps:
1. Work on solution (solo or pair)
2. Share progress in chat
3. Post repo URL
4. Ask questions / offer help
5. Time ends → Stop coding

Emotional context: Flow state, time pressure, camaraderie.
Design response: Countdown visibility, team chat activity, no interruptions.
```

**Phase 4: Review**
```
Start: Sprint ends

Steps:
1. Complete review assessment
2. View results (when available)
3. See star awards
4. Add lessons learned

Emotional context: Curiosity about ranking, satisfaction or learning.
Design response: Stars for excellence, points for participation, lessons as legacy.
```

---

### 33.4.3 Observer Journey Map

**Phase 1: Event Participation**
```
Start: User attends event but doesn't code

Steps:
1. Watch pitches
2. Complete pitch assessments
3. Observe coding (or leave during sprint)
4. Return for reviews

Emotional context: Interested spectator, evaluator role.
Design response: Assessment interface optimized for observers, skip-friendly.
```

**Phase 2: Post-Event Contribution**
```
Start: Event ends

Steps:
1. Complete post-event review assessments
2. Add valuable chat messages
3. Add lessons learned

Emotional context: Contribution without coding pressure.
Design response: Post-event reviews are valuable (weighted 1.5x), acknowledge contributions.
```

---

### 33.4.4 Moderator Journey Map

**Phase 1: Curation**
```
Start: Problems are submitted

Steps:
1. Review submitted problems
2. Leave feedback in chat
3. Record quality gate decisions
4. Select problems for upcoming event

Emotional context: Curatorial responsibility, quality judgment.
Design response: Decision support, clear criteria, team decision options.
```

**Phase 2: Live Orchestration**
```
Start: Event begins

Steps:
1. Open pitch phases (one at a time)
2. Manage discussion timing
3. Record selection decisions
4. Close pitch, open review

Emotional context: Performance pressure, time management.
Design response: Countdown timers, clear controls, auto-close for safety.
```

**Phase 3: Wrap-Up**
```
Start: Event ends

Steps:
1. Ensure reviews are open
2. Assign star awards (when scores available)
3. Highlight lessons learned
4. Prepare wrap-up for next event

Emotional context: Completion, satisfaction, handoff.
Design response: Summary dashboards, cross-location insights, wrap-up agent support (future).
```

---

## 33.5 Momentum Indicators

Show community activity to create social proof and engagement momentum.

### 33.5.1 Dashboard Metrics

```
This Week in VibeCoding
────────────────────────
📝 12 problems submitted
👥 45 participants across 3 events
⭐ 18 star awards given
💡 24 lessons learned captured
```

### 33.5.2 Event-Specific Activity

```
{Event Name} - Live Now
────────────────────────
🔴 Pitch phase: "API Rate Limiter"
👥 32 participants online
✋ 28 votes collected
⏱️ Closes in 3 minutes
```

### 33.5.3 Problem Activity Indicators

On problem cards, show recent activity:

```
Recent Activity
───────────────
• 3 new team members joined (today)
• 2 review assessments completed (yesterday)
• 1 lesson learned added (2 days ago)
```

---

## 33.6 Contributor Recognition and External Visibility

### 33.6.1 Design Philosophy

The contributor recognition system rewards two distinct types of contribution:

| Type | Measure | Reward |
|------|---------|--------|
| **Quality Content** | Time invested in assessments, reviews, problem refinement | **Points** |
| **Hacking Excellence** | Best solutions as judged by community | **Stars** |

**Privacy-First**: Users can opt out of public visibility while still tracking personal progress.

### 33.6.2 Public Contributor Wall

A prominent display on the landing page / dashboard showing top contributors.

**Display Specification:**
- Location: Landing page, below event list
- Title: "Top Contributors (Last 6 Weeks)"
- Shows: Top 10 contributors by points
- Per row: Display name, total points, total stars, contribution count

**Visual Layout:**
```
Top Contributors (Last 6 Weeks)
───────────────────────────────
1. Eva Schmidt         42 pts  ⭐⭐⭐    18 contributions
2. Max Mustermann      38 pts  ⭐⭐      15 contributions
3. Lisa Chen           35 pts  ⭐        22 contributions
4. Tom Weber           31 pts  ⭐⭐      12 contributions
5. Anna Müller         28 pts            19 contributions
...
```

**Sorting Logic:**
1. Primary: Total points (descending)
2. Tie-breaker: Contribution count (descending) — more contributions wins

### 33.6.3 Point Scoring Model

Points are awarded for quality content contributions. Weights are admin-configurable in the `contribution_action_catalog` (Chapter 19.3.32). Default: 1 point per action.

**Point-earning actions**:
- Review assessment completed
- Valuable contribution (chat/lesson with ≥2 👍 or 💡 reactions)
- Problem submitted, selected for pitch, or selected for coding

**Point Awarding Rules** (Chapter 19.3.35):
- Points awarded immediately upon qualifying action
- Points snapshot the `current_points` value at award time (immune to later weight changes)
- Duplicate prevention: same action can't award points twice (enforced by UNIQUE constraint on `user_id, action_key, source_type, source_id`)
- Event context: most points linked to specific events

**Trigger Mechanism:**
Points are awarded **reactively** as part of the same request that completes the qualifying action — never via periodic sweeps or background jobs.

| Action | Trigger Point | source_type | source_id |
|--------|--------------|-------------|-----------|
| `review_assessment_completed` | When user submits a review response batch | `response` | First `response_id` in the batch |
| `problem_submitted` | Inside `recordDecision('problem_submitted')` side-effects | `decision` | The `decision_id` |
| `problem_elected_pitch` | Inside `recordDecision('selected_for_event')` side-effects | `decision` | The `decision_id` |
| `problem_elected_coding` | Inside `recordDecision('selected_for_coding')` side-effects | `decision` | The `decision_id` |
| `valuable_contribution` | When a reaction is added and the message reaches ≥2 qualifying reactions (👍 or 💡) | `chat_message` or `lesson` | The `message_id` or `lesson_id` |

For `valuable_contribution`, the check runs on each reaction insert: count distinct qualifying reactions (👍, 💡) on the source entity; if count ≥ 2 and no existing `contribution_points` row exists for that source, award points. This ensures the point is awarded exactly once, at the moment the threshold is crossed.

Administrators can adjust weights via the admin interface (Chapter 17.9.3).

### 33.6.4 Star Awards (Hacking Excellence)

Stars recognize outstanding solutions, not just participation.

| Place | Stars Awarded |
|-------|---------------|
| 1st place | ⭐⭐⭐ (3 stars) |
| 2nd place | ⭐⭐ (2 stars) |
| 3rd place | ⭐ (1 star) |

**Determination Mechanism:**

1. **Based on aggregated review assessment scores** for the problem's solutions
2. **Human votes are ground truth** — primary authority
3. **Review weighting:**
   - Live reviews (during event): 1.0x weight
   - Post-event reviews: 1.5x weight (more time to verify)
   - Agent reviews: 0.5x weight (supporting, not authoritative)
4. **System evolves**: As agents improve, their assessments contribute more, but human judgment remains authoritative

**Star Award Scope — MVP vs. Future:**
- **MVP** (1 team per problem per event): Star awards rank the **best coded solutions across all problems at an event**. The moderator views all coded problems with their weighted review scores and assigns 1st/2nd/3rd to the top-performing problem-solutions. All team members of a winning problem receive the same award and place.
- **Future** (multi-team per problem): When multiple teams can work on the same problem, rankings become **per-problem** — the best solution to a single problem earns 1st place, the second-best 2nd, etc. The data model (`star_awards` with `problem_id` + `event_id` scoping) already supports this.

**Score Aggregation Formula:**
For each problem coded at an event, the weighted review score is:

```
weighted_score(problem, event) =
    Σ(rating_value × weight_multiplier) / Σ(weight_multiplier)

    over all non-NULL rating_value responses r where:
    - r belongs to a review assessment for that problem at that event
    - r.review_weight_key IS NOT NULL
    - r.superseded_at IS NULL (only current responses)
```

Items are weighted equally within an assessment. The formula produces a single scalar per problem per event, used for ranking. Ties are resolved by moderator judgment (Chapter 17.9.2).

**Star Award Process:**
1. Review assessment closes (binding decision `closed_for_review`)
2. Scores aggregated with weights applied per formula above
3. Top 3 solutions ranked across all coded problems at the event (MVP) or within a problem (future)
4. Moderator confirms/adjusts awards (Chapter 17.9.2)
5. Awards recorded in `star_awards` table — all team members receive the same place
6. Stars visible on contributor profiles and personal dashboard

### 33.6.5 Privacy and Opt-Out

**Privacy-First Design:**

| Setting | Default | Effect |
|---------|---------|--------|
| `show_on_contributor_wall` | TRUE | Appear on public contributor wall |

**Opt-Out Behavior:**
- Opted-out users excluded from public wall
- Points and stars still tracked internally
- Personal dashboard shows own progress
- Opt-out available in Account Settings
- Opt-out respected from system inception (GDPR-aligned)

### 33.6.6 Admin Configuration

Administrators can adjust the recognition system:

| Configuration | Access |
|---------------|--------|
| Point weights per action | Admin only |
| Star awards per problem | Moderator (confirmed by admin) |
| Enable/disable action types | Admin only |
| Review weight multipliers | Admin only |

### 33.6.7 Personal Contribution Dashboard

All users see their own contribution history regardless of opt-out status:

```
Your Contributions
──────────────────
Points: 24 (all time) | 12 (last 6 weeks)
Stars: ⭐⭐⭐⭐⭐ (5 total)

Breakdown:
• Review assessments: 8 pts
• Valuable contributions: 4 pts
• Problems submitted: 3 pts
• Problems pitched: 2 pts
• Problems coded: 3 pts

Recent Awards:
• ⭐⭐⭐ 1st place: "API Rate Limiter" (Feb 2026)
• ⭐ 3rd place: "CLI Parser" (Jan 2026)
```

---

## 33.7 Relationship to Other Chapters

- **Chapter 12**: Dashboard displays contributor wall and momentum indicators
- **Chapter 13**: Problem Card UI includes activity indicators
- **Chapter 14**: Live interaction modes trigger milestone messages
- **Chapter 17**: Moderator Dashboard includes star award UI
- **Chapter 19**: Data model for `contribution_points`, `star_awards`, `review_weight_catalog`
- **Chapter 29**: Events context for contribution tracking
- **Chapter 31**: Chat reactions (👍, 💡) trigger valuable contribution points
- **Chapter 32**: Onboarding flows lead to milestone recognition
