import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Icon } from "@/components/ui";
import type { OwnerNotificationLogItem } from "@/lib/queue/repository";
import { OwnerNotificationLogPanel } from "./owner-notification-log-panel";

type OwnerSideRailProps = {
  currentCount: number;
  waitingCount: number;
  totalCount: number;
  breakAction: () => Promise<void>;
  notificationLogs: OwnerNotificationLogItem[];
};

export const OwnerSideRail = ({ currentCount, waitingCount, totalCount, breakAction, notificationLogs }: OwnerSideRailProps) => (
  <aside className="bqa-owner-side-rail" aria-label="การทำงานเร็วและสรุปวันนี้">
    <Card className="!rounded-[14px] !border-[var(--line-strong)] !bg-[color-mix(in_srgb,var(--surface)_84%,var(--paper))] !p-0 !shadow-none" aria-labelledby="quick-actions-title">
      <CardHeader className="px-3.5 pt-3.5 pb-0">
        <CardTitle id="quick-actions-title" className="!mb-0 !text-base !leading-tight">การทำงานเร็ว</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5 px-3.5 pt-3 pb-3.5">
        <Button asChild variant="outline" size="md" fullWidth>
          <Link href="/owner/walk-in">
            <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มคิว
          </Link>
        </Button>
        <form action={breakAction}>
          <Button variant="outline" type="submit" size="md" fullWidth>
            <Icon icon="lucide:coffee" aria-hidden="true" />พักร้าน
          </Button>
        </form>
        <Button asChild variant="outline" size="md" fullWidth>
          <Link href="/owner">
            <Icon icon="lucide:refresh-cw" aria-hidden="true" />รีเฟรชคิว
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="!rounded-[14px] !border-[var(--line-strong)] !bg-[color-mix(in_srgb,var(--surface)_84%,var(--paper))] !p-0 !shadow-none" aria-labelledby="today-summary-title">
      <CardHeader className="px-3.5 pt-3.5 pb-0">
        <CardTitle id="today-summary-title" className="!mb-0 !text-base !leading-tight">สรุปวันนี้</CardTitle>
      </CardHeader>
      <CardContent className="px-3.5 pt-1 pb-2">
        <dl className="m-0 grid">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-2">
            <dt className="text-sm font-medium text-[var(--muted)]">คิวทั้งหมด</dt>
            <dd className="m-0 text-lg font-medium tabular-nums text-[var(--ink)]">{totalCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-2">
            <dt className="text-sm font-medium text-[var(--muted)]">กำลังตัด</dt>
            <dd className="m-0 text-lg font-medium tabular-nums text-[#4f8b59]">{currentCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-sm font-medium text-[var(--muted)]">รอคิว</dt>
            <dd className="m-0 text-lg font-medium tabular-nums text-[var(--ink)]">{waitingCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <OwnerNotificationLogPanel logs={notificationLogs} />

    <Card className="hidden justify-between gap-[18px] !rounded-[14px] !border-[var(--line-strong)] !bg-[color-mix(in_srgb,var(--surface-warm)_72%,var(--surface))] !p-3.5 !shadow-none" aria-labelledby="owner-tip-title">
      <div>
        <CardTitle id="owner-tip-title" className="inline-flex items-center gap-2 !mb-2.5 !text-base !leading-tight">
          <Icon icon="lucide:star" aria-hidden="true" />ทิป
        </CardTitle>
        <p className="m-0 text-sm leading-relaxed text-[var(--muted)]">แตะ “เริ่มตัด” เพื่อเริ่มคิวถัดไป</p>
      </div>
      <Icon icon="lucide:scissors" className="self-end text-[38px] text-[color-mix(in_srgb,var(--primary)_62%,var(--line-strong))]" aria-hidden="true" />
    </Card>
  </aside>
);
