import { APP } from "@/configs/consts/app.const";
import { MATERIAL_LIMITS } from "@/configs/consts/materials.const";
import type { TransportKind } from "@/configs/consts/transport.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { Material } from "@/configs/types/material.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import type { DemoState, Trip, TripValues } from "@/configs/types/travel.type";
import { validateMaterial } from "@/lib/materials";
import { validateEvent } from "@/lib/travel-events";
import { validateLeg, validatePoint } from "@/lib/travel-route";

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
  const days =
    (Date.parse(`${values.endDate}T00:00:00Z`) -
      Date.parse(`${values.startDate}T00:00:00Z`)) /
      86_400_000 +
    1;
  if (days > 365) return "Поездка не может длиться дольше 365 дней.";
  return null;
}
export function emptyState(): DemoState {
  return { username: null, accounts: {} };
}

type ReadReport = { dropped: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  if (typeof value !== "string") throw new Error("invalid field");
  return value;
}

function readNumber(value: unknown): number {
  if (typeof value !== "number") throw new Error("invalid number");
  return value;
}

function readTripValues(raw: Record<string, unknown>): TripValues {
  const cover = raw.cover ?? null;
  if (
    cover !== null &&
    (typeof cover !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,/.test(cover))
  )
    throw new Error("invalid cover");
  const values: TripValues = {
    name: readString(raw.name),
    description:
      raw.description === undefined ? "" : readString(raw.description),
    startDate: readString(raw.startDate),
    endDate: readString(raw.endDate),
    cover,
  };
  if (validateTrip(values)) throw new Error("invalid trip");
  return values;
}

function readPoints(raw: unknown, report: ReadReport): RoutePoint[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    report.dropped += 1;
    return [];
  }
  const ids = new Set<string>();
  const points: RoutePoint[] = [];
  for (const value of raw) {
    try {
      if (
        !isRecord(value) ||
        typeof value.id !== "string" ||
        ids.has(value.id)
      ) {
        report.dropped += 1;
        continue;
      }
      const point: RoutePoint = {
        id: value.id,
        name: readString(value.name),
        description:
          value.description === undefined ? "" : readString(value.description),
        lat: readNumber(value.lat),
        lng: readNumber(value.lng),
      };
      if (validatePoint(point)) throw new Error("invalid point");
      ids.add(point.id);
      points.push(point);
    } catch {
      report.dropped += 1;
    }
  }
  return points;
}

function readLegs(
  raw: unknown,
  trip: TripValues,
  points: readonly RoutePoint[],
  report: ReadReport,
): TripLeg[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    report.dropped += 1;
    return [];
  }
  const ids = new Set<string>();
  const pointIds = new Set(points.map((point) => point.id));
  const legs: TripLeg[] = [];
  for (const value of raw) {
    try {
      if (!isRecord(value) || typeof value.id !== "string" || ids.has(value.id))
        throw new Error("invalid leg");
      const leg: TripLeg = {
        id: value.id,
        fromPointId: readString(value.fromPointId),
        toPointId: readString(value.toPointId),
        transport: readString(value.transport) as TransportKind,
        start: readString(value.start),
        end: readString(value.end),
        description:
          value.description === undefined ? "" : readString(value.description),
      };
      if (
        !pointIds.has(leg.fromPointId) ||
        !pointIds.has(leg.toPointId) ||
        validateLeg(leg, trip, points)
      )
        throw new Error("invalid leg");
      ids.add(leg.id);
      legs.push(leg);
    } catch {
      report.dropped += 1;
    }
  }
  return legs;
}

function legacyPoint(
  place: Record<string, unknown>,
  points: RoutePoint[],
  keys: Map<string, string>,
): string {
  const name = readString(place.name);
  const lat = readNumber(place.lat);
  const lng = readNumber(place.lng);
  const point: RoutePoint = {
    id: "",
    name,
    description: "",
    lat,
    lng,
  };
  if (validatePoint(point)) throw new Error("invalid place");
  const key = `${name}|${lat}|${lng}`;
  const existing = keys.get(key);
  if (existing) return existing;
  const base = `legacy-${hashKey(key)}`;
  let id = base;
  let suffix = 1;
  while (points.some((item) => item.id === id)) id = `${base}-${suffix++}`;
  points.push({ ...point, id });
  keys.set(key, id);
  return id;
}

function hashKey(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1)
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  return (hash >>> 0).toString(36);
}

function readMaterials(raw: unknown, report: ReadReport): Material[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    report.dropped += 1;
    return [];
  }
  const ids = new Set<string>();
  const materials: Material[] = [];
  for (const value of raw) {
    if (materials.length >= MATERIAL_LIMITS.MAX_PER_EVENT) {
      report.dropped += 1;
      continue;
    }
    try {
      if (!isRecord(value) || typeof value.id !== "string" || ids.has(value.id))
        throw new Error("invalid material");
      const material: Material = {
        id: value.id,
        name: readString(value.name),
        mimeType: readString(value.mimeType),
        size: readNumber(value.size),
        kind: readString(value.kind) as Material["kind"],
        createdAt: readString(value.createdAt),
      };
      if (validateMaterial(material)) throw new Error("invalid material");
      ids.add(material.id);
      materials.push(material);
    } catch {
      report.dropped += 1;
    }
  }
  return materials;
}

function readEvents(
  raw: unknown,
  trip: TripValues,
  points: RoutePoint[],
  keys: Map<string, string>,
  report: ReadReport,
): TripEvent[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    report.dropped += 1;
    return [];
  }
  const ids = new Set<string>();
  const events: TripEvent[] = [];
  for (const value of raw) {
    try {
      if (!isRecord(value) || typeof value.id !== "string" || ids.has(value.id))
        throw new Error("invalid event");
      const pointIds = new Set(points.map((point) => point.id));
      let pointId: string | null = null;
      if (typeof value.pointId === "string")
        pointId =
          value.pointId && pointIds.has(value.pointId) ? value.pointId : null;
      else if (value.pointId !== undefined && value.pointId !== null)
        throw new Error("invalid event point");
      else if (isRecord(value.place)) {
        pointId = legacyPoint(value.place, points, keys);
        pointIds.add(pointId);
      }
      const event: TripEvent = {
        id: value.id,
        title: readString(value.title),
        type: readString(value.type) as TripEvent["type"],
        start: readString(value.start),
        end: value.end === undefined ? "" : readString(value.end),
        description:
          value.description === undefined ? "" : readString(value.description),
        pointId,
        materials: readMaterials(value.materials, report),
        bookingUrl:
          value.bookingUrl === undefined ? "" : readString(value.bookingUrl),
      };
      if (validateEvent(event, trip, pointIds))
        throw new Error("invalid event");
      ids.add(event.id);
      events.push(event);
    } catch {
      report.dropped += 1;
    }
  }
  return events;
}

function readTrip(raw: unknown, report: ReadReport): Trip {
  if (!isRecord(raw) || typeof raw.id !== "string")
    throw new Error("invalid trip");
  const values = readTripValues(raw);
  const points = readPoints(raw.points, report);
  const keys = new Map<string, string>();
  for (const point of points)
    keys.set(`${point.name}|${point.lat}|${point.lng}`, point.id);
  const legs = readLegs(raw.legs, values, points, report);
  const events = readEvents(raw.events, values, points, keys, report);
  return {
    id: raw.id,
    ...values,
    ...(raw.isDemo === true ? { isDemo: true } : {}),
    points,
    legs,
    events,
  };
}

export type StateReadResult = { state: DemoState; dropped: number };

export function readStateWithReport(): StateReadResult {
  const raw = localStorage.getItem(APP.STORAGE_KEY);
  if (!raw) return { state: emptyState(), dropped: 0 };
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    (value.username !== undefined &&
      value.username !== null &&
      typeof value.username !== "string") ||
    !isRecord(value.accounts)
  )
    throw new Error("invalid state");
  const report: ReadReport = { dropped: 0 };
  const accounts: DemoState["accounts"] = {};
  for (const [name, account] of Object.entries(value.accounts)) {
    if (!isRecord(account) || !Array.isArray(account.trips)) {
      report.dropped += 1;
      continue;
    }
    const tripIds = new Set<string>();
    const trips: Trip[] = [];
    for (const rawTrip of account.trips) {
      try {
        const trip = readTrip(rawTrip, report);
        if (tripIds.has(trip.id)) {
          report.dropped += 1;
          continue;
        }
        tripIds.add(trip.id);
        trips.push(trip);
      } catch {
        report.dropped += 1;
      }
    }
    const activeId =
      typeof account.activeId === "string" &&
      trips.some((trip) => trip.id === account.activeId)
        ? account.activeId
        : null;
    accounts[name] = { trips, activeId };
  }
  return {
    state: {
      username: typeof value.username === "string" ? value.username : null,
      accounts,
    },
    dropped: report.dropped,
  };
}
export function readState(): DemoState {
  return readStateWithReport().state;
}
export function writeState(state: DemoState) {
  try {
    localStorage.setItem(APP.STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    const quota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    throw new Error(
      quota
        ? "Не хватает места в браузере. Удалите лишние материалы или завершённые поездки и попробуйте снова."
        : "Не удалось сохранить данные в браузере. Проверьте доступ к хранилищу и свободное место.",
    );
  }
}
