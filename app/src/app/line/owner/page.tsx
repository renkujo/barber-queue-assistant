import { AppCard, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";
import { verifyOwnerLineResultToken } from "@/lib/notifications/owner-line-binding";

type OwnerLinePageProps = {
  searchParams: Promise<{ result?: string }>;
};

const OwnerLinePage = async ({ searchParams }: OwnerLinePageProps) => {
  const params = await searchParams;
  const status = params.result ? verifyOwnerLineResultToken(params.result) ?? "invalid" : "missing-line";

  return (
    <ScreenShell className="bqa-book-shell bqa-line-shell bqa-customer-line-v2 bqa-owner-line-status-v2" visualVersion="v2">
      <AppCard labelledBy="owner-line-title" className="bqa-book-card bqa-line-card">
        <PageHeader
          id="owner-line-title"
          title="เชื่อม LINE เจ้าของร้าน"
          subtitle="แจ้งเตือนคิวใหม่"
        />

        {status === "connected" ? (
          <Notice tone="warm" role="status" ariaLive="polite" className="bqa-owner-line-notice bqa-owner-line-notice--connected">เชื่อม LINE เจ้าของร้านเรียบร้อยแล้ว ระบบบันทึก LINE นี้เป็นปลายทางสำหรับแจ้งเตือนคิวใหม่</Notice>
        ) : null}
        {status === "missing-line" ? (
          <Notice tone="warm" role="status" ariaLive="polite" className="bqa-owner-line-notice bqa-owner-line-notice--missing-line">เปิดลิงก์นี้ผ่าน LINE เพื่อให้ระบบอ่าน LINE ID ของเจ้าของร้าน</Notice>
        ) : null}
        {status === "invalid" ? (
          <Notice className="bqa-owner-line-notice bqa-owner-line-notice--invalid">ลิงก์เชื่อม LINE หมดอายุหรือไม่ถูกต้อง กลับไปสร้างลิงก์ใหม่จากหน้า owner settings</Notice>
        ) : null}

        <div className="bqa-button-pair">
          <Button asChild fullWidth>
            <a href="/owner/settings">
              <Icon icon="lucide:settings" aria-hidden="true" />กลับหน้าตั้งค่า
            </a>
          </Button>
          <Button asChild variant="outline" fullWidth>
            <a href="/owner">
              <Icon icon="lucide:list" aria-hidden="true" />กลับคิววันนี้
            </a>
          </Button>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default OwnerLinePage;
