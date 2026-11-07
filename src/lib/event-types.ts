import { EVENT_TYPES } from "@/configs/consts/events.const";
import {
  EVENT_TYPE_LIMITS,
  TEXT_LIMITS,
} from "@/configs/consts/validation.const";
import type { TripEvent } from "@/configs/types/event.type";

export function eventTypesError(
  value: unknown,
  limit: number = EVENT_TYPE_LIMITS.PER_TRIP,
): string | undefined {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > limit)
    return `Не больше ${limit} типов.`;
  const names = new Set<string>();
  for (const name of value) {
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > TEXT_LIMITS.EVENT_TYPE
    )
      return `Название типа: 1–${TEXT_LIMITS.EVENT_TYPE} символов.`;
    const key = name.trim().toLocaleLowerCase("ru-RU");
    if (names.has(key)) return "Такой тип уже добавлен.";
    names.add(key);
  }
}

export function eventTypeLabel(event: Pick<TripEvent, "type" | "customType">) {
  return event.customType === undefined
    ? EVENT_TYPES[event.type]
    : event.customType || "Без типа";
}
