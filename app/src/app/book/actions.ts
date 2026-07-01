"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { NotificationType } from "@/generated/prisma/enums";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import { createBooking } from "@/lib/queue/repository";

const bookingSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  lineUserId: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  dateValue: z.string().trim().min(1),
  timeValue: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const createBookingAction = async (formData: FormData) => {
  const parsed = bookingSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    lineUserId: String(formData.get("lineUserId") ?? ""),
    serviceId: formData.get("serviceId"),
    dateValue: formData.get("dateValue"),
    timeValue: formData.get("timeValue"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/book?error=invalid");
  }

  let queueItemId: string;

  try {
    const queueItem = await createBooking(parsed.data);
    queueItemId = queueItem.id;
    await notifyQueueEventSafe(queueItemId, NotificationType.BOOKING_CONFIRMED);
  } catch (error) {
    if (error instanceof Error && error.message === "Booking slot is not available.") {
      redirect("/book?error=slot-unavailable");
    }

    redirect("/book?error=database");
  }

  redirect(`/queue/${queueItemId}`);
};
