import { QueueItemStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/barber/app-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
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
    <Card
      className="overflow-hidden !rounded-[var(--owner-radius-board)] !border-[var(--line-strong)] !bg-[color-mix(in_srgb,var(--surface)_84%,var(--paper))] max-[559px]:!rounded-none max-[559px]:!border-x-0"
      aria-labelledby="owner-closed-title"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[var(--line)] px-3.5 py-2.5">
        <CardTitle id="owner-closed-title" className="!mb-0 !text-[15px] !leading-tight">ปิดแล้ววันนี้</CardTitle>
        <CardDescription className="!text-xs !font-semibold !text-[var(--muted)]">{queue.length} คิว</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Table className="bqa-owner-closed-table min-w-[720px] max-[559px]:min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">เวลา</TableHead>
              <TableHead>คิว</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead className="w-[104px]">สถานะ</TableHead>
              <TableHead className="w-[116px]">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="w-[72px] font-bold tabular-nums text-[color-mix(in_srgb,var(--ink)_74%,var(--muted))]">{item.timeLabel}</TableCell>
                <TableCell>
                  <strong className="min-w-0 text-sm font-bold leading-tight text-[var(--ink)]">
                    {item.code} {item.customerName}
                  </strong>
                </TableCell>
                <TableCell className="min-w-0 truncate whitespace-nowrap">{item.note}</TableCell>
                <TableCell className="w-[104px]">
                  <StatusBadge tone={closedTone(item.status)}>{item.statusLabel}</StatusBadge>
                </TableCell>
                <TableCell className="w-[116px]">
                  <RestoreQueueActionButton itemId={item.id} customerLabel={`${item.code} ${item.customerName}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
