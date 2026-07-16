# Pilot Operations Runbook

## Daily opening

1. Open `/owner` over HTTPS and confirm login works.
2. Check today's recurring/special-date availability, services, opening hours, and online intake state.
3. Open `/api/health`; require HTTP `200`, `ok: true`, and `database: reachable`.
4. Create one clearly named smoke queue, verify it appears in owner view, then cancel/delete it according to the production smoke-data procedure.
5. Confirm LINE `SENT` with a test account if LINE notifications are part of that day's pilot.

## If the web app or database is unavailable

1. Stop advertising online intake and tell customers to contact/visit the shop directly.
2. Continue the queue on paper or in the shop's normal LINE chat; do not submit repeated forms while health is failing.
3. Record the last known active queue and incident time.
4. Check Dokploy web/Postgres health and logs. Do not reset the database volume as a first response.
5. Restore service, run the deployment smoke checklist, reconcile manual entries, then reopen online intake.

## Backup

From the repository root on a machine that can access the deployed Compose project:

```bash
scripts/backup-database.sh <compose-project-name> /secure/path/barber-backups
```

Store the `.dump` and `.sha256` files outside the Dokploy host. A backup on the same host/volume is not sufficient.

Recommended pilot schedule:

- automatic nightly backup;
- manual backup before every migration/deploy that changes the database;
- keep at least seven daily copies during pilot.

## Restore rehearsal

Use a disposable/staging Compose project—not production—for the first rehearsal:

```bash
RESTORE_CONFIRM=restore-barber-queue \
  scripts/restore-database.sh <staging-compose-project-name> /secure/path/barber-queue-<timestamp>.dump
```

After restore, verify `/api/health`, owner login, current queue, settings, services, and one tracking URL. Record the date, backup filename/hash, target, operator, and result in the pilot log.

## Data retention

Preview records older than `CUSTOMER_DATA_RETENTION_DAYS`:

```bash
cd app
pnpm privacy:prune
```

Only after a fresh backup and count review:

```bash
pnpm privacy:prune -- --execute
```

The job anonymizes old queue/notification details and deletes orphaned old customer records. Run monthly during pilot. Do not run it while investigating a customer dispute or incident involving those records.

## Incident stop conditions

Close online intake and preserve logs/backups when:

- public output exposes a customer name, phone, LINE ID, note, internal note, database ID, or tracking token belonging to another customer;
- a fixed booking slot is accepted twice;
- owner actions update the wrong queue;
- database restore/migration state is uncertain;
- notification content is sent to the wrong LINE user.
