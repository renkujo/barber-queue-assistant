# Queue Workspace V2 — Owner Availability Review

Status: historical technical QA; weekly schedule remains approved, special-date evidence was superseded on 2026-07-22.

Current note: `/owner/settings/availability` no longer renders or manages the 14-day special-date disclosure. The exception screenshots below remain historical evidence only.

2026-07-23 responsive regression follow-up: the weekly preset action shared a compressed mobile row with the heading, causing its Thai label to wrap tightly. At `360–390px`, the heading and preset now stack with an exact 12px gap; the preset spans the available content width and its label stays on one line. Desktop retains the compact side-by-side header.

A second mobile follow-up removed the field-within-field border around the expanded day editor and increased the label→control, field→field, and final-field→save gaps to `8px`, `16px`, and `16px`. Collapsed weekday rows and business behavior remain unchanged.

## Scope

- `/owner/settings/availability` opts into `data-owner-visual="v2"`.
- Seven independent weekly forms, one-save-per-day behavior, preset action, four authoritative modes, and optional reasons remain unchanged.
- Weekly rules and date-override precedence remain repository-owned.
- Select portals use the explicit V2 portal class.

## Review files

Weekly schedule:

- `schedule-360x800.png`
- `schedule-390x844.png`
- `schedule-768x1024.png`
- `schedule-1024x768.png`
- `schedule-1440x1000.png`

Mobile preset regression:

- `preset-stacked-360x844.png`
- `preset-stacked-390x844.png`
- `expanded-fields-360x844.png`
- `expanded-fields-390x844.png`

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

2026-07-23 regression validation: availability Playwright 6/6, full integration 82/82, typecheck, lint, build, and production visual geometry passed.

## Human decision recorded

Kiattisak approved the recurring and special-date availability workbench without a follow-up revision.
