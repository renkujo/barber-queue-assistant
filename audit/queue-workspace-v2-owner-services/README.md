# Queue Workspace V2 — Owner Services Review

Status: technical QA passed; human-approved before the boundary-hardening follow-up.

## Scope

- `/owner/settings/services` opts into `data-owner-visual="v2"`.
- Existing service ordering, create fields, edit fields, active status Select, soft-disable/restore action, validation, server actions, and redirects remain unchanged.
- Service names support two-line clamping while retaining full text in the DOM and `title`.
- The status Select portal uses the explicit V2 portal class.

## Review files

- `services-360x800.png`
- `services-390x844.png`
- `services-768x1024.png`
- `services-1024x768.png`
- `services-1440x1000.png`
- `create-390x844.png`
- `geometry.json`
- `boundary-1399x900.png`
- `boundary-1400x900.png`
- `boundary-1439x900.png`
- `boundary-1440x1000.png`
- `boundary-geometry.json`

The first visible edit field contains long review text but was not submitted or persisted.

## Responsive ownership

- `<=760px`: mobile add-service disclosure and compact service cards.
- `761–1439px`: compact service cards without internal horizontal scrolling; create form remains reachable before or beside the list according to shell width.
- `>=1440px`: connected comparison table plus the 320px create rail.
- Mobile controls measure 48px; desktop controls measure at least 44px.
- No page-level horizontal overflow exists at the five required viewports.
- At 768px and 1024px, service list `clientWidth` equals `scrollWidth`; actions are not clipped.
- At 1399px, 1400px, and 1439px compact rows have exact `clientWidth === scrollWidth` and their action control remains inside the table boundary.
- At 1440px the connected comparison has `scrollWidth === clientWidth` and its 84px manage column remains fully inside the table.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Services responsive/portal/auth Playwright: 5/5 passed
- Aggregate owner workflow suite: 27/27 passed

## Human decision recorded

Kiattisak approved the services workbench. Independent owner-wide review then identified a 1400px verification risk; comparison ownership was delayed to 1440px and the 1399/1400/1439/1440 boundary was added to regression coverage.
