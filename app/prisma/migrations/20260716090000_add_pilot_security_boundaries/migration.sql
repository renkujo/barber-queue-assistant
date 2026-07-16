ALTER TABLE "QueueItem"
ADD COLUMN "publicToken" TEXT;

UPDATE "QueueItem"
SET "publicToken" = gen_random_uuid()::text
WHERE "publicToken" IS NULL;

ALTER TABLE "QueueItem"
ALTER COLUMN "publicToken" SET NOT NULL,
ALTER COLUMN "publicToken" SET DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX "QueueItem_publicToken_key"
ON "QueueItem"("publicToken");

CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_updatedAt_idx"
ON "RateLimitBucket"("updatedAt");
