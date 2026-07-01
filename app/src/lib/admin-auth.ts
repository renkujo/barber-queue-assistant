import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "bqa_owner_session";

const getPasscode = () => process.env.BARBER_ADMIN_PASSCODE;

const getSessionSecret = () =>
  process.env.BARBER_ADMIN_SESSION_SECRET ?? process.env.BARBER_ADMIN_PASSCODE;

const getSessionValue = () => {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update("owner-session:v1").digest("hex");
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const isAdminConfigured = () => Boolean(getPasscode() && getSessionSecret());

export const verifyPasscode = (passcode: string) => {
  const configuredPasscode = getPasscode();

  if (!configuredPasscode) {
    return false;
  }

  return safeEqual(passcode, configuredPasscode);
};

export const setOwnerSession = async () => {
  const sessionValue = getSessionValue();

  if (!sessionValue) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return true;
};

export const clearOwnerSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
};

export const hasOwnerSession = async () => {
  const expectedSession = getSessionValue();

  if (!expectedSession) {
    return false;
  }

  const cookieStore = await cookies();
  const actualSession = cookieStore.get(cookieName)?.value;

  if (!actualSession) {
    return false;
  }

  return safeEqual(actualSession, expectedSession);
};

export const requireOwnerSession = async () => {
  const allowed = await hasOwnerSession();

  if (!allowed) {
    redirect("/owner/login");
  }
};
