import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: "barber-queue-assistant",
      database: "reachable",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "barber-queue-assistant",
        database: "unreachable",
      },
      { status: 503 },
    );
  }
};
