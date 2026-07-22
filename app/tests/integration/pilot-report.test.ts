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
import { getTodayValue } from "@/lib/queue/date";
import { cleanupPilotFixtures, withPilotFunctionOwner } from "./pilot-test-helpers";

const prefix = "VI-PILOT-REPORT";
const cohortId = "vitest-pilot-report-r1";
const releaseSegment = "vitest-report-r1";
const expiry = new Date("2099-12-31T16:59:59.999Z");

const getReport = async () => {
  const today = getTodayValue();
  const rows = await withPilotFunctionOwner((transaction) => transaction.$queryRaw<Array<{ result: Record<string, unknown> }>>`
    SELECT public.bqa_pilot_report_v1(${today}::date, ${today}::date, ${cohortId}) AS result
  `);
  return rows[0]?.result as {
    schemaVersion: number;
    queue: { total: number; terminal: number; done: number; cancelled: number };
    bookingScheduledStart: { samples: number; median_signed: number };
    classification: string;
    shareSafe: boolean;
  };
};

beforeEach(async () => {
  await cleanupPilotFixtures(prefix, [cohortId]);
  await prisma.pilotCohort.create({ data: { id: cohortId, evidenceExpiresAt: expiry } });
});

afterEach(async () => {
  await cleanupPilotFixtures(prefix, [cohortId]);
});

describe("pilot aggregate factual truth", () => {
  it("uses latest typed status correction without mutating the queue row", async () => {
    const queue = await prisma.queueItem.create({
      data: {
        type: QueueItemType.WALK_IN,
        status: QueueItemStatus.DONE,
        customerNameSnapshot: `${prefix} Corrected`,
        serviceNameSnapshot: "Report service",
        serviceDurationMinutes: 30,
        date: new Date(),
        createdBy: QueueCreatedBy.OWNER,
        pilotClassification: PilotQueueClassification.REAL,
        pilotCohortId: cohortId,
        pilotReleaseSegment: releaseSegment,
      },
    });
    const operationId = randomUUID();
    const event = await prisma.$transaction(async (transaction) => {
      await transaction.queueMutationOperation.create({
        data: { id: operationId, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, primaryQueueItemId: queue.id, outcome: QueueMutationOutcome.APPLIED, pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, completedAt: new Date() },
      });
      return transaction.queueEvent.create({
        data: { operationId, role: QueueEventRole.PRIMARY, eventOrdinal: 0, queueItemId: queue.id, type: QueueEventType.STATUS_CHANGED, actor: QueueEventActor.OWNER, mutationSource: QueueEventMutationSource.OWNER_STATUS_ACTION, reason: QueueEventReason.OWNER_REQUEST, sequence: 1, effectiveAt: new Date(), pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, fromStatus: QueueItemStatus.IN_PROGRESS, toStatus: QueueItemStatus.DONE },
      });
    });

    await withPilotFunctionOwner((transaction) => transaction.$queryRaw`
      SELECT public.bqa_pilot_correct_event_v1(
        ${event.id},
        ${QueueItemStatus.CANCELLED}::public."QueueItemStatus",
        NULL,
        'FACTUAL_STATUS_ERROR',
        'vitest-pilot',
        true
      )
    `);

    const report = await getReport();
    expect(report.queue).toMatchObject({ total: 1, terminal: 1, done: 0, cancelled: 1 });
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } })).status).toBe(QueueItemStatus.DONE);
    expect(report).toMatchObject({ schemaVersion: 2, shareSafe: false });
    expect(report.classification).toContain("OWNER/OPERATOR ONLY");
  });

  it("uses the latest factual schedule before service start, not mutable QueueItem.startAt", async () => {
    const createdAt = new Date();
    const originalStart = new Date("2099-10-10T03:00:00.000Z");
    const factualStart = new Date("2099-10-10T04:00:00.000Z");
    const startedAt = new Date("2099-10-10T04:30:00.000Z");
    const queue = await prisma.queueItem.create({
      data: {
        type: QueueItemType.BOOKING,
        status: QueueItemStatus.DONE,
        customerNameSnapshot: `${prefix} Schedule`,
        serviceNameSnapshot: "Report service",
        serviceDurationMinutes: 30,
        date: new Date("2099-10-09T17:00:00.000Z"),
        startAt: originalStart,
        startedAt,
        completedAt: new Date("2099-10-10T05:00:00.000Z"),
        createdBy: QueueCreatedBy.CUSTOMER,
        pilotClassification: PilotQueueClassification.REAL,
        pilotCohortId: cohortId,
        pilotReleaseSegment: releaseSegment,
      },
    });
    const createOperationId = randomUUID();
    const scheduleOperationId = randomUUID();
    await prisma.$transaction(async (transaction) => {
      await transaction.queueMutationOperation.create({ data: { id: createOperationId, mutationSource: QueueEventMutationSource.PUBLIC_BOOKING, primaryQueueItemId: queue.id, outcome: QueueMutationOutcome.APPLIED, pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, completedAt: createdAt } });
      await transaction.queueEvent.create({ data: { operationId: createOperationId, role: QueueEventRole.PRIMARY, eventOrdinal: 0, queueItemId: queue.id, type: QueueEventType.QUEUE_CREATED, actor: QueueEventActor.CUSTOMER, mutationSource: QueueEventMutationSource.PUBLIC_BOOKING, reason: QueueEventReason.CREATED, sequence: 1, effectiveAt: createdAt, pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, toStatus: QueueItemStatus.CONFIRMED, toStartAt: originalStart } });
      await transaction.queueMutationOperation.create({ data: { id: scheduleOperationId, mutationSource: QueueEventMutationSource.OWNER_EDIT_ACTION, primaryQueueItemId: queue.id, outcome: QueueMutationOutcome.APPLIED, pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, completedAt: new Date(createdAt.getTime() + 1_000) } });
      await transaction.queueEvent.create({ data: { operationId: scheduleOperationId, role: QueueEventRole.PRIMARY, eventOrdinal: 0, queueItemId: queue.id, type: QueueEventType.SCHEDULE_CHANGED, actor: QueueEventActor.OWNER, mutationSource: QueueEventMutationSource.OWNER_EDIT_ACTION, reason: QueueEventReason.SCHEDULE_EDIT, sequence: 2, effectiveAt: new Date(createdAt.getTime() + 1_000), pilotCohortId: cohortId, pilotReleaseSegment: releaseSegment, fromStartAt: originalStart, toStartAt: factualStart } });
    });

    const report = await getReport();
    expect(report.bookingScheduledStart.samples).toBe(1);
    expect(Number(report.bookingScheduledStart.median_signed)).toBe(30);
  });
});
