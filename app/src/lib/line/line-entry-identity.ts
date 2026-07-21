import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type LineEntryIdentityPurpose = "book" | "owner" | "walk-in";

const cookieNames: Record<LineEntryIdentityPurpose, string> = {
  book: "bqa_line_entry_book",
  owner: "bqa_line_entry_owner",
  "walk-in": "bqa_line_entry_walk_in",
};

export const getLineEntryIdentityCookieName = (purpose: LineEntryIdentityPurpose) => cookieNames[purpose];

const cookieMaxAgeSeconds = 10 * 60;
const signatureContext = "line-entry-identity:v1";

const getSigningSecret = () => {
  const secret = process.env.BARBER_ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("BARBER_ADMIN_SESSION_SECRET is required for LINE entry identity.");
  }

  return secret;
};

const signPayload = (payload: string) => createHmac("sha256", getSigningSecret())
  .update(`${signatureContext}:${payload}`)
  .digest("base64url");

const isValidLineUserId = (value: string) => value.length >= 1 && value.length <= 128;

export const createLineEntryIdentityCookieValue = (
  lineUserId: string,
  purpose: LineEntryIdentityPurpose,
  expiresAt = Date.now() + cookieMaxAgeSeconds * 1000,
) => {
  const payload = Buffer.from(JSON.stringify({
    lineUserId,
    purpose,
    expiresAt,
  })).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
};

export const readLineEntryIdentityCookieValue = (value: string, purpose: LineEntryIdentityPurpose) => {
  const [payload, receivedSignature, ...rest] = value.split(".");

  if (!payload || !receivedSignature || rest.length) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(receivedSignature);

  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      lineUserId?: unknown;
      purpose?: unknown;
      expiresAt?: unknown;
    };
    const lineUserId = typeof parsed.lineUserId === "string" ? parsed.lineUserId.trim() : "";
    const expiresAt = typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0;

    if (!isValidLineUserId(lineUserId) || parsed.purpose !== purpose || expiresAt <= Date.now()) {
      return null;
    }

    return lineUserId;
  } catch {
    return null;
  }
};

export const storeLineEntryIdentity = async (lineUserIdInput: string, purpose: LineEntryIdentityPurpose) => {
  const lineUserId = lineUserIdInput.trim();

  if (!isValidLineUserId(lineUserId)) {
    throw new Error("Invalid LINE user ID.");
  }

  const cookieStore = await cookies();
  cookieStore.set(getLineEntryIdentityCookieName(purpose), createLineEntryIdentityCookieValue(lineUserId, purpose), {
    httpOnly: true,
    maxAge: cookieMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const getLineEntryIdentity = async (purpose: LineEntryIdentityPurpose) => {
  const cookieStore = await cookies();
  const value = cookieStore.get(getLineEntryIdentityCookieName(purpose))?.value;

  return value ? readLineEntryIdentityCookieValue(value, purpose) : null;
};

export const clearLineEntryIdentity = async (purpose: LineEntryIdentityPurpose) => {
  const cookieStore = await cookies();
  cookieStore.delete(getLineEntryIdentityCookieName(purpose));
};
