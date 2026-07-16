export const getQueueCode = (queueItemId: string) =>
  `Q${queueItemId.slice(-6).toUpperCase()}`;
