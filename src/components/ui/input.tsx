import { cn } from "cn";
import type { ComponentProps } from "react";
export const inputClass =
  "h-11 w-full rounded-xl border border-input bg-surface/80 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      data-field-control
      className={cn(inputClass, className)}
      {...props}
    />
  );
}
