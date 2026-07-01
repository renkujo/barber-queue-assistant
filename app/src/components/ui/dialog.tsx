"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type IDialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

export const DialogContent = ({ className, children, ...props }: IDialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="ui-dialog-overlay" />
    <DialogPrimitive.Content
      className={cn("ui-dialog-content", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ui-dialog-close">
        <Icon icon="lucide:x" aria-hidden="true" />
        <span className="ui-sr-only">ปิด</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export type IDialogHeaderProps = ComponentPropsWithoutRef<"div">;

export const DialogHeader = ({ className, ...props }: IDialogHeaderProps) => (
  <div className={cn("ui-dialog-header", className)} {...props} />
);

export type IDialogTitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

export const DialogTitle = ({ className, ...props }: IDialogTitleProps) => (
  <DialogPrimitive.Title className={cn("ui-dialog-title", className)} {...props} />
);

export type IDialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

export const DialogDescription = ({ className, ...props }: IDialogDescriptionProps) => (
  <DialogPrimitive.Description className={cn("ui-dialog-description", className)} {...props} />
);
