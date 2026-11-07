import { EVENT_TYPES } from "@/configs/consts/events.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type { TripValues } from "@/configs/types/travel.type";
import { validateBookingUrl, validateMaterials } from "@/lib/materials";

export function validDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value
  );
}

export function validateEvent(
  value: EventValues,
  trip: TripValues,
  pointIds?: ReadonlySet<string>,
): string | null {
  if (!value.title.trim()) return "Укажите название события.";
  if (!Object.hasOwn(EVENT_TYPES, value.type)) return "Выберите тип события.";
  if (!validDateTime(value.start) || (value.end && !validDateTime(value.end)))
    return "Укажите корректные дату и время.";
  if (value.end && value.end < value.start)
    return "Окончание не может быть раньше начала.";
  if (
    value.start.slice(0, 10) < trip.startDate ||
    (value.end || value.start).slice(0, 10) > trip.endDate
  )
    return "Событие должно быть в пределах дат поездки.";
  if (value.pointId && pointIds && !pointIds.has(value.pointId))
    return "Выберите существующую точку маршрута.";
  const materialsError = validateMaterials(value.materials);
  if (materialsError) return materialsError;
  const bookingError = validateBookingUrl(value.bookingUrl);
  if (bookingError) return bookingError;
  return null;
}

export function eventsForDay(events: TripEvent[], day: string) {
  return events
    .filter((event) => !day || event.start.slice(0, 10) === day)
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

export function tripDays(trip: TripValues) {
  const days: string[] = [];
  const date = new Date(`${trip.startDate}T00:00:00Z`);
  const end = new Date(`${trip.endDate}T00:00:00Z`);
  while (date <= end) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}Z`));
}

/** Диапазон события без повтора даты, когда оно заканчивается в тот же день. */
export function formatEventDateRange(start: string, end?: string | null) {
  if (!end) return formatEventDate(start);
  if (start.slice(0, 10) === end.slice(0, 10)) {
    return `${formatEventDate(start)} — ${end.slice(11, 16)}`;
  }
  return `${formatEventDate(start)} — ${formatEventDate(end)}`;
}
