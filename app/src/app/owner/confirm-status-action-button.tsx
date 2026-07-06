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
  type IButtonProps,
} from "@/components/ui";
import { updateQueueStatusAction } from "./actions";

type ButtonVariant = NonNullable<IButtonProps["variant"]>;
type ButtonSize = NonNullable<IButtonProps["size"]>;
type ConfirmTone = "complete" | "danger" | "warning";

type ConfirmStatusActionButtonProps = {
  itemId?: string;
  status: string;
  label: string;
  customerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ConfirmTone;
  className?: string;
  disabled?: boolean;
};

const toneIcon = {
  complete: <Icon icon="lucide:circle-check" aria-hidden="true" />,
  danger: <Icon icon="lucide:circle-x" aria-hidden="true" />,
  warning: <Icon icon="lucide:triangle-alert" aria-hidden="true" />,
};

const PendingConfirmButton = ({ children, variant }: { children: React.ReactNode; variant: ButtonVariant }) => {
  const { pending } = useFormStatus();

  return (
    <Button variant={variant} type="submit" disabled={pending} fullWidth>
      {pending ? "กำลังบันทึก..." : children}
    </Button>
  );
};

export const ConfirmStatusActionButton = ({
  itemId,
  status,
  label,
  customerLabel,
  title,
  description,
  confirmLabel,
  variant = "outline",
  size = "default",
  tone = "danger",
  className,
  disabled = false,
}: ConfirmStatusActionButtonProps) => {
  const icon = toneIcon[tone];

  if (!itemId || disabled) {
    return (
      <Button variant={variant} type="button" size={size} disabled fullWidth className={className}>
        {icon}{label}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} type="button" size={size} fullWidth className={className}>
          {icon}{label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bqa-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bqa-confirm-target">
          <span>คิวที่จะเปลี่ยน</span>
          <strong>{customerLabel}</strong>
        </div>

        <form action={updateQueueStatusAction} className="bqa-confirm-actions">
          <input name="queueItemId" type="hidden" value={itemId} />
          <input name="status" type="hidden" value={status} />
          <AlertDialogCancel asChild>
            <Button variant="outline" type="button" fullWidth>
              กลับไปก่อน
            </Button>
          </AlertDialogCancel>
          <PendingConfirmButton variant={variant}>{confirmLabel}</PendingConfirmButton>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
