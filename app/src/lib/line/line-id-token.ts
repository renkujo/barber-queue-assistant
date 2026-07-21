type VerifyLineIdTokenOptions = {
  fetchImpl?: typeof fetch;
  liffId?: string;
};

type LineIdTokenVerification = {
  aud?: unknown;
  exp?: unknown;
  iss?: unknown;
  sub?: unknown;
};

const getLiffChannelId = (liffIdInput?: string) => {
  const liffId = liffIdInput?.trim() || process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim() || "";
  const channelId = liffId.match(/^(\d+)-/)?.[1];

  if (!channelId) {
    throw new Error("NEXT_PUBLIC_LINE_LIFF_ID must contain a LINE Login channel ID.");
  }

  return channelId;
};

export const verifyLineIdToken = async (
  idTokenInput: string,
  { fetchImpl = fetch, liffId }: VerifyLineIdTokenOptions = {},
) => {
  const idToken = idTokenInput.trim();

  if (!idToken || idToken.length > 8192) {
    throw new Error("Invalid LINE ID token.");
  }

  const channelId = getLiffChannelId(liffId);
  const body = new URLSearchParams({ id_token: idToken, client_id: channelId });
  const response = await fetchImpl("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error("LINE ID token verification failed.");
  }

  const result = await response.json() as LineIdTokenVerification;
  const lineUserId = typeof result.sub === "string" ? result.sub.trim() : "";
  const audience = typeof result.aud === "string" ? result.aud : "";
  const issuer = typeof result.iss === "string" ? result.iss : "";
  const expiresAt = typeof result.exp === "number" ? result.exp : 0;

  if (!lineUserId || lineUserId.length > 128 || audience !== channelId || issuer !== "https://access.line.me" || expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error("Invalid verified LINE identity.");
  }

  return lineUserId;
};
