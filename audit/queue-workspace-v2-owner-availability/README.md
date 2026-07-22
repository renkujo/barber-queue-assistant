# Queue Workspace V2 — Owner Availability Review

Status: historical technical QA; weekly schedule remains approved, special-date evidence was superseded on 2026-07-22.

Current note: `/owner/settings/availability` no longer renders or manages the 14-day special-date disclosure. The exception screenshots below remain historical evidence only.

## Scope

- `/owner/settings/availability` opts into `data-owner-visual="v2"`.
- Seven independent weekly forms, one-save-per-day behavior, preset action, four authoritative modes, optional reasons, and fourteen special-date overrides remain unchanged.
- Weekly rules and date-override precedence remain repository-owned.
- Select portals use the explicit V2 portal class.

## Review files

Weekly schedule:

- `schedule-360x800.png`
- `schedule-390x844.png`
- `schedule-768x1024.png`
- `schedule-1024x768.png`
- `schedule-1440x1000.png`

Special-date disclosure:

- `exceptions-390x844.png`
- `exceptions-1440x1000.png`

Geometry:

- `geometry.json`

The weekly reason field contains long Thai review text but was not submitted or persisted.

## Responsive ownership

- `360–1399px`: seven summary disclosures with only the explicitly opened day form visible.
- `>=1400px`: one connected seven-row comparison schedule.
- The legend stacks below the schedule until the desktop workbench can support its own rail.
- Mobile weekly controls measure at least 48px; desktop controls measure at least 44px.
- No horizontal overflow exists at all five required viewports.
- At 1440px the 836px schedule and 280px legend rail remain separate and aligned.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 37/37 passed, including weekly/date precedence behavior
- Availability Playwright: 4/4 passed
- Aggregate owner workflow suite: 25/25 passed

## Human decision recorded

Kiattisak approved the recurring and special-date availability workbench without a follow-up revision.
