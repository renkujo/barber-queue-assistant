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
  - [ ] `LINE_CHANNEL_SECRET` if LINE is enabled
  - [ ] `LINE_CHANNEL_ACCESS_TOKEN` if LINE is enabled
  - [ ] `NEXT_PUBLIC_LINE_LIFF_ID` if LIFF is enabled
- [ ] Deploy and confirm containers are healthy.
- [ ] Run `pnpm db:seed` once inside the web container.

## Phase 3 — App smoke

- [ ] `GET /api/health` returns success.
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

## Phase 4 — LINE smoke, after public HTTPS domain exists

- [ ] LINE webhook URL set to `https://<domain>/api/line/webhook`.
- [ ] LINE webhook verification passes.
- [ ] LIFF endpoint set to `https://<domain>/line`.
- [ ] Rich menu uses `/line?target=walk-in` and `/line?target=book`.
- [ ] Open LIFF from LINE and create a queue item.
- [ ] Owner starts service.
- [ ] LINE push notification is received.
- [ ] `NotificationLog` records `LINE/SENT` for the test notification.

## Rollback notes

- If web fails before listening, check Prisma migration logs and `DATABASE_URL` first.
- If LINE works locally but not production, verify the webhook URL, channel secret, and that the public domain uses HTTPS.
- If owner login loops, check `BARBER_ADMIN_SESSION_SECRET` and browser secure cookie behavior on HTTPS.
