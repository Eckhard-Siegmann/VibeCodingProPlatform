# Global Navigation Chrome Design

**Routes**: All authenticated pages (layout-level)
**Status**: New — TICKET-28
**Created**: 2026-02-25
**Components**: `layout/TopAppBar.svelte`, `layout/BottomNavBar.svelte`, `layout/AccountMenu.svelte`

---

## Overview

The Global Navigation Chrome provides persistent, always-visible navigation across all authenticated pages. It uses an "App-Like" Split Navigation pattern that separates identity/account actions (top) from route switching (bottom), eliminating hamburger menus and providing single-tap access to all primary screens.

**Philosophy**: Users on mobile during live events need one-tap navigation while standing, walking, and holding a phone in one hand. No menus to open, no submenus to navigate. One tap = one destination.

**Key Design Decisions**:
- **Two distinct chrome elements** with orthogonal responsibilities
- **TopAppBar** (top): "Who am I?" — brand identity + account actions
- **BottomNavBar** (bottom): "Where do I go?" — primary app routes
- **Hidden on unauthenticated pages** (landing, login, register)

---

## User Stories Covered

- **U38** – Switch Screens via Bottom Navigation
- **U39** – Access Account via Top-Right Avatar
- **U40** – See Current Location in Navigation
- **M29** – Access Moderator Dashboard via Bottom Navigation

---

## Specification Sources

- **Ch.12.7** — Global Navigation Architecture (behavioral spec)
- **Ch.12.7.2** — Top App Bar
- **Ch.12.7.3** — Bottom Navigation Bar
- **Ch.12.7.4** — Responsive behavior
- **Ch.12.7.5** — Visibility rules
- **Ch.26.16** — Component specifications (implementation-level)
- **Ch.26.16.1** — TopAppBar component
- **Ch.26.16.2** — BottomNavBar component
- **Ch.26.16.3** — Layout integration with LiveBanner

---

## Component Hierarchy

```
+layout.svelte
├─ {#if showNavChrome}
│  ├─ TopAppBar
│  │  ├─ BrandLogo (left)
│  │  └─ InitialAvatar (right)
│  │     └─ AccountMenu (dropdown/bottom sheet)
│  │        ├─ UserInfo (name + email, non-interactive)
│  │        ├─ MenuItem: "Settings" → /account
│  │        └─ MenuItem: "Logout" → POST /api/auth/logout
│  ├─ LiveBanner (sticky, below TopAppBar)
│  ├─ <main> {@render children()} </main>
│  └─ BottomNavBar
│     ├─ NavItem: "Home" → /dashboard
│     ├─ NavItem: "Events" → /events
│     ├─ NavItem: "Problems" → /problems
│     ├─ {#if role ∈ {moderator, admin}}
│     │  └─ NavItem: "Moderate" → /dashboard/moderator
│     └─ {#if role = admin}
│        └─ NavItem: "Admin" → /admin
└─ {:else}
   └─ <main> {@render children()} </main>  (no chrome)
```

---

## Visibility Rules

| Page | TopAppBar | BottomNavBar |
|------|-----------|--------------|
| Landing page (`/`) | Hidden | Hidden |
| Login (`/login`) | Hidden | Hidden |
| Register (`/register`) | Hidden | Hidden |
| Forgot Password (`/forgot-password`) | Hidden | Hidden |
| Set Password (`/set-password`) | Hidden | Hidden |
| Auth callbacks (`/auth/*`) | Hidden | Hidden |
| All other authenticated pages | Visible | Visible |

**Implementation**: The `+layout.svelte` determines visibility from `$page.url.pathname`. Pages matching `/login`, `/register`, `/forgot-password`, `/set-password`, `/auth/`, and exactly `/` suppress the chrome.

---

## TopAppBar — Detailed Design

### Visual Specification

```
Mobile (< 640px):
┌──────────────────────────────────────────────┐
│  VibeCoding                           [EH]   │  44px height
└──────────────────────────────────────────────┘

Desktop (≥ 1024px):
┌──────────────────────────────────────────────────────────┐
│  VibeCoding Professionals                         [EH]   │  48px height
└──────────────────────────────────────────────────────────┘
```

### Properties

| Property | Value |
|----------|-------|
| Position | `fixed top-0 left-0 right-0` |
| Z-index | `z-50` |
| Height | 44px (mobile), 48px (desktop) |
| Background | `bg-card` (`#FEFEFE`) |
| Border | `border-b border-secondary` |
| Shadow | `shadow-resting` (`0px 1px 3px rgba(0,0,0,0.05)`) |
| Padding | `px-4` (mobile), `px-6` (desktop) |
| Layout | `flex items-center justify-between` |

### Left Region — Brand

- Text: "VibeCoding" in `text-headers` (`#192A4B`), `font-semibold`, `text-lg`
- Desktop addition: "+ Professionals" in `text-labels`, `text-sm`, `ml-1`
- Future: 24×24px logo icon to the left of text
- Tap → navigate to `/dashboard`

### Right Region — User Avatar

- **InitialAvatar** component (Ch.26.11.16)
- Size: 24px (mobile), 32px (desktop)
- Shows first letter of `display_name` on a color-hashed background
- Cursor: `pointer`
- Focus: `outline-2 outline-offset-2 outline-primary`
- Tap/click → opens AccountMenu

### AccountMenu

**Desktop (≥768px)** — Dropdown menu aligned to right edge:

```
                              ┌──────────────────┐
                              │  Eva Schmidt     │  ← text-headers, font-medium
                              │  eva@example.com │  ← text-labels, text-sm
                              ├──────────────────┤
                              │  ⚙  Settings     │  → /account
                              ├──────────────────┤
                              │  🚪 Logout       │  → POST /api/auth/logout
                              └──────────────────┘
```

**Mobile (<768px)** — Bottom sheet:

```
┌──────────────────────────────────────────┐
│  ─── (handle bar)                        │
│                                          │
│  Eva Schmidt                             │
│  eva@example.com                         │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │  ⚙  Settings                        ││  48px, full-width
│  └──────────────────────────────────────┘│
│  ┌──────────────────────────────────────┐│
│  │  🚪 Logout                           ││  48px, full-width, text-alert on hover
│  └──────────────────────────────────────┘│
│                                          │
└──────────────────────────────────────────┘
```

| Property | Desktop | Mobile |
|----------|---------|--------|
| Item height | 40px | 48px |
| Padding | `px-4 py-2` | `px-4 py-3` |
| Icon size | 16px | 20px |
| Hover | `bg-canvas` | None (touch) |
| Logout hover | `text-alert` | `text-alert` |
| Divider | `border-secondary` | `border-secondary` |
| Backdrop | None | Semi-transparent, tap to dismiss |

**ARIA**:
- Avatar button: `role="button"`, `aria-haspopup="menu"`, `aria-expanded`
- Menu: `role="menu"`, items: `role="menuitem"`
- Focus trap when open, Escape to close
- Arrow keys navigate between items

---

## BottomNavBar — Detailed Design

### Visual Specification

```
Participant (3 items):
┌──────────┬──────────┬──────────┐
│    🏠    │    📅    │    📋    │
│   Home   │  Events  │ Problems │  56px height
│ (active) │          │          │
└──────────┴──────────┴──────────┘

Moderator (4 items):
┌────────┬────────┬────────┬────────┐
│   🏠   │   📅   │   📋   │   🎛️   │
│  Home  │ Events │Problems│Moderate│  56px height
└────────┴────────┴────────┴────────┘

Admin (5 items):
┌───────┬───────┬───────┬───────┬───────┐
│  🏠   │  📅  │  📋  │  🎛️  │  ⚙️   │
│ Home  │Events │Probl… │Moder… │ Admin │  56px height
└───────┴───────┴───────┴───────┴───────┘
```

### Properties

| Property | Value |
|----------|-------|
| Position | `fixed bottom-0 left-0 right-0` |
| Z-index | `z-50` |
| Height | 56px (mobile), 60px (desktop) |
| Background | `bg-card` (`#FEFEFE`) |
| Border | `border-t border-secondary` |
| Shadow | `0px -1px 3px rgba(0,0,0,0.05)` (upward) |
| Layout | `flex items-center justify-around` |
| Safe area | `pb-[env(safe-area-inset-bottom)]` (iOS) |

### Nav Item Layout

Each item is a vertical stack:

```
     ━━━━━        ← Active indicator (3px bar, rounded, bg-primary) — only on active
      🏠          ← Icon (24px Lucide, stroke-width 1.5 inactive / 2 active)
     Home         ← Label (text-xs, font-medium)
```

| Property | Value |
|----------|-------|
| Layout | `flex flex-col items-center justify-center gap-0.5` |
| Touch target | Entire item, min 48×48px |
| Icon size | 24px |
| Label size | `text-xs` (10px), `font-medium` |

### Nav Item States

| State | Icon Color | Label Color | Indicator |
|-------|-----------|-------------|-----------|
| **Inactive** | `text-labels` (`#7B7C90`) | `text-labels` | None |
| **Active** | `text-primary` (`#2680F1`) | `text-primary` | 3px top bar in `bg-primary` |
| **Hover** (desktop) | `text-headers` | `text-headers` | Subtle `bg-canvas` |

### Active Route Matching

Active state is determined by matching `$page.url.pathname`:

```typescript
function isActive(href: string, currentPath: string): boolean {
  if (href === '/dashboard') {
    // Exact match for home (not /dashboard/moderator)
    return currentPath === '/dashboard';
  }
  // Prefix match for other routes
  return currentPath.startsWith(href);
}
```

| Nav Item | Matches |
|----------|---------|
| Home (`/dashboard`) | Exact `/dashboard` only |
| Events (`/events`) | `/events`, `/events?...`, `/event/[slug]` |
| Problems (`/problems`) | `/problems`, `/problems?...`, `/problem/[slug]` |
| Moderate (`/dashboard/moderator`) | `/dashboard/moderator`, `/dashboard/moderator/*` |
| Admin (`/admin`) | `/admin`, `/admin/*` |

### Role-Based Item Configuration

```typescript
import { Home, Calendar, ClipboardList, Sliders, Settings } from 'lucide-svelte';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: ClipboardList, label: 'Problems', href: '/problems' },
];

// Conditionally added:
if (role === 'moderator' || role === 'admin') {
  navItems.push({ icon: Sliders, label: 'Moderate', href: '/dashboard/moderator' });
}
if (role === 'admin') {
  navItems.push({ icon: Settings, label: 'Admin', href: '/admin' });
}
```

### Badge (Notification Dot) — Future

- Position: Top-right of icon, overlapping
- Dot size: `w-2 h-2` (boolean indicator) or `w-4 h-4` (count)
- Color: `bg-alert`, `text-white`, `text-[10px]`
- Count: Display number if ≤99, "99+" otherwise
- Not MVP — placeholder in props interface

---

## Layout Integration

### Vertical Z-Index Stack

```
┌─────────────────────────────────────┐  ← TopAppBar (fixed top-0, z-50)
│ VibeCoding              [EH]       │     44px / 48px
├─────────────────────────────────────┤  ← LiveBanner (sticky, z-40)
│ 🔴 LIVE: Pitching 'API Rate Lim…' │     top: 44px (mobile) / 48px (desktop)
├─────────────────────────────────────┤
│                                     │
│         Page Content                │  ← Scrollable, padded top + bottom
│         (Dashboard, Problem Card,   │
│          Assessment, etc.)          │
│                                     │
├─────────────────────────────────────┤  ← BottomNavBar (fixed bottom-0, z-50)
│  🏠 Home   📅 Events   📋 Problems │     56px / 60px
└─────────────────────────────────────┘
```

### Content Area Padding

The `<main>` content area must offset for both fixed elements:

```css
/* Mobile */
main { padding-top: 44px; padding-bottom: 56px; }

/* Desktop */
@media (min-width: 768px) {
  main { padding-top: 48px; padding-bottom: 60px; }
}

/* iOS safe area */
main { padding-bottom: calc(56px + env(safe-area-inset-bottom)); }
```

### PageContainer Update

The existing `PageContainer.svelte` wrapper must be updated to include these offsets. If the navigation chrome is NOT shown (unauthenticated pages), no padding is applied.

---

## Data Requirements

### +layout.server.ts

The root layout server load provides session user data for navigation:

```typescript
export const load: LayoutServerLoad = async ({ cookies }) => {
  const user = await getAuthenticatedUser(cookies);
  return {
    user: user ? {
      user_id: user.user_id,
      display_name: user.display_name,
      role: user.role,
      email: user.email,
      email_confirmed: user.email_confirmed,
      audio_cues_enabled: user.audio_cues_enabled,
    } : null,
  };
};
```

**Navigation uses**: `user.display_name` (avatar initials), `user.role` (nav item visibility), `user` existence (chrome visibility).

---

## Responsive Behavior

### Mobile (<640px)

- TopAppBar: 44px, logo text only ("VibeCoding")
- BottomNavBar: 56px, icons + labels stacked vertically
- AccountMenu: Bottom sheet with 48px items
- Content padding: `pt-[44px] pb-[56px]`

### Tablet (640–1023px)

- TopAppBar: 48px, logo + tagline ("VibeCoding Professionals")
- BottomNavBar: Same as mobile
- AccountMenu: Dropdown
- Content padding: `pt-[48px] pb-[60px]`

### Desktop (≥1024px)

- TopAppBar: 48px, logo + tagline
- BottomNavBar: 60px, slightly larger items
- AccountMenu: Dropdown
- Content padding: `pt-[48px] pb-[60px]`
- Future: BottomNavBar may convert to left sidebar or top nav tabs

---

## Scroll Behavior

**TopAppBar**: Always visible (never auto-hides). Provides constant brand and identity anchor.

**BottomNavBar auto-hide** (optional enhancement, not MVP):
- On scroll down: slides out (`translateY(100%)`)
- On scroll up: slides back in
- Transition: 200ms ease-out
- **MVP**: Always visible

---

## Accessibility

### Keyboard Navigation

- **Tab**: Cycles through TopAppBar → page content → BottomNavBar
- **Enter/Space**: Activates links and buttons
- **Escape**: Closes AccountMenu
- **Arrow keys**: Navigate AccountMenu items when open

### ARIA

- TopAppBar: No explicit role (is a visual container)
- Avatar button: `role="button"`, `aria-haspopup="menu"`, `aria-expanded`
- AccountMenu: `role="menu"`, items: `role="menuitem"`
- BottomNavBar: `<nav role="navigation" aria-label="Main navigation">`
- Active nav item: `aria-current="page"`
- Disabled nav items: `aria-disabled="true"` (no disabled items in current design)

### Focus Management

- Focus visible: 2px outline ring on all focusable elements
- AccountMenu: Focus trap when open
- BottomNavBar: Tab navigates between items in order

### Touch Targets

- All nav items: ≥48×48px touch area
- Avatar button: ≥44×44px
- AccountMenu items: ≥48×44px (mobile), ≥40px height (desktop)

---

## Implementation Notes

### Existing Components to Update

1. **`+layout.svelte`**: Add TopAppBar + BottomNavBar rendering, conditional on authentication
2. **`layout/PageContainer.svelte`**: Update padding to account for fixed chrome
3. **`dashboard/LiveBanner.svelte`**: Adjust `top` position to stack below TopAppBar

### New Components

1. **`layout/TopAppBar.svelte`**: Brand + avatar + AccountMenu trigger
2. **`layout/BottomNavBar.svelte`**: Nav items with active state
3. **`layout/AccountMenu.svelte`**: Dropdown (desktop) / bottom sheet (mobile) — or inline in TopAppBar

### Dependencies

- `lucide-svelte`: Home, Calendar, ClipboardList, Sliders, Settings, LogOut, User icons
- `bits-ui`: DropdownMenu (desktop AccountMenu) or Dialog (mobile bottom sheet)
- Existing `InitialAvatar` component (Ch.26.11.16)

---

## Testing Checklist

### Functional Tests

- [ ] TopAppBar visible on all authenticated pages
- [ ] TopAppBar hidden on /, /login, /register, /forgot-password
- [ ] BottomNavBar visible on all authenticated pages
- [ ] BottomNavBar hidden on unauthenticated pages
- [ ] Avatar shows correct initials from display_name
- [ ] AccountMenu opens on avatar tap/click
- [ ] AccountMenu shows user name and email
- [ ] "Settings" navigates to /account
- [ ] "Logout" posts to /api/auth/logout and redirects
- [ ] Home nav item active on /dashboard
- [ ] Events nav item active on /events and /event/[slug]
- [ ] Problems nav item active on /problems and /problem/[slug]
- [ ] Moderate nav item visible only for moderator/admin roles
- [ ] Admin nav item visible only for admin role
- [ ] Active nav item has visual indicator (filled icon + accent color + 3px bar)
- [ ] Brand text links to /dashboard
- [ ] Content doesn't overlap with fixed bars

### Responsive Tests

- [ ] Mobile (375px): 44px TopAppBar, 56px BottomNavBar
- [ ] Tablet (768px): 48px TopAppBar
- [ ] Desktop (1024px): Full tagline visible
- [ ] AccountMenu: Bottom sheet on mobile, dropdown on desktop
- [ ] Nav items fit within bar (3 items, 4 items, 5 items)
- [ ] Safe area inset applied on iOS

### Accessibility Tests

- [ ] Keyboard: Tab through all nav items
- [ ] Keyboard: Enter/Space activates links
- [ ] Keyboard: Escape closes AccountMenu
- [ ] ARIA: nav element has aria-label
- [ ] ARIA: Active item has aria-current="page"
- [ ] ARIA: AccountMenu has role="menu"
- [ ] Touch targets ≥ 44×44px on all interactive elements
- [ ] Color contrast ≥ 4.5:1 for all text

---

## Related Specifications

- **Ch.12.7**: Global Navigation Architecture
- **Ch.26.16**: Component specifications
- **Ch.26.11.16**: InitialAvatar component
- **Dashboard Design**: Global Navigation Chrome section (added 2026-02-25)

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-25
**Status**: Specification Complete
