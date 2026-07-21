import Link from "next/link";
import { AppCard, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";

const QueueNotFound = () => (
  <ScreenShell variant="center" className="bqa-customer-not-found-v2" visualVersion="v2">
    <AppCard labelledBy="not-found-title" className="bqa-not-found-card-v2">
      <PageHeader id="not-found-title" title="คิวนี้ไม่มีอยู่แล้ว" subtitle="ไม่พบหน้านี้" imageSrc="/assets/generated-v1/queue-ticket-cutout.png" largeImage />
      <p className="bqa-copy">ลิงก์นี้ไม่ตรงกับคิวที่ระบบรู้จัก หรือพิมพ์รหัสไม่ถูกต้อง กลับหน้าแรกเพื่อตรวจสถานะร้านอีกครั้ง</p>
      <div className="bqa-actions-footer">
        <Button asChild fullWidth>
          <Link href="/">
            <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับหน้าแรก
          </Link>
        </Button>
      </div>
    </AppCard>
  </ScreenShell>
);

export default QueueNotFound;
