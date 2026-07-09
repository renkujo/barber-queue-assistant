import Link from "next/link";
import { FormStack, Notice, OwnerGrid, OwnerHeader, Panel, SectionHeader } from "@/components/barber/app-ui";
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
  Textarea,
} from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getServicesSafe } from "@/lib/queue/repository";
import { createOwnerWalkInAction } from "../actions";
import { OwnerTopbar } from "../_components/owner-topbar";

export const dynamic = "force-dynamic";

type OwnerWalkInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อและบริการอีกครั้ง",
  database: "ยังเพิ่ม walk-in ไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const OwnerWalkInPage = async ({ searchParams }: OwnerWalkInPageProps) => {
  await requireOwnerSession();

  const [params, services] = await Promise.all([searchParams, getServicesSafe()]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const visibleServices = services.slice(0, 4);

  return (
    <main className="bqa-owner-board-shell">
      <OwnerTopbar />

      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact">
        <OwnerHeader
          title="เพิ่ม walk-in"
          description="รับลูกค้าที่หน้าร้านแล้วส่งเข้ารายการคิววันนี้ทันที"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/owner">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับคิววันนี้
              </Link>
            </Button>
          }
        />

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {!hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ เปิดใช้หรือเพิ่มบริการก่อนเพิ่ม walk-in</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-walk-in:${params.error ?? ""}`} />

        <OwnerGrid className="bqa-owner-grid--workbench">
          <Panel aria-labelledby="owner-walk-in-form-title">
            <SectionHeader id="owner-walk-in-form-title" title="ข้อมูลลูกค้า" note="เลือกบริการและเพิ่มรายละเอียดเท่าที่จำเป็น" />
            <form action={createOwnerWalkInAction}>
              <FormStack>
                <FormField id="serviceId" label="บริการ">
                  <Select name="serviceId" defaultValue={defaultServiceId} required>
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
                <FormField id="customerName" label="ชื่อลูกค้า">
                  <Input id="customerName" name="customerName" required placeholder="เช่น คุณนนท์" />
                </FormField>
                <FormField id="phone" label="เบอร์โทร" description="ถ้าไม่มี ข้ามได้">
                  <Input id="phone" name="phone" inputMode="tel" placeholder="ถ้ามี" />
                </FormField>
                <FormField id="note" label="หมายเหตุ">
                  <Textarea id="note" name="note" placeholder="เช่น รอหน้าร้าน / โทรมา" />
                </FormField>
                <Button type="submit" size="lg" fullWidth disabled={!hasServices}>
                  <Icon icon="lucide:plus" aria-hidden="true" />เพิ่มเข้าคิววันนี้
                </Button>
              </FormStack>
            </form>
          </Panel>

          <div className="bqa-owner-support-stack">
            <Panel className="bqa-owner-support-panel bqa-owner-support-panel--steps">
              <SectionHeader
                title="หลังเพิ่มคิว"
                note="ระบบจะส่งรายการนี้เข้าคิววันนี้ทันที"
                action={<Icon icon="lucide:circle-check" className="bqa-muted-icon" aria-hidden="true" />}
              />
              <div className="bqa-owner-step-list">
                <div className="bqa-owner-step-row">
                  <span>1</span>
                  <p>
                    <strong>เข้ารายการวันนี้</strong>
                    <small>คิวใหม่จะแสดงใน owner dashboard</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span>2</span>
                  <p>
                    <strong>เจ้าของร้านกดเริ่ม</strong>
                    <small>ใช้ปุ่มเริ่มตัดเมื่อพร้อมรับลูกค้า</small>
                  </p>
                </div>
                <div className="bqa-owner-step-row">
                  <span>3</span>
                  <p>
                    <strong>ปิดงานหลังบริการ</strong>
                    <small>กดเสร็จเพื่อเลื่อนคิวถัดไป</small>
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="bqa-owner-support-panel bqa-owner-support-panel--services">
              <SectionHeader
                title="บริการที่เลือกได้"
                note="เช็คเวลาโดยประมาณก่อนเพิ่มคิว"
                action={<Icon icon="lucide:scissors" className="bqa-muted-icon" aria-hidden="true" />}
              />
              <div className="bqa-owner-service-strip">
                {visibleServices.map((service) => (
                  <div className="bqa-owner-service-chip" key={service.id}>
                    <strong>{service.name}</strong>
                    <span>
                      <Icon icon="lucide:clock" aria-hidden="true" />
                      {service.durationMinutes} นาที
                    </span>
                    <small>{service.priceLabel}</small>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </OwnerGrid>
      </div>
    </main>
  );
};

export default OwnerWalkInPage;
