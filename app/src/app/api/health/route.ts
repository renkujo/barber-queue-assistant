import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPilotMeasurementHealth } from "@/lib/pilot/config";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const pilotMeasurement = await getPilotMeasurementHealth();

    if (pilotMeasurement.status === "misconfigured") {
      return NextResponse.json({
        ok: false,
        service: "barber-queue-assistant",
        database: "reachable",
        pilotMeasurement,
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      service: "barber-queue-assistant",
      database: "reachable",
      pilotMeasurement,
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
