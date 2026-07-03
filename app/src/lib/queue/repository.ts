import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  QueueCreatedBy,
  QueueItemStatus,
  QueueItemType,
  TimeBlockType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { services as fallbackServices, shopStatus, todayQueue } from "@/lib/queue-demo";
import { createDateTime, formatThaiTime, getDayBounds, getTodayValue, toDateValue } from "./date";

export type QueueService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};

export type QueueListItem = {
  id: string;
  code: string;
  customerName: string;
  serviceName: string;
  status: string;
  timeLabel: string;
  statusLabel: string;
  note: string;
  tone?: "current" | "next" | "warning";
};

export type OwnerQueueListItem = QueueListItem & {
  ownerNote: string;
};

export type QueueStatusSnapshot = {
  shop: typeof shopStatus;
  queue: QueueListItem[];
  source: "database" | "fallback";
};

export type CreateBookingInput = {
  customerName: string;
  phone?: string;
  lineUserId?: string;
  serviceId: string;
  dateValue: string;
  timeValue: string;
  note?: string;
};

export type CreateWalkInInput = {
  customerName: string;
  phone?: string;
  lineUserId?: string;
  serviceId: string;
  note?: string;
};

export type CreateOwnerWalkInInput = CreateWalkInInput;

export type QueueItemEditDetails = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  dateValue: string;
  timeValue: string;
  note: string;
  ownerNote: string;
  statusLabel: string;
};

export type OwnerNotificationLogItem = {
  id: string;
  channelLabel: string;
  typeLabel: string;
  statusLabel: string;
  timeLabel: string;
  customerName: string;
  messagePreview: string;
  error: string;
  tone: "positive" | "warning" | "neutral";
};

export type UpdateQueueItemInput = {
  id: string;
  customerName: string;
  phone?: string;
  serviceId: string;
  dateValue: string;
  timeValue?: string;
  note?: string;
  ownerNote?: string;
};

export type BookingSlot = {
  value: string;
  label: string;
  available: boolean;
};

const defaultBookingTimes = ["09:30", "10:30", "13:00", "14:30", "16:00", "17:00"];

export const getDefaultBookingTimes = () => defaultBookingTimes;

const statusLabels: Record<string, string> = {
  [QueueItemStatus.CONFIRMED]: "ยืนยันแล้ว",
  [QueueItemStatus.ARRIVED]: "มาถึงแล้ว",
  [QueueItemStatus.WAITING]: "รออยู่",
  [QueueItemStatus.LATE]: "มาสาย",
  [QueueItemStatus.IN_PROGRESS]: "กำลังตัด",
  [QueueItemStatus.DONE]: "เสร็จแล้ว",
  [QueueItemStatus.CANCELLED]: "ยกเลิก",
  [QueueItemStatus.NO_SHOW]: "ไม่มา",
};

const notificationChannelLabels: Record<NotificationChannel, string> = {
  [NotificationChannel.LINE]: "LINE",
  [NotificationChannel.SMS]: "SMS",
  [NotificationChannel.MANUAL]: "Manual",
  [NotificationChannel.NONE]: "ไม่ส่ง",
};

const notificationStatusLabels: Record<NotificationStatus, string> = {
  [NotificationStatus.PENDING]: "รอส่ง",
  [NotificationStatus.SENT]: "ส่งแล้ว",
  [NotificationStatus.FAILED]: "ส่งไม่สำเร็จ",
  [NotificationStatus.SKIPPED]: "ข้าม",
};

const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.BOOKING_CONFIRMED]: "จองสำเร็จ",
  [NotificationType.QUEUE_CREATED]: "สร้างคิว",
  [NotificationType.REMINDER]: "เตือนคิว",
  [NotificationType.CONFIRM_COMING]: "ยืนยันมา",
  [NotificationType.QUEUE_NEAR]: "ถึงคิวแล้ว",
  [NotificationType.LATE]: "มาสาย",
  [NotificationType.CANCELLED]: "ยกเลิก",
  [NotificationType.NO_SHOW]: "ไม่มา",
};

const activeQueueStatusExclusions = [QueueItemStatus.CANCELLED, QueueItemStatus.DONE, QueueItemStatus.NO_SHOW];
const closedQueueStatuses: QueueItemStatus[] = [QueueItemStatus.CANCELLED, QueueItemStatus.DONE, QueueItemStatus.NO_SHOW];

const customerCounterByStatus = {
  [QueueItemStatus.CANCELLED]: "cancelledCount",
  [QueueItemStatus.DONE]: "completedCount",
  [QueueItemStatus.LATE]: "lateCount",
  [QueueItemStatus.NO_SHOW]: "noShowCount",
} as const;

type CustomerCounterStatus = keyof typeof customerCounterByStatus;

const getCustomerCounterUpdate = (previousStatus: QueueItemStatus, nextStatus: QueueItemStatus) => {
  if (previousStatus === nextStatus || !(nextStatus in customerCounterByStatus)) {
    return null;
  }

  return {
    [customerCounterByStatus[nextStatus as CustomerCounterStatus]]: {
      increment: 1,
    },
  };
};

const getCustomerCounterRestoreUpdate = (previousStatus: QueueItemStatus) => {
  if (!(previousStatus in customerCounterByStatus)) {
    return null;
  }

  return {
    [customerCounterByStatus[previousStatus as CustomerCounterStatus]]: {
      decrement: 1,
    },
  };
};

const getPriceLabel = (priceCents?: number | null) => {
  if (!priceCents) {
    return "สอบถามราคา";
  }

  return `${Math.round(priceCents / 100)} บาท`;
};

const priceLabelToCents = (priceLabel: string) => Number(priceLabel.replace(/\D/g, "")) * 100 || null;

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const toTimeValue = (date: Date) => {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${hour}:${minute}`;
};

const overlaps = (leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) => leftStart < rightEnd && leftEnd > rightStart;

const getQueueCode = (id: string, index: number) => {
  const suffix = id.slice(-2).toUpperCase();
  return `A${`${index + 1}`.padStart(2, "0")}${suffix}`;
};

const getTone = (status: string, index: number): QueueListItem["tone"] => {
  if (status === QueueItemStatus.IN_PROGRESS) {
    return "current";
  }

  if (status === QueueItemStatus.LATE) {
    return "warning";
  }

  if (index === 0 || status === QueueItemStatus.ARRIVED || status === QueueItemStatus.WAITING) {
    return "next";
  }

  return undefined;
};

const mapQueueItem = (
  item: {
    id: string;
    customerNameSnapshot: string;
    serviceNameSnapshot: string;
    status: string;
    startAt: Date | null;
    estimatedAt: Date | null;
    note: string | null;
  },
  index: number,
): QueueListItem => {
  const timeSource = item.startAt ?? item.estimatedAt;

  return {
    id: item.id,
    code: getQueueCode(item.id, index),
    customerName: item.customerNameSnapshot,
    serviceName: item.serviceNameSnapshot,
    status: item.status,
    timeLabel: timeSource ? formatThaiTime(timeSource) : "รอ",
    statusLabel: statusLabels[item.status] ?? item.status,
    note: item.note ?? item.serviceNameSnapshot,
    tone: getTone(item.status, index),
  };
};

const mapOwnerQueueItem = (
  item: Parameters<typeof mapQueueItem>[0] & { ownerNote: string | null },
  index: number,
): OwnerQueueListItem => ({
  ...mapQueueItem(item, index),
  ownerNote: item.ownerNote ?? "",
});

const getNotificationTone = (status: NotificationStatus): OwnerNotificationLogItem["tone"] => {
  if (status === NotificationStatus.SENT) {
    return "positive";
  }

  if (status === NotificationStatus.FAILED) {
    return "warning";
  }

  return "neutral";
};

const mapOwnerNotificationLog = (log: {
  id: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  messagePreview: string;
  error: string | null;
  createdAt: Date;
  queueItem: { customerNameSnapshot: string } | null;
  customer: { name: string } | null;
}): OwnerNotificationLogItem => ({
  id: log.id,
  channelLabel: notificationChannelLabels[log.channel],
  typeLabel: notificationTypeLabels[log.type],
  statusLabel: notificationStatusLabels[log.status],
  timeLabel: formatThaiTime(log.createdAt),
  customerName: log.queueItem?.customerNameSnapshot ?? log.customer?.name ?? "ไม่ระบุลูกค้า",
  messagePreview: log.messagePreview,
  error: log.error ?? "",
  tone: getNotificationTone(log.status),
});

export const getFallbackStatusSnapshot = (): QueueStatusSnapshot => ({
  shop: shopStatus,
  queue: todayQueue.map((item, index) => ({ id: `fallback-${index}`, status: item.statusLabel, ...item })),
  source: "fallback",
});

export const getServices = async (): Promise<QueueService[]> => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (!services.length) {
    return fallbackServices;
  }

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    priceLabel: getPriceLabel(service.priceCents),
  }));
};

export const getServicesSafe = async () => {
  try {
    return await getServices();
  } catch {
    return fallbackServices;
  }
};

export const getQueueStatusSnapshot = async (dateValue = getTodayValue()): Promise<QueueStatusSnapshot> => {
  const { start, end } = getDayBounds(dateValue);
  const queueItems = await prisma.queueItem.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
      status: {
        notIn: activeQueueStatusExclusions,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { startAt: "asc" }, { estimatedAt: "asc" }, { createdAt: "asc" }],
  });

  return {
    shop: {
      ...shopStatus,
      currentQueueCount: queueItems.length,
      estimatedWaitMinutes: queueItems.reduce((total, item) => total + item.serviceDurationMinutes, 0),
    },
    queue: queueItems.map(mapQueueItem),
    source: "database",
  };
};

export const getQueueStatusSnapshotSafe = async () => {
  try {
    return await getQueueStatusSnapshot();
  } catch {
    return getFallbackStatusSnapshot();
  }
};

export const getOwnerQueueStatusSnapshot = async (dateValue = getTodayValue()) => {
  const snapshot = await getQueueStatusSnapshot(dateValue);

  if (snapshot.source !== "database") {
    return snapshot;
  }

  const { start, end } = getDayBounds(dateValue);
  const queueItems = await prisma.queueItem.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
      status: {
        notIn: activeQueueStatusExclusions,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { startAt: "asc" }, { estimatedAt: "asc" }, { createdAt: "asc" }],
  });

  return {
    ...snapshot,
    queue: queueItems.map(mapOwnerQueueItem),
  };
};

export const getOwnerQueueStatusSnapshotSafe = async () => {
  try {
    return await getOwnerQueueStatusSnapshot();
  } catch {
    return getFallbackStatusSnapshot();
  }
};

export const getOwnerClosedQueueItems = async (dateValue = getTodayValue()) => {
  const { start, end } = getDayBounds(dateValue);
  const queueItems = await prisma.queueItem.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { startAt: "asc" }, { estimatedAt: "asc" }, { createdAt: "asc" }],
  });

  return queueItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => closedQueueStatuses.includes(item.status))
    .map(({ item, index }) => mapOwnerQueueItem(item, index));
};

export const getOwnerClosedQueueItemsSafe = async () => {
  try {
    return await getOwnerClosedQueueItems();
  } catch {
    return [];
  }
};

export const getOwnerRecentNotificationLogs = async (limit = 8): Promise<OwnerNotificationLogItem[]> => {
  const logs = await prisma.notificationLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      queueItem: {
        select: {
          customerNameSnapshot: true,
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return logs.map(mapOwnerNotificationLog);
};

export const getOwnerRecentNotificationLogsSafe = async () => {
  try {
    return await getOwnerRecentNotificationLogs();
  } catch {
    return [];
  }
};

export const restoreClosedQueueItem = async (id: string) => {
  const existingItem = await prisma.queueItem.findUnique({ where: { id } });

  if (!existingItem) {
    throw new Error("Queue item not found.");
  }

  const { start, end } = getDayBounds(getTodayValue());

  if (existingItem.date < start || existingItem.date >= end || !closedQueueStatuses.includes(existingItem.status)) {
    throw new Error("Queue item cannot be restored.");
  }

  const customerCounterUpdate = getCustomerCounterRestoreUpdate(existingItem.status);

  return prisma.$transaction(async (tx) => {
    if (existingItem.customerId && customerCounterUpdate) {
      await tx.customer.update({
        where: { id: existingItem.customerId },
        data: customerCounterUpdate,
      });
    }

    return tx.queueItem.update({
      where: { id },
      data: {
        status: QueueItemStatus.WAITING,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        noShowAt: null,
      },
    });
  });
};

export const createBreakTimeBlock = async (durationMinutes = 30) => {
  const now = new Date();
  const { start } = getDayBounds(getTodayValue());

  return prisma.timeBlock.create({
    data: {
      date: start,
      startAt: now,
      endAt: addMinutes(now, durationMinutes),
      reason: `พัก ${durationMinutes} นาที`,
      type: TimeBlockType.BREAK,
    },
  });
};

export const getAvailableBookingSlots = async (dateValue: string, serviceId?: string): Promise<BookingSlot[]> => {
  const service = serviceId ? await findService(serviceId) : null;
  const durationMinutes = service?.durationMinutes ?? fallbackServices[0]?.durationMinutes ?? 30;
  const { start, end } = getDayBounds(dateValue);
  const [queueItems, timeBlocks] = await Promise.all([
    prisma.queueItem.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
        startAt: { not: null },
        status: {
          notIn: activeQueueStatusExclusions,
        },
      },
      select: {
        startAt: true,
        serviceDurationMinutes: true,
      },
    }),
    prisma.timeBlock.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  return defaultBookingTimes.map((time) => {
    const slotStart = createDateTime(dateValue, time);
    const slotEnd = addMinutes(slotStart, durationMinutes);
    const isPast = slotStart < new Date();
    const conflictsWithQueue = queueItems.some((item) => {
      if (!item.startAt) {
        return false;
      }

      return overlaps(slotStart, slotEnd, item.startAt, addMinutes(item.startAt, item.serviceDurationMinutes));
    });
    const conflictsWithBlock = timeBlocks.some((block) => overlaps(slotStart, slotEnd, block.startAt, block.endAt));

    return {
      value: time,
      label: time,
      available: !isPast && !conflictsWithQueue && !conflictsWithBlock,
    };
  });
};

export const getAvailableBookingSlotsSafe = async (dateValue: string, serviceId?: string) => {
  try {
    return await getAvailableBookingSlots(dateValue, serviceId);
  } catch {
    return defaultBookingTimes.map((time) => ({ value: time, label: time, available: true }));
  }
};

const getQueueItemsForDate = async (date: Date) => {
  const dateValue = toDateValue(date);
  const { start, end } = getDayBounds(dateValue);

  return prisma.queueItem.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { startAt: "asc" }, { estimatedAt: "asc" }, { createdAt: "asc" }],
  });
};

const getQueueItemWithIndex = async (id: string) => {
  const item = await prisma.queueItem.findUnique({ where: { id } });

  if (!item) {
    return null;
  }

  const queueItems = await getQueueItemsForDate(item.date);
  const index = queueItems.findIndex((queueItem) => queueItem.id === item.id);

  return {
    item,
    index: index >= 0 ? index : 0,
  };
};

const findOrCreateCustomer = async (input: { name: string; phone?: string; lineUserId?: string }) => {
  const lineUserId = input.lineUserId?.trim() || undefined;

  if (lineUserId) {
    const existingLineCustomer = await prisma.customer.findUnique({ where: { lineUserId } });

    if (existingLineCustomer) {
      return prisma.customer.update({
        where: { id: existingLineCustomer.id },
        data: {
          name: input.name,
          phone: input.phone || existingLineCustomer.phone,
        },
      });
    }
  }

  if (input.phone) {
    const existingCustomer = await prisma.customer.findFirst({ where: { phone: input.phone } });

    if (existingCustomer) {
      if (lineUserId && !existingCustomer.lineUserId) {
        return prisma.customer.update({
          where: { id: existingCustomer.id },
          data: { lineUserId },
        });
      }

      return existingCustomer;
    }
  }

  return prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      lineUserId,
      totalBookings: 1,
    },
  });
};

const findService = async (serviceId: string) => {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });

  if (service) {
    return service;
  }

  const fallback = fallbackServices.find((item) => item.id === serviceId) ?? fallbackServices[0];

  return prisma.service.create({
    data: {
      id: fallback.id,
      name: fallback.name,
      durationMinutes: fallback.durationMinutes,
      priceCents: priceLabelToCents(fallback.priceLabel),
      sortOrder: fallbackServices.findIndex((item) => item.id === fallback.id),
    },
  });
};

export const ensureDefaultServices = async () => {
  const existingCount = await prisma.service.count();

  if (existingCount > 0) {
    return;
  }

  await prisma.service.createMany({
    data: fallbackServices.map((service, index) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: priceLabelToCents(service.priceLabel),
      sortOrder: index,
    })),
    skipDuplicates: true,
  });
};

export const createBooking = async (input: CreateBookingInput) => {
  const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId });
  const service = await findService(input.serviceId);
  const startAt = createDateTime(input.dateValue, input.timeValue);
  const { start } = getDayBounds(input.dateValue);
  const slots = await getAvailableBookingSlots(input.dateValue, service.id);
  const selectedSlot = slots.find((slot) => slot.value === input.timeValue);

  if (!selectedSlot?.available) {
    throw new Error("Booking slot is not available.");
  }

  return prisma.queueItem.create({
    data: {
      type: QueueItemType.BOOKING,
      status: QueueItemStatus.CONFIRMED,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      phoneSnapshot: customer.phone,
      lineUserIdSnapshot: customer.lineUserId,
      serviceId: service.id,
      serviceNameSnapshot: service.name,
      serviceDurationMinutes: service.durationMinutes,
      date: start,
      startAt,
      note: input.note,
      createdBy: QueueCreatedBy.CUSTOMER,
    },
  });
};

export const createWalkIn = async (input: CreateWalkInInput) => {
  const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId });
  const service = await findService(input.serviceId);
  const todayValue = getTodayValue();
  const { start } = getDayBounds(todayValue);

  return prisma.queueItem.create({
    data: {
      type: QueueItemType.WALK_IN,
      status: QueueItemStatus.WAITING,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      phoneSnapshot: customer.phone,
      lineUserIdSnapshot: customer.lineUserId,
      serviceId: service.id,
      serviceNameSnapshot: service.name,
      serviceDurationMinutes: service.durationMinutes,
      date: start,
      estimatedAt: new Date(),
      note: input.note,
      createdBy: QueueCreatedBy.CUSTOMER,
    },
  });
};


export const createOwnerWalkIn = async (input: CreateOwnerWalkInInput) => {
  const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId });
  const service = await findService(input.serviceId);
  const todayValue = getTodayValue();
  const { start } = getDayBounds(todayValue);

  return prisma.queueItem.create({
    data: {
      type: QueueItemType.WALK_IN,
      status: QueueItemStatus.WAITING,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      phoneSnapshot: customer.phone,
      lineUserIdSnapshot: customer.lineUserId,
      serviceId: service.id,
      serviceNameSnapshot: service.name,
      serviceDurationMinutes: service.durationMinutes,
      date: start,
      estimatedAt: new Date(),
      note: input.note,
      createdBy: QueueCreatedBy.OWNER,
    },
  });
};

export const getQueueItem = async (id: string) => {
  const result = await getQueueItemWithIndex(id);

  if (!result) {
    return null;
  }

  return mapQueueItem(result.item, result.index);
};

export const getQueueItemEditDetails = async (id: string): Promise<QueueItemEditDetails | null> => {
  const result = await getQueueItemWithIndex(id);

  if (!result) {
    return null;
  }

  const { item, index } = result;
  const timeSource = item.startAt ?? null;

  return {
    id: item.id,
    code: getQueueCode(item.id, index),
    customerName: item.customerNameSnapshot,
    phone: item.phoneSnapshot ?? "",
    serviceId: item.serviceId ?? "",
    serviceName: item.serviceNameSnapshot,
    dateValue: toDateValue(item.date),
    timeValue: timeSource ? toTimeValue(timeSource) : "",
    note: item.note ?? "",
    ownerNote: item.ownerNote ?? "",
    statusLabel: statusLabels[item.status] ?? item.status,
  };
};

export const getQueueItemByCode = async (code: string) => {
  const rawCode = code.trim();
  const normalizedCode = rawCode.replace(/[\s-]/g, "").toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const directMatch = await getQueueItemWithIndex(rawCode).catch(() => null);

  if (directMatch) {
    return {
      id: directMatch.item.id,
      item: mapQueueItem(directMatch.item, directMatch.index),
    };
  }

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 1);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + 8);
  const fromBounds = getDayBounds(toDateValue(fromDate));
  const toBounds = getDayBounds(toDateValue(toDate));

  const queueItems = await prisma.queueItem.findMany({
    where: {
      date: {
        gte: fromBounds.start,
        lt: toBounds.end,
      },
    },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { startAt: "asc" }, { estimatedAt: "asc" }, { createdAt: "asc" }],
  });

  const indexByDate = new Map<string, number>();

  for (const item of queueItems) {
    const dateKey = item.date.toISOString();
    const currentIndex = indexByDate.get(dateKey) ?? 0;
    const itemCode = getQueueCode(item.id, currentIndex);
    indexByDate.set(dateKey, currentIndex + 1);

    if (itemCode === normalizedCode) {
      return {
        id: item.id,
        item: mapQueueItem(item, currentIndex),
      };
    }
  }

  return null;
};


export const updateQueueItemStatus = async (id: string, status: QueueItemStatus) => {
  const existingItem = await prisma.queueItem.findUnique({ where: { id } });

  if (!existingItem) {
    throw new Error("Queue item not found.");
  }

  const now = new Date();
  const customerCounterUpdate = getCustomerCounterUpdate(existingItem.status, status);
  const timestampData = {
    arrivedAt: status === QueueItemStatus.ARRIVED ? now : undefined,
    startedAt: status === QueueItemStatus.IN_PROGRESS ? now : undefined,
    completedAt: status === QueueItemStatus.DONE ? now : null,
    cancelledAt: status === QueueItemStatus.CANCELLED ? now : null,
    noShowAt: status === QueueItemStatus.NO_SHOW ? now : null,
  };

  return prisma.$transaction(async (tx) => {
    if (status === QueueItemStatus.IN_PROGRESS) {
      await tx.queueItem.updateMany({
        where: {
          date: existingItem.date,
          status: QueueItemStatus.IN_PROGRESS,
          id: { not: id },
        },
        data: {
          status: QueueItemStatus.WAITING,
        },
      });
    }

    if (existingItem.customerId && customerCounterUpdate) {
      await tx.customer.update({
        where: { id: existingItem.customerId },
        data: customerCounterUpdate,
      });
    }

    return tx.queueItem.update({
      where: { id },
      data: {
        status,
        ...timestampData,
      },
    });
  });
};

export const updateQueueItem = async (input: UpdateQueueItemInput) => {
  const existingItem = await prisma.queueItem.findUnique({ where: { id: input.id } });

  if (!existingItem) {
    throw new Error("Queue item not found.");
  }

  const service = await findService(input.serviceId);
  const { start } = getDayBounds(input.dateValue);
  const startAt = input.timeValue ? createDateTime(input.dateValue, input.timeValue) : null;
  const slotEnd = startAt ? addMinutes(startAt, service.durationMinutes) : null;

  if (startAt && slotEnd) {
    const { start: dayStart, end: dayEnd } = getDayBounds(input.dateValue);
    const [queueItems, timeBlocks] = await Promise.all([
      prisma.queueItem.findMany({
        where: {
          id: { not: input.id },
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
          startAt: { not: null },
          status: {
            notIn: activeQueueStatusExclusions,
          },
        },
        select: {
          startAt: true,
          serviceDurationMinutes: true,
        },
      }),
      prisma.timeBlock.findMany({
        where: {
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          startAt: true,
          endAt: true,
        },
      }),
    ]);

    const conflictsWithQueue = queueItems.some((item) => {
      if (!item.startAt) {
        return false;
      }

      return overlaps(startAt, slotEnd, item.startAt, addMinutes(item.startAt, item.serviceDurationMinutes));
    });
    const conflictsWithBlock = timeBlocks.some((block) => overlaps(startAt, slotEnd, block.startAt, block.endAt));

    if (conflictsWithQueue || conflictsWithBlock) {
      throw new Error("Queue item time conflicts.");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (existingItem.customerId) {
      await tx.customer.update({
        where: { id: existingItem.customerId },
        data: {
          name: input.customerName,
          phone: input.phone || null,
        },
      });
    }

    return tx.queueItem.update({
      where: { id: input.id },
      data: {
        customerNameSnapshot: input.customerName,
        phoneSnapshot: input.phone || null,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        serviceDurationMinutes: service.durationMinutes,
        date: start,
        startAt,
        estimatedAt: startAt ? null : (existingItem.estimatedAt ?? new Date()),
        note: input.note || null,
        ownerNote: input.ownerNote || null,
      },
    });
  });
};
