import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/line/webhook/route";
import { prisma } from "@/lib/prisma";

const testSecret = "vitest-line-secret";
const testLineUserId = "UVIWEBHOOKROUTE";

const signBody = (body: string, secret = testSecret) => createHmac("sha256", secret).update(body).digest("base64");

const createRequest = (body: string, signature?: string) =>
  new Request("http://localhost:3000/api/line/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature ? { "x-line-signature": signature } : {}),
    },
    body,
  });

afterEach(async () => {
  delete process.env.LINE_CHANNEL_SECRET;
  await prisma.customer.deleteMany({
    where: {
      lineUserId: testLineUserId,
      queueItems: { none: {} },
    },
  });
});

describe("LINE webhook route", () => {
  it("accepts a valid signature and binds source user ids from follow events", async () => {
    process.env.LINE_CHANNEL_SECRET = testSecret;
    const body = JSON.stringify({
      events: [
        {
          type: "follow",
          source: {
            userId: testLineUserId,
          },
        },
      ],
    });

    const response = await POST(createRequest(body, signBody(body)));
    const payload = await response.json();
    const customer = await prisma.customer.findUnique({ where: { lineUserId: testLineUserId } });

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, eventCount: 1, boundUserCount: 1 });
    expect(customer?.name).toContain("LINE user");
  });

  it("rejects invalid signatures when LINE_CHANNEL_SECRET is configured", async () => {
    process.env.LINE_CHANNEL_SECRET = testSecret;
    const body = JSON.stringify({ events: [] });

    const response = await POST(createRequest(body, "invalid-signature"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ ok: false, error: "Invalid LINE signature" });
  });

  it("returns 400 for invalid JSON after signature validation", async () => {
    process.env.LINE_CHANNEL_SECRET = testSecret;
    const body = "not-json";

    const response = await POST(createRequest(body, signBody(body)));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ ok: false, error: "Invalid JSON body" });
  });
});
