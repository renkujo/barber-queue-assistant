import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type IInputProps = ComponentPropsWithoutRef<"input">;

export const Input = ({ className, ...props }: IInputProps) => (
  <input
    className={cn("ui-input", className)}
    {...props}
  />
);
