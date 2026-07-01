import { QueueItemStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/barber/app-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import type { QueueListItem } from "@/lib/queue/repository";
import { RestoreQueueActionButton } from "./restore-queue-action-button";

const closedTone = (status: string) => {
  if (status === QueueItemStatus.DONE) return "positive";
  if (status === QueueItemStatus.NO_SHOW || status === QueueItemStatus.CANCELLED) return "warning";

  return "neutral";
};

export const OwnerClosedQueueList = ({ queue }: { queue: QueueListItem[] }) => {
  if (!queue.length) {
    return null;
  }

  return (
    <section className="bqa-owner-closed-list" aria-labelledby="owner-closed-title">
      <div className="bqa-owner-closed-heading">
        <h2 id="owner-closed-title">ปิดแล้ววันนี้</h2>
        <p>{queue.length} คิว</p>
      </div>

      <Table className="bqa-owner-closed-table">
        <TableHeader>
          <TableRow>
            <TableHead>เวลา</TableHead>
            <TableHead>คิว</TableHead>
            <TableHead>หมายเหตุ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queue.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="bqa-owner-closed-time">{item.timeLabel}</TableCell>
              <TableCell>
                <strong>
                  {item.code} {item.customerName}
                </strong>
              </TableCell>
              <TableCell className="bqa-owner-closed-note">{item.note}</TableCell>
              <TableCell>
                <StatusBadge tone={closedTone(item.status)}>{item.statusLabel}</StatusBadge>
              </TableCell>
              <TableCell>
                <RestoreQueueActionButton itemId={item.id} customerLabel={`${item.code} ${item.customerName}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
};
