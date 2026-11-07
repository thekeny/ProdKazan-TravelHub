import { cn } from "cn";
import type { ComponentProps } from "react";
import { inputClass } from "./input";
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      data-field-control
      className={cn(inputClass, "h-auto min-h-20 resize-y py-3", className)}
      {...props}
    />
  );
}
