"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { NotificationType, QueueItemStatus } from "@/generated/prisma/enums";
import { clearOwnerSession, requireOwnerSession, setOwnerSession, verifyPasscode } from "@/lib/admin-auth";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import {
  createBreakTimeBlock,
  createOwnerWalkIn,
  restoreClosedQueueItem,
  setQueueIntakeEnabled,
  updateQueueItem,
  updateQueueItemStatus,
} from "@/lib/queue/repository";

const allowedStatus = new Set<string>(Object.values(QueueItemStatus));

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
