"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormGrid, FormStack, Notice } from "@/components/barber/app-ui";
import { PrivacyNote } from "@/components/barber/privacy-note";
import { Button, FormField, Icon, Input, Textarea } from "@/components/ui";
import { createBookingAction } from "./actions";
import { BookingDateTimeFields, type BookingDateTimeFieldsProps } from "./booking-date-time-fields";
import { bookingErrorMessages, initialBookingActionState } from "./booking-contract";

type BookingFormProps = BookingDateTimeFieldsProps & {
  bookingClosed: boolean;
  canChooseBooking: boolean;
};

export const BookingForm = ({
  availabilityByDateValue,
  bookingClosed,
  canChooseBooking,
  defaultServiceId,
  services,
  slotsByServiceId,
  todayValue,
  tomorrowValue,
}: BookingFormProps) => {
  const [actionState, formAction, pending] = useActionState(createBookingAction, initialBookingActionState);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [hasAvailableSlot, setHasAvailableSlot] = useState(false);
  const handleAvailabilityChange = useCallback((available: boolean) => setHasAvailableSlot(available), []);
  const actionErrorMessage = actionState.error ? bookingErrorMessages[actionState.error] : null;

  useEffect(() => {
    if (actionErrorMessage) {
      toast.error(actionErrorMessage, { id: `booking-action:${actionState.error}` });
    }
  }, [actionErrorMessage, actionState.error]);

  return (
    <form action={formAction} className="bqa-book-form">
      <FormStack className="bqa-book-form-stack">
        {actionErrorMessage ? <Notice>{actionErrorMessage}</Notice> : null}

        <section className="bqa-book-section" aria-labelledby="book-service-title">
          <div className="bqa-book-section-heading">
            <h2 id="book-service-title">เวลาที่ต้องการ</h2>
            <p>เลือกบริการ วัน และช่วงเวลาที่สะดวก</p>
          </div>

          {canChooseBooking ? (
            <BookingDateTimeFields
              services={services}
              todayValue={todayValue}
              tomorrowValue={tomorrowValue}
              defaultServiceId={defaultServiceId}
              slotsByServiceId={slotsByServiceId}
              availabilityByDateValue={availabilityByDateValue}
              onAvailabilityChange={handleAvailabilityChange}
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
              <Input id="customerName" name="customerName" required placeholder="ชื่อของคุณ" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </FormField>
            <FormField id="phone" label="เบอร์โทร (ไม่บังคับ)" description="กรอกเมื่ออยากให้ร้านติดต่อกลับ">
              <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="เช่น 0812345678" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </FormField>
          </FormGrid>
          <FormField id="note" label="หมายเหตุ">
            <Textarea id="note" name="note" placeholder="เช่น ขอทรงเปิดข้าง" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>
        </section>

        <PrivacyNote />
        <Button type="submit" size="lg" fullWidth disabled={bookingClosed || !canChooseBooking || !hasAvailableSlot || pending}>
          <Icon icon="lucide:clock" aria-hidden="true" />{pending ? "กำลังยืนยันคิว..." : "ยืนยันคิว"}
        </Button>
      </FormStack>
    </form>
  );
};
