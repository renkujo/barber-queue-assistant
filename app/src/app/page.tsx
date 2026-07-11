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
  const statusLabel = !shopOpenNow ? "ร้านปิดอยู่" : intakeOpen ? "เปิดรับคิว" : "ปิดรับคิว";
  const statusTitle = !shopOpenNow ? "ตอนนี้ร้านปิดอยู่" : intakeOpen ? "คิวตอนนี้ยังรับได้" : "ตอนนี้ร้านปิดรับคิว";
  const statusDescription = !shopOpenNow
    ? `${shopStatus.openLabel} ยังจองเวลาล่วงหน้าได้ แต่รับ walk-in เฉพาะช่วงร้านเปิด`
    : intakeOpen
      ? `${shopStatus.openLabel} ลูกค้าดูสถานะคิวเองได้จากหน้านี้`
      : "เจ้าของร้านปิดรับคิวจากลูกค้าชั่วคราว กลับมาเช็คใหม่อีกครั้งภายหลัง";

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

        {!shopOpenNow ? <Notice tone="warm">ตอนนี้อยู่นอกเวลาเปิดร้าน รับคิวหน้าร้านได้เฉพาะช่วงร้านเปิด แต่ยังจองเวลาล่วงหน้าได้</Notice> : null}
        {shopOpenNow && !intakeOpen ? <Notice tone="warm">ยังดูสถานะคิวเดิมได้ แต่ตอนนี้ไม่สามารถจองหรือรับคิวใหม่จากหน้านี้ได้</Notice> : null}

        <StatGrid aria-label="สถานะคิว">
          <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={shopStatus.currentQueueCount} unit="คน" />
          <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={shopStatus.estimatedWaitMinutes} unit="นาที" />
        </StatGrid>

        <section className="bqa-action-list" aria-label="customer actions">
          <ActionCard href="/book" icon={<Icon icon="lucide:calendar" aria-hidden="true" />} title="จองเวลา" description="เลือกเวลาล่วงหน้า" />
          {walkInOpen ? (
            <ActionCard href="/walk-in" icon={<Icon icon="lucide:users" aria-hidden="true" />} title="รับคิววันนี้" description="รับคิวและรอที่ร้าน" tone="warm" />
          ) : (
            <Button type="button" disabled className="bqa-action-card bqa-tone-warm">
              <span className="bqa-action-icon"><Icon icon="lucide:users" aria-hidden="true" /></span>
              <span className="bqa-action-copy">
                <strong>รับคิววันนี้</strong>
                <span>{shopOpenNow ? "ปิดรับคิวจากลูกค้า" : "รับเฉพาะช่วงร้านเปิด"}</span>
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
