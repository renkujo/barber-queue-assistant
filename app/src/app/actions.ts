"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getQueueItemByCodeAndAccessPin } from "@/lib/queue/repository";
import { actionRateLimitPolicies, consumeRateLimit, consumeRequestRateLimit } from "@/lib/security/rate-limit";

const queueLookupSchema = z.object({
  queueCode: z.string().trim().min(1).max(16),
  accessPin: z.string().trim().regex(/^\d{4}$/),
});

export const lookupQueueAction = async (formData: FormData) => {
  const ipAllowed = await consumeRequestRateLimit("queue-lookup-ip", actionRateLimitPolicies.queueLookupIp).catch(() => false);

  if (!ipAllowed) {
    redirect("/?error=queue-lookup-rate-limited");
  }

  const parsed = queueLookupSchema.safeParse({
    queueCode: formData.get("queueCode"),
    accessPin: formData.get("accessPin"),
  });

  if (!parsed.success) {
    redirect("/?error=queue-code-required");
  }

  const normalizedQueueCode = parsed.data.queueCode.replace(/[\s-]/g, "").toUpperCase();
  const codeAllowed = await consumeRateLimit("queue-lookup-code", normalizedQueueCode, actionRateLimitPolicies.queueLookupCode).catch(() => false);

  if (!codeAllowed) {
    redirect("/?error=queue-lookup-rate-limited");
  }

  const match = await getQueueItemByCodeAndAccessPin(parsed.data.queueCode, parsed.data.accessPin).catch(() => null);

  if (!match) {
    const queueCode = encodeURIComponent(parsed.data.queueCode);
    redirect(`/?error=queue-not-found&queueCode=${queueCode}`);
  }

  redirect(`/queue/${match.publicToken}`);
};
