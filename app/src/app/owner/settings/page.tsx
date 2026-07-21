import Link from "next/link";
import { FormGrid, FormStack, Notice, OwnerHeader, OwnerGrid, Panel, SectionHeader } from "@/components/barber/app-ui";
import {
  Button,
  FormField,
  Icon,
  Input,
  LineLogo,
  RouteToast,
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getOwnerShopSettingsSafe } from "@/lib/queue/repository";
import { updateOwnerSettingsAction } from "../actions";
import { OwnerShell } from "../_components/owner-shell";
import { BooleanSettingField } from "./boolean-setting-field";

export const dynamic = "force-dynamic";

type OwnerSettingsPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

type SettingsFormValues = Awaited<ReturnType<typeof getOwnerShopSettingsSafe>>;

const errorMessages: Record<string, string> = {
  database: "ยังบันทึกตั้งค่าไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  invalid: "ข้อมูลตั้งค่าไม่ถูกต้อง ตรวจชื่อร้าน เวลา และสถานะเปิด/ปิดอีกครั้ง",
  "invalid-wait": "เวลารอที่ตั้งเองต้องเป็นตัวเลข 0-240 นาที หรือเว้นว่างเพื่อใช้ค่าคำนวณ",
};

const statusMessages: Record<string, string> = {
  "settings-updated": "บันทึกตั้งค่าร้านแล้ว",
  "line-owner-connected": "เชื่อม LINE เจ้าของร้านแล้ว",
};

const maskLineUserId = (lineUserId: string | null) => {
  if (!lineUserId) {
    return "ยังไม่เชื่อม";
  }

  return `${lineUserId.slice(0, 4)}••••${lineUserId.slice(-4)}`;
};

const SettingsHub = ({ settings, ownerLineConnectHref }: { settings: SettingsFormValues; ownerLineConnectHref: string }) => (
  <div className="bqa-owner-settings-hub" aria-label="ทางลัดตั้งค่าร้าน">
    <a className="bqa-owner-settings-hub-row bqa-owner-settings-hub-row--line" href={ownerLineConnectHref} target="_blank" rel="noreferrer">
      <span className="bqa-owner-settings-hub-icon bqa-owner-settings-hub-icon--line" aria-hidden="true">
        <LineLogo className="bqa-line-logo" />
      </span>
      <span>
        <strong>LINE เจ้าของร้าน</strong>
        <small>สถานะ: {maskLineUserId(settings.ownerLineUserId)}</small>
      </span>
      <em>{settings.ownerLineUserId ? "เชื่อม LINE ใหม่" : "เชื่อม LINE เจ้าของร้าน"}</em>
    </a>

    <Link className="bqa-owner-settings-hub-row" href="/owner/settings/availability">
      <span className="bqa-owner-settings-hub-icon" aria-hidden="true">
        <Icon icon="lucide:calendar-days" />
      </span>
      <span>
        <strong>วันรับจอง / หน้าร้าน</strong>
        <small>กำหนดวันใช้ระบบออนไลน์หรือรับเฉพาะลูกค้าที่ร้าน</small>
      </span>
      <em>ตั้งค่าวันรับคิว</em>
    </Link>

    <Link className="bqa-owner-settings-hub-row" href="/owner/settings/services">
      <span className="bqa-owner-settings-hub-icon" aria-hidden="true">
        <Icon icon="lucide:scissors" />
      </span>
      <span>
        <strong>บริการ</strong>
        <small>จัดการรายการบริการ ราคา และเวลาที่ลูกค้าเลือกได้</small>
      </span>
      <em>จัดการบริการ</em>
    </Link>
  </div>
);

const SettingsImpactRail = ({ settings, ownerLineConnectHref }: { settings: SettingsFormValues; ownerLineConnectHref: string }) => (
  <aside className="bqa-owner-settings-rail" aria-label="ผลกระทบและช่องทางร้าน">
    <Panel className="bqa-owner-settings-rail-panel bqa-owner-settings-impact-panel">
      <SectionHeader title="ผลของการตั้งค่า" note="ใช้ควบคุมหน้าลูกค้าแบบเร็ว" action={<Icon icon="lucide:settings" className="bqa-muted-icon" aria-hidden="true" />} />
      <div className="bqa-owner-settings-impact-list">
        <div>
          <strong>ระบบรับคิวออนไลน์</strong>
          <small>ปิดแล้วลูกค้าใช้เว็บจองหรือรับบัตรคิวไม่ได้ แต่ร้านยังเปิดและ owner เพิ่มคิวเองได้</small>
        </div>
        <div>
          <strong>เวลารอที่ตั้งเอง</strong>
          <small>ใช้แทนค่าคำนวณเมื่อวันนั้นคิวยาวหรือช้ากว่าปกติ</small>
        </div>
      </div>
    </Panel>

    <Panel className="bqa-owner-settings-rail-panel">
      <SectionHeader title="LINE เจ้าของร้าน" note={`สถานะ: ${maskLineUserId(settings.ownerLineUserId)}`} action={<LineLogo className="bqa-line-logo bqa-line-logo--muted" aria-hidden="true" />} />
      <div className="bqa-owner-settings-line-state">
        <span className="bqa-line-badge"><LineLogo className="bqa-line-logo" aria-hidden="true" /></span>
        <p>
          <strong>{settings.ownerLineUserId ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}</strong>
          <small>รับแจ้งเตือนคิวใหม่ผ่าน LINE แม้ไม่ได้เปิดหน้า owner อยู่</small>
        </p>
      </div>
      <Button asChild variant={settings.ownerLineUserId ? "outline" : "default"} fullWidth className="bqa-owner-support-action">
        <a href={ownerLineConnectHref} target="_blank" rel="noreferrer">
          <LineLogo className="bqa-line-logo" aria-hidden="true" />{settings.ownerLineUserId ? "เชื่อม LINE ใหม่" : "เชื่อม LINE เจ้าของร้าน"}
        </a>
      </Button>
    </Panel>

    <Panel className="bqa-owner-settings-rail-panel">
      <SectionHeader title="วันรับจอง / หน้าร้าน" note="กำหนดวันใช้ระบบออนไลน์หรือรับเฉพาะลูกค้าที่ร้าน" action={<Icon icon="lucide:calendar-days" className="bqa-muted-icon" aria-hidden="true" />} />
      <Button asChild variant="outline" fullWidth className="bqa-owner-support-action">
        <Link href="/owner/settings/availability">
          <Icon icon="lucide:calendar-days" aria-hidden="true" />ตั้งค่าวันรับคิว
        </Link>
      </Button>
    </Panel>

    <Panel className="bqa-owner-settings-rail-panel">
      <SectionHeader title="บริการ" note="จัดการรายการบริการ ราคา และเวลาที่ลูกค้าเลือกได้" action={<Icon icon="lucide:list-plus" className="bqa-muted-icon" aria-hidden="true" />} />
      <Button asChild variant="outline" fullWidth className="bqa-owner-support-action">
        <Link href="/owner/settings/services">
          <Icon icon="lucide:list-plus" aria-hidden="true" />จัดการบริการ
        </Link>
      </Button>
    </Panel>
  </aside>
);

const OwnerSettingsPage = async ({ searchParams }: OwnerSettingsPageProps) => {
  await requireOwnerSession();

  const [params, settings] = await Promise.all([searchParams, getOwnerShopSettingsSafe()]);
  const ownerLineConnectHref = "/owner/settings/line-connect";
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <OwnerShell visualVersion="v2">
      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact bqa-owner-settings-page">
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

        <OwnerGrid className="bqa-owner-grid--workbench bqa-owner-settings-workbench">
          <Panel aria-labelledby="owner-settings-form-title" className="bqa-owner-settings-form-panel">
            <SectionHeader id="owner-settings-form-title" title="ค่าที่ใช้จริง" note="บันทึกแล้วจะกระทบหน้า owner และหน้าลูกค้าทันที" />

            <SettingsHub settings={settings} ownerLineConnectHref={ownerLineConnectHref} />

            <form action={updateOwnerSettingsAction} className="bqa-owner-settings-form">
              <FormStack>
                <section className="bqa-owner-settings-group" aria-labelledby="owner-settings-shop-group">
                  <div className="bqa-owner-settings-group-head">
                    <span aria-hidden="true"><Icon icon="lucide:store" /></span>
                    <div>
                      <h3 id="owner-settings-shop-group">ข้อมูลร้านและเวลา</h3>
                      <p>{settings.openTime}–{settings.closeTime}</p>
                    </div>
                  </div>
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
                </section>

                <section className="bqa-owner-settings-group" aria-labelledby="owner-settings-intake-group">
                  <div className="bqa-owner-settings-group-head">
                    <span aria-hidden="true"><Icon icon="lucide:radio-tower" /></span>
                    <div>
                      <h3 id="owner-settings-intake-group">ช่องทางออนไลน์ของลูกค้า</h3>
                      <p>สถานะจริงที่ลูกค้าเห็นจากหน้าเว็บ</p>
                    </div>
                  </div>
                  <div className="bqa-owner-settings-toggle-grid">
                    <BooleanSettingField id="queueIntakeEnabled" label="ระบบรับคิวออนไลน์" value={settings.queueIntakeEnabled} hint="ปิดแล้วการจองและบัตรคิวออนไลน์จะหยุด" />
                    <BooleanSettingField id="bookingEnabled" label="จองล่วงหน้าออนไลน์" value={settings.bookingEnabled} hint="ควบคุมการจองล่วงหน้าจากหน้าลูกค้า" />
                    <BooleanSettingField id="walkInEnabled" label="บัตรคิวออนไลน์วันนี้" value={settings.walkInEnabled} hint="ควบคุมการรับบัตรคิวออนไลน์สำหรับวันนี้" />
                  </div>
                </section>

                <section className="bqa-owner-settings-group bqa-owner-settings-group--wait" aria-labelledby="owner-settings-wait-group">
                  <div className="bqa-owner-settings-group-head">
                    <span aria-hidden="true"><Icon icon="lucide:timer" /></span>
                    <div>
                      <h3 id="owner-settings-wait-group">เวลารอหน้าร้าน</h3>
                      <p>{settings.manualWaitMinutes === null ? "ใช้ค่าคำนวณจากคิว" : `${settings.manualWaitMinutes} นาที`}</p>
                    </div>
                  </div>
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
                </section>

                <div className="bqa-owner-settings-submit-row">
                  <Button type="submit" size="lg" fullWidth>
                    <Icon icon="lucide:save" aria-hidden="true" />บันทึกตั้งค่า
                  </Button>
                </div>
              </FormStack>
            </form>
          </Panel>

          <SettingsImpactRail settings={settings} ownerLineConnectHref={ownerLineConnectHref} />
        </OwnerGrid>
      </div>
    </OwnerShell>
  );
};

export default OwnerSettingsPage;
