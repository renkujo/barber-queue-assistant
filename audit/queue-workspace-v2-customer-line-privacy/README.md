# Queue Workspace V2 — LINE Entry and Privacy Review

Status: technical QA passed; human-approved.

## Scope and preserved contracts

- `/line` and `/line/owner` opt into `data-customer-visual="v2"`; LIFF initialization, target normalization, server-side ID-token verification, purpose-bound identity cookies, and clean destination URLs remain authoritative.
- Owner settings issues the connect token only when the authenticated connect route is clicked—not while rendering settings. Owner completion consumes and clears only the owner-purpose cookie. Its ten-minute connect token contains a random nonce persisted and atomically consumed once; replay is rejected. Its visible connected/invalid/missing result is carried in a separate domain-separated, signed two-minute result token; direct `?status=connected` claims are ignored.
- `/privacy` opts into customer V2 while preserving collected-data, purpose, 180-day pilot retention, customer-rights, optional-phone, LINE-cookie, public-tracking, contact-config, and last-updated disclosures.
- Missing LIFF, malformed LIFF state, outside-LINE/error, connecting/no-JavaScript, owner connected/missing/invalid, and missing privacy-contact states remain explicit.
- Kiattisak confirmed the pilot is not opening yet; the missing real privacy contact remains an explicit deployment blocker rather than being replaced with invented data.

## Review files

LINE entry:

- `line-entry-360x800.png`
- `line-entry-390x844.png`
- `line-entry-768x1024.png`
- `line-entry-1440x1000.png`
- `line-connecting-nojs-390x844.png`
- `line-setup-missing-360x800.png`
- `line-setup-missing-390x844.png`
- `line-setup-missing-760x900.png`
- `line-setup-missing-768x1024.png`
- `line-setup-missing-1440x1000.png`

Owner completion:

- `owner-line-connected-390x844.png`
- `owner-line-missing-line-390x844.png`
- `owner-line-invalid-390x844.png`

Owner connected/missing/invalid were additionally captured at `360 / 760 / 768 / 1440`; those files use the same owner-line state/width/height naming pattern.

Privacy:

- `privacy-360x800.png`
- `privacy-390x844.png`
- `privacy-768x1024.png`
- `privacy-1440x1000.png`

Geometry:

- `geometry.json`

## Responsive ownership

- LINE and owner completion remain focused single-task cards up to 480px wide; their actions stay stacked with at least 8px separation.
- LINE state panel and action group retain at least 12px separation at every tested viewport.
- Privacy remains a readable single-column legal surface up to 780px wide; every direct header/notice/disclosure/note block and sibling disclosure card retains at least 12px separation.
- Exact automated coverage includes `360 / 390 / 559 / 560 / 759 / 760 / 768 / 1024 / 1440`.
- Long target labels, owner notices, contact configuration warnings, and the signed-cookie Thai disclosure are checked for horizontal and vertical clipping inside their owning cards.
- No horizontal overflow exists at measured widths.
- Connecting/setup/success/informational states use polite `status` live regions; connection/invalid failures use assertive `alert` semantics.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 52/52 passed, including nonce-backed one-use connection and four signed owner-result cases
- LINE/privacy V2 states/gaps/long-text/signature: 4/4 passed
- Full Playwright: 62/62 passed
- Existing LINE target fallback and owner cookie-clearing suite: passed

## Human decision recorded

Kiattisak approved LINE entry and Privacy V2 and authorized Phase 5 consolidation. The missing real privacy contact remains deferred until pilot launch by explicit decision.
