# Cloudflare R2 Backup for Compose PostgreSQL

This project runs PostgreSQL as a Docker Compose service, not as a Dokploy-managed database. Use the committed logical-backup sidecar instead of a live volume snapshot. The sidecar runs `pg_dump --format=custom`, creates a SHA-256 sidecar, uploads both files to R2, and verifies that both remote objects exist.

## 1. Create the R2 bucket

In Cloudflare:

1. Open **R2 Object Storage** and enable/purchase R2. The pilot should remain inside the current free tier, but Cloudflare may require billing setup.
2. Create bucket `barber-queue-backups`.
3. Choose the Asia-Pacific location hint when available.
4. Add a lifecycle rule that deletes objects under `barber-queue-assistant/postgres/` after **14 days**. This keeps at least seven daily recovery points while allowing for missed runs.

## 2. Create a scoped token

1. Open **R2 Object Storage → Manage API tokens**.
2. Create a **User API Token** named `dokploy-barber-queue-backup`.
3. Permission: **Object Read & Write**.
4. Scope it only to `barber-queue-backups`.
5. Copy the Access Key ID and Secret Access Key into a password manager immediately. Cloudflare will not show the secret again.

Do not paste either credential into chat, repository files, screenshots, or issue trackers.

## 3. Configure Dokploy Compose environment

Add these values to the existing Compose service environment:

```env
R2_BACKUP_ENABLED=false
R2_BACKUP_INTERVAL_HOURS=24
R2_BACKUP_RETRY_MINUTES=15
R2_BACKUP_MAX_ATTEMPTS=3
R2_PROVIDER=Cloudflare
R2_REGION=auto
R2_ENDPOINT=https://<cloudflare-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<R2-access-key-id>
R2_SECRET_ACCESS_KEY=<R2-secret-access-key>
R2_BUCKET=barber-queue-backups
R2_PREFIX=barber-queue-assistant/postgres
```

Keep `R2_BACKUP_ENABLED=false` for the first deploy. Save and redeploy Compose, then confirm the `backup` service stays running and logs that it is disabled rather than restarting.

## 4. Enable and test

1. Set `R2_BACKUP_ENABLED=true`.
2. Save and redeploy Compose.
3. The sidecar always creates one backup immediately after it is enabled, then repeats every 24 hours. It allows three total attempts at 15-minute intervals before waiting for the next regular interval.
4. In the `backup` service logs, require:

```text
Backup uploaded; remote dump and checksum objects confirmed
```

5. In the R2 bucket, require two objects with the same timestamp:

```text
barber-queue-assistant/postgres/barber-queue-<UTC timestamp>.dump
barber-queue-assistant/postgres/barber-queue-<UTC timestamp>.dump.sha256
```

Do not treat the schedule as enabled until both objects exist and the checksum sidecar is non-empty. The upload path confirms remote object existence; recovery integrity is proven by the scheduled download/checksum/restore rehearsal, not by upload alone.

The Compose healthcheck remains healthy while backup is disabled. After enabling, its initial grace period covers the default three-attempt window; afterward it requires a successful marker and becomes unhealthy when the latest confirmed upload is more than two hours past the configured interval. Treat an unhealthy `backup` service as an operations alert; it does not stop the web or PostgreSQL services.

## 5. Recovery rehearsal

For the first rehearsal, download one `.dump` and `.sha256` pair from R2 to a secure machine, verify the checksum, and restore only into a disposable/staging Compose project using `scripts/restore-database.sh`. Never rehearse by overwriting production.

## Rotation and incident rules

- Rotate the R2 token immediately if it appears in chat, logs, screenshots, shell history, or repository files.
- Keep the bucket private; do not enable an R2 public development URL or custom public domain.
- A failed backup must not stop the production web/database services. Review the `backup` service logs and rerun after correcting credentials or connectivity.
- Before a production migration, verify a recent R2 object exists and take an additional manual backup when practical.

## Current reference limits

Cloudflare's published R2 Standard free tier currently includes 10 GB-month storage, 1 million Class A operations, and 10 million Class B operations per month, with no egress bandwidth charge. Confirm current pricing in Cloudflare before relying on these values long term.
