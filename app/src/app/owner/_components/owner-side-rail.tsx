import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/components/ui";
import type { OwnerNotificationLogItem, QueueStatusSnapshot, ShopIntakeSettings } from "@/lib/queue/repository";
import { OwnerNotificationLogPanel } from "./owner-notification-log-panel";
import { OwnerShopControlPanel } from "./shop-status-strip";

type OwnerSideRailProps = {
  currentCount: number;
  waitingCount: number;
  totalCount: number;
  breakAction: () => Promise<void>;
  intakeAction: (formData: FormData) => Promise<void>;
  intakeSettings: ShopIntakeSettings;
  notificationLogs: OwnerNotificationLogItem[];
  waitAction: (formData: FormData) => Promise<void>;
  waitEstimate: QueueStatusSnapshot["shop"];
};

export const OwnerSideRail = ({
  breakAction,
  currentCount,
  intakeAction,
  intakeSettings,
  notificationLogs,
  totalCount,
  waitAction,
  waitEstimate,
  waitingCount,
}: OwnerSideRailProps) => (
  <aside className="bqa-owner-side-rail" aria-label="การทำงานเร็วและสรุปวันนี้">
    <Card className="bqa-owner-rail-card bqa-owner-rail-card--controls" aria-labelledby="quick-actions-title">
      <CardHeader className="bqa-owner-rail-card-header">
        <CardTitle id="quick-actions-title" className="bqa-owner-rail-card-title">ควบคุมร้าน</CardTitle>
      </CardHeader>
      <CardContent className="bqa-owner-rail-card-content">
        <OwnerShopControlPanel
          breakAction={breakAction}
          intakeAction={intakeAction}
          settings={intakeSettings}
          waitAction={waitAction}
          waitEstimate={waitEstimate}
        />
      </CardContent>
    </Card>

    <Card className="bqa-owner-rail-card bqa-owner-rail-card--summary" aria-labelledby="today-summary-title">
      <CardHeader className="bqa-owner-rail-card-header">
        <CardTitle id="today-summary-title" className="bqa-owner-rail-card-title">สรุปวันนี้</CardTitle>
      </CardHeader>
      <CardContent className="bqa-owner-rail-card-content bqa-owner-rail-card-content--summary">
        <dl className="bqa-owner-rail-summary-list">
          <div className="bqa-owner-rail-summary-row">
            <dt>คิวทั้งหมด</dt>
            <dd>{totalCount}</dd>
          </div>
          <div className="bqa-owner-rail-summary-row">
            <dt>กำลังตัด</dt>
            <dd className="bqa-owner-rail-summary-value--positive">{currentCount}</dd>
          </div>
          <div className="bqa-owner-rail-summary-row">
            <dt>รอคิว</dt>
            <dd>{waitingCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <OwnerNotificationLogPanel logs={notificationLogs} />

    <Card className="bqa-owner-rail-card bqa-owner-tip-card" aria-labelledby="owner-tip-title">
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
