import { QueueEntrySource } from "@/generated/prisma/enums";

const sourceByToken: Record<string, QueueEntrySource> = {
  line: QueueEntrySource.LINE,
  "shop-qr": QueueEntrySource.SHOP_QR,
  "owner-shared-link": QueueEntrySource.OWNER_SHARED_LINK,
  "in-shop": QueueEntrySource.IN_SHOP,
};

const tokenBySource: Partial<Record<QueueEntrySource, string>> = {
  [QueueEntrySource.LINE]: "line",
  [QueueEntrySource.SHOP_QR]: "shop-qr",
  [QueueEntrySource.OWNER_SHARED_LINK]: "owner-shared-link",
  [QueueEntrySource.IN_SHOP]: "in-shop",
};

export const parseQueueEntrySource = (value?: string | null) => {
  const normalized = value?.trim() ?? "";
  const enumValue = Object.values(QueueEntrySource).find((source) => source === normalized);

  return enumValue ?? sourceByToken[normalized.toLowerCase()] ?? QueueEntrySource.UNKNOWN;
};

export const getQueueEntrySourceToken = (source: QueueEntrySource) => tokenBySource[source] ?? null;

export const withQueueEntrySource = (path: string, source: QueueEntrySource) => {
  const token = getQueueEntrySourceToken(source);

  if (!token) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}source=${token}`;
};
