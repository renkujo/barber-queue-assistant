import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const withPilotFunctionOwner = async <T>(
  callback: (transaction: Prisma.TransactionClient) => Promise<T>,
) => prisma.$transaction(async (transaction) => {
  await transaction.$executeRawUnsafe("SET LOCAL ROLE bqa_pilot_function_owner");
  return callback(transaction);
});

export const executeSubjectDeletion = async (queueItemId: string) => withPilotFunctionOwner(
  (transaction) => transaction.$queryRaw<Array<{ result: unknown }>>`
    SELECT public.bqa_pilot_subject_delete_v1(
      ${queueItemId.slice(-6).toUpperCase()},
      'vitest-pilot',
      true
    ) AS result
  `,
);

export const cleanupPilotFixtures = async (prefix: string, cohortIds: string[]) => {
  const queues = await prisma.queueItem.findMany({
    where: { customerNameSnapshot: { startsWith: prefix } },
    select: { id: true, customerId: true },
  });
  const queueIds = queues.map((queue) => queue.id);
  const customerIds = queues.map((queue) => queue.customerId).filter((id): id is string => Boolean(id));

  if (queueIds.length) {
    await prisma.evidenceHold.deleteMany({ where: { queueItemId: { in: queueIds } } });
    for (const queue of queues) await executeSubjectDeletion(queue.id);
    await prisma.notificationLog.deleteMany({ where: { queueItemId: { in: queueIds } } });
    await prisma.queueItem.deleteMany({ where: { id: { in: queueIds } } });
  }

  if (cohortIds.length) {
    await prisma.queueMutationOperation.deleteMany({ where: { pilotCohortId: { in: cohortIds } } });
    await prisma.pilotCohort.deleteMany({ where: { id: { in: cohortIds } } });
  }
  if (customerIds.length) {
    await prisma.customer.deleteMany({ where: { id: { in: customerIds }, queueItems: { none: {} } } });
  }
};
