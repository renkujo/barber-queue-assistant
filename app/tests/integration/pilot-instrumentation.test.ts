import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NotificationAudience,
  NotificationSkipReason,
  NotificationStatus,
  NotificationType,
  PilotQueueClassification,
  QueueEntrySource,
  QueueEventRole,
  QueueEventType,
  QueueItemStatus,
  QueueMutationOutcome,
} from "@/generated/prisma/enums";
import { notifyQueueEvent } from "@/lib/notifications/queue-notifications";
import { getPilotMeasurementConfig } from "@/lib/pilot/config";
import { parseQueueEntrySource } from "@/lib/pilot/entry-source";
import { prisma } from "@/lib/prisma";
import { getDayBounds, toDateValue } from "@/lib/queue/date";
import {
  createBooking,
  createOwnerWalkIn,
  createWalkIn,
  reorderQueueItem,
  restoreClosedQueueItem,
  updateQueueItem,
  updateQueueItemStatus,
} from "@/lib/queue/repository";

const prefix = "VI-PILOT";
const serviceId = "vitest-pilot-service";
const secondServiceId = "vitest-pilot-service-two";
const cohortId = "vitest-pilot-r1";
const expiryValue = "2099-12-31";
const futureDateValue = "2099-10-10";
const futureDate = new Date(`${futureDateValue}T00:00:00+07:00`);
const expiry = new Date(`${expiryValue}T23:59:59.999+07:00`);
let shopSettingsBeforeTest: {
  id: string;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  businessHours: { open: string; close: string };
} | null = null;
const originalEnv = {
  enabled: process.env.PILOT_MEASUREMENT_ENABLED,
  cohort: process.env.PILOT_COHORT_ID,
  release: process.env.PILOT_RELEASE_SEGMENT,
  expiry: process.env.PILOT_EVIDENCE_DELETE_AFTER,
};

const cleanup = async () => {
  const queues = await prisma.queueItem.findMany({ where: { customerNameSnapshot: { startsWith: prefix } }, select: { id: true, customerId: true } });
  const ids = queues.map((item) => item.id);

  for (const queue of queues) {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe("SET LOCAL ROLE bqa_pilot_function_owner");
      await transaction.$queryRaw`SELECT public.bqa_pilot_subject_delete_v1(${queue.id.slice(-6).toUpperCase()}, 'vitest-pilot', true)`;
    });
  }

  if (ids.length) await prisma.notificationLog.deleteMany({ where: { queueItemId: { in: ids } } });
  if (ids.length) await prisma.queueItem.deleteMany({ where: { id: { in: ids } } });
  await prisma.queueMutationOperation.deleteMany({ where: { pilotCohortId: cohortId } });
  const customerIds = queues.map((item) => item.customerId).filter((id): id is string => Boolean(id));
  if (customerIds.length) await prisma.customer.deleteMany({ where: { id: { in: customerIds }, queueItems: { none: {} } } });
  await prisma.pilotCohort.deleteMany({ where: { id: cohortId } });
  await prisma.shopDateAvailability.deleteMany({ where: { date: futureDate } });
};

beforeEach(async () => {
  const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });
  shopSettingsBeforeTest = settings
    ? {
        id: settings.id,
        queueIntakeEnabled: settings.queueIntakeEnabled,
        bookingEnabled: settings.bookingEnabled,
        walkInEnabled: settings.walkInEnabled,
        businessHours: settings.businessHours && typeof settings.businessHours === "object" && !Array.isArray(settings.businessHours)
          ? { open: String(settings.businessHours.open ?? "09:00"), close: String(settings.businessHours.close ?? "19:00") }
          : { open: "09:00", close: "19:00" },
      }
    : null;
  await cleanup();
  await prisma.service.upsert({ where: { id: serviceId }, update: { isActive: true }, create: { id: serviceId, name: "Pilot Test", durationMinutes: 30, isActive: true } });
  await prisma.service.upsert({ where: { id: secondServiceId }, update: { isActive: true }, create: { id: secondServiceId, name: "Pilot Test Two", durationMinutes: 45, isActive: true } });
  await prisma.pilotCohort.create({ data: { id: cohortId, evidenceExpiresAt: expiry } });
  process.env.PILOT_MEASUREMENT_ENABLED = "false";
  process.env.PILOT_COHORT_ID = cohortId;
  process.env.PILOT_RELEASE_SEGMENT = "vitest-r1";
  process.env.PILOT_EVIDENCE_DELETE_AFTER = expiryValue;
});

afterEach(async () => {
  process.env.PILOT_MEASUREMENT_ENABLED = "false";
  await cleanup();
  if (shopSettingsBeforeTest) {
    await prisma.shopSettings.update({
      where: { id: shopSettingsBeforeTest.id },
      data: {
        queueIntakeEnabled: shopSettingsBeforeTest.queueIntakeEnabled,
        bookingEnabled: shopSettingsBeforeTest.bookingEnabled,
        walkInEnabled: shopSettingsBeforeTest.walkInEnabled,
        businessHours: shopSettingsBeforeTest.businessHours,
      },
    });
  }
  shopSettingsBeforeTest = null;
  if (originalEnv.enabled === undefined) delete process.env.PILOT_MEASUREMENT_ENABLED; else process.env.PILOT_MEASUREMENT_ENABLED = originalEnv.enabled;
  if (originalEnv.cohort === undefined) delete process.env.PILOT_COHORT_ID; else process.env.PILOT_COHORT_ID = originalEnv.cohort;
  if (originalEnv.release === undefined) delete process.env.PILOT_RELEASE_SEGMENT; else process.env.PILOT_RELEASE_SEGMENT = originalEnv.release;
  if (originalEnv.expiry === undefined) delete process.env.PILOT_EVIDENCE_DELETE_AFTER; else process.env.PILOT_EVIDENCE_DELETE_AFTER = originalEnv.expiry;
});

describe("pilot instrumentation", () => {
  it("accepts only fixed source tokens or enum values", () => {
    expect(parseQueueEntrySource("shop-qr")).toBe(QueueEntrySource.SHOP_QR);
    expect(parseQueueEntrySource("SHOP_QR")).toBe(QueueEntrySource.SHOP_QR);
    expect(parseQueueEntrySource("campaign-customer-name")).toBe(QueueEntrySource.UNKNOWN);
  });

  it("keeps every pilot field empty while measurement is disabled", async () => {
    const queue = await createOwnerWalkIn({ customerName: `${prefix} Disabled`, serviceId, operationId: randomUUID(), entrySource: QueueEntrySource.SHOP_QR });
    const stored = await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } });
    expect(stored.entrySource).toBe(QueueEntrySource.UNKNOWN);
    expect(stored.pilotClassification).toBe(PilotQueueClassification.PRE_PILOT);
    expect(stored.pilotCohortId).toBeNull();
    expect(stored.quotedEstimatedAt).toBeNull();
    expect(await prisma.queueEvent.count({ where: { queueItemId: queue.id } })).toBe(0);
  });

  it("creates one idempotent operation, queue, quote, and event when enabled", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const operationId = randomUUID();
    const input = { customerName: `${prefix} Enabled`, serviceId, operationId, entrySource: QueueEntrySource.SHOP_QR };
    const [first, second] = await Promise.all([createOwnerWalkIn(input), createOwnerWalkIn(input)]);
    expect(second.id).toBe(first.id);
    expect(await prisma.queueItem.count({ where: { customerNameSnapshot: `${prefix} Enabled` } })).toBe(1);
    const stored = await prisma.queueItem.findUniqueOrThrow({ where: { id: first.id } });
    expect(stored.entrySource).toBe(QueueEntrySource.SHOP_QR);
    expect(stored.pilotClassification).toBe(PilotQueueClassification.REAL);
    expect(stored.quotedEstimatedAt).toBeInstanceOf(Date);
    expect(stored.quotedWaitMinutes).toBeGreaterThanOrEqual(0);
    expect(await prisma.queueMutationOperation.count({ where: { id: operationId } })).toBe(1);
    expect(await prisma.queueEvent.count({ where: { operationId, type: QueueEventType.QUEUE_CREATED } })).toBe(1);
  });

  it("creates public walk-ins idempotently with one queue and creation event", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });
    if (!settings) throw new Error("Expected shop settings fixture.");
    const today = getDayBounds(toDateValue(new Date())).start;
    const dateRule = await prisma.shopDateAvailability.findUnique({ where: { date: today } });
    const originalHours = settings.businessHours && typeof settings.businessHours === "object" && !Array.isArray(settings.businessHours)
      ? { open: String(settings.businessHours.open ?? "09:00"), close: String(settings.businessHours.close ?? "19:00") }
      : { open: "09:00", close: "19:00" };
    await prisma.shopSettings.update({
      where: { id: settings.id },
      data: { queueIntakeEnabled: true, walkInEnabled: true, businessHours: { open: "00:00", close: "23:59" } },
    });
    await prisma.shopDateAvailability.upsert({
      where: { date: today },
      update: { walkInEnabled: true, inStoreOnly: false },
      create: { date: today, bookingEnabled: true, walkInEnabled: true, inStoreOnly: false },
    });

    try {
      const operationId = randomUUID();
      const input = { customerName: `${prefix} Public Walk In`, serviceId, operationId, entrySource: QueueEntrySource.SHOP_QR };
      const [first, second] = await Promise.all([createWalkIn(input), createWalkIn(input)]);
      expect(second.id).toBe(first.id);
      expect(await prisma.queueItem.count({ where: { customerNameSnapshot: input.customerName } })).toBe(1);
      expect(await prisma.queueEvent.count({ where: { operationId, type: QueueEventType.QUEUE_CREATED } })).toBe(1);
    } finally {
      await prisma.shopSettings.update({
        where: { id: settings.id },
        data: {
          queueIntakeEnabled: settings.queueIntakeEnabled,
          walkInEnabled: settings.walkInEnabled,
          businessHours: originalHours,
        },
      });
      if (dateRule) {
        await prisma.shopDateAvailability.update({
          where: { date: today },
          data: {
            bookingEnabled: dateRule.bookingEnabled,
            walkInEnabled: dateRule.walkInEnabled,
            inStoreOnly: dateRule.inStoreOnly,
            reason: dateRule.reason,
          },
        });
      } else {
        await prisma.shopDateAvailability.deleteMany({ where: { date: today } });
      }
    }
  });

  it("uses one insert winner for concurrent LINE attempts", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const operationId = randomUUID();
    const queue = await createOwnerWalkIn({ customerName: `${prefix} LINE`, serviceId, lineUserId: "U-vitest-pilot-line", operationId });
    let calls = 0;
    const lineClient = { pushTextMessage: async () => { calls += 1; } };
    await Promise.all([
      notifyQueueEvent(queue.id, NotificationType.QUEUE_NEAR, { operationId, lineClient }),
      notifyQueueEvent(queue.id, NotificationType.QUEUE_NEAR, { operationId, lineClient }),
    ]);
    expect(calls).toBe(1);
    expect(await prisma.notificationLog.count({ where: { operationId, audience: NotificationAudience.CUSTOMER } })).toBe(1);
  });

  it("records status truth and enabled notification skip ownership", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const createOperationId = randomUUID();
    const queue = await createOwnerWalkIn({ customerName: `${prefix} Status`, serviceId, operationId: createOperationId });
    const statusOperationId = randomUUID();
    await updateQueueItemStatus(queue.id, QueueItemStatus.IN_PROGRESS, statusOperationId);
    const event = await prisma.queueEvent.findFirstOrThrow({ where: { operationId: statusOperationId } });
    expect(event.fromStatus).toBe(QueueItemStatus.WAITING);
    expect(event.toStatus).toBe(QueueItemStatus.IN_PROGRESS);
    expect(event.toStartedAt).toBeInstanceOf(Date);

    const log = await notifyQueueEvent(queue.id, NotificationType.QUEUE_NEAR, { operationId: statusOperationId, lineClient: null });
    expect(log.audience).toBe(NotificationAudience.CUSTOMER);
    expect(log.skipReason).toBe(NotificationSkipReason.NO_CUSTOMER_RECIPIENT);
    expect(log.attemptNumber).toBe(1);
  });

  it("covers enabled configuration states and rejects normalized invalid calendar dates", () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "false";
    expect(getPilotMeasurementConfig()).toEqual({ enabled: false, status: "disabled" });

    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    process.env.PILOT_COHORT_ID = "INVALID";
    expect(getPilotMeasurementConfig()).toMatchObject({ status: "misconfigured", reason: "invalid-cohort" });
    process.env.PILOT_COHORT_ID = cohortId;
    process.env.PILOT_RELEASE_SEGMENT = "INVALID";
    expect(getPilotMeasurementConfig()).toMatchObject({ status: "misconfigured", reason: "invalid-release-segment" });
    process.env.PILOT_RELEASE_SEGMENT = "vitest-r1";
    process.env.PILOT_EVIDENCE_DELETE_AFTER = "2000-01-01";
    expect(getPilotMeasurementConfig()).toMatchObject({ status: "misconfigured", reason: "invalid-evidence-expiry" });
    process.env.PILOT_EVIDENCE_DELETE_AFTER = "2099-02-31";
    expect(() => getDayBounds("2099-02-31")).toThrow("Invalid calendar date.");
    expect(getPilotMeasurementConfig()).toEqual({ enabled: true, status: "misconfigured", reason: "invalid-evidence-expiry" });
    process.env.PILOT_EVIDENCE_DELETE_AFTER = expiryValue;
    expect(getPilotMeasurementConfig()).toMatchObject({ enabled: true, status: "configured" });
  });

  it("records a true same-status no-op without an event but keeps timestamp refreshes applied", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const queue = await createOwnerWalkIn({ customerName: `${prefix} No Op`, serviceId, operationId: randomUUID() });
    const before = await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } });
    const noOpId = randomUUID();
    const noOp = await updateQueueItemStatus(queue.id, QueueItemStatus.WAITING, noOpId);
    const noOpOperation = await prisma.queueMutationOperation.findUniqueOrThrow({ where: { id: noOpId } });
    expect(noOp.pilotApplied).toBe(false);
    expect(noOpOperation.outcome).toBe(QueueMutationOutcome.NO_OP);
    expect(await prisma.queueEvent.count({ where: { operationId: noOpId } })).toBe(0);
    expect((await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } })).updatedAt).toEqual(before.updatedAt);

    const firstStartId = randomUUID();
    const first = await updateQueueItemStatus(queue.id, QueueItemStatus.IN_PROGRESS, firstStartId);
    const refreshId = randomUUID();
    const refreshed = await updateQueueItemStatus(queue.id, QueueItemStatus.IN_PROGRESS, refreshId);
    expect(refreshed.pilotApplied).toBe(true);
    expect(refreshed.startedAt?.getTime()).toBeGreaterThanOrEqual(first.startedAt?.getTime() ?? 0);
    expect((await prisma.queueMutationOperation.findUniqueOrThrow({ where: { id: refreshId } })).outcome).toBe(QueueMutationOutcome.APPLIED);
    expect(await prisma.queueEvent.count({ where: { operationId: refreshId } })).toBe(1);
  });

  it("uses UPDATE returning truth for deterministic auto-demotion ordinals", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const queues = await Promise.all([0, 1, 2].map((index) => createOwnerWalkIn({ customerName: `${prefix} Demotion ${index}`, serviceId, operationId: randomUUID() })));
    await prisma.queueItem.updateMany({ where: { id: { in: queues.map((queue) => queue.id) } }, data: { date: futureDate } });
    await prisma.queueItem.updateMany({ where: { id: { in: [queues[0].id, queues[1].id] } }, data: { status: QueueItemStatus.IN_PROGRESS } });
    const operationId = randomUUID();
    await updateQueueItemStatus(queues[2].id, QueueItemStatus.IN_PROGRESS, operationId);
    const events = await prisma.queueEvent.findMany({ where: { operationId }, orderBy: { eventOrdinal: "asc" } });
    expect(events.map((event) => event.eventOrdinal)).toEqual([0, 1, 2]);
    expect(events.map((event) => event.role)).toEqual([QueueEventRole.PRIMARY, QueueEventRole.AUTO_DEMOTION, QueueEventRole.AUTO_DEMOTION]);
    expect(events.slice(1).map((event) => event.queueItemId)).toEqual([queues[0].id, queues[1].id].sort());
    expect(events.slice(1).map((event) => [event.fromStatus, event.toStatus])).toEqual([
      [QueueItemStatus.IN_PROGRESS, QueueItemStatus.WAITING],
      [QueueItemStatus.IN_PROGRESS, QueueItemStatus.WAITING],
    ]);
    expect(await prisma.queueItem.count({ where: { date: futureDate, status: QueueItemStatus.IN_PROGRESS } })).toBe(1);
  });

  it("keeps quotes immutable and emits deterministic edit events while exact edits are no-ops", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    await prisma.shopSettings.updateMany({ data: { businessHours: { open: "09:00", close: "19:00" } } });
    const queue = await createOwnerWalkIn({ customerName: `${prefix} Edit`, phone: "0800000001", serviceId, note: "before", operationId: randomUUID() });
    const original = await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } });
    const noOpId = randomUUID();
    const noOp = await updateQueueItem({
      id: queue.id,
      customerName: original.customerNameSnapshot,
      phone: original.phoneSnapshot ?? undefined,
      serviceId,
      dateValue: toDateValue(original.date),
      note: original.note ?? undefined,
      ownerNote: original.ownerNote ?? undefined,
      operationId: noOpId,
    });
    expect(noOp.pilotApplied).toBe(false);
    expect(await prisma.queueEvent.count({ where: { operationId: noOpId } })).toBe(0);

    const editId = randomUUID();
    await updateQueueItem({ id: queue.id, customerName: `${prefix} Edited`, phone: "0800000002", serviceId: secondServiceId, dateValue: futureDateValue, timeValue: "10:00", note: "after", ownerNote: "owner", operationId: editId });
    const events = await prisma.queueEvent.findMany({ where: { operationId: editId }, orderBy: { eventOrdinal: "asc" } });
    expect(events.map((event) => event.eventOrdinal)).toEqual([0, 1, 2]);
    expect(events.map((event) => event.type)).toEqual([QueueEventType.SCHEDULE_CHANGED, QueueEventType.SERVICE_CHANGED, QueueEventType.OWNER_OVERRIDE]);
    const edited = await prisma.queueItem.findUniqueOrThrow({ where: { id: queue.id } });
    expect(edited.quotedEstimatedAt).toEqual(original.quotedEstimatedAt);
    expect(edited.quotedWaitMinutes).toBe(original.quotedWaitMinutes);
  });

  it("records reorder no-ops and restores only locked current-day closed truth", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const queue = await createOwnerWalkIn({ customerName: `${prefix} Reorder`, serviceId, operationId: randomUUID() });
    await prisma.queueItem.update({ where: { id: queue.id }, data: { date: futureDate } });
    const reorderId = randomUUID();
    const reordered = await reorderQueueItem(queue.id, "bottom", reorderId);
    expect(reordered.pilotApplied).toBe(false);
    expect((await prisma.queueMutationOperation.findUniqueOrThrow({ where: { id: reorderId } })).outcome).toBe(QueueMutationOutcome.NO_OP);
    expect(await prisma.queueEvent.count({ where: { operationId: reorderId } })).toBe(0);

    const restoreQueue = await createOwnerWalkIn({ customerName: `${prefix} Restore`, serviceId, operationId: randomUUID() });
    await prisma.queueItem.update({ where: { id: restoreQueue.id }, data: { status: QueueItemStatus.CANCELLED, cancelledAt: new Date() } });
    const restoreId = randomUUID();
    const restored = await restoreClosedQueueItem(restoreQueue.id, restoreId);
    expect(restored.status).toBe(QueueItemStatus.WAITING);
    expect(restored.cancelledAt).toBeNull();
    expect(await prisma.queueEvent.count({ where: { operationId: restoreId, type: QueueEventType.QUEUE_RESTORED } })).toBe(1);
  });

  it("rejects operation ids reused across mutation sources or target queues", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const creationId = randomUUID();
    const first = await createOwnerWalkIn({ customerName: `${prefix} Reuse A`, serviceId, operationId: creationId });
    const second = await createOwnerWalkIn({ customerName: `${prefix} Reuse B`, serviceId, operationId: randomUUID() });
    await expect(updateQueueItemStatus(first.id, QueueItemStatus.LATE, creationId)).rejects.toThrow(/reused/);

    const statusId = randomUUID();
    await updateQueueItemStatus(first.id, QueueItemStatus.LATE, statusId);
    await expect(updateQueueItemStatus(second.id, QueueItemStatus.LATE, statusId)).rejects.toThrow(/different queue/);
  });

  it("serializes same-slot booking creation and rolls back the losing operation", async () => {
    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    await prisma.shopSettings.updateMany({ data: { queueIntakeEnabled: true, bookingEnabled: true, businessHours: { open: "09:00", close: "19:00" } } });
    await prisma.shopDateAvailability.create({ data: { date: futureDate, bookingEnabled: true, walkInEnabled: true } });
    const duplicateOperationId = randomUUID();
    const duplicateInput = { customerName: `${prefix} Booking Duplicate`, serviceId, dateValue: futureDateValue, timeValue: "09:00", operationId: duplicateOperationId };
    const [duplicateFirst, duplicateSecond] = await Promise.all([createBooking(duplicateInput), createBooking(duplicateInput)]);
    expect(duplicateSecond.id).toBe(duplicateFirst.id);
    expect(await prisma.queueEvent.count({ where: { operationId: duplicateOperationId, type: QueueEventType.QUEUE_CREATED } })).toBe(1);

    const operationIds = [randomUUID(), randomUUID()];
    const attempts = await Promise.allSettled(operationIds.map((operationId, index) => createBooking({
      customerName: `${prefix} Booking ${index}`,
      serviceId,
      dateValue: futureDateValue,
      timeValue: "10:00",
      operationId,
    })));
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(await prisma.queueItem.count({ where: { customerNameSnapshot: { startsWith: `${prefix} Booking` } } })).toBe(2);
    expect(await prisma.queueMutationOperation.count({ where: { id: { in: operationIds } } })).toBe(1);
  });

  it("preserves disabled notification fields and never retries an aged enabled pending attempt", async () => {
    const disabled = await createOwnerWalkIn({ customerName: `${prefix} Notify Disabled`, serviceId, operationId: randomUUID() });
    const disabledLog = await notifyQueueEvent(disabled.id, NotificationType.QUEUE_NEAR, { operationId: randomUUID(), lineClient: null });
    expect(disabledLog.audience).toBeNull();
    expect(disabledLog.businessEventKey).toBeNull();
    expect(disabledLog.attemptNumber).toBeNull();

    process.env.PILOT_MEASUREMENT_ENABLED = "true";
    const operationId = randomUUID();
    const queue = await createOwnerWalkIn({ customerName: `${prefix} Aged Pending`, lineUserId: "U-vitest-aged-pending", serviceId, operationId });
    const missingToken = await notifyQueueEvent(queue.id, NotificationType.REMINDER, { operationId, lineClient: null });
    expect(missingToken.status).toBe(NotificationStatus.SKIPPED);
    expect(missingToken.skipReason).toBe(NotificationSkipReason.LINE_TOKEN_MISSING);
    const failed = await notifyQueueEvent(queue.id, NotificationType.CANCELLED, {
      operationId,
      lineClient: { pushTextMessage: async () => { throw new Error("provider failed"); } },
    });
    expect(failed.status).toBe(NotificationStatus.FAILED);
    expect(failed.error).toBe("provider failed");

    const businessEventKey = `${operationId}:${NotificationType.QUEUE_NEAR}`;
    const pending = await prisma.notificationLog.create({
      data: {
        queueItemId: queue.id,
        customerId: queue.customerId,
        channel: "LINE",
        type: NotificationType.QUEUE_NEAR,
        status: NotificationStatus.PENDING,
        recipient: queue.lineUserIdSnapshot,
        messagePreview: "pending",
        audience: NotificationAudience.CUSTOMER,
        businessEventKey,
        attemptNumber: 1,
        pilotCohortId: cohortId,
        operationId,
        createdAt: new Date(Date.now() - 11 * 60_000),
      },
    });
    let calls = 0;
    const result = await notifyQueueEvent(queue.id, NotificationType.QUEUE_NEAR, { operationId, lineClient: { pushTextMessage: async () => { calls += 1; } } });
    expect(result.id).toBe(pending.id);
    expect(result.status).toBe(NotificationStatus.PENDING);
    expect(calls).toBe(0);
  });
});
