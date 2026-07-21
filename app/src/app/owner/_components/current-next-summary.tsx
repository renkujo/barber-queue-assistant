import { Icon } from "@/components/ui";
import type { QueueListItem } from "@/lib/queue/repository";

type CurrentNextSummaryProps = {
  current?: QueueListItem;
  next?: QueueListItem;
};

export const CurrentNextSummary = ({ current, next }: CurrentNextSummaryProps) => (
  <section className="bqa-owner-summary-strip" aria-label="สถานะคิวตอนนี้และคิวถัดไป">
    <div className="bqa-owner-summary-pane">
      <span className="bqa-owner-summary-icon bqa-owner-summary-icon--current" aria-hidden="true">
        <Icon icon="lucide:scissors" />
      </span>
      <div>
        <strong>{current ? "กำลังตัด" : "ตอนนี้ว่าง"}</strong>
        <p className="bqa-owner-summary-customer" title={current?.customerName}>{current ? current.customerName : "รอลูกค้าคนถัดไป"}</p>
      </div>
    </div>

    <div className="bqa-owner-summary-divider" aria-hidden="true" />

    <div className="bqa-owner-summary-pane bqa-owner-summary-pane--next">
      <span className="bqa-owner-summary-icon bqa-owner-summary-icon--next" aria-hidden="true">
        <Icon icon="lucide:user" />
      </span>
      <div>
        <span>ถัดไป</span>
        <strong className="bqa-owner-summary-next-name" title={next ? `${next.code} ${next.customerName}` : undefined}>{next ? `${next.code} ${next.customerName}` : "ยังไม่มีคิวถัดไป"}</strong>
        {next?.note ? <p className="bqa-owner-summary-note" title={next.note}>{next.note}</p> : null}
      </div>
    </div>
  </section>
);
