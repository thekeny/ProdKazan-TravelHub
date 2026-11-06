import { APP } from "@/configs/consts/app.const";
import type { DemoState, TripValues } from "@/configs/types/travel.type";
import { validateEvent } from "@/lib/travel-events";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}
export function validateTrip(values: TripValues): string | null {
  if (!values.name.trim()) return "Укажите название путешествия.";
  if (!values.startDate || !values.endDate) return "Укажите даты путешествия.";
  const validDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(values.startDate) || !validDate(values.endDate))
    return "Укажите корректные даты.";
  if (values.endDate < values.startDate)
    return "Дата окончания не может быть раньше даты начала.";
  return null;
}
export function emptyState(): DemoState {
  return { username: null, accounts: {} };
}
export function readState(): DemoState {
  const raw = localStorage.getItem(APP.STORAGE_KEY);
  if (!raw) return emptyState();
  const value = JSON.parse(raw);
  if (
    !value ||
    (value.username !== null && typeof value.username !== "string") ||
    !value.accounts ||
    typeof value.accounts !== "object" ||
    Array.isArray(value.accounts)
  )
    throw new Error("invalid state");
  for (const data of Object.values(value.accounts) as unknown[]) {
    if (!data || typeof data !== "object") throw new Error("invalid account");
    const account = data as { trips?: unknown; activeId?: unknown };
    if (
      !Array.isArray(account.trips) ||
      (account.activeId !== null && typeof account.activeId !== "string")
    )
      throw new Error("invalid trips");
    for (const trip of account.trips) {
      if (
        !trip ||
        typeof trip.id !== "string" ||
        typeof trip.name !== "string" ||
        typeof trip.description !== "string" ||
        typeof trip.startDate !== "string" ||
        typeof trip.endDate !== "string" ||
        (trip.cover !== null &&
          (typeof trip.cover !== "string" ||
            !/^data:image\/(png|jpeg|webp);base64,/.test(trip.cover))) ||
        validateTrip(trip)
      )
        throw new Error("invalid trip");
      if (trip.events !== undefined) {
        if (!Array.isArray(trip.events)) throw new Error("invalid events");
        const ids = new Set<string>();
        for (const event of trip.events) {
          if (
            !event ||
            typeof event.id !== "string" ||
            ids.has(event.id) ||
            typeof event.title !== "string" ||
            typeof event.type !== "string" ||
            typeof event.start !== "string" ||
            typeof event.end !== "string" ||
            typeof event.description !== "string" ||
            (event.place !== null &&
              (!event.place || typeof event.place.name !== "string")) ||
            validateEvent(event, trip)
          )
            throw new Error("invalid event");
          ids.add(event.id);
        }
      }
    }
  }
  return value as DemoState;
}
export function writeState(state: DemoState) {
  try {
    localStorage.setItem(APP.STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new Error(
      "Не удалось сохранить данные в браузере. Проверьте доступ к хранилищу и свободное место.",
    );
  }
}
