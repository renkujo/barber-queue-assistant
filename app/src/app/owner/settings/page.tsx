import Link from "next/link";
import { FormGrid, FormStack, Notice, OwnerHeader, OwnerGrid, Panel, SectionHeader } from "@/components/barber/app-ui";
import {
  Button,
  FormField,
  Icon,
  Input,
  RouteToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getOwnerShopSettingsSafe } from "@/lib/queue/repository";
import { updateOwnerSettingsAction } from "../actions";
import { OwnerTopbar } from "../_components/owner-topbar";

export const dynamic = "force-dynamic";

type OwnerSettingsPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  database: "ยังบันทึกตั้งค่าไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  invalid: "ข้อมูลตั้งค่าไม่ถูกต้อง ตรวจชื่อร้าน เวลา และสถานะเปิด/ปิดอีกครั้ง",
  "invalid-wait": "เวลารอที่ตั้งเองต้องเป็นตัวเลข 0-240 นาที หรือเว้นว่างเพื่อใช้ค่าคำนวณ",
};

const statusMessages: Record<string, string> = {
  "settings-updated": "บันทึกตั้งค่าร้านแล้ว",
};

const booleanOptions = [
  { label: "เปิด", value: "true" },
  { label: "ปิด", value: "false" },
];

const OwnerSettingsPage = async ({ searchParams }: OwnerSettingsPageProps) => {
  await requireOwnerSession();

  const [params, settings] = await Promise.all([searchParams, getOwnerShopSettingsSafe()]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact">
        <OwnerHeader
          title="ตั้งค่าร้าน"
          description="ปรับค่าที่มีผลกับหน้าลูกค้าและคิววันนี้โดยตรง"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/owner">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับคิววันนี้
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {statusMessage ? <Notice tone="warm">{statusMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-settings-error:${params.error ?? ""}`} />
        <RouteToast message={statusMessage} type="success" toastKey={`owner-settings-status:${params.status ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench">
          <Panel aria-labelledby="owner-settings-form-title">
            <SectionHeader id="owner-settings-form-title" title="ค่าที่ใช้จริง" note="บันทึกแล้วจะกระทบหน้า owner และหน้าลูกค้าทันที" />

            <form action={updateOwnerSettingsAction}>
              <FormStack>
                <FormField id="shopName" label="ชื่อร้าน">
                  <Input id="shopName" name="shopName" defaultValue={settings.shopName} required />
                </FormField>

                <FormGrid>
                  <FormField id="openTime" label="เวลาเปิด">
                    <Input id="openTime" name="openTime" defaultValue={settings.openTime} required placeholder="09:00" />
                  </FormField>
                  <FormField id="closeTime" label="เวลาปิด">
                    <Input id="closeTime" name="closeTime" defaultValue={settings.closeTime} required placeholder="19:00" />
                  </FormField>
                </FormGrid>

                <FormGrid>
                  <FormField id="queueIntakeEnabled" label="รับคิวจากลูกค้า">
                    <Select name="queueIntakeEnabled" defaultValue={String(settings.queueIntakeEnabled)} required>
                      <SelectTrigger id="queueIntakeEnabled">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        {booleanOptions.map((option) => (
                          <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField id="bookingEnabled" label="จองเวลา">
                    <Select name="bookingEnabled" defaultValue={String(settings.bookingEnabled)} required>
                      <SelectTrigger id="bookingEnabled">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        {booleanOptions.map((option) => (
                          <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormGrid>

                <FormGrid>
                  <FormField id="walkInEnabled" label="รับคิววันนี้">
                    <Select name="walkInEnabled" defaultValue={String(settings.walkInEnabled)} required>
                      <SelectTrigger id="walkInEnabled">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        {booleanOptions.map((option) => (
                          <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField id="manualWaitMinutes" label="เวลารอที่ตั้งเอง" description="เว้นว่าง = ใช้ค่าคำนวณจากคิว">
                    <Input
                      id="manualWaitMinutes"
                      name="manualWaitMinutes"
                      defaultValue={settings.manualWaitMinutes ?? ""}
                      inputMode="numeric"
                      min={0}
                      max={240}
                      placeholder="เช่น 30"
                      type="number"
                    />
                  </FormField>
                </FormGrid>

                <Button type="submit" size="lg" fullWidth>
                  <Icon icon="lucide:save" aria-hidden="true" />บันทึกตั้งค่า
                </Button>
              </FormStack>
            </form>
          </Panel>

          <div className="bqa-owner-support-stack bqa-owner-support-stack--visible-mobile">
            <Panel className="bqa-owner-support-panel">
              <SectionHeader title="ผลของการตั้งค่า" note="ใช้ควบคุมหน้าลูกค้าแบบเร็ว" action={<Icon icon="lucide:settings" className="bqa-muted-icon" aria-hidden="true" />} />
              <div className="bqa-owner-step-list">
                <div className="bqa-owner-step-row">
                  <span>1</span>
                  <p>
                    <strong>รับคิวจากลูกค้า</strong>
                    <small>ปิดแล้วลูกค้าจองหรือรับคิวเองไม่ได้ แต่ owner ยังเพิ่มคิวได้</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span>2</span>
                  <p>
                    <strong>เวลารอที่ตั้งเอง</strong>
                    <small>ใช้แทนค่าคำนวณเมื่อวันนั้นคิวยาวหรือช้ากว่าปกติ</small>
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="bqa-owner-support-panel">
              <SectionHeader title="บริการ" note="จัดการรายการบริการ ราคา และเวลาที่ลูกค้าเลือกได้" action={<Icon icon="lucide:scissors" className="bqa-muted-icon" aria-hidden="true" />} />
              <Button asChild variant="outline" fullWidth>
                <Link href="/owner/settings/services">
                  <Icon icon="lucide:list-plus" aria-hidden="true" />จัดการบริการ
                </Link>
              </Button>
            </Panel>
          </div>
        </OwnerGrid>
      </div>
    </main>
  );
};

export default OwnerSettingsPage;
