import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const ownerLineConnectTokenTtlMs = 10 * 60 * 1000;
const ownerLineResultTokenTtlMs = 2 * 60 * 1000;

export type OwnerLineResultStatus = "connected" | "invalid" | "missing-line";

const getSigningSecret = () => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("BARBER_ADMIN_SESSION_SECRET is required for owner LINE binding.");
  }

  return secret;
};

const signTokenPayload = (payload: string) => createHmac("sha256", getSigningSecret()).update(`owner-line-connect:v2:${payload}`).digest("hex");
const signResultPayload = (payload: string) => createHmac("sha256", getSigningSecret()).update(`owner-line-result:v1:${payload}`).digest("hex");

const parseOwnerLineConnectToken = (token: string) => {
  const [nonce, expiresAtText, signature, ...rest] = token.split(".");

  if (rest.length || !nonce || !expiresAtText || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const payload = `${nonce}.${expiresAtText}`;
  const expected = Buffer.from(signTokenPayload(payload), "hex");
  const received = Buffer.from(signature, "hex");

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  return { nonce, expiresAt: new Date(expiresAt) };
};

export const createOwnerLineConnectToken = async () => {
  const expiresAt = new Date(Date.now() + ownerLineConnectTokenTtlMs);
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${nonce}.${expiresAt.getTime()}`;
  const signature = signTokenPayload(payload);

  await prisma.ownerLineConnectToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { consumedAt: { not: null }, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  await prisma.ownerLineConnectToken.create({
    data: { nonce, expiresAt },
  });

  return `${payload}.${signature}`;
};

export const verifyOwnerLineConnectToken = (token: string) => Boolean(parseOwnerLineConnectToken(token));

export const createOwnerLineResultToken = (status: OwnerLineResultStatus) => {
  const payload = `${status}.${Date.now() + ownerLineResultTokenTtlMs}`;
  return `${payload}.${signResultPayload(payload)}`;
};

export const verifyOwnerLineResultToken = (token: string): OwnerLineResultStatus | null => {
  const [status, expiresAtText, signature, ...rest] = token.split(".");

  if (rest.length || (status !== "connected" && status !== "invalid" && status !== "missing-line") || !expiresAtText || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const payload = `${status}.${expiresAtText}`;
  const expected = Buffer.from(signResultPayload(payload), "hex");
  const received = Buffer.from(signature, "hex");

  if (expected.length !== received.length) {
    return null;
  }

  return timingSafeEqual(expected, received) ? status : null;
};

export const bindOwnerLineUserId = async (lineUserId: string, token: string) => {
  const normalizedLineUserId = lineUserId.trim();
  const parsedToken = parseOwnerLineConnectToken(token);

  if (!normalizedLineUserId || !parsedToken) {
    throw new Error("Invalid owner LINE binding token.");
  }

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.ownerLineConnectToken.updateMany({
      where: {
        nonce: parsedToken.nonce,
        expiresAt: { gte: new Date() },
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    if (claimed.count !== 1) {
      throw new Error("Owner LINE binding token has already been used.");
    }

    const settings = await transaction.shopSettings.findFirst({ orderBy: { createdAt: "asc" } });

    if (settings) {
      return transaction.shopSettings.update({
        where: { id: settings.id },
        data: {
          ownerLineUserId: normalizedLineUserId,
          lineOaEnabled: true,
        },
      });
    }

    return transaction.shopSettings.create({
      data: {
        shopName: "ร้านช่างหนึ่ง",
        openDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        businessHours: { open: "09:00", close: "19:00" },
        ownerLineUserId: normalizedLineUserId,
        lineOaEnabled: true,
      },
    });
  });
};
