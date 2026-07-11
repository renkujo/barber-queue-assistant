import { NotificationType, QueueItemStatus } from "@/generated/prisma/enums";
import { formatThaiTime, toDateValue } from "@/lib/queue/date";

export type QueueNotificationContext = {
  customerName: string;
  queueCode: string;
  serviceName: string;
  statusLabel: string;
  date: Date;
  timeLabel: string;
};

const formatDateLabel = (date: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);

const customerStatusCopy: Record<string, string> = {
  [QueueItemStatus.CONFIRMED]: "จองสำเร็จแล้ว",
  [QueueItemStatus.ARRIVED]: "ร้านบันทึกว่าคุณมาถึงแล้ว",
  [QueueItemStatus.WAITING]: "รอเรียกคิว",
  [QueueItemStatus.LATE]: "เลยเวลาคิวแล้ว",
  [QueueItemStatus.IN_PROGRESS]: "ถึงคิวแล้ว / กำลังให้บริการ",
  [QueueItemStatus.DONE]: "ใช้บริการเสร็จแล้ว",
  [QueueItemStatus.CANCELLED]: "คิวถูกยกเลิกแล้ว",
  [QueueItemStatus.NO_SHOW]: "คิวนี้ถูกปิดแล้ว",
  "ยืนยันแล้ว": "จองสำเร็จแล้ว",
  "มาถึงแล้ว": "ร้านบันทึกว่าคุณมาถึงแล้ว",
  "รออยู่": "รอเรียกคิว",
  "มาสาย": "เลยเวลาคิวแล้ว",
  "กำลังตัด": "ถึงคิวแล้ว / กำลังให้บริการ",
  "เสร็จแล้ว": "ใช้บริการเสร็จแล้ว",
  "ยกเลิก": "คิวถูกยกเลิกแล้ว",
  "ไม่มา": "คิวนี้ถูกปิดแล้ว",
};

const getCustomerStatusCopy = (statusLabel: string) => customerStatusCopy[statusLabel] ?? statusLabel;

export const buildQueueNotificationMessage = (type: NotificationType, context: QueueNotificationContext) => {
  const appointmentLabel = `${formatDateLabel(context.date)} ${context.timeLabel}`;

  if (type === NotificationType.BOOKING_CONFIRMED) {
    return `ยืนยันคิว ${context.queueCode}\n${context.customerName} · ${context.serviceName}\nเวลา ${appointmentLabel}`;
  }

  if (type === NotificationType.QUEUE_CREATED) {
    return `รับคิวแล้ว ${context.queueCode}\n${context.customerName} · ${context.serviceName}\nตอนนี้คิวของคุณ: ${getCustomerStatusCopy(context.statusLabel)}`;
  }

  if (type === NotificationType.QUEUE_NEAR) {
    return `ถึงคิวของคุณแล้ว ${context.queueCode}\nกรุณาเตรียมเข้ารับบริการ ${context.serviceName}`;
  }

  if (type === NotificationType.LATE) {
    return `คิว ${context.queueCode} ถูกทำเครื่องหมายว่ามาสาย\nถ้ายังจะมา แนะนำติดต่อร้านโดยตรง`;
  }

  if (type === NotificationType.CANCELLED) {
    return `คิว ${context.queueCode} ถูกยกเลิกแล้ว\nหากต้องการรับบริการ กรุณาจองหรือรับคิวใหม่`;
  }

  if (type === NotificationType.NO_SHOW) {
    return `คิว ${context.queueCode} ถูกปิดเป็นไม่มา\nหากต้องการรับบริการ กรุณารับคิวใหม่หรือติดต่อร้าน`;
  }

  return `อัปเดตคิว ${context.queueCode}\n${context.customerName} · ${context.serviceName}\nตอนนี้คิวของคุณ: ${getCustomerStatusCopy(context.statusLabel)}`;
};

export const getQueueTimeLabel = (startAt: Date | null, estimatedAt: Date | null, date: Date) => {
  const timeSource = startAt ?? estimatedAt;

  if (timeSource) {
    return formatThaiTime(timeSource);
  }

  return toDateValue(date);
};
