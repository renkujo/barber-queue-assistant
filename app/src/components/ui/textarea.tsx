import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ITextareaProps = ComponentPropsWithoutRef<"textarea">;

export const Textarea = ({ className, ...props }: ITextareaProps) => (
  <textarea
    className={cn("ui-textarea", className)}
    {...props}
  />
);
