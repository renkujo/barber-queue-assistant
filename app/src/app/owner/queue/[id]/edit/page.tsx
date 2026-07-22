import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormGrid, FormStack, Notice, OwnerGrid, OwnerHeader, Panel, SectionHeader } from "@/components/barber/app-ui";
import {
  Button,
  FormField,
  Icon,
  Input,
  RouteToast,
  Textarea,
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getAvailableBookingSlotsSafe, getQueueItemEditDetails, getServicesSafe } from "@/lib/queue/repository";
import { getTodayValue, getTomorrowValue } from "@/lib/queue/date";
import { updateQueueItemAction } from "../../../actions";
import { OwnerShell } from "../../../_components/owner-shell";
import { OwnerQueueEditScheduleFields } from "./owner-queue-edit-schedule-fields";

export const dynamic = "force-dynamic";

type OwnerQueueEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "ข้อมูลไม่ครบหรือเวลาไม่ถูกต้อง ลองตรวจข้อมูลแล้วบันทึกใหม่",
  "time-conflict": "เวลานี้ชนกับคิวอื่นหรือช่วงพักร้าน เลือกเวลาใหม่ก่อนบันทึก",
  "time-outside-hours": "เวลานี้อยู่นอกเวลาเปิดร้าน เลือกเวลาในช่วงเปิดร้านหรือไม่ล็อกเวลา",
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

const OwnerQueueEditPage = async ({ params, searchParams }: OwnerQueueEditPageProps) => {
  await requireOwnerSession();

  const [{ id }, query, services] = await Promise.all([params, searchParams, getServicesSafe()]);
  const queueItem = await getQueueItemEditDetails(id).catch(() => null);

  if (!queueItem) {
    notFound();
  }

  const selectedServiceId = queueItem.serviceId || services[0]?.id;
  const dateOptions = getDateOptions(queueItem.dateValue);
  const slotEntries = await Promise.all(
    services.flatMap((service) => dateOptions.map(async (dateOption) => {
      const slots = await getAvailableBookingSlotsSafe(dateOption.value, service.id);

      return [service.id, dateOption.value, slots] as const;
    })),
  );
  const slotsByServiceDate = slotEntries.reduce<Record<string, Record<string, Array<{ value: string; label: string; available: boolean }>>>>((result, [serviceId, dateValue, slots]) => {
    result[serviceId] = result[serviceId] ?? {};
    result[serviceId][dateValue] = slots;

    return result;
  }, {});
  const errorMessage = query.error ? errorMessages[query.error] : null;

  return (
    <OwnerShell visualVersion="v2">
      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-queue-edit-v2">
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

        {errorMessage ? <Notice className="bqa-owner-edit-conflict-notice">{errorMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-edit:${query.error ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench bqa-owner-edit-workbench">
          <Panel className="bqa-owner-edit-panel" aria-labelledby="owner-queue-edit-form-title">
            <div className="bqa-owner-edit-panel-header">
              <SectionHeader
                id="owner-queue-edit-form-title"
                title="ข้อมูลคิว"
                note="แก้รายละเอียดที่ร้านต้องใช้จริง ถ้าเวลาชนระบบจะเตือนก่อนบันทึก"
              />
              <div className="bqa-owner-edit-ticket" aria-label="คิวที่กำลังแก้ไข">
                <span>{queueItem.code}</span>
                <strong>{queueItem.statusLabel}</strong>
              </div>
            </div>
            <form action={updateQueueItemAction}>
              <input name="queueItemId" type="hidden" value={queueItem.id} />
<input name="operationId" type="hidden" value={randomUUID()} />
              <FormStack className="bqa-owner-edit-form-stack">
                <div className="bqa-owner-edit-section bqa-owner-edit-section--identity">
                  <div className="bqa-owner-edit-section-heading">
                    <span>01</span>
                    <div>
                      <h2>ข้อมูลลูกค้า</h2>
                      <p>ชื่อและเบอร์ที่ใช้ระบุตัวคิวนี้</p>
                    </div>
                  </div>
                  <FormGrid>
                    <FormField id="customerName" label="ชื่อลูกค้า">
                      <Input id="customerName" name="customerName" required defaultValue={queueItem.customerName} />
                    </FormField>
                    <FormField id="phone" label="เบอร์โทร" description="ถ้าไม่มี ข้ามได้">
                      <Input id="phone" name="phone" inputMode="tel" defaultValue={queueItem.phone} />
                    </FormField>
                  </FormGrid>
                </div>

                <OwnerQueueEditScheduleFields
                  dateOptions={dateOptions}
                  defaultDateValue={queueItem.dateValue}
                  defaultServiceId={selectedServiceId}
                  defaultTimeValue={queueItem.timeValue}
                  services={services}
                  slotsByServiceDate={slotsByServiceDate}
                />

                <div className="bqa-owner-edit-section bqa-owner-edit-section--notes">
                  <div className="bqa-owner-edit-section-heading">
                    <span>03</span>
                    <div>
                      <h2>หมายเหตุ</h2>
                      <p>แยกข้อความลูกค้ากับโน้ตภายในร้านให้ชัดเจน</p>
                    </div>
                  </div>
                  <div className="bqa-owner-edit-notes-grid">
                    <FormField id="note" label="หมายเหตุลูกค้า">
                      <Textarea id="note" name="note" defaultValue={queueItem.note} placeholder="เช่น ขอทรงเปิดข้าง / โทรมา" />
                    </FormField>
                    <FormField id="ownerNote" label="โน้ตเจ้าของร้าน" description="เก็บไว้ให้เจ้าของร้านเห็น ไม่ใช่ข้อความแจ้งลูกค้า">
                      <Textarea id="ownerNote" name="ownerNote" defaultValue={queueItem.ownerNote} placeholder="เช่น ลูกค้าประจำ / ต้องรีบไปธุระ" />
                    </FormField>
                  </div>
                  <p className="bqa-owner-edit-private-note">
                    <Icon icon="lucide:lock-keyhole" aria-hidden="true" />
                    โน้ตเจ้าของร้านเป็นข้อมูลภายใน ไม่ใช่ข้อความแจ้งลูกค้า
                  </p>
                </div>

                <div className="bqa-owner-edit-save-row">
                  <p>ตรวจบริการ วัน เวลา และโน้ตก่อนบันทึก</p>
                  <Button type="submit" size="lg" fullWidth>
                    <Icon icon="lucide:save" aria-hidden="true" />บันทึกการแก้ไข
                  </Button>
                </div>
              </FormStack>
            </form>
          </Panel>

          <aside className="bqa-owner-edit-rule-rail" aria-label="กติกาการบันทึก">
            <Panel tone="warm" className="bqa-owner-edit-rule-panel">
              <SectionHeader title="กติกาการบันทึก" note="ยังเป็น owner override แต่กันชนเวลาพื้นฐานให้ก่อน" />
              <div className="bqa-owner-step-list">
                <div className="bqa-owner-step-row">
                  <span><Icon icon="lucide:calendar-clock" aria-hidden="true" /></span>
                  <p>
                    <strong>เปลี่ยนเวลาได้</strong>
                    <small>ถ้าล็อกเวลา ระบบจะเช็คชนคิวและเวลาพักร้าน</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span><Icon icon="lucide:clock-alert" aria-hidden="true" /></span>
                  <p>
                    <strong>เวลาเปิดร้าน</strong>
                    <small>ระบบจะกันเวลานอกช่วงเปิดร้าน ยกเว้นเวลาเดิมที่คิวนี้ถืออยู่</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span><Icon icon="lucide:footprints" aria-hidden="true" /></span>
                  <p>
                    <strong>walk-in ไม่ต้องล็อกเวลา</strong>
                    <small>เลือกไม่ล็อกเวลาเพื่อให้คิวอยู่ในลำดับวันนี้ตามเดิม</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span><Icon icon="lucide:lock-keyhole" aria-hidden="true" /></span>
                  <p>
                    <strong>โน้ตเจ้าของร้าน</strong>
                    <small>เก็บไว้ให้เจ้าของร้านเห็น ไม่ใช่ข้อความแจ้งลูกค้า</small>
                  </p>
                </div>
              </div>
            </Panel>
          </aside>
        </OwnerGrid>
      </div>
    </OwnerShell>
  );
};

export default OwnerQueueEditPage;
