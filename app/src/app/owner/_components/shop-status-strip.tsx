import { Button, Icon } from "@/components/ui";

type ShopStatusStripProps = {
  action: () => Promise<void>;
};

export const ShopStatusStrip = ({ action }: ShopStatusStripProps) => (
  <section className="bqa-owner-status-strip" aria-label="สถานะร้าน">
    <div className="bqa-owner-status-copy">
      <span className="bqa-owner-status-dot" aria-hidden="true" />
      <div>
        <strong>ร้านเปิดอยู่</strong>
        <p>รับคิวถึง 18:20</p>
      </div>
    </div>

    <form action={action}>
      <Button variant="outline" type="submit" size="lg" className="bqa-owner-break-action">
        <Icon icon="lucide:clock" aria-hidden="true" />พัก 30 นาที
      </Button>
    </form>
  </section>
);
