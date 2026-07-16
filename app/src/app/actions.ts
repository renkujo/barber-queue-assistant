"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getQueueItemByCodeAndPhone } from "@/lib/queue/repository";
import { actionRateLimitPolicies, consumeRequestRateLimit } from "@/lib/security/rate-limit";

const queueLookupSchema = z.object({
  queueCode: z.string().trim().min(1).max(16),
  phoneLast4: z.string().trim().regex(/^\d{4}$/),
});

export const lookupQueueAction = async (formData: FormData) => {
  const allowed = await consumeRequestRateLimit("queue-lookup", actionRateLimitPolicies.queueLookup).catch(() => false);

  if (!allowed) {
    redirect("/?error=queue-lookup-rate-limited");
  }

  const parsed = queueLookupSchema.safeParse({
    queueCode: formData.get("queueCode"),
    phoneLast4: formData.get("phoneLast4"),
  });

  if (!parsed.success) {
    redirect("/?error=queue-code-required");
  }

  const match = await getQueueItemByCodeAndPhone(parsed.data.queueCode, parsed.data.phoneLast4).catch(() => null);

  if (!match) {
    const queueCode = encodeURIComponent(parsed.data.queueCode);
    redirect(`/?error=queue-not-found&queueCode=${queueCode}`);
  }

  redirect(`/queue/${match.publicToken}`);
};
