import { afterEach, describe, expect, it } from "vitest";
import { isAdminConfigured, verifyPasscode } from "@/lib/admin-auth";

describe("owner auth configuration", () => {
  const originalPasscode = process.env.BARBER_ADMIN_PASSCODE;
  const originalSessionSecret = process.env.BARBER_ADMIN_SESSION_SECRET;

  afterEach(() => {
    if (originalPasscode === undefined) {
      delete process.env.BARBER_ADMIN_PASSCODE;
    } else {
      process.env.BARBER_ADMIN_PASSCODE = originalPasscode;
    }

    if (originalSessionSecret === undefined) {
      delete process.env.BARBER_ADMIN_SESSION_SECRET;
    } else {
      process.env.BARBER_ADMIN_SESSION_SECRET = originalSessionSecret;
    }
  });

  it("treats a blank explicit session secret as absent and uses the passcode fallback", () => {
    process.env.BARBER_ADMIN_PASSCODE = "configured-passcode";
    process.env.BARBER_ADMIN_SESSION_SECRET = "";

    expect(isAdminConfigured()).toBe(true);
    expect(verifyPasscode("configured-passcode")).toBe(true);
  });

  it("reports owner login unconfigured when no passcode exists", () => {
    process.env.BARBER_ADMIN_PASSCODE = "";
    process.env.BARBER_ADMIN_SESSION_SECRET = "";

    expect(isAdminConfigured()).toBe(false);
    expect(verifyPasscode("anything")).toBe(false);
  });
});
