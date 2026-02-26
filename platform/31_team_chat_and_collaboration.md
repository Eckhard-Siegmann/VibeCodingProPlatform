# 31. Team Chat and Collaboration

This chapter specifies the **team chat system**. Chat provides real-time collaboration, team formation, and persistent discussion around problems.

---

## 31.1 Overview

The team chat system provides:

- **Real-time messaging** during events (3s polling) and between events (10s polling)
- **Team formation** via "Challenge accepted" on Problem Cards
- **Rich message metadata** for filtering and analysis
- **Threaded discussions** with replies
- **@mentions** for notifications
- **Emoji reactions**
- **Clear bot differentiation** for system and AI messages

---

## 31.2 Chat as Filtered View

### Core Principle

Chat is a **filtered view** over atomic messages stored in `chat_messages`. There is one unified message store; different "chats" are SELECT queries with filters.

### Filter Dimensions

| Dimension | Example Filter |
|-----------|---------------|
| Problem | `WHERE problem_id = ?` |
| Event | `WHERE event_id = ?` |
| Team | `WHERE team_id = ?` |
| User | `WHERE user_id = ?` |
| Role | `WHERE role = 'moderator'` |
| Contains URL | `WHERE url_disclosed = TRUE` |
| Valuable | `WHERE valuable_insight = TRUE OR valuable_link = TRUE` |

### Common Views

| View | Filters |
|------|---------|
| Problem Discussion | `problem_id = X` |
| Team Chat | `team_id = X` |
| Event Chat | `event_id = X AND problem_id IS NULL` |
| Location Community | `problem_id IS NULL AND event_id IN (events at location L)` |
| Moderator Posts Only | `problem_id = X AND role = 'moderator'` |
| PO Posts Only | `problem_id = X AND role = 'problem_owner'` |
| Posts with URLs | `problem_id = X AND url_disclosed = TRUE` |

---

## 31.3 Message Structure

### Atomic Message

Each chat message is an atomic unit with rich metadata:

| Field | Type | Description |
|-------|------|-------------|
| `message_id` | UUID | Unique identifier |
| `user_id` | UUID | Author |
| `problem_id` | UUID? | Associated problem (nullable) |
| `problem_version_id` | UUID? | Version context for display |
| `major_version` | INTEGER? | Nullable — NULL for event-wide messages (no problem); set for problem-scoped messages |
| `minor_version` | INTEGER? | Nullable - Minor version from repo snapshot (GitHub may be unavailable per Ch.25) |
| `event_id` | UUID? | Associated event (nullable) |
| `team_id` | UUID? | Associated team (nullable) |
| `context_situation` | Enum | pre_discussion, pitch_discussion, while_building, while_reviewing, event_announcement |
| `content` | Text | Message content (**max 2000 characters**) |
| `reply_to_message_id` | UUID? | Parent message for threading |
| `url_disclosed` | Boolean | Message contains URL (auto-detected) |
| `valuable_insight` | Boolean | Flagged as valuable insight |
| `valuable_link` | Boolean | Flagged as valuable link |
| `is_bot` | Boolean | System notification or AI message |
| `author_role` | TEXT | Cached author role at message creation (for display without JOIN) |
| `visible` | Boolean | FALSE = soft deleted |
| `created_at` | Timestamp | Creation time |
| `edited_at` | Timestamp? | Last edit time |

### Version Tracking Rationale

For problem-scoped messages, `major_version` and `minor_version` are stored directly for efficient filtering and version-scoped display. For event-wide messages (`problem_id IS NULL`), both version fields are NULL. See Chapter 19.3.25 for the complete rationale on direct version storage.

### Content Limits

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max length | 2000 characters | Encourages concise communication |
| Min length | 1 character | Prevents empty messages |
| Attachments | Not supported | Use external links instead (see 31.14) |

### URL Detection

URLs are automatically detected using a simple regex pattern:
```
https?://[^\s<>"{}|\\^\[\]`]+
```

Detection is context-independent (applies even in code blocks).

### Context Situations

| Situation | When Used |
|-----------|-----------|
| `pre_discussion` | Before event, general discussion |
| `pitch_discussion` | During pitch phase |
| `while_building` | During coding sprint |
| `while_reviewing` | During review phase |
| `event_announcement` | Event-wide messages not tied to a problem (§31.16) |

The first four contexts are problem-centric (used when `problem_id` is set). `event_announcement` is used for event-wide messages where `problem_id IS NULL`. Context is set based on current event phase when message is posted.

---

## 31.4 Message Features

### 31.4.1 Message Bubble Layout

**Updated 2026-02-05**: Chat uses bubble-based interface similar to messaging apps (WhatsApp, iMessage) for familiarity and clarity (Decision #19 from template session). See Chapter 26.15 for complete UI specification.

**Own Messages** (current user):
- Alignment: Right side of container
- Background: `--color-chat-own` (#E3F2FD, light blue)
- Border radius: `12px 12px 0 12px` (square corner bottom-right)
- Max width: 75% of container
- No avatar displayed (right-alignment indicates ownership)

**Other Users' Messages**:
- Alignment: Left side of container
- Background: `--color-card` (#FEFEFE, white)
- Border radius: `12px 12px 12px 0` (square corner bottom-left)
- Border: 1px solid `--color-secondary`
- Max width: 75% of container
- Avatar: InitialAvatar (32px) before bubble

**Moderator Messages**:
- Alignment: Left (like other users)
- Background: `--color-chat-moderator` (#E8F4FD, lighter blue)
- Border: 1px solid `--color-primary/30`
- "Moderator" badge above or with name

**System Messages** (bot, join/retire notifications):
- Alignment: Center
- Background: `--color-canvas` (#F1F2F8, grey)
- Text: Italic, subtle color
- Format: "─── {timestamp} {User} joined the team ───"

**Message Grouping**: Consecutive messages from same user within 2 minutes grouped together - avatar + name shown only on first message in group, subsequent messages show bubble only (4px gap).

### Posting

- Authenticated users can post messages
- Messages associated with current problem/event/team context
- URL detection sets `url_disclosed` automatically
- Messages render in bubble layout per 31.4.1

### Editing

| Rule | Specification |
|------|---------------|
| Who | Author only |
| When | Within 15 minutes of creation |
| Effect | Creates new message version, sets `edited_at`, preserves original |
| History | Full edit history preserved for audit |

**Note**: To maintain the immutability principle (Ch.01), message edits could be implemented as soft-versioning (storing edit history in a separate `chat_message_edits` table) or by prohibiting edits entirely. Current specification requires preservation of original content for traceability.

### Deletion (Soft)

| Rule | Specification |
|------|---------------|
| Who | Author or Moderator |
| Effect | Sets `visible = FALSE` |
| Display | "Message deleted" placeholder |
| Data | Message retained for audit |
| Decision Log | Deletion should create a decision entry for traceability (see Ch.10) |

### Threading

- Any message can be a reply to another
- `reply_to_message_id` references parent
- UI shows replies **collapsed** when users create threads
- Thread depth unlimited (but UI may limit display to 2-3 levels)
- Collapsed threads show: `▶ 3 replies` with expand option

### @Mentions

- Syntax: `@username` in message content
- System creates entry in `chat_mentions`
- Mentioned user receives notification
- Mentions are clickable (navigate to user profile)
- **No autocomplete**: Users type the full `@username` manually (simplifies MVP)

### Emoji Reactions

- Users can react to messages with emoji from a **curated set of 10 emojis**
- Multiple users can react with same emoji (shows count)
- User can add multiple different reactions
- Reactions stored in `chat_reactions` with FK to `emoji_catalog`
- **Important**: Users can inspect who reacted with each emoji (tooltip shows user list)

#### Curated Emoji Set

| Emoji | Display Name | Meaning |
|-------|--------------|---------|
| 👍 | Thumbs Up | Agree / Good |
| 👎 | Thumbs Down | Disagree / Concern |
| ❤️ | Heart | Love / Great |
| 🎉 | Celebrate | Celebrate / Success |
| 🤔 | Thinking | Thinking / Question |
| 👀 | Eyes | Looking / Interested |
| 🔥 | Fire | Hot / Impressive |
| ✅ | Check | Done / Confirmed |
| 💡 | Idea | Idea / Insight |
| 🙏 | Thanks | Thanks / Please |

**Rationale**: Limited set keeps UI clean and ensures reactions have shared meaning across users.

---

## 31.5 Bot Messages

### Types of Bot Messages

| Type | Source | `is_bot` |
|------|--------|----------|
| System Notification | Platform events | TRUE |
| AI Assistant | Integrated AI agents | TRUE |
| External Integration | GitHub webhooks, etc. | TRUE |
| Human User | Regular users | FALSE |

**Note**: "Bots" and "agents" refer to the same entity. AI assistants are stored in the `users` table with `role = 'agent'` (Chapter 18.8). The `is_bot = TRUE` flag in `chat_messages` identifies all messages from these agents. Agents authenticate via API tokens and create only non-binding decisions.

### System Notifications

Automatic messages for:
- "Max joined the team"
- "Pitch phase started"
- "Review assessment opened"
- "Eva submitted a solution"

### AI Assistant Messages

AI agents can:
- Provide code analysis
- Suggest solutions
- Answer questions
- Summarize discussions

All AI messages clearly marked with `is_bot = TRUE`.

### Bot Naming Convention

Bots post with a **function-title format**:
- `repo-validator (bot)`
- `quality-gate-precheck (bot)`
- `guardrailing (bot)`

The bot's `display_name` in the `users` table is the function title; the "(bot)" suffix is added at render time based on `is_bot = TRUE`.

### Visual Differentiation

Bot messages are rendered distinctly:

| Property | Bot Message | Human Message |
|----------|-------------|---------------|
| Background | Subtle gray/different color | Standard |
| Icon | Bot icon | User avatar |
| Label | "Bot" or "System" badge | None |
| Styling | Slightly different font/border | Standard |

**Requirement**: Users must be able to instantly distinguish bot messages from human messages.

---

## 31.6 Moderator Styling

### Distinct Appearance

Moderator messages have **different visual styling**:

| Property | Moderator | Regular User |
|----------|-----------|--------------|
| Background color | Highlighted (e.g., light blue) | Standard |
| Badge | "Moderator" badge | None |
| Name color | Distinct color | Standard |

### Moderator Powers

Moderators can:
- Delete any message (soft delete)
- Pin messages (future feature)
- Post announcements

---

## 31.7 Team Formation

### Philosophy

Team formation is **informal and PO-driven**. There are no rigid rules. The platform supports whatever the Problem Owner and participants decide.

**"Everything Goes":**
- Presence-only teams: All members in the room
- Remote-only teams: All members online
- Hybrid teams: Mix of presence and remote (experimental)

**Note**: Early experience suggests presence-only and remote-only work better than hybrid. However, we continue experimenting with auxiliary tools that might make hybrid a positive experience for everyone.

### "Join as Dev" Flow

When a user clicks "Join as Dev" on a Problem Card:

1. System checks if team exists for this problem + event
2. If no team: Create team, add PO automatically
3. Add user to team with `member_role = 'coder'`, `status = 'active'`
4. User joins team chat
5. System posts: "─── {timestamp} {User} joined the team ───"

**Moderator Role Conversion:**
If a moderator clicks "Join as Dev":
- Added as coder, **not** as moderator for this problem
- Loses moderator authority FOR THIS PROBLEM ONLY (no binding decisions)
- Retains global moderator role for all other problems
- Preserves objectivity: can't moderate a problem you're coding

### Problem-Local Role Override

The role system uses a **local-first resolution**:

```
1. Check problem_team_members for user + problem
2. If found with member_role = 'coder':
   → Treat as 'developer' (no moderator powers for this problem)
3. Else:
   → Use users.role (base role)
```

**No separate override table needed**: Team membership IS the override.

| Scenario | Base Role | Team Member? | Effective Role |
|----------|-----------|--------------|----------------|
| Moderator views problem | moderator | No | moderator |
| Moderator joins as dev | moderator | Yes (coder) | developer |
| PO on their problem | problem_owner | Yes (po) | problem_owner |
| Observer views problem | observer | No | observer |

### Version-Scoped Membership

Team membership is tied to a **major version** of the problem.

**When PO Creates New Major Version:**
1. PO triggers "Create New Version" action
2. System creates new `problem_versions` record (e.g., v2.00)
3. System posts: "─── PO created version 2.00, offboarding all coders ───"
4. All coders are **not** automatically added to new version (clean slate)
5. PO (and deputy, if assigned) automatically added to new version
6. Previous version's memberships remain in database (historical record)
7. Chat history preserved across versions

This prepares problems for follow-up events with fresh teams while preserving historical context.

### Team Membership

| Field | Description |
|-------|-------------|
| `team_id` | Team identifier |
| `user_id` | Team member |
| `problem_version_id` | Version scope for membership |
| `member_role` | po, po_deputy, coder |
| `status` | active, retired |
| `joined_at` | When joined |
| `retired_at` | When retired (NULL if never) |
| `rejoined_at` | When rejoined (NULL if never) |
| `solution_repo_url` | Member's solution repo (optional) |

### Membership State Machine

```
[Not a member] → Join → [active coder]
[active coder] → Retire → [retired coder]
[retired coder] → Rejoin → [active coder]
```

### Off-boarding (Retire)

When coder clicks "Retire from Team":
1. `status` → 'retired'
2. `retired_at` → now()
3. System posts: "─── {timestamp} {User} retired from team ───"
4. User can still post in chat (shown as "{User} (retired)")
5. Breakout room URL remains visible

### Re-onboarding (Rejoin)

When retired coder clicks "Rejoin Team":
1. `status` → 'active'
2. `rejoined_at` → now()
3. System posts: "─── {timestamp} {User} rejoined the team ───"

### Chat Display Rules

Message author display is determined at render time based on **current** membership status. See Chapter 19.3.23 for the complete chat display role conventions table.

### WhatsApp-style System Messages

Team activity generates system messages (`is_bot = TRUE`):

**Timestamp format**: `DD.MM.YYYY HH:MM` (European format with full date)

```
─── 30.01.2026 14:32 Eva joined ───
─── 30.01.2026 15:45 Tim joined ───
─── 30.01.2026 16:20 Eva retired from team ───
─── 30.01.2026 17:05 Eva rejoined the team ───
─── 30.01.2026 17:00 Problem opened for coding ───
─── 30.01.2026 19:30 Problem closed for coding ───
─── 30.01.2026 18:00 PO created version 2.00 ───
```

**Rationale**: Full date ensures messages remain meaningful in persistent chat history across multiple sessions.

### Team Chat

Team members see:
- All messages with `team_id = X`
- Available to team members and non-members (but context shows role)
- Persists after event and across versions

### Breakout Room URL

Teams have an optional `breakout_room_url`:
- Google Meet, Zoom, BBB, or other video call link
- Teams self-organize their video calls using external tools
- **Storage**: On team entity, NOT in chat stream
- **Visibility**: Prominently displayed in team section, visible to anyone (including late-joiners after team dissolves)
- **Who can set**: PO, PO deputy, moderator, or any team member
- **Why not chat**: Late-comers can find the address without scrolling through chat history

---

## 31.8 Problem Card Chat Display

### Location

Chat is displayed at the **bottom of the Problem Card**, below problem details.

### Dimensions

| Property | Value | Rationale |
|----------|-------|-----------|
| Max height | **4000px** | Tall section accommodating ~50 messages typically seen in hackathon sessions |
| Scrollable | Yes | User scrolls within the section |
| Default scroll | Bottom (tail) | Shows most recent messages by default |
| Load strategy | All messages | Sessions are time-limited; typically <50 messages per problem |

### Version Filter (Default Behavior)

**Default**: Show only messages from the **current major version**.

The version filter is located at the top of the chat section:

| Filter Option | Behavior |
|---------------|----------|
| Current version (default) | `WHERE major_version = {current}` |
| All versions | No version filter |
| Specific version | `WHERE major_version = {selected}` |

**Rationale**: New team members joining v2.00 see fresh discussion by default, but can access historical context from v1.00 if needed.

### Version Filter vs History View

These are **two independent features**:

| Feature | Location | Purpose |
|---------|----------|---------|
| **Chat version filter** | Chat section top | Filter chat messages by version |
| **Problem Card history dropdown** | Problem Card header | View old problem description (read-only) |

When viewing history (old version via header dropdown):
- Problem card shows historical content
- Chat section can still be filtered independently
- **Contribution is blocked** (see 31.8.1)

### 31.8.1 History View Mode

When user selects an old version from the Problem Card header dropdown:

1. Problem Card displays **historical content** (title, description, tasks as they were)
2. **Red warning banner** appears at top:
   ```
   ⚠️ History View - Contribution is blocked. [Revert to current version]
   ```
3. Chat input is **disabled**
4. "Join as Dev" button is **hidden**
5. All contribution actions are blocked

**Rationale**: History view is for reference only; prevents accidental posts to old context.

### Default View

Shows recent messages for this problem, with filters:

```
[Filter: v3 ▼] [All] [Moderator] [PO] [Has URL]
─────────────────────────────────────────
Max: Has anyone looked at the test suite?
  └─ Eva: Yes, coverage is at 80%
Bot: Pitch phase started
Moderator: Let's focus on the core algorithm first
Max: @Eva can you share your repo link?
Eva: https://github.com/eva/solution
─────────────────────────────────────────
[Type a message...]                [Send]
```

### Filter Buttons

Quick filters available:
- **Version dropdown**: Filter by major version (default: current)
- **All**: Show all messages
- **Moderator**: Only moderator posts
- **PO**: Only problem owner posts
- **Has URL**: Only messages with URLs
- **Team**: Only team chat (if member)

---

## 31.9 Polling and Real-Time Updates

### Polling Strategy

| Context | Poll Interval |
|---------|---------------|
| Active event (event in progress) | **3 seconds** |
| No active event | **10 seconds** |
| User idle (tab not visible) | **30 seconds** or pause |

### Determining Active Event

Event is "active" when:
- Current time between `starts_at` and `planned_ends_at`
- OR `event_live_context.current_mode != 'idle'`

### Optimistic Updates

- User's own messages appear immediately
- Confirmation on server response
- Error handling via frontend queue (database write must not fail)

### Message Queue Resilience

- Frontend queues messages locally before sending
- Retry on transient failures
- Database write is **critical infrastructure** - connection must be reliable
- Show pending state in UI until confirmed

---

## 31.10 Access Control

### Authentication Required

**No anonymous access**: Only onboarded users with password have access to the platform.

| User Type | Can View Chat | Can Post | Rationale |
|-----------|---------------|----------|-----------|
| Anonymous | No | No | Must register per Ch.30 |
| Authenticated (any role) | Yes | Yes | All registered users can participate |
| Non-team-member | Yes | Yes (as guest) | Transparency; messages show "(guest)" suffix |
| Team member | Yes | Yes | Full participation |

### Visibility Rules

- **Problem chat**: Visible to all authenticated users
- **Team chat**: Visible to all authenticated users (not restricted to members)
- **Context shows role**: Non-members see content but are displayed as "(guest)" or "(moderator)"

**Rationale**: Transparency over restriction. Anyone can observe; participation context is clear from display.

---

## 31.11 Active/Inactive State Indicator

### Problem Card States

The Problem Card has **two display states**:

| State | Visual Indicator | Enabled Actions |
|-------|------------------|-----------------|
| **Inactive** | Gray static indicator | View only, can post as observer |
| **Active** | Green toggle animation | "Join as Dev" button enabled |

### Active Determination

```
ACTIVE = (problem.current_action_state = 'selected_for_coding')
         AND (now() BETWEEN event.starts_at AND event.planned_ends_at)
```

### Visual Design

**Airport timetable style**: Two green signal lamps toggle:
- Left green ON / Right green OFF → alternates with
- Left green OFF / Right green ON

Creates visual "activity" indicator showing the problem is live.

### Lifecycle Messages

When state changes, system posts:
```
─── 30.01.2026 17:00 Problem opened for coding ───
─── 30.01.2026 19:30 Problem closed for coding ───
```

### Post-Event Behavior

When the hacking session is closed:
1. Status turns to **Inactive**
2. Onboarded participants may drop from team
3. Others can write review messages as observers
4. Chat continues to function (as discussion log)

---

## 31.12 Valuable Content Flags

### Purpose

Allow users to flag valuable messages for later reference.

### Flags

| Flag | Meaning |
|------|---------|
| `valuable_insight` | Contains an important insight or learning |
| `valuable_link` | Contains a particularly useful link |

### Setting Flags

- Author can flag own messages
- Moderators can flag any message
- Toggle on/off

### Filtering

Filter view to show only valuable content:
```sql
WHERE valuable_insight = TRUE OR valuable_link = TRUE
```

---

## 31.13 Community Guidelines

### Displayed During Onboarding

New users see community guidelines:

1. **Positivism**: Constructive feedback, celebrate successes
2. **Stay on Topic**: Keep discussions relevant to problems
3. **Bot Transparency**: AI/bot messages are clearly marked
4. **Respect**: Professional, inclusive communication
5. **No Spam**: No promotional content

### Enforcement

Moderators can:
- Delete inappropriate messages
- Warn users (via direct message)
- (Future) Temporary mute

---

## 31.14 No Attachments

### Design Decision

**The chat system does not support file attachments.**

Rationale:
- Keeps system lean (limited server storage)
- Links are sufficient for sharing
- Code goes in repositories, not chat
- Images can be hosted externally and linked

### Alternative

Users share links to:
- GitHub gists
- Google Docs
- Imgur (images)
- External file hosts

---

## 31.15 Social Presence Indicators

During live events and ongoing collaboration, users benefit from knowing "who's here right now." Social presence creates momentum and reduces isolation.

### 31.15.1 Team Online Status

Display the number of team members currently viewing the problem:

```
Team (3 of 5 online)
────────────────────
● Eva Schmidt (PO)        — online
● Max Mustermann         — online
○ Lisa Chen              — last seen 2h ago
● Tom Weber              — online
○ Anna Müller            — last seen 1d ago
```

**Online Definition:**
- User has an active browser tab with this problem open
- Last heartbeat within 30 seconds

**Presence Tracking:**
- Client sends heartbeat every 15 seconds when tab is visible
- Server maintains `last_seen_at` per user per problem
- Online status derived: `last_seen_at >= NOW() - 30 seconds`

### 31.15.2 "Currently Viewing" Indicator

On the Problem Card, show who else is viewing:

```
👁️ 3 others viewing: Eva, Max, Tom
```

**Display Rules:**
- Show first 3 names, then "+ N more"
- Exclude current user from count
- Update via polling (3s during events, 10s otherwise)

### 31.15.3 Last Active Timestamps

For team members and chat participants, show recency:

| Recency | Display |
|---------|---------|
| < 1 minute | "just now" |
| 1-59 minutes | "{N}m ago" |
| 1-23 hours | "{N}h ago" |
| 1-7 days | "{N}d ago" |
| > 7 days | "inactive" |

### 31.15.4 Typing Indicators (Future Direction)

Show when team members are composing messages:

```
Eva is typing...
```

**Implementation Notes** (for future):
- Client sends "typing" signal when user starts typing
- Signal expires after 3 seconds of no keystrokes
- Display at bottom of chat area
- Multiple typers: "Eva and Max are typing..."

**Note**: Not MVP scope due to additional real-time infrastructure requirements.

### 31.15.5 Presence Data Model

**Lightweight ephemeral tracking.** Presence is tracked via application-layer cache only (no database persistence):

1. **Heartbeat mechanism**: Client sends heartbeat every 15 seconds with `user_id` and `problem_id`
2. **Problem viewing context**: In-memory or Redis cache mapping `problem_id → [user_presence_records]`
3. **Derived online status**: Users with heartbeat within last 30 seconds are "online"

**Cache Structure (application layer):**
```
presence:{problem_id} = {
  users: [
    { user_id: "...", display_name: "Eva", last_seen: "2026-02-03T18:30:00Z" }
  ]
}
TTL: 60 seconds
```

**Note**: The deprecated `sessions` table has been removed (Ch.19.3.2). Presence tracking is ephemeral and not persisted to the database, which aligns with the privacy principle that historical presence is not audited.

### 31.15.6 Privacy Considerations

- Presence is visible only to authenticated users
- No opt-out for presence (minimal privacy impact)
- Presence data not stored persistently (ephemeral)
- Historical presence not tracked (no audit of "who was online when")

---

## 31.16 Event-Wide Chat Channel

This section specifies the **event-wide chat channel** — a problem-detached discussion space where moderator announcements, system phase transitions, and community sharing are captured per event. It replaces the previously underspecified "Announce" action (Ch.14.5.5) and gives concrete behavior to the event-wide filter defined in §31.2.

### 31.16.1 Purpose

Each event has a dedicated chat channel that is **not attached to any specific problem**. It serves as:

- **Announcement channel**: Moderator announcements during live events (user story M17)
- **Event activity log**: System-generated messages echoing phase transitions (pitch opened, review closed, etc.)
- **Community sharing space**: Participants share links, insights, and general discussion relevant to the event or community

All authenticated users registered for the event (or moderators with global scope) can post. This follows the "Pros for Pros" philosophy — no gatekeeper controls who can contribute.

All message features from §31.4 apply: threading, reactions, @mentions, editing (within 15 min), soft deletion.

### 31.16.2 Message Routing

Event-wide messages use the following `chat_messages` column values:

| Column | Value |
|--------|-------|
| `problem_id` | `NULL` |
| `problem_version_id` | `NULL` |
| `major_version` | `NULL` |
| `minor_version` | `NULL` |
| `event_id` | Current event UUID |
| `team_id` | `NULL` |
| `context_situation` | `event_announcement` |

Human-authored messages have `is_bot = FALSE`. System phase echoes have `is_bot = TRUE`.

### 31.16.3 System Phase Echoes

When live decisions fire, the system posts a bot message to the event-wide chat **in addition to** any existing problem-specific messages (§31.7, §31.11). This creates a unified activity log in one place.

| Decision | Event-wide echo message |
|----------|------------------------|
| `opened_for_pitch_assessment` | `─── {ts} Pitch opened: "{Problem Title}" ───` |
| `closed_for_pitch_assessment` | `─── {ts} Pitch closed: {N} votes collected ───` |
| `selected_for_coding` | `─── {ts} "{Problem Title}" selected for coding ───` |
| `deselected_for_coding` | `─── {ts} "{Problem Title}" deselected from coding ───` |
| `opened_for_review` | `─── {ts} Review opened: "{Problem Title}" ───` |
| `closed_for_review` | `─── {ts} Review closed ───` |

Timestamp format follows §31.7: `DD.MM.YYYY HH:MM` (European format with full date).

**Rationale**: Problem-specific chat shows transitions relevant to that team. The event-wide channel shows the full event narrative — all phase transitions interleaved with announcements and community messages — so any participant can see what happened at a glance.

### 31.16.4 Location Community Timeline

The event-wide channel extends beyond a single event. Messages accumulate across events at the same location, forming a **persistent community timeline per city**.

**Behavior**:
- Aggregates event-wide messages from all events at the same location
- Ordered chronologically, newest first
- Event boundaries rendered as visual separators:
  ```
  ═══ VibeCoding Cologne March 2026 ═══
  Moderator: Welcome back! Tonight we have 4 problems.
  ─── 15.03.2026 18:15 Pitch opened: "API Rate Limiter" ───
  Eva: Has anyone tried the new Claude tool for this?
  ...
  ═══ VibeCoding Cologne February 2026 ═══
  Moderator: Great turnout tonight — 32 participants!
  ...
  ```
- **Cologne sees Cologne**, Aachen sees Aachen — no cross-location mixing in the timeline
- Location derived via `events → rooms → locations` (see Ch.19.3.25 for query pattern)
- Valuable links and insights flagged in previous events remain discoverable

**UI**: This is a filter within the Event Chat tab (see §31.16.5), not a separate page: `[This Event ▼]` / `[All {City} Events]`.

### 31.16.5 UI Surface

**Event Dashboard (Ch.12.4)** — The chat panel gains two tabs:

| Tab | Content | Default when |
|-----|---------|-------------|
| **Event Chat** | Event-wide messages (`problem_id IS NULL`) — announcements, phase echoes, community links | During live events |
| **Problem Activity** | Most recent 10 messages across all problems for this event (existing behavior) | Pre/post-event |

Within the Event Chat tab, a location filter provides timeline scope:

| Filter | Query |
|--------|-------|
| This Event (default) | `event_id = X AND problem_id IS NULL` |
| All {City} Events | `problem_id IS NULL AND event_id IN (events at location)` |

**Moderator Dashboard (Ch.12.5)** — The "Announce" quick action (Ch.14.5.5) posts a message directly into the event-wide chat. The moderator types a message and submits; it appears in the Event Chat tab with moderator styling (§31.6).

**Quick post input**: Below the event chat message list, all authenticated participants see a message input field identical to the problem chat input. No special privileges required to post.

### 31.16.6 Access Control

| User Type | Can View | Can Post | Notes |
|-----------|----------|----------|-------|
| Anonymous | No | No | Must register per Ch.30 |
| Authenticated (registered for event) | Yes | Yes | Full participation |
| Authenticated (not registered) | Yes | No | Can read but not contribute |
| Moderator/Admin | Yes | Yes | Global scope; can post in any event's chat |

Moderators can soft-delete any message (same as problem chat per §31.4). Moderator messages rendered with distinct styling (§31.6).

---

## 31.17 Future Directions

The following ideas are captured for future implementation (not MVP scope):

### 31.17.1 Collapsed Version Messages

Alternative to version filter - show old messages as collapsed groups:

```
+12 messages v1
+8 messages v2
─── PO created v3 ───
Kevin (moderator): please restructure your tickets by priority.
```

**Benefit**: Quick visual summary of discussion history without full filtering.

### 31.17.2 History View - Full Problem Card Snapshot

When viewing old version via header dropdown:
- Show problem title/description **as it was** at that version
- Show chat messages **up to** that version only
- "Greenfield phase" snapshot for v1.00

**Benefit**: Time-travel to see exactly what the problem looked like when work started.

### 31.17.3 Lessons Learned Source Tracking

Link `lessons_learned` entries back to chat messages that sparked them:

```sql
ALTER TABLE lessons_learned ADD COLUMN source_message_id TEXT REFERENCES chat_messages(message_id);
```

**Benefit**: Traceability from insights to original discussion.

### 31.17.4 Team Creation Version Tracking

Track which version a team was created for:

```sql
ALTER TABLE problem_teams ADD COLUMN created_for_problem_version_id TEXT REFERENCES problem_versions(problem_version_id);
```

**Benefit**: Audit trail showing team formation context.

### 31.17.5 Cross-Location Valuable Lessons Agent

Agent that surfaces lessons flagged as `valuable=1` from other locations for moderator wrap-up.

**Benefit**: Knowledge sharing across event locations.

### 31.17.6 Rate Limiting and Archive Policy

Currently not implemented due to limited scale (2x/month, ~50 messages/problem):
- No rate limiting on posting
- No archive policy (keep all messages)
- Max 8 concurrent viewers expected

**Review when**: Usage patterns indicate need for these controls.

---

## 31.18 Relationship to Other Chapters

- **Chapter 4**: Problem Cards display chat
- **Chapter 12**: Event Dashboard chat panel with Event Chat and Problem Activity tabs
- **Chapter 13**: Problem Card UI with chat section
- **Chapter 14**: Live interaction modes — phase transitions echo into event-wide chat (§31.16.3)
- **Chapter 16**: E-mail communication
- **Chapter 18**: Authentication required for chat
- **Chapter 19**: Data model for chat tables (`chat_messages`, `chat_context_catalog`)
- **Chapter 29**: Events context for messages; location derivation for community timeline
- **Chapter 30**: Registration required for chat
- **Chapter 32**: First-time chat guidance in onboarding
- **Chapter 33**: Chat reactions (👍, 💡) trigger contributor points
