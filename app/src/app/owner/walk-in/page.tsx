import Link from "next/link";
import { Notice } from "@/components/barber/app-ui";
import { Icon, RouteToast } from "@/components/ui";
import { requireOwnerSession } from "@/lib/admin-auth";
import { getServicesSafe } from "@/lib/queue/repository";
import { createOwnerWalkInAction } from "../actions";
import { OwnerShell } from "../_components/owner-shell";
import { OwnerWalkInForm } from "./owner-walk-in-form";

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
  const hasServices = services.length > 0;

  return (
    <OwnerShell>
      <div className="bqa-owner-board-content bqa-owner-form-content bqa-owner-form-content--compact bqa-owner-walkin-content">
        <header className="bqa-owner-walkin-header">
          <div>
            <h1>เพิ่มคิว</h1>
            <p>เพิ่มลูกค้าเข้าคิววันนี้ได้ทันที</p>
          </div>
          <Link href="/owner" className="bqa-owner-walkin-back">
            <Icon icon="lucide:chevron-left" aria-hidden="true" />
            <span>กลับคิววันนี้</span>
          </Link>
        </header>

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}
        {!hasServices ? <Notice>ยังไม่มีบริการที่เปิดใช้ เปิดใช้หรือเพิ่มบริการก่อนเพิ่ม walk-in</Notice> : null}
        <RouteToast message={errorMessage} type="error" toastKey={`owner-walk-in:${params.error ?? ""}`} />
        <OwnerWalkInForm action={createOwnerWalkInAction} services={services} />
      </div>
    </OwnerShell>
  );
};

export default OwnerWalkInPage;
