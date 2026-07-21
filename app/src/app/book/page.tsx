import Link from "next/link";
import { AppCard, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
import { Button, Icon, RouteToast } from "@/components/ui";
import { getTomorrowValue, getTodayValue } from "@/lib/queue/date";
import {
  getAvailableBookingSlotsSafe,
  getCustomerDateAvailabilitySafe,
  getServicesWithSourceSafe,
  getShopIntakeSettingsSafe,
} from "@/lib/queue/repository";
import { bookingErrorMessages } from "./booking-contract";
import { BookingForm } from "./booking-form";

type BookPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const BookPage = async ({ searchParams }: BookPageProps) => {
  const [params, serviceResult, intakeSettings] = await Promise.all([searchParams, getServicesWithSourceSafe(), getShopIntakeSettingsSafe()]);
  const services = serviceResult.services;
  const todayValue = getTodayValue();
  const tomorrowValue = getTomorrowValue();
  const errorMessage = params.error && params.error in bookingErrorMessages
    ? bookingErrorMessages[params.error as keyof typeof bookingErrorMessages]
    : null;
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const intakeUnavailable = intakeSettings.source === "fallback" || serviceResult.source === "fallback";
  const bookingClosed = intakeUnavailable || !intakeSettings.queueIntakeEnabled || !intakeSettings.bookingEnabled;
  const canChooseBooking = hasServices && !intakeUnavailable;
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
    <ScreenShell className="bqa-book-shell bqa-customer-book-v2" visualVersion="v2">
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
        {intakeUnavailable ? <Notice>ขณะนี้ตรวจระบบจองไม่ได้ จึงปิดการส่งคำขอใหม่ชั่วคราว กรุณาลองใหม่ภายหลัง</Notice> : null}
        {!intakeUnavailable && bookingClosed ? <Notice tone="warm">ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านจะเปิดรับอีกครั้งเมื่อพร้อม</Notice> : null}
        {!intakeUnavailable && !hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังจองเวลาไม่ได้</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`book:${params.error ?? ""}`} />

        <div className="bqa-book-layout">
          <aside className="bqa-book-guide" aria-label="สรุปการจอง">
            <div>
              <span>ใช้เวลาประมาณ</span>
              <strong>1 นาที</strong>
            </div>
            <p>เลือกบริการและเวลาที่ว่าง ระบบจะสร้างคิวให้เจ้าของร้านเห็นทันที</p>
          </aside>

          <BookingForm
            services={services}
            todayValue={todayValue}
            tomorrowValue={tomorrowValue}
            defaultServiceId={defaultServiceId}
            slotsByServiceId={slotsByServiceId}
            availabilityByDateValue={{
              [todayValue]: todayAvailability,
              [tomorrowValue]: tomorrowAvailability,
            }}
            bookingClosed={bookingClosed}
            canChooseBooking={canChooseBooking}
          />
        </div>
      </AppCard>
    </ScreenShell>
  );
};

export default BookPage;
