"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { NotificationType } from "@/generated/prisma/enums";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import { createWalkIn } from "@/lib/queue/repository";

const walkInSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  lineUserId: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const createWalkInAction = async (formData: FormData) => {
  const parsed = walkInSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    lineUserId: String(formData.get("lineUserId") ?? ""),
    serviceId: formData.get("serviceId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/walk-in?error=invalid");
  }

  let queueItemId: string;

  try {
    const queueItem = await createWalkIn(parsed.data);
    queueItemId = queueItem.id;
    await notifyQueueEventSafe(queueItemId, NotificationType.QUEUE_CREATED);
  } catch {
    redirect("/walk-in?error=database");
  }

  redirect(`/queue/${queueItemId}`);
};
