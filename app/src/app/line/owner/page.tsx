import { AppCard, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";
import { bindOwnerLineUserId } from "@/lib/notifications/owner-line-binding";

type OwnerLinePageProps = {
  searchParams: Promise<{ token?: string; lineUserId?: string }>;
};

const OwnerLinePage = async ({ searchParams }: OwnerLinePageProps) => {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const lineUserId = params.lineUserId?.trim() ?? "";
  let status: "connected" | "missing-line" | "invalid" = "missing-line";

  if (token && lineUserId) {
    try {
      await bindOwnerLineUserId(lineUserId, token);
      status = "connected";
    } catch {
      status = "invalid";
    }
  } else if (!token) {
    status = "invalid";
  }

  return (
    <ScreenShell className="bqa-book-shell bqa-line-shell">
      <AppCard labelledBy="owner-line-title" className="bqa-book-card bqa-line-card">
        <PageHeader
          id="owner-line-title"
          title="เชื่อม LINE เจ้าของร้าน"
          subtitle="แจ้งเตือนคิวใหม่"
        />

        {status === "connected" ? (
          <Notice tone="warm">เชื่อม LINE เจ้าของร้านเรียบร้อยแล้ว ระบบจะส่งแจ้งเตือนคิวใหม่มาที่ LINE นี้</Notice>
        ) : null}
        {status === "missing-line" ? (
          <Notice>เปิดลิงก์นี้ผ่าน LINE เพื่อให้ระบบอ่าน LINE ID ของเจ้าของร้าน</Notice>
        ) : null}
        {status === "invalid" ? (
          <Notice>ลิงก์เชื่อม LINE หมดอายุหรือไม่ถูกต้อง กลับไปสร้างลิงก์ใหม่จากหน้า owner settings</Notice>
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
