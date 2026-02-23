# Admin Interfaces Design

**Routes**: `/admin/*` (overview, items, inventories, events, users, csv-import)
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

**Event List**:
- DataTable: Partner, Location, Date, Registrations, Status
- Mobile: Cards showing key info
- Filters: Upcoming / Past / All, Location filter
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

**User List Table** (Desktop):
```
| Email             | Name      | Role | Confirmed | Events | Actions |
|-------------------|-----------|------|-----------|--------|---------|
| max@example.com   | Max M.    | Dev  | ✓         | 5      | [⋮]     |
| eva@example.com   | Eva S.    | Mod  | ✓         | 8      | [⋮]     |
| tom@example.com   | Tom W.    | Dev  | ✗         | 0      | [⋮]     |
```

**User List Cards** (Mobile):
```
┌──────────────────────────────────┐
│ Max Mustermann              [⋮]  │
│ max@example.com                  │
│ Developer • 5 events • ✓         │
└──────────────────────────────────┘
```

**ActionMenu** (⋮) contains:
- Edit User (email, name, role)
- Promote to Moderator (if developer)
- Demote (if moderator, requires confirmation)
- Resend Confirmation Email (if not confirmed)
- View Activity Log
- Disable Account (soft delete, requires confirmation)

**Filters**:
- Role: All, Observer, Developer, Moderator, Admin
- Email Status: All, Confirmed, Unconfirmed
- Newsletter: All, Subscribed, Unsubscribed
- Events: Any, 0 events, 1-5 events, 5+ events

**Mobile Filter UI**:
- FilterBottomSheet (slides from bottom)
- All filters vertical
- Apply + Reset buttons at bottom

**Search**:
- Search box: Filter by name or email
- Real-time filtering as user types
- Clear button (X icon)

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

**Data Loading**:
- Item list: Loads all (low count, no pagination)
- Inventory list: Loads all (low count)
- User list: Pagination (50 per page) OR virtual scroll
- Event list: Filter upcoming/past, load per filter

---

**Document Version**: 1.0.0
**Lines**: ~600
**Status**: Complete
