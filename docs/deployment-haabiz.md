# Haabiz/Dokploy Deployment Guide

Deployment target: Haabiz sandbox / Dokploy environment.

This app is a single Next.js fullstack service under `app/` plus PostgreSQL. The Docker setup in this repo is intended for Dokploy-style deployments where the platform routes HTTPS traffic to the internal web container port.

## Services

Recommended production shape:

- `web` — Next.js app, internal port `3000`
- `postgres` — PostgreSQL, internal port `5432`, persistent volume

The provided `docker-compose.deploy.yml` uses `expose` instead of host `ports` so it does not conflict with other apps on the Haabiz host. Let Dokploy/Traefik/Caddy route the public domain to `web:3000`.

## Required environment variables

Use `.env.production.example` as the reference and set the real values in Haabiz/Dokploy.

```env
POSTGRES_DB="barber_queue_assistant"
POSTGRES_USER="barber_queue"
POSTGRES_PASSWORD="replace-with-strong-db-password"
DATABASE_URL="postgresql://barber_queue:replace-with-strong-db-password@postgres:5432/barber_queue_assistant?schema=public"

BARBER_ADMIN_PASSCODE="replace-with-owner-passcode"
BARBER_ADMIN_SESSION_SECRET="replace-with-long-random-secret"

LINE_CHANNEL_SECRET=""
LINE_CHANNEL_ACCESS_TOKEN=""
OWNER_LINE_USER_ID=""
NEXT_PUBLIC_LINE_LIFF_ID=""
```

Rules:

- Do not commit real `.env` values.
- `BARBER_ADMIN_SESSION_SECRET` must be a long random secret and should not equal the owner passcode.
- Leave LINE values empty only if LINE notifications/LIFF are not being tested yet.
- Set `OWNER_LINE_USER_ID` when the owner should receive LINE alerts for customer-created bookings/walk-ins.

## Build/start behavior

The Docker image builds from the repository root but runs commands from `app/`.

Container start command:

```bash
pnpm deploy:start
```

That runs:

```bash
prisma migrate deploy && next start -H 0.0.0.0 -p ${PORT:-3000}
```

So database migrations are applied before the web server starts. This is acceptable for the current single-web-service MVP. If the app later scales to multiple web replicas, move migration to a one-off deploy job.

## First deploy steps

1. Create a new Dokploy app/project using this repository.
2. Use Docker Compose deployment with `docker-compose.deploy.yml`.
3. Set the environment variables above.
4. Deploy.
5. Confirm the `web` container logs show Prisma migrations applied and Next.js listening on port `3000`.
6. Run the seed command once after the first successful deploy:

```bash
cd /workspace/app
pnpm db:seed
```

If Dokploy exposes an exec/terminal UI, run it inside the `web` container. The seed is idempotent for default services and shop settings.

## Smoke test after deploy

Replace `<domain>` with the Haabiz public web domain.

```bash
curl -I https://<domain>/api/health
curl -I https://<domain>/
curl -I https://<domain>/book
curl -I https://<domain>/walk-in
curl -I https://<domain>/owner/login
```

Then test in browser:

1. Open `/owner/login` and log in with `BARBER_ADMIN_PASSCODE`.
2. Open `/walk-in`, create a customer queue item.
3. Open `/owner`, verify the queue item appears.
4. Start service from owner dashboard.
5. Complete/cancel/no-show one item and verify it moves to the closed list.

## LINE setup after domain exists

Only do this after the public HTTPS domain works.

In LINE Developers:

- Webhook URL: `https://<domain>/api/line/webhook`
- LIFF endpoint URL: `https://<domain>/line`
- Rich menu URLs:
  - `https://<domain>/line?target=walk-in`
  - `https://<domain>/line?target=book`

After changing `NEXT_PUBLIC_LINE_LIFF_ID`, redeploy/restart the web service because it is a public build-time/client env value.

Expected webhook behavior:

- valid signed webhook returns `200`
- invalid signature returns `401`
- bad JSON returns `400`

## Local deploy validation

Before pushing deploy changes:

```bash
cd app
pnpm typecheck
pnpm lint
pnpm test:integration
pnpm e2e
pnpm prisma:validate
pnpm build
```

Optional Docker build smoke from repository root:

```bash
docker compose -f docker-compose.deploy.yml up -d --build
curl -I http://localhost:3000/api/health # only if you temporarily add a local port mapping
```

The committed compose file intentionally does not publish host ports. For local Docker smoke, either use `docker compose exec web wget -S -O- http://127.0.0.1:3000/api/health` or temporarily add a local-only override file.
