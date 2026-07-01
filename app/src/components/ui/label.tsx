import * as LabelPrimitive from "@radix-ui/react-label";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ILabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export const Label = ({ className, ...props }: ILabelProps) => (
  <LabelPrimitive.Root
    className={cn("ui-label", className)}
    {...props}
  />
);
