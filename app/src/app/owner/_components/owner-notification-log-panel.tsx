import { Icon } from "@/components/ui";
import type { OwnerNotificationLogItem } from "@/lib/queue/repository";

const toneIcon = {
  positive: "lucide:check",
  warning: "lucide:triangle-alert",
  neutral: "lucide:minus",
} as const;

type OwnerNotificationLogPanelProps = {
  logs: OwnerNotificationLogItem[];
};

export const OwnerNotificationLogPanel = ({ logs }: OwnerNotificationLogPanelProps) => (
  <section className="bqa-owner-rail-panel bqa-owner-notification-panel" aria-labelledby="owner-notification-title">
    <div className="bqa-owner-notification-heading">
      <h2 id="owner-notification-title">
        <Icon icon="lucide:message-circle" aria-hidden="true" />แจ้งเตือน LINE
      </h2>
      <span>{logs.length ? `${logs.length} ล่าสุด` : "ยังไม่มี"}</span>
    </div>

    {logs.length ? (
      <ol className="bqa-owner-notification-list" aria-label="รายการแจ้งเตือนล่าสุด">
        {logs.map((log) => (
          <li className={`bqa-owner-notification-item bqa-owner-notification-item--${log.tone}`} key={log.id}>
            <span className="bqa-owner-notification-icon" aria-hidden="true">
              <Icon icon={toneIcon[log.tone]} />
            </span>
            <div className="bqa-owner-notification-copy">
              <strong>
                {log.statusLabel} · {log.customerName}
              </strong>
              <p>{log.typeLabel}</p>
              {log.error ? <small>{log.error}</small> : null}
            </div>
            <time>{log.timeLabel}</time>
          </li>
        ))}
      </ol>
    ) : (
      <p className="bqa-owner-notification-empty">เมื่อมีการส่งหรือข้าม LINE notification จะแสดงตรงนี้</p>
    )}
  </section>
);
