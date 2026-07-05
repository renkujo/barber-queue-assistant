import Image from "next/image";
import Link, { type LinkProps } from "next/link";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "warm" | "positive" | "warning";

const toneClass: Record<Tone, string> = {
  neutral: "bqa-tone-neutral",
  warm: "bqa-tone-warm",
  positive: "bqa-tone-positive",
  warning: "bqa-tone-warning",
};

export const ScreenShell = ({
  children,
  className,
  variant = "customer",
}: {
  children: ReactNode;
  className?: string;
  variant?: "customer" | "center";
}) => <main className={cn("bqa-screen-shell", variant === "center" && "bqa-screen-shell--center", className)}>{children}</main>;

export const AppCard = ({
  children,
  className,
  labelledBy,
  ...props
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
} & ComponentPropsWithoutRef<"section">) => (
  <Card aria-labelledby={labelledBy} className={cn("bqa-app-card", className)} {...props}>
    {children}
  </Card>
);

export const PageHeader = ({
  title,
  subtitle,
  imageSrc,
  imageAlt = "",
  action,
  badge,
  id,
  largeImage = false,
}: {
  title: string;
  subtitle?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  action?: ReactNode;
  badge?: ReactNode;
  id?: string;
  largeImage?: boolean;
}) => (
  <header className="bqa-page-header">
    <div className="bqa-page-heading">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={largeImage ? 64 : 46}
          height={largeImage ? 64 : 46}
          className={cn("bqa-page-image", largeImage && "bqa-page-image--large")}
          priority={largeImage}
        />
      ) : null}
      <div className="bqa-page-title-group">
        {subtitle ? <p className="bqa-kicker">{subtitle}</p> : null}
        <h1 id={id} className="bqa-page-title">
          {title}
        </h1>
      </div>
    </div>
    {action ?? badge ?? null}
  </header>
);

export const SectionHeader = ({
  title,
  note,
  action,
  id,
}: {
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  id?: string;
}) => (
  <div className="bqa-section-header">
    <div>
      <h2 id={id} className="bqa-section-title">
        {title}
      </h2>
      {note ? <p className="bqa-section-note">{note}</p> : null}
    </div>
    {action}
  </div>
);

export const StatusPanel = ({
  title,
  description,
  imageSrc,
  children,
}: {
  title: string;
  description: ReactNode;
  imageSrc?: string;
  children?: ReactNode;
}) => (
  <Card className="bqa-status-panel">
    <div>
      <h2 className="bqa-status-title">{title}</h2>
      <p className="bqa-status-copy">{description}</p>
      {children}
    </div>
    {imageSrc ? <Image src={imageSrc} alt="" width={92} height={92} className="bqa-status-image" /> : null}
  </Card>
);

export const StatGrid = ({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"section">) => (
  <section className={cn("bqa-stat-grid", className)} {...props}>
    {children}
  </section>
);

export const StatTile = ({
  icon,
  label,
  value,
  unit,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  unit?: ReactNode;
}) => (
  <Card className="bqa-stat-tile">
    <div className="bqa-stat-icon">{icon}</div>
    <p className="bqa-stat-label">{label}</p>
    <div className="bqa-stat-value">
      <strong>{value}</strong>
      {unit ? <span>{unit}</span> : null}
    </div>
  </Card>
);

export const ActionCard = ({
  href,
  icon,
  title,
  description,
  tone = "neutral",
}: {
  href: LinkProps["href"];
  icon?: ReactNode;
  title: string;
  description: string;
  tone?: Tone;
}) => (
  <Button asChild variant={tone === "warm" ? "outline" : "default"} className={cn("bqa-action-card", toneClass[tone])}>
    <Link href={href} className="bqa-action-card-link">
      {icon ? <span className="bqa-action-icon">{icon}</span> : null}
      <span className="bqa-action-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
    </Link>
  </Button>
);

export const Panel = ({
  children,
  className,
  tone = "neutral",
  ...props
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
} & ComponentPropsWithoutRef<"section">) => (
  <Card className={cn("bqa-panel", toneClass[tone], className)} {...props}>
    {children}
  </Card>
);

export const Notice = ({
  children,
  tone = "warning",
  className,
}: {
  children: ReactNode;
  tone?: "warning" | "warm";
  className?: string;
}) => (
  <Alert tone={tone === "warm" ? "warm" : "danger"} className={cn("bqa-notice", tone === "warm" ? "bqa-notice--warm" : "bqa-notice--warning", className)}>
    <span className="bqa-notice-icon" aria-hidden="true">
      {tone === "warm" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
          <path d="M10.3 4.2 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      )}
    </span>
    <span className="bqa-notice-copy">{children}</span>
  </Alert>
);

export const FormStack = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("bqa-form-stack", className)}>{children}</div>
);

export const FormGrid = ({ children }: { children: ReactNode }) => <div className="bqa-form-grid">{children}</div>;

export const TicketPanel = ({
  label,
  value,
  caption,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}) => (
  <section className="bqa-ticket-panel">
    <p>{label}</p>
    <strong>{value}</strong>
    {caption ? <span>{caption}</span> : null}
  </section>
);

export const ServiceRow = ({
  icon,
  name,
  price,
  duration,
}: {
  icon?: ReactNode;
  name: string;
  price: string;
  duration: ReactNode;
}) => (
  <div className="bqa-service-row">
    <span className="bqa-service-icon">{icon}</span>
    <div>
      <strong>{name}</strong>
      <p>{price}</p>
    </div>
    <span>{duration}</span>
  </div>
);

export const OwnerHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <header className="bqa-owner-header">
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
    {action}
  </header>
);

export const OwnerGrid = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("bqa-owner-grid", className)}>{children}</div>
);

export const StatusBadge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) => {
  const variant = tone === "positive" ? "positive" : tone === "warning" ? "warning" : tone === "warm" ? "warm" : "neutral";

  return <Badge variant={variant}>{children}</Badge>;
};
