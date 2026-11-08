"use client";

import { Field } from "@/components/ui/field";
import { TextSelect } from "@/components/ui/text-select";
import type { EventValues, TripEvent } from "@/configs/types/event.type";

export function EventTypeField({
  catalog,
  event,
  value,
  onChange,
  disabled,
}: {
  catalog: string[];
  event?: TripEvent;
  value: EventValues["customType"];
  onChange: (value: EventValues["customType"]) => void;
  disabled: boolean;
}) {
  const preserved = event?.customType ?? null;

  return (
    <div className="grid gap-2">
      <Field name="customType" label="Тег события (необязательно)">
        {(id) => (
          <TextSelect
            data-field-control
            id={id}
            value={value === undefined ? (preserved ?? "") : (value ?? "")}
            disabled={disabled}
            options={[
              { value: "", label: "Без тега" },
              ...(preserved && !catalog.includes(preserved)
                ? [{ value: preserved, label: preserved }]
                : []),
              ...catalog.map((name) => ({ value: name, label: name })),
            ]}
            onValueChange={(next) =>
              onChange(
                next === preserved &&
                  event?.customType === undefined &&
                  !catalog.includes(next)
                  ? undefined
                  : next || null,
              )
            }
          />
        )}
      </Field>
    </div>
  );
}
