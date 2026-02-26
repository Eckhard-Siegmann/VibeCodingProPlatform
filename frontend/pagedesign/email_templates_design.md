# Email Templates Management Design

**Route**: `/dashboard/moderator/emails/[eventId]`
**Purpose**: View template version history (M31) and customize event email content (M30)
**User Stories**: M30 (Customize Event Reminder Content), M31 (View Email Template History)
**Spec References**: Ch.16.6 (Versioned Event Templates), Ch.19.3.9 (`event_email_templates` table)
**Created**: 2026-02-25

---

## Overview

The Email Templates management page provides moderators with a full-featured interface for viewing the version history of event email templates and customizing the current template. It is accessible from the moderator dashboard via a "View History" link in the TemplateEditor card.

**Entry Point**: "View History" link in the TemplateEditor card header on the moderator dashboard.

**Key Principles**:
- Templates are **immutable**: editing creates a new version, never mutates existing records (Ch.16.6.2)
- Exactly one version per event has `is_current = true` (Ch.19.3.9)
- Version numbers are monotonically increasing (no gaps, no resets)
- "Revert" is implemented by creating a new version with content copied from an older version

---

## Layout

### Mobile (<768px) — Vertical Stack

```
┌─────────────────────────────────────┐
│ ← Back to Dashboard                │
│                                     │
│ Email Templates                     │
│ VibeCoding Cologne March 2026       │
│                                     │
│ ─── Current Template (v3) ───      │
│                                     │
│ Subject:                            │
│ ┌─────────────────────────────────┐ │
│ │ Reminder: VibeCoding starts...  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Body (Markdown):                    │
│ ┌─────────────────────────────────┐ │
│ │ Hi {{display_name}},            │ │
│ │                                 │ │
│ │ This is a reminder that...      │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 12 registered participants          │
│ [Save New Version]  [Send Broadcast]│
│                                     │
│ ─── Version History (3) ───        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ v3 (current)    Feb 25, 2026   │ │
│ │ by Max Mustermann              │ │
│ │ Subject: Reminder: VibeCod...  │ │
│ │ [View]                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ v2              Feb 24, 2026   │ │
│ │ by Eva Schmidt                 │ │
│ │ Subject: Don't miss VibeCo...  │ │
│ │ [View]  [Restore]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ v1 (default)    Feb 20, 2026   │ │
│ │ by System                      │ │
│ │ Subject: Reminder: {{event...  │ │
│ │ [View]  [Restore]             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Desktop (≥1024px) — Two-Column Layout

Left column: Template editor (current version). Right column: Version history list.

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                          │
│                                                              │
│ Email Templates — VibeCoding Cologne March 2026              │
│                                                              │
│ ┌──────────────────────────┐  ┌────────────────────────────┐ │
│ │ Current Template (v3)    │  │ Version History (3)        │ │
│ │                          │  │                            │ │
│ │ Subject:                 │  │ v3 · current               │ │
│ │ ┌──────────────────────┐ │  │ Feb 25, 2026 14:30         │ │
│ │ │ Reminder: VibeCo...  │ │  │ Max Mustermann             │ │
│ │ └──────────────────────┘ │  │ Subj: Reminder: Vi...      │ │
│ │                          │  │ [View]                     │ │
│ │ Body (Markdown):         │  │ ─────────────────────────  │ │
│ │ ┌──────────────────────┐ │  │                            │ │
│ │ │ Hi {{display_name}}, │ │  │ v2                         │ │
│ │ │                      │ │  │ Feb 24, 2026 09:15         │ │
│ │ │ This is a reminder   │ │  │ Eva Schmidt                │ │
│ │ │ that **{{event_...   │ │  │ Subj: Don't miss Vi...     │ │
│ │ │                      │ │  │ [View] [Restore]           │ │
│ │ │                      │ │  │ ─────────────────────────  │ │
│ │ │                      │ │  │                            │ │
│ │ │                      │ │  │ v1 · default               │ │
│ │ └──────────────────────┘ │  │ Feb 20, 2026 10:00         │ │
│ │                          │  │ System                     │ │
│ │ 12 registered            │  │ Subj: Reminder: {{e...     │ │
│ │ participants              │  │ [View] [Restore]           │ │
│ │                          │  │                            │ │
│ │ [Save New Version]       │  │                            │ │
│ │ [Send Broadcast]         │  │                            │ │
│ │                          │  │                            │ │
│ └──────────────────────────┘  └────────────────────────────┘ │
│                                                              │
│ ─── Read-Only Preview (shown when "View" clicked) ────────  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Version 2 — Feb 24, 2026 09:15 — Eva Schmidt           │ │
│ │                                                          │ │
│ │ Subject: Don't miss VibeCoding Cologne!                  │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Hi {{display_name}},                                 │ │ │
│ │ │                                                      │ │ │
│ │ │ Don't miss **VibeCoding Cologne** this Friday!        │ │ │
│ │ │                                                      │ │ │
│ │ │ We have an exciting lineup of problems...            │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │                           [Close]  [Restore This Version]│ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Page Header

- Back button → `/dashboard/moderator`
- Page title: "Email Templates"
- Event subtitle (from event data or hardcoded MVP title)

### 2. Current Template Editor

Reuses the existing **TemplateEditor** component logic but rendered inline (not collapsible):
- Subject input (text field)
- Body markdown textarea (8-row minimum, resizable)
- Recipient count display
- "Save New Version" button (secondary variant, disabled when no changes)
- "Send Broadcast" button (default variant, confirmation dialog before sending)
- Change detection: compares current input to saved template values

### 3. Version History List

A scrollable list of all template versions for the event, newest first:
- Each entry shows: version number, `created_at` timestamp, `created_by_display_name`, truncated subject
- **Current version badge**: The version with `is_current = true` shows a "current" badge
- **v1 badge**: The initial default template shows a "default" badge
- **View button**: Opens the read-only preview panel for that version
- **Restore button**: Available on all non-current versions. Creates a new version with the content of the selected historical version.

### 4. Read-Only Preview Panel

Shown below the main content when a historical version's "View" button is clicked:
- Header: Version number, timestamp, author name
- Subject display (read-only text)
- Body display (read-only, monospace, pre-formatted or rendered markdown)
- "Close" button to dismiss the panel
- "Restore This Version" button with confirmation dialog: "This will create a new version (vN+1) with the content from version vX. Continue?"

---

## Data Requirements

### Server Load (`+page.server.ts`)

| Data | Source | Notes |
|------|--------|-------|
| `currentTemplate` | `getCurrentTemplate(eventId)` | Current active template |
| `templateHistory` | `getTemplateHistory(eventId)` | All versions, newest first |
| `recipientCount` | `getRegistrationCounts(eventId)` | Number of registered participants |
| `eventTitle` | `events` table query | For page subtitle display |

### API Endpoints (Already Exist)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/events/[eventId]/email-template` | GET | Returns `{ current, history }` |
| `/api/events/[eventId]/email-template` | PUT | Creates new version `{ subject, body_markdown }` |
| `/api/events/[eventId]/broadcast` | POST | Sends broadcast to all registered |

### Restore Action

"Restore" creates a new version by calling PUT `/api/events/[eventId]/email-template` with the subject and body_markdown from the selected historical version. No new endpoint needed.

---

## Interaction Flows

### Flow 1: View Historical Version
1. Moderator clicks "View" on a version entry
2. Read-only preview panel slides in below the history list
3. Panel shows full subject and body_markdown of that version
4. Moderator clicks "Close" to dismiss

### Flow 2: Restore Historical Version
1. Moderator clicks "Restore" on a version entry (or "Restore This Version" in preview)
2. Confirmation dialog appears: "Create new version (vN+1) from version vX?"
3. On confirm: PUT request with the old version's subject and body_markdown
4. On success: Page reloads, new version appears at top of history, editor updates
5. Toast: "Template restored — Version N+1 created from v{X}"

### Flow 3: Edit and Save Current Template
1. Moderator modifies subject or body in the editor
2. "Save New Version" button enables (change detection)
3. Moderator clicks "Save New Version"
4. PUT request creates new version
5. Toast: "Template saved — Version N created"
6. Page reloads with new version as current

### Flow 4: Send Broadcast
1. Same as existing TemplateEditor behavior
2. Auto-saves unsaved changes before sending
3. Confirmation dialog with recipient count
4. POST to broadcast endpoint
5. Toast with result

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| <768px | Single column, editor above history. Preview panel full width below. |
| ≥768px | Single column still, but wider cards. |
| ≥1024px | Two-column: editor left (60%), history right (40%). Preview below both. |

---

## Accessibility

- All form inputs have associated labels
- Buttons have descriptive text (not icon-only)
- Version list is navigable with keyboard (tab order)
- Preview panel is dismissable with Escape key
- Confirmation dialogs trap focus
- Touch targets ≥44px on mobile

---

## Testing Checklist

- [ ] Current template loads and displays in editor
- [ ] Editing subject/body enables "Save New Version" button
- [ ] Save creates new version (version number increments)
- [ ] Version history displays all versions, newest first
- [ ] Current version shows "current" badge
- [ ] "View" opens read-only preview with correct content
- [ ] "Close" dismisses the preview
- [ ] "Restore" creates new version with old content
- [ ] "Restore" confirmation dialog appears
- [ ] "Send Broadcast" works with confirmation
- [ ] Page works at 375px width
- [ ] Desktop two-column layout at ≥1024px
- [ ] Back button navigates to moderator dashboard

---

**Document Version**: 1.0.0
**Status**: Complete
