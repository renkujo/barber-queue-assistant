import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
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

type DescribedControlProps = {
  id?: string;
  children?: ReactNode;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

const mergeIds = (...values: Array<string | undefined>) => {
  const ids = new Set(values.flatMap((value) => value?.split(" ") ?? []).filter(Boolean));

  return ids.size ? Array.from(ids).join(" ") : undefined;
};

const connectFieldControl = (
  node: ReactNode,
  fieldId: string | undefined,
  descriptionId: string | undefined,
  errorId: string | undefined,
): ReactNode => Children.map(node, (child) => {
  if (!isValidElement<DescribedControlProps>(child)) {
    return child;
  }

  const nestedChildren = child.props.children
    ? connectFieldControl(child.props.children, fieldId, descriptionId, errorId)
    : child.props.children;
  const nextProps: DescribedControlProps = {};

  if (nestedChildren !== child.props.children) {
    nextProps.children = nestedChildren;
  }

  if (fieldId && child.props.id === fieldId) {
    nextProps["aria-describedby"] = mergeIds(child.props["aria-describedby"], descriptionId, errorId);

    if (errorId) {
      nextProps["aria-invalid"] = true;
      nextProps["aria-errormessage"] = errorId;
    }
  }

  return Object.keys(nextProps).length
    ? cloneElement(child as ReactElement<DescribedControlProps>, nextProps)
    : child;
});

export const FormField = ({ id, label, description, error, children, className }: IFormFieldProps) => {
  const descriptionId = id && description ? `${id}-description` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const connectedChildren = connectFieldControl(children, id, descriptionId, errorId);

  return (
    <div className={cn("ui-form-field", className)}>
      <div className="ui-form-label-group">
        <Label htmlFor={id}>{label}</Label>
        {description ? <p id={descriptionId} className="ui-form-description">{description}</p> : null}
      </div>
      {connectedChildren}
      {error ? <p id={errorId} className="ui-form-error" role="alert">{error}</p> : null}
    </div>
  );
};
