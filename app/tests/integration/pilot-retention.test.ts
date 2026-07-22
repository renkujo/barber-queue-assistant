import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  EvidenceHoldReason,
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
import { getPublicQueueItemByToken } from "@/lib/queue/repository";
import { prisma } from "@/lib/prisma";
import { cleanupPilotFixtures, executeSubjectDeletion, withPilotFunctionOwner } from "./pilot-test-helpers";

const prefix = "VI-PILOT-RETENTION";
const expiredCohort = "vitest-pilot-expired-r1";
const futureCohort = "vitest-pilot-future-r1";
const releaseSegment = "vitest-retention-r1";

beforeEach(async () => {
  await cleanupPilotFixtures(prefix, [expiredCohort, futureCohort]);
  await prisma.pilotCohort.createMany({
    data: [
      { id: expiredCohort, evidenceExpiresAt: new Date("2020-01-01T00:00:00.000Z") },
      { id: futureCohort, evidenceExpiresAt: new Date("2099-12-31T16:59:59.999Z") },
    ],
  });
});

afterEach(async () => {
  await cleanupPilotFixtures(prefix, [expiredCohort, futureCohort]);
});

const createQueue = (name: string, cohortId: string, customerId?: string) => prisma.queueItem.create({
  data: {
    type: QueueItemType.WALK_IN,
    status: QueueItemStatus.WAITING,
    customerId,
    customerNameSnapshot: `${prefix} ${name}`,
    serviceNameSnapshot: "Retention service",
    serviceDurationMinutes: 30,
    date: new Date(),
    createdBy: QueueCreatedBy.CUSTOMER,
    pilotClassification: PilotQueueClassification.REAL,
    pilotCohortId: cohortId,
    pilotReleaseSegment: releaseSegment,
  },
});

describe("pilot subject deletion and cohort retention", () => {
  it("revokes the old bearer token and defers only the held customer-linked queue", async () => {
    const customer = await prisma.customer.create({ data: { name: `${prefix} Customer`, phone: "0801234567" } });
    const held = await createQueue("Held", futureCohort, customer.id);
    const unheld = await createQueue("Unheld", futureCohort, customer.id);
    await prisma.evidenceHold.create({ data: { queueItemId: held.id, reason: EvidenceHoldReason.CUSTOMER_DISPUTE, approvedBy: "vitest-pilot", expiresAt: new Date(Date.now() + 86_400_000) } });

    const oldHeldToken = held.publicToken;
    const oldUnheldToken = unheld.publicToken;
    const resultRows = await executeSubjectDeletion(unheld.id) as Array<{ result: { processedQueues: number; deferredHeldQueues: number } }>;

    expect(resultRows[0]?.result).toMatchObject({ processedQueues: 1, deferredHeldQueues: 1 });
    expect(await getPublicQueueItemByToken(oldUnheldToken)).toBeNull();
    expect(await getPublicQueueItemByToken(oldHeldToken)).not.toBeNull();
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: unheld.id } })).customerNameSnapshot).toBe("ลบข้อมูลแล้ว");
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: held.id } })).customerNameSnapshot).toContain(prefix);

    await prisma.evidenceHold.deleteMany({ where: { queueItemId: held.id } });
    await executeSubjectDeletion(held.id);
    expect(await getPublicQueueItemByToken(oldHeldToken)).toBeNull();
  });

  it("prunes only unheld expired evidence in a shared operation and keeps a later cohort", async () => {
    const held = await createQueue("Expired held", expiredCohort);
    const unheld = await createQueue("Expired unheld", expiredCohort);
    const future = await createQueue("Future", futureCohort);
    const operationId = randomUUID();
    await prisma.queueMutationOperation.create({ data: { id: operationId, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, primaryQueueItemId: held.id, outcome: QueueMutationOutcome.APPLIED, pilotCohortId: expiredCohort, pilotReleaseSegment: releaseSegment, completedAt: new Date() } });
    await prisma.queueEvent.createMany({ data: [
      { operationId, role: QueueEventRole.PRIMARY, eventOrdinal: 0, queueItemId: held.id, type: QueueEventType.STATUS_CHANGED, actor: QueueEventActor.OWNER, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, reason: QueueEventReason.OWNER_REQUEST, sequence: 1, effectiveAt: new Date(), pilotCohortId: expiredCohort, pilotReleaseSegment: releaseSegment, fromStatus: QueueItemStatus.WAITING, toStatus: QueueItemStatus.ARRIVED },
      { operationId, role: QueueEventRole.AUTO_DEMOTION, eventOrdinal: 1, queueItemId: unheld.id, type: QueueEventType.STATUS_CHANGED, actor: QueueEventActor.SYSTEM, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, reason: QueueEventReason.REPLACED_IN_PROGRESS, sequence: 1, effectiveAt: new Date(), pilotCohortId: expiredCohort, pilotReleaseSegment: releaseSegment, fromStatus: QueueItemStatus.IN_PROGRESS, toStatus: QueueItemStatus.WAITING },
    ] });
    await prisma.evidenceHold.create({ data: { queueItemId: held.id, reason: EvidenceHoldReason.INCIDENT, approvedBy: "vitest-pilot", expiresAt: new Date(Date.now() + 86_400_000) } });

    await withPilotFunctionOwner((transaction) => transaction.$queryRaw`SELECT public.bqa_pilot_retention_execute_v1(180)`);

    expect(await prisma.queueEvent.count({ where: { queueItemId: held.id } })).toBe(1);
    expect(await prisma.queueEvent.count({ where: { queueItemId: unheld.id } })).toBe(0);
    expect(await prisma.queueMutationOperation.count({ where: { id: operationId } })).toBe(1);
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: unheld.id } })).pilotCohortId).toBeNull();
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: held.id } })).pilotCohortId).toBe(expiredCohort);
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: future.id } })).pilotCohortId).toBe(futureCohort);

    await prisma.evidenceHold.deleteMany({ where: { queueItemId: held.id } });
    await withPilotFunctionOwner((transaction) => transaction.$queryRaw`SELECT public.bqa_pilot_retention_execute_v1(180)`);
    expect(await prisma.queueEvent.count({ where: { queueItemId: held.id } })).toBe(0);
    expect(await prisma.queueMutationOperation.count({ where: { id: operationId } })).toBe(0);
  });
});
