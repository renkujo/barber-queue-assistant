import Link from "next/link";
import { AppCard, FormGrid, FormStack, Notice, PageHeader, ScreenShell } from "@/components/barber/app-ui";
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
import { getTomorrowValue, getTodayValue } from "@/lib/queue/date";
import { getAvailableBookingSlotsSafe, getServicesSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { createBookingAction } from "./actions";

type BookPageProps = {
  searchParams: Promise<{ error?: string; lineUserId?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อ บริการ วัน และเวลาอีกครั้ง",
  closed: "ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว ลองเช็คอีกครั้งภายหลัง",
  "slot-unavailable": "เวลานี้ถูกจองหรือถูกพักร้านแล้ว เลือกเวลาอื่นแล้วลองใหม่",
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
  const [todaySlots, tomorrowSlots] = await Promise.all([
    getAvailableBookingSlotsSafe(todayValue, defaultServiceId),
    getAvailableBookingSlotsSafe(tomorrowValue, defaultServiceId),
  ]);
  const timeSlots = todaySlots.map((slot) => {
    const tomorrowSlot = tomorrowSlots.find((item) => item.value === slot.value);

    return {
      ...slot,
      available: slot.available || Boolean(tomorrowSlot?.available),
    };
  });
  const defaultTimeValue = timeSlots.find((slot) => slot.available)?.value ?? timeSlots[0]?.value;

  return (
    <ScreenShell>
      <AppCard labelledBy="book-title" className="bqa-app-card--wide">
        <PageHeader
          id="book-title"
          title="เลือกเวลาตัดผม"
          subtitle="จองเวลา"
          imageSrc="/assets/generated-v1/queue-ticket-cutout.png"
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

        <form action={createBookingAction}>
          {lineUserId ? <input type="hidden" name="lineUserId" value={lineUserId} /> : null}
          <FormStack>
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

          <FormGrid>
            <FormField id="dateValue" label="วัน">
              <Select name="dateValue" defaultValue={todayValue} required>
                <SelectTrigger id="dateValue"><SelectValue placeholder="เลือกวัน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={todayValue}>วันนี้</SelectItem>
                  <SelectItem value={tomorrowValue}>พรุ่งนี้</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="timeValue" label="เวลา">
              <Select name="timeValue" defaultValue={defaultTimeValue} required>
                <SelectTrigger id="timeValue"><SelectValue placeholder="เลือกเวลา" /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem value={slot.value} key={slot.value} disabled={!slot.available}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormGrid>

          <FormField id="customerName" label="ชื่อ">
            <Input id="customerName" name="customerName" required placeholder="ชื่อของคุณ" />
          </FormField>
          <FormField id="phone" label="เบอร์โทร">
            <Input id="phone" name="phone" inputMode="tel" placeholder="เบอร์สำหรับติดต่อ" />
          </FormField>
          <FormField id="note" label="หมายเหตุ">
            <Textarea id="note" name="note" placeholder="เช่น ขอทรงเปิดข้าง" />
          </FormField>

          <Button type="submit" size="lg" fullWidth disabled={bookingClosed || !hasServices}>
            <Icon icon="lucide:clock" aria-hidden="true" />ยืนยันคิว
          </Button>
          </FormStack>
        </form>
      </AppCard>
    </ScreenShell>
  );
};

export default BookPage;
