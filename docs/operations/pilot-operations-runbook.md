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

The production Compose stack includes a disabled-by-default logical PostgreSQL backup sidecar. Configure it with [`cloudflare-r2-backup.md`](./cloudflare-r2-backup.md). Do not use a live PostgreSQL volume snapshot as the primary database backup.

For the automated path, require one verified `.dump` + `.sha256` pair in the private R2 bucket each day and a 14-day lifecycle rule.

For an additional manual backup from a machine that can access the deployed Compose project:

From the repository root on a machine that can access the deployed Compose project:

```bash
scripts/backup-database.sh <compose-project-name> /secure/path/barber-backups
```

Store the `.dump` and `.sha256` files outside the Dokploy host. A backup on the same host/volume is not sufficient.

Recommended pilot schedule:

- automatic nightly backup with a hard 14-day R2 lifecycle;
- manual backup before every migration/deploy that changes the database;
- delete every manual pilot copy and checksum within 7 days unless a separately approved incident hold names that copy and expiry.

Record lifecycle-rule screenshots/configuration and manual-copy deletion receipts outside git without credentials or customer data. A live deletion may therefore remain in protected automated backups for at most 14 days and manual copies for at most 7 days.

## Restore rehearsal

Use a disposable/staging Compose project—not production—for the first rehearsal:

```bash
RESTORE_CONFIRM=restore-barber-queue \
RESTORE_TARGET_PROJECT_CONFIRM=<staging-compose-project-name> \
RESTORE_ISOLATED_CONFIRM=isolated-disposable \
RESTORE_OUTBOUND_DISABLED_CONFIRM=no-public-or-notifications \
  scripts/restore-database.sh <staging-compose-project-name> /secure/path/barber-queue-<timestamp>.dump
```

An older backup may be restored only into an isolated disposable project with no public route, notifications, shared credentials, or production network write path. Verify its checksum first. Because portable dumps use `--no-owner --no-acl`, apply current migrations and then run `app/scripts/reconcile-pilot-function-owner.sql` before provisioning bounded roles; otherwise restored security-definer functions belong to the restore user. Run retention dry-run and execute, replay all approved subject-deletion receipts, and verify expired cohorts/held records before any application smoke. Never copy the restored database into production. Destroy the disposable database and downloaded backup after evidence review. `scripts/verify-pilot-backup-restore.sh` provides a synthetic local proof without touching the application database.

After re-pruning, verify `/api/health`, owner login, current queue, settings, services, and one synthetic tracking URL. Record the date, backup filename/hash, isolated target, operator, retention/subject postconditions, destruction time, and result in the protected pilot log.

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

The bounded retention role calls only versioned security-definer functions. The job anonymizes old queue/notification details and deletes orphaned old customer records. It prunes each expired cohort independently, removes eligible rows from shared operations while preserving held evidence, and is idempotent across cohorts. Run monthly during pilot. A customer dispute or incident may pause all PII and event/notification evidence for only its linked queue(s) through a scoped approved hold; unrelated records in the same operation and other cohorts continue under normal retention.

## Pilot instrumentation operations

Keep `PILOT_MEASUREMENT_ENABLED=false` until the separate enablement gate. External Daily Close location selection and measurement enablement remain blocked. Create the immutable cohort and run report/classification/hold/correction/subject/retention commands only from a short-lived process on the private Compose network with exactly one separately injected bounded credential. Never reuse `DATABASE_URL`, load operator credentials from app `.env`, or place operator URLs in the web service.

Provision or rotate with `app/scripts/provision-pilot-roles.sql` using an admin one-off process and injected `expected_database`, `app_role`, and three generated passwords. The script preserves explicit application-schema usage, revokes broad PUBLIC access, and grants login roles only `CONNECT`, schema `USAGE`, and approved function `EXECUTE`. Functions are versioned, `SECURITY DEFINER`, owned by `bqa_pilot_function_owner` (`NOLOGIN`), use fixed `search_path`, and revoke PUBLIC execute. Run `app/scripts/verify-pilot-role-grants.sql` after creation, rotation, restore, and every migration. Emergency disable uses `app/scripts/disable-pilot-roles.sql`, which sets all three roles to `NOLOGIN`, revokes function execution, and terminates their sessions.

Every operator command requires `PILOT_NETWORK_SCOPE=private`; outside that network the URL must use `sslmode=verify-full`. Set independent reviewed inventory values in `PILOT_EXPECTED_DATABASE` and `PILOT_EXPECTED_HOST`; the credential URL and connected `current_user/current_database` must match those values exactly. Set `PILOT_DATABASE_ENV=production` and pass `--confirm-production` for production. Capture only bounded JSON receipts; never capture URLs, passwords, PII, raw IDs, tokens, PINs, notes, or report raw rows. Rotate by replacing the one login password; emergency disable with `ALTER ROLE <role> NOLOGIN`, revoke function execute, and terminate that role's sessions.

Create a cohort with approved pilot end, shop timezone, and approval reference; the database computes local end-of-day exactly 90 days after pilot end. Classification reasons are fixed to `SMOKE_TEST`, `TRAINING_RECORD`, `DATA_QUALITY`, `OPERATOR_ERROR`, `REVIEWED_RESTORE`, or `OTHER_APPROVED`; restoring an excluded queue to `REAL` requires `REVIEWED_RESTORE` plus reviewed-restore approval and always writes operator audit. Correction reasons are fixed to `FACTUAL_STATUS_ERROR`, `FACTUAL_TIME_ERROR`, or `FACTUAL_STATUS_AND_TIME_ERROR`; corrections append typed evidence under queue/cohort locks. Subject deletion processes every queue linked to the verified customer in one transaction and rechecks holds after locking.

Required pre-collection evidence:

- disabled mode collects no pilot fields;
- `/api/health` reports configured cohort/release only after the matching cohort exists;
- the filled Daily Close location and access/deletion procedure is approved outside git;
- generated JSON is labelled owner/operator-only and is never shared directly;
- reconciliation closes at the next shop opening or 12:00 the next day;
- R2 backup lifecycle is 14 days and manual copies no more than 7 days;
- an old backup is restored only in isolation and current pruning runs before operational use.

An active evidence hold is limited to 30 days, reviewed weekly, and blocks deletion only for its queue. Extension requires fresh explicit approval. Customer access/correction uses existing owner views/editing; deletion runs the bounded subject-request procedure after queue-code + PIN verification.

## Incident stop conditions

Close online intake and preserve logs/backups when:

- public output exposes a customer name, phone, LINE ID, note, internal note, database ID, or tracking token belonging to another customer;
- a fixed booking slot is accepted twice;
- owner actions update the wrong queue;
- database restore/migration state is uncertain;
- notification content is sent to the wrong LINE user.
