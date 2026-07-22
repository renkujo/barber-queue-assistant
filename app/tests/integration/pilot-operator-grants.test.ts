import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PilotQueueClassification,
  QueueCreatedBy,
  QueueEventActor,
  QueueEventMutationSource,
  QueueEventReason,
  QueueEventRole,
  QueueEventType,
  QueueItemStatus,
  QueueItemType,
  QueueMutationOutcome,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { cleanupPilotFixtures } from "./pilot-test-helpers";

const prefix = "VI-PILOT-GRANTS";
const cohortId = "vitest-pilot-grants-r1";

beforeEach(async () => {
  await cleanupPilotFixtures(prefix, [cohortId]);
  await prisma.pilotCohort.create({ data: { id: cohortId, evidenceExpiresAt: new Date("2099-12-31T16:59:59.999Z") } });
});

afterEach(async () => {
  await cleanupPilotFixtures(prefix, [cohortId]);
});

describe("pilot append-only database boundary", () => {
  it("rejects an application-role delete even when it sets the maintenance GUC", async () => {
    const queue = await prisma.queueItem.create({ data: { type: QueueItemType.WALK_IN, status: QueueItemStatus.WAITING, customerNameSnapshot: `${prefix} Append only`, serviceNameSnapshot: "Grant service", serviceDurationMinutes: 30, date: new Date(), createdBy: QueueCreatedBy.OWNER, pilotClassification: PilotQueueClassification.REAL, pilotCohortId: cohortId, pilotReleaseSegment: "vitest-grants-r1" } });
    const operationId = randomUUID();
    await prisma.queueMutationOperation.create({ data: { id: operationId, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, primaryQueueItemId: queue.id, outcome: QueueMutationOutcome.APPLIED, pilotCohortId: cohortId, pilotReleaseSegment: "vitest-grants-r1", completedAt: new Date() } });
    const event = await prisma.queueEvent.create({ data: { operationId, role: QueueEventRole.PRIMARY, eventOrdinal: 0, queueItemId: queue.id, type: QueueEventType.STATUS_CHANGED, actor: QueueEventActor.OWNER, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, reason: QueueEventReason.OWNER_REQUEST, sequence: 1, effectiveAt: new Date(), pilotCohortId: cohortId, pilotReleaseSegment: "vitest-grants-r1", fromStatus: QueueItemStatus.WAITING, toStatus: QueueItemStatus.ARRIVED } });

    await expect(prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_catalog.set_config('bqa.pilot_maintenance', 'on', true)`;
      await transaction.queueEvent.delete({ where: { id: event.id } });
    })).rejects.toThrow(/append-only/i);
    expect(await prisma.queueEvent.count({ where: { id: event.id } })).toBe(1);
  });
});
