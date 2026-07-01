import { prisma } from "@/lib/prisma";

const getPlaceholderName = (lineUserId: string) => `LINE user ${lineUserId.slice(-6)}`;

export const bindLineUserId = async (lineUserId: string, displayName?: string) => {
  const normalizedLineUserId = lineUserId.trim();

  if (!normalizedLineUserId) {
    return null;
  }

  return prisma.customer.upsert({
    where: { lineUserId: normalizedLineUserId },
    update: {
      name: displayName?.trim() || undefined,
    },
    create: {
      name: displayName?.trim() || getPlaceholderName(normalizedLineUserId),
      lineUserId: normalizedLineUserId,
    },
  });
};
