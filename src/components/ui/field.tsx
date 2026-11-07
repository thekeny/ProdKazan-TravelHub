"use client";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type Ref,
  useId,
} from "react";
import { useFormContext } from "react-hook-form";
export function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  name?: string;
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy?: string) => React.ReactNode;
}) {
  const id = useId();
  const form = useFormContext();
  const fieldError =
    name && form ? form.getFieldState(name, form.formState).error : undefined;
  error =
    error ??
    (typeof fieldError?.message === "string" ? fieldError.message : undefined);
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const child = children(id, describedBy);
  const registration = name && form ? form.register(name) : undefined;
  type ControlProps = {
    "data-field-control"?: boolean;
    name?: string;
    onBlur?: React.FocusEventHandler<HTMLElement>;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    ref?: Ref<HTMLElement>;
  };
  const control =
    isValidElement(child) &&
    ((typeof child.type === "string" &&
      ["input", "select", "textarea"].includes(child.type)) ||
      (child as ReactElement<ControlProps>).props["data-field-control"])
      ? cloneElement(child as ReactElement<ControlProps>, {
          name:
            registration?.name ??
            (child as ReactElement<ControlProps>).props.name,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
          onBlur: (event) => {
            (child as ReactElement<ControlProps>).props.onBlur?.(event);
            if (registration) void registration.onBlur(event);
          },
          ref: (element: HTMLElement | null) => {
            registration?.ref(element);
            const originalRef = (child as ReactElement<ControlProps>).props.ref;
            if (typeof originalRef === "function") originalRef(element);
            else if (originalRef) originalRef.current = element;
          },
        })
      : child;
  return (
    <div className="grid min-w-0 content-start gap-y-1">
      <label htmlFor={id} className="mb-0.5 text-sm font-medium">
        {label}
      </label>
      {control}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-4 text-muted-foreground"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs leading-4 text-destructive [overflow-wrap:anywhere]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
