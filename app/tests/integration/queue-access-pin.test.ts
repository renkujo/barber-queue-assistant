import { describe, expect, it } from "vitest";
import { getQueueAccessPin } from "@/lib/queue/access-pin";

describe("queue access PIN", () => {
  it("derives a stable four-digit PIN from a public token", () => {
    expect(getQueueAccessPin("00000000-0000-4000-8000-000000000001")).toBe("3502");
    expect(getQueueAccessPin("550E8400-E29B-41D4-A716-446655440000")).toBe("7762");
  });

  it("normalizes token casing and surrounding whitespace", () => {
    const token = "550e8400-e29b-41d4-a716-446655440000";

    expect(getQueueAccessPin(`  ${token.toUpperCase()}  `)).toBe(getQueueAccessPin(token));
  });

  it("returns an empty PIN for an empty token", () => {
    expect(getQueueAccessPin("   ")).toBe("");
  });
});
