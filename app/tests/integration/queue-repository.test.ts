import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { QueueCreatedBy, QueueItemStatus, QueueItemType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { createDateTime, getDayBounds, getTodayValue, getTomorrowValue } from "@/lib/queue/date";
import { createWalkIn, getQueueStatusSnapshot, reorderQueueItem, restoreClosedQueueItem, setManualWaitMinutes, updateQueueItemStatus } from "@/lib/queue/repository";

const testPrefix = "VI-REPO";
const serviceId = "vitest-service";

const cleanup = async () => {
  await prisma.shopSettings.updateMany({ data: { manualWaitMinutes: null, queueIntakeEnabled: true } });

  const queueItems = await prisma.queueItem.findMany({
    where: {
      customerNameSnapshot: {
        startsWith: testPrefix,
      },
    },
    select: {
      id: true,
      customerId: true,
    },
  });
  const queueItemIds = queueItems.map((item) => item.id);
  const customerIds = queueItems.map((item) => item.customerId).filter((id): id is string => Boolean(id));

  if (queueItemIds.length) {
    await prisma.notificationLog.deleteMany({ where: { queueItemId: { in: queueItemIds } } });
    await prisma.queueItem.deleteMany({ where: { id: { in: queueItemIds } } });
  }

  if (customerIds.length) {
    await prisma.customer.deleteMany({
      where: {
        id: { in: customerIds },
        queueItems: { none: {} },
      },
    });
  }
};

const ensureService = async () => {
  await prisma.service.upsert({
    where: { id: serviceId },
    update: {
      isActive: true,
      name: "Vitest Service",
      durationMinutes: 30,
      priceCents: 25000,
      sortOrder: 999,
    },
    create: {
      id: serviceId,
      isActive: true,
      name: "Vitest Service",
      durationMinutes: 30,
      priceCents: 25000,
      sortOrder: 999,
    },
  });
};

const createCustomer = async (name: string) => prisma.customer.create({ data: { name, phone: "0800000000" } });

const createQueueItem = async ({
  customerId,
  name,
  status = QueueItemStatus.WAITING,
  dateValue = getTodayValue(),
  sortOrder = 1,
}: {
  customerId?: string;
  name: string;
  status?: QueueItemStatus;
  dateValue?: string;
  sortOrder?: number;
}) => {
  const startAt = createDateTime(dateValue, "15:30");

  return prisma.queueItem.create({
    data: {
      type: QueueItemType.WALK_IN,
      status,
      customerId,
      customerNameSnapshot: name,
      phoneSnapshot: "0800000000",
      serviceId,
      serviceNameSnapshot: "Vitest Service",
      serviceDurationMinutes: 30,
      date: getDayBounds(dateValue).start,
      estimatedAt: startAt,
      sortOrder,
      createdBy: QueueCreatedBy.OWNER,
      note: "created by integration test",
    },
  });
};

beforeAll(async () => {
  await cleanup();
  await ensureService();
});

afterEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("queue repository status workflow", () => {
  it("binds lineUserId to customer and queue snapshots when creating walk-ins", async () => {
    const lineUserId = `U${Date.now()}repo`;
    const queueItem = await createWalkIn({
      customerName: `${testPrefix} Line Binding`,
      phone: "0833333333",
      lineUserId,
      serviceId,
      note: "line binding test",
    });
    const storedQueueItem = await prisma.queueItem.findUniqueOrThrow({
      where: { id: queueItem.id },
      include: { customer: true },
    });

    expect(storedQueueItem.lineUserIdSnapshot).toBe(lineUserId);
    expect(storedQueueItem.customer?.lineUserId).toBe(lineUserId);
  });

  it("moves an existing in-progress item back to waiting when another item starts", async () => {
    const first = await createQueueItem({ name: `${testPrefix} current`, status: QueueItemStatus.IN_PROGRESS, sortOrder: 1 });
    const second = await createQueueItem({ name: `${testPrefix} next`, status: QueueItemStatus.WAITING, sortOrder: 2 });

    await updateQueueItemStatus(second.id, QueueItemStatus.IN_PROGRESS);

    const [updatedFirst, updatedSecond] = await Promise.all([
      prisma.queueItem.findUniqueOrThrow({ where: { id: first.id } }),
      prisma.queueItem.findUniqueOrThrow({ where: { id: second.id } }),
    ]);

    expect(updatedFirst.status).toBe(QueueItemStatus.WAITING);
    expect(updatedSecond.status).toBe(QueueItemStatus.IN_PROGRESS);
    expect(updatedSecond.startedAt).toBeInstanceOf(Date);
  });

  it("increments terminal customer counters once and does not double count repeated same status", async () => {
    const customer = await createCustomer(`${testPrefix} counter`);
    const item = await createQueueItem({ customerId: customer.id, name: customer.name, status: QueueItemStatus.WAITING });

    await updateQueueItemStatus(item.id, QueueItemStatus.DONE);
    await updateQueueItemStatus(item.id, QueueItemStatus.DONE);

    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    const updatedItem = await prisma.queueItem.findUniqueOrThrow({ where: { id: item.id } });

    expect(updatedCustomer.completedCount).toBe(1);
    expect(updatedCustomer.cancelledCount).toBe(0);
    expect(updatedCustomer.noShowCount).toBe(0);
    expect(updatedItem.completedAt).toBeInstanceOf(Date);
  });

  it("restores a same-day closed queue item to waiting and reverses the matching counter", async () => {
    const customer = await createCustomer(`${testPrefix} restore`);
    const item = await createQueueItem({ customerId: customer.id, name: customer.name, status: QueueItemStatus.WAITING });

    await updateQueueItemStatus(item.id, QueueItemStatus.NO_SHOW);
    await restoreClosedQueueItem(item.id);

    const restoredItem = await prisma.queueItem.findUniqueOrThrow({ where: { id: item.id } });
    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });

    expect(restoredItem.status).toBe(QueueItemStatus.WAITING);
    expect(restoredItem.startedAt).toBeNull();
    expect(restoredItem.completedAt).toBeNull();
    expect(restoredItem.cancelledAt).toBeNull();
    expect(restoredItem.noShowAt).toBeNull();
    expect(updatedCustomer.noShowCount).toBe(0);
  });

  it("rejects restore for active or non-today queue items", async () => {
    const activeItem = await createQueueItem({ name: `${testPrefix} active`, status: QueueItemStatus.WAITING });
    const tomorrowItem = await createQueueItem({
      name: `${testPrefix} tomorrow`,
      status: QueueItemStatus.DONE,
      dateValue: getTomorrowValue(),
    });

    await expect(restoreClosedQueueItem(activeItem.id)).rejects.toThrow("Queue item cannot be restored.");
    await expect(restoreClosedQueueItem(tomorrowItem.id)).rejects.toThrow("Queue item cannot be restored.");
  });

  it("reorders active queue items within the same day", async () => {
    const dateValue = "2099-12-30";
    const first = await createQueueItem({ name: `${testPrefix} reorder first`, dateValue, sortOrder: 1 });
    await createQueueItem({ name: `${testPrefix} reorder second`, dateValue, sortOrder: 2 });
    const third = await createQueueItem({ name: `${testPrefix} reorder third`, dateValue, sortOrder: 3 });
    const { start, end } = getDayBounds(dateValue);

    await reorderQueueItem(third.id, "up");

    const afterMoveUp = await prisma.queueItem.findMany({
      where: {
        customerNameSnapshot: { startsWith: `${testPrefix} reorder` },
        date: { gte: start, lt: end },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    expect(afterMoveUp.map((item) => item.customerNameSnapshot)).toEqual([
      `${testPrefix} reorder first`,
      `${testPrefix} reorder third`,
      `${testPrefix} reorder second`,
    ]);

    await reorderQueueItem(third.id, "bottom");

    const afterMoveBottom = await prisma.queueItem.findMany({
      where: {
        customerNameSnapshot: { startsWith: `${testPrefix} reorder` },
        date: { gte: start, lt: end },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    expect(afterMoveBottom.map((item) => item.customerNameSnapshot)).toEqual([
      `${testPrefix} reorder first`,
      `${testPrefix} reorder second`,
      `${testPrefix} reorder third`,
    ]);

    await expect(reorderQueueItem(first.id, "up")).resolves.toBeTruthy();
  });

  it("rejects reordering the in-progress queue item", async () => {
    const item = await createQueueItem({ name: `${testPrefix} reorder current`, status: QueueItemStatus.IN_PROGRESS });

    await expect(reorderQueueItem(item.id, "bottom")).rejects.toThrow("Queue item cannot be reordered.");
  });

  it("returns an empty database snapshot instead of fallback when no active queue exists", async () => {
    const snapshot = await getQueueStatusSnapshot("2099-12-31");

    expect(snapshot.source).toBe("database");
    expect(snapshot.queue).toHaveLength(0);
    expect(snapshot.shop.currentQueueCount).toBe(0);
  });

  it("uses manual wait minutes when owner overrides the estimate", async () => {
    const dateValue = "2099-12-29";
    await createQueueItem({ name: `${testPrefix} wait first`, dateValue, sortOrder: 1 });
    await createQueueItem({ name: `${testPrefix} wait second`, dateValue, sortOrder: 2 });

    const computedSnapshot = await getQueueStatusSnapshot(dateValue);
    expect(computedSnapshot.shop.estimatedWaitMinutes).toBe(60);
    expect(computedSnapshot.shop.waitEstimateSource).toBe("computed");

    await setManualWaitMinutes(25);

    const manualSnapshot = await getQueueStatusSnapshot(dateValue);
    expect(manualSnapshot.shop.estimatedWaitMinutes).toBe(25);
    expect(manualSnapshot.shop.manualWaitMinutes).toBe(25);
    expect(manualSnapshot.shop.waitEstimateSource).toBe("manual");

    await setManualWaitMinutes(null);

    const resetSnapshot = await getQueueStatusSnapshot(dateValue);
    expect(resetSnapshot.shop.estimatedWaitMinutes).toBe(60);
    expect(resetSnapshot.shop.manualWaitMinutes).toBeNull();
    expect(resetSnapshot.shop.waitEstimateSource).toBe("computed");
  });
});
