import Link from "next/link";
import { FormGrid, FormStack, Notice, OwnerGrid, OwnerHeader, Panel, SectionHeader } from "@/components/barber/app-ui";
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
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getOwnerDateAvailabilityItemsSafe, type DateAvailabilityMode } from "@/lib/queue/repository";
import { updateOwnerDateAvailabilityAction } from "../../actions";
import { OwnerTopbar } from "../../_components/owner-topbar";

export const dynamic = "force-dynamic";

type OwnerAvailabilityPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  database: "ยังบันทึกวันรับคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  invalid: "ข้อมูลวันที่หรือสถานะไม่ถูกต้อง ลองเลือกใหม่อีกครั้ง",
};

const statusMessages: Record<string, string> = {
  "availability-updated": "บันทึกวันรับคิวแล้ว",
};

const modeOptions: Array<{ value: DateAvailabilityMode; label: string; description: string }> = [
  { value: "default", label: "ใช้ค่าปกติของร้าน", description: "ไม่มี override รายวัน" },
  { value: "booking-and-walk-in", label: "เปิดจอง + walk-in", description: "ลูกค้าจองล่วงหน้าและเข้าคิววันนี้ได้" },
  { value: "walk-in-only", label: "walk-in เท่านั้น", description: "ไม่เปิด slot จองล่วงหน้าวันนี้" },
  { value: "closed", label: "ปิดรับทั้งหมด", description: "ไม่รับทั้งจองและ walk-in" },
];

const getModeSummary = (mode: DateAvailabilityMode) => modeOptions.find((option) => option.value === mode)?.label ?? "ใช้ค่าปกติของร้าน";

const OwnerAvailabilityPage = async ({ searchParams }: OwnerAvailabilityPageProps) => {
  await requireOwnerSession();

  const [params, items] = await Promise.all([searchParams, getOwnerDateAvailabilityItemsSafe()]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact">
        <OwnerHeader
          title="วันรับจอง / walk-in"
          description="กำหนดรายวันว่าวันไหนเปิดจอง วันไหนรับ walk-in เท่านั้น หรือปิดรับทั้งหมด"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/owner/settings">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับตั้งค่า
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {statusMessage ? <Notice tone="warm">{statusMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-availability-error:${params.error ?? ""}`} />
        <RouteToast message={statusMessage} type="success" toastKey={`owner-availability-status:${params.status ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench">
          <Panel aria-labelledby="owner-availability-list-title">
            <SectionHeader
              id="owner-availability-list-title"
              title="14 วันข้างหน้า"
              note="ถ้าเลือกใช้ค่าปกติ ระบบจะลบ override ของวันนั้น แล้วกลับไปใช้ setting หลักของร้าน"
            />

            <FormStack>
              {items.map((item) => (
                <form action={updateOwnerDateAvailabilityAction} key={item.dateValue} className="bqa-owner-availability-row">
                  <input name="dateValue" type="hidden" value={item.dateValue} />
                  <div className="bqa-owner-availability-date">
                    <strong>{item.label}</strong>
                    <span>{item.dateValue}</span>
                    <small>{item.hasOverride ? getModeSummary(item.mode) : "ใช้ค่าปกติ"}</small>
                  </div>

                  <FormGrid>
                    <FormField id={`mode-${item.dateValue}`} label="สถานะวันนั้น">
                      <Select name="mode" defaultValue={item.mode} required>
                        <SelectTrigger id={`mode-${item.dateValue}`}>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                          {modeOptions.map((option) => (
                            <SelectItem value={option.value} key={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField id={`reason-${item.dateValue}`} label="หมายเหตุ" description="ไม่บังคับ">
                      <Input id={`reason-${item.dateValue}`} name="reason" defaultValue={item.reason} placeholder="เช่น ช่างไม่อยู่ / รับ walk-in อย่างเดียว" />
                    </FormField>
                  </FormGrid>

                  <Button type="submit" variant={item.hasOverride ? "outline" : "default"} size="md" fullWidth>
                    <Icon icon="lucide:save" aria-hidden="true" />บันทึกวันนี้
                  </Button>
                </form>
              ))}
            </FormStack>
          </Panel>

          <Panel tone="warm">
            <SectionHeader title="กติกา" note="ใช้กับหน้าลูกค้าและ backend จริง" />
            <div className="bqa-owner-step-list">
              {modeOptions.map((option, index) => (
                <div className="bqa-owner-step-row" key={option.value}>
                  <span>{index + 1}</span>
                  <p>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </OwnerGrid>
      </div>
    </main>
  );
};

export default OwnerAvailabilityPage;
