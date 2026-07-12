import { NotificationChannel, NotificationStatus, NotificationType, QueueCreatedBy } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { buildOwnerQueueNotificationMessage, buildQueueNotificationMessage, getQueueTimeLabel } from "./templates";
import { createLineClient, type ILinePushClient } from "./line-client";

type NotifyQueueEventOptions = {
  lineClient?: ILinePushClient | null;
  ownerLineUserId?: string | null;
};

const ownerNotificationTypes = new Set<NotificationType>([
  NotificationType.BOOKING_CONFIRMED,
  NotificationType.QUEUE_CREATED,
]);

const getQueueCode = (id: string) => `A${id.slice(-4).toUpperCase()}`;

const getOwnerLineUserId = async () => {
  const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });

  return settings?.ownerLineUserId?.trim() || process.env.OWNER_LINE_USER_ID?.trim() || null;
};

export const notifyQueueEvent = async (
  queueItemId: string,
  type: NotificationType,
  options: NotifyQueueEventOptions = {},
) => {
  const queueItem = await prisma.queueItem.findUnique({
    where: { id: queueItemId },
    include: {
      customer: true,
    },
  });

  if (!queueItem) {
    throw new Error("Queue item not found for notification.");
  }

  const recipient = queueItem.lineUserIdSnapshot ?? queueItem.customer?.lineUserId ?? null;
  const messagePreview = buildQueueNotificationMessage(type, {
    customerName: queueItem.customerNameSnapshot,
    queueCode: getQueueCode(queueItem.id),
    serviceName: queueItem.serviceNameSnapshot,
    statusLabel: queueItem.status,
    date: queueItem.date,
    timeLabel: getQueueTimeLabel(queueItem.startAt, queueItem.estimatedAt, queueItem.date),
  });

  if (!recipient) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: queueItem.customerId,
        channel: NotificationChannel.NONE,
        type,
        status: NotificationStatus.SKIPPED,
        recipient: null,
        messagePreview,
      },
    });
  }

  const lineClient = options.lineClient === undefined ? createLineClient() : options.lineClient;

  if (!lineClient) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: queueItem.customerId,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.SKIPPED,
        recipient,
        messagePreview,
      },
    });
  }

  try {
    await lineClient.pushTextMessage(recipient, messagePreview);

    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: queueItem.customerId,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.SENT,
        recipient,
        messagePreview,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: queueItem.customerId,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.FAILED,
        recipient,
        messagePreview,
        error: error instanceof Error ? error.message : "Unknown LINE push error",
      },
    });
  }
};


export const notifyOwnerQueueEvent = async (
  queueItemId: string,
  type: NotificationType,
  options: NotifyQueueEventOptions = {},
) => {
  const queueItem = await prisma.queueItem.findUnique({
    where: { id: queueItemId },
  });

  if (!queueItem) {
    throw new Error("Queue item not found for owner notification.");
  }

  if (!ownerNotificationTypes.has(type) || queueItem.createdBy !== QueueCreatedBy.CUSTOMER) {
    return null;
  }

  const messagePreview = buildOwnerQueueNotificationMessage(type, {
    customerName: queueItem.customerNameSnapshot,
    queueCode: getQueueCode(queueItem.id),
    serviceName: queueItem.serviceNameSnapshot,
    statusLabel: queueItem.status,
    date: queueItem.date,
    timeLabel: getQueueTimeLabel(queueItem.startAt, queueItem.estimatedAt, queueItem.date),
  });
  const recipient = options.ownerLineUserId === undefined ? await getOwnerLineUserId() : options.ownerLineUserId?.trim() || null;

  if (!recipient) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: null,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.SKIPPED,
        recipient: null,
        messagePreview,
        error: "Owner LINE user id is not configured.",
      },
    });
  }

  const lineClient = options.lineClient === undefined ? createLineClient() : options.lineClient;

  if (!lineClient) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: null,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.SKIPPED,
        recipient,
        messagePreview,
        error: "LINE_CHANNEL_ACCESS_TOKEN is not configured.",
      },
    });
  }

  try {
    await lineClient.pushTextMessage(recipient, messagePreview);

    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: null,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.SENT,
        recipient,
        messagePreview,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    return prisma.notificationLog.create({
      data: {
        queueItemId: queueItem.id,
        customerId: null,
        channel: NotificationChannel.LINE,
        type,
        status: NotificationStatus.FAILED,
        recipient,
        messagePreview,
        error: error instanceof Error ? error.message : "Unknown owner LINE push error",
      },
    });
  }
};

export const notifyQueueEventSafe = async (queueItemId: string, type: NotificationType) => {
  try {
    await notifyQueueEvent(queueItemId, type);
    await notifyOwnerQueueEvent(queueItemId, type);
  } catch {
    // Notification failure must not block booking or owner queue operations.
  }
};
