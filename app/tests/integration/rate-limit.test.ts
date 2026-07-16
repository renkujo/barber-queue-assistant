import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getProxyClientAddress } from "@/lib/security/rate-limit";

const scope = "vitest-rate-limit";

const cleanup = () => prisma.rateLimitBucket.deleteMany({
  where: {
    key: {
      startsWith: `${scope}:`,
    },
  },
});

afterEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("rate limit", () => {
  it("uses the proxy-provided real IP or the rightmost forwarded address", () => {
    expect(getProxyClientAddress(new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.7, 192.0.2.9",
      "user-agent": "rotating-agent",
    }))).toBe("203.0.113.10");
    expect(getProxyClientAddress(new Headers({
      "x-forwarded-for": "198.51.100.7, 192.0.2.9",
      "user-agent": "another-agent",
    }))).toBe("192.0.2.9");
    expect(getProxyClientAddress(new Headers({ "user-agent": "no-address" }))).toBe("unknown");
  });

  it("allows requests up to the limit and blocks the next request", async () => {
    const policy = { limit: 2, windowMs: 60_000, blockMs: 60_000 };

    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(true);
    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(true);
    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(false);
    await expect(consumeRateLimit(scope, "different-client", policy)).resolves.toBe(true);
  });
});
