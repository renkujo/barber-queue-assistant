import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ICardProps = ComponentPropsWithoutRef<"section">;

export const Card = ({ className, ...props }: ICardProps) => (
  <section className={cn("ui-card", className)} {...props} />
);

export type ICardHeaderProps = ComponentPropsWithoutRef<"div">;

export const CardHeader = ({ className, ...props }: ICardHeaderProps) => (
  <div className={cn("ui-card-header", className)} {...props} />
);

export type ICardTitleProps = ComponentPropsWithoutRef<"h2">;

export const CardTitle = ({ className, ...props }: ICardTitleProps) => (
  <h2 className={cn("ui-card-title", className)} {...props} />
);

export type ICardDescriptionProps = ComponentPropsWithoutRef<"p">;

export const CardDescription = ({ className, ...props }: ICardDescriptionProps) => (
  <p className={cn("ui-card-description", className)} {...props} />
);

export type ICardContentProps = ComponentPropsWithoutRef<"div">;

export const CardContent = ({ className, ...props }: ICardContentProps) => (
  <div className={cn("ui-card-content", className)} {...props} />
);
