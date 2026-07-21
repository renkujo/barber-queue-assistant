import { NextResponse } from "next/server";
import { getLineEntryIdentity, getLineEntryIdentityCookieName } from "@/lib/line/line-entry-identity";
import { bindOwnerLineUserId, createOwnerLineResultToken, type OwnerLineResultStatus } from "@/lib/notifications/owner-line-binding";

export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token")?.trim() ?? "";
  const lineUserId = await getLineEntryIdentity("owner");
  let status: OwnerLineResultStatus = "missing-line";

  if (!token) {
    status = "invalid";
  } else if (lineUserId) {
    try {
      await bindOwnerLineUserId(lineUserId, token);
      status = "connected";
    } catch {
      status = "invalid";
    }
  }

  const destination = new URL(`/line/owner?result=${encodeURIComponent(createOwnerLineResultToken(status))}`, requestUrl.origin);
  const response = NextResponse.redirect(destination);
  response.cookies.delete({ name: getLineEntryIdentityCookieName("owner"), path: "/" });
  return response;
};
