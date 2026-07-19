import Link from "next/link";
import { FormGrid, FormStack, Notice, OwnerGrid, OwnerHeader, Panel, SectionHeader } from "@/components/barber/app-ui";
import { cn } from "@/lib/cn";
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
import {
  getOwnerDateAvailabilityItemsSafe,
  getOwnerWeeklyAvailabilityItemsSafe,
  type DateAvailabilityMode,
} from "@/lib/queue/repository";
import {
  applyOwnerWeeklyAvailabilityPresetAction,
  updateOwnerDateAvailabilityAction,
  updateOwnerWeeklyAvailabilityAction,
} from "../../actions";
import { OwnerShell } from "../../_components/owner-shell";
import { OwnerAvailabilityResponsiveSchedule } from "./owner-availability-responsive-schedule";

export const dynamic = "force-dynamic";

type OwnerAvailabilityPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  database: "ยังบันทึกตารางรับลูกค้าไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  invalid: "ข้อมูลวันหรือสถานะไม่ถูกต้อง ลองเลือกใหม่อีกครั้ง",
};

const statusMessages: Record<string, string> = {
  "availability-updated": "บันทึกวันพิเศษแล้ว",
  "weekly-availability-updated": "บันทึกตารางประจำสัปดาห์แล้ว",
  "weekly-preset-applied": "ตั้งค่าจันทร์–ศุกร์ออนไลน์ และเสาร์–อาทิตย์หน้าร้านแล้ว",
};

const availabilityModes: Array<{ value: Exclude<DateAvailabilityMode, "default">; label: string; description: string }> = [
  { value: "booking-and-walk-in", label: "เปิดระบบออนไลน์", description: "จองล่วงหน้าและรับบัตรคิวออนไลน์ได้" },
  { value: "in-store-only", label: "รับเฉพาะหน้าร้าน", description: "ร้านเปิด แต่ไม่รับจองหรือบัตรคิวผ่านเว็บ" },
  { value: "closed", label: "ร้านปิด", description: "ไม่รับลูกค้าทั้งออนไลน์และหน้าร้าน" },
];

const weeklyModeOptions: Array<{ value: DateAvailabilityMode; label: string }> = [
  { value: "default", label: "ใช้ค่าหลักของร้าน" },
  ...availabilityModes.map(({ value, label }) => ({ value, label })),
];

const dateModeOptions: Array<{ value: DateAvailabilityMode; label: string }> = [
  { value: "default", label: "ใช้ตารางประจำสัปดาห์" },
  ...availabilityModes.map(({ value, label }) => ({ value, label })),
];

const getModeLabel = (mode: DateAvailabilityMode, fallbackLabel: string) =>
  availabilityModes.find((option) => option.value === mode)?.label ?? fallbackLabel;

const OwnerAvailabilityPage = async ({ searchParams }: OwnerAvailabilityPageProps) => {
  await requireOwnerSession();

  const [params, weeklyItems, dateItems] = await Promise.all([
    searchParams,
    getOwnerWeeklyAvailabilityItemsSafe(),
    getOwnerDateAvailabilityItemsSafe(),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <OwnerShell>
      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact">
        <OwnerHeader
          title="ตารางรับลูกค้าประจำสัปดาห์"
          description="ตั้งครั้งเดียวแล้วใช้ซ้ำทุกสัปดาห์ เช่น จันทร์–ศุกร์เปิดระบบออนไลน์ และเสาร์–อาทิตย์รับเฉพาะหน้าร้าน"
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
          <div className="bqa-owner-availability-main">
            <Panel aria-labelledby="owner-weekly-availability-title" className="bqa-owner-weekly-schedule-panel">
              <SectionHeader
                id="owner-weekly-availability-title"
                title="จันทร์–อาทิตย์"
                note="บันทึกแยกทีละวัน ไม่มีปุ่มบันทึกทั้งสัปดาห์"
                action={
                  <form action={applyOwnerWeeklyAvailabilityPresetAction}>
                    <Button type="submit" variant="outline" size="sm" className="bqa-owner-weekly-preset-button">
                      <Icon icon="lucide:wand-sparkles" aria-hidden="true" />จ.–ศ. ออนไลน์ / ส.–อา. หน้าร้าน
                    </Button>
                  </form>
                }
              />

              <OwnerAvailabilityResponsiveSchedule>
                <div className="bqa-owner-weekly-schedule-head" aria-hidden="true">
                  <span>วัน</span>
                  <span>รูปแบบรับลูกค้า</span>
                  <span>หมายเหตุ (ไม่บังคับ)</span>
                  <span>บันทึกแยกวัน</span>
                </div>
                {weeklyItems.map((item) => {
                  const modeLabel = item.hasOverride ? getModeLabel(item.mode, "ใช้ค่าหลักของร้าน") : "ใช้ค่าหลักของร้าน";

                  return (
                    <details
                      open={item.dayOfWeek === 1}
                      key={item.dayOfWeek}
                      className={cn("bqa-owner-weekly-disclosure", item.dayOfWeek === 1 && "bqa-owner-weekly-disclosure--default-open")}
                    >
                      <summary className="bqa-owner-weekly-summary">
                        <span className="bqa-owner-weekly-summary-day">
                          <span>{item.shortLabel}</span>
                          <strong>{item.label}</strong>
                        </span>
                        <span className="bqa-owner-weekly-summary-mode">{modeLabel}</span>
                        <Icon icon="lucide:chevron-right" aria-hidden="true" />
                      </summary>

                      <form action={updateOwnerWeeklyAvailabilityAction} className="bqa-owner-availability-row bqa-owner-weekly-row">
                        <input name="dayOfWeek" type="hidden" value={item.dayOfWeek} />
                        <div className="bqa-owner-weekly-day">
                          <span>{item.shortLabel}</span>
                          <p>
                            <strong>{item.label}</strong>
                            <small>{modeLabel}</small>
                          </p>
                        </div>

                        <FormGrid>
                          <FormField id={`weekly-mode-${item.dayOfWeek}`} label="รูปแบบรับลูกค้า">
                            <Select name="mode" defaultValue={item.mode} required>
                              <SelectTrigger id={`weekly-mode-${item.dayOfWeek}`}>
                                <SelectValue placeholder="เลือกสถานะ" />
                              </SelectTrigger>
                              <SelectContent>
                                {weeklyModeOptions.map((option) => (
                                  <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField id={`weekly-reason-${item.dayOfWeek}`} label="หมายเหตุ" description="ไม่บังคับ">
                            <Input id={`weekly-reason-${item.dayOfWeek}`} name="reason" defaultValue={item.reason} placeholder="เพิ่มหมายเหตุ" />
                          </FormField>
                        </FormGrid>

                        <Button type="submit" variant="default" size="md" fullWidth className="bqa-owner-weekly-save-button">
                          <Icon icon="lucide:save" aria-hidden="true" />บันทึกวันนี้
                        </Button>
                      </form>
                    </details>
                  );
                })}
              </OwnerAvailabilityResponsiveSchedule>
            </Panel>

            <details className="bqa-owner-availability-exceptions">
              <summary>
                <span>
                  <strong>วันพิเศษ 14 วันข้างหน้า</strong>
                  <small>ใช้เฉพาะวันหยุด ช่างลา หรือวันที่ต้องการ override ตารางประจำสัปดาห์</small>
                </span>
                <Icon icon="lucide:chevron-down" aria-hidden="true" />
              </summary>

              <Panel>
                <FormStack>
                  {dateItems.map((item) => (
                    <form action={updateOwnerDateAvailabilityAction} key={item.dateValue} className="bqa-owner-availability-row">
                      <input name="dateValue" type="hidden" value={item.dateValue} />
                      <div className="bqa-owner-availability-date">
                        <strong>{item.label}</strong>
                        <span>{item.dateValue}</span>
                        <small>{item.hasOverride ? getModeLabel(item.mode, "ใช้ตารางประจำสัปดาห์") : "ใช้ตารางประจำสัปดาห์"}</small>
                      </div>

                      <FormGrid>
                        <FormField id={`mode-${item.dateValue}`} label="สถานะวันนั้น">
                          <Select name="mode" defaultValue={item.mode} required>
                            <SelectTrigger id={`mode-${item.dateValue}`}>
                              <SelectValue placeholder="เลือกสถานะ" />
                            </SelectTrigger>
                            <SelectContent>
                              {dateModeOptions.map((option) => (
                                <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField id={`reason-${item.dateValue}`} label="หมายเหตุ" description="ไม่บังคับ">
                          <Input id={`reason-${item.dateValue}`} name="reason" defaultValue={item.reason} placeholder="เช่น วันหยุด / ช่างลา" />
                        </FormField>
                      </FormGrid>

                      <Button type="submit" variant={item.hasOverride ? "outline" : "default"} size="md" fullWidth>
                        <Icon icon="lucide:save" aria-hidden="true" />บันทึกวันนี้
                      </Button>
                    </form>
                  ))}
                </FormStack>
              </Panel>
            </details>
          </div>

          <Panel tone="warm" className="bqa-owner-availability-legend">
            <SectionHeader title="รูปแบบรับลูกค้า" note="คำอธิบายผลลัพธ์ที่ลูกค้าจะเห็น" />
            <div className="bqa-owner-step-list">
              {availabilityModes.map((option) => (
                <div className="bqa-owner-step-row" key={option.value}>
                  <span aria-hidden="true">
                    <Icon icon={option.value === "booking-and-walk-in" ? "lucide:laptop" : option.value === "in-store-only" ? "lucide:store" : "lucide:badge-x"} />
                  </span>
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
    </OwnerShell>
  );
};

export default OwnerAvailabilityPage;
