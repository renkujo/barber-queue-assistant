# Owner Availability Phase 3 Brief

Status: `PASS` — Phase 3 implementation human-approved  
Route: `/owner/settings/availability`

## Current Reality

- The owner configures a recurring Monday–Sunday customer-intake mode and optional note per day.
- Existing modes are authoritative: use shop default, online booking + online queue, in-store only, and shop closed.
- A preset applies weekday-online/weekend-in-store settings.
- A separate disclosure owns special-date overrides for the next 14 days; date overrides beat the weekly schedule.
- Current Mobile repeats a full form card for every day, creating a long scroll. Current Desktop is readable but repeats nested cards/labels and seven individual save buttons with weak week-level comparison.

## Direction

- **Taste thesis:** weekly availability should read like one calm operating schedule, so the owner can compare the whole week quickly and edit one day confidently without interpreting seven separate forms.
- **Mode:** preserve behavior and brand; targeted recomposition only.
- **Must preserve:** route, seven independent forms/actions, all mode values/semantics, notes, preset action, special-date forms, validation/toasts, owner shell, and per-date precedence.
- **Not approved:** bulk-save behavior, new hours fields, calendar engine, staff schedules, automatic holiday data, or changed availability semantics.

## Desktop Workbench — 1440×1000

- Keep the approved Back Office sidebar with `ตารางรับลูกค้า` active.
- Compact page header and preset action.
- Present Monday–Sunday as one connected schedule table/list with aligned day, current mode, note, and save action columns.
- Use restrained row dividers rather than seven outer cards.
- Keep a quiet right-side legend explaining the three concrete intake outcomes.
- Special dates remain a secondary collapsed section below the week.

## Mobile Schedule App — 390×844

- Keep approved mobile top bar and bottom navigation with `ตาราง` active.
- Compact task header; preset becomes a quiet secondary action.
- Show one expanded day editor and the remaining days as compact summary rows/disclosures.
- Each day remains independently saved; do not imply one bulk save.
- Special dates stay collapsed and clearly secondary.
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
