import Link from "next/link";
import { AppCard, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";

const NotFound = () => (
  <ScreenShell variant="center">
    <AppCard labelledBy="not-found-title">
      <PageHeader id="not-found-title" title="คิวนี้ไม่มีอยู่แล้ว" subtitle="ไม่พบหน้านี้" imageSrc="/assets/generated-v1/queue-ticket-cutout.png" largeImage />
      <p className="bqa-copy">ลิงก์อาจหมดอายุ ถูกยกเลิก หรือพิมพ์รหัสไม่ถูกต้อง กลับหน้าแรกเพื่อตรวจสถานะร้านอีกครั้ง</p>
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

export default NotFound;
