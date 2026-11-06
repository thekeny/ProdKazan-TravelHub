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
