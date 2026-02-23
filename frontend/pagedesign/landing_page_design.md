# Landing Page Design

**Route**: `/` (root)
**Purpose**: Public entry point, community showcase, event discovery
**Design Approach**: Custom (no template reuse per Decision #20)
**Status**: Retroactive + Enhancement Specification
**Created**: 2026-02-05

---

## Overview

Landing page is the FIRST impression of VibeCoding Professionals. Must convey:
1. **What we are**: Agentic, professional, requirements-driven community
2. **What we do**: Hackathon events comparing AI coding tools
3. **Why join**: Quality focus, "Pros for Pros" culture, cross-location community
4. **How to participate**: Browse events, register, submit problems

**Design Philosophy**: Custom hero, bold typography, generous whitespace, visual hierarchy through scale and color.

---

## Page Structure

### Full-Page Layout (Top to Bottom)

1. **Hero Section** (viewport height, custom design)
2. **Value Proposition** (3 cards explaining the platform)
3. **Upcoming Events** (grid, max 6 events)
4. **Past Events** (grid, max 6 events)
5. **Top Contributors** (leaderboard, last 6 weeks)
6. **Call to Action** (register, create problem)
7. **Footer** (links, legal, contact)

---

## Section 1: Hero Section

**Height**: 80vh on desktop, 60vh on mobile (adjust for readability)
**Background**: Gradient or geometric pattern (NOT solid color)

**Option A - Gradient Mesh**:
```css
background: radial-gradient(at 20% 30%, #2680F1 0%, transparent 50%),
            radial-gradient(at 80% 60%, #8B5CF6 0%, transparent 50%),
            radial-gradient(at 40% 80%, #55B368 0%, transparent 50%),
            #DCEBFF;
```

**Option B - Geometric Pattern**:
- Subtle grid or dot pattern on --color-viewport
- SVG pattern overlay at 5% opacity
- Animated (optional, respects prefers-reduced-motion)

**Content Layout**:
```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│        VibeCoding Professionals                    │ ← text-5xl md:text-6xl
│        ═══════════════════════                     │   font-bold
│                                                    │
│   Agentic. Professional. Requirements-Driven.     │ ← text-xl md:text-2xl
│                                                    │   Tagline
│                                                    │
│   Compare AI coding tools through structured       │ ← text-lg
│   evaluation at hackathon events.                  │   Description
│                                                    │
│   [Browse Events]  [Create Problem]               │ ← CTAs
│                                                    │
│                    [↓ Learn More]                  │ ← Scroll indicator
│                                                    │
└────────────────────────────────────────────────────┘
```

**Typography**:
- Title: text-5xl md:text-6xl lg:text-7xl, font-bold, text-headers
- Underline: Decorative element (SVG or border), --color-primary
- Tagline: text-xl md:text-2xl, font-medium, text-labels
- Description: text-lg md:text-xl, text-labels, max-w-2xl centered
- CTAs: Button size="lg", gap-4

**Buttons**:
- Browse Events: `variant="default"` (primary CTA)
- Create Problem: `variant="outline"` (secondary CTA)
- Both: size="lg" for prominence
- Mobile: Stack vertically, full-width
- Desktop: Horizontal, auto-width

**Scroll Indicator**:
- Animated bouncing arrow (ChevronDown icon)
- Subtle pulse animation
- Disappears on scroll
- Optional enhancement

---

## Section 2: Value Proposition

**Layout**: 3-card grid explaining platform benefits

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🎯 Rigorous │ │ 🤖 Agentic  │ │ 🏆 Quality  │
│             │ │             │ │             │
│ Evaluation  │ │ Tools       │ │ First       │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Card 1: Rigorous Evaluation**:
- Icon: 🎯 or custom SVG
- Title: "Structured Evaluation"
- Description: "Evaluate code quality across 6 dimensions: Correctness, Readability, Simplicity, Elegance, Extensibility, Test Support. Compare solutions semantically, not just syntactically."
- Link: "Learn about our quality dimensions →"

**Card 2: Agentic Tools**:
- Icon: 🤖 or Robot SVG
- Title: "Compare AI Coding Tools"
- Description: "One human + orchestrated multi-agent system. Compare Claude Code, Cursor, GitHub Copilot, and custom workflows on real problems. Tooling documentation required."
- Link: "See how it works →"

**Card 3: Quality First**:
- Icon: 🏆 or Star SVG
- Title: "Pros for Pros"
- Description: "Low barriers, high trust. Experienced practitioners who care about correctness, architecture, and long-term maintainability. From greenfield to brownfield."
- Link: "Read our philosophy →"

**Styling**:
- Cards: elevation="resting", p-6 md:p-8
- Icon: text-5xl or 48px SVG, mb-4
- Title: text-xl font-semibold, mb-2
- Description: text-labels, mb-4
- Link: text-primary, hover:underline

**Mobile**: Vertical stack
**Desktop**: 3-column grid with equal width
**Spacing**: gap-6 between cards

---

## Section 3: Upcoming Events

**Component**: `events/EventGrid.svelte` with `EventCard.svelte`
**Title**: "Upcoming Events"
**Data**: Events where starts_at > now, sorted by starts_at asc
**Limit**: 6 events (show next 6)

**Grid Layout**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**EventCard** (per Ch.26, Agent 4 implementation):
```
┌───────────────────────┐
│ [===== IMAGE =====]   │ ← 16:9 aspect
│                       │
│ VibeCoding Cologne    │ ← Title
│ Feb 28, 2026          │ ← Date
│ 18:00-21:00          │ ← Time
│                       │
│ 📍 STARTPLATZ         │ ← Location
│ [Partner Logo]        │ ← Small logo
│                       │
│ 32/30 registered      │ ← Capacity (green/yellow/red)
└───────────────────────┘
```

**Interaction**:
- Card is clickable link → /event/{slug}
- Hover: elevation changes from `resting` to `raised` (shadow deepens)
- Focus: Visible outline for keyboard navigation

**Empty State**:
If no upcoming events:
```
No upcoming events scheduled.

Check back soon or join our newsletter to be notified
when new events are announced.

[Subscribe to Newsletter]
```

**See All Link**:
If more than 6 events exist: "View All Events →" link below grid

---

## Section 4: Past Events

**Component**: Same EventGrid + EventCard
**Title**: "Past Events"
**Data**: Events where ends_at < now, sorted by ends_at desc
**Limit**: 6 events (most recent)

**EventCard Variant for Past**:
- Image: Slightly desaturated (filter: grayscale(20%))
- Badge: "Past" in grey (bg-canvas text-labels)
- Capacity replaced with stats: "24 participants, 3 problems"
- Hover: No elevation change (less emphasis)
- Click → /event/{slug} (past event detail variant)

**Empty State**: Hidden if no past events (likely won't happen after first event)

---

## Section 5: Top Contributors (Leaderboard)

**Component**: `dashboard/ContributorWall.svelte`
**Title**: "Top Contributors (Last 6 Weeks)"
**Data**: View `contributor_wall_6week` (Ch.19.3.36)
**Limit**: Top 10 contributors

**Layout - Podium Style** (Ch.12.8, Decision #25):

**Mobile**:
```
┌─────────────────────────────────────────┐
│ Top Contributors (Last 6 Weeks)         │
│                                         │
│          ┌─────────────────┐            │
│          │ 🥇 1st Place    │            │ ← Larger card
│          │ Eva Schmidt     │            │
│          │ 42 pts ⭐⭐⭐   │            │
│          │ 18 contributions │            │
│          └─────────────────┘            │
│                                         │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ 🥈 2nd Place │ │ 🥉 3rd Place │      │ ← Medium cards
│ │ Max M.       │ │ Lisa C.      │      │
│ │ 38 pts ⭐⭐  │ │ 35 pts ⭐    │      │
│ │ 15 contrib   │ │ 22 contrib   │      │
│ └──────────────┘ └──────────────┘      │
│                                         │
│ 4. Tom Weber      31 pts ⭐⭐           │ ← Standard rows
│ 5. Anna Müller    28 pts               │
│ 6. ...                                 │
└─────────────────────────────────────────┘
```

**Desktop**:
- 1st place: Large card (width: 60%), centered
- 2nd and 3rd: Medium cards (width: 40% each), side-by-side below 1st
- 4-10: List rows, two columns

**Podium Styling**:
- 1st: Scale 1.1, shadow-lg, medal 🥇, text-xl
- 2nd: Scale 1.05, shadow-md, medal 🥈, text-lg
- 3rd: Scale 1.05, shadow-md, medal 🥉, text-lg
- 4-10: Scale 1.0, shadow-sm, no medal, text-base

**Per Contributor**:
- Rank number or medal
- Display name (bold)
- Points (with "pts" suffix)
- Stars (⭐ emoji, count)
- Contribution count (smaller text)
- InitialAvatar (lg for top 3, md for 4-10)

**Privacy**: Only users with `show_on_contributor_wall = TRUE` appear (Ch.33.6.5)

**Empty State**:
```
No contributors yet.

Be the first to earn points by participating in
events, submitting problems, and providing feedback.
```

**See All Link**: "View Full Leaderboard →" (future: /contributors page)

---

## Section 6: Call to Action (CTA)

**Purpose**: Convert visitors to participants

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│     Ready to Join VibeCoding?           │
│                                         │
│  Browse upcoming events and register    │
│  or submit your own coding challenge.   │
│                                         │
│  [Register for Event]  [Submit Problem] │
│                                         │
└─────────────────────────────────────────┘
```

**Styling**:
- Background: bg-canvas (distinct from white cards above)
- Padding: py-16 (generous vertical space)
- Text: Centered, text-2xl for heading, text-lg for description
- Buttons: size="lg", gap-4

**Responsive**:
- Mobile: Buttons stack vertically, full-width
- Desktop: Buttons horizontal, auto-width

---

## Section 7: Footer

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ VibeCoding Professionals                                │
│                                                         │
│ [Navigate]          [Community]         [Legal]         │
│ • Events            • GitHub            • Terms         │
│ • Problems          • LinkedIn          • Privacy       │
│ • Dashboard         • Discord           • Code of Conduct│
│ • About             • Newsletter        • Contact       │
│                                                         │
│ © 2026 VibeCoding Professionals                         │
│ "Pros for Pros" - Low barriers, high trust             │
└─────────────────────────────────────────────────────────┘
```

**Styling**:
- Background: bg-canvas, border-t border-secondary
- Padding: py-12, px-4
- Columns: 3-column grid on desktop, vertical stack on mobile
- Links: text-labels hover:text-primary
- Copyright: text-meta, text-sm, text-center, mt-8

---

## Visual Design Details

### Three-Layer Depth

**Viewport**: Body bg-viewport (#DCEBFF) throughout
**Canvas**: Main container bg-canvas (#F1F2F8) with shadow-canvas
**Cards**: All sections bg-card (#FEFEFE) with shadow-card

**Hero Exception**: Hero can extend to viewport background (no canvas wrapper) for full-bleed effect.

---

### Typography Hierarchy

**Levels**:
1. Page title (Hero): text-5xl md:text-6xl lg:text-7xl, font-bold
2. Section headings: text-3xl md:text-4xl, font-bold, mb-8
3. Card titles: text-xl md:text-2xl, font-semibold
4. Body text: text-base md:text-lg
5. Meta text: text-sm md:text-base, text-labels

**Spacing**:
- Section gaps: 96px (py-24) for clear separation
- Card gaps: 24px (gap-6)
- Text line-height: 1.6 for readability

---

## Interaction Patterns

### Event Card Hover (Desktop)

**Default State**:
- elevation="resting"
- opacity: 1
- transform: scale(1)

**Hover State**:
- elevation="raised" (shadow deepens)
- transform: scale(1.02) (subtle lift)
- transition: 200ms ease-out

**Focus State**:
- outline: 2px solid --color-primary
- outline-offset: 2px

**Active State**:
- transform: scale(0.98) (press effect)

---

## Responsive Breakpoints

### Mobile (<640px)

**Hero**:
- Title: text-4xl (smaller for fit)
- Tagline: text-lg
- Description: text-base
- CTAs: Vertical stack, full-width buttons
- Height: 60vh (less viewport usage)

**Value Proposition**: Vertical stack, 3 cards
**Events**: 1 column, show 3 upcoming + 3 past
**Contributors**: Vertical list, podium styling preserved

**Scroll Behavior**:
- Hero scrolls normally (no parallax on mobile)
- Sections revealed as user scrolls

### Desktop (≥1024px)

**Hero**:
- Title: text-7xl (maximum impact)
- Full 80vh height
- Parallax scroll (optional): Hero scrolls slower than content

**Value Proposition**: 3-column grid, equal width
**Events**: 3-column grid, 6 events visible
**Contributors**: Podium layout with 1st centered large, 2nd/3rd side-by-side

---

## Data Loading

**+page.server.ts**:
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  const upcomingEvents = await getUpcomingEvents(6); // Next 6
  const pastEvents = await getPastEvents(6); // Last 6
  const topContributors = await getTopContributors(10, 6); // Top 10, last 6 weeks

  const stats = {
    totalEvents: await countEvents(),
    totalParticipants: await countUniqueParticipants(),
    totalProblems: await countProblems(),
    activeLocations: await countActiveLocations()
  };

  return {
    upcomingEvents,
    pastEvents,
    topContributors,
    stats,
    isAuthenticated: !!locals.user
  };
};
```

**Caching**:
- Events: Cache for 5 minutes (frequently changing)
- Contributors: Cache for 1 hour (updates slowly)
- Stats: Cache for 1 day (rarely changes significantly)

---

## SEO & Meta Tags

**svelte:head**:
```html
<svelte:head>
  <title>VibeCoding Professionals - Agentic Coding Events</title>
  <meta name="description" content="Compare AI coding tools through structured evaluation at hackathon events. Professional, requirements-driven, quality-first community." />

  <!-- Open Graph -->
  <meta property="og:title" content="VibeCoding Professionals" />
  <meta property="og:description" content="Agentic coding events..." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="VibeCoding Professionals" />
  <meta name="twitter:description" content="..." />
  <meta name="twitter:image" content="/og-image.png" />
</svelte:head>
```

**OG Image**: Create 1200×630px image with:
- VibeCoding logo/wordmark
- Tagline
- Key metric or value prop
- Professional aesthetic

---

## Accessibility

**Page Structure**:
```html
<main role="main">
  <section aria-labelledby="hero-heading">
    <h1 id="hero-heading">VibeCoding Professionals</h1>
  </section>

  <section aria-labelledby="value-heading">
    <h2 id="value-heading">Why VibeCoding</h2>
  </section>

  <section aria-labelledby="upcoming-heading">
    <h2 id="upcoming-heading">Upcoming Events</h2>
  </section>

  <!-- etc -->
</main>
```

**Skip Links** (hidden, visible on focus):
- Skip to upcoming events
- Skip to registration
- Skip to footer

**Color & Contrast**:
- All text meets 4.5:1 contrast ratio
- Hero text on gradient background: Test with contrast checker
- Ensure readability on all gradient areas

**Motion**:
- All animations optional (prefers-reduced-motion fallback)
- Content accessible without animation
- No motion-induced nausea (avoid rapid movements)

---

## Performance Optimization

**Critical Metrics**:
- Largest Contentful Paint (LCP): <2.5s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1

**Strategies**:
- Hero image: Preload, optimized WebP format
- Event images: Lazy load below fold
- Contributor avatars: CSS-only (no image fetches)
- Animations: CSS only (no JS)
- Fonts: System font stack (no web fonts for speed)

**Bundle Size**:
- Landing page should be <100KB gzipped
- Code splitting: Admin routes lazy loaded
- Tree shaking: Import only used icons

---

## Testing Checklist

- [ ] Hero displays with correct typography scale
- [ ] Hero CTAs work (browse events, create problem)
- [ ] Value proposition cards render
- [ ] Upcoming events grid shows next 6 events
- [ ] Event cards link to event detail pages
- [ ] Event card hover effect works (desktop)
- [ ] Past events grid shows last 6 events
- [ ] Contributor wall displays top 10
- [ ] Podium styling for top 3 (larger, medals)
- [ ] Standard rows for 4-10
- [ ] Privacy: Only opted-in contributors shown
- [ ] CTA section visible
- [ ] Footer links work
- [ ] Mobile: All sections stack vertically
- [ ] Mobile: Event cards full-width
- [ ] Mobile: Contributors vertical list
- [ ] Desktop: 3-column grids render
- [ ] Desktop: Two-column value props
- [ ] Animations trigger on scroll
- [ ] Animations respect prefers-reduced-motion
- [ ] SEO meta tags present
- [ ] OG image configured
- [ ] Page loads in <3s on 3G
- [ ] No layout shift (CLS)
- [ ] All images have alt text
- [ ] All links have descriptive text
- [ ] Keyboard navigation works
- [ ] Screen reader announces sections

---

**Document Version**: 1.0.0
**Lines**: ~450
**Status**: Complete
