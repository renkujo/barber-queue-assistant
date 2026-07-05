import Link from "next/link";
import { AppCard, FormStack, Notice, PageHeader, ScreenShell, StatGrid, StatTile } from "@/components/barber/app-ui";
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
import { getQueueStatusSnapshotSafe, getServicesSafe, getShopIntakeSettingsSafe } from "@/lib/queue/repository";
import { createWalkInAction } from "./actions";

type WalkInPageProps = {
  searchParams: Promise<{ error?: string; lineUserId?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "กรอกข้อมูลไม่ครบ ลองตรวจชื่อและบริการอีกครั้ง",
  closed: "ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว ลองเช็คอีกครั้งภายหลัง",
  database: "ยังรับคิวไม่ได้ ตรวจ database/migration ก่อนลองใหม่",
};

const WalkInPage = async ({ searchParams }: WalkInPageProps) => {
  const [params, services, snapshot, intakeSettings] = await Promise.all([
    searchParams,
    getServicesSafe(),
    getQueueStatusSnapshotSafe(),
    getShopIntakeSettingsSafe(),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const lineUserId = params.lineUserId?.trim();
  const defaultServiceId = services[0]?.id;
  const hasServices = services.length > 0;
  const walkInClosed = !intakeSettings.walkInAvailable;

  return (
    <ScreenShell>
      <AppCard labelledBy="walk-in-title" className="bqa-app-card--wide">
        <PageHeader
          id="walk-in-title"
          title="เข้าคิวหน้าร้าน"
          subtitle="รับคิววันนี้"
          imageSrc="/assets/generated-v1/walk-in-queue-cutout.png"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Icon icon="lucide:chevron-left" aria-hidden="true" />กลับ
              </Link>
            </Button>
          }
        />

        <StatGrid aria-label="สถานะคิวตอนนี้">
          <StatTile icon={<Icon icon="lucide:users" aria-hidden="true" />} label="คิวตอนนี้" value={snapshot.shop.currentQueueCount} unit="คน" />
          <StatTile icon={<Icon icon="lucide:clock" aria-hidden="true" />} label="รอประมาณ" value={snapshot.shop.estimatedWaitMinutes} unit="นาที" />
        </StatGrid>

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {walkInClosed ? <Notice tone="warm">ตอนนี้ร้านปิดรับคิวจากลูกค้าแล้ว เจ้าของร้านจะเปิดรับอีกครั้งเมื่อพร้อม</Notice> : null}
        {!hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ ตอนนี้ยังรับคิวจากลูกค้าไม่ได้</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`walk-in:${params.error ?? ""}`} />

        <form action={createWalkInAction}>
          {lineUserId ? <input type="hidden" name="lineUserId" value={lineUserId} /> : null}
          <FormStack>
          <FormField id="serviceId" label="บริการ">
            <Select name="serviceId" defaultValue={defaultServiceId} required>
              <SelectTrigger id="serviceId"><SelectValue placeholder="เลือกบริการ" /></SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem value={service.id} key={service.id}>{service.name} · {service.durationMinutes} นาที · {service.priceLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="customerName" label="ชื่อ">
            <Input id="customerName" name="customerName" required placeholder="ชื่อของคุณ" />
          </FormField>
          <FormField id="phone" label="เบอร์โทร">
            <Input id="phone" name="phone" inputMode="tel" placeholder="เบอร์สำหรับติดต่อ" />
          </FormField>
          <FormField id="note" label="หมายเหตุ">
            <Textarea id="note" name="note" placeholder="เช่น รอที่ร้านแล้ว" />
          </FormField>
          <Button type="submit" size="lg" fullWidth disabled={walkInClosed || !hasServices}>
            <Icon icon="lucide:users" aria-hidden="true" />รับคิววันนี้
          </Button>
          </FormStack>
        </form>
      </AppCard>
    </ScreenShell>
  );
};

export default WalkInPage;
