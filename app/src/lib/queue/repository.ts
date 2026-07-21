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
import { getQueueAccessPin } from "@/lib/queue/access-pin";
import { getQueueCode } from "@/lib/queue/code";
import { createDateTime, formatThaiTime, getDayBounds, getTodayValue, toDateValue } from "./date";

export type QueueService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};

export type OwnerServiceSettingsItem = QueueService & {
  isActive: boolean;
  priceCents: number | null;
  priceBaht: string;
  sortOrder: number;
};

export type UpsertOwnerServiceInput = {
  id?: string;
  name: string;
  durationMinutes: number;
  priceBaht?: number | null;
  sortOrder: number;
  isActive: boolean;
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
  scheduleWarning?: string;
};

export type OwnerQueueListItem = QueueListItem & {
  accessPin: string;
  ownerNote: string;
  publicToken: string;
};

export type QueueStatusSnapshot = {
  shop: typeof shopStatus & {
    manualWaitMinutes: number | null;
    waitEstimateSource: "computed" | "manual";
    isOpenNow: boolean;
  };
  queue: QueueListItem[];
  source: "database" | "fallback";
};

export type PublicQueueStatusSnapshot = {
  shop: QueueStatusSnapshot["shop"];
  source: QueueStatusSnapshot["source"];
};

export type PublicQueueTrackingItem = Omit<QueueListItem, "id" | "note"> & {
  accessPin: string;
};

export type ShopIntakeSettings = {
  source: "database" | "fallback";
  shopName: string;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  bookingAvailable: boolean;
  walkInAvailable: boolean;
  inStoreOnly: boolean;
  isOpenNow: boolean;
  openLabel: string;
};

export type OwnerShopSettings = {
  shopName: string;
  openTime: string;
  closeTime: string;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  manualWaitMinutes: number | null;
  ownerLineUserId: string | null;
};

export type DateAvailabilityMode = "default" | "booking-and-walk-in" | "in-store-only" | "closed";

export type OwnerDateAvailabilityItem = {
  dateValue: string;
  label: string;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  inStoreOnly: boolean;
  mode: DateAvailabilityMode;
  reason: string;
  hasOverride: boolean;
};

export type OwnerWeeklyAvailabilityItem = {
  dayOfWeek: number;
  label: string;
  shortLabel: string;
  mode: DateAvailabilityMode;
  reason: string;
  hasOverride: boolean;
};

export type UpdateOwnerDateAvailabilityInput = {
  dateValue: string;
  mode: DateAvailabilityMode;
  reason?: string;
};

export type UpdateOwnerWeeklyAvailabilityInput = {
  dayOfWeek: number;
  mode: DateAvailabilityMode;
  reason?: string;
};

export type CustomerDateAvailability = {
  bookingEnabled: boolean;
  onlineWalkInEnabled: boolean;
  inStoreOnly: boolean;
};

export type UpdateOwnerShopSettingsInput = Omit<OwnerShopSettings, "ownerLineUserId">;

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

export type QueueReorderIntent = "up" | "down" | "bottom";

export type BookingSlot = {
  value: string;
  label: string;
  available: boolean;
};

const defaultShopSettingsInput = {
  id: "default-shop",
  shopName: "ร้านช่างหนึ่ง",
  openDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  businessHours: { open: "09:00", close: "19:00" },
} as const;

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

const activeQueueStatusExclusions: QueueItemStatus[] = [QueueItemStatus.CANCELLED, QueueItemStatus.DONE, QueueItemStatus.NO_SHOW];
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

const priceBahtToCents = (priceBaht?: number | null) => {
  if (priceBaht === undefined || priceBaht === null || priceBaht <= 0) {
    return null;
  }

  return Math.round(priceBaht * 100);
};

const centsToBahtInput = (priceCents?: number | null) => {
  if (!priceCents) {
    return "";
  }

  return `${Math.round(priceCents / 100)}`;
};

const mapOwnerServiceSettingsItem = (service: {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
  isActive: boolean;
  sortOrder: number;
}): OwnerServiceSettingsItem => ({
  id: service.id,
  name: service.name,
  durationMinutes: service.durationMinutes,
  priceCents: service.priceCents,
  priceBaht: centsToBahtInput(service.priceCents),
  priceLabel: getPriceLabel(service.priceCents),
  isActive: service.isActive,
  sortOrder: service.sortOrder,
});

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const toTimeValue = (date: Date) => {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${hour}:${minute}`;
};

const parseTimeMinutes = (timeValue: string) => {
  const [hour = "0", minute = "0"] = timeValue.split(":");

  return Number(hour) * 60 + Number(minute);
};

const minutesToTimeValue = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
};

const getBookingTimesForBusinessHours = (businessHours: { open: string; close: string }, durationMinutes: number) => {
  const openMinutes = parseTimeMinutes(businessHours.open);
  const closeMinutes = parseTimeMinutes(businessHours.close);

  if (!Number.isFinite(openMinutes) || !Number.isFinite(closeMinutes) || durationMinutes <= 0 || closeMinutes <= openMinutes) {
    return [];
  }

  const times: string[] = [];

  for (let cursor = openMinutes; cursor + durationMinutes <= closeMinutes; cursor += durationMinutes) {
    times.push(minutesToTimeValue(cursor));
  }

  return times;
};

export const getDefaultBookingTimes = () => getBookingTimesForBusinessHours(defaultShopSettingsInput.businessHours, fallbackServices[0]?.durationMinutes ?? 30);

const getBangkokTimeMinutes = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return (hour % 24) * 60 + minute;
};

const getIsOpenNow = (businessHours: { open: string; close: string }, now = new Date()) => {
  const openMinutes = parseTimeMinutes(businessHours.open);
  const closeMinutes = parseTimeMinutes(businessHours.close);
  const nowMinutes = getBangkokTimeMinutes(now);

  if (!Number.isFinite(openMinutes) || !Number.isFinite(closeMinutes) || closeMinutes <= openMinutes) {
    return false;
  }

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
};

const getOpenLabel = (businessHours: { open: string; close: string }) => `เปิด ${businessHours.open} - ${businessHours.close} น.`;

const addDaysToDateValue = (dateValue: string, days: number) => {
  const { start } = getDayBounds(dateValue);
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + days);

  return toDateValue(nextDate);
};

const formatOwnerDateAvailabilityLabel = (dateValue: string, index: number) => {
  if (index === 0) {
    return "วันนี้";
  }

  if (index === 1) {
    return "พรุ่งนี้";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(getDayBounds(dateValue).start);
};

const weeklyAvailabilityDays = [
  { dayOfWeek: 1, label: "วันจันทร์", shortLabel: "จ." },
  { dayOfWeek: 2, label: "วันอังคาร", shortLabel: "อ." },
  { dayOfWeek: 3, label: "วันพุธ", shortLabel: "พ." },
  { dayOfWeek: 4, label: "วันพฤหัสบดี", shortLabel: "พฤ." },
  { dayOfWeek: 5, label: "วันศุกร์", shortLabel: "ศ." },
  { dayOfWeek: 6, label: "วันเสาร์", shortLabel: "ส." },
  { dayOfWeek: 7, label: "วันอาทิตย์", shortLabel: "อา." },
] as const;

const getIsoDayOfWeek = (dateValue: string) => {
  const dayOfWeek = new Date(`${dateValue}T12:00:00+07:00`).getUTCDay();

  return dayOfWeek === 0 ? 7 : dayOfWeek;
};

const getDateAvailabilityBooleans = (mode: Exclude<DateAvailabilityMode, "default">) => {
  if (mode === "closed") {
    return { bookingEnabled: false, walkInEnabled: false, inStoreOnly: false };
  }

  if (mode === "in-store-only") {
    return { bookingEnabled: false, walkInEnabled: false, inStoreOnly: true };
  }

  return { bookingEnabled: true, walkInEnabled: true, inStoreOnly: false };
};

const getDateAvailabilityMode = (availability?: { bookingEnabled: boolean; walkInEnabled: boolean; inStoreOnly: boolean } | null): Exclude<DateAvailabilityMode, "default"> => {
  if (availability?.inStoreOnly) {
    return "in-store-only";
  }

  if (!availability?.bookingEnabled && !availability?.walkInEnabled) {
    return "closed";
  }

  return "booking-and-walk-in";
};

const getResolvedDateAvailability = async (dateValue: string) => {
  const { start } = getDayBounds(dateValue);
  const [dateRule, weeklyRule] = await Promise.all([
    prisma.shopDateAvailability.findUnique({ where: { date: start } }),
    prisma.shopWeeklyAvailability.findUnique({ where: { dayOfWeek: getIsoDayOfWeek(dateValue) } }),
  ]);
  const rule = dateRule ?? weeklyRule;

  return {
    bookingEnabled: rule?.bookingEnabled ?? true,
    walkInEnabled: rule?.walkInEnabled ?? true,
    inStoreOnly: rule?.inStoreOnly ?? false,
    reason: rule?.reason ?? "",
    hasOverride: Boolean(dateRule),
  };
};

const getIsTimeWindowInsideBusinessHours = (timeValue: string, durationMinutes: number, businessHours: { open: string; close: string }) => {
  const openMinutes = parseTimeMinutes(businessHours.open);
  const closeMinutes = parseTimeMinutes(businessHours.close);
  const startMinutes = parseTimeMinutes(timeValue);
  const endMinutes = startMinutes + durationMinutes;

  if (!Number.isFinite(openMinutes) || !Number.isFinite(closeMinutes) || !Number.isFinite(startMinutes) || closeMinutes <= openMinutes) {
    return false;
  }

  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
};

const overlaps = (leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) => leftStart < rightEnd && leftEnd > rightStart;

type QueueTimelineItem = {
  startAt: Date | null;
  estimatedAt: Date | null;
  startedAt?: Date | null;
  serviceDurationMinutes: number;
  status: QueueItemStatus;
};

type FixedTimelineBlock = {
  startAt: Date;
  endAt: Date;
};

const getQueueTimelineSource = (item: QueueTimelineItem) => {
  if (item.status === QueueItemStatus.IN_PROGRESS) {
    return item.startedAt ?? item.startAt ?? item.estimatedAt;
  }

  return item.startAt;
};

const findEarliestOpenSlot = (cursor: Date, durationMinutes: number, fixedBlocks: FixedTimelineBlock[]) => {
  let candidateStart = cursor;

  for (const block of fixedBlocks) {
    const candidateEnd = addMinutes(candidateStart, durationMinutes);

    if (candidateEnd <= block.startAt) {
      break;
    }

    if (overlaps(candidateStart, candidateEnd, block.startAt, block.endAt) || candidateStart < block.endAt) {
      candidateStart = block.endAt;
    }
  }

  return candidateStart;
};

type QueueTimelineClient = Pick<typeof prisma, "queueItem" | "timeBlock">;

const getEstimatedWalkInStart = async (
  dateValue: string,
  durationMinutes: number,
  now = new Date(),
  database: QueueTimelineClient = prisma,
) => {
  const { start, end } = getDayBounds(dateValue);
  const [queueItems, timeBlocks] = await Promise.all([
    database.queueItem.findMany({
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
      select: {
        startAt: true,
        estimatedAt: true,
        startedAt: true,
        serviceDurationMinutes: true,
        status: true,
      },
    }),
    database.timeBlock.findMany({
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

  const fixedBlocks = [
    ...queueItems.flatMap((item) => {
      const fixedStart = getQueueTimelineSource(item);

      if (!fixedStart) {
        return [];
      }

      return [{ startAt: fixedStart, endAt: addMinutes(fixedStart, item.serviceDurationMinutes) }];
    }),
    ...timeBlocks,
  ]
    .filter((block) => block.endAt > now)
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  const flexibleItems = queueItems.filter((item) => !getQueueTimelineSource(item));
  let cursor = now;

  for (const item of flexibleItems) {
    const slotStart = findEarliestOpenSlot(cursor, item.serviceDurationMinutes, fixedBlocks);
    cursor = addMinutes(slotStart, item.serviceDurationMinutes);
  }

  return findEarliestOpenSlot(cursor, durationMinutes, fixedBlocks);
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
    code: getQueueCode(item.id),
    customerName: item.customerNameSnapshot,
    serviceName: item.serviceNameSnapshot,
    status: item.status,
    timeLabel: timeSource ? formatThaiTime(timeSource) : "รอ",
    statusLabel: statusLabels[item.status] ?? item.status,
    note: item.note ?? item.serviceNameSnapshot,
    tone: getTone(item.status, index),
  };
};

const maskCustomerName = (customerName: string) => {
  const graphemes = Array.from(
    new Intl.Segmenter("th", { granularity: "grapheme" }).segment(customerName.trim()),
    (part) => part.segment,
  );

  if (!graphemes.length) {
    return "ลูกค้า";
  }

  if (graphemes.length === 1) {
    return "***";
  }

  const visibleCount = Math.min(2, graphemes.length - 1);
  const visibleName = graphemes.slice(0, visibleCount).join("");

  return `${visibleName}***`;
};

const mapPublicQueueItem = (
  item: Parameters<typeof mapQueueItem>[0] & { publicToken: string },
  index: number,
): PublicQueueTrackingItem => {
  const mapped = mapQueueItem(item, index);

  return {
    accessPin: getQueueAccessPin(item.publicToken),
    code: mapped.code,
    customerName: maskCustomerName(mapped.customerName),
    serviceName: mapped.serviceName,
    status: mapped.status,
    timeLabel: mapped.timeLabel,
    statusLabel: mapped.statusLabel,
    tone: mapped.tone,
  };
};

const mapOwnerQueueItem = (
  item: Parameters<typeof mapQueueItem>[0] & { ownerNote: string | null; publicToken: string },
  index: number,
  scheduleWarning?: string,
): OwnerQueueListItem => ({
  ...mapQueueItem(item, index),
  accessPin: getQueueAccessPin(item.publicToken),
  ownerNote: item.ownerNote ?? "",
  publicToken: item.publicToken,
  scheduleWarning,
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

const getWalkInScheduleWarning = (
  item: {
    id: string;
    type: QueueItemType;
    estimatedAt: Date | null;
    createdAt: Date;
  },
  queueItems: Array<{
    id: string;
    type: QueueItemType;
    startAt: Date | null;
    serviceDurationMinutes: number;
  }>,
  timeBlocks: Array<{
    startAt: Date;
    endAt: Date;
    reason: string | null;
  }>,
) => {
  if (item.type !== QueueItemType.WALK_IN || !item.estimatedAt) {
    return undefined;
  }

  const estimatedAt = item.estimatedAt;

  const fixedSources = [
    ...queueItems.flatMap((queueItem) => {
      if (queueItem.id === item.id || queueItem.type !== QueueItemType.BOOKING || !queueItem.startAt) {
        return [];
      }

      return [{ type: "booking" as const, startAt: queueItem.startAt, endAt: addMinutes(queueItem.startAt, queueItem.serviceDurationMinutes) }];
    }),
    ...timeBlocks.map((block) => ({ type: "block" as const, startAt: block.startAt, endAt: block.endAt, reason: block.reason })),
  ]
    .filter((source) => source.endAt > item.createdAt && source.startAt < estimatedAt && source.endAt <= estimatedAt)
    .sort((left, right) => right.endAt.getTime() - left.endAt.getTime());

  const source = fixedSources[0];

  if (!source) {
    return undefined;
  }

  if (source.type === "booking") {
    return `มีคิวจองคั่นอยู่ ระบบวางคิวนี้หลังคิวจอง ${formatThaiTime(source.startAt)}`;
  }

  return `มีช่วงพัก/บล็อกคิวคั่นอยู่ ระบบวางคิวนี้หลัง ${formatThaiTime(source.endAt)}`;
};

const mapShopIntakeSettings = (settings: {
  shopName: string;
  businessHours: unknown;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
}, dateAvailability: { bookingEnabled: boolean; walkInEnabled: boolean; inStoreOnly: boolean } = { bookingEnabled: true, walkInEnabled: true, inStoreOnly: false }): ShopIntakeSettings => {
  const businessHours = getBusinessHours(settings.businessHours);
  const isOpenNow = getIsOpenNow(businessHours);

  return {
    source: "database",
    shopName: settings.shopName,
    queueIntakeEnabled: settings.queueIntakeEnabled,
    bookingEnabled: settings.bookingEnabled,
    walkInEnabled: settings.walkInEnabled,
    bookingAvailable: settings.queueIntakeEnabled && settings.bookingEnabled && dateAvailability.bookingEnabled,
    walkInAvailable: settings.queueIntakeEnabled && settings.walkInEnabled && dateAvailability.walkInEnabled && isOpenNow,
    inStoreOnly: dateAvailability.inStoreOnly,
    isOpenNow,
    openLabel: getOpenLabel(businessHours),
  };
};

const getBusinessHours = (businessHours: unknown) => {
  if (businessHours && typeof businessHours === "object" && "open" in businessHours && "close" in businessHours) {
    return {
      open: String((businessHours as { open?: unknown }).open ?? defaultShopSettingsInput.businessHours.open),
      close: String((businessHours as { close?: unknown }).close ?? defaultShopSettingsInput.businessHours.close),
    };
  }

  return defaultShopSettingsInput.businessHours;
};

const mapOwnerShopSettings = (settings: {
  shopName: string;
  businessHours: unknown;
  queueIntakeEnabled: boolean;
  bookingEnabled: boolean;
  walkInEnabled: boolean;
  manualWaitMinutes: number | null;
  ownerLineUserId: string | null;
}): OwnerShopSettings => {
  const businessHours = getBusinessHours(settings.businessHours);

  return {
    shopName: settings.shopName,
    openTime: businessHours.open,
    closeTime: businessHours.close,
    queueIntakeEnabled: settings.queueIntakeEnabled,
    bookingEnabled: settings.bookingEnabled,
    walkInEnabled: settings.walkInEnabled,
    manualWaitMinutes: settings.manualWaitMinutes,
    ownerLineUserId: settings.ownerLineUserId,
  };
};

const getOrCreateShopSettings = async () => {
  const existingSettings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.shopSettings.create({
    data: defaultShopSettingsInput,
  });
};

const assertPublicQueueIntakeOpen = async (mode: "booking" | "walk-in") => {
  const settings = await getShopIntakeSettings();

  if (!settings.queueIntakeEnabled) {
    throw new Error("Queue intake is closed.");
  }

  if (mode === "booking" && !settings.bookingEnabled) {
    throw new Error("Booking is closed.");
  }

  if (mode === "walk-in" && !settings.walkInAvailable) {
    throw new Error("Walk-in is closed.");
  }
};

export const getShopIntakeSettings = async (dateValue = getTodayValue()): Promise<ShopIntakeSettings> => {
  const [settings, dateAvailability] = await Promise.all([
    getOrCreateShopSettings(),
    getResolvedDateAvailability(dateValue),
  ]);

  return mapShopIntakeSettings(settings, dateAvailability);
};

export const getCustomerDateAvailability = async (dateValue: string): Promise<CustomerDateAvailability> => {
  const [settings, dateAvailability] = await Promise.all([
    getOrCreateShopSettings(),
    getResolvedDateAvailability(dateValue),
  ]);

  return {
    bookingEnabled: settings.queueIntakeEnabled && settings.bookingEnabled && dateAvailability.bookingEnabled,
    onlineWalkInEnabled: settings.queueIntakeEnabled && settings.walkInEnabled && dateAvailability.walkInEnabled,
    inStoreOnly: dateAvailability.inStoreOnly,
  };
};

export const getCustomerDateAvailabilitySafe = async (dateValue: string): Promise<CustomerDateAvailability> => {
  try {
    return await getCustomerDateAvailability(dateValue);
  } catch {
    return {
      bookingEnabled: false,
      onlineWalkInEnabled: false,
      inStoreOnly: false,
    };
  }
};

export const getShopIntakeSettingsSafe = async (): Promise<ShopIntakeSettings> => {
  try {
    return await getShopIntakeSettings();
  } catch {
    return {
      source: "fallback",
      shopName: shopStatus.shopName,
      queueIntakeEnabled: false,
      bookingEnabled: false,
      walkInEnabled: false,
      bookingAvailable: false,
      walkInAvailable: false,
      inStoreOnly: false,
      isOpenNow: false,
      openLabel: shopStatus.openLabel,
    };
  }
};

export const setQueueIntakeEnabled = async (enabled: boolean): Promise<ShopIntakeSettings> => {
  const settings = await getOrCreateShopSettings();
  const updatedSettings = await prisma.shopSettings.update({
    where: { id: settings.id },
    data: { queueIntakeEnabled: enabled },
  });

  return mapShopIntakeSettings(updatedSettings, await getResolvedDateAvailability(getTodayValue()));
};

export const setManualWaitMinutes = async (minutes: number | null) => {
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 240)) {
    throw new Error("Invalid manual wait minutes.");
  }

  const settings = await getOrCreateShopSettings();

  return prisma.shopSettings.update({
    where: { id: settings.id },
    data: { manualWaitMinutes: minutes },
  });
};

export const getOwnerShopSettings = async (): Promise<OwnerShopSettings> => {
  const settings = await getOrCreateShopSettings();

  return mapOwnerShopSettings(settings);
};

export const getOwnerShopSettingsSafe = async (): Promise<OwnerShopSettings> => {
  try {
    return await getOwnerShopSettings();
  } catch {
    return {
      shopName: shopStatus.shopName,
      openTime: defaultShopSettingsInput.businessHours.open,
      closeTime: defaultShopSettingsInput.businessHours.close,
      queueIntakeEnabled: true,
      bookingEnabled: true,
      walkInEnabled: true,
      manualWaitMinutes: null,
      ownerLineUserId: null,
    };
  }
};

export const updateOwnerShopSettings = async (input: UpdateOwnerShopSettingsInput): Promise<OwnerShopSettings> => {
  const settings = await getOrCreateShopSettings();
  const updatedSettings = await prisma.shopSettings.update({
    where: { id: settings.id },
    data: {
      shopName: input.shopName,
      businessHours: {
        open: input.openTime,
        close: input.closeTime,
      },
      queueIntakeEnabled: input.queueIntakeEnabled,
      bookingEnabled: input.bookingEnabled,
      walkInEnabled: input.walkInEnabled,
      manualWaitMinutes: input.manualWaitMinutes,
    },
  });

  return mapOwnerShopSettings(updatedSettings);
};

export const getOwnerWeeklyAvailabilityItems = async (): Promise<OwnerWeeklyAvailabilityItem[]> => {
  const rules = await prisma.shopWeeklyAvailability.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  const ruleByDay = new Map(rules.map((rule) => [rule.dayOfWeek, rule]));

  return weeklyAvailabilityDays.map((day) => {
    const rule = ruleByDay.get(day.dayOfWeek);

    return {
      ...day,
      mode: rule ? getDateAvailabilityMode(rule) : "default",
      reason: rule?.reason ?? "",
      hasOverride: Boolean(rule),
    };
  });
};

export const getOwnerWeeklyAvailabilityItemsSafe = async (): Promise<OwnerWeeklyAvailabilityItem[]> => {
  try {
    return await getOwnerWeeklyAvailabilityItems();
  } catch {
    return weeklyAvailabilityDays.map((day) => ({
      ...day,
      mode: "default",
      reason: "",
      hasOverride: false,
    }));
  }
};

export const updateOwnerWeeklyAvailability = async (input: UpdateOwnerWeeklyAvailabilityInput) => {
  if (!Number.isInteger(input.dayOfWeek) || input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    throw new Error("Invalid weekly availability day.");
  }

  if (input.mode === "default") {
    await prisma.shopWeeklyAvailability.deleteMany({ where: { dayOfWeek: input.dayOfWeek } });
    return null;
  }

  const availability = getDateAvailabilityBooleans(input.mode);
  const reason = input.reason?.trim() || null;

  return prisma.shopWeeklyAvailability.upsert({
    where: { dayOfWeek: input.dayOfWeek },
    update: {
      ...availability,
      reason,
    },
    create: {
      dayOfWeek: input.dayOfWeek,
      ...availability,
      reason,
    },
  });
};

export const applyOwnerWeeklyAvailabilityPreset = async () => {
  await prisma.$transaction(
    weeklyAvailabilityDays.map((day) => {
      const mode = day.dayOfWeek <= 5 ? "booking-and-walk-in" : "in-store-only";
      const availability = getDateAvailabilityBooleans(mode);

      return prisma.shopWeeklyAvailability.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        update: {
          ...availability,
          reason: null,
        },
        create: {
          dayOfWeek: day.dayOfWeek,
          ...availability,
          reason: null,
        },
      });
    }),
  );
};

export const getOwnerDateAvailabilityItems = async (days = 14): Promise<OwnerDateAvailabilityItem[]> => {
  const startDateValue = getTodayValue();
  const dateValues = Array.from({ length: days }, (_, index) => addDaysToDateValue(startDateValue, index));
  const bounds = dateValues.map((dateValue) => getDayBounds(dateValue).start);
  const rules = await prisma.shopDateAvailability.findMany({
    where: {
      date: {
        in: bounds,
      },
    },
  });
  const ruleByDateValue = new Map(rules.map((rule) => [toDateValue(rule.date), rule]));

  return dateValues.map((dateValue, index) => {
    const rule = ruleByDateValue.get(dateValue);
    const availability = rule
      ? { bookingEnabled: rule.bookingEnabled, walkInEnabled: rule.walkInEnabled, inStoreOnly: rule.inStoreOnly }
      : { bookingEnabled: true, walkInEnabled: true, inStoreOnly: false };

    return {
      dateValue,
      label: formatOwnerDateAvailabilityLabel(dateValue, index),
      bookingEnabled: availability.bookingEnabled,
      walkInEnabled: availability.walkInEnabled,
      inStoreOnly: availability.inStoreOnly,
      mode: rule ? getDateAvailabilityMode(availability) : "default",
      reason: rule?.reason ?? "",
      hasOverride: Boolean(rule),
    };
  });
};

export const getOwnerDateAvailabilityItemsSafe = async () => {
  try {
    return await getOwnerDateAvailabilityItems();
  } catch {
    const startDateValue = getTodayValue();

    return Array.from({ length: 7 }, (_, index) => ({
      dateValue: addDaysToDateValue(startDateValue, index),
      label: formatOwnerDateAvailabilityLabel(addDaysToDateValue(startDateValue, index), index),
      bookingEnabled: true,
      walkInEnabled: true,
      inStoreOnly: false,
      mode: "default" as DateAvailabilityMode,
      reason: "",
      hasOverride: false,
    }));
  }
};

export const updateOwnerDateAvailability = async (input: UpdateOwnerDateAvailabilityInput) => {
  const { start } = getDayBounds(input.dateValue);
  const reason = input.reason?.trim() || null;

  if (input.mode === "default") {
    await prisma.shopDateAvailability.deleteMany({ where: { date: start } });
    return null;
  }

  const availability = getDateAvailabilityBooleans(input.mode);

  return prisma.shopDateAvailability.upsert({
    where: { date: start },
    update: {
      ...availability,
      reason,
    },
    create: {
      date: start,
      ...availability,
      reason,
    },
  });
};

export const getFallbackStatusSnapshot = (): QueueStatusSnapshot => ({
  shop: { ...shopStatus, manualWaitMinutes: null, waitEstimateSource: "computed", isOpenNow: true },
  queue: todayQueue.map((item, index) => ({ id: `fallback-${index}`, status: item.statusLabel, ...item })),
  source: "fallback",
});

export const getServices = async (): Promise<QueueService[]> => {
  const [activeServices, serviceCount] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.service.count(),
  ]);

  if (!serviceCount) {
    return fallbackServices;
  }

  return activeServices.map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    priceLabel: getPriceLabel(service.priceCents),
  }));
};

export const getServicesWithSourceSafe = async () => {
  try {
    return { services: await getServices(), source: "database" as const };
  } catch {
    return { services: fallbackServices, source: "fallback" as const };
  }
};

export const getServicesSafe = async () => (await getServicesWithSourceSafe()).services;

export const getOwnerServiceSettings = async (): Promise<OwnerServiceSettingsItem[]> => {
  const [services, serviceCount] = await Promise.all([
    prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.service.count(),
  ]);

  if (!serviceCount) {
    await ensureDefaultServices();
    const seededServices = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return seededServices.map(mapOwnerServiceSettingsItem);
  }

  return services.map(mapOwnerServiceSettingsItem);
};

export const getOwnerServiceSettingsSafe = async () => {
  try {
    return await getOwnerServiceSettings();
  } catch {
    return fallbackServices.map((service, index) => ({
      ...service,
      isActive: true,
      priceCents: priceLabelToCents(service.priceLabel),
      priceBaht: centsToBahtInput(priceLabelToCents(service.priceLabel)),
      sortOrder: index,
    }));
  }
};

export const createOwnerService = async (input: UpsertOwnerServiceInput) =>
  prisma.service.create({
    data: {
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: priceBahtToCents(input.priceBaht),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });

export const updateOwnerService = async (input: UpsertOwnerServiceInput & { id: string }) =>
  prisma.service.update({
    where: { id: input.id },
    data: {
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: priceBahtToCents(input.priceBaht),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });

export const setOwnerServiceActive = async (id: string, isActive: boolean) =>
  prisma.service.update({
    where: { id },
    data: { isActive },
  });

export const getQueueStatusSnapshot = async (dateValue = getTodayValue()): Promise<QueueStatusSnapshot> => {
  const { start, end } = getDayBounds(dateValue);
  const [queueItems, settings] = await Promise.all([
    prisma.queueItem.findMany({
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
    }),
    getOrCreateShopSettings(),
  ]);
  const computedWaitMinutes = queueItems.reduce((total, item) => total + item.serviceDurationMinutes, 0);
  const manualWaitMinutes = settings.manualWaitMinutes;
  const businessHours = getBusinessHours(settings.businessHours);

  return {
    shop: {
      ...shopStatus,
      shopName: settings.shopName,
      openLabel: getOpenLabel(businessHours),
      isOpenNow: getIsOpenNow(businessHours),
      currentQueueCount: queueItems.length,
      estimatedWaitMinutes: manualWaitMinutes ?? computedWaitMinutes,
      manualWaitMinutes,
      waitEstimateSource: manualWaitMinutes === null ? "computed" : "manual",
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

export const getPublicQueueStatusSnapshotSafe = async (): Promise<PublicQueueStatusSnapshot> => {
  const snapshot = await getQueueStatusSnapshotSafe();

  return {
    shop: snapshot.shop,
    source: snapshot.source,
  };
};

export const getOwnerQueueStatusSnapshot = async (dateValue = getTodayValue()) => {
  const snapshot = await getQueueStatusSnapshot(dateValue);

  if (snapshot.source !== "database") {
    return snapshot;
  }

  const { start, end } = getDayBounds(dateValue);
  const [queueItems, timeBlocks] = await Promise.all([
    prisma.queueItem.findMany({
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
        reason: true,
      },
    }),
  ]);

  return {
    ...snapshot,
    queue: queueItems.map((item, index) => mapOwnerQueueItem(item, index, getWalkInScheduleWarning(item, queueItems, timeBlocks))),
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

export const reorderQueueItem = async (id: string, intent: QueueReorderIntent) => {
  const existingItem = await prisma.queueItem.findUnique({ where: { id } });

  if (!existingItem) {
    throw new Error("Queue item not found.");
  }

  if (existingItem.status === QueueItemStatus.IN_PROGRESS || activeQueueStatusExclusions.includes(existingItem.status)) {
    throw new Error("Queue item cannot be reordered.");
  }

  const { start, end } = getDayBounds(toDateValue(existingItem.date));

  return prisma.$transaction(async (tx) => {
    const queueItems = await tx.queueItem.findMany({
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
      select: { id: true },
    });
    const currentIndex = queueItems.findIndex((item) => item.id === id);

    if (currentIndex === -1) {
      throw new Error("Queue item cannot be reordered.");
    }

    const reorderedItems = [...queueItems];

    if (intent === "up" && currentIndex > 0) {
      [reorderedItems[currentIndex - 1], reorderedItems[currentIndex]] = [reorderedItems[currentIndex], reorderedItems[currentIndex - 1]];
    }

    if (intent === "down" && currentIndex < reorderedItems.length - 1) {
      [reorderedItems[currentIndex], reorderedItems[currentIndex + 1]] = [reorderedItems[currentIndex + 1], reorderedItems[currentIndex]];
    }

    if (intent === "bottom" && currentIndex < reorderedItems.length - 1) {
      const [selectedItem] = reorderedItems.splice(currentIndex, 1);
      reorderedItems.push(selectedItem);
    }

    await Promise.all(
      reorderedItems.map((item, index) =>
        tx.queueItem.update({
          where: { id: item.id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    return tx.queueItem.findUniqueOrThrow({ where: { id } });
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
  const [settings, dateAvailability] = await Promise.all([
    getOrCreateShopSettings(),
    getResolvedDateAvailability(dateValue),
  ]);
  const businessHours = getBusinessHours(settings.businessHours);
  const bookingTimes = getBookingTimesForBusinessHours(businessHours, durationMinutes);

  if (!settings.queueIntakeEnabled || !settings.bookingEnabled || !dateAvailability.bookingEnabled) {
    return bookingTimes.map((time) => ({ value: time, label: time, available: false }));
  }

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

  return bookingTimes.map((time) => {
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
    return getDefaultBookingTimes().map((time) => ({ value: time, label: time, available: false }));
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

const getQueueItemWithIndexByPublicToken = async (publicToken: string) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(publicToken)) {
    return null;
  }

  const item = await prisma.queueItem.findUnique({ where: { publicToken } });

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

type QueueWriteClient = Pick<typeof prisma, "customer" | "queueItem" | "service" | "timeBlock">;

const findOrCreateCustomer = async (
  input: { name: string; phone?: string; lineUserId?: string },
  database: QueueWriteClient = prisma,
) => {
  const lineUserId = input.lineUserId?.trim() || undefined;

  if (lineUserId) {
    const existingLineCustomer = await database.customer.findUnique({ where: { lineUserId } });

    if (existingLineCustomer) {
      return database.customer.update({
        where: { id: existingLineCustomer.id },
        data: {
          name: input.name,
          phone: input.phone || existingLineCustomer.phone,
        },
      });
    }
  }

  if (input.phone) {
    const existingCustomer = await database.customer.findFirst({ where: { phone: input.phone } });

    if (existingCustomer) {
      if (lineUserId && !existingCustomer.lineUserId) {
        return database.customer.update({
          where: { id: existingCustomer.id },
          data: { lineUserId },
        });
      }

      return existingCustomer;
    }
  }

  return database.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      lineUserId,
      totalBookings: 1,
    },
  });
};

const findService = async (serviceId: string, database: QueueWriteClient = prisma) => {
  const service = await database.service.findUnique({ where: { id: serviceId } });

  if (service) {
    return service;
  }

  const fallback = fallbackServices.find((item) => item.id === serviceId) ?? fallbackServices[0];

  return database.service.create({
    data: {
      id: fallback.id,
      name: fallback.name,
      durationMinutes: fallback.durationMinutes,
      priceCents: priceLabelToCents(fallback.priceLabel),
      sortOrder: fallbackServices.findIndex((item) => item.id === fallback.id),
    },
  });
};

const findActiveService = async (serviceId: string, database: QueueWriteClient = prisma) => {
  const service = await database.service.findFirst({
    where: {
      id: serviceId,
      isActive: true,
    },
  });

  if (!service) {
    throw new Error("Service is unavailable.");
  }

  return service;
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
  await assertPublicQueueIntakeOpen("booking");

  const service = await findActiveService(input.serviceId);
  const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId });
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
      phoneSnapshot: input.phone || null,
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
  await assertPublicQueueIntakeOpen("walk-in");

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('bqa:walk-in-estimate'))`;
    const service = await findActiveService(input.serviceId, transaction);
    const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId }, transaction);
    const todayValue = getTodayValue();
    const { start } = getDayBounds(todayValue);
    const estimatedAt = await getEstimatedWalkInStart(todayValue, service.durationMinutes, new Date(), transaction);

    return transaction.queueItem.create({
      data: {
        type: QueueItemType.WALK_IN,
        status: QueueItemStatus.WAITING,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        phoneSnapshot: input.phone || null,
        lineUserIdSnapshot: customer.lineUserId,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        serviceDurationMinutes: service.durationMinutes,
        date: start,
        estimatedAt,
        note: input.note,
        createdBy: QueueCreatedBy.CUSTOMER,
      },
    });
  });
};


export const createOwnerWalkIn = async (input: CreateOwnerWalkInInput) => {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('bqa:walk-in-estimate'))`;
    const customer = await findOrCreateCustomer({ name: input.customerName, phone: input.phone, lineUserId: input.lineUserId }, transaction);
    const service = await findService(input.serviceId, transaction);
    const todayValue = getTodayValue();
    const { start } = getDayBounds(todayValue);
    const estimatedAt = await getEstimatedWalkInStart(todayValue, service.durationMinutes, new Date(), transaction);

    return transaction.queueItem.create({
      data: {
        type: QueueItemType.WALK_IN,
        status: QueueItemStatus.WAITING,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        phoneSnapshot: input.phone || null,
        lineUserIdSnapshot: customer.lineUserId,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        serviceDurationMinutes: service.durationMinutes,
        date: start,
        estimatedAt,
        note: input.note,
        createdBy: QueueCreatedBy.OWNER,
      },
    });
  });
};

export const getPublicQueueItemByToken = async (publicToken: string) => {
  const result = await getQueueItemWithIndexByPublicToken(publicToken);

  if (!result) {
    return null;
  }

  return mapPublicQueueItem(result.item, result.index);
};

export const getQueueItemEditDetails = async (id: string): Promise<QueueItemEditDetails | null> => {
  const result = await getQueueItemWithIndex(id);

  if (!result) {
    return null;
  }

  const { item } = result;
  const timeSource = item.startAt ?? null;

  return {
    id: item.id,
    code: getQueueCode(item.id),
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

export const getQueueItemByCodeAndAccessPin = async (code: string, accessPin: string) => {
  const rawCode = code.trim();
  const normalizedCode = rawCode.replace(/[\s-]/g, "").toUpperCase();
  const normalizedAccessPin = accessPin.replace(/\D/g, "");

  if (!normalizedCode || normalizedAccessPin.length !== 4) {
    return null;
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

  for (const item of queueItems) {
    const itemCode = getQueueCode(item.id);
    const accessPinMatches = getQueueAccessPin(item.publicToken) === normalizedAccessPin;

    if (itemCode === normalizedCode && accessPinMatches) {
      return {
        publicToken: item.publicToken,
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
  const existingDateValue = toDateValue(existingItem.date);
  const existingTimeValue = existingItem.startAt ? toTimeValue(existingItem.startAt) : null;
  const isKeepingExistingLockedTime = Boolean(input.timeValue && existingTimeValue && input.dateValue === existingDateValue && input.timeValue === existingTimeValue);

  if (startAt && slotEnd) {
    const settings = await getOrCreateShopSettings();
    const businessHours = getBusinessHours(settings.businessHours);

    if (!isKeepingExistingLockedTime && !getIsTimeWindowInsideBusinessHours(input.timeValue ?? "", service.durationMinutes, businessHours)) {
      throw new Error("Queue item time is outside business hours.");
    }

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
