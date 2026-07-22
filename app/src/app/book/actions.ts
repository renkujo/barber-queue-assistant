"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { NotificationType } from "@/generated/prisma/enums";
import { clearLineEntryIdentity, getLineEntryIdentity } from "@/lib/line/line-entry-identity";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import { parseQueueEntrySource } from "@/lib/pilot/entry-source";
import { optionalPhoneSchema } from "@/lib/queue/input-validation";
import { createBooking } from "@/lib/queue/repository";
import { actionRateLimitPolicies, consumeRequestRateLimit } from "@/lib/security/rate-limit";
import type { BookingActionState } from "./booking-contract";

const bookingSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: optionalPhoneSchema,
  lineUserId: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  dateValue: z.string().trim().min(1),
  timeValue: z.string().trim().min(1),
  note: z.string().trim().optional(),
  operationId: z.string().uuid().optional(),
  entrySource: z.string().trim().optional(),
});

export const createBookingAction = async (_previousState: BookingActionState, formData: FormData): Promise<BookingActionState> => {
  const allowed = await consumeRequestRateLimit("public-booking", actionRateLimitPolicies.publicBooking).catch(() => false);

  if (!allowed) {
    return { error: "rate-limited" };
  }

  const lineUserId = await getLineEntryIdentity("book");
  const parsed = bookingSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    lineUserId: lineUserId ?? "",
    serviceId: formData.get("serviceId"),
    dateValue: formData.get("dateValue"),
    timeValue: formData.get("timeValue"),
    note: formData.get("note"),
    operationId: formData.get("operationId") || undefined,
    entrySource: formData.get("entrySource"),
  });

  if (!parsed.success) {
    return { error: "invalid" };
  }

  let queueItemId: string;
  let publicToken: string;

  try {
    const queueItem = await createBooking({ ...parsed.data, entrySource: parseQueueEntrySource(parsed.data.entrySource) });
    queueItemId = queueItem.id;
    publicToken = queueItem.publicToken;
    await notifyQueueEventSafe(queueItemId, NotificationType.BOOKING_CONFIRMED, { operationId: queueItem.pilotOperationId });
    await clearLineEntryIdentity("book").catch(() => undefined);
  } catch (error) {
    if (error instanceof Error && (error.message === "Queue intake is closed." || error.message === "Booking is closed.")) {
      return { error: "closed" };
    }

    if (error instanceof Error && error.message === "Booking slot is not available.") {
      return { error: "slot-unavailable" };
    }

    if (error instanceof Error && error.message === "Service is unavailable.") {
      return { error: "invalid" };
    }

    return { error: "database" };
  }

  redirect(`/queue/${publicToken}`);
};
