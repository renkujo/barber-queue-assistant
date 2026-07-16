import { NextResponse } from "next/server";
import { getPublicQueueStatusSnapshotSafe } from "@/lib/queue/repository";

export const GET = async () => {
  const snapshot = await getPublicQueueStatusSnapshotSafe();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
};
