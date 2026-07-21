import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createLineEntryIdentityCookieValue,
  readLineEntryIdentityCookieValue,
} from "@/lib/line/line-entry-identity";

describe("purpose-bound LINE entry identity", () => {
  const previousSecret = process.env.BARBER_ADMIN_SESSION_SECRET;

  beforeAll(() => {
    process.env.BARBER_ADMIN_SESSION_SECRET = "line-entry-test-secret";
  });

  afterAll(() => {
    process.env.BARBER_ADMIN_SESSION_SECRET = previousSecret;
  });

  it("accepts a valid cookie only for its signed purpose", () => {
    const cookie = createLineEntryIdentityCookieValue("U-purpose-test", "owner");

    expect(readLineEntryIdentityCookieValue(cookie, "owner")).toBe("U-purpose-test");
    expect(readLineEntryIdentityCookieValue(cookie, "book")).toBeNull();
    expect(readLineEntryIdentityCookieValue(cookie, "walk-in")).toBeNull();
  });

  it("rejects modified, expired and malformed cookies", () => {
    const cookie = createLineEntryIdentityCookieValue("U-purpose-test", "walk-in");
    const expired = createLineEntryIdentityCookieValue("U-purpose-test", "walk-in", Date.now() - 1);
    const tampered = `${cookie.slice(0, -1)}${cookie.endsWith("a") ? "b" : "a"}`;

    expect(readLineEntryIdentityCookieValue(tampered, "walk-in")).toBeNull();
    expect(readLineEntryIdentityCookieValue(expired, "walk-in")).toBeNull();
    expect(readLineEntryIdentityCookieValue("malformed", "walk-in")).toBeNull();
  });
});
