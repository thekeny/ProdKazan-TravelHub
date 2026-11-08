"use client";
import dynamic from "next/dynamic";
import type { TicketIssue } from "@/api/generated/types.gen";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TicketPointField, TicketValues } from "@/lib/tickets";

const TripMap = dynamic(() => import("@/components/dashboard/trip-map"), {
  ssr: false,
  loading: () => (
    <output className="grid h-full place-items-center bg-muted text-sm text-muted-foreground">
      Загрузка карты…
    </output>
  ),
});
export function TicketPointFields({
  prefix,
  values,
  onChange,
  issues,
}: {
  prefix: TicketPointField;
  values: TicketValues;
  onChange: (values: TicketValues) => void;
  issues?: TicketIssue[];
}) {
  const lat = Number(values[`${prefix}Latitude`]);
  const lng = Number(values[`${prefix}Longitude`]);
  const place =
    values[`${prefix}Latitude`].trim() &&
    values[`${prefix}Longitude`].trim() &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  return (
    <fieldset className="grid min-w-0 gap-4 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">
        {prefix === "stay"
          ? "Место проживания"
          : prefix === "departure"
            ? "Отправление"
            : "Прибытие"}
      </legend>
      {issues
        ?.filter((issue) => issue.field === prefix)
        .map((issue) => (
          <p
            key={issue.code}
            className="user-text text-sm text-muted-foreground"
          >
            Из распознавания: {issue.msg}
          </p>
        ))}
      {(
        [
          ["Name", "Название"],
          ["Address", "Адрес (необязательно)"],
          ["Latitude", "Широта"],
          ["Longitude", "Долгота"],
        ] as const
      ).map(([suffix, label]) => {
        const name = `${prefix}${suffix}` as const;
        return (
          <Field key={name} name={name} label={label}>
            {(id) => (
              <Input
                data-field-control
                id={id}
                value={values[name]}
                inputMode={
                  suffix === "Latitude" || suffix === "Longitude"
                    ? "decimal"
                    : "text"
                }
                onChange={(event) =>
                  onChange({ ...values, [name]: event.target.value })
                }
              />
            )}
          </Field>
        );
      })}
      <div className="h-56 overflow-hidden rounded-lg">
        <TripMap
          points={[]}
          draftPlace={place}
          focusPlace={place}
          onPlace={(point) =>
            onChange({
              ...values,
              [`${prefix}Latitude`]: String(point.lat),
              [`${prefix}Longitude`]: String(point.lng),
            })
          }
        />
      </div>
    </fieldset>
  );
}
