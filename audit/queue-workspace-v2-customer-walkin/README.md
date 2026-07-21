# Queue Workspace V2 — Customer Walk-in Review

Status: technical QA passed; human-approved after privacy and server-authority corrections.

## Scope

- `/walk-in` opts into `data-customer-visual="v2"`.
- Open-hours, global/daily intake, in-store-only ownership, aggregate queue/wait status, service choice, optional phone, note, privacy acknowledgement, collision-aware estimate, rate limit, server creation, notification, and public tracking redirect remain authoritative.
- Repository or aggregate-status failure is fail-closed: new intake is disabled, queue/wait values render as dashes, and fallback services are not presented as current shop data.
- Recoverable action errors stay inline and preserve service/contact/note state plus the verified signed LINE identity cookie for retry.
- Service Select uses the explicit V2 portal class and preserves full long option text.
- LINE entry cookies are purpose-bound (`book`, `walk-in`, `owner`); owner completion clears its cookie and cannot leak owner identity into a customer queue.
- Customer creation requires an existing active service server-side; inactive or forged service IDs are rejected.
- Walk-in estimate assignment is serialized with a transaction-scoped PostgreSQL advisory lock so concurrent arrivals cannot claim the same estimate.

## Review files

Canonical form:

- `walkin-360x800.png`
- `walkin-390x844.png`
- `walkin-560x900.png`
- `walkin-760x900.png`
- `walkin-768x1024.png`
- `walkin-1024x768.png`
- `walkin-1440x1000.png`

States:

- `intake-closed-390x844.png`
- `outside-hours-390x844.png`
- `outside-hours-in-store-only-390x844.png`
- `in-store-only-390x844.png`
- `no-services-390x844.png`
- `action-error-preserved-390x844.png`
- `long-service-select-viewport-390x844.png`

Geometry:

- `geometry.json`

State fixtures restore exact shop/date/service values in `finally`. Test-created queues are removed, purpose cookies are cleared after success/owner completion, and only scoped test rate-limit buckets are cleared rather than represented as exact snapshots.

## Responsive ownership

- `360–759px`: live status appears before the single-column walk-in task.
- `>=760px`: the form remains primary and the 220px live-status rail becomes sticky on the right.
- Exact automated geometry covers `360 / 390 / 559 / 560 / 759 / 760 / 768 / 1024 / 1440`.
- Submit measures 52px; inherited V2 fields and Select triggers remain at least 48px.
- Long portaled service labels wrap inside viewport bounds.
- No horizontal overflow exists at any measured width.

## Technical evidence

- TypeScript: passed
- ESLint: passed
- Production build: passed
- Integration: 46/46 passed, including purpose-cookie, active-service, and concurrent-estimate cases
- Walk-in V2 responsive/state/retry/LINE/keyboard/long-text/single-error: 5/5 passed
- Full Playwright: 53/53 passed
- Existing customer walk-in → public tracking → owner queue → complete flow: passed

## Human decision recorded

Kiattisak approved customer walk-in and authorized public tracking migration.
