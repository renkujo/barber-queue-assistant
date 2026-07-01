import { type ComponentPropsWithoutRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";
import { cn } from "@/lib/cn";

const alertVariants = tv({
  base: "ui-alert",
  variants: {
    tone: {
      default: "ui-alert--default",
      warm: "ui-alert--warm",
      danger: "ui-alert--danger",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

export interface IAlertProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof alertVariants> {}

export const Alert = ({ className, tone, ...props }: IAlertProps) => (
  <div role="alert" className={cn(alertVariants({ tone }), className)} {...props} />
);

export type IAlertTitleProps = ComponentPropsWithoutRef<"h3">;

export const AlertTitle = ({ className, ...props }: IAlertTitleProps) => (
  <h3 className={cn("ui-alert-title", className)} {...props} />
);

export type IAlertDescriptionProps = ComponentPropsWithoutRef<"div">;

export const AlertDescription = ({ className, ...props }: IAlertDescriptionProps) => (
  <div className={cn("ui-alert-description", className)} {...props} />
);
