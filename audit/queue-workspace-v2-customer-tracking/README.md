# Queue Workspace V2 — Customer Tracking Review

Status: technical QA passed; human-approved with strengthened responsive spacing and long-text QA.

2026-07-23 responsive regression follow-up: a real seven-character queue code containing wide glyphs could be clipped by the dark ticket at narrow widths even though page-level overflow stayed zero. The code now uses an explicit full-width monospaced anchor with responsive sizing, and Playwright asserts a worst-case `QWMWMWM` fixture stays inside the ticket at every covered breakpoint.

## Scope and privacy boundary

- `/queue/[publicToken]` opts into `data-customer-visual="v2"`; database IDs remain invalid public routes.
- Dedicated UUID public token lookup, `noindex,nofollow`, masked customer name, deterministic queue code and four-digit access PIN remain authoritative.
- Public mapping exposes service, customer-safe time, status label/tone, queue code, masked name, and PIN only. Phone, LINE ID, customer note, owner note, database ID, and public token are not rendered in visible content.
- Explicit Thai guidance covers confirmed, arrived, waiting, in-progress, late, no-show, cancelled, and done states.
- Unknown/expired public tokens use the scoped V2 404 and never fall back to database ID lookup.
- Public lookup rejects malformed tokens before database access and rejects real database IDs even when they are UUID-shaped.
- Name masking is Thai grapheme-aware and always conceals at least one grapheme; one-grapheme names render fully masked.
- Arrived/in-progress/done use positive teal, late uses warning amber, and cancelled/no-show use destructive red with text labels.
- The V2 404 is route-local to `/queue/[publicToken]`; unrelated LINE/privacy/owner 404s retain legacy scope.

## Review files

Canonical waiting state:

- `tracking-waiting-360x800.png`
- `tracking-waiting-390x844.png`
- `tracking-waiting-768x1024.png`
- `tracking-waiting-1024x768.png`
- `tracking-waiting-1440x1000.png`

Wide-glyph queue-code regression:

- `tracking-wide-code-360x844.png`
- `tracking-wide-code-390x844.png`

Status variants:

- `status-confirmed-390x844.png`
- `status-arrived-390x844.png`
- `status-in-progress-390x844.png`
- `status-late-390x844.png`
- `status-no-show-390x844.png`
- `status-cancelled-390x844.png`
- `status-done-390x844.png`
- `not-found-390x844.png`

Geometry:

- `geometry.json`

The evidence queue row was isolated and deleted after capture.

## Responsive ownership

- `360–559px`: ticket, PIN, guidance, details, and actions form one vertical customer task.
- `560–759px`: content remains one column while the two actions share a row.
- `>=760px`: ticket/PIN/guidance stay primary and the 220px service/time rail moves right.
- Exact automated geometry covers `360 / 390 / 559 / 560 / 759 / 760 / 768 / 1024 / 1440`.
- Long Thai service names wrap without clipping; no horizontal overflow exists at measured widths.
- Sibling ticket/PIN/message/detail cards keep at least 12px separation on stacked layouts; desktop form/rail separation is at least 16px and action gaps are at least 8px.
- Long Thai text is checked against its owning card bounds for both horizontal and vertical clipping, including natural card-height growth.
- Keyboard order is `กลับหน้าแรก` then `รับบัตรคิวใหม่`.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 47/47 passed
- Tracking V2 responsive/privacy/status/keyboard/404: 4/4 passed
- Full Playwright: 57/57 passed
- Existing booking and walk-in creation redirects still resolve through UUID public tokens: passed

## Human decision recorded

Kiattisak approved public tracking and explicitly strengthened the remaining rollout gate: every responsive review must verify intentional section/card gaps plus long Thai wrapping, clipping, overlap, and natural card-height growth—not only page-level overflow.
