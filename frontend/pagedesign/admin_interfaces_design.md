# Admin Interfaces Design

**Routes**: `/admin/*` (overview, items, inventories, events, users, csv-import, catalogs)
**Purpose**: System administration and content management
**Critical Requirement**: Full smartphone compatibility (Ch.17.0)
**Created**: 2026-02-05

---

## Mobile Administration Guarantee

**Ch.17.0 States**:
> "The platform guarantees full administrative functionality on devices as small as 375px width (iPhone SE)."

**Design Patterns**:
1. Vertical scroll for complex forms
2. Touch-friendly controls (44×44px minimum)
3. Full-width inputs with 16px margins
4. Native pickers for date/time
5. Table→Card transformation for lists
6. Wizard flows for multi-step operations

**Testing Requirement**: Every admin interface verified at 375px viewport.

---

## Admin Overview (/admin)

**Purpose**: Dashboard showing system health and quick navigation

**Layout**:
```
┌──────────────────────────────────────────┐
│ System Administration                    │
│                                          │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ 👥 Users    │ │ 📅 Events   │        │
│ │ 156 total   │ │ 12 total    │        │
│ └─────────────┘ └─────────────┘        │
│                                          │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ 📝 Problems │ │ 📊 Items    │        │
│ │ 45 total    │ │ 18 active   │        │
│ └─────────────┘ └─────────────┘        │
│                                          │
│ Health Indicators:                       │
│ ✓ 2 active events                       │
│ ✓ 3 open assessments                    │
│ ⚠️ 5 retired items (cleanup needed)     │
│ ✓ 2 pending registrations               │
│                                          │
│ Quick Actions:                           │
│ [Create Event] [Create Item]            │
│ [Import Users] [View Logs]              │
└──────────────────────────────────────────┘
```

**Stats Cards**:
- Icon (emoji or Lucide)
- Count (text-3xl font-bold)
- Label (text-sm text-labels)
- Click → Navigate to section
- Card: elevation="resting", hover="raised"

**Health Indicators**:
- Green ✓ : Everything OK
- Yellow ⚠️ : Attention needed
- Red ✗ : Issue requiring action
- Each indicator clickable → relevant admin section

**Mobile**: 2-column grid for stats, vertical list for health, stacked quick actions
**Desktop**: 4-column grid for stats, 2-column for health, horizontal quick actions

---

## Item Management (/admin/items)

**Component**: `admin/ItemEditor.svelte`
**Purpose**: Create, edit, retire evaluation items
**Critical**: All fields accessible at 375px (Issue #15)

**Page Layout**:
```
┌──────────────────────────────────────────┐
│ Item Management                          │
│                                          │
│ [Create New Item]  [Show Retired]        │
│                                          │
│ Active Items (18):                       │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ correctness              Rating: 5   │ │
│ │ "The solution meets the stated..."   │ │
│ │ [Edit] [Clone] [Retire]              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {17 more items}                          │
└──────────────────────────────────────────┘
```

**List Display**:
- Desktop: DataTable (table with columns: Key, Label, Rating, Status, Actions)
- Mobile: TableCard (cards with key info)

**Item Editor Modal** (FormDialog, full-screen on mobile):

**Mobile Layout** (375px, all fields vertical):
```
┌────────────────────────────────────┐
│ [×] Create New Item                │ ← Header with close
│                                    │
│ Item Key *                         │
│ [correctness______________]        │ ← Text input, full-width
│                                    │
│ Short Label *                      │
│ [Correctness______________]        │
│                                    │
│ Item Text (Full Question) *        │
│ [_________________________]        │ ← Textarea, 4 rows
│ [_________________________]        │
│ [_________________________]        │
│                                    │
│ Max Rating *                       │
│ [5                      ▼]         │ ← Select dropdown
│                                    │
│ ─── Labels for 5-Point Scale ───   │ ← Section divider
│                                    │
│ Label (Minimum Rating) *           │
│ [Poor_____________________]        │
│                                    │
│ Label (Low-Mid) *                  │
│ [Fair_____________________]        │
│                                    │
│ Label (Mid) *                      │
│ [Good_____________________]        │
│                                    │
│ Label (High-Mid) *                 │
│ [Very Good________________]        │
│                                    │
│ Label (Maximum Rating) *           │
│ [Excellent________________]        │
│                                    │
│ Category (Optional)                │
│ [outcome__________________]        │
│                                    │
│ Internal Notes (Optional)          │
│ [_________________________]        │ ← Textarea, 2 rows
│                                    │
│ [Cancel]        [Save Item]        │ ← Footer buttons
└────────────────────────────────────┘
```

**Field Validation**:
- Item Key: Required, lowercase, underscores only, unique
- Short Label: Required, 1-30 characters
- Item Text: Required, 10-500 characters
- Max Rating: Required, integer, 1-10 (dropdown options)
- Labels: Required if max_rating uses them (dynamic based on scale)
  - 2-point: label_min, label_max only
  - 3-point: label_min, label_mid, label_max
  - 5-point: All 5 labels
  - 7-point: All 7 labels OR endpoints + mid
  - 10-point: Endpoints only (slider scale)

**Vertical Scroll**:
- Modal content scrollable
- Footer buttons sticky at bottom
- Scroll indicator if content doesn't fit viewport
- Total height: ~800px for 5-point scale item
- Viewport: 375px × 667px (iPhone SE) - requires scroll ✓ ACCEPTABLE

**Desktop (≥768px)**:
- Modal: max-width 600px, centered
- Fields: Can show labels beside inputs (2-column for simple fields)
- Less scrolling needed
- More field grouping

---

## Inventory Management (/admin/inventories)

**Component**: `admin/InventoryEditor.svelte`
**Purpose**: Create inventories by selecting and ordering items
**Critical**: Shuttle pattern must work on mobile (Ch.26.12.2, Issue #16)

**Page Layout**:
```
┌──────────────────────────────────────────┐
│ Inventory Management                     │
│                                          │
│ [Create New Inventory]  [Show Retired]   │
│                                          │
│ Active Inventories (5):                  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ pitch_assessment                     │ │
│ │ "Pitch Assessment"                   │ │
│ │ 6 items • Used in 12 assessments     │ │
│ │ [Edit] [Clone] [Retire]              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {4 more inventories}                     │
└──────────────────────────────────────────┘
```

**Inventory Editor - Desktop** (side-by-side shuttle):
```
┌─────────────────────────────────────────────────────────┐
│ Edit Inventory: pitch_assessment                        │
│                                                         │
│ Name: [Pitch Assessment_____________________]           │
│ Description: [Live voting during pitches____]           │
│                                                         │
│ ┌───────────────────────┬───┬─────────────────────────┐ │
│ │ Available Items       │   │ Inventory Items         │ │
│ ├───────────────────────┤   ├─────────────────────────┤ │
│ │ [Search items...___]  │   │                         │ │
│ │                       │   │ 1. problem_clarity  [↑↓]│ │
│ │ ☐ correctness         │   │ 2. testability      [↑↓]│ │
│ │ ☐ test_support        │[>]│ 3. complexity       [↑↓]│ │
│ │ ☐ code_readability    │   │ 4. personal_value   [↑↓]│ │
│ │ ☐ simplicity          │   │ 5. general_import...[↑↓]│ │
│ │ ☐ elegance            │[<]│ 6. engagement       [↑↓]│ │
│ │ ...                   │   │                         │ │
│ └───────────────────────┴───┴─────────────────────────┘ │
│                                                         │
│ [Cancel]                                     [Save]     │
└─────────────────────────────────────────────────────────┘
```

**Inventory Editor - Mobile** (vertical stacking):
```
┌────────────────────────────────────┐
│ [×] Edit Inventory                 │
│                                    │
│ Name *                             │
│ [Pitch Assessment______________]   │
│                                    │
│ Description                        │
│ [Live voting during pitches____]   │
│ [______________________________]   │
│                                    │
│ ─── Available Items ───            │
│                                    │
│ [Search... ___________________]    │
│                                    │
│ ☐ correctness                      │
│ ☐ test_support                     │
│ ☐ code_readability                 │
│ ☐ simplicity                       │
│ ☐ elegance                         │
│ ... (scrollable)                   │
│                                    │
│ [Add Selected Items ↓]             │ ← Full-width
│                                    │
│ ─── Inventory Items (ordered) ───  │
│                                    │
│ 1. problem_clarity    [↑] [↓] [×]  │
│ 2. testability       [↑] [↓] [×]  │
│ 3. complexity        [↑] [↓] [×]  │
│ 4. personal_value    [↑] [↓] [×]  │
│ 5. general_importance [↑] [↓] [×]  │
│ 6. engagement        [↑] [↓] [×]  │
│                                    │
│ [Cancel]           [Save Inventory]│
└────────────────────────────────────┘
```

**Mobile Interaction**:
1. **Select Items**:
   - Search filters available items list
   - Tap checkbox to select
   - Can select multiple

2. **Add to Inventory**:
   - Tap "Add Selected Items" button (full-width, 48px height)
   - Selected items move to Inventory Items list
   - Appear at end of list (highest position)
   - Checkboxes clear

3. **Reorder**:
   - Tap ↑ button: Move item up one position
   - Tap ↓ button: Move item down one position
   - Position numbers update automatically
   - Buttons: 44×44px touch targets (square icon buttons)

4. **Remove**:
   - Tap × button: Remove item from inventory
   - Returns to Available Items list
   - Position numbers reflow

**Alternative Reordering** (if preferred):
- Drag handles (☰ icon) before each item
- Touch and drag to reorder
- Visual feedback during drag (item lifts, drop zones highlighted)

**Validation**:
- Inventory key: Required, unique, lowercase, underscores
- Name: Required, 1-100 characters
- Items: Must have at least 1 item
- No duplicate items in inventory

**Desktop Benefits**:
- See both lists simultaneously
- Shuttle buttons (>) and (<) move items
- Drag-and-drop reordering
- Less scrolling

**Mobile Trade-offs**:
- More scrolling between lists
- Sequential operations (select, add, reorder)
- But: Fully functional, all operations possible

---

## Event Management (/admin/events)

**Component**: `admin/EventEditor.svelte`
**Purpose**: Create and manage events
**Scalability**: Uses Scalable List View pattern (Ch.12.10) — same SearchBar, ListFilterBar, Pagination components as User Management

**Event List**:
- DataTable: Partner, Location, Date, Registrations, Status
- Mobile: Cards showing key info
- Filters: Upcoming / Past / All, Location filter
- Search: By event title, location, partner name (SearchBar, 300ms debounce)
- Pagination: Server-side, 20 per page (Pagination component)
- URL state: `/admin/events?status=upcoming&location=cologne&search=march&page=1`
- Actions: Edit, View Registrations, Duplicate, Delete

**Event Editor Form** (Mobile, vertical scroll):
```
┌────────────────────────────────────┐
│ [×] Create Event                   │
│                                    │
│ Title *                            │
│ [VibeCoding Cologne March______]   │
│                                    │
│ Description                        │
│ [Join us for an evening of____]    │
│ [___________________________]      │ ← Textarea, 4 rows
│                                    │
│ Partner *                          │
│ [STARTPLATZ              ▼]        │ ← Select
│                                    │
│ Room *                             │
│ [Workshop Room A         ▼]        │ ← Select (filtered by partner location)
│                                    │
│ Start Date *                       │
│ [02/28/2026            📅]         │ ← Native date picker
│                                    │
│ Start Time *                       │
│ [18:00                 🕐]         │ ← Native time picker
│                                    │
│ Duration (hours) *                 │
│ [3_________________________]       │ ← Number input
│                                    │
│ Host *                             │
│ [Max Mustermann          ▼]        │ ← Select (moderators only)
│                                    │
│ Co-Host 1 (Optional)               │
│ [None                    ▼]        │
│                                    │
│ Co-Host 2 (Optional)               │
│ [None                    ▼]        │
│                                    │
│ ─── External Links ───             │
│                                    │
│ Website URL                        │
│ [https://___________________]      │
│                                    │
│ LinkedIn Post URL                  │
│ [https://___________________]      │
│                                    │
│ X (Twitter) Post URL               │
│ [https://___________________]      │
│                                    │
│ ─── Capacity Management ───        │
│                                    │
│ Overbooking Factor                 │
│ [1.30______] (130%)                │ ← Number input with helper
│                                    │
│ Effective Capacity: 39             │ ← Calculated (room × factor)
│ (Room base: 30)                    │
│                                    │
│ ─── Optional Customization ───     │
│                                    │
│ Custom Event Image                 │
│ [Choose File] No file chosen       │ ← FileUpload component
│ (Leave empty for auto-generated)   │
│                                    │
│ [Cancel]          [Create Event]   │
└────────────────────────────────────┘
```

**Total Fields**: 14 (8 required, 6 optional)
**Scroll Height**: ~1000px on mobile
**Validation**:
- All required fields must be filled
- Start date: Must be future
- Duration: 1-8 hours reasonable range
- Overbooking: 1.0-2.0 reasonable range
- URLs: Valid format (https://)

**Mobile Testing**:
- All fields visible via scroll ✓
- Native date/time pickers work ✓
- Select dropdowns touch-friendly ✓
- FileUpload works (click to browse) ✓
- No horizontal overflow ✓

**Desktop**:
- Two-column for some fields (e.g., Date + Time side-by-side)
- Less scrolling
- Drag-drop for event image

---

## User Management (/admin/users)

**Component**: `admin/UserList.svelte`
**Purpose**: View and manage user accounts
**Data**: All users with role, email status, events attended
**Scalability**: Server-side pagination required — user list can grow to thousands (Ch.12.10, Ch.17.5)

### Scalable List View Pattern (TICKET-30)

**Added 2026-02-25**: All admin list views follow the Scalable List View pattern (Ch.12.10, Ch.26.17) to ensure graceful scaling. This section documents the shared pattern; subsequent sections show page-specific applications.

**Page Header with Search**:
```
Desktop:
┌──────────────────────────────────────────────────────────┐
│ User Management (247 users)             [🔍 Search…    ] │
│                                                          │
│ [All Roles ▼] [Email Status ▼] [Sort: Name A-Z ▼]      │
│                                              Clear all   │
├──────────────────────────────────────────────────────────┤

Mobile:
┌──────────────────────────────────┐
│ User Management                  │
│ 247 users                        │
│                                  │
│ [🔍 Search users…_____________] │
│                                  │
│ [All Roles] [Email ▼] [Sort ▶] │ ← Scrollable pills
├──────────────────────────────────┤
```

**Components Used**:
- `ui/SearchBar.svelte` (Ch.26.17.2) — debounced, 300ms, min 2 chars
- `ui/ListFilterBar.svelte` (Ch.26.17.3) — dropdowns or pill bar
- `ui/Pagination.svelte` (Ch.26.17.1) — numbered pages (desktop) / prev-next (mobile)

**URL State**: All filters, search, sort, and page encoded in query params:
```
/admin/users?search=eva&role=moderator&email=confirmed&sort=name_asc&page=1
```

**Server-Side Query Pattern**:
```typescript
// +page.server.ts
const page = parseInt(url.searchParams.get('page') || '1');
const search = url.searchParams.get('search') || '';
const role = url.searchParams.get('role') || 'all';
const emailStatus = url.searchParams.get('email') || 'all';
const sort = url.searchParams.get('sort') || 'name_asc';

const result = await listUsersPaginated({
  page, pageSize: 20, search, role, emailStatus, sort
});
// Returns: { items: User[], pagination: { page, pageSize, totalItems, totalPages } }
```

### User List Page Layout

**User List Table** (Desktop ≥768px):
```
┌──────────────────────────────────────────────────────────┐
│ | Email             | Name      | Role | ✉ | Events | ⋮ |│
│ |-------------------|-----------|------|---|--------|---|│
│ | max@example.com   | Max M.    | Dev  | ✓ | 5      | ⋮ |│
│ | eva@example.com   | Eva S.    | Mod  | ✓ | 8      | ⋮ |│
│ | tom@example.com   | Tom W.    | Dev  | ✗ | 0      | ⋮ |│
│ | {17 more rows}                                        │
│                                                          │
│ Showing 1-20 of 247    [◀ Prev] 1 [2] 3 … 13 [Next ▶] │
└──────────────────────────────────────────────────────────┘
```

**User List Cards** (Mobile <768px):
```
┌──────────────────────────────────┐
│ Max Mustermann              [⋮]  │
│ max@example.com                  │
│ Developer • 5 events • ✓         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Eva Schmidt                 [⋮]  │
│ eva@example.com                  │
│ Moderator • 8 events • ✓        │
└──────────────────────────────────┘

[◀ Prev]  Page 2 of 13  [Next ▶]
```

**ActionMenu** (⋮) contains:
- Edit User (email, name, role)
- Promote to Moderator (if developer)
- Demote (if moderator, requires confirmation)
- Resend Confirmation Email (if not confirmed)
- View Activity Log
- Disable Account (soft delete, requires confirmation)

**Filter Configuration**:
```typescript
const filters: FilterConfig[] = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'all', label: 'All Roles' },
      { value: 'observer', label: 'Observer' },
      { value: 'developer', label: 'Developer' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'admin', label: 'Admin' },
      { value: 'agent', label: 'Agent' },
    ],
    defaultValue: 'all',
  },
  {
    key: 'email',
    label: 'Email Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'unconfirmed', label: 'Unconfirmed' },
    ],
    defaultValue: 'all',
  },
];
```

**Sort Options**:
- Name A-Z (default)
- Name Z-A
- Newest First
- Oldest First
- By Role

**Mobile Filter UI**:
- Horizontal scrollable pill bar (replaces previous FilterBottomSheet approach)
- Active pills highlighted with `border-primary text-primary`
- Same components as Problem Backlog and Events Listing for consistency

**Bulk Actions** (Future):
- Select multiple users (checkboxes)
- Bulk promote, bulk email, bulk disable
- Action bar at bottom when items selected

**CSV Import Link**:
- Prominent button: "Import Users from CSV"
- Routes to /admin/csv-import

---

## CSV Import (/admin/csv-import)

**Component**: `admin/CSVImportWizard.svelte`
**Purpose**: Bulk import users from partner-provided lists
**Pattern**: 4-step wizard (Ch.26.12.4, Decision #27)

**Wizard Steps**:

### Step 1: Upload CSV

```
┌────────────────────────────────────┐
│ Step 1 of 4: Upload CSV File       │
│                                    │
│ ┌────────────────────────────────┐ │
│ │  Drop CSV file here            │ │
│ │  or click to browse            │ │
│ │                                │ │
│ │  [Choose File]                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ Expected columns:                  │
│ • email (required)                 │
│ • display_name (required)          │
│ • event_slug (optional)            │
│ • in_presence (optional)           │
│                                    │
│ [Download Template CSV]            │
│                                    │
│ Or paste CSV data:                 │
│ [_________________________]        │ ← Alternative: textarea
│ [_________________________]        │
│                                    │
│          [Cancel] [Next →]         │
└────────────────────────────────────┘
```

**Validation**:
- File type: .csv or .txt only
- File size: <1MB
- Parse CSV on upload
- Show errors: Invalid CSV format, missing columns

**Mobile**: FileUpload component (click to browse, no drag-drop)

### Step 2: Preview Data (Mobile: Cards)

```
┌────────────────────────────────────┐
│ Step 2 of 4: Preview Import        │
│                                    │
│ 50 rows parsed                     │
│ • 35 new users to create           │
│ • 15 existing users found          │
│ • 48 event registrations           │
│ • 2 validation errors              │
│                                    │
│ Preview (showing first 10):        │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ✓ Max Mustermann               │ │ ← Green check: valid
│ │   max@example.com              │ │
│ │   → New user, register for     │ │
│ │      cologne-march-2026        │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ⚠ Invalid Email                │ │ ← Yellow warning: error
│ │   not-an-email                 │ │
│ │   → Will be skipped            │ │
│ └────────────────────────────────┘ │
│                                    │
│ {8 more preview cards}             │
│                                    │
│ [Show All Rows]                    │
│                                    │
│ [← Back] [Next →]                  │
└────────────────────────────────────┘
```

**Desktop**: Can use table for preview (more compact)
**Mobile**: Cards show essential info, scrollable list

**Validation Display**:
- Valid rows: Green check icon
- Existing users: Blue info icon "Existing user, will link to event"
- Errors: Red X icon with reason
- Warnings: Yellow warning icon

### Step 3: Confirm Import

```
┌────────────────────────────────────┐
│ Step 3 of 4: Confirm Import        │
│                                    │
│ Ready to import:                   │
│ • Create 35 new users              │
│ • Link 15 existing users           │
│ • Create 48 event registrations    │
│ • Skip 2 invalid rows              │
│                                    │
│ Default event for registrations:   │
│ [cologne-march-2026      ▼]        │
│                                    │
│ ☑ Send onboarding emails to new   │
│    users with OTP                  │
│                                    │
│ ☑ Subscribe all to newsletter      │
│    (they can opt-out later)        │
│                                    │
│ ⚠️ This action cannot be undone.   │
│   Users will receive emails.       │
│                                    │
│ [← Back] [Confirm Import]          │
└────────────────────────────────────┘
```

**Confirmation**:
- Summary of actions (create, link, register, skip)
- Options: Send emails, newsletter subscription
- Warning about irreversibility
- Import button: `variant="default"` (not destructive, just important)

### Step 4: Import Report

```
┌────────────────────────────────────┐
│ Step 4 of 4: Import Complete       │
│                                    │
│ ✓ Import Successful                │
│                                    │
│ Results:                           │
│ • 35 users created                 │
│ • 15 existing users found          │
│ • 48 registrations created         │
│ • 2 rows skipped (invalid email)   │
│ • 35 onboarding emails queued      │
│                                    │
│ Errors (2):                        │
│ Row 12: "not-an-email" invalid     │
│ Row 27: "test@test" invalid domain │
│                                    │
│ [Download Error Report]            │
│ [View User List]                   │
│ [Import Another CSV]               │
│                                    │
│            [Done]                  │
└────────────────────────────────────┘
```

**Success State**:
- Green checkmark, success message
- Detailed breakdown of actions
- Any errors listed with row numbers
- Next action buttons

**Failure State**:
- Red X, error message
- Detailed error explanation
- Retry button
- Back to step 1

---

## Partner/Location/Room Management

**Component**: `admin/PartnerEditor.svelte`
**Purpose**: Manage hosting organizations and venues

**Three Forms in One Component** (mode prop):

### Mode: Partner

**Fields** (vertical on mobile):
- Name *
- Partner Type * (dropdown: Co-Working, University, Company, Community)
- Description (textarea)
- Logo URL
- Website URL
- Contact Name
- Contact Email

**Mobile**: 7 fields, ~450px scroll height

### Mode: Location

**Fields**:
- Name * (e.g., "STARTPLATZ Köln")
- Address *
- City *

**Mobile**: 3 fields, ~250px height (no scroll needed)

### Mode: Room

**Fields**:
- Name * (e.g., "Workshop Room A")
- Location * (dropdown of locations)
- Max Capacity (with tables) *
- Max Capacity (without tables) *

**Mobile**: 4 fields, ~300px height

All forms: Full-width inputs, 44px height, vertical labels.

---

## Catalog & Weight Management (/admin/catalogs)

**Component**: `admin/CatalogEditor.svelte`
**Purpose**: Manage soft catalogs and tunable weights (Ch.17.10)
**Spec**: Ch.17.10 (Catalog and Weight Management)

### Tabbed Navigation

Five tabs, one per manageable catalog:

1. **Problem Types** — `problem_type_catalog`
2. **Emojis** — `emoji_catalog`
3. **Lesson Categories** — `lesson_category_catalog`
4. **Contribution Weights** — `contribution_action_catalog`
5. **Review Weights** — `review_weight_catalog`

**Desktop** (≥768px): Standard horizontal tab bar.
**Mobile** (<768px): Horizontal scrollable pill tabs (overflow-x-auto).

### Page Layout (Desktop)

```
┌──────────────────────────────────────────────────────┐
│ Catalog & Weight Management                          │
│                                                      │
│ [Problem Types] [Emojis] [Lessons] [Contrib] [Review]│
│ ─────────────────────────────────────────────────    │
│                                                      │
│ [+ Add Problem Type]     [Show Inactive]             │
│                                                      │
│ | Key              | Display Name      | Active | ⋮ |│
│ |------------------|-------------------|--------|---|│
│ | greenfield       | Greenfield        | ✓      | ⋮ |│
│ | explorative      | Explorative       | ✓      | ⋮ |│
│ | brownfield       | Brownfield        | ✓      | ⋮ |│
│ | advanced_greenf… | Advanced Greenf…  | ✓      | ⋮ |│
│ | reverse_engineer…| Reverse Engineer… | ✓      | ⋮ |│
│ | other            | Other             | ✓      | ⋮ |│
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Page Layout (Mobile — Cards)

```
┌────────────────────────────────────┐
│ Catalog & Weight Management        │
│                                    │
│ [Problem Types ▾] [Emojis] [Less…] │ ← Scrollable pills
│                                    │
│ [+ Add Problem Type]               │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ greenfield              Active │ │
│ │ "Greenfield"                   │ │
│ │ New project from scratch       │ │
│ │ [Edit] [Deactivate]           │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ explorative             Active │ │
│ │ "Explorative"                  │ │
│ │ Early-stage idea exploration   │ │
│ │ [Edit] [Deactivate]           │ │
│ └────────────────────────────────┘ │
│                                    │
│ {4 more entries}                   │
└────────────────────────────────────┘
```

### Emoji Tab (Special Layout)

Emojis display the emoji character prominently:

```
┌────────────────────────────────────┐
│ [+ Add Emoji]                      │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 👍  Thumbs Up           Active │ │
│ │ [Edit Name] [Deactivate]       │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 👎  Thumbs Down         Active │ │
│ │ [Edit Name] [Deactivate]       │ │
│ └────────────────────────────────┘ │
│                                    │
│ {8 more emojis}                    │
└────────────────────────────────────┘
```

### Contribution Weights Tab

Shows current vs default points with inline editing:

```
┌────────────────────────────────────────────────┐
│ [+ Add Action]                                  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ review_assessment_completed          Active │ │
│ │ "Review Assessment"                         │ │
│ │ Completed a review assessment               │ │
│ │ Default: 1pt   Current: [1___]pt  [Save]   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ valuable_contribution                Active │ │
│ │ "Valuable Contribution"                     │ │
│ │ Chat/lesson with ≥2 reactions               │ │
│ │ Default: 1pt   Current: [1___]pt  [Save]   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ {3 more actions}                                │
└────────────────────────────────────────────────┘
```

### Review Weights Tab

Shows multiplier values with inline editing:

```
┌────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ live_review                          Active │ │
│ │ "Live Review"                               │ │
│ │ Review during event (time-constrained)      │ │
│ │ Multiplier: [1.00___]x              [Save] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ post_event_review                    Active │ │
│ │ "Post-Event Review"                         │ │
│ │ Review after event (more time to verify)    │ │
│ │ Multiplier: [1.50___]x              [Save] │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ agent_review                         Active │ │
│ │ "Agent Review"                              │ │
│ │ AI agent assessment (supporting)            │ │
│ │ Multiplier: [0.50___]x              [Save] │ │
│ └─────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### Add/Edit Entry Modal (FormDialog)

**For Soft Catalogs** (problem types, lesson categories):
```
┌────────────────────────────────────┐
│ [×] Add Problem Type               │
│                                    │
│ Key *                              │
│ [brownfield_legacy____________]    │ ← Lowercase, underscores
│                                    │
│ Display Name *                     │
│ [Brownfield Legacy___________]     │
│                                    │
│ Description                        │
│ [Working with aging codebase_]     │ ← Textarea, 2 rows
│ [___________________________]      │
│                                    │
│ Sort Order *                       │
│ [7_____________]                   │ ← Number input
│                                    │
│ [Cancel]            [Add Entry]    │
└────────────────────────────────────┘
```

**For Emojis**:
```
┌────────────────────────────────────┐
│ [×] Add Emoji                      │
│                                    │
│ Emoji Character *                  │
│ [🎯____________________________]  │ ← Single emoji input
│                                    │
│ Display Name *                     │
│ [Bullseye____________________]     │
│                                    │
│ Sort Order *                       │
│ [11____________]                   │
│                                    │
│ [Cancel]            [Add Emoji]    │
└────────────────────────────────────┘
```

**For Contribution Actions**:
```
┌────────────────────────────────────┐
│ [×] Add Contribution Action        │
│                                    │
│ Action Key *                       │
│ [late_review_completed_______]     │
│                                    │
│ Display Name *                     │
│ [Late Review Completed_______]     │
│                                    │
│ Description                        │
│ [Review submitted after event]     │
│ [___________________________]      │
│                                    │
│ Default Points *                   │
│ [1_____________]                   │
│                                    │
│ Current Points *                   │
│ [1_____________]                   │
│                                    │
│ [Cancel]           [Add Action]    │
└────────────────────────────────────┘
```

### Deactivation Confirmation

When toggling a catalog entry inactive, show ConfirmDialog:

```
┌────────────────────────────────────┐
│ Deactivate "greenfield"?           │
│                                    │
│ This will prevent "Greenfield"     │
│ from being used in new problems.   │
│ Existing problems with this type   │
│ will not be affected.              │
│                                    │
│ [Cancel]           [Deactivate]    │
└────────────────────────────────────┘
```

### Validation

- Key: Required, lowercase, underscores only (`^[a-z][a-z0-9_]*$`), unique within catalog
- Display Name: Required, 1-60 characters
- Emoji: Required, must be a single valid emoji character
- Sort Order: Required, positive integer
- Points/Weight: Required, positive number (integer for points, decimal for multiplier)

### Data Loading

- All catalogs load all entries (low counts, no pagination)
- Active entries sorted by sort_order, inactive appended after

---

## Mobile Testing Requirements

**Every admin interface tested at 375px**:

| Interface | Test | Pass/Fail |
|-----------|------|-----------|
| Admin Overview | Stats cards display | [ ] |
| Item List | Table→Card transform | [ ] |
| Item Editor | All 8 fields scroll-accessible | [ ] |
| Inventory List | Table→Card transform | [ ] |
| Inventory Editor | Vertical shuttle functional | [ ] |
| Inventory Editor | Reorder buttons 44×44px | [ ] |
| Event List | Table→Card transform | [ ] |
| Event Editor | All 14 fields scroll-accessible | [ ] |
| Event Editor | Native date/time pickers | [ ] |
| User List | Table→Card transform | [ ] |
| User List | Search works | [ ] |
| User List | ActionMenu accessible | [ ] |
| CSV Upload | File input works | [ ] |
| CSV Preview | Cards readable | [ ] |
| CSV Wizard | 4 steps navigate correctly | [ ] |
| Partner Editor | All fields accessible | [ ] |
| Catalog Tabs | Horizontal scroll pills | [ ] |
| Catalog List | Table→Card transform | [ ] |
| Catalog Add/Edit | FormDialog scroll-accessible | [ ] |
| Weight Editing | Inline input + Save button | [ ] |

**All must PASS before mobile admin guarantee can be claimed.**

---

## Accessibility

**Form Labels**:
- All inputs have explicit labels (for/id association)
- Required fields: aria-required="true" + asterisk in label
- Error messages: aria-describedby linking to error text

**Error Handling**:
- Errors: Inline below field, role="alert", icon + text (not color alone)
- Form-level errors: Banner at top, lists all issues
- Focus moves to first error on submit

**Keyboard Navigation**:
- Tab through all fields in logical order
- Select dropdowns: Arrow keys, type-ahead
- Wizard: Arrow left/right to navigate steps (optional)

**Screen Reader**:
- Form purpose announced: "Create new item form"
- Field types announced: "Email, required, edit box"
- Validation errors announced
- Success confirmation announced

---

## Performance

**Form Auto-Save** (Item Editor, Event Editor):
- Debounce: 500ms after last keystroke
- Save to localStorage as draft
- Restore draft on return
- Toast: "Draft saved" (subtle)
- Clear draft on submit success

**Data Loading** (updated for TICKET-30 scalability):
- Item list: Loads all (low count, no pagination needed)
- Inventory list: Loads all (low count, no pagination needed)
- User list: **Server-side pagination**, 20 per page, with search and filters (Ch.12.10)
- Event list: **Server-side pagination**, 20 per page, with search and filters (Ch.12.10)
- Catalog entries: Loads all (low count by design)

**Pagination API Response Shape** (consistent across all paginated admin endpoints):
```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;       // Current page (1-indexed)
    pageSize: number;   // Items per page
    totalItems: number; // Total matching items
    totalPages: number; // Computed ceiling
  };
}
```

---

## Scalability Testing Checklist (TICKET-30)

**Added 2026-02-25**: Verify all admin list views scale gracefully.

| Test | Route | Pass |
|------|-------|------|
| User list pagination works with 500+ users | `/admin/users` | [ ] |
| User search by name/email debounces and returns results | `/admin/users?search=eva` | [ ] |
| User role filter reduces result set | `/admin/users?role=moderator` | [ ] |
| Event list pagination works with 100+ events | `/admin/events` | [ ] |
| Event search works | `/admin/events?search=cologne` | [ ] |
| URL state persists across page refresh | All admin routes | [ ] |
| Back button navigates through filter history | All admin routes | [ ] |
| Mobile: Simplified pagination (prev/next) | All admin routes at 375px | [ ] |
| Mobile: Filter pills scroll horizontally | All admin routes at 375px | [ ] |
| Page size enforced server-side (max 100) | All admin endpoints | [ ] |
| Empty state shows when search has no results | All admin routes | [ ] |
| "Clear all" resets to defaults | All admin routes | [ ] |
| Performance: Initial load < 200ms | All admin routes | [ ] |
| Performance: Filter/search < 150ms | All admin routes | [ ] |

---

**Document Version**: 1.2.0
**Last Updated**: 2026-02-25
**Status**: Complete (amended for TICKET-30 scalability)
