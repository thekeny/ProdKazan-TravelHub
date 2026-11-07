import type { TripValues } from "@/configs/types/travel.type";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDayFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

type DateParts = { day: string; month: string; year: string };

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

function partsOf(date: Date): DateParts {
  const parts = dateFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: value("day"),
    month: value("month"),
    year: value("year"),
  };
}

/** Компактный диапазон дат: «7–10 ноября 2026» вместо двух полных дат. */
export function formatTripDates(
  trip: Pick<TripValues, "startDate" | "endDate">,
) {
  const startDate = parseDate(trip.startDate);
  const endDate = parseDate(trip.endDate);
  const start = partsOf(startDate);
  const end = partsOf(endDate);
  if (startDate.getTime() === endDate.getTime()) {
    return `${start.day} ${start.month} ${start.year}`;
  }
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${end.month} ${end.year}`;
  }
  if (start.year === end.year) {
    return `${start.day} ${start.month} — ${end.day} ${end.month} ${end.year}`;
  }
  return `${start.day} ${start.month} ${start.year} — ${end.day} ${end.month} ${end.year}`;
}

const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
export function formatDayLabel(value: string) {
  return dayFormatter.format(new Date(`${value}T00:00:00Z`));
}

/** Короткая дата дня для переключателя: «7 нояб.». */
export function formatDayShort(value: string) {
  return shortDayFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
