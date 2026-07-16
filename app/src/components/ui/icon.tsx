"use client";

import lucideIcons from "@iconify-json/lucide/icons.json";
import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

export type IIconProps = Omit<IconProps, "icon"> & {
  icon: `lucide:${string}`;
};

export const Icon = ({ icon, height = "1em", width = "1em", ...props }: IIconProps) => {
  const iconName = icon.slice("lucide:".length) as keyof typeof lucideIcons.icons;
  const iconData = lucideIcons.icons[iconName];

  if (!iconData) {
    return null;
  }

  return (
    <IconifyIcon
      icon={{ ...iconData, width: lucideIcons.width, height: lucideIcons.height }}
      height={height}
      width={width}
      {...props}
    />
  );
};
