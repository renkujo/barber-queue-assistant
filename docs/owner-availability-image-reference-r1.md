# Owner Availability Image Reference R1

Status: `HISTORICAL` — the weekly composition remains useful; special-date UI references were superseded on 2026-07-22  
Lifecycle: historical Phase 3 implementation reference

Do not reintroduce the `วันพิเศษ 14 วันข้างหน้า` disclosure from these images; the current owner route intentionally omits that section.

Generate exactly:

1. `docs/assets/concepts/owner-availability-r1/desktop-schedule-r1.png` — 1440×1000.
2. `docs/assets/concepts/owner-availability-r1/mobile-schedule-r1.png` — 390×844.

## Product Contract

- One owner/one barber; recurring Monday–Sunday intake schedule.
- Preserve modes: shop default, online open, in-store only, shop closed.
- Preserve one save action per day, optional note, weekday/weekend preset, and secondary special-date overrides.
- Preserve approved Pastel Paper Queue Owner Shell: warm paper, cocoa, peach primary, restrained borders/shadows, Thai-first typography.
- Do not invent hours, staff, bulk-save behavior, analytics, bookings, revenue, calendar events, or holiday automation.
- Do not reproduce local data/test values.

## Desktop

- Persistent sidebar with `ตารางรับลูกค้า` active.
- Compact header `ตารางรับลูกค้าประจำสัปดาห์`, short explanation, back action, and quiet preset action.
- One connected weekly schedule with aligned rows for all seven days; each row visibly owns mode, optional note, and its own `บันทึก`.
- Right rail only explains `เปิดระบบออนไลน์`, `รับเฉพาะหน้าร้าน`, and `ร้านปิด`.
- Collapsed `วันพิเศษ 14 วันข้างหน้า` below the schedule.
- No seven floating cards and no dashboard metrics.

## Mobile

- Raw 390×844 app screen, no phone frame; top bar and bottom nav with `ตาราง` active.
- Compact header and preset action.
- Monday expanded with mode, optional note, and `บันทึกวันนี้`; Tuesday–Sunday shown as compact summary/disclosure rows with visible current mode.
- Collapsed special-date section above bottom navigation.
- No horizontal table, no bulk-save implication, and no card-inside-card repetition.

## Direct CLI and QA

- Direct Codex `gpt-5.6-sol` high; exactly two built-in image calls, no retries/variants/corrections.
- Inspect the brief, current route/CSS, and attached baseline screenshots.
- Edit no app/source/runtime/design-system files.
- Stage exact PNGs above and write `docs/assets/concepts/owner-availability-r1/qa.md` with provenance, dimensions, hashes, product-fit checks, Thai-text defects, and honest deviations.
- Stop for human `PASS`, `REVISE`, or `STOP`.

## Human Decision

Kiattisak approved the paired Desktop Weekly Schedule and Mobile Schedule direction under `PASS` on 2026-07-17. Implementation must preserve independent per-day forms/actions, use solid source-owned button styling, enforce 44px touch targets, and prove disclosure/special-date behavior in runtime.
