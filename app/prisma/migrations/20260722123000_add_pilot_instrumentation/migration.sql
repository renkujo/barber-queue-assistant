CREATE TYPE "QueueEntrySource" AS ENUM ('LINE', 'SHOP_QR', 'OWNER_SHARED_LINK', 'IN_SHOP', 'UNKNOWN');
CREATE TYPE "PilotQueueClassification" AS ENUM ('PRE_PILOT', 'REAL', 'TEST_SMOKE', 'TRAINING', 'EXCLUDED_OTHER');
CREATE TYPE "QueueEventType" AS ENUM ('QUEUE_CREATED', 'STATUS_CHANGED', 'QUEUE_RESTORED', 'QUEUE_REORDERED', 'SCHEDULE_CHANGED', 'SERVICE_CHANGED', 'OWNER_OVERRIDE', 'EVIDENCE_CORRECTION');
CREATE TYPE "QueueEventActor" AS ENUM ('CUSTOMER', 'OWNER', 'SYSTEM', 'OPERATOR');
CREATE TYPE "QueueEventMutationSource" AS ENUM ('PUBLIC_BOOKING', 'PUBLIC_WALK_IN', 'OWNER_WALK_IN', 'OWNER_STATUS_ACTION', 'OWNER_RESTORE_ACTION', 'OWNER_REORDER_ACTION', 'OWNER_EDIT_ACTION', 'OPERATOR_CORRECTION');
CREATE TYPE "QueueEventReason" AS ENUM ('CREATED', 'OWNER_REQUEST', 'REPLACED_IN_PROGRESS', 'RESTORED', 'REORDER_UP', 'REORDER_DOWN', 'REORDER_BOTTOM', 'SCHEDULE_EDIT', 'SERVICE_EDIT', 'DETAILS_EDIT', 'EVIDENCE_CORRECTION');
CREATE TYPE "QueueEventRole" AS ENUM ('PRIMARY', 'AUTO_DEMOTION', 'CORRECTION');
CREATE TYPE "QueueReorderIntent" AS ENUM ('UP', 'DOWN', 'BOTTOM');
CREATE TYPE "QueueMutationOutcome" AS ENUM ('APPLIED', 'NO_OP');
CREATE TYPE "NotificationAudience" AS ENUM ('CUSTOMER', 'OWNER');
CREATE TYPE "NotificationSkipReason" AS ENUM ('NO_CUSTOMER_RECIPIENT', 'NO_OWNER_RECIPIENT', 'LINE_TOKEN_MISSING');
CREATE TYPE "EvidenceHoldReason" AS ENUM ('INCIDENT', 'CUSTOMER_DISPUTE', 'LEGAL');

CREATE TABLE "PilotCohort" (
    "id" TEXT NOT NULL,
    "evidenceExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PilotCohort_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QueueItem"
ADD COLUMN "entrySource" "QueueEntrySource" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "quotedEstimatedAt" TIMESTAMP(3),
ADD COLUMN "quotedWaitMinutes" INTEGER,
ADD COLUMN "pilotClassification" "PilotQueueClassification" NOT NULL DEFAULT 'PRE_PILOT',
ADD COLUMN "pilotCohortId" TEXT,
ADD COLUMN "pilotReleaseSegment" TEXT;

ALTER TABLE "QueueItem"
ADD CONSTRAINT "QueueItem_quote_pair_check"
CHECK (("quotedEstimatedAt" IS NULL) = ("quotedWaitMinutes" IS NULL));

ALTER TABLE "QueueItem"
ADD CONSTRAINT "QueueItem_quoted_wait_nonnegative_check"
CHECK ("quotedWaitMinutes" IS NULL OR "quotedWaitMinutes" >= 0);

ALTER TABLE "QueueItem"
ADD CONSTRAINT "QueueItem_pilotCohortId_fkey"
FOREIGN KEY ("pilotCohortId") REFERENCES "PilotCohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "QueueMutationOperation" (
    "id" TEXT NOT NULL,
    "mutationSource" "QueueEventMutationSource" NOT NULL,
    "primaryQueueItemId" TEXT,
    "outcome" "QueueMutationOutcome",
    "pilotCohortId" TEXT NOT NULL,
    "pilotReleaseSegment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "QueueMutationOperation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QueueMutationOperation_pilotCohortId_createdAt_idx" ON "QueueMutationOperation"("pilotCohortId", "createdAt");
CREATE INDEX "QueueMutationOperation_primaryQueueItemId_createdAt_idx" ON "QueueMutationOperation"("primaryQueueItemId", "createdAt");

ALTER TABLE "QueueMutationOperation"
ADD CONSTRAINT "QueueMutationOperation_primaryQueueItemId_fkey"
FOREIGN KEY ("primaryQueueItemId") REFERENCES "QueueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QueueMutationOperation"
ADD CONSTRAINT "QueueMutationOperation_pilotCohortId_fkey"
FOREIGN KEY ("pilotCohortId") REFERENCES "PilotCohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "QueueEvent" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "role" "QueueEventRole" NOT NULL,
    "eventOrdinal" INTEGER NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "type" "QueueEventType" NOT NULL,
    "actor" "QueueEventActor" NOT NULL,
    "mutationSource" "QueueEventMutationSource" NOT NULL,
    "reason" "QueueEventReason",
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "sequence" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pilotCohortId" TEXT NOT NULL,
    "pilotReleaseSegment" TEXT NOT NULL,
    "fromStatus" "QueueItemStatus",
    "toStatus" "QueueItemStatus",
    "fromStartAt" TIMESTAMP(3),
    "toStartAt" TIMESTAMP(3),
    "fromEstimatedAt" TIMESTAMP(3),
    "toEstimatedAt" TIMESTAMP(3),
    "fromArrivedAt" TIMESTAMP(3),
    "toArrivedAt" TIMESTAMP(3),
    "fromStartedAt" TIMESTAMP(3),
    "toStartedAt" TIMESTAMP(3),
    "fromCompletedAt" TIMESTAMP(3),
    "toCompletedAt" TIMESTAMP(3),
    "fromCancelledAt" TIMESTAMP(3),
    "toCancelledAt" TIMESTAMP(3),
    "fromNoShowAt" TIMESTAMP(3),
    "toNoShowAt" TIMESTAMP(3),
    "fromServiceId" TEXT,
    "toServiceId" TEXT,
    "reorderIntent" "QueueReorderIntent",
    "correctsEventId" TEXT,
    CONSTRAINT "QueueEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QueueEvent_operationId_eventOrdinal_key" ON "QueueEvent"("operationId", "eventOrdinal");
CREATE UNIQUE INDEX "QueueEvent_queueItemId_sequence_key" ON "QueueEvent"("queueItemId", "sequence");
CREATE INDEX "QueueEvent_pilotCohortId_effectiveAt_idx" ON "QueueEvent"("pilotCohortId", "effectiveAt");
CREATE INDEX "QueueEvent_queueItemId_effectiveAt_idx" ON "QueueEvent"("queueItemId", "effectiveAt");
CREATE INDEX "QueueEvent_recordedAt_idx" ON "QueueEvent"("recordedAt");

ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "QueueMutationOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "QueueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_pilotCohortId_fkey" FOREIGN KEY ("pilotCohortId") REFERENCES "PilotCohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_correctsEventId_fkey" FOREIGN KEY ("correctsEventId") REFERENCES "QueueEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "EvidenceHold" (
    "id" TEXT NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "reason" "EvidenceHoldReason" NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceHold_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvidenceHold_queueItemId_idx" ON "EvidenceHold"("queueItemId");
CREATE INDEX "EvidenceHold_expiresAt_releasedAt_idx" ON "EvidenceHold"("expiresAt", "releasedAt");
ALTER TABLE "EvidenceHold" ADD CONSTRAINT "EvidenceHold_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "QueueItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
ADD COLUMN "audience" "NotificationAudience",
ADD COLUMN "skipReason" "NotificationSkipReason",
ADD COLUMN "businessEventKey" TEXT,
ADD COLUMN "attemptNumber" INTEGER,
ADD COLUMN "pilotCohortId" TEXT,
ADD COLUMN "operationId" TEXT;

CREATE UNIQUE INDEX "NotificationLog_businessEventKey_audience_attemptNumber_key" ON "NotificationLog"("businessEventKey", "audience", "attemptNumber");
CREATE INDEX "NotificationLog_audience_status_createdAt_idx" ON "NotificationLog"("audience", "status", "createdAt");
CREATE INDEX "NotificationLog_pilotCohortId_createdAt_idx" ON "NotificationLog"("pilotCohortId", "createdAt");

ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_pilotCohortId_fkey" FOREIGN KEY ("pilotCohortId") REFERENCES "PilotCohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "QueueMutationOperation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
