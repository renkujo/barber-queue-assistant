"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { NotificationType } from "@/generated/prisma/enums";
import { clearLineEntryIdentity, getLineEntryIdentity } from "@/lib/line/line-entry-identity";
import { notifyQueueEventSafe } from "@/lib/notifications/queue-notifications";
import { optionalPhoneSchema } from "@/lib/queue/input-validation";
import { createWalkIn } from "@/lib/queue/repository";
import { actionRateLimitPolicies, consumeRequestRateLimit } from "@/lib/security/rate-limit";
import type { WalkInActionState } from "./walk-in-contract";

const walkInSchema = z.object({
  customerName: z.string().trim().min(1),
  phone: optionalPhoneSchema,
  lineUserId: z.string().trim().optional(),
  serviceId: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

export const createWalkInAction = async (_previousState: WalkInActionState, formData: FormData): Promise<WalkInActionState> => {
  const allowed = await consumeRequestRateLimit("public-walk-in", actionRateLimitPolicies.publicWalkIn).catch(() => false);

  if (!allowed) {
    return { error: "rate-limited" };
  }

  const lineUserId = await getLineEntryIdentity("walk-in");
  const parsed = walkInSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    lineUserId: lineUserId ?? "",
    serviceId: formData.get("serviceId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: "invalid" };
  }

  let queueItemId: string;
  let publicToken: string;

  try {
    const queueItem = await createWalkIn(parsed.data);
    queueItemId = queueItem.id;
    publicToken = queueItem.publicToken;
    await notifyQueueEventSafe(queueItemId, NotificationType.QUEUE_CREATED);
    await clearLineEntryIdentity("walk-in").catch(() => undefined);
  } catch (error) {
    if (error instanceof Error && (error.message === "Queue intake is closed." || error.message === "Walk-in is closed.")) {
      return { error: "closed" };
    }

    if (error instanceof Error && error.message === "Service is unavailable.") {
      return { error: "invalid" };
    }

    return { error: "database" };
  }

  redirect(`/queue/${publicToken}`);
};
