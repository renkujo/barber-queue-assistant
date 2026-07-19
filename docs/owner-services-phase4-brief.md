# Owner Services Phase 4 Brief

Status: `PASS` — Phase 4 implementation human-approved  
Route: `/owner/settings/services`

## Current Reality

- The owner configures the services customers can select in the public booking/queue flows.
- Existing behavior is authoritative:
  - list every service by `sortOrder`;
  - show name, duration minutes, price label, sort order, and active/inactive state;
  - edit one existing service through `updateOwnerServiceAction` with fields name, duration, price, sort order, and status;
  - soft-disable or restore one service through `toggleOwnerServiceAction`; disabled services are not deleted;
  - create one new active service through `createOwnerServiceAction` with name, duration, optional price, sort order, and hidden `isActive=true`.
- Current Desktop 1440×1000 is functional and truthful, with active `บริการ` sidebar state and an add-service rail. The service list still reads as repeated cards; edits are hidden in each disclosure, so comparison and maintenance feel heavier than necessary.
- Current Mobile 390×844 is functional but long. The add-service form is below the full service list, and every service repeats the same large card/actions before the owner can add or review configuration quickly.
- Owner shell, navigation, server actions, field names, validation, soft-delete semantics, route feedback/toasts, and public service availability boundaries must remain unchanged.

## Direction

- **Taste thesis:** service settings should feel like maintaining a short barber-shop menu: scan the whole menu, tune one row, add a new item confidently, and never imply destructive deletion.
- **Mode:** preserve behavior and brand; targeted recomposition only.
- **Must preserve:** route, one-service-at-a-time edit/update, soft disable/restore, create-service form fields, active status semantics, `sortOrder`, duration/price constraints, toasts/notices, Owner Shell, Thai-first copy meaning, and source-owned primitives.
- **Not approved:** categories, staff assignment, appointments, packages, discounts, revenue, POS, inventory, bulk editing, drag-and-drop ordering, hard delete, or changed public booking semantics.

## Desktop Services Workbench — 1440×1000

- Keep approved Back Office sidebar with `บริการ` active.
- Compact page header `ตั้งค่าบริการ`, short explanation, and `กลับตั้งค่าร้าน`.
- Present services as one connected menu/table-like list with aligned columns for service, duration, price, order, status, and actions.
- Show one expanded/selected edit row or inline edit area to demonstrate the existing per-service edit fields without implying bulk save.
- Keep a right rail for `เพิ่มบริการ` with the authoritative fields only: service name, duration, optional price, sort order, and one `เพิ่มบริการ` action.
- Include a quiet helper note that `ปิดใช้` is soft disable, not deletion.
- No analytics, bookings count, categories, staff, packages, revenue, or marketing claims.

## Mobile Services App — 390×844

- Keep approved mobile top bar and bottom navigation with `เพิ่มเติม` active.
- Use a compact task header; do not make the back/settings card consume the first screen.
- Show services as compact menu rows/disclosures with status and key details visible; avoid full repeated edit-card anatomy for every service.
- Surface `เพิ่มบริการ` as an early focused action or compact panel so adding a service is not buried below the entire list.
- Demonstrate one expanded service editor or action sheet area with the same authoritative fields/actions; do not imply bulk save or hard delete.
- Touch targets should read as at least 44px, with primary create/save actions visually equivalent to at least 48px.
- Bottom navigation must remain safe-area aware and not cover service actions.

## Verification After Implementation

- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×1000.
- States: no services, many services, active/inactive services, one edit disclosure open, invalid fields, pending create/update/toggle, route success/error notices, long Thai service name, optional price empty.
- TypeScript, ESLint, integration tests, full Playwright suite, production build, and rendered overflow/string-fit checks.

## Gate

No remaining Phase 4 blocker.

## Phase 4 Human Decision

Kiattisak approved the implemented Services experience under `PASS` on 2026-07-17. Desktop uses a connected service workbench with one inline editor and a right-rail create form; Mobile uses compact disclosures and exposes add-service early. Existing create/update/soft-disable/restore actions, fields, ordering, validation, and active/inactive semantics remain preserved. The final review also corrected overlapping Desktop save/disable actions.

Validation passed TypeScript, ESLint, 37 integration tests, 17 Playwright tests, production build, and rendered 360/390/768/1024/1440px checks with no horizontal overflow and controls at least 44px.
