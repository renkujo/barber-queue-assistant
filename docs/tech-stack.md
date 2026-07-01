# Tech Stack

Selected stack for Barber Queue Assistant MVP.

## App architecture

**Next.js fullstack** under `app/`.

Reason:

- one project can hold customer UI, owner/admin UI, API routes, and LINE webhook;
- good fit for MVP speed;
- simpler deployment shape than separate frontend/backend services;
- server routes can later send notifications and handle queue mutations.

## Selected tools

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- LINE Seed Sans TH self-hosted from official LINE Seed font package
- react-icons for UI icons
- Radix UI primitives for local base components
- clsx + tailwind-merge `cn()`
- tailwind-variants for UI variants
- Prisma 7
- PostgreSQL
- Simple owner/admin passcode login for MVP
- pnpm with exact package versions

## Current app routes

- `/` — customer queue/status entry screen
- `/book` — customer booking form
- `/walk-in` — customer same-day queue form
- `/queue/[id]` — queue tracking page
- `/owner/login` — owner passcode login
- `/owner` — owner daily queue dashboard, protected by cookie session
- `/api/health` — health check
- `/api/queue/status` — current mock queue JSON
- `/api/line/webhook` — LINE OA webhook placeholder

## Current validation

Run from `app/`:

```bash
pnpm typecheck
pnpm lint
pnpm prisma:validate
pnpm build
```

These passed after the initial scaffold and first DB-backed queue slice.

## Notes

- `.env.example` documents `DATABASE_URL`, owner passcode/session secret, and LINE env placeholders.
- `app/.env` has local demo values only.
- Base UI components live in `app/src/components/ui/`: `Button`, `Card`, `Input`, `Label`, `Badge`; shared class merging helper lives in `app/src/lib/cn.ts`.
- Generated assets are copied into `app/public/assets/generated-v1/` for the UI scaffold.
- The generated PNG assets still need a cleanup/regeneration pass for true transparent cutouts before final production use.

## First MVP slice

Implemented after scaffold:

- Prisma-backed queue repository with safe mock fallback for pages/API when DB is unavailable;
- customer booking form at `/book`;
- walk-in queue form at `/walk-in`;
- queue tracking page at `/queue/[id]`;
- `/api/queue/status` now reads through the queue repository;
- owner dashboard reads the queue repository with fallback.

Initial migration SQL exists at `app/prisma/migrations/20260626153000_initial_queue_schema/migration.sql`. Apply it with `pnpm db:migrate` once PostgreSQL is configured.

## Local DB status

Local PostgreSQL was reachable on port 5432. The `barber_queue_assistant` database was created/migrated and default services were seeded with `pnpm db:seed`. Route smoke checks returned HTTP 200 for `/`, `/book`, `/walk-in`, `/api/health`, and `/api/queue/status`.

## Font

The app and static prototype now self-host LINE Seed Sans TH WOFF2 files downloaded from the official LINE Seed site (`https://seed.line.me/index_th.html`). App files live in `app/public/fonts/line-seed-sans-th/`; prototype/docs files live in `docs/assets/fonts/line-seed-sans-th/`.

## Owner status actions

Owner dashboard now includes server-action status controls for real DB queue items: arrived, in-progress/start, waiting/requeue, done, late, no-show, and cancelled-ready repository support. Fallback/mock rows are visibly read-only until a real booking or walk-in exists.

## Owner add/cancel queue

Owner flow now includes `/owner/walk-in` for owner-created walk-ins and cancel controls on owner queue rows. Cancelled items use `CANCELLED` status and are removed from the active queue list.

## UI base components

The app uses source-owned shadcn-style base components backed by Radix primitives, `tailwind-merge`, and `tailwind-variants`. Added components include `Select`, `Textarea`, `Separator`, `Dialog`, and `FormField`, alongside existing `Button`, `Card`, `Input`, `Label`, and `Badge`. Visual styling stays on the Pastel Paper Queue tokens instead of shadcn default theme colors.
