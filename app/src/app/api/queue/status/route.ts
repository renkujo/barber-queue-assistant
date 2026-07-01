import { NextResponse } from "next/server";
import { getQueueStatusSnapshotSafe } from "@/lib/queue/repository";

export const GET = async () => {
  const snapshot = await getQueueStatusSnapshotSafe();

  return NextResponse.json(snapshot);
};
