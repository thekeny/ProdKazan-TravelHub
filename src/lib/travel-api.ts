import * as sdk from "@/api/generated/sdk.gen";
import type {
  Event as ApiEvent,
  Trip as ApiTrip,
  Movement,
  Waypoint,
} from "@/api/generated/types.gen";
import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type {
  RoutePointValues,
  TripLegValues,
} from "@/configs/types/route.type";
import type { Trip, TripValues } from "@/configs/types/travel.type";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiResult<T>(
  operation: Promise<{ data?: T; error?: unknown; response?: Response }>,
): Promise<T> {
  const result = await operation;
  if (result.error !== undefined || !result.response?.ok) {
    const status = result.response?.status ?? 0;
    let message =
      status === 401
        ? "Сессия истекла или неверное имя пользователя / пароль. Войдите снова."
        : status === 409
          ? "Данные связаны с другими записями или уже существуют."
          : status === 422
            ? "Сервер отклонил данные. Проверьте поля формы."
            : status === 429
              ? "Слишком много запросов. Попробуйте немного позже."
              : "Не удалось выполнить запрос. Попробуйте ещё раз.";
    if (typeof result.error === "object" && result.error) {
      if ("message" in result.error && typeof result.error.message === "string")
        message = result.error.message;
      if (
        "errorCode" in result.error &&
        result.error.errorCode === "UsernameIsAlreadyInUse"
      )
        message = "Это имя пользователя уже занято.";
      if ("errors" in result.error && Array.isArray(result.error.errors)) {
        const details = result.error.errors.flatMap((error: unknown) => {
          if (
            typeof error !== "object" ||
            !error ||
            !("msg" in error) ||
            typeof error.msg !== "string"
          )
            return [];
          return [error.msg];
        });
        if (details.length) message += ` ${details.join("; ")}`;
      }
    }
    throw new ApiError(status, message);
  }
  return result.data as T;
}

// OpenAPI describes request IDs as numbers, but the backend returns int64 strings
// and accepts decimal strings in requests. Keep the exact digits at runtime;
// this cast bridges the generated request type without rounding snowflake IDs.
export function apiId(id: string) {
  if (!/^[1-9]\d*$/.test(id) || BigInt(id) > BigInt("9223372036854775807"))
    throw new Error("Некорректный идентификатор сервера.");
  return id as unknown as number;
}
function requiredId(id: string | undefined) {
  if (!id) throw new Error("Сервер не вернул идентификатор записи.");
  return id;
}
export function mapEvent(event: ApiEvent): TripEvent {
  return {
    id: requiredId(event.id),
    title: event.title,
    type: event.type,
    start: event.startedAt.slice(0, 16),
    end: event.endedAt?.slice(0, 16) ?? "",
    description: event.description ?? "",
    pointId: event.waypointId ?? null,
    bookingUrl: event.bookingUrl ?? "",
    materials: [],
  };
}
export function mapPoint(point: Waypoint) {
  return {
    id: requiredId(point.id),
    name: point.name,
    description: point.description ?? "",
    lat: point.latitude,
    lng: point.longitude,
  };
}
export function mapLeg(leg: Movement) {
  const transport = Object.keys(TRANSPORT_TYPES).find(
    (kind) => kind === leg.transportType,
  ) as keyof typeof TRANSPORT_TYPES | undefined;
  if (!transport)
    throw new Error(`Неизвестный вид транспорта: ${leg.transportType}`);
  return {
    id: requiredId(leg.id),
    transport,
    description: leg.description ?? "",
    start: leg.startedAt.slice(0, 16),
    end: (leg.endedAt ?? leg.startedAt).slice(0, 16),
    fromPointId: leg.startsAtWaypointId,
    toPointId: leg.endsAtWaypointId,
  };
}
export function mapTrip(trip: ApiTrip): Trip {
  return {
    id: requiredId(trip.id),
    name: trip.name,
    description: trip.description ?? "",
    startDate: trip.startedOn,
    endDate: trip.endedOn ?? trip.startedOn,
    cover: trip.cover ?? null,
    events: [],
    points: [],
    legs: [],
  };
}
export function tripBody(values: TripValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    startedOn: values.startDate,
    endedOn: values.endDate,
    cover: values.cover,
  };
}
export function pointBody(values: RoutePointValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    latitude: values.lat,
    longitude: values.lng,
  };
}
export function eventBody(values: EventValues) {
  return {
    title: values.title.trim(),
    type: values.type,
    description: values.description.trim() || null,
    startedAt: values.start,
    endedAt: values.end || null,
    bookingUrl: values.bookingUrl.trim() || null,
    waypointId: values.pointId ? apiId(values.pointId) : null,
  };
}
export function legBody(values: TripLegValues) {
  return {
    transportType: values.transport,
    description: values.description.trim() || null,
    // Transfers require aware timestamps, while events require naive timestamps.
    // Use a fixed offset to preserve the trip's wall-clock digits in any browser.
    startedAt: `${values.start}:00Z`,
    endedAt: values.end ? `${values.end}:00Z` : null,
    startsAtWaypointId: apiId(values.fromPointId),
    endsAtWaypointId: apiId(values.toPointId),
  };
}
export async function loadTrips() {
  const trips = await apiResult(sdk.tripsGetTrips());
  return Promise.all(
    trips.map(async (item) => {
      const trip = mapTrip(item);
      const path = { tripId: apiId(trip.id) };
      const [points, legs, events] = await Promise.all([
        apiResult(sdk.pointsGetPoints({ path })),
        apiResult(sdk.transfersGetTransfers({ path })),
        apiResult(sdk.eventsGetEvents({ path })),
      ]);
      return {
        ...trip,
        points: points.map(mapPoint),
        legs: legs.map(mapLeg),
        events: events.map(mapEvent),
      };
    }),
  );
}
