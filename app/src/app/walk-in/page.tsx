import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AppCard, Notice, PageHeader, ScreenShell, StatGrid, StatTile } from "@/components/barber/app-ui";
import { Button, Icon } from "@/components/ui";
import { parseQueueEntrySource } from "@/lib/pilot/entry-source";
import { getQueueStatusSnapshotSafe, getServicesWithSourceSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { walkInErrorMessages } from "./walk-in-contract";
import { WalkInForm } from "./walk-in-form";

type WalkInPageProps = {
  searchParams: Promise<{ error?: string; source?: string }>;
};

const WalkInPage = async ({ searchParams }: WalkInPageProps) => {
  const [params, serviceResult, snapshot, intakeSettings] = await Promise.all([
    searchParams,
    getServicesWithSourceSafe(),
    getQueueStatusSnapshotSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const services = serviceResult.services;
  const entrySource = parseQueueEntrySource(params.source);
  const operationId = randomUUID();
  const errorMessage = params.error && params.error in walkInErrorMessages
    ? walkInErrorMessages[params.error as keyof typeof walkInErrorMessages]
    : null;
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const statusUnavailable = snapshot.source !== "database" || intakeSettings.source !== "database";
  const servicesUnavailable = serviceResult.source !== "database";
  const walkInClosed = statusUnavailable || !intakeSettings.walkInAvailable;
  const inStoreOnly = intakeSettings.inStoreOnly;
  const effectiveInStoreOnly = !statusUnavailable && intakeSettings.isOpenNow && inStoreOnly;
  const walkInClosedMessage = statusUnavailable
    ? "ขณะนี้ตรวจสถานะร้านไม่ได้ จึงปิดการรับบัตรคิวใหม่ชั่วคราว กรุณาลองใหม่ภายหลัง"
    : !intakeSettings.isOpenNow
      ? `ตอนนี้อยู่นอกเวลาเปิดร้าน (${intakeSettings.openLabel}) รับบัตรคิวออนไลน์ได้เฉพาะช่วงร้านเปิด`
      : inStoreOnly
        ? "วันนี้รับเฉพาะลูกค้าที่เดินเข้าร้าน ไม่เปิดรับบัตรคิวผ่านเว็บ กรุณาเข้ามาสอบถามคิวที่ร้านได้เลย"
      : "วันนี้ปิดรับบัตรคิวออนไลน์ กรุณากลับมาเช็คใหม่ภายหลัง";
  const canSubmit = !walkInClosed && !servicesUnavailable && hasServices;

  return (
    <ScreenShell className="bqa-book-shell bqa-customer-walkin-v2" visualVersion="v2">
      <AppCard labelledBy="walk-in-title" className="bqa-book-card bqa-walk-in-card">
        <PageHeader
          id="walk-in-title"
          title="รับบัตรคิวออนไลน์"
          subtitle={effectiveInStoreOnly ? "วันนี้รับเฉพาะหน้าร้าน" : "คิวสำหรับวันนี้"}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับ
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {walkInClosed ? <Notice tone={statusUnavailable ? undefined : "warm"}>{walkInClosedMessage}</Notice> : null}
        {servicesUnavailable ? <Notice>ยังโหลดรายการบริการไม่ได้ จึงปิดการรับบัตรคิวใหม่ชั่วคราว</Notice> : null}
        {!servicesUnavailable && !hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังรับคิวจากลูกค้าไม่ได้</Notice> : null}
        <div className="bqa-book-layout">
          <aside className="bqa-book-guide bqa-walk-in-guide" aria-label="สถานะคิวตอนนี้">
            <div>
              <span>สถานะหน้าร้าน</span>
              <strong>{statusUnavailable ? "ตรวจสถานะไม่ได้" : !intakeSettings.isOpenNow ? "ร้านปิดอยู่" : effectiveInStoreOnly ? "รับเฉพาะหน้าร้าน" : walkInClosed ? "ปิดรับออนไลน์" : "รับคิวออนไลน์อยู่"}</strong>
            </div>
            <StatGrid className="bqa-stat-grid--flush bqa-walk-in-status-grid">
              <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={statusUnavailable ? "—" : snapshot.shop.currentQueueCount} unit={statusUnavailable ? undefined : "คน"} />
              <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={statusUnavailable ? "—" : snapshot.shop.estimatedWaitMinutes} unit={statusUnavailable ? undefined : "นาที"} />
            </StatGrid>
          </aside>

        {effectiveInStoreOnly ? (
          <section className="bqa-book-form bqa-book-section" aria-labelledby="in-store-only-title">
            <div className="bqa-book-section-heading">
              <h2 id="in-store-only-title">เข้ามาที่ร้านได้เลย</h2>
              <p>วันนี้ร้านไม่ใช้ระบบจองหรือบัตรคิวออนไลน์ ลูกค้าสามารถเข้ามาสอบถามลำดับคิวกับทางร้านได้โดยตรง</p>
            </div>
            <Button asChild variant="outline" size="lg" fullWidth>
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับหน้าแรก
              </Link>
            </Button>
          </section>
        ) : (
          <WalkInForm
            canSubmit={canSubmit}
            entrySource={entrySource}
            operationId={operationId}
            defaultServiceId={defaultServiceId}
            services={servicesUnavailable ? [] : services}
          />
        )}
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default WalkInPage;
