# Account Settings Design

**Route**: `/account`
**Purpose**: User profile management — password change, newsletter subscription, audio preferences, linked OAuth accounts
**Auth required**: Yes (session cookie)
**Created**: 2026-02-25

---

## Overview

The Account Settings page lets authenticated users manage their own profile. It is accessible from the top-right avatar menu on all authenticated pages (see Ch.12.7.2, U39).

**Specification Sources**: Ch.18.2 (Password Policy), Ch.18.9 (Session Invalidation), Ch.14.5.1 (Audio Cues Preference), Ch.30.6 (Newsletter Preference), Ch.30.10 (Account Settings)

---

## Layout

Centered card layout with section groups. Uses PageContainer and the standard viewport background.

```
┌──────────────────────────────────────────┐
│ ← Back         Account Settings          │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Profile                              │ │
│ │ ──────────────────────────────────── │ │
│ │ Display Name                         │ │
│ │ Max Mustermann                        │ │
│ │ (name editing: future scope)         │ │
│ │                                      │ │
│ │ Email                                │ │
│ │ max@example.com     ✓ Confirmed      │ │
│ │   (email not changeable)             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Change Password                      │ │
│ │ (only shown for local auth users)    │ │
│ │ ──────────────────────────────────── │ │
│ │ Current Password                     │ │
│ │ [••••••••••••••••••••]              │ │
│ │                                      │ │
│ │ New Password                         │ │
│ │ [••••••••••••••••••••]              │ │
│ │ ✓ 10+ chars  ✓ Uppercase            │ │
│ │ ✓ Lowercase  ✓ Number               │ │
│ │                                      │ │
│ │ Confirm New Password                 │ │
│ │ [••••••••••••••••••••]              │ │
│ │                                      │ │
│ │ [Change Password]                    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Notifications & Preferences          │ │
│ │ ──────────────────────────────────── │ │
│ │ ☑ Community Newsletter               │ │
│ │   Receive event announcements and    │ │
│ │   community updates                  │ │
│ │                                      │ │
│ │ ☐ Audio Cues                         │ │
│ │   Play sound alerts during live      │ │
│ │   events                             │ │
│ │                          [Save]      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Linked Accounts                      │ │
│ │ ──────────────────────────────────── │ │
│ │ GitHub:   Not linked                 │ │
│ │ LinkedIn: Not linked                 │ │
│ │ (Linking: future scope)              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ API Keys                             │ │
│ │ ──────────────────────────────────── │ │
│ │ [+ Generate New Key]                 │ │
│ │ mk_demo12  "Demo Bot"  ● Active      │ │
│ │                       [Revoke]       │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## Section 1: Profile (Read-Only)

**Purpose**: Display current account information. Non-editable fields use `text-headers` without input styling.

| Field | Display | Editable |
|-------|---------|----------|
| Display Name | Text, `font-medium` | No (future scope) |
| Email | Text + confirmed badge | No (by design, Ch.30.10) |
| Email status | Green "✓ Confirmed" badge OR yellow "Pending" badge | N/A |

**Confirmed badge**: `bg-success/10 text-success text-xs rounded-full px-2 py-0.5`
**Pending badge**: `bg-pending/10 text-pending text-xs rounded-full px-2 py-0.5`

---

## Section 2: Change Password

**Visibility**: Only shown when `user.auth_provider === 'local'` (email + password accounts).
OAuth-only users see: *"You signed in with {GitHub/LinkedIn}. Password change is not available for OAuth accounts."*

### Fields

| Field | Type | Validation | Autocomplete |
|-------|------|------------|--------------|
| Current Password | `input[type="password"]` | Required | `current-password` |
| New Password | `input[type="password"]` | Required, policy check | `new-password` |
| Confirm New Password | `input[type="password"]` | Required, must match | `new-password` |

### Password Policy Indicators (same as register page)

Real-time indicators shown below "New Password" field:
- ✓ / ✗ 10+ characters
- ✓ / ✗ Uppercase letter
- ✓ / ✗ Lowercase letter
- ✓ / ✗ Number

### Actions

- Button: `[Change Password]`, `variant="default"`, full-width on mobile
- Loading state: Spinner + "Changing..."
- Success: Green toast notification "Password changed. All other sessions have been logged out."
- Error: Inline red alert below form

### Server Behavior (Ch.18.2, Ch.18.9)

1. Verify current password with bcrypt
2. Validate new password meets policy
3. Hash new password
4. Destroy ALL user sessions (force re-auth on all devices)
5. Create new session for current device
6. Return success

### Error States

| Error | Display |
|-------|---------|
| Current password wrong | Red alert: "Incorrect current password." |
| New password too weak | Inline indicators on unmet rules |
| Passwords don't match | Red text below confirm field |
| Server error | Red alert: "Password change failed. Please try again." |

---

## Section 3: Notifications & Preferences

**Purpose**: Toggle newsletter subscription and audio cues (U14, Ch.30.6, Ch.14.5.1).

### Layout

```
┌──────────────────────────────────────┐
│ Notifications & Preferences          │
│ ─────────────────────────────────── │
│                                      │
│ Community Newsletter                 │
│ ☑ Receive event announcements,       │
│   community updates, and new         │
│   problem notifications.             │
│                                      │
│ Audio Cues                           │
│ ☐ Play sound alerts during live      │
│   events (timer warnings, phase      │
│   transitions).                      │
│                                      │
│                           [Save]     │
└──────────────────────────────────────┘
```

**Newsletter checkbox**: Pre-filled with current `get_infoletter` value from DB.
**Audio cues checkbox**: Pre-filled with current `audio_cues_enabled` value from DB.
**Save button**: `variant="secondary"`, right-aligned (or full-width on mobile).
**Save behavior**: `POST` form action `?/saveNotifications`, persists both `get_infoletter` and `audio_cues_enabled` to the DB, shows toast "Preferences saved."

### Audio Cues Sync (Ch.14.5.1)

The `audio_cues_enabled` preference is synced between the database and the client-side `audioStore`:

1. **Server → Client hydration**: `+layout.server.ts` includes `audio_cues_enabled` in the session user data. The root `+layout.svelte` hydrates the `audioStore` from this value on page load.
2. **Client → Server persistence**: The account settings form action `?/saveNotifications` writes `audio_cues_enabled` to the `users` table. The `audioStore` is also updated client-side to keep localStorage in sync.
3. **Quick toggle**: The `LiveBanner` audio icon toggle updates localStorage immediately (for instant responsiveness) and the DB preference is the persistent source of truth, hydrated at session start.

This dual-storage approach ensures instant client-side responsiveness during live events while maintaining persistent preferences across devices.

---

## Section 4: Linked Accounts

**Purpose**: Show which OAuth providers are linked (view only in MVP).

| Provider | Status |
|----------|--------|
| GitHub | "Not linked" OR linked GitHub username |
| LinkedIn | "Not linked" OR linked profile name |

OAuth linking is future scope — show only current state. Provide note: "Account linking will be available in a future update."

---

## Section 5: API Key Management

**Purpose**: Create and revoke API keys for bot/agent authentication (B1–B4, Ch.18.8, Ch.19.3.42).
**Spec references**: Ch.18.8.1–18.8.3, Ch.19.3.42, Ch.23.5 (B1–B4)

### Layout

```
┌──────────────────────────────────────┐
│ API Keys                             │
│ ─────────────────────────────────── │
│ API keys let your bot authenticate   │
│ against the platform REST API.       │
│                                      │
│ [+ Generate New Key]                 │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ mk_demo12  "Demo Review Bot"     │ │
│ │ Bot of Admin User                │ │
│ │ Created Jan 1, 2026              │ │
│ │ No expiration                    │ │
│ │ ● Active              [Revoke]   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ mk_old1ab  "Old Bot"             │ │
│ │ Bot of Admin User                │ │
│ │ Created Dec 1, 2025              │ │
│ │ Revoked Feb 1, 2026              │ │
│ │ ✗ Revoked                        │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Empty state** (no keys yet):
```
┌──────────────────────────────────────┐
│ API Keys                             │
│ ─────────────────────────────────── │
│ API keys let your bot authenticate   │
│ against the platform REST API.       │
│                                      │
│ No API keys yet. Generate your first │
│ key to enable bot access.            │
│                                      │
│              [+ Generate New Key]    │
└──────────────────────────────────────┘
```

### Key List Row

Each row shows:
- `display_prefix` (monospace, e.g., `mk_demo12`) — identifies the key without exposing the secret
- Label (if set, in quotes; otherwise "Unlabeled")
- Bot display name (e.g., "Bot of Max Mustermann")
- Created date (formatted `MMM D, YYYY`)
- Status badge: **● Active** (green), **✗ Revoked** (red/muted), **⊘ Expired** (yellow)
- Revoke button — only visible on active keys

### Generate New Key Flow

**Trigger**: Click `[+ Generate New Key]` button — opens inline form:

```
┌──────────────────────────────────────┐
│ Generate New API Key                 │
│ ─────────────────────────────────── │
│ Label (optional)                     │
│ [My Claude Bot               ]       │
│                                      │
│ [Cancel]         [Generate Key]      │
└──────────────────────────────────────┘
```

- Label field: optional, max 100 chars, placeholder "e.g. My Claude Bot"
- Submit via `POST ?/generateKey` form action

**After successful generation** — display one-time key dialog:

```
┌──────────────────────────────────────┐
│  Your New API Key                    │
│                                      │
│  ⚠ Save this key now.               │
│  It will not be shown again.         │
│                                      │
│  mk_abc12def34567890abc12def34567890 │
│  1234                     [Copy]     │
│                                      │
│           [I've saved my key]        │
└──────────────────────────────────────┘
```

- Key displayed in monospace code block, full width
- `[Copy]` button: copies key to clipboard, momentarily changes to "Copied ✓"
- `[I've saved my key]` dismisses the dialog and refreshes the key list
- The plaintext key is passed as `form.newKey` from the server action (never stored)

### Revoke Key Flow

**Trigger**: Click `[Revoke]` on an active key row — opens `ConfirmDialog`:

```
Revoke API Key

Are you sure you want to revoke "My Claude Bot"
(mk_abc12d)?

Bots using this key will immediately lose access.
This cannot be undone.

        [Cancel]    [Revoke Key]
```

- `[Revoke Key]` submits `POST ?/revokeKey` with the `api_key_id`
- On success: toast "API key revoked.", key row updates to Revoked status
- `[Cancel]` closes without action

### Status Badges

| Status | Condition | Visual |
|--------|-----------|--------|
| Active | Not revoked, not expired | `bg-success/10 text-success` bullet + "Active" |
| Revoked | `revoked_at IS NOT NULL` | `bg-alert/10 text-alert` × + "Revoked" + date |
| Expired | `valid_until < NOW()` | `bg-pending/10 text-pending` ⊘ + "Expired" + date |

### Server Behavior

**`generateKey` action**:
1. Authenticate user (session required)
2. Generate raw key: `mk_` + 40 random hex chars
3. Compute SHA-256 hash of raw key
4. Set `display_prefix` = first 8 chars of raw key
5. Insert row into `api_keys` (owner = current user)
6. Auto-create bot user: `role='agent'`, `display_name='Bot of {user.display_name}'`, `api_key_id` = new key ID
7. Return `{ newKey: rawKey, displayPrefix }` — plaintext key shown once in UI

**`revokeKey` action**:
1. Authenticate user (session required)
2. Validate `api_key_id` belongs to current user
3. Set `revoked_at = NOW()`
4. Return success

### Error States

| Error | Display |
|-------|---------|
| Key not found / not owned | Red alert: "API key not found." |
| Already revoked | Red alert: "This key has already been revoked." |
| Server error | Red alert: "Failed to manage API key. Please try again." |

---

## Form Submission Pattern

All sections use SvelteKit form actions (progressive enhancement):
- `<form method="POST" action="?/changePassword">` for password section
- `<form method="POST" action="?/saveNotifications">` for newsletter section
- `use:enhance` for loading state without full page reload
- `role="alert"` on error messages

---

## Mobile Specifications (<640px)

- Full-width card (no side margins)
- All inputs: h-12 (48px), text-base (16px — prevents iOS zoom)
- Buttons: full-width, h-12
- Section cards: stacked vertically with gap-4
- Password policy indicators: stacked vertically

---

## Route Map

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /account` | — | Show account settings (incl. API key list) |
| `POST /account?/changePassword` | Form action | Change password |
| `POST /account?/saveNotifications` | Form action | Toggle newsletter + audio cues |
| `POST /account?/generateKey` | Form action | Generate new API key + bot user |
| `POST /account?/revokeKey` | Form action | Revoke an active API key |

---

## Design Tokens Used

Same as auth pages — `--color-viewport`, `--color-card`, `--color-primary`, `--color-success`, `--color-alert`, `--color-headers`, `--color-labels`.

---

**Document Version**: 1.2.0
**Status**: Complete — Section 3 expanded with audio cues preference for TICKET-27
