# Queue Workspace V2 — Settings Pilot Review

Status: Operational Monochrome R2 human-approved.

## What changed

- `/owner/settings` opts into `data-owner-visual="v2"` through the shared OwnerShell API.
- This packet records the initial scoped pilot; subsequent owner routes were promoted through their own reviewed packets.
- V2 semantic tokens exist beside legacy tokens; no global legacy alias was flipped.
- R1 tested white canvas, dark full-pill actions, yellow navigation emphasis, and pastel icon surfaces. The product owner requested a more black-and-white, serious, formal direction.
- R2 uses a white canvas, restrained gray grouping, black rectangular actions, smaller radii, neutral navigation, and color only for semantic truth or LINE.
- Settings actions, fields, server action, validation, LINE truth, links, route behavior, and responsive ownership remain unchanged.

## Review files

Baseline:

- `baseline-390x844.png`
- `baseline-1440x1000.png`

R1 candidate — revised, not promoted:

- `candidate-r1-360x800.png`
- `candidate-r1-390x844.png`
- `candidate-r1-768x1024.png`
- `candidate-r1-1024x768.png`
- `candidate-r1-1440x1000.png`

R2 Operational Monochrome candidate:

- `candidate-r2-360x800.png`
- `candidate-r2-390x844.png`
- `candidate-r2-768x1024.png`
- `candidate-r2-1024x768.png`
- `candidate-r2-1440x1000.png`

R2 desktop sidebar redesign:

- `sidebar-r2-1024x768.png`
- `sidebar-r2-1440x1000.png`
- `sidebar-r2-geometry.json`

Content stress:

- `stress-r2-390x844.png` — long Thai shop name, all online channels closed, 240-minute manual wait, LINE connected
- `stress-r2-1440x1000.png` — same deterministic stress state

Geometry:

- `geometry-r1.json`
- `geometry-r2.json`

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Integration: 37/37 passed
- Settings Playwright: 10/10 passed including scope, truthful unsaved state, FormField accessibility, explicit portal styling, save submission, boundary widths, overflow, and bottom-nav clearance
- Owner workflow Playwright: 19/19 passed
- Production build: passed
- Production screenshots: no horizontal overflow at all five required viewports
- Long-content stress: no horizontal overflow at 390px and 1440px
- Save-button clearance after scroll: 131px at 360/390px and 46px at 768px
- Desktop rail actions remain inside their cards
- Boundary ownership verified at 760, 767, 768, 1023, 1024, 1179, and 1180px
- Dark sidebar geometry verified with 16px viewport inset, contained footer, white active destination, and zero horizontal overflow at 1024px and 1440px

## Human decision recorded

Kiattisak approved Operational Monochrome R2 and the floating dark command rail. The approved system then became the authority for the remaining owner-route migrations.
