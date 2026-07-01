import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

export interface IFormFieldProps {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormField = ({ id, label, description, error, children, className }: IFormFieldProps) => (
  <div className={cn("ui-form-field", className)}>
    <div className="ui-form-label-group">
      <Label htmlFor={id}>{label}</Label>
      {description ? <p className="ui-form-description">{description}</p> : null}
    </div>
    {children}
    {error ? <p className="ui-form-error">{error}</p> : null}
  </div>
);
