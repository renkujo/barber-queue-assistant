import { Prisma } from "@/generated/prisma/client";
import {
  QueueEventMutationSource,
  QueueMutationOutcome,
} from "@/generated/prisma/enums";
import type { PilotMeasurementConfig } from "./config";

export type PilotTransactionClient = Prisma.TransactionClient;

const operationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidOperationId = (operationId: string) => operationIdPattern.test(operationId);

export const requireOperationId = (operationId?: string) => {
  const normalized = operationId?.trim() ?? "";

  if (!isValidOperationId(normalized)) {
    throw new Error("Invalid pilot operation id.");
  }

  return normalized;
};

export const acquirePilotDateLocks = async (transaction: PilotTransactionClient, dateValues: string[]) => {
  const uniqueDates = [...new Set(dateValues)].sort();

  for (const dateValue of uniqueDates) {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bqa:queue-date:${dateValue}`}))`;
  }
};

export const lockPilotQueueItems = async (transaction: PilotTransactionClient, queueItemIds: string[]) => {
  const uniqueIds = [...new Set(queueItemIds)].sort();

  for (const id of uniqueIds) {
    await transaction.$queryRaw`SELECT "id" FROM "QueueItem" WHERE "id" = ${id} FOR UPDATE`;
  }
};

export const reservePilotOperation = async (
  transaction: PilotTransactionClient,
  input: {
    operationId: string;
    mutationSource: QueueEventMutationSource;
    primaryQueueItemId?: string | null;
    config: PilotMeasurementConfig;
  },
) => transaction.queueMutationOperation.create({
  data: {
    id: requireOperationId(input.operationId),
    mutationSource: input.mutationSource,
    primaryQueueItemId: input.primaryQueueItemId ?? null,
    pilotCohortId: input.config.cohortId,
    pilotReleaseSegment: input.config.releaseSegment,
  },
});

export const completePilotOperation = async (
  transaction: PilotTransactionClient,
  operationId: string,
  input: { primaryQueueItemId: string; outcome: QueueMutationOutcome },
) => transaction.queueMutationOperation.update({
  where: { id: operationId },
  data: {
    primaryQueueItemId: input.primaryQueueItemId,
    outcome: input.outcome,
    completedAt: new Date(),
  },
});
