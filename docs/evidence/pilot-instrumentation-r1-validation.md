# Pilot Instrumentation R1 — Local Validation Receipt

Date: 2026-07-22
Scope: authorized local Slices A–F implementation only
Collection state: `PILOT_MEASUREMENT_ENABLED=false`

No real pilot data, operator credential, external Daily Close storage, customer recruitment, pricing offer, commit, or push was used.

## Automated validation

- Prisma generate: PASS
- Prisma schema validate: PASS
- TypeScript: PASS
- ESLint: PASS
- Integration: `81/81` PASS across `14` files
- Playwright: `65/65` PASS
- Production build: PASS
- Daily Close empty-template validator: PASS
- All pilot operator scripts `node --check`: PASS
- `git diff --check`: PASS
- Port `3000`, Next/Playwright/Vitest processes: closed after validation
- CocoIndex refreshed, then daemon stopped

The integration suite includes runtime checks for:

- disabled no-collection and enabled configuration failure modes;
- creation idempotency, operation-ID reuse rejection, quote immutability, status/no-op and auto-demotion truth;
- LINE insert-winner/PENDING behavior;
- corrected status and factual booking schedule report truth;
- old bearer-token revocation and per-queue held/unheld subject deletion;
- held/unheld shared-operation pruning across independently expiring cohorts;
- application-role append-only bypass denial even with the maintenance GUC set.

## Isolated PostgreSQL validation

A disposable local PostgreSQL database was created, all `14` repository migrations were deployed from empty state, bounded roles were provisioned with synthetic temporary passwords, and the database was destroyed afterward.

Result:

- clean migration deploy: PASS
- role provisioning: PASS
- reporter direct `QueueItem` select: DENIED
- operator direct `QueueItem` update: DENIED
- retention direct `QueueEvent` delete: DENIED
- reporter temporary-table creation: DENIED
- reporter/operator/retention approved function execution privilege: PASS
- disposable database cleanup: PASS (`0` matching databases remained)
- temporary pilot login roles returned to `NOLOGIN`
- bounded-role provision → verify → emergency disable → rotate/re-provision: PASS
- synthetic custom-format backup/checksum/`--no-owner --no-acl` restore, function-owner reconciliation, and retention replay: PASS

## Previous-client compatibility

Committed client `8179145` was extracted into a disposable directory, generated from its original Prisma schema, and run against a fresh database containing all `14` current migrations.

- previous queue repository integration: `24/24` PASS
- previous notification integration: `8/8` PASS
- total previous-client compatibility: `32/32` PASS
- disposable database/directory cleanup: PASS

## Local migration note

`prisma migrate dev` correctly refused because historical migration `20260626153000_initial_queue_schema` had already been modified after application in the existing local database. No reset or data deletion was performed. The deployment path, `prisma migrate deploy`, applied the new additive migrations successfully. A clean disposable database also applied all migrations successfully.

## Non-blocking warning

Vitest emitted the PostgreSQL driver deprecation warning for concurrent `client.query()` use during a concurrency test. The suite passed; this is test-driver cleanup work before `pg@9`, not evidence loss or a production runtime failure.

## Still blocked

- production deployment and production-like smoke;
- real bounded credential provisioning/rotation/revocation;
- approved external Daily Close location, viewers, MFA/access, deletion/hold, and deletion proof;
- real R2 14-day lifecycle and manual-copy 7-day deletion proof;
- isolated real-backup restore followed by current migration, retention, subject reconciliation, and destruction;
- human pre-collection review;
- separate measurement enablement approval;
- separate owner agreement and pilot-execution approval.

The follow-up operational receipt is [`pilot-precollection-operational-r1.md`](./pilot-precollection-operational-r1.md).
