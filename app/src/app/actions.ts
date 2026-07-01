"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getQueueItemByCode } from "@/lib/queue/repository";

const queueLookupSchema = z.object({
  queueCode: z.string().trim().min(1),
});

export const lookupQueueAction = async (formData: FormData) => {
  const parsed = queueLookupSchema.safeParse({
    queueCode: formData.get("queueCode"),
  });

  if (!parsed.success) {
    redirect("/?error=queue-code-required");
  }

  const match = await getQueueItemByCode(parsed.data.queueCode).catch(() => null);

  if (!match) {
    const queueCode = encodeURIComponent(parsed.data.queueCode);
    redirect(`/?error=queue-not-found&queueCode=${queueCode}`);
  }

  redirect(`/queue/${match.id}`);
};
