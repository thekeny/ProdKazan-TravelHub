"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { FocusEventHandler, Ref } from "react";
import { inputClass } from "./input";

export function TextSelect({
  id,
  name,
  value,
  options,
  onValueChange,
  disabled,
  onBlur,
  ref,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id: string;
  name?: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  ref?: Ref<HTMLButtonElement>;
  "data-field-control"?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select.Root
      name={name}
      value={value}
      items={options}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
    >
      <Select.Trigger
        id={id}
        name={name}
        ref={ref}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={`${inputClass} flex h-auto min-h-11 items-center gap-2 py-2.5 text-left`}
      >
        <Select.Value className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]" />
        <Select.Icon>
          <ChevronDown className="size-4 shrink-0" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={4}
          alignItemWithTrigger={false}
          className="z-[65] max-w-[calc(100vw-2rem)]"
        >
          <Select.Popup className="popup-motion max-h-(--available-height) w-(--anchor-width) overflow-y-auto rounded-xl border bg-surface p-1 text-sm outline-none">
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-11 cursor-default items-center gap-2 rounded-lg px-3 py-2 outline-none data-highlighted:bg-surface-hover"
                >
                  <Select.ItemText className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]">
                    {option.label}
                  </Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="size-4 shrink-0" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
