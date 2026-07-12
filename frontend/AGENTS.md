# AGENTS.md — AssetFlow Build Rules

This file is the single source of truth for every agent/subagent working on this codebase. Load it in full before generating or editing any screen. Do not invent colors, statuses, field names, or copy that aren't defined here — extend this file first if something's missing, then build against the updated version.

Stack assumption: **React + TypeScript + Tailwind CSS**. If the project uses a different stack, keep every section except §9 (Code Conventions) and translate that one section to the actual stack — the design tokens, component inventory, data model, and screen specs are framework-agnostic.

---

## 1. Project Context

AssetFlow is an Enterprise Asset & Resource Management System (ERP module). Any organization with equipment, furniture, vehicles, or shared spaces uses it to track asset lifecycles, allocate assets to people/departments, book shared resources by time slot, route maintenance through approval, and run audit cycles.

**Explicitly out of scope — never build these:** purchasing, invoicing, accounting. Acquisition Cost is a display-only field for reports/ranking; it must never link to an accounting entity or ledger.

**Non-negotiable architectural rule:** no self-elevating roles anywhere in the UI. Signup always produces an Employee account. Role changes only happen from Org Setup → Employee Directory (Admin-only).

---

## 2. Design System

### 2.1 Concept

The visual identity is grounded in the physical object at the center of the product: the **asset tag**. Every real-world asset in this domain wears a stamped tag with a code, a barcode, a hole-punch — that vocabulary (mono-spaced codes, tag-like chips, stamped labels) is the signature element, and it should recur across the app (asset tag chips on cards, table rows, and detail headers) rather than living in one place.

Explicitly avoid the visual defaults ERP/admin dashboards fall into by default: generic indigo/violet SaaS gradients, glassmorphism cards, or a dark-mode-with-neon-accent look. Those read as templated, not as "asset management system."

### 2.2 Color Tokens

Brand/UI palette (spend distinctiveness here):

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1B2429` | Primary text, sidebar background, headers |
| `--steel` | `#5B6B73` | Secondary text, borders, icons |
| `--surface` | `#FAFAF9` | App background |
| `--surface-raised` | `#FFFFFF` | Cards, tables, modals |
| `--hairline` | `#E4E2DD` | Dividers, table borders |
| `--accent` | `#E8A33D` | Primary actions, active nav state, the signature "tag" chip border — used sparingly |
| `--accent-ink` | `#5C3B0E` | Text on top of `--accent` fills |

Status colors are a **separate system** — kept to standard semantic meaning (green=good, blue=in-progress, amber=caution, red=problem, grey=inactive/final) so they stay instantly scannable in dense tables. Do not get creative with these; clarity beats distinctiveness here.

**Asset Lifecycle status:**

| State | Color | Hex |
|---|---|---|
| Available | Green | `#2E9B5F` |
| Allocated | Blue | `#3B7DD8` |
| Reserved | Violet | `#8B5CF6` |
| Under Maintenance | Amber | `#E8A33D` |
| Lost | Red | `#D64545` |
| Retired | Grey | `#8A8F94` |
| Disposed | Dark grey (near-final, muted) | `#4B4F53` |

**Booking status:** Upcoming `#3B7DD8` · Ongoing `#2E9B5F` · Completed `#8A8F94` · Cancelled `#D64545`

**Maintenance workflow status:** Pending `#E8A33D` · Approved `#3B7DD8` · Rejected `#D64545` · Technician Assigned `#8B5CF6` · In Progress `#C9861F` · Resolved `#2E9B5F`

**Transfer workflow status:** Requested `#E8A33D` · Approved `#3B7DD8` · Re-allocated `#2E9B5F`

**Audit item status:** Verified `#2E9B5F` · Missing `#D64545` · Damaged `#E8A33D`

Every status color must route through the shared `<StatusBadge>` component (§3) — never hardcode a hex against a status inline in a screen.

### 2.3 Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings | Space Grotesk | Geometric, technical — used for page titles, KPI numbers |
| Body / UI text | IBM Plex Sans | Enterprise-grade, highly legible at small sizes |
| Data / tags / code | IBM Plex Mono | Asset Tags, Serial Numbers, timestamps, IDs — anything the user might scan or copy |

Type scale (rem, 16px base): `0.75` caption · `0.875` body-sm · `1` body · `1.25` h4 · `1.5` h3 · `2` h2 · `2.75` h1/KPI-number.

### 2.4 Layout

- Persistent left sidebar (icon + label nav), collapsible on mobile into a bottom bar or drawer.
- Top bar: global search, notification bell, profile menu.
- Spacing scale: 4px base unit — use 4/8/12/16/24/32/48 only, no arbitrary values.
- Border radius: 6px for controls/inputs, 10px for cards, 4px for the tag-chip signature element (slightly sharper — reads as "stamped," not "soft SaaS card").
- Data tables are the primary content pattern for 6 of the 10 screens — invest in the DataTable component early (§3), everything else reuses it.

### 2.5 Signature element — the Asset Tag chip

A small reusable chip rendering an asset's tag code (e.g. `AF-0001`) in `IBM Plex Mono`, on a `--surface-raised` background with a 1px `--accent` border and 4px radius, optionally with a small tick/notch on the left edge to suggest a physical tag corner. Use this exact chip anywhere an Asset Tag appears — table rows, cards, detail page headers, QR labels. This is the one recurring visual signal that should feel unmistakably "AssetFlow."

---

## 3. Shared Component Inventory

Build these before any screen. Every screen composes from this list — do not let a subagent invent a one-off variant.

- **Button** — primary / secondary / ghost / destructive
- **StatusBadge** — takes a `domain` (`asset` | `booking` | `maintenance` | `transfer` | `audit`) and a `status` string, resolves color from §2.2 internally
- **DataTable** — sortable columns, column filters, pagination, row actions menu, empty state slot
- **KPICard** — big number (Space Grotesk), label, optional trend/delta
- **Modal / Dialog**
- **FormField** — text, select, date, file/photo upload, textarea — consistent label + helper + error pattern
- **Calendar / TimeSlotGrid** — for Resource Booking, renders overlap conflicts visually
- **Timeline** — chronological history (used for per-asset allocation + maintenance history)
- **Tabs** — used by Org Setup's 3-tab screen
- **AssetTagChip** — the signature element (§2.5)
- **EmptyState** — icon/illustration slot, one-line explanation, primary action
- **Toast/Notification**
- **Avatar**
- **SearchBar** — with attached filter chips (category/status/department/location)
- **Sidebar / TopBar shell**

Ask the agent to render a `/style-guide` route showing every component + every state before building real screens. Review that page first.

---

## 4. Data Model (keep field names consistent across every screen/agent)

- **Employee**: id, name, email, department, role (`Employee` | `DepartmentHead` | `AssetManager` | `Admin`), status
- **Department**: id, name, headId (→Employee), parentDepartmentId (nullable, self-referencing), status
- **AssetCategory**: id, name, customFields (key-value schema, e.g. `warrantyPeriod`)
- **Asset**: id, name, categoryId, assetTag (auto `AF-####`), serialNumber, acquisitionDate, acquisitionCost, condition, location, photos[], documents[], isBookable (bool), qrCode, status (see §5 state machine)
- **Allocation**: id, assetId, holderType (`employee` | `department`), holderId, expectedReturnDate, allocatedAt, returnedAt, checkInNotes
- **TransferRequest**: id, assetId, fromHolderId, toHolderId, status (`Requested`|`Approved`|`Reallocated`), approvedBy
- **Resource** (bookable asset or space): id, assetId, capacity
- **Booking**: id, resourceId, bookedBy, startTime, endTime, status (`Upcoming`|`Ongoing`|`Completed`|`Cancelled`)
- **MaintenanceRequest**: id, assetId, raisedBy, issueDescription, priority, photo, status (see §5), technicianAssigned, resolvedAt
- **AuditCycle**: id, scope (department/location), dateRangeStart, dateRangeEnd, auditorIds[], status (Open/Closed)
- **AuditItem**: id, auditCycleId, assetId, result (`Verified`|`Missing`|`Damaged`)
- **Notification**: id, userId, type, message, read (bool), createdAt
- **ActivityLog**: id, actorId, action, entityType, entityId, timestamp — append-only, never edited or deleted

---

## 5. State Machines (enforce explicit transitions — no arbitrary status jumps)

**Asset lifecycle:**
```
Available → Allocated (on allocation)
Available → Reserved (on booking, if bookable)
Available ↔ Under Maintenance (maintenance approved → Under Maintenance; resolved → Available)
Allocated → Available (on return)
Allocated → Allocated (on completed transfer, holder changes, status unchanged)
Any non-final state → Lost (audit confirms missing)
Any non-final state → Retired (admin/manager action)
Retired → Disposed (final)
```

**Booking:** `Upcoming → Ongoing → Completed`, or `Upcoming → Cancelled` (cancellation only allowed pre-start).

**Maintenance:** `Pending → Approved → Technician Assigned → In Progress → Resolved`, or `Pending → Rejected` (terminal). Asset flips to Under Maintenance exactly on `Approved`, back to Available exactly on `Resolved`.

**Transfer:** `Requested → Approved → Reallocated` (terminal, updates Allocation + history), or rejected (terminal, no change).

**Audit cycle:** `Open` (auditors marking items) `→ Closed` (locked; any `Missing` items cascade the linked Asset to `Lost`).

---

## 6. Roles & Permissions

| Action | Admin | Asset Manager | Department Head | Employee |
|---|---|---|---|---|
| Org Setup (departments/categories/roles) | ✅ | – | – | – |
| Register / allocate assets | ✅ | ✅ | – | – |
| Approve transfers/maintenance/audit discrepancies | ✅ | ✅ | dept-scoped only | – |
| View org-wide analytics | ✅ | ✅ | dept-scoped only | – |
| Book shared resources | ✅ | ✅ | ✅ (on behalf of dept) | ✅ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ |
| Initiate return/transfer request | ✅ | ✅ | ✅ | ✅ (own assets) |
| View assets | all | all | dept only | own only |

Enforce all of this server-side. A hidden button is not a permission system — judges will test by hitting routes/APIs directly.

---

## 7. Screen Specs (condensed — full detail in problem statement)

1. **Login/Signup** — email+password, forgot password, signup = Employee only, session validation.
2. **Dashboard** — KPI cards (Available, Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns), overdue returns visually separated, quick actions (Register Asset / Book Resource / Raise Maintenance Request). Role-scoped view.
3. **Org Setup** (Admin only, 3 tabs) — Departments (hierarchy, head, status), Categories (custom fields), Employee Directory (role promotion happens only here).
4. **Asset Registration & Directory** — register form (all fields from §4), search/filter (tag/serial/QR/category/status/dept/location), per-asset Timeline (allocation + maintenance history merged).
5. **Allocation & Transfer** — allocate with conflict check (block + "currently held by X" + Transfer Request CTA), transfer workflow, return flow with condition notes, overdue auto-flagging.
6. **Resource Booking** — Calendar/TimeSlotGrid, overlap validation (reject true overlaps, allow adjacent), cancel/reschedule, pre-slot reminder.
7. **Maintenance Management** — raise request form, approval workflow, auto status sync to Asset.
8. **Asset Audit** — create cycle, assign auditors, per-asset Verified/Missing/Damaged marking, auto discrepancy report, close cycle (cascades Lost status).
9. **Reports & Analytics** — utilization trends, maintenance frequency, upcoming-maintenance/retirement list, dept allocation summary, booking heatmap, export (PDF + CSV).
10. **Activity Logs & Notifications** — notification bell (read/unread), full append-only activity log with filters.

---

## 8. UX Writing Conventions

- Active voice, plain verbs: "Book resource," not "Reservation Instantiation."
- An action keeps its name through the whole flow: a button labeled "Approve" produces a toast that says "Approved," not "Success."
- Errors state what happened and how to fix it, in the interface's voice — never "Oops!" and never vague.
- Empty states are an invitation to act: one line explaining why it's empty + the primary action to fill it (e.g., "No assets registered yet — Register your first asset").
- Name things by what the user controls, not by internal system nouns: "Return" not "Deallocate," "Book a Room" not "Create Reservation Entity."

---

## 9. Code Conventions (React + TS + Tailwind)

- Design tokens live in `tailwind.config.ts` under `theme.extend.colors`, referencing the hex values in §2.2 by name (`ink`, `steel`, `accent`, plus a nested `status.available`, `status.allocated`, etc.) — never inline arbitrary hex in a `className`.
- Component folder structure: `/components/shared` (§3 inventory) vs `/components/screens/<screen-name>` (screen-specific composition only).
- `StatusBadge` is the only place status→color mapping is allowed to exist in code.
- Accessibility floor on every screen: visible keyboard focus states, sufficient contrast, `prefers-reduced-motion` respected.
- Responsive down to mobile on every screen — this is a stated requirement in the problem statement, not optional polish.

---

## 10. Do Not

- Do not build purchasing, invoicing, or accounting features, or link Acquisition Cost to any ledger concept.
- Do not allow role selection at signup or any client-side role escalation.
- Do not hardcode status colors per-screen — always go through `StatusBadge`.
- Do not default to generic indigo/violet gradient "AI SaaS dashboard" styling — follow §2.
- Do not skip server-side permission checks in favor of hiding UI elements.

## 11. Self-Review Checklist (run after building each screen)

- [ ] Matches §2 tokens exactly (no off-palette colors introduced)
- [ ] All statuses render via `StatusBadge`
- [ ] Responsive at mobile width
- [ ] Keyboard focus visible on all interactive elements
- [ ] Empty and error states present, written per §8
- [ ] Field names match §4 exactly (no `asset_tag` vs `assetTag` drift)