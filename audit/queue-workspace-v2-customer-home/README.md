# Queue Workspace V2 — Customer Home Review

Status: technical QA passed; human-approved after the status-truth correction.

## Scope

- `/` opts into `data-customer-visual="v2"` through the shared `ScreenShell` API.
- Shop status truth, current queue count, estimated wait, booking/walk-in destinations, disabled walk-in explanation, service data, queue-code/PIN lookup, rate limits, redirects, and privacy link remain unchanged.
- The customer shell is task-first and does not inherit the owner command rail.
- Long service names are bounded to two lines while retaining full text in the DOM and `title`.

## Review files

Canonical home:

- `home-360x800.png`
- `home-390x844.png`
- `home-768x1024.png`
- `home-860x900.png`
- `home-1024x768.png`
- `home-1440x1000.png`

States:

- `intake-closed-390x844.png`
- `intake-closed-1440x1000.png`
- `walkin-only-390x844.png`
- `booking-only-390x844.png`
- `long-thai-360x800.png`
- `lookup-error-390x844.png` — server-rendered progressive fallback with JavaScript disabled

Geometry:

- `geometry.json`

The intake-disabled capture temporarily changed only `queueIntakeEnabled` and restored the exact original database value in `finally`.

## Authorized truth correction

Independent review found two pre-existing contradictions. Kiattisak explicitly approved the recommended correction:

- `bookingAvailable` now includes resolved daily availability, so a closed/in-store-only day cannot present an active booking CTA.
- The safe intake/date fallback is fail-closed instead of claiming every capability is open when repository reads fail.
- Home CTA roles and badge/title/notice copy now derive from the complete booking + walk-in matrix.
- A repository fallback produces a read-only unavailable state, dash queue aggregates, disabled new-intake actions, and no fallback service claims.

## Responsive ownership

- `360–859px`: one-column customer task flow.
- `>=860px`: status/actions on the left and services/lookup on the right.
- Exact evidence covers `360 / 390 / 420 / 421 / 559 / 560 / 768 / 859 / 860 / 1024 / 1440`.
- Status mascot remains visible and contained at narrow widths.
- Customer actions measure at least 72px; queue lookup submit measures 48px.
- No horizontal overflow exists at any measured width.
- The owner desktop-grid rule is now scoped to `.bqa-owner-board-shell`, preventing customer collapse at `1024px+`.
- Contrast checks: disabled text `5.85:1`, primary/on-dark `18.59:1`, secondary text `6.67:1`, muted text `5.16:1`, warning text `6.35:1`.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 37/37 passed
- Customer home responsive/state/truth/long-text/keyboard Playwright: 5/5 passed
- Full Playwright: 41/41 passed

## Human decision recorded

Kiattisak approved customer home after explicitly authorizing the full intake-matrix and fail-closed truth correction, then authorized booking migration.
