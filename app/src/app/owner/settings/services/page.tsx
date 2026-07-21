import Link from "next/link";
import { FormStack, Notice, OwnerHeader, OwnerGrid, Panel, SectionHeader, StatusBadge } from "@/components/barber/app-ui";
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
import { getOwnerServiceSettingsSafe } from "@/lib/queue/repository";
import { createOwnerServiceAction, toggleOwnerServiceAction, updateOwnerServiceAction } from "../../actions";
import { OwnerShell } from "../../_components/owner-shell";

export const dynamic = "force-dynamic";

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

const serviceIconNames: `lucide:${string}`[] = ["lucide:scissors", "lucide:sparkles", "lucide:razor", "lucide:brush", "lucide:badge-check"];

const CreateServiceForm = ({ idPrefix, nextSortOrder }: { idPrefix: string; nextSortOrder: number }) => (
  <form action={createOwnerServiceAction} className="bqa-owner-service-create-form">
    <FormStack>
      <FormField id={`${idPrefix}-service-name`} label="ชื่อบริการ">
        <Input id={`${idPrefix}-service-name`} name="name" required placeholder="เช่น ตัดผม + สระ" />
      </FormField>
      <FormField id={`${idPrefix}-service-duration`} label="ระยะเวลา (นาที)">
        <Input id={`${idPrefix}-service-duration`} name="durationMinutes" defaultValue={30} min={5} max={480} required type="number" />
      </FormField>
      <FormField id={`${idPrefix}-service-price`} label="ราคา (บาท)" description="เว้นว่างได้ถ้าต้องสอบถามราคา">
        <Input id={`${idPrefix}-service-price`} name="priceBaht" min={0} placeholder="ไม่บังคับ" type="number" />
      </FormField>
      <FormField id={`${idPrefix}-service-sort`} label="ลำดับ">
        <Input id={`${idPrefix}-service-sort`} name="sortOrder" defaultValue={nextSortOrder} min={0} max={9999} required type="number" />
      </FormField>
      <input name="isActive" type="hidden" value="true" />
      <Button type="submit" size="lg" fullWidth>
        <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มบริการ
      </Button>
    </FormStack>
  </form>
);

const OwnerServiceSettingsPage = async ({ searchParams }: OwnerServiceSettingsPageProps) => {
  await requireOwnerSession();

  const [params, services] = await Promise.all([searchParams, getOwnerServiceSettingsSafe()]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;
  const nextSortOrder = services.length ? Math.max(...services.map((service) => service.sortOrder)) + 1 : 0;

  return (
    <OwnerShell visualVersion="v2">
      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact bqa-owner-services-page">
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

        <OwnerGrid className="bqa-owner-grid--workbench bqa-owner-services-workbench">
          <Panel className="bqa-owner-services-create-mobile" aria-labelledby="owner-service-add-mobile-title">
            <details className="bqa-owner-service-add-disclosure">
              <summary>
                <span>
                  <Icon icon="lucide:plus" aria-hidden="true" />
                  <span>
                    <strong id="owner-service-add-mobile-title">เพิ่มบริการ</strong>
                    <small>แตะเพื่อกรอกบริการใหม่</small>
                  </span>
                </span>
                <Icon icon="lucide:chevron-down" aria-hidden="true" />
              </summary>
              <CreateServiceForm idPrefix="mobile-new" nextSortOrder={nextSortOrder} />
            </details>
          </Panel>

          <aside className="bqa-owner-services-create-rail">
            <Panel aria-labelledby="owner-service-add-title">
              <SectionHeader id="owner-service-add-title" title="เพิ่มบริการ" note="บริการใหม่เปิดใช้ทันทีและแสดงให้ลูกค้าเลือกได้" />
              <CreateServiceForm idPrefix="new" nextSortOrder={nextSortOrder} />
            </Panel>
          </aside>

          <Panel className="bqa-owner-services-list-panel" aria-labelledby="owner-service-list-title">
            <SectionHeader id="owner-service-list-title" title="บริการทั้งหมด" note="ปิดใช้ = ปิดชั่วคราว ไม่ลบข้อมูล" />

            {services.length ? (
              <div className="bqa-owner-services-table" role="list" aria-label="รายการบริการทั้งหมด">
                <div className="bqa-owner-services-table-head" aria-hidden="true">
                  <span>บริการ</span>
                  <span>ระยะเวลา</span>
                  <span>ราคา</span>
                  <span>ลำดับ</span>
                  <span>สถานะ</span>
                  <span>จัดการ</span>
                </div>
                {services.map((service, index) => (
                  <details className="bqa-owner-service-disclosure" name="owner-service-editor" open={index === 0} key={service.id}>
                    <summary className="bqa-owner-service-summary">
                      <span className="bqa-owner-service-main">
                        <span className="bqa-owner-service-icon" aria-hidden="true">
                          <Icon icon={serviceIconNames[index % serviceIconNames.length]} />
                        </span>
                        <span>
                          <strong title={service.name}>{service.name}</strong>
                          <small className="bqa-owner-service-mobile-meta">
                            {service.durationMinutes} นาที · {service.priceLabel} · ลำดับ {service.sortOrder}
                          </small>
                        </span>
                      </span>
                      <span className="bqa-owner-service-cell bqa-owner-service-duration">{service.durationMinutes} นาที</span>
                      <span className="bqa-owner-service-cell bqa-owner-service-price">{service.priceLabel}</span>
                      <span className="bqa-owner-service-cell bqa-owner-service-order">{service.sortOrder}</span>
                      <span className="bqa-owner-service-status">
                        <StatusBadge tone={service.isActive ? "positive" : "warning"}>{service.isActive ? "เปิดใช้" : "ปิดใช้"}</StatusBadge>
                      </span>
                      <span className="bqa-owner-service-action-label">
                        <span>แก้ไข</span>
                        <Icon icon="lucide:chevron-down" aria-hidden="true" />
                      </span>
                    </summary>

                    <div className="bqa-owner-service-editor">
                      <form id={`service-update-${service.id}`} action={updateOwnerServiceAction} className="bqa-owner-service-update-form">
                        <input name="serviceId" type="hidden" value={service.id} />
                        <div className="bqa-owner-service-editor-grid">
                          <FormField id={`service-name-${service.id}`} label="ชื่อบริการ">
                            <Input id={`service-name-${service.id}`} name="name" defaultValue={service.name} required />
                          </FormField>
                          <FormField id={`service-duration-${service.id}`} label="ระยะเวลา (นาที)">
                            <Input id={`service-duration-${service.id}`} name="durationMinutes" defaultValue={service.durationMinutes} min={5} max={480} required type="number" />
                          </FormField>
                          <FormField id={`service-price-${service.id}`} label="ราคา (บาท)" description="เว้นว่าง = สอบถามราคา">
                            <Input id={`service-price-${service.id}`} name="priceBaht" defaultValue={service.priceBaht} min={0} placeholder="ไม่บังคับ" type="number" />
                          </FormField>
                          <FormField id={`service-sort-${service.id}`} label="ลำดับ">
                            <Input id={`service-sort-${service.id}`} name="sortOrder" defaultValue={service.sortOrder} min={0} max={9999} required type="number" />
                          </FormField>
                          <FormField id={`service-active-${service.id}`} label="สถานะ">
                            <Select name="isActive" defaultValue={String(service.isActive)} required>
                              <SelectTrigger id={`service-active-${service.id}`}>
                                <SelectValue placeholder="เลือกสถานะ" />
                              </SelectTrigger>
                              <SelectContent className="qw-v2-select-content">
                                {activeOptions.map((option) => (
                                  <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                      </form>

                      <div className="bqa-owner-service-editor-actions">
                        <Button form={`service-update-${service.id}`} type="submit" size="lg">
                          <Icon icon="lucide:save" aria-hidden="true" />บันทึกบริการ
                        </Button>
                        <form action={toggleOwnerServiceAction} className="bqa-owner-service-toggle-form">
                          <input name="serviceId" type="hidden" value={service.id} />
                          <input name="isActive" type="hidden" value={service.isActive ? "false" : "true"} />
                          <Button variant="outline" size="lg" type="submit" fullWidth>
                            <Icon icon={service.isActive ? "lucide:eye-off" : "lucide:rotate-ccw"} aria-hidden="true" />
                            {service.isActive ? "ปิดใช้บริการ" : "เปิดใช้บริการ"}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="bqa-owner-services-empty">
                <Icon icon="lucide:scissors" aria-hidden="true" />
                <div>
                  <strong>ยังไม่มีบริการ</strong>
                  <p>เพิ่มบริการแรกจากฟอร์มเพิ่มบริการ แล้วลูกค้าจะเห็นบริการที่เปิดใช้ทันที</p>
                </div>
              </div>
            )}
          </Panel>
        </OwnerGrid>
      </div>
    </OwnerShell>
  );
};

export default OwnerServiceSettingsPage;
