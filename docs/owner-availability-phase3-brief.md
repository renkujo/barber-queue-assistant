# Owner Availability Phase 3 Brief

Status: `SUPERSEDED IN PART` — weekly schedule remains approved; special-date owner UI was removed on 2026-07-22  
Route: `/owner/settings/availability`

Current override: the route now exposes only the recurring Monday–Sunday schedule and legend. Stored date-override precedence remains a data/runtime rule, but the owner-facing `วันพิเศษ 14 วันข้างหน้า` disclosure, forms, and write action are no longer part of this page.

## Current Reality

- The owner configures a recurring Monday–Sunday customer-intake mode and optional note per day.
- Existing modes are authoritative: use shop default, online booking + online queue, in-store only, and shop closed.
- A preset applies weekday-online/weekend-in-store settings.
- Stored date overrides still beat the weekly schedule, but this page no longer exposes a special-date editor.
- Current Mobile repeats a full form card for every day, creating a long scroll. Current Desktop is readable but repeats nested cards/labels and seven individual save buttons with weak week-level comparison.

## Direction

- **Taste thesis:** weekly availability should read like one calm operating schedule, so the owner can compare the whole week quickly and edit one day confidently without interpreting seven separate forms.
- **Mode:** preserve behavior and brand; targeted recomposition only.
- **Must preserve:** route, seven independent weekly forms/actions, all weekly mode values/semantics, notes, preset action, validation/toasts, owner shell, and stored per-date precedence.
- **Not approved:** bulk-save behavior, new hours fields, calendar engine, staff schedules, automatic holiday data, or changed availability semantics.

## Desktop Workbench — 1440×1000

- Keep the approved Back Office sidebar with `ตารางรับลูกค้า` active.
- Compact page header and preset action.
- Present Monday–Sunday as one connected schedule table/list with aligned day, current mode, note, and save action columns.
- Use restrained row dividers rather than seven outer cards.
- Keep a quiet right-side legend explaining the three concrete intake outcomes.
- No special-date owner section is rendered below the week.

## Mobile Schedule App — 390×844

- Keep approved mobile top bar and bottom navigation with `ตาราง` active.
- Compact task header; preset becomes a quiet secondary action.
- Show one expanded day editor and the remaining days as compact summary rows/disclosures.
- Each day remains independently saved; do not imply one bulk save.
- No special-date owner section is rendered on mobile.
- Touch targets at least 44px; no horizontal table scrolling.

## Verification After Implementation

- 360/390/768/1024/1440px; long Thai notes; each availability mode; preset; special-date disclosure; validation error; pending/save feedback.
- TypeScript, ESLint, integration tests, full Playwright, production build, and rendered spacing/overflow checks.

## Gate

No remaining Phase 3 blocker.

## Phase 3 Human Decision

Kiattisak approved the implemented `/owner/settings/availability` experience under `PASS` on 2026-07-17.

Approved runtime scope:

- connected seven-row Desktop weekly schedule;
- one-expanded-day Mobile schedule with compact disclosure rows;
- seven independent per-day forms/actions preserved;
- preset and special-date override behavior preserved;
- solid primary actions and Mobile touch targets of at least 44px;
- Tablet/compact layouts may stack the explanatory legend below the schedule; wide Desktop keeps it in the right rail.

Final validation: TypeScript, ESLint, 37 integration tests, 14 Playwright tests, production build, and rendered 360/390/768/1024/1440px checks with no horizontal overflow.
