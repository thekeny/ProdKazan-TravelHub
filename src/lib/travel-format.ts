import type { TripValues } from "@/configs/types/travel.type";

const formatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function formatTripDates(
  trip: Pick<TripValues, "startDate" | "endDate">,
) {
  return `${formatter.format(new Date(trip.startDate))} — ${formatter.format(new Date(trip.endDate))}`;
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

export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
