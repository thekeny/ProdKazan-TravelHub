import { DATE_LIMITS } from "@/configs/consts/validation.const";

export type ValidationContext<T> = { initial?: T; now?: Date };

export function textError(value: string, max: number, required = false) {
  if (required && !value.trim()) return "Заполните поле.";
  if (value.length > max) return `До ${max} символов.`;
}

function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateRange(now = new Date()) {
  const year = now.getFullYear() + DATE_LIMITS.FUTURE_YEARS;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    min: localDay(now),
    max: localDay(
      new Date(year, now.getMonth(), Math.min(now.getDate(), lastDay)),
    ),
  };
}

export function dateInputBounds(
  initial?: string,
  now = new Date(),
  trip?: { startDate: string; endDate: string },
) {
  const range = dateRange(now);
  let min = trip && trip.startDate > range.min ? trip.startDate : range.min;
  let max = trip && trip.endDate < range.max ? trip.endDate : range.max;
  const day = initial?.slice(0, 10);
  // Native calendars cannot express a disjoint historical exception. Submission
  // validation still rejects every out-of-range value except the original one.
  if (day && (!trip || (day >= trip.startDate && day <= trip.endDate))) {
    if (day < min) min = day;
    if (day > max) max = day;
  }
  return { min, max };
}

export function dateRangeError(value: string, initial?: string, now?: Date) {
  if (initial && value === initial) return;
  const range = dateRange(now);
  const day = value.slice(0, 10);
  if (day < range.min) return "Не раньше сегодняшнего дня.";
  if (day > range.max) return "Не дальше 10 лет от сегодня.";
}

export function assertValidInput(errors: object) {
  const message: unknown = Object.values(errors).find(Boolean);
  if (typeof message === "string") throw new Error(message);
}
