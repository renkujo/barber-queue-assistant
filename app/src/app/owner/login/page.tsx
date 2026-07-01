import { AppCard, FormStack, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, FormField, Icon, Input, RouteToast } from "@/components/ui";
import { isAdminConfigured } from "@/lib/admin-auth";
import { loginOwner } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "รหัสเข้าหน้าเจ้าของร้านไม่ถูกต้อง",
  setup: "ยังไม่ได้ตั้งค่า BARBER_ADMIN_PASSCODE และ BARBER_ADMIN_SESSION_SECRET",
};

const OwnerLoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const configured = isAdminConfigured();

  return (
    <ScreenShell variant="center">
      <AppCard labelledBy="login-title">
        <PageHeader
          id="login-title"
          title="เข้าหน้าเจ้าของร้าน"
          subtitle="Owner mode"
          imageSrc="/assets/generated-v1/app-icon-pastel.png"
          largeImage
        />
        <p className="bqa-copy">สำหรับดูคิววันนี้ เพิ่ม walk-in และจัดการ no-show อย่างรวดเร็ว</p>

        {!configured ? <Notice tone="warm">ตั้งค่า BARBER_ADMIN_PASSCODE และ BARBER_ADMIN_SESSION_SECRET ใน .env ก่อนใช้งานจริง</Notice> : null}
        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-login:${params.error ?? ""}`} />

        <form action={loginOwner}>
          <FormStack>
          <FormField id="passcode" label="รหัสเจ้าของร้าน">
            <Input id="passcode" name="passcode" type="password" autoComplete="current-password" />
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
