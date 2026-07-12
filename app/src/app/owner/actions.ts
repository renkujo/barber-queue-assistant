"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { NotificationType, QueueItemStatus } from "@/generated/prisma/enums";
import { clearOwnerSession, requireOwnerSession, setOwnerSession, verifyPasscode } from "@/lib/admin-auth";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import {
  applyOwnerWeeklyAvailabilityPreset,
  createBreakTimeBlock,
  createOwnerService,
  createOwnerWalkIn,
  reorderQueueItem,
  type QueueReorderIntent,
  restoreClosedQueueItem,
  setManualWaitMinutes,
  setOwnerServiceActive,
  setQueueIntakeEnabled,
  updateOwnerDateAvailability,
  updateOwnerWeeklyAvailability,
  updateOwnerService,
  updateOwnerShopSettings,
  updateQueueItem,
  updateQueueItemStatus,
} from "@/lib/queue/repository";

const allowedStatus = new Set<string>(Object.values(QueueItemStatus));
const allowedReorderIntent = new Set<QueueReorderIntent>(["up", "down", "bottom"]);
const allowedWaitAction = new Set(["add-10", "add-20", "reset"]);
const allowedAvailabilityMode = new Set(["default", "booking-and-walk-in", "in-store-only", "closed"]);

const notificationTypeByStatus: Partial<Record<QueueItemStatus, NotificationType>> = {
  [QueueItemStatus.IN_PROGRESS]: NotificationType.QUEUE_NEAR,
  [QueueItemStatus.LATE]: NotificationType.LATE,
  [QueueItemStatus.CANCELLED]: NotificationType.CANCELLED,
  [QueueItemStatus.NO_SHOW]: NotificationType.NO_SHOW,
};

const ownerWalkInSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

const queueItemEditSchema = z.object({
  queueItemId: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  dateValue: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeValue: z.string().trim().optional(),
  note: z.string().trim().optional(),
  ownerNote: z.string().trim().optional(),
});

const ownerSettingsSchema = z.object({
  shopName: z.string().trim().min(1),
  openTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  queueIntakeEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  bookingEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  walkInEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  manualWaitMinutes: z.string().trim().optional(),
});


const ownerDateAvailabilitySchema = z.object({
  dateValue: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.string().trim(),
  reason: z.string().trim().optional(),
});

const ownerWeeklyAvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  mode: z.string().trim(),
  reason: z.string().trim().optional(),
});

const serviceSettingsSchema = z.object({
  serviceId: z.string().trim().optional(),
  name: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  priceBaht: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const serviceActiveSchema = z.object({
  serviceId: z.string().trim().min(1),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const getOptionalPriceBaht = (value?: string) => {
  if (!value) {
    return null;
  }

  const priceBaht = Number(value);

  if (!Number.isFinite(priceBaht) || priceBaht < 0 || priceBaht > 100000) {
    throw new Error("Invalid service price.");
  }

  return priceBaht;
};

export const loginOwner = async (formData: FormData) => {
  const passcode = String(formData.get("passcode") ?? "");

  if (!verifyPasscode(passcode)) {
    redirect("/owner/login?error=invalid");
  }

  const sessionSet = await setOwnerSession();

  if (!sessionSet) {
    redirect("/owner/login?error=setup");
  }

  redirect("/owner");
};

export const logoutOwner = async () => {
  await clearOwnerSession();
  redirect("/owner/login");
};

export const updateQueueStatusAction = async (formData: FormData) => {
  await requireOwnerSession();

  const queueItemId = String(formData.get("queueItemId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!queueItemId || !allowedStatus.has(status)) {
    redirect("/owner?error=invalid-action");
  }

  try {
    await updateQueueItemStatus(queueItemId, status as QueueItemStatus);
    const notificationType = notificationTypeByStatus[status as QueueItemStatus];

    if (notificationType) {
      await notifyQueueEventSafe(queueItemId, notificationType);
    }
  } catch {
    redirect("/owner?error=action-failed");
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/api/queue/status");
  redirect("/owner?status=status-updated");
};

export const restoreQueueItemAction = async (formData: FormData) => {
  await requireOwnerSession();

  const queueItemId = String(formData.get("queueItemId") ?? "");

  if (!queueItemId) {
    redirect("/owner?error=invalid-action");
  }

  try {
    await restoreClosedQueueItem(queueItemId);
  } catch {
    redirect("/owner?error=restore-failed");
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath(`/queue/${queueItemId}`);
  revalidatePath("/api/queue/status");
  redirect("/owner?status=queue-restored");
};

export const updateQueueOrderAction = async (formData: FormData) => {
  await requireOwnerSession();

  const queueItemId = String(formData.get("queueItemId") ?? "");
  const intent = String(formData.get("intent") ?? "") as QueueReorderIntent;

  if (!queueItemId || !allowedReorderIntent.has(intent)) {
    redirect("/owner?error=invalid-action");
  }

  try {
    await reorderQueueItem(queueItemId, intent);
  } catch {
    redirect("/owner?error=reorder-failed");
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/api/queue/status");
  redirect("/owner?status=queue-reordered");
};

export const updateQueueItemAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = queueItemEditSchema.safeParse({
    queueItemId: formData.get("queueItemId"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    serviceId: formData.get("serviceId"),
    dateValue: formData.get("dateValue"),
    timeValue: formData.get("timeValue"),
    note: formData.get("note"),
    ownerNote: formData.get("ownerNote"),
  });

  if (!parsed.success) {
    redirect("/owner?error=invalid-action");
  }

  const timeValue = parsed.data.timeValue === "__none__" ? undefined : parsed.data.timeValue;
  const editPath = `/owner/queue/${parsed.data.queueItemId}/edit`;

  if (timeValue && !/^\d{2}:\d{2}$/.test(timeValue)) {
    redirect(`${editPath}?error=invalid`);
  }

  try {
    await updateQueueItem({
      id: parsed.data.queueItemId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      serviceId: parsed.data.serviceId,
      dateValue: parsed.data.dateValue,
      timeValue,
      note: parsed.data.note,
      ownerNote: parsed.data.ownerNote,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Queue item time conflicts.") {
      redirect(`${editPath}?error=time-conflict`);
    }

    if (error instanceof Error && error.message === "Queue item time is outside business hours.") {
      redirect(`${editPath}?error=time-outside-hours`);
    }

    redirect(`${editPath}?error=database`);
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath(`/queue/${parsed.data.queueItemId}`);
  revalidatePath("/api/queue/status");
  redirect("/owner?status=queue-updated");
};

export const createBreakAction = async () => {
  await requireOwnerSession();

  try {
    await createBreakTimeBlock(30);
  } catch {
    redirect("/owner?error=break-failed");
  }

  revalidatePath("/book");
  revalidatePath("/owner");
  redirect("/owner?status=break-created");
};

export const updateQueueIntakeAction = async (formData: FormData) => {
  await requireOwnerSession();

  const enabled = String(formData.get("enabled") ?? "") === "true";

  try {
    await setQueueIntakeEnabled(enabled);
  } catch {
    redirect("/owner?error=intake-failed");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner");
  revalidatePath("/api/queue/status");
  redirect(enabled ? "/owner?status=intake-opened" : "/owner?status=intake-closed");
};

export const updateManualWaitAction = async (formData: FormData) => {
  await requireOwnerSession();

  const intent = String(formData.get("intent") ?? "");
  const currentWaitMinutes = Number(formData.get("currentWaitMinutes") ?? 0);

  if (!allowedWaitAction.has(intent) || !Number.isInteger(currentWaitMinutes) || currentWaitMinutes < 0) {
    redirect("/owner?error=invalid-action");
  }

  const nextWaitMinutes = intent === "reset" ? null : Math.min(currentWaitMinutes + (intent === "add-20" ? 20 : 10), 240);

  try {
    await setManualWaitMinutes(nextWaitMinutes);
  } catch {
    redirect("/owner?error=wait-failed");
  }

  revalidatePath("/");
  revalidatePath("/walk-in");
  revalidatePath("/owner");
  revalidatePath("/api/queue/status");
  redirect(nextWaitMinutes === null ? "/owner?status=wait-reset" : "/owner?status=wait-updated");
};

export const updateOwnerSettingsAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = ownerSettingsSchema.safeParse({
    shopName: formData.get("shopName"),
    openTime: formData.get("openTime"),
    closeTime: formData.get("closeTime"),
    queueIntakeEnabled: formData.get("queueIntakeEnabled"),
    bookingEnabled: formData.get("bookingEnabled"),
    walkInEnabled: formData.get("walkInEnabled"),
    manualWaitMinutes: formData.get("manualWaitMinutes"),
  });

  if (!parsed.success) {
    redirect("/owner/settings?error=invalid");
  }

  const manualWaitText = parsed.data.manualWaitMinutes ?? "";
  const manualWaitMinutes = manualWaitText ? Number(manualWaitText) : null;

  if (manualWaitMinutes !== null && (!Number.isInteger(manualWaitMinutes) || manualWaitMinutes < 0 || manualWaitMinutes > 240)) {
    redirect("/owner/settings?error=invalid-wait");
  }

  try {
    await updateOwnerShopSettings({
      shopName: parsed.data.shopName,
      openTime: parsed.data.openTime,
      closeTime: parsed.data.closeTime,
      queueIntakeEnabled: parsed.data.queueIntakeEnabled,
      bookingEnabled: parsed.data.bookingEnabled,
      walkInEnabled: parsed.data.walkInEnabled,
      manualWaitMinutes,
    });
  } catch {
    redirect("/owner/settings?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner");
  revalidatePath("/owner/settings");
  revalidatePath("/api/queue/status");
  redirect("/owner/settings?status=settings-updated");
};

export const updateOwnerWeeklyAvailabilityAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = ownerWeeklyAvailabilitySchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    mode: formData.get("mode"),
    reason: formData.get("reason"),
  });

  if (!parsed.success || !allowedAvailabilityMode.has(parsed.data.mode)) {
    redirect("/owner/settings/availability?error=invalid");
  }

  try {
    await updateOwnerWeeklyAvailability({
      dayOfWeek: parsed.data.dayOfWeek,
      mode: parsed.data.mode as "default" | "booking-and-walk-in" | "in-store-only" | "closed",
      reason: parsed.data.reason,
    });
  } catch {
    redirect("/owner/settings/availability?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner/settings/availability");
  revalidatePath("/api/queue/status");
  redirect("/owner/settings/availability?status=weekly-availability-updated");
};

export const applyOwnerWeeklyAvailabilityPresetAction = async () => {
  await requireOwnerSession();

  try {
    await applyOwnerWeeklyAvailabilityPreset();
  } catch {
    redirect("/owner/settings/availability?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner/settings/availability");
  revalidatePath("/api/queue/status");
  redirect("/owner/settings/availability?status=weekly-preset-applied");
};


export const updateOwnerDateAvailabilityAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = ownerDateAvailabilitySchema.safeParse({
    dateValue: formData.get("dateValue"),
    mode: formData.get("mode"),
    reason: formData.get("reason"),
  });

  if (!parsed.success || !allowedAvailabilityMode.has(parsed.data.mode)) {
    redirect("/owner/settings/availability?error=invalid");
  }

  try {
    await updateOwnerDateAvailability({
      dateValue: parsed.data.dateValue,
      mode: parsed.data.mode as "default" | "booking-and-walk-in" | "in-store-only" | "closed",
      reason: parsed.data.reason,
    });
  } catch {
    redirect("/owner/settings/availability?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner");
  revalidatePath("/owner/settings");
  revalidatePath("/owner/settings/availability");
  revalidatePath("/api/queue/status");
  redirect("/owner/settings/availability?status=availability-updated");
};

export const createOwnerServiceAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = serviceSettingsSchema.safeParse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    priceBaht: formData.get("priceBaht"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect("/owner/settings/services?error=invalid");
  }

  try {
    await createOwnerService({
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      priceBaht: getOptionalPriceBaht(parsed.data.priceBaht),
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
  } catch {
    redirect("/owner/settings/services?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner/walk-in");
  revalidatePath("/owner/settings/services");
  redirect("/owner/settings/services?status=service-created");
};

export const updateOwnerServiceAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = serviceSettingsSchema.safeParse({
    serviceId: formData.get("serviceId"),
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    priceBaht: formData.get("priceBaht"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success || !parsed.data.serviceId) {
    redirect("/owner/settings/services?error=invalid");
  }

  try {
    await updateOwnerService({
      id: parsed.data.serviceId,
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      priceBaht: getOptionalPriceBaht(parsed.data.priceBaht),
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
  } catch {
    redirect("/owner/settings/services?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner/walk-in");
  revalidatePath("/owner/settings/services");
  redirect("/owner/settings/services?status=service-updated");
};

export const toggleOwnerServiceAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = serviceActiveSchema.safeParse({
    serviceId: formData.get("serviceId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect("/owner/settings/services?error=invalid");
  }

  try {
    await setOwnerServiceActive(parsed.data.serviceId, parsed.data.isActive);
  } catch {
    redirect("/owner/settings/services?error=database");
  }

  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/walk-in");
  revalidatePath("/owner/walk-in");
  revalidatePath("/owner/settings/services");
  redirect(parsed.data.isActive ? "/owner/settings/services?status=service-restored" : "/owner/settings/services?status=service-disabled");
};


export const createOwnerWalkInAction = async (formData: FormData) => {
  await requireOwnerSession();

  const parsed = ownerWalkInSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    serviceId: formData.get("serviceId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/owner/walk-in?error=invalid");
  }

  try {
    const queueItem = await createOwnerWalkIn(parsed.data);
    await notifyQueueEventSafe(queueItem.id, NotificationType.QUEUE_CREATED);
  } catch {
    redirect("/owner/walk-in?error=database");
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/api/queue/status");
  redirect("/owner?status=walk-in-created");
};
