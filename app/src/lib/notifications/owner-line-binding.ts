import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const ownerLineConnectTokenTtlMs = 10 * 60 * 1000;

const getSigningSecret = () => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("BARBER_ADMIN_SESSION_SECRET is required for owner LINE binding.");
  }

  return secret;
};

const signTokenPayload = (payload: string) => createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

export const createOwnerLineConnectToken = () => {
  const expiresAt = Date.now() + ownerLineConnectTokenTtlMs;
  const payload = String(expiresAt);
  const signature = signTokenPayload(payload);

  return `${payload}.${signature}`;
};

export const verifyOwnerLineConnectToken = (token: string) => {
  const [expiresAtText, signature] = token.split(".");

  if (!expiresAtText || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtText);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedSignature = signTokenPayload(expiresAtText);
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
};

export const bindOwnerLineUserId = async (lineUserId: string, token: string) => {
  const normalizedLineUserId = lineUserId.trim();

  if (!normalizedLineUserId || !verifyOwnerLineConnectToken(token)) {
    throw new Error("Invalid owner LINE binding token.");
  }

  const settings = await prisma.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });

  if (settings) {
    return prisma.shopSettings.update({
      where: { id: settings.id },
      data: {
        ownerLineUserId: normalizedLineUserId,
        lineOaEnabled: true,
      },
    });
  }

  return prisma.shopSettings.create({
    data: {
      shopName: "ร้านช่างหนึ่ง",
      openDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      businessHours: { open: "09:00", close: "19:00" },
      ownerLineUserId: normalizedLineUserId,
      lineOaEnabled: true,
    },
  });
};
