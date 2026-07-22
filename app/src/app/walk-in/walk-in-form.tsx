"use client";

import { useActionState, useState } from "react";
import { FormGrid, FormStack, Notice } from "@/components/barber/app-ui";
import { PrivacyNote } from "@/components/barber/privacy-note";
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
import { createWalkInAction } from "./actions";
import { initialWalkInActionState, walkInErrorMessages } from "./walk-in-contract";

type WalkInService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLabel: string;
};

type WalkInFormProps = {
  canSubmit: boolean;
  defaultServiceId?: string;
  entrySource: string;
  operationId: string;
  services: WalkInService[];
};

export const WalkInForm = ({ canSubmit, defaultServiceId, entrySource, operationId, services }: WalkInFormProps) => {
  const [actionState, formAction, pending] = useActionState(createWalkInAction, initialWalkInActionState);
  const [serviceId, setServiceId] = useState(defaultServiceId ?? "");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const actionErrorMessage = actionState.error ? walkInErrorMessages[actionState.error] : null;

  return (
    <form action={formAction} className="bqa-book-form">
      <input name="operationId" type="hidden" value={operationId} />
      <input name="entrySource" type="hidden" value={entrySource} />
      <FormStack className="bqa-book-form-stack">
        {actionErrorMessage ? <Notice>{actionErrorMessage}</Notice> : null}

        <section className="bqa-book-section" aria-labelledby="walk-in-service-title">
          <div className="bqa-book-section-heading">
            <h2 id="walk-in-service-title">บริการที่ต้องการ</h2>
            <p>เลือกบริการที่จะเข้าคิววันนี้</p>
          </div>

          {services.length ? (
            <FormField id="serviceId" label="บริการ">
              <Select name="serviceId" value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger id="serviceId"><SelectValue placeholder="เลือกบริการ" /></SelectTrigger>
                <SelectContent className="qw-v2-select-content">
                  {services.map((service) => (
                    <SelectItem value={service.id} key={service.id}>{service.name} · {service.durationMinutes} นาที · {service.priceLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
        </section>

        <section className="bqa-book-section" aria-labelledby="walk-in-contact-title">
          <div className="bqa-book-section-heading">
            <h2 id="walk-in-contact-title">ข้อมูลติดต่อ</h2>
            <p>ใช้เรียกคิวและติดต่อกลับหากคิวเปลี่ยน</p>
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
            <Textarea id="note" name="note" placeholder="เช่น รอที่ร้านแล้ว" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>
        </section>

        <PrivacyNote />
        <Button type="submit" size="lg" fullWidth disabled={!canSubmit || !serviceId || pending}>
          <Icon icon="lucide:users" aria-hidden="true" />{pending ? "กำลังรับบัตรคิว..." : "รับบัตรคิวออนไลน์"}
        </Button>
      </FormStack>
    </form>
  );
};
