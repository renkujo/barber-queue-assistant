import { NotificationChannel, NotificationStatus, NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { buildQueueNotificationMessage, getQueueTimeLabel } from "./templates";
import { createLineClient, type ILinePushClient } from "./line-client";

type NotifyQueueEventOptions = {
  lineClient?: ILinePushClient | null;
};

const getQueueCode = (id: string) => `A${id.slice(-4).toUpperCase()}`;

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

export const notifyQueueEventSafe = async (queueItemId: string, type: NotificationType) => {
  try {
    await notifyQueueEvent(queueItemId, type);
  } catch {
    // Notification failure must not block booking or owner queue operations.
  }
};
