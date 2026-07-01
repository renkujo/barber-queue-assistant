"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export type IAlertDialogContentProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>;

export const AlertDialogContent = ({ className, children, ...props }: IAlertDialogContentProps) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="ui-dialog-overlay" />
    <AlertDialogPrimitive.Content className={cn("ui-dialog-content", "ui-alert-dialog-content", className)} {...props}>
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

export type IAlertDialogHeaderProps = ComponentPropsWithoutRef<"div">;

export const AlertDialogHeader = ({ className, ...props }: IAlertDialogHeaderProps) => (
  <div className={cn("ui-dialog-header", className)} {...props} />
);

export type IAlertDialogTitleProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>;

export const AlertDialogTitle = ({ className, ...props }: IAlertDialogTitleProps) => (
  <AlertDialogPrimitive.Title className={cn("ui-dialog-title", className)} {...props} />
);

export type IAlertDialogDescriptionProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>;

export const AlertDialogDescription = ({ className, ...props }: IAlertDialogDescriptionProps) => (
  <AlertDialogPrimitive.Description className={cn("ui-dialog-description", className)} {...props} />
);

export type IAlertDialogFooterProps = ComponentPropsWithoutRef<"div">;

export const AlertDialogFooter = ({ className, ...props }: IAlertDialogFooterProps) => (
  <div className={cn("ui-dialog-footer", className)} {...props} />
);
