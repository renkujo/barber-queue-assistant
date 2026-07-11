"use client";

import { useMemo, useState } from "react";
import { FormGrid, Notice } from "@/components/barber/app-ui";
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

type BookingServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};

type BookingSlotOption = {
  value: string;
  label: string;
  available: boolean;
};

type BookingSlotGroup = {
  today: BookingSlotOption[];
  tomorrow: BookingSlotOption[];
};

type BookingDateTimeFieldsProps = {
  services: BookingServiceOption[];
  todayValue: string;
  tomorrowValue: string;
  defaultServiceId?: string;
  slotsByServiceId: Record<string, BookingSlotGroup>;
};

const getFirstAvailableSlot = (slots: BookingSlotOption[]) => slots.find((slot) => slot.available) ?? slots[0];

const getPreferredDateValue = ({ slots, todayValue, tomorrowValue }: { slots?: BookingSlotGroup; todayValue: string; tomorrowValue: string }) => {
  if (slots?.today.some((slot) => slot.available)) {
    return todayValue;
  }

  if (slots?.tomorrow.some((slot) => slot.available)) {
    return tomorrowValue;
  }

  return todayValue;
};

const getSlotsForDate = ({ slots, dateValue, tomorrowValue }: { slots?: BookingSlotGroup; dateValue: string; tomorrowValue: string }) => {
  if (!slots) {
    return [];
  }

  return dateValue === tomorrowValue ? slots.tomorrow : slots.today;
};

export const BookingDateTimeFields = ({
  services,
  todayValue,
  tomorrowValue,
  defaultServiceId,
  slotsByServiceId,
}: BookingDateTimeFieldsProps) => {
  const initialServiceId = defaultServiceId ?? services[0]?.id ?? "";
  const [serviceId, setServiceId] = useState(initialServiceId);
  const selectedSlotGroup = slotsByServiceId[serviceId];
  const initialDateValue = getPreferredDateValue({ slots: selectedSlotGroup, todayValue, tomorrowValue });
  const [dateValue, setDateValue] = useState(initialDateValue);
  const visibleSlots = useMemo(
    () => getSlotsForDate({ slots: slotsByServiceId[serviceId], dateValue, tomorrowValue }),
    [dateValue, serviceId, slotsByServiceId, tomorrowValue],
  );
  const [timeValue, setTimeValue] = useState(() => getFirstAvailableSlot(getSlotsForDate({ slots: selectedSlotGroup, dateValue: initialDateValue, tomorrowValue }))?.value ?? "");
  const hasAvailableSlot = visibleSlots.some((slot) => slot.available);

  const updateDateAndTime = (nextServiceId: string, nextDateValue: string) => {
    const nextSlots = getSlotsForDate({ slots: slotsByServiceId[nextServiceId], dateValue: nextDateValue, tomorrowValue });
    setDateValue(nextDateValue);
    setTimeValue(getFirstAvailableSlot(nextSlots)?.value ?? "");
  };

  const handleServiceChange = (nextServiceId: string) => {
    const nextSlots = slotsByServiceId[nextServiceId];
    const nextDateValue = getPreferredDateValue({ slots: nextSlots, todayValue, tomorrowValue });
    setServiceId(nextServiceId);
    updateDateAndTime(nextServiceId, nextDateValue);
  };

  const handleDateChange = (nextDateValue: string) => {
    updateDateAndTime(serviceId, nextDateValue);
  };

  return (
    <>
      <FormField id="serviceId" label="บริการ">
        <Select name="serviceId" value={serviceId} onValueChange={handleServiceChange} required>
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
          <Select name="dateValue" value={dateValue} onValueChange={handleDateChange} required>
            <SelectTrigger id="dateValue"><SelectValue placeholder="เลือกวัน" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={todayValue}>วันนี้</SelectItem>
              <SelectItem value={tomorrowValue}>พรุ่งนี้</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="timeValue" label="เวลา">
          <Select name="timeValue" value={timeValue} onValueChange={setTimeValue} required>
            <SelectTrigger id="timeValue"><SelectValue placeholder="เลือกเวลา" /></SelectTrigger>
            <SelectContent>
              {visibleSlots.map((slot) => (
                <SelectItem value={slot.value} key={slot.value} disabled={!slot.available}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormGrid>

      {!hasAvailableSlot ? <Notice tone="warm">วันนี้ไม่มีเวลาที่เปิดให้จองสำหรับบริการนี้ ลองเลือกวันหรือบริการอื่น</Notice> : null}
    </>
  );
};
