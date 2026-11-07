import { BACKEND_LIMITS } from "@/configs/consts/backend.const";
import { EVENT_TYPES } from "@/configs/consts/events.const";
import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import type { EventValues } from "@/configs/types/event.type";
import type {
  RoutePoint,
  RoutePointValues,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TripValues } from "@/configs/types/travel.type";
import type { FormErrors } from "@/hooks/use-form-values";
import { validateBookingUrl, validateMaterials } from "@/lib/materials";
import { isUploadedCover } from "@/lib/remote-covers";
import { validDateTime } from "@/lib/travel-events";
import { validateTrip } from "@/lib/travel-storage";

function text(value: string, max: number, required = false) {
  if (required && !value.trim()) return "Заполните поле.";
  if (value.length > max) return `Не более ${max} символов.`;
}
function description(value: string) {
  return text(value, BACKEND_LIMITS.DESCRIPTION);
}
function httpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function tripErrors(
  value: TripValues,
  remote: boolean,
): FormErrors<TripValues> {
  const errors: FormErrors<TripValues> = {};
  const name = text(value.name, 100, true);
  if (name) errors.name = name;
  const desc = description(value.description);
  if (desc) errors.description = desc;
  const dates = validateTrip({ ...value, name: "valid" });
  if (!value.startDate || !validDateTime(`${value.startDate}T00:00`))
    errors.startDate = "Укажите корректную дату начала.";
  if (dates) errors.endDate = dates;
  if (
    remote &&
    value.cover &&
    !isUploadedCover(value.cover) &&
    !httpUrl(value.cover)
  )
    errors.cover = "Укажите HTTP(S)-ссылку на изображение.";
  return errors;
}
export function pointErrors(
  value: RoutePointValues,
): FormErrors<RoutePointValues> {
  const errors: FormErrors<RoutePointValues> = {};
  const name = text(value.name, 100, true);
  if (name) errors.name = name;
  const desc = description(value.description);
  if (desc) errors.description = desc;
  if (!Number.isFinite(value.lat) || Math.abs(value.lat) > 90)
    errors.lat = "Широта должна быть от −90 до 90.";
  if (!Number.isFinite(value.lng) || Math.abs(value.lng) > 180)
    errors.lng = "Долгота должна быть от −180 до 180.";
  return errors;
}
function times(
  value: { start: string; end: string },
  trip: TripValues,
  endRequired: boolean,
) {
  const errors: { start?: string; end?: string } = {};
  if (!validDateTime(value.start))
    errors.start = "Укажите корректные дату и время.";
  else if (
    value.start.slice(0, 10) < trip.startDate ||
    value.start.slice(0, 10) > trip.endDate
  )
    errors.start = "Дата должна быть в пределах поездки.";
  if ((endRequired || value.end) && !validDateTime(value.end))
    errors.end = "Укажите корректные дату и время.";
  else if (value.end && value.end < value.start)
    errors.end = "Окончание не может быть раньше начала.";
  else if (
    value.end &&
    (value.end.slice(0, 10) < trip.startDate ||
      value.end.slice(0, 10) > trip.endDate)
  )
    errors.end = "Дата должна быть в пределах поездки.";
  return errors;
}
export function eventErrors(
  value: EventValues,
  trip: TripValues,
  points: readonly RoutePoint[],
): FormErrors<EventValues> {
  const errors: FormErrors<EventValues> = times(value, trip, false);
  const title = text(value.title, 120, true);
  if (title) errors.title = title;
  const desc = description(value.description);
  if (desc) errors.description = desc;
  if (!Object.hasOwn(EVENT_TYPES, value.type))
    errors.type = "Выберите тип события.";
  if (value.pointId && !points.some((point) => point.id === value.pointId))
    errors.pointId = "Выберите существующую точку.";
  const materials = validateMaterials(value.materials);
  if (materials) errors.materials = materials;
  const url = validateBookingUrl(value.bookingUrl);
  if (url) errors.bookingUrl = url;
  return errors;
}
export function legErrors(
  value: TripLegValues,
  trip: TripValues,
  points: readonly RoutePoint[],
): FormErrors<TripLegValues> {
  const errors: FormErrors<TripLegValues> = times(value, trip, true);
  if (!points.some((point) => point.id === value.fromPointId))
    errors.fromPointId = "Выберите начальную точку.";
  if (!points.some((point) => point.id === value.toPointId))
    errors.toPointId = "Выберите конечную точку.";
  else if (value.fromPointId === value.toPointId)
    errors.toPointId = "Точки отправления и прибытия должны различаться.";
  if (!Object.hasOwn(TRANSPORT_TYPES, value.transport))
    errors.transport = "Выберите транспорт.";
  const desc = description(value.description);
  if (desc) errors.description = desc;
  return errors;
}
export type AuthValues = {
  username: string;
  password: string;
  confirm: string;
};
export function authErrors(
  value: AuthValues,
  remote: boolean,
  register: boolean,
): FormErrors<AuthValues> {
  const errors: FormErrors<AuthValues> = {};
  if (value.username.trim().length < 3 || value.username.trim().length > 32)
    errors.username = "Имя должно содержать от 3 до 32 символов.";
  else if (remote && !/^[a-zA-Z0-9._]+$/.test(value.username.trim()))
    errors.username =
      "Используйте латинские буквы, цифры, точку и подчёркивание.";
  if ((remote || register) && !value.password)
    errors.password = "Введите пароль.";
  else if (register && value.password.length < 8)
    errors.password = "Пароль должен содержать не менее 8 символов.";
  else if (value.password.length > (remote ? 64 : 128))
    errors.password = "Пароль слишком длинный.";
  if (register && (!value.confirm || value.confirm !== value.password))
    errors.confirm = "Пароли не совпадают.";
  return errors;
}
