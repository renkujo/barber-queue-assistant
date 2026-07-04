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
  const intakeOpen = intakeSettings.queueIntakeEnabled;

  return (
    <ScreenShell>
      <AppCard labelledBy="customer-title">
        <PageHeader
          id="customer-title"
          title="จองคิวตัดผม"
          subtitle={shopStatus.shopName}
          imageSrc={brandMarkPath}
          badge={<StatusBadge tone={intakeOpen ? "positive" : "warning"}>{intakeOpen ? "เปิดรับคิว" : "ปิดรับคิว"}</StatusBadge>}
          largeImage
        />

        <StatusPanel
          title={intakeOpen ? "คิวตอนนี้ยังรับได้" : "ตอนนี้ร้านปิดรับคิว"}
          description={intakeOpen ? `${shopStatus.openLabel} ลูกค้าดูสถานะคิวเองได้จากหน้านี้` : "เจ้าของร้านปิดรับคิวจากลูกค้าชั่วคราว กลับมาเช็คใหม่อีกครั้งภายหลัง"}
          imageSrc={statusMascotPath}
        />

        {!intakeOpen ? <Notice tone="warm">ยังดูสถานะคิวเดิมได้ แต่ตอนนี้ไม่สามารถจองหรือรับคิวใหม่จากหน้านี้ได้</Notice> : null}

        <StatGrid aria-label="สถานะคิว">
          <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={shopStatus.currentQueueCount} unit="คน" />
          <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={shopStatus.estimatedWaitMinutes} unit="นาที" />
        </StatGrid>

        <section className="bqa-action-list" aria-label="customer actions">
          <ActionCard href="/book" icon={<Icon icon="lucide:calendar" aria-hidden="true" />} title="จองเวลา" description="เลือกเวลาล่วงหน้า" />
          <ActionCard href="/walk-in" icon={<Icon icon="lucide:users" aria-hidden="true" />} title="รับคิววันนี้" description="รับคิวและรอที่ร้าน" tone="warm" />
        </section>

        <Panel aria-labelledby="service-title">
          <SectionHeader id="service-title" title="บริการยอดนิยม" note="ประมาณเวลา" />
          <div className="bqa-service-list">
            {services.map((service) => (
              <ServiceRow
                icon={<Icon icon="lucide:scissors" aria-hidden="true" />}
                key={service.id}
                name={service.name}
                price={service.priceLabel}
                duration={`${service.durationMinutes} นาที`}
              />
            ))}
          </div>
        </Panel>

        <Panel aria-labelledby="tracking-title">
          <SectionHeader id="tracking-title" title="เช็คคิวของฉัน" note="กรอกรหัสคิวเพื่อดูสถานะล่าสุด" />
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
