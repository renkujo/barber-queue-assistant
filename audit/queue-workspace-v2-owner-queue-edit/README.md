# Queue Workspace V2 — Owner Queue Edit Review

Status: technical QA passed; human-approved.

## Scope

- `/owner/queue/[id]/edit` opts into `data-owner-visual="v2"`.
- Authoritative fields remain customer name, optional phone, service, date, locked/unlocked time, customer note, and private owner note.
- `__none__` still represents `ไม่ล็อกเวลา / walk-in`.
- Conflict, outside-hours, invalid-data, database validation, existing-time exceptions, one-save action, and exact success redirect remain unchanged.
- The private owner note remains explicitly separated from customer-facing copy.
- Service, date, and time Select portals use the explicit V2 portal class.

## Review files

Edit workbench:

- `edit-360x800.png`
- `edit-390x844.png`
- `edit-768x1024.png`
- `edit-1024x768.png`
- `edit-1440x1000.png`

Conflict state:

- `conflict-390x844.png`
- `conflict-1440x1000.png`

Geometry:

- `geometry.json`

The fixture uses a deterministic `PW-E2E V2 Queue Edit` identity and was removed after capture. Review values were not submitted.

## Responsive ownership

- `<760px`: schedule section appears first, the rule rail is hidden, and the single save action remains at the form end.
- `760–1399px`: edit panel and factual rules stack without squeezing the schedule controls.
- `>=1400px`: 836px edit panel plus 280px sticky factual rule rail.
- Primary save action measures 52px.
- No horizontal overflow exists at all five required viewports.
- Header/customer text wraps without changing stored values.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Queue-edit behavior/responsive/privacy/portal Playwright: passed
- Aggregate owner workflow suite: 27/27 passed

## Human decision recorded

Kiattisak approved queue edit and authorized customer-route migration.
