FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl \
  && corepack enable \
  && corepack prepare pnpm@10.33.0 --activate

WORKDIR /workspace

FROM base AS deps

COPY app/package.json app/pnpm-lock.yaml app/pnpm-workspace.yaml ./app/

WORKDIR /workspace/app
RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /workspace/app/node_modules ./app/node_modules
COPY app ./app

WORKDIR /workspace/app

# Prisma 7 reads DATABASE_URL while generating. The real runtime value is supplied
# by the deployment environment.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barber_queue_assistant?schema=public"

RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /workspace/app

COPY --from=builder /workspace/app ./

EXPOSE 3000

CMD ["pnpm", "deploy:start"]
