import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { NotificationChannel, NotificationStatus, NotificationType, QueueCreatedBy, QueueItemStatus, QueueItemType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { bindLineUserId } from "@/lib/notifications/line-binding";
import { notifyOwnerQueueEvent, notifyQueueEvent } from "@/lib/notifications/queue-notifications";
import { createDateTime, getDayBounds, getTodayValue } from "@/lib/queue/date";
import type { ILinePushClient } from "@/lib/notifications/line-client";

const testPrefix = "VI-NOTIFY";
const serviceId = "vitest-notification-service";

const cleanup = async () => {
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

  await prisma.customer.deleteMany({
    where: {
      name: {
        startsWith: testPrefix,
      },
      queueItems: { none: {} },
    },
  });
};

const ensureService = async () => {
  await prisma.service.upsert({
    where: { id: serviceId },
    update: {
      isActive: true,
      name: "Vitest Notification Service",
      durationMinutes: 30,
      priceCents: 25000,
      sortOrder: 1000,
    },
    create: {
      id: serviceId,
      isActive: true,
      name: "Vitest Notification Service",
      durationMinutes: 30,
      priceCents: 25000,
      sortOrder: 1000,
    },
  });
};

const createQueueItem = async ({ createdBy = QueueCreatedBy.CUSTOMER, lineUserId, name }: { createdBy?: QueueCreatedBy; lineUserId?: string; name: string }) => {
  const customer = await prisma.customer.create({
    data: {
      name,
      phone: `09${Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, "0")}`,
      lineUserId,
    },
  });

  return prisma.queueItem.create({
    data: {
      type: QueueItemType.WALK_IN,
      status: QueueItemStatus.WAITING,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      phoneSnapshot: customer.phone,
      lineUserIdSnapshot: customer.lineUserId,
      serviceId,
      serviceNameSnapshot: "Vitest Notification Service",
      serviceDurationMinutes: 30,
      date: getDayBounds(getTodayValue()).start,
      estimatedAt: createDateTime(getTodayValue(), "15:30"),
      sortOrder: 1,
      createdBy,
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

describe("queue notifications", () => {
  it("binds a LINE user id from webhook-style events", async () => {
    const lineUserId = `U${Date.now()}binding`;

    const customer = await bindLineUserId(lineUserId);

    expect(customer?.lineUserId).toBe(lineUserId);
    expect(customer?.name).toContain("LINE user");

    const updatedCustomer = await bindLineUserId(lineUserId, `${testPrefix} Bound User`);

    expect(updatedCustomer?.id).toBe(customer?.id);
    expect(updatedCustomer?.name).toBe(`${testPrefix} Bound User`);
  });

  it("logs a skipped NONE notification when the queue has no LINE identity", async () => {
    const queueItem = await createQueueItem({ name: `${testPrefix} No Line` });

    const notification = await notifyQueueEvent(queueItem.id, NotificationType.QUEUE_CREATED, { lineClient: null });

    expect(notification.channel).toBe(NotificationChannel.NONE);
    expect(notification.status).toBe(NotificationStatus.SKIPPED);
    expect(notification.recipient).toBeNull();
    expect(notification.messagePreview).toContain("รับคิวแล้ว");
    expect(notification.messagePreview).toContain("ตอนนี้คิวของคุณ");
    expect(notification.messagePreview).toContain("รอเรียกคิว");
    expect(notification.messagePreview).not.toContain(QueueItemStatus.WAITING);
  });

  it("sends through the provided LINE client and logs SENT when LINE identity exists", async () => {
    const queueItem = await createQueueItem({ name: `${testPrefix} Sent`, lineUserId: `U${Date.now()}sent` });
    const pushes: Array<{ to: string; text: string }> = [];
    const lineClient: ILinePushClient = {
      pushTextMessage: async (to, text) => {
        pushes.push({ to, text });
      },
    };

    const notification = await notifyQueueEvent(queueItem.id, NotificationType.QUEUE_CREATED, { lineClient });

    expect(notification.channel).toBe(NotificationChannel.LINE);
    expect(notification.status).toBe(NotificationStatus.SENT);
    expect(notification.sentAt).toBeInstanceOf(Date);
    expect(pushes).toHaveLength(1);
    expect(pushes[0]?.to).toBe(queueItem.lineUserIdSnapshot);
    expect(pushes[0]?.text).toContain("Vitest Notification Service");
    expect(pushes[0]?.text).toContain("รอเรียกคิว");
    expect(pushes[0]?.text).not.toContain(QueueItemStatus.WAITING);
  });


  it("sends owner LINE notification for customer-created queue events", async () => {
    const queueItem = await createQueueItem({ name: `${testPrefix} Owner Notify` });
    const pushes: Array<{ to: string; text: string }> = [];
    const lineClient: ILinePushClient = {
      pushTextMessage: async (to, text) => {
        pushes.push({ to, text });
      },
    };

    const notification = await notifyOwnerQueueEvent(queueItem.id, NotificationType.QUEUE_CREATED, {
      lineClient,
      ownerLineUserId: "U-owner-line-id",
    });

    expect(notification?.channel).toBe(NotificationChannel.LINE);
    expect(notification?.status).toBe(NotificationStatus.SENT);
    expect(notification?.customerId).toBeNull();
    expect(notification?.recipient).toBe("U-owner-line-id");
    expect(notification?.messagePreview).toContain("มี walk-in ใหม่");
    expect(notification?.messagePreview).toContain("Vitest Notification Service");
    expect(pushes).toHaveLength(1);
    expect(pushes[0]?.to).toBe("U-owner-line-id");
    expect(pushes[0]?.text).toContain("มี walk-in ใหม่");
  });

  it("logs owner LINE notification as skipped when owner recipient is missing", async () => {
    const queueItem = await createQueueItem({ name: `${testPrefix} Owner Missing` });

    const notification = await notifyOwnerQueueEvent(queueItem.id, NotificationType.QUEUE_CREATED, {
      lineClient: null,
      ownerLineUserId: null,
    });

    expect(notification?.channel).toBe(NotificationChannel.LINE);
    expect(notification?.status).toBe(NotificationStatus.SKIPPED);
    expect(notification?.recipient).toBeNull();
    expect(notification?.error).toContain("OWNER_LINE_USER_ID");
  });

  it("does not notify owner for owner-created queue events", async () => {
    const queueItem = await createQueueItem({ createdBy: QueueCreatedBy.OWNER, name: `${testPrefix} Owner Created` });
    const lineClient: ILinePushClient = {
      pushTextMessage: async () => {
        throw new Error("owner-created event should not push");
      },
    };

    const notification = await notifyOwnerQueueEvent(queueItem.id, NotificationType.QUEUE_CREATED, {
      lineClient,
      ownerLineUserId: "U-owner-line-id",
    });

    expect(notification).toBeNull();
  });

  it("logs FAILED when LINE push fails", async () => {
    const queueItem = await createQueueItem({ name: `${testPrefix} Failed`, lineUserId: `U${Date.now()}failed` });
    const lineClient: ILinePushClient = {
      pushTextMessage: async () => {
        throw new Error("fake LINE outage");
      },
    };

    const notification = await notifyQueueEvent(queueItem.id, NotificationType.QUEUE_NEAR, { lineClient });

    expect(notification.channel).toBe(NotificationChannel.LINE);
    expect(notification.status).toBe(NotificationStatus.FAILED);
    expect(notification.error).toContain("fake LINE outage");
  });
});
