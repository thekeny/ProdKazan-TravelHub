import type {
  TicketKind,
  TicketPreview,
  TicketsPostTicketApplyData,
  TicketTimeHint,
} from "@/api/generated/types.gen";
import type { Trip } from "@/configs/types/travel.type";

export type TicketPointField = "departure" | "arrival" | "stay";
export function ticketTimeHint(hint: TicketTimeHint | null | undefined) {
  if (!hint)
    return "Укажите смещение UTC для места на дату поездки, например +03:00.";
  const date = hint.localDate ?? `${hint.day}.${hint.month} (уточните год)`;
  return `В билете: ${date}, ${hint.localTime}${hint.timeZone ? `, ${hint.timeZone}` : ""}. Укажите смещение UTC на эту дату.`;
}
export type TicketValues = Record<
  `${TicketPointField}${"Name" | "Address" | "Latitude" | "Longitude"}`,
  string
> & {
  kind: TicketKind;
  start: string;
  end: string;
  startOffset: string;
  endOffset: string;
};
export const EMPTY_TICKET: TicketValues = {
  kind: "plane",
  start: "",
  end: "",
  startOffset: "",
  endOffset: "",
  departureName: "",
  departureAddress: "",
  departureLatitude: "",
  departureLongitude: "",
  arrivalName: "",
  arrivalAddress: "",
  arrivalLatitude: "",
  arrivalLongitude: "",
  stayName: "",
  stayAddress: "",
  stayLatitude: "",
  stayLongitude: "",
};
export function ticketTimestamp(local: string, offset: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ||
    !/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offset) ||
    (offset.slice(1, 3) === "14" && offset.slice(4) !== "00")
  )
    return null;
  const instant = `${local}:00${offset}`;
  const wallClock = new Date(`${local}:00Z`);
  if (
    !Number.isFinite(wallClock.getTime()) ||
    wallClock.toISOString().slice(0, 16) !== local
  )
    return null;
  return Number.isFinite(Date.parse(instant)) ? instant : null;
}
export function ticketValues(preview: TicketPreview): TicketValues {
  const values = { ...EMPTY_TICKET, kind: preview.kind };
  for (const key of ["departure", "arrival", "stay"] as const) {
    const place = preview[key];
    values[`${key}Name`] = place?.point?.name ?? place?.name ?? "";
    values[`${key}Address`] = place?.point?.address ?? place?.address ?? "";
    values[`${key}Latitude`] = place?.point ? String(place.point.latitude) : "";
    values[`${key}Longitude`] = place?.point
      ? String(place.point.longitude)
      : "";
  }
  for (const [key, timestamp, hint] of [
    ["start", preview.startedAt, preview.startedAtHint],
    ["end", preview.endedAt, preview.endedAtHint],
  ] as const) {
    values[key] =
      timestamp?.slice(0, 16) ??
      (hint?.localDate && hint.localTime
        ? `${hint.localDate}T${hint.localTime.slice(0, 5)}`
        : "");
    values[`${key}Offset`] = timestamp?.endsWith("Z")
      ? "+00:00"
      : (timestamp?.match(/[+-]\d{2}:\d{2}$/)?.[0] ?? "");
  }
  return values;
}
export function ticketErrors(values: TicketValues, trip: Trip) {
  const errors: Partial<Record<keyof TicketValues, string>> = {};
  for (const key of values.kind === "stay"
    ? (["stay"] as const)
    : (["departure", "arrival"] as const)) {
    if (!values[`${key}Name`].trim())
      errors[`${key}Name`] = "Введите название места.";
    for (const [axis, bound] of [
      ["Latitude", 90],
      ["Longitude", 180],
    ] as const) {
      const value = values[`${key}${axis}`];
      if (
        !value.trim() ||
        !Number.isFinite(Number(value)) ||
        Math.abs(Number(value)) > bound
      )
        errors[`${key}${axis}`] = "Укажите корректные координаты.";
    }
  }
  const start = ticketTimestamp(values.start, values.startOffset);
  const end = values.end ? ticketTimestamp(values.end, values.endOffset) : null;
  if (!values.start) errors.start = "Укажите дату и время начала.";
  else if (!start)
    errors.startOffset = "Укажите время и смещение UTC в формате +03:00.";
  if (values.end && !end)
    errors.endOffset = "Укажите время и смещение UTC в формате +03:00.";
  const min = Date.parse(`${trip.startDate}T00:00:00Z`);
  const max = Date.parse(`${trip.endDate}T23:59:59Z`);
  if (start && (Date.parse(start) < min || Date.parse(start) > max))
    errors.start = "Начало выходит за даты поездки по UTC.";
  if (end && (Date.parse(end) < min || Date.parse(end) > max))
    errors.end = "Окончание выходит за даты поездки по UTC.";
  if (start && end && Date.parse(end) < Date.parse(start))
    errors.end = "Окончание раньше начала.";
  return errors;
}
export function ticketBody(
  values: TicketValues,
): TicketsPostTicketApplyData["body"] {
  const point = (key: TicketPointField) => ({
    name: values[`${key}Name`].trim(),
    address: values[`${key}Address`].trim(),
    latitude: Number(values[`${key}Latitude`]),
    longitude: Number(values[`${key}Longitude`]),
  });
  const startedAt = ticketTimestamp(values.start, values.startOffset);
  if (!startedAt) throw new Error("Укажите начало и смещение UTC.");
  const time = {
    startedAt,
    ...(values.end
      ? { endedAt: ticketTimestamp(values.end, values.endOffset) }
      : {}),
  };
  return values.kind === "stay"
    ? { ...time, kind: "stay", stay: point("stay") }
    : {
        ...time,
        kind: values.kind,
        departure: point("departure"),
        arrival: point("arrival"),
      };
}
