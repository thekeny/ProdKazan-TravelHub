import { EVENT_TYPES } from "@/configs/consts/events.const";
import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { EventValues } from "@/configs/types/event.type";
import type {
  RoutePoint,
  RoutePointValues,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TripValues } from "@/configs/types/travel.type";
import type { FormErrors } from "@/hooks/use-form-values";
import {
  dateRangeError,
  textError as text,
  type ValidationContext,
} from "@/lib/input-validation";
import { validateBookingUrl, validateMaterials } from "@/lib/materials";
import { isServerCover, isUploadedCover } from "@/lib/remote-covers";
import { validDateTime } from "@/lib/travel-events";
import { validateTrip } from "@/lib/travel-storage";

function description(value: string) {
  return text(value, TEXT_LIMITS.DESCRIPTION);
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
  context: ValidationContext<TripValues> = {},
): FormErrors<TripValues> {
  const errors: FormErrors<TripValues> = {};
  const name = text(value.name, TEXT_LIMITS.NAME, true);
  if (name) errors.name = name;
  const desc = description(value.description);
  if (desc) errors.description = desc;
  for (const key of ["startDate", "endDate"] as const) {
    const error = validDateTime(`${value[key]}T00:00`)
      ? dateRangeError(value[key], context.initial?.[key], context.now)
      : "Укажите корректную дату.";
    if (error) errors[key] = error;
  }
  if (!errors.startDate && !errors.endDate) {
    const dates = validateTrip({ ...value, name: "valid" });
    if (dates) errors.endDate = dates;
  }
  if (
    remote &&
    value.cover &&
    !isUploadedCover(value.cover) &&
    !(isServerCover(value.cover) && value.cover === context.initial?.cover) &&
    !httpUrl(value.cover)
  )
    errors.cover = "Укажите HTTP(S)-ссылку на изображение.";
  if (value.cover && !isUploadedCover(value.cover)) {
    const cover = text(value.cover, TEXT_LIMITS.URL);
    if (cover) errors.cover = cover;
  }
  return errors;
}
export function pointErrors(
  value: RoutePointValues,
): FormErrors<RoutePointValues> {
  const errors: FormErrors<RoutePointValues> = {};
  const name = text(value.name, TEXT_LIMITS.NAME, true);
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
  context: ValidationContext<{ start: string; end: string }>,
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
  for (const key of ["start", "end"] as const) {
    if (value[key] && !errors[key]) {
      const error = dateRangeError(
        value[key],
        context.initial?.[key],
        context.now,
      );
      if (error) errors[key] = error;
    }
  }
  return errors;
}
export function eventErrors(
  value: EventValues,
  trip: TripValues,
  points: readonly RoutePoint[],
  context: ValidationContext<EventValues> = {},
): FormErrors<EventValues> {
  const errors: FormErrors<EventValues> = times(value, trip, false, context);
  const title = text(value.title, TEXT_LIMITS.EVENT_TITLE, true);
  if (title) errors.title = title;
  const desc = description(value.description);
  if (desc) errors.description = desc;
  if (!Object.hasOwn(EVENT_TYPES, value.type))
    errors.type = "Выберите тип события.";
  if (value.pointId && !points.some((point) => point.id === value.pointId))
    errors.pointId = "Выберите существующую точку.";
  const materials = validateMaterials(value.materials);
  if (materials) errors.materials = materials;
  if (
    value.materials?.some((material) =>
      text(material.name, TEXT_LIMITS.FILE_NAME, true),
    )
  )
    errors.materials = `Имя файла: 1–${TEXT_LIMITS.FILE_NAME} символов.`;
  const url =
    text(value.bookingUrl, TEXT_LIMITS.URL) ??
    validateBookingUrl(value.bookingUrl);
  if (url) errors.bookingUrl = url;
  return errors;
}
export function legErrors(
  value: TripLegValues,
  trip: TripValues,
  points: readonly RoutePoint[],
  context: ValidationContext<TripLegValues> = {},
): FormErrors<TripLegValues> {
  const errors: FormErrors<TripLegValues> = times(value, trip, true, context);
  if (!points.some((point) => point.id === value.fromPointId))
    errors.fromPointId = "Выберите начальную точку.";
  if (!points.some((point) => point.id === value.toPointId))
    errors.toPointId = "Выберите конечную точку.";
  else if (value.fromPointId === value.toPointId)
    errors.toPointId = "Выберите другую точку.";
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
export type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
export function passwordErrors(
  value: PasswordValues,
): FormErrors<PasswordValues> {
  const errors: FormErrors<PasswordValues> = {};
  if (!value.currentPassword)
    errors.currentPassword = "Введите текущий пароль.";
  else if (value.currentPassword.length > TEXT_LIMITS.REMOTE_PASSWORD)
    errors.currentPassword = `До ${TEXT_LIMITS.REMOTE_PASSWORD} символов.`;
  if (!value.newPassword) errors.newPassword = "Введите новый пароль.";
  else if (value.newPassword.length < TEXT_LIMITS.PASSWORD_MIN)
    errors.newPassword = `Минимум ${TEXT_LIMITS.PASSWORD_MIN} символов.`;
  else if (value.newPassword.length > TEXT_LIMITS.REMOTE_PASSWORD)
    errors.newPassword = `До ${TEXT_LIMITS.REMOTE_PASSWORD} символов.`;
  if (!value.confirmPassword)
    errors.confirmPassword = "Повторите новый пароль.";
  else if (value.confirmPassword !== value.newPassword)
    errors.confirmPassword = "Пароли не совпадают.";
  return errors;
}
export function authErrors(
  value: AuthValues,
  remote: boolean,
  register: boolean,
): FormErrors<AuthValues> {
  const errors: FormErrors<AuthValues> = {};
  const passwordMax = remote
    ? TEXT_LIMITS.REMOTE_PASSWORD
    : TEXT_LIMITS.LOCAL_PASSWORD;
  if (
    value.username.trim().length < TEXT_LIMITS.USERNAME_MIN ||
    value.username.length > TEXT_LIMITS.USERNAME
  )
    errors.username = "От 3 до 32 символов.";
  else if (remote && !/^[a-zA-Z0-9._]+$/.test(value.username.trim()))
    errors.username = "Латиница, цифры, точка или подчёркивание.";
  if ((remote || register) && !value.password)
    errors.password = "Введите пароль.";
  else if (register && value.password.length < TEXT_LIMITS.PASSWORD_MIN)
    errors.password = "Минимум 8 символов.";
  else if (value.password.length > passwordMax)
    errors.password = `До ${passwordMax} символов.`;
  if (register) {
    if (!value.confirm) errors.confirm = "Повторите пароль.";
    else if (value.confirm.length < TEXT_LIMITS.PASSWORD_MIN)
      errors.confirm = "Минимум 8 символов.";
    else if (value.confirm.length > passwordMax)
      errors.confirm = `До ${passwordMax} символов.`;
    else if (value.confirm !== value.password)
      errors.confirm = "Пароли не совпадают.";
  }
  return errors;
}
