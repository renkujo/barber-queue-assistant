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
    <Card className="bqa-owner-rail-panel" aria-labelledby="quick-actions-title">
      <CardHeader className="bqa-owner-rail-header">
        <CardTitle id="quick-actions-title">การทำงานเร็ว</CardTitle>
      </CardHeader>
      <CardContent className="bqa-owner-rail-actions">
        <Button asChild variant="outline" size="lg" fullWidth>
          <Link href="/owner/walk-in">
            <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มคิว
          </Link>
        </Button>
        <form action={breakAction}>
          <Button variant="outline" type="submit" size="lg" fullWidth>
            <Icon icon="lucide:coffee" aria-hidden="true" />พักร้าน
          </Button>
        </form>
        <Button asChild variant="outline" size="lg" fullWidth>
          <Link href="/owner">
            <Icon icon="lucide:refresh-cw" aria-hidden="true" />รีเฟรชคิว
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="bqa-owner-rail-panel" aria-labelledby="today-summary-title">
      <CardHeader className="bqa-owner-rail-header">
        <CardTitle id="today-summary-title">สรุปวันนี้</CardTitle>
      </CardHeader>
      <CardContent className="bqa-owner-rail-summary-content">
        <dl className="bqa-owner-rail-summary">
          <div>
            <dt>คิวทั้งหมด</dt>
            <dd>{totalCount}</dd>
          </div>
          <div>
            <dt>กำลังตัด</dt>
            <dd>{currentCount}</dd>
          </div>
          <div>
            <dt>รอคิว</dt>
            <dd>{waitingCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <OwnerNotificationLogPanel logs={notificationLogs} />

    <Card className="bqa-owner-rail-panel bqa-owner-tip-panel" aria-labelledby="owner-tip-title">
      <div>
        <CardTitle id="owner-tip-title">
          <Icon icon="lucide:star" aria-hidden="true" />ทิป
        </CardTitle>
        <p>แตะ “เริ่มตัด” เพื่อเริ่มคิวถัดไป</p>
      </div>
      <Icon icon="lucide:scissors" aria-hidden="true" />
    </Card>
  </aside>
);
