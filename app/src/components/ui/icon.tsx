"use client";

import lucideIcons from "@iconify-json/lucide/icons.json";
import { Icon as IconifyIcon, addCollection, type IconProps } from "@iconify/react";

addCollection(lucideIcons);

export type IIconProps = Omit<IconProps, "icon"> & {
  icon: `lucide:${string}`;
};

export const Icon = ({ icon, height = "1em", width = "1em", ...props }: IIconProps) => (
  <IconifyIcon icon={icon} height={height} width={width} {...props} />
);
