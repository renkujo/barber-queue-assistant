import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/lib/admin-auth";
import { createOwnerLineConnectToken } from "@/lib/notifications/owner-line-binding";

export const GET = async (request: Request) => {
  await requireOwnerSession();
  const token = await createOwnerLineConnectToken();
  const params = new URLSearchParams({ target: "owner", token });
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID?.trim();
  const destination = liffId
    ? `https://liff.line.me/${liffId}?${params.toString()}`
    : new URL(`/line?${params.toString()}`, request.url).toString();

  return NextResponse.redirect(destination);
};
