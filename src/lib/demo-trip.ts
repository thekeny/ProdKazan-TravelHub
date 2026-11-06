import {
  DEMO_EVENTS,
  DEMO_LEGS,
  DEMO_POINTS,
  DEMO_TRIP,
} from "@/configs/consts/demo.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import type { Trip } from "@/configs/types/travel.type";
import { createId } from "@/lib/id";

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Собирает готовую демонстрационную поездку на четыре дня. */
export function buildDemoTrip(now = new Date()): Trip {
  const startDate = toIsoDate(now);
  const endDate = addDays(startDate, DEMO_TRIP.durationDays - 1);
  const pointIds = new Map(DEMO_POINTS.map((point) => [point.key, createId()]));
  const points: RoutePoint[] = DEMO_POINTS.map((point) => ({
    id: pointIds.get(point.key) as string,
    name: point.name,
    description: point.description,
    lat: point.lat,
    lng: point.lng,
  }));
  const legs: TripLeg[] = DEMO_LEGS.map((leg) => ({
    id: createId(),
    fromPointId: pointIds.get(leg.from) as string,
    toPointId: pointIds.get(leg.to) as string,
    transport: leg.transport,
    start: `${addDays(startDate, leg.dayOffset)}T${leg.start}`,
    end: `${addDays(startDate, leg.dayOffset)}T${leg.end}`,
    description: leg.description,
  }));
  const events: TripEvent[] = DEMO_EVENTS.map((event) => ({
    id: createId(),
    title: event.title,
    type: event.type,
    start: `${addDays(startDate, event.dayOffset)}T${event.start}`,
    end: event.end ? `${addDays(startDate, event.dayOffset)}T${event.end}` : "",
    description: event.description,
    pointId: event.point ? (pointIds.get(event.point) as string) : null,
    materials: [],
    bookingUrl: "",
  }));
  return {
    id: createId(),
    name: DEMO_TRIP.name,
    description: DEMO_TRIP.description,
    startDate,
    endDate,
    cover: null,
    isDemo: true,
    points,
    legs,
    events,
  };
}
