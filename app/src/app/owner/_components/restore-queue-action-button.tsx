"use client";

import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Icon,
} from "@/components/ui";
import { restoreQueueItemAction } from "../actions";

const PendingRestoreButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="default" size="sm" disabled={pending} fullWidth>
      {pending ? "กำลังเปิดคิว..." : "เปิดคิวกลับ"}
    </Button>
  );
};

export const RestoreQueueActionButton = ({ customerLabel, itemId }: { customerLabel: string; itemId: string }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="outline" size="sm" className="bqa-owner-restore-button">
        <Icon icon="lucide:rotate-ccw" aria-hidden="true" />เปิดกลับ
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="bqa-confirm-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle>เปิดคิวนี้กลับเข้ารายการวันนี้?</AlertDialogTitle>
        <AlertDialogDescription>สถานะจะกลับเป็นรออยู่ และคิวนี้จะแสดงในรายการ active ของวันนี้อีกครั้ง</AlertDialogDescription>
      </AlertDialogHeader>

      <div className="bqa-confirm-target">
        <span>คิวที่จะเปิดกลับ</span>
        <strong>{customerLabel}</strong>
      </div>

      <form action={restoreQueueItemAction} className="bqa-confirm-actions">
        <input name="queueItemId" type="hidden" value={itemId} />
        <AlertDialogCancel asChild>
          <Button variant="outline" type="button" fullWidth>
            ยังไม่เปิด
          </Button>
        </AlertDialogCancel>
        <PendingRestoreButton />
      </form>
    </AlertDialogContent>
  </AlertDialog>
);
