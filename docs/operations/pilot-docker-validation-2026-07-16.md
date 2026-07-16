# Pilot Docker Validation — 2026-07-16

Scope: local disposable production-shaped validation after Docker Desktop became available. No production environment or customer data was used.

## Evidence

- Standalone production image built successfully as `bqa-pilot-hardening:local`.
  - Image SHA-256: `04e4736e382a216fce73f1d71fd01a55e85b42395bf0e9980986b373255e29dd`
  - Image size: `941671898` bytes
- Disposable Compose project: `bqa-pilot-hardening-test`.
- PostgreSQL 17 container reached healthy state.
- Web container started through `pnpm deploy:start`.
- All seven migrations, including `20260716090000_add_pilot_security_boundaries`, were applied and `prisma migrate status` reported the schema up to date.
- `/api/health` returned `ok: true` and `database: reachable` from inside the production web container.
- Seed completed with three services.
- `/api/queue/status` returned aggregate shop status only and contained no customer or queue-item records.
- Runtime `/privacy` output contained the configured disposable contact marker.

## Backup/restore rehearsal

1. `scripts/backup-database.sh` created a non-empty custom-format PostgreSQL dump and SHA-256 sidecar.
2. `scripts/restore-database.sh` restored that dump into the same disposable project with the explicit confirmation gate.
3. Post-restore checks passed:
   - `/api/health` reported the database reachable;
   - three seeded services were present;
   - all seven migrations remained up to date.

The disposable dump, containers, network, PostgreSQL volume, and Compose image were removed after validation. The standalone validation image remains locally tagged for review; no production deploy occurred.

## Remaining production-only gates

- Set real secrets and privacy contact in Dokploy.
- Deploy outside operating hours with no active real queue.
- Create and retain an off-host production backup.
- Configure external uptime monitoring.
- Complete production owner, booking, walk-in, tracking, and real LINE send smoke tests.
