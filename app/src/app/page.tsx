import Link from "next/link";
import {
  ActionCard,
  AppCard,
  FormGrid,
  Notice,
  PageHeader,
  Panel,
  ScreenShell,
  SectionHeader,
  ServiceRow,
  StatGrid,
  StatTile,
  StatusBadge,
  StatusPanel,
} from "@/components/barber/app-ui";
import { Button, FormField, Icon, Input } from "@/components/ui";
import { RouteToast } from "@/components/ui";
import { getQueueStatusSnapshotSafe, getServicesWithSourceSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { lookupQueueAction } from "./actions";

const brandMarkPath = "/icon.png";
const statusMascotPath = "/assets/mascot/queue-ticket-mascot-v1.png";

type HomePageProps = {
  searchParams: Promise<{ error?: string; queueCode?: string }>;
};

const trackingErrorMessages: Record<string, string> = {
  "queue-code-required": "กรอกรหัสคิวและ PIN 4 ตัวก่อนเช็คสถานะ",
  "queue-not-found": "ไม่พบคิวจากข้อมูลนี้ ลองตรวจรหัสคิวและ PIN อีกครั้ง",
  "queue-lookup-rate-limited": "เช็คคิวหลายครั้งเกินไป กรุณารอประมาณ 10 นาทีแล้วลองใหม่",
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  const [params, snapshot, serviceResult, intakeSettings] = await Promise.all([
    searchParams,
    getQueueStatusSnapshotSafe(),
    getServicesWithSourceSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const services = serviceResult.services;
  const shopStatus = snapshot.shop;
  const trackingError = params.error ? trackingErrorMessages[params.error] : null;
  const statusUnavailable = snapshot.source !== "database" || intakeSettings.source !== "database";
  const servicesUnavailable = serviceResult.source !== "database";
  const shopOpenNow = !statusUnavailable && intakeSettings.isOpenNow;
  const intakeOpen = !statusUnavailable && intakeSettings.queueIntakeEnabled;
  const bookingOpen = !statusUnavailable && intakeSettings.queueIntakeEnabled && intakeSettings.bookingEnabled;
  const walkInOpen = !statusUnavailable && intakeSettings.walkInAvailable;
  const inStoreOnly = intakeSettings.inStoreOnly;
  const statusLabel = statusUnavailable
    ? "ตรวจสถานะร้านไม่ได้"
    : !shopOpenNow
      ? bookingOpen ? "ร้านปิด · ยังจองล่วงหน้าได้" : "ร้านปิดอยู่"
      : inStoreOnly
        ? bookingOpen ? "วันนี้หน้าร้าน · ยังจองล่วงหน้าได้" : "รับเฉพาะหน้าร้าน"
        : bookingOpen && walkInOpen
          ? "เปิดจองและรับคิวออนไลน์"
          : bookingOpen
            ? "เปิดจองล่วงหน้า"
            : walkInOpen
              ? "เปิดรับคิวออนไลน์"
              : "ปิดรับออนไลน์";
  const statusTitle = statusUnavailable
    ? "ยังตรวจสถานะร้านไม่ได้"
    : !shopOpenNow
    ? "ตอนนี้ร้านปิดอยู่"
    : inStoreOnly
      ? bookingOpen ? "วันนี้รับหน้าร้าน และยังจองล่วงหน้าได้" : "วันนี้รับเฉพาะลูกค้าที่หน้าร้าน"
      : bookingOpen && walkInOpen
        ? "จองล่วงหน้าหรือรับบัตรคิวออนไลน์ได้"
        : bookingOpen
          ? "วันนี้ยังจองล่วงหน้าได้"
          : walkInOpen
            ? "รับบัตรคิวออนไลน์ได้"
            : "วันนี้ปิดรับออนไลน์";
  const statusDescription = statusUnavailable
    ? "ระบบอ่านสถานะร้านไม่สำเร็จ จึงปิดการเริ่มคิวใหม่ชั่วคราวเพื่อไม่แสดงข้อมูลที่อาจคลาดเคลื่อน"
    : !shopOpenNow
    ? inStoreOnly
      ? `${shopStatus.openLabel} วันนี้ไม่เปิดจองหรือรับบัตรคิวผ่านเว็บ กรุณามาที่ร้านในเวลาเปิด`
      : bookingOpen
        ? `${shopStatus.openLabel} ยังเลือกจองล่วงหน้าได้ แต่รับบัตรคิวออนไลน์เฉพาะช่วงร้านเปิด`
        : `${shopStatus.openLabel} ยังเช็คสถานะคิวเดิมได้จากหน้านี้`
    : inStoreOnly
      ? bookingOpen
        ? "วันนี้ไม่รับบัตรคิวออนไลน์ แต่ยังเลือกจองวันล่วงหน้าที่เปิดรับได้"
        : "ไม่เปิดจองหรือรับบัตรคิวผ่านเว็บ กรุณาเข้ามาสอบถามคิวที่ร้านได้เลย"
      : bookingOpen && walkInOpen
        ? `${shopStatus.openLabel} ลูกค้าเลือกจองหรือรับบัตรคิว และดูสถานะคิวเองได้จากหน้านี้`
        : bookingOpen
          ? "เปิดจองล่วงหน้า แต่วันนี้ไม่รับบัตรคิวออนไลน์"
          : walkInOpen
            ? "วันนี้รับบัตรคิวออนไลน์ แต่ปิดจองล่วงหน้า"
            : "วันนี้ไม่รับคิวใหม่ผ่านเว็บ แต่ยังเช็คสถานะคิวเดิมได้";

  return (
    <ScreenShell className="bqa-home-shell bqa-customer-home-v2" visualVersion="v2">
      <AppCard labelledBy="customer-title" className="bqa-home-card">
        <PageHeader
          id="customer-title"
          title="จองคิวตัดผม"
          subtitle={shopStatus.shopName}
          imageSrc={brandMarkPath}
          badge={<StatusBadge tone={bookingOpen || walkInOpen ? "positive" : "warning"}>{statusLabel}</StatusBadge>}
          largeImage
        />

        <div className="bqa-home-layout">
          <section className="bqa-home-primary" aria-label="สถานะและการรับคิว">
            <StatusPanel
              title={statusTitle}
              description={statusDescription}
              imageSrc={statusMascotPath}
            />

            {statusUnavailable ? <Notice>ขณะนี้ตรวจสถานะระบบไม่ได้ กรุณาลองใหม่ภายหลัง หรือสอบถามร้านโดยตรง</Notice> : null}
            {!statusUnavailable && !shopOpenNow ? <Notice tone="warm">ตอนนี้อยู่นอกเวลาเปิดร้าน กรุณากลับมาในเวลา {shopStatus.openLabel.replace("เปิด ", "")}</Notice> : null}
            {!statusUnavailable && shopOpenNow && !intakeOpen ? <Notice tone="warm">ยังดูสถานะคิวเดิมได้ แต่ตอนนี้ไม่สามารถจองหรือรับคิวใหม่จากหน้านี้ได้</Notice> : null}
            {!statusUnavailable && shopOpenNow && inStoreOnly ? <Notice tone="warm">{bookingOpen ? "วันนี้รับลูกค้าที่หน้าร้าน แต่ยังจองวันล่วงหน้าที่เปิดรับได้" : "วันนี้รับเฉพาะลูกค้าที่เดินเข้าร้าน ไม่ต้องจองหรือรับบัตรคิวผ่านเว็บ"}</Notice> : null}
            {!statusUnavailable && shopOpenNow && intakeOpen && !inStoreOnly && bookingOpen && !walkInOpen ? <Notice tone="warm">วันนี้ปิดรับบัตรคิวออนไลน์ แต่ยังจองล่วงหน้าได้</Notice> : null}
            {!statusUnavailable && shopOpenNow && intakeOpen && !inStoreOnly && !bookingOpen && walkInOpen ? <Notice tone="warm">วันนี้ปิดจองล่วงหน้า แต่ยังรับบัตรคิวออนไลน์ได้</Notice> : null}

            <StatGrid aria-label="สถานะคิว">
              <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={statusUnavailable ? "—" : shopStatus.currentQueueCount} unit={statusUnavailable ? undefined : "คน"} />
              <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={statusUnavailable ? "—" : shopStatus.estimatedWaitMinutes} unit={statusUnavailable ? undefined : "นาที"} />
            </StatGrid>

            <section className="bqa-action-list bqa-home-actions" aria-label="customer actions">
              {bookingOpen ? (
                <ActionCard href="/book" icon={<Icon icon="lucide:calendar" aria-hidden="true" />} title="จองล่วงหน้า" description="เลือกวันที่และเวลาที่เปิดจอง" />
              ) : (
                <Button type="button" disabled className="bqa-action-card bqa-tone-neutral">
                  <span className="bqa-action-icon"><Icon icon="lucide:calendar" aria-hidden="true" /></span>
                  <span className="bqa-action-copy">
                    <strong>จองล่วงหน้า</strong>
                    <span>{statusUnavailable ? "ยังตรวจระบบจองไม่ได้" : inStoreOnly ? "วันนี้รับเฉพาะลูกค้าที่หน้าร้าน" : !intakeOpen ? "วันนี้ปิดรับผ่านเว็บ" : "วันนี้ปิดรับจองล่วงหน้า"}</span>
                  </span>
                </Button>
              )}
              {walkInOpen ? (
                <ActionCard href="/walk-in" icon={<Icon icon="lucide:users" aria-hidden="true" />} title="รับบัตรคิวออนไลน์" description="รับบัตรคิวก่อนมาที่ร้าน" tone="warm" />
              ) : (
                <Button type="button" disabled className="bqa-action-card bqa-tone-warm">
                  <span className="bqa-action-icon"><Icon icon="lucide:users" aria-hidden="true" /></span>
                  <span className="bqa-action-copy">
                    <strong>รับบัตรคิวออนไลน์</strong>
                    <span>{statusUnavailable ? "ยังตรวจระบบคิวไม่ได้" : inStoreOnly ? "วันนี้รับเฉพาะลูกค้าที่หน้าร้าน" : shopOpenNow ? "วันนี้ปิดรับผ่านเว็บ" : "เปิดรับเฉพาะช่วงร้านเปิด"}</span>
                  </span>
                </Button>
              )}
            </section>
          </section>

          <div className="bqa-home-secondary">
            <Panel className="bqa-home-services" aria-labelledby="service-title">
              <SectionHeader id="service-title" title="บริการยอดนิยม" note="ราคาและเวลาที่ใช้โดยประมาณ" />
              <div className="bqa-service-list">
                {servicesUnavailable ? <Notice>ยังโหลดรายการบริการไม่ได้ กรุณาลองใหม่ภายหลัง</Notice> : services.length ? services.map((service) => (
                  <ServiceRow
                    icon={<Icon icon="lucide:scissors" aria-hidden="true" />}
                    key={service.id}
                    name={service.name}
                    price={service.priceLabel}
                    duration={`${service.durationMinutes} นาที`}
                  />
                )) : <Notice tone="warm">ตอนนี้ยังไม่มีบริการที่เปิดใช้</Notice>}
              </div>
            </Panel>

            <Panel className="bqa-home-tracking" id="queue-status" aria-labelledby="tracking-title">
              <SectionHeader id="tracking-title" title="เช็คคิวของฉัน" note="ใช้รหัสคิวและ PIN 4 ตัวจากหน้าคิว" />
              {trackingError ? <Notice>{trackingError}</Notice> : null}
              <RouteToast message={trackingError} type="error" toastKey={`home:${params.error ?? ""}`} />
              <form action={lookupQueueAction}>
                <FormGrid>
                  <FormField id="queue-code" label="รหัสคิว">
                    <Input
                      id="queue-code"
                      name="queueCode"
                      autoCapitalize="characters"
                      autoComplete="off"
                      defaultValue={params.queueCode ?? ""}
                      maxLength={12}
                      placeholder="เช่น Q8F2A1C"
                      required
                      spellCheck={false}
                    />
                  </FormField>
                  <FormField id="access-pin" label="PIN เช็คคิว 4 ตัว">
                    <Input id="access-pin" name="accessPin" inputMode="numeric" autoComplete="one-time-code" minLength={4} maxLength={4} pattern="[0-9]{4}" required placeholder="เช่น 1234" />
                  </FormField>
                </FormGrid>
                <Button type="submit">
                  <Icon icon="lucide:search" aria-hidden="true" />เช็คสถานะคิว
                </Button>
              </form>
              <p className="bqa-privacy-note">PIN ใช้คู่กับรหัสคิวเพื่อลดการเปิดดูคิวของผู้อื่นโดยไม่ได้รับอนุญาต</p>
            </Panel>

            <p className="bqa-privacy-note bqa-privacy-note--footer">
              <Link href="/privacy">ประกาศความเป็นส่วนตัว</Link>
            </p>
          </div>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default HomePage;
