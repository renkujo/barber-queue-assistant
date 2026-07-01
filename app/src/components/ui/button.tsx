import { Slot } from "@radix-ui/react-slot";
import { type ComponentPropsWithoutRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";
import { cn } from "@/lib/cn";

const buttonVariants = tv({
  base: "ui-button",
  variants: {
    variant: {
      default: "ui-button--default",
      destructive: "ui-button--destructive",
      outline: "ui-button--outline",
      primary: "ui-button--primary",
      secondary: "ui-button--secondary",
      positive: "ui-button--positive",
      danger: "ui-button--danger",
      ghost: "ui-button--ghost",
      link: "ui-button--link",
    },
    size: {
      default: "ui-button--default-size",
      xs: "ui-button--xs",
      sm: "ui-button--sm",
      md: "ui-button--md",
      lg: "ui-button--lg",
      icon: "ui-button--icon",
      "icon-xs": "ui-button--icon-xs",
      "icon-sm": "ui-button--icon-sm",
      "icon-lg": "ui-button--icon-lg",
    },
    fullWidth: {
      true: "ui-button--full",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface IButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({
  asChild = false,
  className,
  variant,
  size,
  fullWidth,
  ...props
}: IButtonProps) => {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
};

export { buttonVariants };
