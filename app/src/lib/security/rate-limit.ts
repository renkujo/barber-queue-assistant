import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
  blockMs: number;
};

export const actionRateLimitPolicies = {
  ownerLogin: { limit: 10, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 },
  queueLookup: { limit: 12, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 },
  publicBooking: { limit: 8, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 },
  publicWalkIn: { limit: 8, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 },
} satisfies Record<string, RateLimitPolicy>;

const getFingerprintSecret = () =>
  process.env.RATE_LIMIT_HASH_SECRET ??
  process.env.BARBER_ADMIN_SESSION_SECRET ??
  "barber-queue-local-rate-limit";

const hashFingerprint = (value: string) =>
  createHmac("sha256", getFingerprintSecret()).update(value).digest("hex");

export const getRequestFingerprint = async () => {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || requestHeaders.get("x-real-ip")?.trim() || "unknown";
  const userAgent = requestHeaders.get("user-agent")?.trim() || "unknown";

  return hashFingerprint(`${ip}|${userAgent}`);
};

const consumeRateLimitOnce = async (
  scope: string,
  fingerprint: string,
  policy: RateLimitPolicy,
) => {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - policy.windowMs);
  const nextBlockedUntil = new Date(now.getTime() + policy.blockMs);
  const key = `${scope}:${hashFingerprint(fingerprint)}`;

  return prisma.$transaction(
    async (tx) => {
      const bucket = await tx.rateLimitBucket.upsert({
        where: { key },
        create: {
          key,
          count: 0,
          windowStartedAt: now,
        },
        update: {},
      });

      if (bucket.blockedUntil && bucket.blockedUntil > now) {
        return false;
      }

      const windowExpired = bucket.windowStartedAt <= windowCutoff;
      const nextCount = windowExpired ? 1 : bucket.count + 1;
      const blockedUntil = nextCount > policy.limit ? nextBlockedUntil : null;

      await tx.rateLimitBucket.update({
        where: { key },
        data: {
          count: nextCount,
          windowStartedAt: windowExpired ? now : bucket.windowStartedAt,
          blockedUntil,
        },
      });

      return blockedUntil === null;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const consumeRateLimit = async (
  scope: string,
  fingerprint: string,
  policy: RateLimitPolicy,
) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await consumeRateLimitOnce(scope, fingerprint, policy);
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034");

      if (!retryable || attempt === 2) {
        throw error;
      }
    }
  }

  return false;
};

export const consumeRequestRateLimit = async (
  scope: string,
  policy: RateLimitPolicy,
) => consumeRateLimit(scope, await getRequestFingerprint(), policy);
