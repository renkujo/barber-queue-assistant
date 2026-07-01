import { type ComponentPropsWithoutRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";
import { cn } from "@/lib/cn";

const badgeVariants = tv({
  base: "ui-badge",
  variants: {
    variant: {
      neutral: "ui-badge--neutral",
      positive: "ui-badge--positive",
      warning: "ui-badge--warning",
      warm: "ui-badge--warm",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface IBadgeProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: IBadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { badgeVariants };
