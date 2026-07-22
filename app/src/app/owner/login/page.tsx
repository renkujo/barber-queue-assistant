import { AppCard, FormStack, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, FormField, Icon, Input } from "@/components/ui";
import { isAdminConfigured } from "@/lib/admin-auth";
import { loginOwner } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "รหัสเข้าหน้าเจ้าของร้านไม่ถูกต้อง",
  "rate-limited": "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่",
  setup: "ยังไม่ได้ตั้งค่า BARBER_ADMIN_PASSCODE สำหรับเข้าสู่ระบบเจ้าของร้าน",
};

const OwnerLoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const configured = isAdminConfigured();
  const passcodeError = params.error === "invalid" || params.error === "rate-limited" ? errorMessage : null;
  const setupError = params.error === "setup" ? errorMessage : null;

  return (
    <ScreenShell variant="center" className="bqa-owner-login-v2" visualVersion="v2">
      <AppCard labelledBy="login-title" className="bqa-owner-login-card-v2">
        <PageHeader
          id="login-title"
          title="เข้าหน้าเจ้าของร้าน"
          subtitle="Owner mode"
          imageSrc="/icons/joined-tail-q-r1-ui-512.png"
          largeImage
        />
        <p className="bqa-copy bqa-owner-login-copy">สำหรับดูคิววันนี้ เพิ่ม walk-in และจัดการ no-show อย่างรวดเร็ว</p>

        {!configured ? (
          <Notice tone="warm">ตั้งค่า BARBER_ADMIN_PASSCODE ใน .env ก่อนใช้งาน และตั้ง BARBER_ADMIN_SESSION_SECRET แยกต่างหากก่อน production</Notice>
        ) : setupError ? (
          <Notice>{setupError}</Notice>
        ) : null}

        <form action={loginOwner} className="bqa-owner-login-form">
          <FormStack>
            <FormField id="passcode" label="รหัสเจ้าของร้าน" error={passcodeError}>
              <Input
                id="passcode"
                name="passcode"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(passcodeError)}
                required
              />
            </FormField>
            <Button type="submit">
              <Icon icon="lucide:log-in" aria-hidden="true" />เข้าสู่ระบบ
            </Button>
          </FormStack>
        </form>
      </AppCard>
    </ScreenShell>
  );
};

export default OwnerLoginPage;
