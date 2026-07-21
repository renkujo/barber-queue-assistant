import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { OwnerNotificationLogItem } from "@/lib/queue/repository";

const toneIcon = {
  positive: "lucide:check",
  warning: "lucide:triangle-alert",
  neutral: "lucide:minus",
} as const;

const toneIconClassName = {
  positive: "border-[var(--sage)] bg-[var(--mint)] text-[#35653d]",
  warning: "border-[var(--rose)] bg-[var(--rose-soft)] text-[#743a36]",
  neutral: "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
} as const;

type OwnerNotificationLogPanelProps = {
  logs: OwnerNotificationLogItem[];
};

export const OwnerNotificationLogPanel = ({ logs }: OwnerNotificationLogPanelProps) => (
  <Card className="bqa-owner-notification-panel bqa-owner-rail-card" aria-labelledby="owner-notification-title">
    <CardHeader className="bqa-owner-notification-header">
      <CardTitle id="owner-notification-title" className="bqa-owner-notification-title">
        <Icon icon="lucide:message-circle" aria-hidden="true" />แจ้งเตือน LINE
      </CardTitle>
      <span className="bqa-owner-notification-count">{logs.length ? `${logs.length} ล่าสุด` : "ยังไม่มี"}</span>
    </CardHeader>

    {logs.length ? (
      <CardContent className="p-0">
        <ol className="m-0 grid list-none p-0" aria-label="รายการแจ้งเตือนล่าสุด">
          {logs.map((log) => (
            <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-2.5 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0" key={log.id}>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-[9px] border text-sm",
                  toneIconClassName[log.tone],
                )}
                aria-hidden="true"
              >
                <Icon icon={toneIcon[log.tone]} />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-[13px] font-medium leading-snug text-[var(--ink)]" title={`${log.statusLabel} · ${log.customerName}`}>
                  {log.statusLabel} · {log.customerName}
                </strong>
                <p className="mt-0.5 mb-0 text-xs font-medium leading-snug text-[var(--muted)]">{log.typeLabel}</p>
                {log.error ? <small className="mt-1 block text-[11px] font-medium leading-snug text-[#743a36]">{log.error}</small> : null}
              </div>
              <time className="text-[11px] leading-snug font-medium tabular-nums text-[var(--muted)]">{log.timeLabel}</time>
            </li>
          ))}
        </ol>
      </CardContent>
    ) : (
      <CardContent className="px-3.5 py-3">
        <p className="m-0 text-xs font-medium leading-snug text-[var(--muted)]">เมื่อมีการส่งหรือข้าม LINE notification จะแสดงตรงนี้</p>
      </CardContent>
    )}
  </Card>
);
