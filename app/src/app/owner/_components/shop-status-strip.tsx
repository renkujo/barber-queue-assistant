import type { ShopIntakeSettings } from "@/lib/queue/repository";
import { Button, Icon } from "@/components/ui";

type ShopStatusStripProps = {
  breakAction: () => Promise<void>;
  intakeAction: (formData: FormData) => Promise<void>;
  settings: ShopIntakeSettings;
};

export const ShopStatusStrip = ({ breakAction, intakeAction, settings }: ShopStatusStripProps) => (
  <section className={`bqa-owner-status-strip ${settings.queueIntakeEnabled ? "" : "bqa-owner-status-strip--closed"}`} aria-label="สถานะร้าน">
    <div className="bqa-owner-status-copy">
      <span className="bqa-owner-status-dot" aria-hidden="true" />
      <div>
        <strong>{settings.queueIntakeEnabled ? "ร้านเปิดรับคิว" : "ปิดรับคิวแล้ว"}</strong>
        <p>{settings.queueIntakeEnabled ? "ลูกค้าจองและรับคิวเองได้" : "ลูกค้าสร้างคิวไม่ได้ เจ้าของร้านยังเพิ่มเองได้"}</p>
      </div>
    </div>

    <div className="bqa-owner-status-actions">
      <form action={intakeAction}>
        <input name="enabled" type="hidden" value={settings.queueIntakeEnabled ? "false" : "true"} />
        <Button variant={settings.queueIntakeEnabled ? "outline" : "default"} type="submit" size="lg" className="bqa-owner-intake-action">
          <Icon icon={settings.queueIntakeEnabled ? "lucide:pause" : "lucide:play"} aria-hidden="true" />
          {settings.queueIntakeEnabled ? "ปิดรับคิว" : "เปิดรับคิว"}
        </Button>
      </form>
      <form action={breakAction}>
        <Button variant="outline" type="submit" size="lg" className="bqa-owner-break-action">
          <Icon icon="lucide:clock" aria-hidden="true" />พัก 30 นาที
        </Button>
      </form>
    </div>
  </section>
);
