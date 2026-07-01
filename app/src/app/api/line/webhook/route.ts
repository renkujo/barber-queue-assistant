import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    received: Boolean(body),
    note: "LINE OA webhook placeholder. Signature verification and event handling will be added in the integration phase.",
  });
};
