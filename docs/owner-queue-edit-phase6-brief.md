# Owner Queue Edit Phase 6 Brief

Status: `APPROVED` — human visual PASS recorded for implementation  
Route: `/owner/queue/[id]/edit`
Human decision: `PASS` — proceed with authenticated Phase 6 implementation.

## Current Reality

- `/owner/queue/[id]/edit` is the authenticated owner override page for one existing queue item.
- The authoritative edit form writes through `updateQueueItemAction` and preserves these fields only:
  - `customerName` — required customer name;
  - `phone` — optional phone text;
  - `serviceId` — required selected active service;
  - `dateValue` — required `YYYY-MM-DD` date from current item/today/tomorrow options;
  - `timeValue` — optional locked `HH:mm`, with `ไม่ล็อกเวลา / walk-in` encoded as `__none__`;
  - `note` — customer-facing queue note;
  - `ownerNote` — private owner-only note, not customer notification copy;
  - one `บันทึกการแก้ไข` form action.
- The page also contains factual support only:
  - route error notice/toast for invalid data, time conflict, outside business hours, or database failure;
  - `กลับคิววันนี้` link to `/owner`;
  - rule card explaining locked-time validation, walk-in no-lock behavior, and private owner notes.
- Business constraints are source-owned: service/date/time parsing, locked-time conflict checks against other active locked queue items and `TimeBlock`s, business-hours boundary checks unless keeping the existing locked time, and `__none__` converting to no locked time.
- Current Desktop 1440×1000 is truthful but reads like a generic long form; the schedule controls and private-note warning do not feel like the decision center.
- Current Mobile 390×844 is truthful but first viewport spends too much space before the schedule/time decision and save action; the bottom nav can visually compete with lower fields.

## Direction

- **Taste thesis:** queue editing should feel like a calm appointment correction desk: identify the ticket, adjust the customer/schedule facts, protect private notes, and save only when the owner understands conflict risk.
- **Mode:** preserve behavior and brand; targeted recomposition only.
- **Must preserve:** route, Owner Shell, server action, field names, select semantics, error routes, conflict/business-hours behavior, no-lock walk-in option, private owner-note meaning, one save action, Thai-first copy meaning, and Pastel Paper Queue identity.
- **Not approved:** new status actions, payments/POS, customer history, staff/barber assignment, notifications sent from this page, analytics, extra services/categories, bulk queue editing, destructive delete, or changed booking/walk-in semantics.

## Desktop Queue Edit Workbench — 1440×1000

- Keep approved Back Office sidebar with `คิววันนี้` active.
- Use a compact ticket header `แก้ไขคิว {code}`, customer/status summary, and `กลับคิววันนี้` action.
- Present the seven authoritative editable fields as one connected correction workbench, grouped by identity, schedule lock, and notes.
- Make service/date/time the visual center; show the no-lock/walk-in choice as a safe explicit option, not an error state.
- Keep one primary `บันทึกการแก้ไข` action for the entire form; do not imply per-section save.
- Use a right rail for factual rule/privacy cards: conflict checks, business-hours rule, walk-in no-lock behavior, and private owner note.
- Error/conflict notice should be visible without overpowering the form.
- No invented queue status controls, LINE send actions, customer profiles, payment, analytics, staff, or delete actions.

## Mobile Queue Edit App — 390×844

- Keep approved mobile top bar and bottom navigation with `วันนี้` active.
- Use a compact ticket header so editable fields begin early.
- Prioritize service/date/time and conflict guidance within the early scroll; owner note privacy must remain clear before save.
- Keep one thumb-friendly `บันทึกการแก้ไข` action; do not imply autosave or separate schedule save.
- Touch targets should read as at least 44px, with the save action visually equivalent to at least 48px.
- Bottom navigation must remain safe-area aware and not cover the save action or note fields.

## Verification After Implementation

- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×1000.
- States: conflict error, outside-hours error, invalid route error, locked booking time, no-lock walk-in, service change, current unavailable time retained, long Thai customer name, blank phone, long customer note, long private owner note.
- TypeScript, ESLint, integration tests, owner Playwright coverage, production build, and rendered overflow/string-fit checks.

## Gate

Stop at human `PASS`, `REVISE`, or `STOP`. No implementation follows automatically.
