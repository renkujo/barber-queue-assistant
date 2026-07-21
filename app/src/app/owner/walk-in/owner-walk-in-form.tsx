"use client";

import { useState } from "react";
import { FormStack, OwnerGrid, Panel, SectionHeader } from "@/components/barber/app-ui";
import {
  Button,
  FormField,
  Icon,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

type OwnerWalkInService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};

type OwnerWalkInFormProps = {
  action: (formData: FormData) => Promise<void>;
  services: OwnerWalkInService[];
};

const FieldLabel = ({ children, optional = false }: { children: string; optional?: boolean }) => (
  <span className="bqa-owner-walkin-field-label">
    {children}
    <small>{optional ? "ไม่บังคับ" : "จำเป็น"}</small>
  </span>
);

export const OwnerWalkInForm = ({ action, services }: OwnerWalkInFormProps) => {
  const defaultServiceId = services[0]?.id;
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId);
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0];
  const hasServices = services.length > 0;

  return (
    <OwnerGrid className="bqa-owner-grid--workbench bqa-owner-walkin-grid">
      <Panel className="bqa-owner-walkin-panel" aria-labelledby="owner-walk-in-form-title">
        <SectionHeader id="owner-walk-in-form-title" title="ข้อมูลลูกค้า" note="กรอกเฉพาะข้อมูลที่ใช้จัดคิววันนี้" />
        <form action={action} className="bqa-owner-walkin-form">
          <FormStack>
            <FormField id="serviceId" label={<FieldLabel>บริการ</FieldLabel>}>
              <Select name="serviceId" value={selectedServiceId} onValueChange={setSelectedServiceId} required>
                <SelectTrigger id="serviceId">
                  <SelectValue placeholder="เลือกบริการ" />
                </SelectTrigger>
                <SelectContent className="qw-v2-select-content">
                  {services.map((service) => (
                    <SelectItem value={service.id} key={service.id}>
                      {service.name} · {service.durationMinutes} นาที · {service.priceLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="bqa-owner-walkin-field-row">
              <FormField id="customerName" label={<FieldLabel>ชื่อลูกค้า</FieldLabel>}>
                <Input id="customerName" name="customerName" required placeholder="กรอกชื่อลูกค้า" />
              </FormField>
              <FormField id="phone" label={<FieldLabel optional>เบอร์โทร</FieldLabel>}>
                <Input id="phone" name="phone" inputMode="tel" placeholder="ถ้ามี" />
              </FormField>
            </div>

            <FormField id="note" label={<FieldLabel optional>หมายเหตุ</FieldLabel>}>
              <Textarea id="note" name="note" placeholder="รายละเอียดเพิ่มเติม" />
            </FormField>

            <div className="bqa-owner-walkin-submit-bar">
              <Button type="submit" size="lg" fullWidth disabled={!hasServices}>
                <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มเข้าคิววันนี้
              </Button>
            </div>
          </FormStack>
        </form>
      </Panel>

      <aside className="bqa-owner-support-stack bqa-owner-walkin-support" aria-label="สรุปการเพิ่มคิว">
        <Panel className="bqa-owner-support-panel">
          <SectionHeader title="บริการที่เลือก" action={<Icon icon="lucide:scissors" className="bqa-muted-icon" aria-hidden="true" />} />
          {selectedService ? (
            <div className="bqa-owner-walkin-service-summary">
              <strong>{selectedService.name}</strong>
              <span><Icon icon="lucide:clock" aria-hidden="true" />{selectedService.durationMinutes} นาที</span>
              <span>{selectedService.priceLabel}</span>
            </div>
          ) : (
            <p className="bqa-owner-walkin-no-service">ยังไม่มีบริการที่เปิดใช้</p>
          )}
        </Panel>

        <Panel className="bqa-owner-support-panel bqa-owner-walkin-after-panel">
          <SectionHeader title="หลังเพิ่มคิว" action={<Icon icon="lucide:circle-check" className="bqa-muted-icon" aria-hidden="true" />} />
          <p>ลูกค้าจะเข้าไปอยู่ในคิววันนี้ทันที</p>
        </Panel>
      </aside>
    </OwnerGrid>
  );
};
