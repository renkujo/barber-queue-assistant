import Link from "next/link";
import { AppCard, FormGrid, FormStack, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { PrivacyNote } from "@/components/barber/privacy-note";
import {
  Button,
  FormField,
  Icon,
  Input,
  RouteToast,
  Textarea,
} from "@/components/ui";
import { getTomorrowValue, getTodayValue } from "@/lib/queue/date";
import {
  getAvailableBookingSlotsSafe,
  getCustomerDateAvailabilitySafe,
  getServicesSafe,
  getShopIntakeSettingsSafe,
} from "@/lib/queue/repository";
import { createBookingAction } from "./actions";
import { BookingDateTimeFields } from "./booking-date-time-fields";

type BookPageProps = {
  searchParams: Promise<{ error?: string; lineUserId?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อ บริการ วัน และเวลาอีกครั้ง",
  closed: "ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว ลองเช็คอีกครั้งภายหลัง",
  "slot-unavailable": "เวลานี้ถูกจองหรือถูกพักร้านแล้ว เลือกเวลาอื่นแล้วลองใหม่",
  "rate-limited": "มีการส่งคำขอหลายครั้งเกินไป กรุณารอประมาณ 10 นาทีแล้วลองใหม่",
  database: "ยังบันทึกคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const BookPage = async ({ searchParams }: BookPageProps) => {
  const [params, services, intakeSettings] = await Promise.all([searchParams, getServicesSafe(), getShopIntakeSettingsSafe()]);
  const todayValue = getTodayValue();
  const tomorrowValue = getTomorrowValue();
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const lineUserId = params.lineUserId?.trim();
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const bookingClosed = !intakeSettings.bookingAvailable;
  const [todayAvailability, tomorrowAvailability] = await Promise.all([
    getCustomerDateAvailabilitySafe(todayValue),
    getCustomerDateAvailabilitySafe(tomorrowValue),
  ]);
  const slotEntries = await Promise.all(
    services.map(async (service) => {
      const [todaySlots, tomorrowSlots] = await Promise.all([
        getAvailableBookingSlotsSafe(todayValue, service.id),
        getAvailableBookingSlotsSafe(tomorrowValue, service.id),
      ]);

      return [service.id, { today: todaySlots, tomorrow: tomorrowSlots }] as const;
    }),
  );
  const slotsByServiceId = Object.fromEntries(slotEntries);

  return (
    <ScreenShell className="bqa-book-shell">
      <AppCard labelledBy="book-title" className="bqa-book-card">
        <PageHeader
          id="book-title"
          title="จองเวลาตัดผม"
          subtitle="จองคิวล่วงหน้า"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับ
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {bookingClosed ? <Notice tone="warm">ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านจะเปิดรับอีกครั้งเมื่อพร้อม</Notice> : null}
        {!hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังจองเวลาไม่ได้</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`book:${params.error ?? ""}`} />

        <div className="bqa-book-layout">
          <aside className="bqa-book-guide" aria-label="สรุปการจอง">
            <div>
              <span>ใช้เวลาประมาณ</span>
              <strong>1 นาที</strong>
            </div>
            <p>เลือกบริการและเวลาที่ว่าง ระบบจะสร้างคิวให้เจ้าของร้านเห็นทันที</p>
          </aside>

        <form action={createBookingAction} className="bqa-book-form">
          {lineUserId ? <input type="hidden" name="lineUserId" value={lineUserId} /> : null}
          <FormStack className="bqa-book-form-stack">
            <section className="bqa-book-section" aria-labelledby="book-service-title">
              <div className="bqa-book-section-heading">
                <h2 id="book-service-title">เวลาที่ต้องการ</h2>
                <p>เลือกบริการ วัน และช่วงเวลาที่สะดวก</p>
              </div>

              {hasServices ? (
                <BookingDateTimeFields
                  services={services}
                  todayValue={todayValue}
                  tomorrowValue={tomorrowValue}
                  defaultServiceId={defaultServiceId}
                  slotsByServiceId={slotsByServiceId}
                  availabilityByDateValue={{
                    [todayValue]: todayAvailability,
                    [tomorrowValue]: tomorrowAvailability,
                  }}
                />
              ) : null}
            </section>

            <section className="bqa-book-section" aria-labelledby="book-contact-title">
              <div className="bqa-book-section-heading">
                <h2 id="book-contact-title">ข้อมูลติดต่อ</h2>
                <p>ใช้สำหรับยืนยันคิวหรือแจ้งเมื่อมีการเปลี่ยนแปลง</p>
              </div>

              <FormGrid>
                <FormField id="customerName" label="ชื่อ">
                  <Input id="customerName" name="customerName" required placeholder="ชื่อของคุณ" />
                </FormField>
                <FormField id="phone" label="เบอร์โทร">
                  <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" required placeholder="เบอร์สำหรับติดต่อและเช็คคิว" />
                </FormField>
              </FormGrid>
              <FormField id="note" label="หมายเหตุ">
                <Textarea id="note" name="note" placeholder="เช่น ขอทรงเปิดข้าง" />
              </FormField>
            </section>

          <PrivacyNote />
          <Button type="submit" size="lg" fullWidth disabled={bookingClosed || !hasServices}>
            <Icon icon="lucide:clock" aria-hidden="true" />ยืนยันคิว
          </Button>
          </FormStack>
        </form>
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default BookPage;
