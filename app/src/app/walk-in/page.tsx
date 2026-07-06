import Link from "next/link";
import { AppCard, FormGrid, FormStack, Notice, PageHeader, ScreenShell, StatGrid, StatTile } from "@/components/barber/app-ui";
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
  Textarea,
} from "@/components/ui";
import { getQueueStatusSnapshotSafe, getServicesSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { createWalkInAction } from "./actions";

type WalkInPageProps = {
  searchParams: Promise<{ error?: string; lineUserId?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อและบริการอีกครั้ง",
  closed: "ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว ลองเช็คอีกครั้งภายหลัง",
  database: "ยังรับคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const WalkInPage = async ({ searchParams }: WalkInPageProps) => {
  const [params, services, snapshot, intakeSettings] = await Promise.all([
    searchParams,
    getServicesSafe(),
    getQueueStatusSnapshotSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const lineUserId = params.lineUserId?.trim();
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const walkInClosed = !intakeSettings.walkInAvailable;

  return (
    <ScreenShell className="bqa-book-shell">
      <AppCard labelledBy="walk-in-title" className="bqa-book-card bqa-walk-in-card">
        <PageHeader
          id="walk-in-title"
          title="เข้าคิวหน้าร้าน"
          subtitle="รับคิววันนี้"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับ
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {walkInClosed ? <Notice tone="warm">ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านจะเปิดรับอีกครั้งเมื่อพร้อม</Notice> : null}
        {!hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังรับคิวจากลูกค้าไม่ได้</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`walk-in:${params.error ?? ""}`} />

        <div className="bqa-book-layout">
          <aside className="bqa-book-guide bqa-walk-in-guide" aria-label="สถานะคิวตอนนี้">
            <div>
              <span>สถานะหน้าร้าน</span>
              <strong>{walkInClosed ? "ปิดรับคิว" : "รับคิวอยู่"}</strong>
            </div>
            <StatGrid className="bqa-stat-grid--flush bqa-walk-in-status-grid">
              <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={snapshot.shop.currentQueueCount} unit="คน" />
              <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={snapshot.shop.estimatedWaitMinutes} unit="นาที" />
            </StatGrid>
          </aside>

        <form action={createWalkInAction} className="bqa-book-form">
          {lineUserId ? <input type="hidden" name="lineUserId" value={lineUserId} /> : null}
          <FormStack className="bqa-book-form-stack">
            <section className="bqa-book-section" aria-labelledby="walk-in-service-title">
              <div className="bqa-book-section-heading">
                <h2 id="walk-in-service-title">บริการที่ต้องการ</h2>
                <p>เลือกบริการที่จะเข้าคิววันนี้</p>
              </div>

              <FormField id="serviceId" label="บริการ">
                <Select name="serviceId" defaultValue={defaultServiceId} required>
                  <SelectTrigger id="serviceId"><SelectValue placeholder="เลือกบริการ" /></SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem value={service.id} key={service.id}>{service.name} · {service.durationMinutes} นาที · {service.priceLabel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </section>

            <section className="bqa-book-section" aria-labelledby="walk-in-contact-title">
              <div className="bqa-book-section-heading">
                <h2 id="walk-in-contact-title">ข้อมูลติดต่อ</h2>
                <p>ใช้เรียกคิวและติดต่อกลับหากคิวเปลี่ยน</p>
              </div>

              <FormGrid>
                <FormField id="customerName" label="ชื่อ">
                  <Input id="customerName" name="customerName" required placeholder="ชื่อของคุณ" />
                </FormField>
                <FormField id="phone" label="เบอร์โทร">
                  <Input id="phone" name="phone" inputMode="tel" placeholder="เบอร์สำหรับติดต่อ" />
                </FormField>
              </FormGrid>
              <FormField id="note" label="หมายเหตุ">
                <Textarea id="note" name="note" placeholder="เช่น รอที่ร้านแล้ว" />
              </FormField>
            </section>

          <Button type="submit" size="lg" fullWidth disabled={walkInClosed || !hasServices}>
            <Icon icon="lucide:users" aria-hidden="true" />รับคิววันนี้
          </Button>
          </FormStack>
        </form>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default WalkInPage;
