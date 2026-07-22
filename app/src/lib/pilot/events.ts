import { Prisma } from "@/generated/prisma/client";
import type { PilotMeasurementConfig } from "./config";
import type { PilotTransactionClient } from "./operations";

type QueueEventFacts = Omit<
  Prisma.QueueEventUncheckedCreateInput,
  | "id"
  | "operationId"
  | "eventOrdinal"
  | "queueItemId"
  | "sequence"
  | "pilotCohortId"
  | "pilotReleaseSegment"
  | "recordedAt"
>;

export const appendPilotQueueEvent = async (
  transaction: PilotTransactionClient,
  input: {
    operationId: string;
    eventOrdinal: number;
    queueItemId: string;
    config: PilotMeasurementConfig;
    facts: QueueEventFacts;
  },
) => {
  const latest = await transaction.queueEvent.aggregate({
    where: { queueItemId: input.queueItemId },
    _max: { sequence: true },
  });

  return transaction.queueEvent.create({
    data: {
      operationId: input.operationId,
      eventOrdinal: input.eventOrdinal,
      queueItemId: input.queueItemId,
      sequence: (latest._max.sequence ?? 0) + 1,
      pilotCohortId: input.config.cohortId,
      pilotReleaseSegment: input.config.releaseSegment,
      ...input.facts,
    },
  });
};
