"use client";
import { Popover } from "@base-ui/react/popover";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { ru } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { dateRange, dateRangeError } from "@/lib/input-validation";
import { formatTripDates } from "@/lib/travel-format";
import { Field } from "./field";
import { Input, inputClass } from "./input";

function parseDay(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}
function dayString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
type Props = {
  start: string;
  end: string;
  startName: string;
  endName: string;
  startLabel?: string;
  endLabel?: string;
  initialStart?: string;
  initialEnd?: string;
  trip?: { startDate: string; endDate: string };
  withTime?: boolean;
  optionalEnd?: boolean;
  disabled?: boolean;
  onChange: (start: string, end: string) => void;
};
export function DateRangeFields({
  start,
  end,
  startName,
  endName,
  startLabel = "Начало",
  endLabel = "Окончание",
  initialStart,
  initialEnd,
  trip,
  withTime = false,
  optionalEnd = false,
  disabled = false,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<"start" | "end">("start");
  const [month, setMonth] = useState(parseDay(start) ?? new Date());
  const range = dateRange();
  function selectionSide(day: string) {
    return active === "start" || !start || day < start.slice(0, 10)
      ? "start"
      : "end";
  }
  function select(date: Date) {
    const day = dayString(date);
    const side = selectionSide(day);
    const time =
      side === "start"
        ? start.slice(11) || "09:00"
        : end.slice(11) || start.slice(11) || "09:00";
    const next = withTime ? `${day}T${time}` : day;
    if (side === "start") {
      onChange(next, "");
      setActive("end");
    } else {
      onChange(start, next < start ? start : next);
      setOpen(false);
    }
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["start", "end"] as const).map((side) => {
          const value = side === "start" ? start : end;
          return (
            <div key={side} className="grid content-start gap-2">
              <Field
                name={side === "start" ? startName : endName}
                label={`${side === "start" ? startLabel : endLabel}${side === "end" && optionalEnd ? " (необязательно)" : ""}`}
              >
                {(id) => (
                  <Popover.Trigger
                    data-field-control
                    id={id}
                    disabled={disabled}
                    className={`${inputClass} text-left`}
                    onClick={() => {
                      setActive(side === "end" && !start ? "start" : side);
                      setMonth(parseDay(value || start) ?? new Date());
                    }}
                  >
                    {value
                      ? parseDay(value)?.toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Выбрать дату"}
                  </Popover.Trigger>
                )}
              </Field>
              {withTime && (
                <Input
                  type="time"
                  aria-label={
                    side === "start" ? "Время начала" : "Время окончания"
                  }
                  disabled={disabled || !value}
                  value={value.slice(11)}
                  onChange={(event) => {
                    const next = `${value.slice(0, 10)}T${event.target.value}`;
                    onChange(
                      side === "start" ? next : start,
                      side === "end" ? next : end,
                    );
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {start && end && !withTime && (
        <p className="text-sm text-muted-foreground">
          {formatTripDates({ startDate: start, endDate: end })}
        </p>
      )}
      {optionalEnd && end && (
        <button
          type="button"
          disabled={disabled}
          className="justify-self-start text-sm text-muted-foreground underline"
          onClick={() => onChange(start, "")}
        >
          Убрать окончание
        </button>
      )}
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={6}
          className="z-[65] max-w-[calc(100vw-1.5rem)]"
        >
          <Popover.Popup
            className="popup-motion calendar-range max-h-(--available-height) overflow-auto rounded-xl border bg-surface p-3 text-foreground shadow-md"
            initialFocus={true}
          >
            <Popover.Title className="mb-3 text-sm font-medium">
              {active === "start" ? "Выберите начало" : "Выберите окончание"}
            </Popover.Title>
            <DayPicker
              locale={ru}
              mode="range"
              selected={{ from: parseDay(start), to: parseDay(end) }}
              month={month}
              onMonthChange={setMonth}
              onSelect={(_range, day, modifiers) => {
                if (!modifiers.disabled) select(day);
              }}
              captionLayout="dropdown"
              startMonth={parseDay(
                [
                  range.min,
                  initialStart?.slice(0, 10),
                  initialEnd?.slice(0, 10),
                ]
                  .filter((v): v is string => Boolean(v))
                  .sort()[0],
              )}
              endMonth={parseDay(
                [
                  range.max,
                  initialStart?.slice(0, 10),
                  initialEnd?.slice(0, 10),
                ]
                  .filter((v): v is string => Boolean(v))
                  .sort()
                  .at(-1) ?? range.max,
              )}
              disabled={(date) => {
                const day = dayString(date);
                const initial =
                  selectionSide(day) === "start" ? initialStart : initialEnd;
                return (
                  disabled ||
                  Boolean(dateRangeError(day, initial?.slice(0, 10))) ||
                  Boolean(trip && (day < trip.startDate || day > trip.endDate))
                );
              }}
            />
            {optionalEnd && active === "end" && (
              <button
                type="button"
                className="mt-2 min-h-11 w-full rounded-lg border text-sm hover:bg-surface-hover"
                onClick={() => {
                  onChange(start, "");
                  setOpen(false);
                }}
              >
                Без окончания
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
