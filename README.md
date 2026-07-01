# Barber Queue Assistant

Working-title product for a one-owner barber shop queue assistant.

The product is not a full salon management suite. It focuses on helping a single barber reduce repeated chat replies, avoid queue collisions, keep the daily queue visible, and notify customers without forcing every customer through one channel.

## Project structure

- `docs/` — product, flow, design-system, LINE OA, data-model, and asset docs
- `prototypes/ui-v1/` — static UI prototype
- `app/` — Next.js fullstack app scaffold

## App stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma 7 + PostgreSQL
- Simple owner/admin passcode login for MVP
- pnpm

Run the app from `app/`:

```bash
cd app
pnpm install
pnpm prisma:generate
pnpm dev
```

Local owner login path:

`/owner/login`

Default local passcode in `app/.env`:

`demo-owner`
