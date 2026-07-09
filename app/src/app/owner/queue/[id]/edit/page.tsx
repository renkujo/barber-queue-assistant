import Link from "next/link";
import { notFound } from "next/navigation";
import { FormGrid, FormStack, Notice, OwnerGrid, OwnerHeader, Panel, SectionHeader } from "@/components/barber/app-ui";
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
  RouteToast,
  Textarea,
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getDefaultBookingTimes, getQueueItemEditDetails, getServicesSafe } from "@/lib/queue/repository";
import { getTodayValue, getTomorrowValue } from "@/lib/queue/date";
import { updateQueueItemAction } from "../../../actions";
import { OwnerTopbar } from "../../../_components/owner-topbar";

export const dynamic = "force-dynamic";

type OwnerQueueEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "ข้อมูลไม่ครบหรือเวลาไม่ถูกต้อง ลองตรวจข้อมูลแล้วบันทึกใหม่",
  "time-conflict": "เวลานี้ชนกับคิวอื่นหรือช่วงพักร้าน เลือกเวลาใหม่ก่อนบันทึก",
  database: "ยังบันทึกการแก้ไขไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const getDateOptions = (selectedDateValue: string) => {
  const todayValue = getTodayValue();
  const tomorrowValue = getTomorrowValue();
  const options = [
    { value: todayValue, label: "วันนี้" },
    { value: tomorrowValue, label: "พรุ่งนี้" },
  ];

  if (!options.some((option) => option.value === selectedDateValue)) {
    options.unshift({ value: selectedDateValue, label: selectedDateValue });
  }

  return options;
};

const getTimeOptions = (selectedTimeValue: string) => {
  const bookingTimes = getDefaultBookingTimes();

  if (selectedTimeValue && !bookingTimes.includes(selectedTimeValue)) {
    return [selectedTimeValue, ...bookingTimes];
  }

  return bookingTimes;
};

const OwnerQueueEditPage = async ({ params, searchParams }: OwnerQueueEditPageProps) => {
  await requireOwnerSession();

  const [{ id }, query, services] = await Promise.all([params, searchParams, getServicesSafe()]);
  const queueItem = await getQueueItemEditDetails(id).catch(() => null);

  if (!queueItem) {
    notFound();
  }

  const selectedServiceId = queueItem.serviceId || services[0]?.id;
  const selectedTimeValue = queueItem.timeValue || "__none__";
  const errorMessage = query.error ? errorMessages[query.error] : null;

  return (
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content bqa-owner-form-content">
        <OwnerHeader
          title={`แก้ไขคิว ${queueItem.code}`}
          description={`${queueItem.customerName} · ${queueItem.statusLabel}`}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/owner">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับคิววันนี้
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-edit:${query.error ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench">
          <Panel aria-labelledby="owner-queue-edit-form-title">
            <SectionHeader
              id="owner-queue-edit-form-title"
              title="ข้อมูลคิว"
              note="แก้รายละเอียดที่ร้านต้องใช้จริง ถ้าเวลาชนระบบจะเตือนก่อนบันทึก"
            />
            <form action={updateQueueItemAction}>
              <input name="queueItemId" type="hidden" value={queueItem.id} />
              <FormStack>
                <FormGrid>
                  <FormField id="customerName" label="ชื่อลูกค้า">
                    <Input id="customerName" name="customerName" required defaultValue={queueItem.customerName} />
                  </FormField>
                  <FormField id="phone" label="เบอร์โทร" description="ถ้าไม่มี ข้ามได้">
                    <Input id="phone" name="phone" inputMode="tel" defaultValue={queueItem.phone} />
                  </FormField>
                </FormGrid>

                <FormField id="serviceId" label="บริการ">
                  <Select name="serviceId" defaultValue={selectedServiceId} required>
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
                    <Select name="dateValue" defaultValue={queueItem.dateValue} required>
                      <SelectTrigger id="dateValue">
                        <SelectValue placeholder="เลือกวัน" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDateOptions(queueItem.dateValue).map((option) => (
                          <SelectItem value={option.value} key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField id="timeValue" label="เวลา" description="เลือกไม่ล็อกเวลาได้สำหรับ walk-in">
                    <Select name="timeValue" defaultValue={selectedTimeValue}>
                      <SelectTrigger id="timeValue">
                        <SelectValue placeholder="เลือกเวลา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">ไม่ล็อกเวลา / walk-in</SelectItem>
                        {getTimeOptions(queueItem.timeValue).map((time) => (
                          <SelectItem value={time} key={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormGrid>

                <FormField id="note" label="หมายเหตุลูกค้า">
                  <Textarea id="note" name="note" defaultValue={queueItem.note} placeholder="เช่น ขอทรงเปิดข้าง / โทรมา" />
                </FormField>
                <FormField id="ownerNote" label="โน้ตเจ้าของร้าน" description="เก็บไว้ให้เจ้าของร้านเห็น ไม่ใช่ข้อความแจ้งลูกค้า">
                  <Textarea id="ownerNote" name="ownerNote" defaultValue={queueItem.ownerNote} placeholder="เช่น ลูกค้าประจำ / ต้องรีบไปธุระ" />
                </FormField>

                <Button type="submit" size="lg" fullWidth>
                  <Icon icon="lucide:save" aria-hidden="true" />บันทึกการแก้ไข
                </Button>
              </FormStack>
            </form>
          </Panel>

          <Panel tone="warm">
            <SectionHeader title="กติกาการบันทึก" note="ยังเป็น owner override แต่กันชนเวลาพื้นฐานให้ก่อน" />
            <div className="bqa-owner-step-list">
              <div className="bqa-owner-step-row">
                <span>1</span>
                <p>
                  <strong>เปลี่ยนเวลาได้</strong>
                  <small>ถ้าล็อกเวลา ระบบจะเช็คชนคิวและเวลาพักร้าน</small>
                </p>
              </div>
              <div className="bqa-owner-step-row">
                <span>2</span>
                <p>
                  <strong>walk-in ไม่ต้องล็อกเวลา</strong>
                  <small>เลือกไม่ล็อกเวลาเพื่อให้คิวอยู่ในลำดับวันนี้ตามเดิม</small>
                </p>
              </div>
              <div className="bqa-owner-step-row">
                <span>3</span>
                <p>
                  <strong>โน้ตเจ้าของร้าน</strong>
                  <small>ใช้จำรายละเอียดภายในร้านก่อนทำ LINE แจ้งเตือนจริง</small>
                </p>
              </div>
            </div>
          </Panel>
        </OwnerGrid>
      </div>
    </main>
  );
};

export default OwnerQueueEditPage;
