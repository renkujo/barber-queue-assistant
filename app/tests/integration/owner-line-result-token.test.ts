import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  bindOwnerLineUserId,
  createOwnerLineConnectToken,
  createOwnerLineResultToken,
  verifyOwnerLineConnectToken,
  verifyOwnerLineResultToken,
} from "@/lib/notifications/owner-line-binding";
import { prisma } from "@/lib/prisma";

describe("owner LINE completion result token", () => {
  const previousSecret = process.env.BARBER_ADMIN_SESSION_SECRET;
  const secret = "owner-line-result-test-secret";

  beforeAll(() => {
    process.env.BARBER_ADMIN_SESSION_SECRET = secret;
  });

  afterAll(() => {
    process.env.BARBER_ADMIN_SESSION_SECRET = previousSecret;
  });

  it.each(["connected", "invalid", "missing-line"] as const)("verifies signed %s results", (status) => {
    expect(verifyOwnerLineResultToken(createOwnerLineResultToken(status))).toBe(status);
  });

  it("rejects direct, modified and expired result claims", () => {
    const valid = createOwnerLineResultToken("connected");
    const tampered = `${valid.slice(0, -1)}${valid.endsWith("a") ? "b" : "a"}`;
    const expiredPayload = `connected.${Date.now() - 1}`;
    const expiredSignature = createHmac("sha256", secret).update(`owner-line-result:v1:${expiredPayload}`).digest("hex");

    expect(verifyOwnerLineResultToken("connected")).toBeNull();
    expect(verifyOwnerLineResultToken(tampered)).toBeNull();
    expect(verifyOwnerLineResultToken(`${expiredPayload}.${expiredSignature}`)).toBeNull();
  });

  it("consumes an owner connection token exactly once", async () => {
    const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });
    const token = await createOwnerLineConnectToken();
    const nonce = token.split(".")[0] ?? "";

    try {
      expect(verifyOwnerLineConnectToken(token)).toBe(true);
      await bindOwnerLineUserId("U-owner-one-use-test", token);
      await expect(bindOwnerLineUserId("U-owner-replay-test", token)).rejects.toThrow("already been used");
      const consumed = await prisma.ownerLineConnectToken.findUnique({ where: { nonce } });
      expect(consumed?.consumedAt).toBeInstanceOf(Date);
    } finally {
      if (settings) {
        await prisma.shopSettings.update({
          where: { id: settings.id },
          data: {
            lineOaEnabled: settings.lineOaEnabled,
            ownerLineUserId: settings.ownerLineUserId,
          },
        });
      }
      await prisma.ownerLineConnectToken.deleteMany({ where: { nonce } });
    }
  });
});
