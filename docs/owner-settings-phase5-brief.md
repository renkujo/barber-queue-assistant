# Owner Settings Phase 5 Brief

Status: `PASS` — Phase 5 implementation human-approved  
Route: `/owner/settings`

## Current Reality

- `/owner/settings` is the owner’s shop-control and channel hub inside the approved Owner Shell.
- The authoritative settings form writes through `updateOwnerSettingsAction` and preserves these fields only:
  - `shopName` — required shop name;
  - `openTime` and `closeTime` — required `HH:mm` business-hours text values;
  - `queueIntakeEnabled` — online queue intake open/closed;
  - `bookingEnabled` — advance online booking open/closed;
  - `walkInEnabled` — same-day online queue ticket open/closed;
  - `manualWaitMinutes` — optional owner-set wait time, integer `0–240`, blank means calculated wait.
- The page also contains factual support/actions:
  - settings effect guidance explaining online queue intake and manual wait;
  - owner LINE connection status from `ownerLineUserId`, masked when present;
  - `เชื่อม LINE เจ้าของร้าน` / `เชื่อม LINE ใหม่` link generated with LIFF when configured, otherwise `/line/owner?token=...`;
  - link to `/owner/settings/availability` labelled `ตั้งค่าวันรับคิว`;
  - link to `/owner/settings/services` labelled `จัดการบริการ`.
- Current Desktop 1440×1000 is truthful and compact, but the main form and right helper cards still read as a generic two-column settings page rather than a controlled shop console.
- Current Mobile 390×844 is truthful, but the first viewport is consumed by a large header and stacked form cards; LINE/channel actions and settings destinations sit far below the fold.

## Direction

- **Taste thesis:** shop settings should feel like the owner’s calm control desk: save the real shop values, understand exactly what toggles affect customers, and reach LINE/calendar/services without hunting.
- **Mode:** preserve behavior and brand; targeted recomposition only.
- **Must preserve:** route, Owner Shell, server action, field names, validations, boolean semantics, wait-time bounds, LINE-token/link behavior, masked LINE status, toasts/notices, support links, Thai-first copy meaning, and Pastel Paper Queue visual identity.
- **Not approved:** new shop profile fields, staff/branches, payment/POS, analytics, marketing settings, QR campaigns, extra notification channels, logout relocation changes, or changed booking/intake semantics.

## Desktop Settings Workbench — 1440×1000

- Keep approved Back Office sidebar with `ตั้งค่าร้าน` active.
- Use a compact page header `ตั้งค่าร้าน`, description, and `กลับคิววันนี้` action.
- Present the six authoritative settings as a connected control workbench, not six isolated cards.
- Group by job: shop identity/hours, customer online intake controls, and wait-time override.
- Keep one primary `บันทึกตั้งค่า` action for the form; do not imply per-section saves.
- Use a right rail for factual channel/destination cards: setting effects, LINE owner connection, availability, and services.
- Make LINE status/action prominent enough to understand, but not more visually important than saving shop settings.
- No charts, claims, channel metrics, QR/promotion panels, or unsupported integrations.

## Mobile Settings App — 390×844

- Keep approved mobile top bar and bottom navigation with `เพิ่มเติม` active.
- Use a compact task header so the settings controls appear early.
- Show a concise shop-state summary and the essential form controls without pushing all channel links below a long scroll.
- Keep the same single `บันทึกตั้งค่า` action; do not imply autosave or per-card saves.
- Surface LINE owner connection, availability, and services as compact action rows/panels reachable within the early settings flow.
- Touch targets should read as at least 44px, with the save action visually equivalent to at least 48px.
- Bottom navigation must remain safe-area aware and not cover form actions.

## Verification After Implementation

- Viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×1000.
- States: LINE connected/unconnected, all three boolean settings open/closed, blank/manual wait, invalid wait, route success/error notices, long shop name, and fallback/read-only database state if applicable.
- TypeScript, ESLint, integration tests, owner Playwright coverage, production build, and rendered overflow/string-fit checks.

## Gate

Human visual `PASS` recorded for the Phase 5 direction. Implementation may proceed while preserving every existing field name, action, business condition, LINE connection truth/state, navigation link, toast, and customer-facing behavior.

## Phase 5 Runtime Decision

Kiattisak approved the implemented Settings experience under `PASS` on 2026-07-17. Desktop uses a grouped settings workbench with truthful impact/LINE/Availability/Services rail; Mobile presents the settings hub before a compact flat form. Existing field names, server action, toggle semantics, manual-wait rules, LINE state, links, toasts, and customer behavior remain preserved.

Validation passed TypeScript, ESLint, 37 integration tests, 20 Playwright tests, production build, and rendered 360/390/768/1024/1440 checks with no horizontal overflow or blocking overlap/clipping.
