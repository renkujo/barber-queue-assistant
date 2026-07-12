"use client";

import { useMemo, useState } from "react";
import { FormGrid } from "@/components/barber/app-ui";
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { QueueService } from "@/lib/queue/repository";

type DateOption = {
  value: string;
  label: string;
};

type TimeSlotOption = {
  value: string;
  label: string;
  available: boolean;
};

type OwnerQueueEditScheduleFieldsProps = {
  dateOptions: DateOption[];
  defaultDateValue: string;
  defaultServiceId: string;
  defaultTimeValue: string;
  services: QueueService[];
  slotsByServiceDate: Record<string, Record<string, TimeSlotOption[]>>;
};

const noLockedTimeValue = "__none__";

const getSlots = ({ dateValue, serviceId, slotsByServiceDate }: {
  dateValue: string;
  serviceId: string;
  slotsByServiceDate: OwnerQueueEditScheduleFieldsProps["slotsByServiceDate"];
}) => slotsByServiceDate[serviceId]?.[dateValue] ?? [];

const getTimeOptions = ({
  dateValue,
  defaultDateValue,
  defaultServiceId,
  defaultTimeValue,
  serviceId,
  slots,
}: {
  dateValue: string;
  defaultDateValue: string;
  defaultServiceId: string;
  defaultTimeValue: string;
  serviceId: string;
  slots: TimeSlotOption[];
}) => {
  const canKeepExistingInvalidTime = Boolean(defaultTimeValue && serviceId === defaultServiceId && dateValue === defaultDateValue);
  const options = slots.map((slot) => ({
    value: slot.value,
    label: slot.label,
    disabled: !slot.available && !(canKeepExistingInvalidTime && slot.value === defaultTimeValue),
  }));

  if (canKeepExistingInvalidTime && defaultTimeValue && !options.some((option) => option.value === defaultTimeValue)) {
    return [{ value: defaultTimeValue, label: `${defaultTimeValue} (เวลาเดิม)`, disabled: false }, ...options];
  }

  return options;
};

const getPreferredTimeValue = ({ defaultTimeValue, options }: { defaultTimeValue: string; options: Array<{ value: string; disabled: boolean }> }) => {
  if (defaultTimeValue && options.some((option) => option.value === defaultTimeValue && !option.disabled)) {
    return defaultTimeValue;
  }

  return options.find((option) => !option.disabled)?.value ?? noLockedTimeValue;
};

export const OwnerQueueEditScheduleFields = ({
  dateOptions,
  defaultDateValue,
  defaultServiceId,
  defaultTimeValue,
  services,
  slotsByServiceDate,
}: OwnerQueueEditScheduleFieldsProps) => {
  const [serviceId, setServiceId] = useState(defaultServiceId);
  const [dateValue, setDateValue] = useState(defaultDateValue);
  const currentSlots = useMemo(() => getSlots({ dateValue, serviceId, slotsByServiceDate }), [dateValue, serviceId, slotsByServiceDate]);
  const timeOptions = useMemo(
    () => getTimeOptions({ dateValue, defaultDateValue, defaultServiceId, defaultTimeValue, serviceId, slots: currentSlots }),
    [currentSlots, dateValue, defaultDateValue, defaultServiceId, defaultTimeValue, serviceId],
  );
  const [timeValue, setTimeValue] = useState(() => getPreferredTimeValue({ defaultTimeValue, options: timeOptions }));

  const updateServiceDateAndTime = (nextServiceId: string, nextDateValue: string) => {
    const nextSlots = getSlots({ dateValue: nextDateValue, serviceId: nextServiceId, slotsByServiceDate });
    const nextOptions = getTimeOptions({
      dateValue: nextDateValue,
      defaultDateValue,
      defaultServiceId,
      defaultTimeValue,
      serviceId: nextServiceId,
      slots: nextSlots,
    });

    setServiceId(nextServiceId);
    setDateValue(nextDateValue);
    setTimeValue(getPreferredTimeValue({ defaultTimeValue, options: nextOptions }));
  };

  return (
    <>
      <FormField id="serviceId" label="บริการ">
        <Select name="serviceId" value={serviceId} onValueChange={(nextServiceId) => updateServiceDateAndTime(nextServiceId, dateValue)} required>
          <SelectTrigger id="serviceId">
            <SelectValue placeholder="เลือกบริการ" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem value={service.id} key={service.id}>
                {service.name} · {service.durationMinutes} นาที · {service.priceLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormGrid>
        <FormField id="dateValue" label="วัน">
          <Select name="dateValue" value={dateValue} onValueChange={(nextDateValue) => updateServiceDateAndTime(serviceId, nextDateValue)} required>
            <SelectTrigger id="dateValue">
              <SelectValue placeholder="เลือกวัน" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="timeValue" label="เวลา" description="เลือกไม่ล็อกเวลาได้สำหรับ walk-in">
          <Select name="timeValue" value={timeValue} onValueChange={setTimeValue}>
            <SelectTrigger id="timeValue">
              <SelectValue placeholder="เลือกเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noLockedTimeValue}>ไม่ล็อกเวลา / walk-in</SelectItem>
              {timeOptions.map((time) => (
                <SelectItem value={time.value} key={time.value} disabled={time.disabled}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormGrid>
    </>
  );
};
