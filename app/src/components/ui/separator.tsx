import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ISeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

export const Separator = ({ className, orientation = "horizontal", decorative = true, ...props }: ISeparatorProps) => (
  <SeparatorPrimitive.Root
    className={cn(
      "ui-separator",
      orientation === "horizontal" ? "ui-separator--horizontal" : "ui-separator--vertical",
      className,
    )}
    orientation={orientation}
    decorative={decorative}
    {...props}
  />
);
