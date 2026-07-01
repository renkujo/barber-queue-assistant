# Barber Queue Assistant App

Next.js fullstack scaffold for the Barber Queue Assistant MVP.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- LINE Seed Sans TH self-hosted font
- react-icons for UI icons
- Sonner for toast notifications
- Prisma 7 + PostgreSQL
- Simple owner/admin passcode session for MVP
- pnpm

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm dev
```

Open:

- Customer entry: `http://localhost:3000/`
- Owner login: `http://localhost:3000/owner/login`
- Owner passcode in local `.env`: `demo-owner`

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm prisma:validate
pnpm build
pnpm db:migrate
pnpm db:seed
```

The initial migration SQL exists under `prisma/migrations/20260626153000_initial_queue_schema/`. Local PostgreSQL migration and service seed have been tested with the local `barber_queue_assistant` database.

## Current routes

- `/` — customer-facing queue/status entry screen using Pastel Paper Queue direction
- `/book` — customer booking form backed by Prisma repository when DB is available
- `/walk-in` — customer same-day queue form backed by Prisma repository when DB is available
- `/queue/[id]` — queue tracking page
- `/owner/login` — simple owner login
- `/owner` — owner daily queue dashboard, protected by passcode cookie
- `/api/health` — health check
- `/api/queue/status` — mock queue status JSON
- `/api/line/webhook` — LINE OA webhook placeholder

## Assets

Generated raster assets were copied into:

`public/assets/generated-v1/`

Source/reference lives in:

`../docs/assets/generated-v1/`

Current generated PNGs are visual/source assets and do not have true alpha channels yet.

## Font

LINE Seed Sans TH WOFF2 files are self-hosted in `public/fonts/line-seed-sans-th/` and loaded via `@font-face` in `src/app/globals.css`.

## Owner status actions

Owner dashboard now includes server-action status controls for real DB queue items: arrived, in-progress/start, waiting/requeue, done, late, no-show, and cancelled-ready repository support. Fallback/mock rows are visibly read-only until a real booking or walk-in exists.

## Owner add/cancel queue

Owner flow now includes `/owner/walk-in` for owner-created walk-ins and cancel controls on owner queue rows. Cancelled items use `CANCELLED` status and are removed from the active queue list.

## Owner edit queue

Owner dashboard rows link to `/owner/queue/[id]/edit` for editing customer name, phone, service, date/time, customer note, and owner-only internal note. Saving a locked time checks for conflicts with active queue items and break/time blocks before updating.

## Toast notifications

The app uses `sonner` with a global `Toaster` in `src/app/layout.tsx`. Route query messages such as `?error=` and `?status=` are shown through `RouteToast`, then cleared from the URL to avoid duplicate refresh toasts.

## UI base components

The app uses source-owned shadcn-style base components backed by Radix primitives, `tailwind-merge`, and `tailwind-variants`. Added components include `Select`, `Textarea`, `Separator`, `Dialog`, and `FormField`, alongside existing `Button`, `Card`, `Input`, `Label`, and `Badge`. Visual styling stays on the Pastel Paper Queue tokens instead of shadcn default theme colors.
