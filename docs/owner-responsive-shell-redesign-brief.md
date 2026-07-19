# Owner Responsive Shell Redesign Brief

Status: `PASS` — Phase 1 implementation human-approved  
Scope owner: product owner / owner-facing UI  
Baseline reviewed: `main` at `a63bc34`  
Primary surfaces: `/owner` and existing `/owner/**` routes

## Current Reality

- The product is a daily queue assistant for one owner-barber, not a multi-staff salon suite.
- The same person uses both device classes in different contexts:
  - mobile while serving customers and moving around the shop;
  - desktop while arranging queues, availability, services, and shop settings.
- Repo-proven owner routes:
  - `/owner` — today queue and live shop controls;
  - `/owner/walk-in` — manually add a queue;
  - `/owner/queue/[id]/edit` — edit one queue;
  - `/owner/settings` — shop and online-intake settings;
  - `/owner/settings/availability` — weekly and special-date availability;
  - `/owner/settings/services` — service configuration.
- The current owner UI already has useful source-owned components: shop status, current/next summary, queue board, closed queue list, quick-action rail, notification log, settings forms, and Radix-backed UI primitives.
- The current desktop render at 1440px has a table-like queue board and right rail, but its top-only navigation and loose page hierarchy still read as a responsive dashboard rather than a deliberate back-office workspace.
- The current mobile render at 390px fits the viewport, but preserves the desktop content sequence. Shop-management controls consume the first screen, navigation is menu-based, and frequent actions do not yet form a thumb-oriented mobile-app shell.
- `docs/design-system-owner-queue-board-v2.md` currently says desktop should not become back-office software. The approved interpretation now is narrower: desktop should become a **small-business back office**, while still rejecting enterprise feature bloat and generic SaaS presentation.
- Customer-facing routes remain public, mobile-first flows. The desktop/mobile operating-mode split applies only to the authenticated owner experience.

## Brand Read and Taste Thesis

- **Repo-proven brand reality:** Pastel Paper Queue tokens, LINE Seed Sans TH, warm paper surfaces, cocoa text, peach primary action, sage positive states, dusty-rose risk states, restrained borders, and minimal shadow.
- **Approved direction:** one product with two operating modes—desktop back office and mobile daily-work app.
- **Recommended direction:** preserve the warm local identity and change composition, navigation, density, and interaction anatomy. Do not use a blue admin template to communicate “back office.”
- **Unknown:** no external visual reference has been approved for this redesign; current repo/product evidence is sufficient for the first brief.
- **Taste thesis:** Barber Queue Assistant should feel calm, immediate, and locally human so one owner-barber can understand the shop and act within seconds, without becoming either a soft consumer booking page or an enterprise salon dashboard.
- **Signature expression:** the daily queue remains the dominant work object; warm paper surfaces and a single clear “next action” keep operational density approachable.
- **Restraint boundary:** no KPI card grid, decorative analytics, staff-role metaphors, heavy sidebar chrome, glass effects, gradients, or excessive card nesting.

## Design Read

- **Surface/job:** authenticated owner workspace for running and configuring one barber shop.
- **Audience:** one owner who is also the only barber.
- **Primary action:** identify what is happening now and perform the next correct queue action with minimal interruption.
- **Direction:** mobile-first operational app paired with a denser desktop management workspace.
- **Constraints:** Thai-first copy, one-to-two-tap common actions, existing routes and business conditions, no duplicate device-specific logic, no unsupported management features.

## Mode and Preservation Boundary

- **Mode:** preserve product behavior and brand identity.
- **Composition strategy:** targeted recomposition of the authenticated owner shell and `/owner` page hierarchy.
- **Reset trigger:** the current responsive composition changes size and stacking but does not express the two distinct usage contexts strongly enough.
- **Must preserve:** existing routes, server actions, queue ordering, status transitions, form names and validation, authentication, privacy behavior, notification behavior, Thai labels unless separately reviewed, source-owned primitives, and Pastel Paper Queue tokens.
- **Approved to change:** owner navigation anatomy, responsive sequencing, shell composition, information density, control placement, visual hierarchy, and component variants needed for desktop/mobile parity.
- **Not approved:** customer UI redesign, new analytics, reports, staff management, permissions, POS, inventory, loyalty, route renaming, or business-condition changes.

## Structure

### Shared route and responsibility map

| Existing route | Shared job | Desktop presentation | Mobile presentation |
| --- | --- | --- | --- |
| `/owner` | Run today’s queue | Today workspace with persistent navigation, operational header, queue table, and secondary rail | Today home with current/next first, compact shop state, queue list, and thumb-reachable actions |
| `/owner/walk-in` | Add a customer manually | Focused workbench form within the owner shell | Full-screen task flow with one clear completion action |
| `/owner/queue/[id]/edit` | Edit one queue safely | Structured edit workspace with queue context visible | Full-screen edit flow with compact summary and explicit save/cancel |
| `/owner/settings/availability` | Configure recurring and exceptional days | Management table/workbench optimized for comparison | Drill-down list/forms, one day or exception group at a time |
| `/owner/settings/services` | Configure services | Dense service list with adjacent create/edit work area | Service list followed by focused add/edit screens or disclosures |
| `/owner/settings` | Configure shop and channels | Grouped settings workspace | “More” destination with grouped settings rows and drill-down pages |

### Desktop back-office shell

Use a persistent, restrained side navigation at desktop width:

1. `คิววันนี้`
2. `เพิ่มคิว`
3. `ตารางรับลูกค้า`
4. `บริการ`
5. `ตั้งค่าร้าน`

The shell should include:

- shop identity and live intake state without a large marketing-style brand header;
- one active navigation state;
- page title, date/context, and primary page action in the workspace header;
- owner/LINE connection and sign-out in a quiet footer area;
- no duplicated `ตั้งค่า`, `เมนู`, and `รีเฟรช` controls when persistent navigation already exposes those destinations.

Desktop `/owner` sequence:

1. **Operational header** — date, shop/intake state, and `เพิ่มคิว`.
2. **Current/next strip** — what is happening now and who is next.
3. **Queue board** — the dominant table-like surface and primary action owner.
4. **Secondary rail** — wait adjustment, pause/intake controls, today summary, and recent LINE activity.
5. **Closed queue disclosure** — completed/cancelled/no-show items remain available but visually secondary.

Desktop should add breadth and comparison, not new product complexity.

### Mobile app shell

Use a compact top app bar and persistent bottom navigation:

1. `วันนี้`
2. `เพิ่มคิว`
3. `ตาราง`
4. `เพิ่มเติม`

Mobile `/owner` sequence:

1. **Compact live state** — open/paused/closed and intake status; avoid a large settings panel above the queue.
2. **Current customer** — dominant only when service is active.
3. **Next customer** — dominant when no service is active.
4. **Today queue** — immediately visible, list-first, with one contextual primary action per item.
5. **Quick-control sheet** — wait adjustment, pause 30 minutes, open/close intake, and refresh.
6. **Persistent app navigation** — safe-area aware and never covering queue actions.

Mobile interaction rules:

- Expected queue actions remain at least 48px high and reachable with one hand.
- A destructive action never shares the primary visual category.
- Queue-row secondary controls use a disclosure or bottom sheet rather than a permanently expanded button grid.
- Forms use full-screen task flows; desktop side-by-side helper content becomes collapsible guidance.
- Bottom navigation communicates location; it does not duplicate an open menu with the same destinations.

### Compact/tablet bridge

- `320–759px`: mobile app shell.
- `760–1023px`: compact owner workspace; retain task-first sequencing and avoid forcing the full desktop sidebar.
- `1024px+`: desktop back-office shell.
- Existing implementation breakpoints may be reused or consolidated only after rendered checks prove the intended transitions.

### Component ownership

- Introduce one owner-shell component responsible for device-appropriate navigation and workspace framing.
- Keep route definitions in one shared owner-navigation model; desktop sidebar, mobile bottom navigation, and compact menu render from that owner.
- Preserve one queue-board data/action owner. Desktop table rows and mobile stacked rows may use distinct presentation subcomponents but must receive the same status/action contract.
- Keep shop-status business actions in the existing owner boundary; expose a compact mobile summary and a desktop management variant rather than duplicating action logic.
- Settings pages continue using source-owned UI primitives and current server actions.

## Reference Decisions

- **Keep:** queue-board-first hierarchy, Pastel Paper Queue tokens, Thai-first typography, restrained borders, contextual actions, current/next model, and source-owned primitives.
- **Adapt:** current top navigation into a persistent desktop sidebar and mobile app navigation; current shop-status strip into a compact live state plus device-appropriate management controls; current right rail into a true desktop secondary work area.
- **Reject:** generic blue/white admin skin, enterprise KPI dashboard, staff/role navigation, duplicated menu destinations, analytics without product need, and mobile layouts produced only by stacking desktop blocks.
- **Unknown:** external reference fit; no reference should be transplanted before a separate reference decision.
- **Reference fit:** the existing Owner Queue Board V2 is exemplary for queue priority and brand restraint, but a near miss for the newly approved desktop-back-office/mobile-app shell relationship.

## Visual and Interaction System

- **Semantic type ladder:** app/shop identity → page title → live operational state → queue code/time → row body/action → metadata/help.
- **Typography:** keep LINE Seed Sans TH; use real Thai copy in all breakpoint checks; avoid tiny table text and negative tracking.
- **Color/surfaces:** keep warm paper as the shared brand field. Desktop earns a stronger workspace hierarchy through surface grouping and navigation contrast, not a new palette. Mobile keeps flatter surfaces and fewer simultaneous containers.
- **Density:** desktop is compact enough for comparison while preserving legible Thai; mobile shows fewer controls at once and progressively discloses secondary actions.
- **States:** open, paused, closed/full, empty queue, current service, next queue, waiting, late, no-show risk, done/cancelled, fallback/read-only, loading/pending, success, error, disabled, and focus-visible.
- **Motion:** use only short state/feedback transitions where they clarify navigation, disclosure, or mutation. Respect reduced motion and never delay queue actions for animation.
- **Accessibility:** preserve semantic landmarks, labelled controls, keyboard access on desktop, focus visibility, text-backed status meaning, safe-area padding, and contrast across pastel states.

## Asset Requirements

- No new raster or generated asset is required for the owner-shell redesign.
- Reuse the current app/shop icon only where it helps orientation; do not let it consume operational space.
- Existing generated cutouts are not required for owner workflows and should not be introduced as decorative fillers.

## Implementation Constraints

- Follow `app/AGENTS.md` and consult installed Next.js 16 docs before changing framework-sensitive code.
- Use pnpm and existing exact dependency policy; this brief does not authorize new dependencies.
- Preserve server components/actions and existing queue/business conditions.
- Do not create separate desktop and mobile routes or duplicate data fetching.
- Prefer CSS/layout and source-owned component variants over JavaScript viewport branching.
- Preserve URL/query feedback, toast behavior, form field names, confirmation dialogs, privacy controls, and existing testable labels where possible.
- Update `docs/design-system-owner-queue-board-v2.md` when implementation begins so its desktop principle matches the approved small-business back-office direction.

## Pre-code Decision Ledger

| Evidence | Conflict or uncertainty | Design consequence | Decision | Rejected alternative | Status |
| --- | --- | --- | --- | --- | --- |
| One owner uses phone while working and desktop while managing | Current UI treats device change mostly as reflow | One shared product needs two operating anatomies | Desktop back office + mobile daily-work app | One responsive composition with only stacked blocks | Approved |
| Owner Queue Board V2 rejects generic admin software | Owner now explicitly wants a desktop back-office read | “Back office” needs a bounded product definition | Use small-business workbench structure without enterprise features | Blue SaaS dashboard, KPI grid, staff roles | Approved |
| Pastel Paper Queue is implemented and product-specific | Back-office convention could pressure a palette reset | Structure must communicate the mode | Preserve palette/type; change shell, density, and navigation | Token-swap to generic neutral/blue admin | Approved |
| Existing routes and server actions already cover the MVP | Separate device implementations would drift | Device composition must share contracts | One route/data/action model with responsive presentation owners | Separate mobile/desktop apps or duplicated business logic | Approved |
| Customer routes have a different audience/job | A global desktop theme could contaminate public pages | Scope must remain authenticated-owner only | Leave customer experience unchanged | Whole-app redesign | Approved |

## Verification

### Viewports

- 360×800 — smallest supported phone stress case.
- 390×844 — primary mobile target.
- 768×1024 — compact/tablet transition.
- 1024×768 — first desktop-shell target.
- 1440×1000 — primary desktop back-office target.

### Required rendered states

- Empty day.
- Current customer + next customer + waiting queue.
- Long Thai customer name, service, and owner note.
- Late/no-show risk with destructive confirmation.
- Shop paused and online intake closed.
- Read-only/fallback data state.
- Queue mutation pending, success, and error.
- Availability and services forms with realistic content.
- Keyboard focus path on desktop and safe-area/bottom-navigation clearance on mobile.

### Evidence

- Matched desktop/mobile screenshots for each material state.
- DOM geometry or Playwright assertions for no horizontal overflow, bottom-nav clearance, minimum control height, and breakpoint visibility.
- Interaction checks for queue status actions, confirmations, navigation, form submission, focus order, and disabled states.
- `pnpm typecheck`, `pnpm lint`, relevant integration tests, `pnpm build`, and project-native Playwright coverage.
- Visual inspection of Thai wrapping and mixed Thai/English labels; `overflowX = 0` alone is not a pass.

## Open Question / Blocker

None for Phase 1.

## Phase 1 Human Decision

Kiattisak approved the implemented responsive Owner Shell under `PASS` on 2026-07-17.

Approved implementation scope:

- persistent Desktop Back Office navigation;
- Mobile App top bar and bottom navigation;
- shared shell across authenticated owner routes;
- `/owner` workspace composition, compact mobile shop state, mobile control dialog, and desktop control rail;
- existing queue behavior, server actions, customer UI, and business conditions preserved.

Validation evidence at approval: TypeScript, ESLint, 37 integration tests, 12 Playwright tests, production build, and rendered 390/768/1024/1440px checks with no horizontal overflow.

## Sidebar Correction PASS

Kiattisak later identified that parts of the shared Desktop sidebar rendered incorrectly. The correction was approved under `PASS` on 2026-07-17:

- the approved app icon is rendered directly without an additional framed scissors wrapper;
- the false hardcoded `เชื่อมต่อ LINE แล้ว` state was replaced by the truthful neutral action `ตั้งค่า LINE เจ้าของร้าน`;
- the sidebar is constrained to `100dvh`, keeps its footer inside the viewport, and allows hidden-scrollbar internal overflow;
- active navigation state was verified for Today, Add Queue, Availability, Services, Settings, and queue-edit ownership.

Rendered 1024/1440px checks had no horizontal overflow, sidebar/footer geometry stayed inside the viewport with 18px bottom spacing, targeted owner Playwright tests passed, and the production build passed.
