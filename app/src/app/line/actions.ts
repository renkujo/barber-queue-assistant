"use server";

import { type LineEntryIdentityPurpose, storeLineEntryIdentity } from "@/lib/line/line-entry-identity";
import { verifyLineIdToken } from "@/lib/line/line-id-token";

export const storeLineEntryIdentityAction = async (idToken: string, purpose: LineEntryIdentityPurpose) => {
  if (purpose !== "book" && purpose !== "walk-in" && purpose !== "owner") {
    throw new Error("Invalid LINE entry purpose.");
  }

  const lineUserId = await verifyLineIdToken(idToken);
  await storeLineEntryIdentity(lineUserId, purpose);
};
