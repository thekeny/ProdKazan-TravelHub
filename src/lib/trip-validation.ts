import { DATE_LIMITS } from "@/configs/consts/validation.const";
import type { TripValues } from "@/configs/types/travel.type";

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
  const days =
    (Date.parse(`${values.endDate}T00:00:00Z`) -
      Date.parse(`${values.startDate}T00:00:00Z`)) /
      86_400_000 +
    1;
  if (days > DATE_LIMITS.TRIP_DAYS)
    return `Поездка не может длиться дольше ${DATE_LIMITS.TRIP_DAYS} дней.`;
  return null;
}
