"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export type ISelectProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

export const Select = (props: ISelectProps) => <SelectPrimitive.Root {...props} />;

export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export type ISelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;

export const SelectTrigger = ({ className, children, ...props }: ISelectTriggerProps) => (
  <SelectPrimitive.Trigger
    className={cn("ui-select-trigger", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <Icon icon="lucide:chevron-down" className="ui-select-icon" aria-hidden="true" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

export type ISelectContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

export const SelectContent = ({ className, children, position = "popper", ...props }: ISelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        "ui-select-content",
        position === "popper" && "ui-select-content--popper",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn("ui-select-viewport", position === "popper" && "ui-select-viewport--popper")}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

export type ISelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

export const SelectItem = ({ className, children, ...props }: ISelectItemProps) => (
  <SelectPrimitive.Item
    className={cn("ui-select-item", className)}
    {...props}
  >
    <span className="ui-select-item-indicator">
      <SelectPrimitive.ItemIndicator>
        <Icon icon="lucide:check" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);
