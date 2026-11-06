import { EVENT_TYPES } from "@/configs/consts/events.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type { TripValues } from "@/configs/types/travel.type";

function validDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value
  );
}

export function validateEvent(
  value: EventValues,
  trip: TripValues,
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
  if (
    value.place &&
    (!value.place.name.trim() ||
      !Number.isFinite(value.place.lat) ||
      Math.abs(value.place.lat) > 90 ||
      !Number.isFinite(value.place.lng) ||
      Math.abs(value.place.lng) > 180)
  )
    return "Укажите название места и корректные координаты.";
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
