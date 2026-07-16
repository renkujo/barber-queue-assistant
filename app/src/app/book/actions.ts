"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { NotificationType } from "@/generated/prisma/enums";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import { createBooking } from "@/lib/queue/repository";
import { actionRateLimitPolicies, consumeRequestRateLimit } from "@/lib/security/rate-limit";

const bookingSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(8).max(20).regex(/^[0-9+\-\s]+$/),
  lineUserId: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  dateValue: z.string().trim().min(1),
  timeValue: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const createBookingAction = async (formData: FormData) => {
  const allowed = await consumeRequestRateLimit("public-booking", actionRateLimitPolicies.publicBooking).catch(() => false);

  if (!allowed) {
    redirect("/book?error=rate-limited");
  }

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
  let publicToken: string;

  try {
    const queueItem = await createBooking(parsed.data);
    queueItemId = queueItem.id;
    publicToken = queueItem.publicToken;
    await notifyQueueEventSafe(queueItemId, NotificationType.BOOKING_CONFIRMED);
  } catch (error) {
    if (error instanceof Error && (error.message === "Queue intake is closed." || error.message === "Booking is closed.")) {
      redirect("/book?error=closed");
    }

    if (error instanceof Error && error.message === "Booking slot is not available.") {
      redirect("/book?error=slot-unavailable");
    }

    redirect("/book?error=database");
  }

  redirect(`/queue/${publicToken}`);
};
