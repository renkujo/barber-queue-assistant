import { Prisma } from "@/generated/prisma/client";
import {
  NotificationAudience,
  NotificationChannel,
  NotificationSkipReason,
  NotificationStatus,
  NotificationType,
  QueueCreatedBy,
} from "@/generated/prisma/enums";
import { getPilotMeasurementConfig } from "@/lib/pilot/config";
import { prisma } from "@/lib/prisma";
import { getQueueCode } from "@/lib/queue/code";
import { buildOwnerQueueNotificationMessage, buildQueueNotificationMessage, getQueueTimeLabel } from "./templates";
import { createLineClient, type ILinePushClient } from "./line-client";

type NotifyQueueEventOptions = {
  lineClient?: ILinePushClient | null;
  ownerLineUserId?: string | null;
  operationId?: string;
};

const ownerNotificationTypes = new Set<NotificationType>([
  NotificationType.BOOKING_CONFIRMED,
  NotificationType.QUEUE_CREATED,
]);

const getOwnerLineUserId = async () => {
  const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });
  return settings?.ownerLineUserId?.trim() || process.env.OWNER_LINE_USER_ID?.trim() || null;
};

const isUniqueConflict = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const createPilotAttempt = async (input: {
  queueItemId: string;
  customerId: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  recipient: string | null;
  messagePreview: string;
  error?: string;
  audience: NotificationAudience;
  skipReason?: NotificationSkipReason;
  operationId: string;
  pilotCohortId: string;
}) => {
  const businessEventKey = `${input.operationId}:${input.type}`;

  try {
    const attempt = await prisma.notificationLog.create({
      data: {
        queueItemId: input.queueItemId,
        customerId: input.customerId,
        channel: input.channel,
        type: input.type,
        status: input.status,
        recipient: input.recipient,
        messagePreview: input.messagePreview,
        error: input.error,
        audience: input.audience,
        skipReason: input.skipReason,
        businessEventKey,
        attemptNumber: 1,
        pilotCohortId: input.pilotCohortId,
        operationId: input.operationId,
      },
    });

    return { attempt, won: true };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;

    const existing = await prisma.notificationLog.findFirst({
      where: { businessEventKey, audience: input.audience, attemptNumber: 1 },
    });
    if (!existing) throw error;
    return { attempt: existing, won: false };
  }
};

const sendPilotLineAttempt = async (input: {
  queueItemId: string;
  customerId: string | null;
  type: NotificationType;
  recipient: string;
  messagePreview: string;
  audience: NotificationAudience;
  operationId: string;
  pilotCohortId: string;
  lineClient: ILinePushClient;
  failureLabel: string;
}) => {
  const { attempt, won } = await createPilotAttempt({
    ...input,
    channel: NotificationChannel.LINE,
    status: NotificationStatus.PENDING,
  });

  if (!won) return attempt;

  try {
    await input.lineClient.pushTextMessage(input.recipient, input.messagePreview);
  } catch (error) {
    return prisma.notificationLog.update({
      where: { id: attempt.id },
      data: {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message.slice(0, 500) : input.failureLabel,
      },
    });
  }

  // Persisting SENT is intentionally outside the provider-call catch. If this write
  // fails after LINE accepted the message, the durable attempt stays PENDING/unknown.
  return prisma.notificationLog.update({
    where: { id: attempt.id },
    data: { status: NotificationStatus.SENT, sentAt: new Date() },
  });
};

const getPilotAttemptContext = (queueItem: { pilotCohortId: string | null }, operationId?: string) => {
  const state = getPilotMeasurementConfig();
  if (!state.enabled || state.status !== "configured" || !operationId || !queueItem.pilotCohortId) return null;
  if (queueItem.pilotCohortId !== state.config.cohortId) return null;
  return { operationId, pilotCohortId: queueItem.pilotCohortId };
};

export const notifyQueueEvent = async (queueItemId: string, type: NotificationType, options: NotifyQueueEventOptions = {}) => {
  const queueItem = await prisma.queueItem.findUnique({ where: { id: queueItemId }, include: { customer: true } });
  if (!queueItem) throw new Error("Queue item not found for notification.");

  const recipient = queueItem.lineUserIdSnapshot ?? queueItem.customer?.lineUserId ?? null;
  const messagePreview = buildQueueNotificationMessage(type, {
    customerName: queueItem.customerNameSnapshot,
    queueCode: getQueueCode(queueItem.id),
    serviceName: queueItem.serviceNameSnapshot,
    statusLabel: queueItem.status,
    date: queueItem.date,
    timeLabel: getQueueTimeLabel(queueItem.startAt, queueItem.estimatedAt, queueItem.date),
  });
  const pilot = getPilotAttemptContext(queueItem, options.operationId);

  if (!recipient) {
    if (pilot) {
      return (await createPilotAttempt({ queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.NONE, type, status: NotificationStatus.SKIPPED, recipient: null, messagePreview, audience: NotificationAudience.CUSTOMER, skipReason: NotificationSkipReason.NO_CUSTOMER_RECIPIENT, ...pilot })).attempt;
    }
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.NONE, type, status: NotificationStatus.SKIPPED, recipient: null, messagePreview } });
  }

  const lineClient = options.lineClient === undefined ? createLineClient() : options.lineClient;
  if (!lineClient) {
    if (pilot) {
      return (await createPilotAttempt({ queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient, messagePreview, audience: NotificationAudience.CUSTOMER, skipReason: NotificationSkipReason.LINE_TOKEN_MISSING, ...pilot })).attempt;
    }
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient, messagePreview } });
  }

  if (pilot) {
    return sendPilotLineAttempt({ queueItemId: queueItem.id, customerId: queueItem.customerId, type, recipient, messagePreview, audience: NotificationAudience.CUSTOMER, lineClient, failureLabel: "Unknown LINE push error", ...pilot });
  }

  try {
    await lineClient.pushTextMessage(recipient, messagePreview);
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.LINE, type, status: NotificationStatus.SENT, recipient, messagePreview, sentAt: new Date() } });
  } catch (error) {
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: queueItem.customerId, channel: NotificationChannel.LINE, type, status: NotificationStatus.FAILED, recipient, messagePreview, error: error instanceof Error ? error.message : "Unknown LINE push error" } });
  }
};

export const notifyOwnerQueueEvent = async (queueItemId: string, type: NotificationType, options: NotifyQueueEventOptions = {}) => {
  const queueItem = await prisma.queueItem.findUnique({ where: { id: queueItemId } });
  if (!queueItem) throw new Error("Queue item not found for owner notification.");
  if (!ownerNotificationTypes.has(type) || queueItem.createdBy !== QueueCreatedBy.CUSTOMER) return null;

  const messagePreview = buildOwnerQueueNotificationMessage(type, {
    customerName: queueItem.customerNameSnapshot,
    queueCode: getQueueCode(queueItem.id),
    serviceName: queueItem.serviceNameSnapshot,
    statusLabel: queueItem.status,
    date: queueItem.date,
    timeLabel: getQueueTimeLabel(queueItem.startAt, queueItem.estimatedAt, queueItem.date),
  });
  const recipient = options.ownerLineUserId === undefined ? await getOwnerLineUserId() : options.ownerLineUserId?.trim() || null;
  const pilot = getPilotAttemptContext(queueItem, options.operationId);

  if (!recipient) {
    if (pilot) {
      return (await createPilotAttempt({ queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient: null, messagePreview, error: "Owner LINE user id is not configured.", audience: NotificationAudience.OWNER, skipReason: NotificationSkipReason.NO_OWNER_RECIPIENT, ...pilot })).attempt;
    }
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient: null, messagePreview, error: "Owner LINE user id is not configured." } });
  }

  const lineClient = options.lineClient === undefined ? createLineClient() : options.lineClient;
  if (!lineClient) {
    if (pilot) {
      return (await createPilotAttempt({ queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient, messagePreview, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured.", audience: NotificationAudience.OWNER, skipReason: NotificationSkipReason.LINE_TOKEN_MISSING, ...pilot })).attempt;
    }
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.SKIPPED, recipient, messagePreview, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured." } });
  }

  if (pilot) {
    return sendPilotLineAttempt({ queueItemId: queueItem.id, customerId: null, type, recipient, messagePreview, audience: NotificationAudience.OWNER, lineClient, failureLabel: "Unknown owner LINE push error", ...pilot });
  }

  try {
    await lineClient.pushTextMessage(recipient, messagePreview);
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.SENT, recipient, messagePreview, sentAt: new Date() } });
  } catch (error) {
    return prisma.notificationLog.create({ data: { queueItemId: queueItem.id, customerId: null, channel: NotificationChannel.LINE, type, status: NotificationStatus.FAILED, recipient, messagePreview, error: error instanceof Error ? error.message : "Unknown owner LINE push error" } });
  }
};

export const notifyQueueEventSafe = async (queueItemId: string, type: NotificationType, options: NotifyQueueEventOptions = {}) => {
  try {
    await notifyQueueEvent(queueItemId, type, options);
    await notifyOwnerQueueEvent(queueItemId, type, options);
  } catch {
    // Notification failure must not block booking or owner queue operations.
  }
};
