import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { bindLineUserId } from "@/lib/notifications/line-binding";

type LineWebhookEvent = {
  type?: string;
  source?: {
    userId?: string;
  };
};

const getLineChannelSecret = () => process.env.LINE_CHANNEL_SECRET?.trim() || null;

const isValidLineSignature = (body: string, signature: string | null) => {
  const channelSecret = getLineChannelSecret();

  if (!channelSecret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", channelSecret).update(body).digest("base64");
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

export const POST = async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!isValidLineSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid LINE signature" }, { status: 401 });
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody || "{}");
    } catch {
      return null;
    }
  })();

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const events = Array.isArray(body.events) ? body.events : [];
  const bindableEvents = events.filter((event: LineWebhookEvent) =>
    (event.type === "follow" || event.type === "message") && event.source?.userId,
  );

  await Promise.all(bindableEvents.map((event: LineWebhookEvent) => bindLineUserId(event.source?.userId ?? "")));

  return NextResponse.json({
    ok: true,
    received: Boolean(body),
    eventCount: events.length,
    boundUserCount: bindableEvents.length,
    note: "LINE OA webhook foundation is active. Event handling will be added after user binding/rich menu decisions.",
  });
};
