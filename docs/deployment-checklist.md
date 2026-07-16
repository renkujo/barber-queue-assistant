# Deployment Checklist

## Phase 1 — Repo readiness

- [ ] `Dockerfile` builds the Next.js app from `app/`.
- [ ] `.dockerignore` excludes local env, build output, test output, and `node_modules`.
- [ ] `docker-compose.deploy.yml` uses internal `expose`, not host `ports`.
- [ ] `app/package.json` has `db:deploy` and `deploy:start` scripts.
- [ ] `.env.production.example` lists all required production variables without secrets.
- [ ] Validation passes from `app/`:
  - [ ] `pnpm typecheck`
  - [ ] `pnpm lint`
  - [ ] `pnpm test:integration`
  - [ ] `pnpm e2e`
  - [ ] `pnpm prisma:validate`
  - [ ] `pnpm build`

## Phase 2 — Haabiz/Dokploy setup

- [ ] Schedule this migration outside operating hours with no real active queue; old database-ID tracking links will no longer open.
- [ ] Create/confirm project in Haabiz sandbox.
- [ ] Configure repository/deploy branch.
- [ ] Select Docker Compose deployment using `docker-compose.deploy.yml`.
- [ ] Configure persistent volume for PostgreSQL.
- [ ] Set production environment variables:
  - [ ] `POSTGRES_DB`
  - [ ] `POSTGRES_USER`
  - [ ] `POSTGRES_PASSWORD`
  - [ ] `DATABASE_URL`
  - [ ] `BARBER_ADMIN_PASSCODE`
  - [ ] `BARBER_ADMIN_SESSION_SECRET`
  - [ ] `RATE_LIMIT_HASH_SECRET` (different random secret)
  - [ ] `NEXT_PUBLIC_PRIVACY_CONTACT`
  - [ ] `CUSTOMER_DATA_RETENTION_DAYS`
  - [ ] R2 backup variables from `docs/operations/cloudflare-r2-backup.md` (`R2_BACKUP_ENABLED=false` until tested)
  - [ ] `LINE_CHANNEL_SECRET` if LINE is enabled
  - [ ] `LINE_CHANNEL_ACCESS_TOKEN` if LINE is enabled
  - [ ] `OWNER_LINE_USER_ID` only if using manual owner LINE alert fallback
  - [ ] `NEXT_PUBLIC_LINE_LIFF_ID` if LIFF is enabled
- [ ] Deploy and confirm containers are healthy.
- [ ] Run `pnpm db:seed` once inside the web container.

## Phase 3 — App smoke

- [ ] `GET /api/health` returns success.
- [ ] Health response reports `database: reachable`; database failure returns HTTP `503`.
- [ ] `GET /api/queue/status` contains no queue/customer detail fields.
- [ ] `/` renders.
- [ ] `/book` renders.
- [ ] `/walk-in` renders.
- [ ] `/owner/login` renders.
- [ ] Owner can log in.
- [ ] Customer walk-in can be created.
- [ ] Owner dashboard shows the new queue item.
- [ ] Owner can start service.
- [ ] Owner can mark done/cancel/no-show.
- [ ] Closed list shows terminal queue item.
- [ ] Notification log panel does not break if LINE env is empty.
- [ ] Tracking URL uses a public token, displays a masked name, and sends `noindex` metadata.
- [ ] Queue-code lookup accepts only the four-digit access PIN and rate-limits attempts by client IP and queue code.
- [ ] Owner can copy tracking details for a phone-less queue.
- [ ] `/privacy` displays the real pilot contact channel.

## Phase 3.5 — Pilot operations

- [ ] Run `scripts/backup-database.sh` and store backup/checksum off-host.
- [ ] Enable the Compose `backup` sidecar and confirm a `.dump` + `.sha256` pair exists in the private R2 bucket.
- [ ] Add a 14-day R2 lifecycle rule for the backup prefix.
- [ ] Complete one restore rehearsal in a disposable/staging Compose project.
- [ ] Configure external uptime monitoring for `/api/health` including HTTP `503` alerts.
- [ ] Review `docs/pilot-readiness-plan.md` and `docs/operations/pilot-operations-runbook.md` with the shop owner.

## Phase 4 — LINE smoke, after public HTTPS domain exists

- [ ] LINE webhook URL set to `https://<domain>/api/line/webhook`.
- [ ] LINE webhook verification passes.
- [ ] LIFF endpoint set to `https://<domain>/line`.
- [ ] Rich menu uses `/line?target=walk-in` and `/line?target=book`.
- [ ] Open LIFF from LINE and create a queue item.
- [ ] Owner starts service.
- [ ] LINE push notification is received.
- [ ] Owner connects LINE from `/owner/settings` if owner lock-screen alerts are needed.
- [ ] `NotificationLog` records `LINE/SENT` for the test notification.

## Rollback notes

- If web fails before listening, check Prisma migration logs and `DATABASE_URL` first.
- If LINE works locally but not production, verify the webhook URL, channel secret, and that the public domain uses HTTPS.
- If owner login loops, check `BARBER_ADMIN_SESSION_SECRET` and browser secure cookie behavior on HTTPS.
