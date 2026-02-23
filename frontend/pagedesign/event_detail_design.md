# Event Detail Page Design

**Route**: `/event/[slug]`
**Component**: EventCard, EventHeader, RegistrationSection
**Status**: Retroactive + Enhancement Specification
**Created**: 2026-02-05

---

## Overview

Event detail page serves as the primary destination for event discovery, information, and registration. Accessible via event slug (e.g., `/event/cologne-march-2026`).

**Primary Goals**:
1. Showcase event details (date, location, partners, agenda)
2. Enable event registration (in-presence or remote)
3. Display associated problems
4. Show registration status and waitlist

---

## Page Layout

### Desktop (≥768px): Two-Column

**Left Column (Main, 65%)**:
- Event Header (image, title, date/time, location)
- Description section
- Problems section
- Past event stats (if past event)

**Right Column (Sidebar, 35%)**:
- RegistrationSection (prominent card, sticky)
- Partner information
- External links (website, LinkedIn, X)

### Mobile (<768px): Single Column

**Vertical Stack**:
1. Event Header (full-width image + meta)
2. Registration Section (prominent, above fold if possible)
3. Event Description
4. Problems section
5. Partner info (compact)
6. External links

**Rationale**: Registration is PRIMARY action, should be easy to find on mobile.

---

## Section: Event Header

**Component**: `events/EventHeader.svelte`
**Elevation**: Card with `resting` shadow

**Layout**:
```
┌──────────────────────────────────────────┐
│                                          │
│     [====== EVENT IMAGE ======]          │ ← 16:9 aspect ratio
│                                          │
├──────────────────────────────────────────┤
│ VibeCoding Professionals - Cologne       │ ← Title (text-2xl md:text-3xl)
│                                          │
│ 📅 Feb 28, 2026  •  18:00-21:00         │ ← Date, time
│ 📍 STARTPLATZ Köln                      │ ← Location
│ ⏱️ Duration: 3 hours                    │
│                                          │
│ Hosted by:                              │
│ [Avatar] Max Mustermann                 │ ← Host with avatar
│ [Avatar] Eva Schmidt (co-host)          │
│                                          │
│ [Live Now] or [Past Event] badge        │ ← Status badge
└──────────────────────────────────────────┘
```

**Event Image**:
- **Aspect ratio**: 16:9 (e.g., 640×360px)
- **Source**: Custom image_url OR auto-generated from partner logo + title
- **Auto-generation** (if no custom image):
  - Partner logo centered
  - Event title overlay at bottom
  - Date at top-right
  - Gradient background (partner brand color if available)
- **Mobile**: Full-width, height adjusts to maintain aspect ratio
- **Desktop**: Max-width 100% of column

**Event Metadata Grid**:
- Icon + text pattern for each field
- Date: Lucide Calendar icon
- Location: Lucide MapPin icon
- Duration: Lucide Clock icon
- Icons: 16px, --color-icon color
- Text: text-labels color

**Host Display**:
- InitialAvatar size="sm" (24px)
- Name with role badge if moderator
- Co-hosts listed below (up to 2)
- Links to host profiles (future)

**Status Badge**:
- Live Now: Pulsing red badge, prominent
- Past Event: Grey badge, subtle
- Upcoming: No badge or green "Upcoming" badge

---

## Section: Registration Section

**Component**: `registration/RegistrationSection.svelte`
**Prominence**: Largest button, call-to-action styling
**Position**: Sidebar on desktop, above description on mobile

**Layout** (per Ch.26.11.22):
```
┌──────────────────────────────────────────┐
│ Register for Event                       │
│                                          │
│ Attendance Mode:                         │
│ ○ In-Presence  ○ Remote                  │ ← Radio buttons
│                                          │
│ 32/30 registered [⚠️ 90%]               │ ← Capacity indicator
│                                          │
│ ☑ I accept the Terms & Conditions       │ ← Required
│   (link to /terms)                       │
│                                          │
│ ☑ Subscribe to newsletter               │ ← Optional, default checked
│                                          │
│ [Register for Event]                     │ ← Primary, large, full-width
│                                          │
│ or                                       │
│                                          │
│ ✓ You're registered (in-presence)       │ ← If already registered
│ [Cancel Registration]                    │
└──────────────────────────────────────────┘
```

**States**:

**Not Registered**:
- Attendance toggle enabled
- T&C checkbox (required)
- Newsletter checkbox (optional)
- Register button enabled when T&C checked

**Registered (Confirmed)**:
- Shows confirmation message with green checkmark
- Display: attendance mode, registration date
- Cancel button (secondary variant, smaller)

**Waitlisted**:
- WaitlistNotice component shown above registration section
- "You're on waitlist #5" banner (yellow warning background)
- No registration button (already on waitlist)
- Cancel button to leave waitlist

**Invited (from waitlist)**:
- WaitlistNotice with countdown
- "Spot available! Respond by {timestamp}" (green background)
- Prominent [Confirm Spot] button
- [Decline] secondary button

**Capacity Full**:
- Registration button changes to "Join Waitlist"
- Different messaging: "In-presence capacity reached"
- Waitlist counter shown: "5 people ahead of you"

---

### CapacityIndicator Component

**Visual**:
```
32/30 registered [⚠️ 90%]
```

**Color Thresholds** (Ch.29.5):
- 0-70% (<21/30): Green, Users icon
- 70-90% (21-27/30): Yellow, AlertTriangle icon
- 90%+ (27+/30): Red, AlertCircle icon
- Overbooking (>30/30): Red, shows actual vs base
- Waitlisted: Purple, Clock icon + waitlist count

**Formula**:
```typescript
const percentage = (registered / capacity) * 100;
const color = percentage < 70 ? 'success' : percentage < 90 ? 'pending' : 'alert';
```

**Mobile**: Single line, icon + text inline
**Desktop**: Can be multi-line with more detail

---

### WaitlistNotice Component

**Variant: Waitlisted**:
```
┌──────────────────────────────────────────┐
│ ⏰ You're on the waitlist (#5)           │
│                                          │
│ We'll notify you if a spot opens.        │
│ Estimated wait: 1-2 days                 │
└──────────────────────────────────────────┘
```
- Background: bg-warning-bg
- Border-left: 4px solid --color-pending
- Icon: Clock
- Position number shown

**Variant: Invited**:
```
┌──────────────────────────────────────────┐
│ ✅ Spot Available!                       │
│                                          │
│ Respond by Feb 5, 14:32 (in 18h)        │
│                                          │
│ [Confirm My Spot] [Decline]              │
└──────────────────────────────────────────┘
```
- Background: bg-success/10
- Border-left: 4px solid --color-success
- Icon: CheckCircle
- Countdown to expiry (24h from invited_at)
- Prominent confirm button

**Interaction**:
- Confirm → Creates registration, removes from waitlist, shows success toast
- Decline → Removes from waitlist, next person invited, shows info toast
- Auto-expire: After 24h, automatically declines and invites next

---

## Section: Event Description

**Component**: Card with markdown rendering

**Layout**:
```
┌──────────────────────────────────────────┐
│ About This Event                         │
│                                          │
│ {description markdown}                   │
│                                          │
│ Agenda:                                  │
│ • 18:00 - Welcome & Intros              │
│ • 18:15 - Problem Pitches               │
│ • 18:45 - Problem Selection             │
│ • 19:00 - Coding Sprint (90 min)        │
│ • 20:30 - Solution Reviews              │
│ • 21:00 - Wrap-up                       │
└──────────────────────────────────────────┘
```

**Markdown Support**:
- Bold, italic, lists, links
- No images inline (security)
- Headings: h3-h4 only (h1-h2 reserved for page structure)

**Agenda Display**:
- If agenda field populated: Show as bulleted list
- If empty: No agenda section shown
- Time-based items: Format with formatTime() utility

---

## Section: Problems for This Event

**Component**: Custom list using problem cards

**Layout**:
```
┌──────────────────────────────────────────┐
│ Problems for This Event                  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ API Rate Limiter                     │ │
│ │ Max Mustermann                       │ │
│ │ [Ready] [Selected for Event]         │ │
│ │                                      │ │
│ │ Building a token bucket rate...      │ │
│ │                                      │ │
│ │ [View Problem Card →]                │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {2 more problems}                        │
│                                          │
│ [View All Problems]                      │
└──────────────────────────────────────────┘
```

**Per Problem**:
- Title (link to /problem/{slug})
- Owner name with avatar
- State badges (readiness + action)
- Short description (2-line clamp)
- View button
- Separator between problems (8px gap + subtle divider)

**Data Source**: `event_problem_queue` where event_id matches, joined with problems
**Limit**: Show 5, "View All" expands or links to full list

**Empty State**:
- "No problems selected yet"
- Moderator-only: "Select problems from backlog"
- Others: "Check back soon as the event approaches"

---

## Section: Partner Information

**Component**: Small card in sidebar (desktop) or bottom section (mobile)

**Layout**:
```
┌──────────────────────────────────────────┐
│ Hosted By                                │
│                                          │
│ [Partner Logo]                           │
│ STARTPLATZ                               │
│ Co-Working Space                         │
│                                          │
│ 🌐 startplatz.de                         │
└──────────────────────────────────────────┘
```

**Fields**:
- Partner logo (max 120px width)
- Partner name (link to partner.website_url)
- Partner type badge (Co-Working, University, etc.)
- Website link (if available)

**Mobile**: Compact, less vertical space
**Desktop**: More generous with logo size

---

## Section: External Links

**Component**: Icon link row

**Layout**:
```
┌──────────────────────────────────────────┐
│ More Information                         │
│                                          │
│ [🌐 Event Website] [💼 LinkedIn] [𝕏 X]   │
└──────────────────────────────────────────┘
```

**Display**:
- Only show links that exist (website_url, linkedin_url, x_post_url)
- Icon buttons: `variant="outline" size="sm"`
- Icons: Globe, Linkedin, Twitter (from Lucide)
- Opens in new tab (target="_blank" rel="noopener")

**If No Links**: Section hidden

---

## Past Event Variant

**Differences for Past Events** (ends_at < now):

1. **Status Badge**: "Past Event" in grey
2. **Registration Section**: Hidden (can't register for past events)
3. **Stats Section**: Shows instead of registration
   ```
   ┌──────────────────────────────────────────┐
   │ Event Summary                            │
   │                                          │
   │ 👥 24 participants                       │
   │ 📝 3 problems tackled                    │
   │ ⭐ 6 solutions reviewed                  │
   │ 💡 8 lessons learned captured            │
   └──────────────────────────────────────────┘
   ```
4. **Problems Section**: Shows outcomes (which problems selected, coded, closed)
5. **Lessons Learned**: Link to event's lessons (cross-problem)

---

## Responsive Breakpoints

### Mobile (<640px)

**Stack Order**:
1. Event Header (full-width image)
2. Registration Section (or Stats if past) - PROMINENT
3. Description
4. Problems (vertical stack)
5. Partner info (compact)
6. External links

**Full-Width Elements**:
- Event image
- Registration button
- Problem cards

**Padding**: 16px horizontal margins throughout

### Tablet (640-768px)

**Similar to Mobile** but:
- Wider problem cards (more description visible)
- Registration section can use two-column for T&C + Newsletter
- More generous spacing

### Desktop (≥768px)

**Two-Column Grid**:
- Main: 65% (event header + description + problems)
- Sidebar: 35% (registration sticky + partner + links)

**Sticky Sidebar**:
- Registration section: `position: sticky; top: 80px` (below header)
- Scrolls with page but registration always visible

---

## Component Specifications

### EventHeader Component

**File**: `events/EventHeader.svelte`
**Props**:
```typescript
interface Props {
  event: {
    title: string;
    image_url?: string;
    partner_logo_url?: string;
    starts_at: string;
    planned_ends_at: string;
    location_name: string;
    city: string;
    address: string;
    host_name: string;
    host_user_id: string;
    co_host_1_name?: string;
    co_host_1_user_id?: string;
    co_host_2_name?: string;
    co_host_2_user_id?: string;
  };
  status: 'upcoming' | 'live' | 'past';
}
```

**Image Handling**:
- If image_url exists: Use it
- Else: Auto-generate from partner_logo_url + title
- Fallback: Gradient background with title text

**Duration Calculation**:
```typescript
const duration = (new Date(planned_ends_at) - new Date(starts_at)) / (1000 * 60 * 60);
// "Duration: 3 hours"
```

**Host Display**:
- Host: InitialAvatar + name, larger (md size)
- Co-hosts: Smaller avatars (sm size), "and 2 co-hosts" if both exist
- Click name → user profile (future) or tooltip with info

---

### RegistrationSection Component

**File**: `registration/RegistrationSection.svelte`
**Props**:
```typescript
interface Props {
  event: {
    event_id: string;
    title: string;
    starts_at: string;
    capacity: number; // Effective capacity (base × overbooking)
  };
  registration?: {
    registration_id: string;
    in_presence: boolean;
    waitlist_position?: number;
    waitlist_invited_at?: string;
    waitlist_expires_at?: string;
  };
  registrationCount: number;
  waitlistCount: number;
  isAuthenticated: boolean;
  onRegister: (mode: 'in_presence' | 'remote', acceptedTerms: boolean, newsletter: boolean) => Promise<void>;
  onCancel: () => Promise<void>;
}
```

**Form Fields**:

1. **Attendance Mode Toggle** (required):
   - Radio buttons: In-Presence (default) | Remote
   - Visual: Two cards, selected has border-primary and bg-primary/5
   - Icons: MapPin for in-presence, Monitor for remote
   - Mobile: Vertical stack (full-width cards)
   - Desktop: Horizontal (50/50 split)

2. **Capacity Indicator**:
   - Always visible
   - Shows before registration (transparency)
   - Updates in real-time as others register (future: WebSocket)

3. **T&C Checkbox** (required):
   - Label: "I accept the [Terms & Conditions](/terms)"
   - Link opens in new tab or modal
   - Must be checked to enable Register button
   - Error if unchecked on submit: "You must accept the Terms & Conditions"

4. **Newsletter Checkbox** (optional):
   - Label: "Subscribe to community newsletter"
   - Default: Checked (opt-out pattern per Ch.30.6)
   - Info icon tooltip: "Event updates, new problems, community news"

5. **Register Button**:
   - Text: "Register for Event" or "Join Waitlist" if capacity full
   - Variant: primary
   - Size: large on mobile, default on desktop
   - Full-width on mobile
   - Loading state: Shows spinner, disabled, "Registering..."
   - Success: Toast notification + section updates to "You're registered"

**Registered State**:
```
┌──────────────────────────────────────────┐
│ ✓ You're Registered                      │
│                                          │
│ Attendance: In-Presence                  │
│ Registered: Feb 3, 2026                  │
│                                          │
│ [Cancel Registration]                    │
│                                          │
│ Add to Calendar:                         │
│ [Google] [Outlook] [iCal]                │
└──────────────────────────────────────────┘
```

**Cancel Flow**:
- Button: `variant="secondary"` or `variant="ghost"`
- Confirmation: ConfirmDialog "Are you sure? This will free up your spot."
- On confirm: DELETE registration, show toast, refresh waitlist

**Validation**:
- T&C must be checked
- Attendance mode must be selected
- Server-side: Verify capacity, handle race conditions

---

## Data Loading

**+page.server.ts** must fetch:
```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const { slug } = params;

  const event = await getEventBySlug(slug);
  const registration = locals.user ? await getRegistration(event.event_id, locals.user.user_id) : null;
  const registrationCount = await getRegistrationCount(event.event_id, 'in_presence');
  const waitlistCount = await getWaitlistCount(event.event_id);
  const problems = await getEventProblems(event.event_id);
  const partner = await getPartner(event.partner_id);

  return {
    event,
    registration,
    registrationCount,
    waitlistCount,
    problems,
    partner,
    isAuthenticated: !!locals.user
  };
};
```

**Actions** (form submissions):
```typescript
export const actions = {
  register: async ({ request, locals, params }) => {
    // Handle registration
  },
  cancel: async ({ request, locals, params }) => {
    // Handle cancellation
  }
};
```

---

## Testing Checklist

- [ ] Event header displays all metadata
- [ ] Event image loads or shows auto-generated fallback
- [ ] Registration section shows correct state (not registered / registered / waitlisted / invited)
- [ ] Attendance mode toggle works
- [ ] T&C link opens terms page
- [ ] Newsletter checkbox toggles
- [ ] Register button disabled when T&C unchecked
- [ ] Register button submits correctly
- [ ] Success toast shown on registration
- [ ] Cancel registration works with confirmation
- [ ] Capacity indicator shows correct color
- [ ] Waitlist notice appears when applicable
- [ ] Invitation countdown works
- [ ] Confirm/decline buttons work
- [ ] Problems list displays
- [ ] Problem cards link to problem URLs
- [ ] Partner information displays
- [ ] External links work (open in new tab)
- [ ] Past event variant shows stats instead of registration
- [ ] Mobile: All sections visible and functional at 375px
- [ ] Desktop: Two-column layout renders correctly
- [ ] Desktop: Sticky sidebar works

---

**Document Version**: 1.0.0
**Status**: Complete Specification
**Lines**: ~550
