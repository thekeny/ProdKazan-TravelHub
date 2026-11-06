import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import type { TripEvent } from "@/configs/types/event.type";
import type {
  RoutePoint,
  RoutePointValues,
  TripLeg,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TripValues } from "@/configs/types/travel.type";
import { validDateTime } from "@/lib/travel-events";

export type TimelineItem =
  | { kind: "event"; id: string; at: string; event: TripEvent }
  | { kind: "leg"; id: string; at: string; leg: TripLeg };

export function validatePoint(value: RoutePointValues): string | null {
  if (!value.name.trim()) return "Укажите название точки.";
  if (
    !Number.isFinite(value.lat) ||
    Math.abs(value.lat) > 90 ||
    !Number.isFinite(value.lng) ||
    Math.abs(value.lng) > 180
  )
    return "Выберите точку на карте или укажите корректные координаты.";
  return null;
}

export function validateLeg(
  value: TripLegValues,
  trip: TripValues,
  points: readonly RoutePoint[],
): string | null {
  const ids = new Set(points.map((point) => point.id));
  if (!ids.has(value.fromPointId) || !ids.has(value.toPointId))
    return "Выберите начальную и конечную точки маршрута.";
  if (value.fromPointId === value.toPointId)
    return "Начальная и конечная точки должны различаться.";
  if (!Object.hasOwn(TRANSPORT_TYPES, value.transport))
    return "Выберите способ передвижения.";
  if (!validDateTime(value.start) || !validDateTime(value.end))
    return "Укажите корректные дату и время перемещения.";
  if (value.end < value.start)
    return "Прибытие не может быть раньше отправления.";
  if (
    value.start.slice(0, 10) < trip.startDate ||
    value.end.slice(0, 10) > trip.endDate
  )
    return "Перемещение должно быть в пределах дат поездки.";
  return null;
}

export function pointsForDay(
  points: readonly RoutePoint[],
  events: readonly TripEvent[],
  legs: readonly TripLeg[],
  day: string,
): RoutePoint[] {
  if (!day) return [...points];
  const ids = new Set<string>();
  for (const event of events) {
    if (event.pointId && event.start.slice(0, 10) === day)
      ids.add(event.pointId);
  }
  for (const leg of legs) {
    if (leg.start.slice(0, 10) !== day) continue;
    ids.add(leg.fromPointId);
    ids.add(leg.toPointId);
  }
  const referenced = new Set<string>();
  for (const event of events) if (event.pointId) referenced.add(event.pointId);
  for (const leg of legs) {
    referenced.add(leg.fromPointId);
    referenced.add(leg.toPointId);
  }
  for (const point of points) if (!referenced.has(point.id)) ids.add(point.id);
  return points.filter((point) => ids.has(point.id));
}

export function legsForDay(legs: readonly TripLeg[], day: string): TripLeg[] {
  return legs
    .filter((leg) => !day || leg.start.slice(0, 10) === day)
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

export function buildTimeline(
  events: readonly TripEvent[],
  legs: readonly TripLeg[],
  day: string,
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...events.map(
      (event): TimelineItem => ({
        kind: "event",
        id: event.id,
        at: event.start,
        event,
      }),
    ),
    ...legs.map(
      (leg): TimelineItem => ({
        kind: "leg",
        id: leg.id,
        at: leg.start,
        leg,
      }),
    ),
  ];
  return items
    .filter((item) => !day || item.at.slice(0, 10) === day)
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

export function pointTitle(
  points: readonly RoutePoint[],
  pointId: string | null,
): string {
  if (!pointId) return "Без места на карте";
  return points.find((point) => point.id === pointId)?.name ?? "Точка удалена";
}

export function timeToMinutes(value: string): number {
  return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.min(Math.max(Math.round(minutes), 0), 1440);
  const hours = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function itemStartMinutes(item: TimelineItem): number {
  return timeToMinutes(item.at);
}

export function itemEndMinutes(item: TimelineItem, day: string): number {
  const end = item.kind === "event" ? item.event.end : item.leg.end;
  if (!end) return itemStartMinutes(item);
  const endDay = end.slice(0, 10);
  if (endDay === day) return timeToMinutes(end);
  return endDay > day ? 1440 : 0;
}

export function firstItemMinutes(
  events: readonly TripEvent[],
  legs: readonly TripLeg[],
  day: string,
): number {
  const items = buildTimeline(events, legs, day);
  return items.length ? itemStartMinutes(items[0]) : 9 * 60;
}

export type TripPosition = {
  label: string;
  lat: number | null;
  lng: number | null;
  pointId: string | null;
  legId: string | null;
  item: TimelineItem | null;
};

function positionOfPoint(point: RoutePoint | undefined) {
  return {
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    pointId: point?.id ?? null,
  };
}

export function positionAtTime(
  items: readonly TimelineItem[],
  points: readonly RoutePoint[],
  day: string,
  minutes: number,
): TripPosition {
  const empty: TripPosition = {
    label: "В этот день нет событий",
    lat: null,
    lng: null,
    pointId: null,
    legId: null,
    item: null,
  };
  if (!items.length) return empty;
  const byId = new Map(points.map((point) => [point.id, point]));
  const started = items
    .filter((item) => itemStartMinutes(item) <= minutes)
    .sort((a, b) => itemStartMinutes(b) - itemStartMinutes(a));
  const active =
    started.find((item) => minutes <= itemEndMinutes(item, day)) ?? null;
  if (active?.kind === "event") {
    return {
      label: active.event.title,
      ...positionOfPoint(
        active.event.pointId ? byId.get(active.event.pointId) : undefined,
      ),
      legId: null,
      item: active,
    };
  }
  if (active?.kind === "leg") {
    const from = byId.get(active.leg.fromPointId);
    const to = byId.get(active.leg.toPointId);
    const start = itemStartMinutes(active);
    const end = itemEndMinutes(active, day);
    const progress =
      end > start
        ? Math.min(Math.max((minutes - start) / (end - start), 0), 1)
        : 0;
    return {
      label: `${TRANSPORT_TYPES[active.leg.transport]}: ${from?.name ?? "Точка удалена"} → ${to?.name ?? "Точка удалена"}`,
      lat:
        from && to
          ? from.lat + (to.lat - from.lat) * progress
          : (from?.lat ?? null),
      lng:
        from && to
          ? from.lng + (to.lng - from.lng) * progress
          : (from?.lng ?? null),
      pointId: null,
      legId: active.id,
      item: active,
    };
  }
  const last = started[0];
  if (last?.kind === "event") {
    return {
      label: `Свободное время после «${last.event.title}»`,
      ...positionOfPoint(
        last.event.pointId ? byId.get(last.event.pointId) : undefined,
      ),
      legId: null,
      item: null,
    };
  }
  if (last?.kind === "leg") {
    const to = byId.get(last.leg.toPointId);
    return {
      label: `На месте: ${to?.name ?? "точка удалена"}`,
      ...positionOfPoint(to),
      legId: null,
      item: null,
    };
  }
  const first = items[0];
  const label =
    first.kind === "event"
      ? `До начала: «${first.event.title}»`
      : `До отправления: ${TRANSPORT_TYPES[first.leg.transport]}`;
  if (first.kind === "event")
    return {
      label,
      ...positionOfPoint(
        first.event.pointId ? byId.get(first.event.pointId) : undefined,
      ),
      legId: null,
      item: null,
    };
  return {
    label,
    ...positionOfPoint(byId.get(first.leg.fromPointId)),
    legId: null,
    item: null,
  };
}
