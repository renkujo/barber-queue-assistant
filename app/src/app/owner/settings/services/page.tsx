import Link from "next/link";
import { FormGrid, FormStack, Notice, OwnerHeader, OwnerGrid, Panel, SectionHeader, StatusBadge } from "@/components/barber/app-ui";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { getOwnerServiceSettingsSafe } from "@/lib/queue/repository";
import { createOwnerServiceAction, toggleOwnerServiceAction, updateOwnerServiceAction } from "../../actions";
import { OwnerTopbar } from "../../_components/owner-topbar";

type OwnerServiceSettingsPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  database: "ยังบันทึกบริการไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
  invalid: "ข้อมูลบริการไม่ถูกต้อง ตรวจชื่อ ระยะเวลา ราคา และลำดับอีกครั้ง",
};

const statusMessages: Record<string, string> = {
  "service-created": "เพิ่มบริการใหม่แล้ว",
  "service-disabled": "ปิดใช้บริการแล้ว",
  "service-restored": "เปิดใช้บริการกลับมาแล้ว",
  "service-updated": "บันทึกบริการแล้ว",
};

const activeOptions = [
  { label: "เปิดใช้", value: "true" },
  { label: "ปิดใช้", value: "false" },
];

const OwnerServiceSettingsPage = async ({ searchParams }: OwnerServiceSettingsPageProps) => {
  await requireOwnerSession();

  const [params, services] = await Promise.all([searchParams, getOwnerServiceSettingsSafe()]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;
  const nextSortOrder = services.length ? Math.max(...services.map((service) => service.sortOrder)) + 1 : 0;

  return (
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact">
        <OwnerHeader
          title="ตั้งค่าบริการ"
          description="เพิ่ม แก้ไข และปิดใช้บริการที่ลูกค้าเลือกได้"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/owner/settings">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับตั้งค่าร้าน
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {statusMessage ? <Notice tone="warm">{statusMessage}</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-service-settings-error:${params.error ?? ""}`} />
        <RouteToast message={statusMessage} type="success" toastKey={`owner-service-settings-status:${params.status ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench">
          <Panel aria-labelledby="owner-service-list-title">
            <SectionHeader id="owner-service-list-title" title="บริการทั้งหมด" note="ปิดใช้ = soft delete ไม่ลบข้อมูลจริง" />
            <div className="grid gap-3">
              {services.map((service) => (
                <Card className="bqa-owner-service-settings-card !rounded-[14px] !border-[var(--line)] !bg-[color-mix(in_srgb,var(--surface)_88%,var(--paper))]" key={service.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 px-3.5 py-3">
                    <div>
                      <CardTitle className="!mb-1 !text-base !leading-tight">{service.name}</CardTitle>
                      <CardDescription className="!text-xs !font-semibold">
                        {service.durationMinutes} นาที · {service.priceLabel} · ลำดับ {service.sortOrder}
                      </CardDescription>
                    </div>
                    <StatusBadge tone={service.isActive ? "positive" : "neutral"}>{service.isActive ? "เปิดใช้" : "ปิดใช้"}</StatusBadge>
                  </CardHeader>
                  <CardContent className="px-3.5 pb-3 pt-0">
                    <details className="bqa-owner-service-edit">
                      <summary>
                        <span>
                          <Icon icon="lucide:pencil" aria-hidden="true" />แก้ไขบริการ
                        </span>
                        <Icon icon="lucide:chevron-down" aria-hidden="true" />
                      </summary>

                      <form action={updateOwnerServiceAction}>
                        <input name="serviceId" type="hidden" value={service.id} />
                        <FormStack>
                          <FormField id={`service-name-${service.id}`} label="ชื่อบริการ">
                            <Input id={`service-name-${service.id}`} name="name" defaultValue={service.name} required />
                          </FormField>
                          <FormGrid>
                            <FormField id={`service-duration-${service.id}`} label="ระยะเวลา (นาที)">
                              <Input id={`service-duration-${service.id}`} name="durationMinutes" defaultValue={service.durationMinutes} min={5} max={480} required type="number" />
                            </FormField>
                            <FormField id={`service-price-${service.id}`} label="ราคา (บาท)">
                              <Input id={`service-price-${service.id}`} name="priceBaht" defaultValue={service.priceBaht} min={0} placeholder="เว้นว่าง = สอบถามราคา" type="number" />
                            </FormField>
                          </FormGrid>
                          <FormGrid>
                            <FormField id={`service-sort-${service.id}`} label="ลำดับ">
                              <Input id={`service-sort-${service.id}`} name="sortOrder" defaultValue={service.sortOrder} min={0} max={9999} required type="number" />
                            </FormField>
                            <FormField id={`service-active-${service.id}`} label="สถานะ">
                              <Select name="isActive" defaultValue={String(service.isActive)} required>
                                <SelectTrigger id={`service-active-${service.id}`}>
                                  <SelectValue placeholder="เลือกสถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activeOptions.map((option) => (
                                    <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>
                          </FormGrid>
                          <Button type="submit" fullWidth>
                            <Icon icon="lucide:save" aria-hidden="true" />บันทึกบริการ
                          </Button>
                        </FormStack>
                      </form>
                    </details>

                    <form action={toggleOwnerServiceAction} className="mt-2">
                      <input name="serviceId" type="hidden" value={service.id} />
                      <input name="isActive" type="hidden" value={service.isActive ? "false" : "true"} />
                      <Button variant="outline" type="submit" fullWidth>
                        <Icon icon={service.isActive ? "lucide:eye-off" : "lucide:rotate-ccw"} aria-hidden="true" />
                        {service.isActive ? "ปิดใช้บริการ" : "เปิดใช้กลับ"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Panel>

          <div className="bqa-owner-support-stack bqa-owner-support-stack--visible-mobile">
            <Panel aria-labelledby="owner-service-add-title">
              <SectionHeader id="owner-service-add-title" title="เพิ่มบริการ" note="บริการใหม่จะแสดงในหน้าจองทันทีถ้าเปิดใช้" />
              <form action={createOwnerServiceAction}>
                <FormStack>
                  <FormField id="new-service-name" label="ชื่อบริการ">
                    <Input id="new-service-name" name="name" required placeholder="เช่น ตัดผม + สระ" />
                  </FormField>
                  <FormField id="new-service-duration" label="ระยะเวลา (นาที)">
                    <Input id="new-service-duration" name="durationMinutes" defaultValue={30} min={5} max={480} required type="number" />
                  </FormField>
                  <FormField id="new-service-price" label="ราคา (บาท)">
                    <Input id="new-service-price" name="priceBaht" min={0} placeholder="เช่น 350" type="number" />
                  </FormField>
                  <FormField id="new-service-sort" label="ลำดับ">
                    <Input id="new-service-sort" name="sortOrder" defaultValue={nextSortOrder} min={0} max={9999} required type="number" />
                  </FormField>
                  <input name="isActive" type="hidden" value="true" />
                  <Button type="submit" fullWidth>
                    <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มบริการ
                  </Button>
                </FormStack>
              </form>
            </Panel>
          </div>
        </OwnerGrid>
      </div>
    </main>
  );
};

export default OwnerServiceSettingsPage;
