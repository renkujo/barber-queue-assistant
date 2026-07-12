import {
  ActionCard,
  AppCard,
  FormStack,
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
import { getQueueStatusSnapshotSafe, getServicesSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { lookupQueueAction } from "./actions";

const brandMarkPath = "/assets/generated-v1/app-icon-pastel.png";
const statusMascotPath = "/assets/mascot/queue-ticket-mascot-v1.png";

type HomePageProps = {
  searchParams: Promise<{ error?: string; queueCode?: string }>;
};

const trackingErrorMessages: Record<string, string> = {
  "queue-code-required": "กรอกรหัสคิวก่อนเช็คสถานะ",
  "queue-not-found": "ไม่พบคิวจากรหัสนี้ ลองตรวจรหัสอีกครั้ง",
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  const [params, snapshot, services, intakeSettings] = await Promise.all([
    searchParams,
    getQueueStatusSnapshotSafe(),
    getServicesSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const shopStatus = snapshot.shop;
  const trackingError = params.error ? trackingErrorMessages[params.error] : null;
  const shopOpenNow = intakeSettings.isOpenNow;
  const intakeOpen = intakeSettings.queueIntakeEnabled;
  const walkInOpen = intakeSettings.walkInAvailable;
  const inStoreOnly = intakeSettings.inStoreOnly;
  const statusLabel = !shopOpenNow ? "ร้านปิดอยู่" : inStoreOnly ? "รับเฉพาะหน้าร้าน" : walkInOpen ? "เปิดรับคิวออนไลน์" : "ปิดรับคิวออนไลน์";
  const statusTitle = !shopOpenNow
    ? "ตอนนี้ร้านปิดอยู่"
    : inStoreOnly
      ? "วันนี้รับเฉพาะลูกค้าที่หน้าร้าน"
      : walkInOpen
        ? "รับบัตรคิวออนไลน์ได้"
        : "วันนี้ปิดรับคิวออนไลน์";
  const statusDescription = !shopOpenNow
    ? inStoreOnly
      ? `${shopStatus.openLabel} วันนี้ไม่เปิดจองหรือรับบัตรคิวผ่านเว็บ กรุณามาที่ร้านในเวลาเปิด`
      : `${shopStatus.openLabel} ยังเลือกดูเวลาจองล่วงหน้าได้ แต่รับบัตรคิวออนไลน์เฉพาะช่วงร้านเปิด`
    : inStoreOnly
      ? "ไม่เปิดจองหรือรับบัตรคิวผ่านเว็บ กรุณาเข้ามาสอบถามคิวที่ร้านได้เลย"
    : walkInOpen
      ? `${shopStatus.openLabel} ลูกค้าดูสถานะคิวเองได้จากหน้านี้`
      : "วันนี้ไม่รับคิวใหม่ผ่านเว็บ แต่ยังเช็คสถานะคิวเดิมได้";

  return (
    <ScreenShell>
      <AppCard labelledBy="customer-title">
        <PageHeader
          id="customer-title"
          title="จองคิวตัดผม"
          subtitle={shopStatus.shopName}
          imageSrc={brandMarkPath}
          badge={<StatusBadge tone={walkInOpen ? "positive" : "warning"}>{statusLabel}</StatusBadge>}
          largeImage
        />

        <StatusPanel
          title={statusTitle}
          description={statusDescription}
          imageSrc={statusMascotPath}
        />

        {!shopOpenNow ? <Notice tone="warm">ตอนนี้อยู่นอกเวลาเปิดร้าน กรุณากลับมาในเวลา {shopStatus.openLabel.replace("เปิด ", "")}</Notice> : null}
        {shopOpenNow && !intakeOpen ? <Notice tone="warm">ยังดูสถานะคิวเดิมได้ แต่ตอนนี้ไม่สามารถจองหรือรับคิวใหม่จากหน้านี้ได้</Notice> : null}
        {shopOpenNow && inStoreOnly ? <Notice tone="warm">วันนี้รับเฉพาะลูกค้าที่เดินเข้าร้าน ไม่ต้องรับบัตรคิวผ่านเว็บ</Notice> : null}
        {shopOpenNow && intakeOpen && !inStoreOnly && !walkInOpen ? <Notice tone="warm">วันนี้ปิดรับบัตรคิวออนไลน์ แต่ยังดูสถานะคิวเดิมได้</Notice> : null}

        <StatGrid aria-label="สถานะคิว">
          <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={shopStatus.currentQueueCount} unit="คน" />
          <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={shopStatus.estimatedWaitMinutes} unit="นาที" />
        </StatGrid>

        <section className="bqa-action-list" aria-label="customer actions">
          <ActionCard href="/book" icon={<Icon icon="lucide:calendar" aria-hidden="true" />} title="จองล่วงหน้า" description="เลือกวันที่และเวลาที่เปิดจอง" />
          {walkInOpen ? (
            <ActionCard href="/walk-in" icon={<Icon icon="lucide:users" aria-hidden="true" />} title="รับบัตรคิวออนไลน์" description="รับบัตรคิวก่อนมาที่ร้าน" tone="warm" />
          ) : (
            <Button type="button" disabled className="bqa-action-card bqa-tone-warm">
              <span className="bqa-action-icon"><Icon icon="lucide:users" aria-hidden="true" /></span>
              <span className="bqa-action-copy">
                <strong>รับบัตรคิวออนไลน์</strong>
                <span>{inStoreOnly ? "วันนี้รับเฉพาะลูกค้าที่หน้าร้าน" : shopOpenNow ? "วันนี้ปิดรับผ่านเว็บ" : "เปิดรับเฉพาะช่วงร้านเปิด"}</span>
              </span>
            </Button>
          )}
        </section>

        <Panel aria-labelledby="service-title">
          <SectionHeader id="service-title" title="บริการยอดนิยม" note="ประมาณเวลา" />
          <div className="bqa-service-list">
            {services.length ? services.map((service) => (
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

        <Panel id="queue-status" aria-labelledby="tracking-title">
          <SectionHeader id="tracking-title" title="เช็คคิวของฉัน" note="กรอกรหัสคิวเพื่อดูว่าถึงคิวหรือยัง" />
          {trackingError ? <Notice>{trackingError}</Notice> : null}
          <RouteToast message={trackingError} type="error" toastKey={`home:${params.error ?? ""}`} />
          <form action={lookupQueueAction}>
            <FormField id="queue-code" label="รหัสคิว">
              <FormStack className="bqa-check-form-row">
                <Input id="queue-code" name="queueCode" defaultValue={params.queueCode ?? ""} placeholder="เช่น A08" />
                <Button type="submit">
                  <Icon icon="lucide:search" aria-hidden="true" />เช็ค
                </Button>
              </FormStack>
            </FormField>
          </form>
        </Panel>
      </AppCard>
    </ScreenShell>
  );
};

export default HomePage;
