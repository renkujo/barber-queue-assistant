import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/security/rate-limit";

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
  it("allows requests up to the limit and blocks the next request", async () => {
    const policy = { limit: 2, windowMs: 60_000, blockMs: 60_000 };

    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(true);
    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(true);
    await expect(consumeRateLimit(scope, "same-client", policy)).resolves.toBe(false);
    await expect(consumeRateLimit(scope, "different-client", policy)).resolves.toBe(true);
  });
});
