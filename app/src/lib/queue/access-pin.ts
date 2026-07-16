import { createHash } from "node:crypto";

const accessPinNamespace = "barber-queue-access";

export const getQueueAccessPin = (publicToken: string) => {
  const normalizedToken = publicToken.trim().toLowerCase();

  if (!normalizedToken) {
    return "";
  }

  const digest = createHash("sha256")
    .update(`${accessPinNamespace}:${normalizedToken}`)
    .digest();
  const pinValue = digest.readUInt32BE(0) % 10_000;

  return pinValue.toString().padStart(4, "0");
};
