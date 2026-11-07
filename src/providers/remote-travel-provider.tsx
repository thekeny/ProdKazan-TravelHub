"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as sdk from "@/api/generated/sdk.gen";
import type { User } from "@/api/generated/types.gen";
import { ServerError } from "@/components/layout/server-error";
import type { TravelData, Trip } from "@/configs/types/travel.type";
import {
  authErrors,
  eventErrors,
  legErrors,
  passwordErrors,
  pointErrors,
  tripErrors,
} from "@/lib/form-validation";
import { assertValidInput } from "@/lib/input-validation";
import { deleteMaterialFiles } from "@/lib/material-storage";
import {
  coverBlob,
  isUploadedCover,
  loadRemoteCover,
  remoteCoverKey,
} from "@/lib/remote-covers";
import {
  readRemotePreferences,
  writeRemotePreferences,
} from "@/lib/remote-preferences";
import {
  ApiError,
  apiId,
  apiResult,
  eventBody,
  legBody,
  loadTrips,
  mapEvent,
  mapLeg,
  mapPoint,
  mapTrip,
  pointBody,
  tripBody,
} from "@/lib/travel-api";
import { TravelContext, type TravelContextValue } from "./travel-context";

const empty: TravelData = { trips: [], activeId: null };
export function RemoteTravelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User>();
  const [data, setData] = useState<TravelData>(empty);
  const [ready, setReady] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [storageWarning, setWarning] = useState<string | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const reconcile = useRef(false);

  const preferences = useCallback((account: User) => {
    try {
      return readRemotePreferences(account.id ?? account.username);
    } catch {
      setWarning(
        "Не удалось прочитать локальные материалы, типы событий и выбор поездки.",
      );
      return {
        activeId: null,
        materials: {},
        eventTypes: {},
        tripEventTypes: {},
      };
    }
  }, []);
  function persist(next: TravelData, requireLocalWrite = false) {
    if (user) {
      try {
        writeRemotePreferences(user.id ?? user.username, {
          activeId: next.activeId,
          eventTypes: Object.fromEntries(
            next.trips.flatMap((trip) =>
              (trip.events ?? []).flatMap((event) =>
                event.customType === undefined
                  ? []
                  : [[event.id, event.customType]],
              ),
            ),
          ),
          tripEventTypes: Object.fromEntries(
            next.trips.map((trip) => [trip.id, trip.eventTypes ?? []]),
          ),
          coverIds: next.trips
            .filter((trip) => isUploadedCover(trip.cover))
            .map((trip) => trip.id),
          materials: Object.fromEntries(
            next.trips.flatMap((trip) =>
              (trip.events ?? []).map((event) => [event.id, event.materials]),
            ),
          ),
        });
      } catch {
        if (requireLocalWrite)
          throw new Error(
            "Не удалось сохранить типы событий в браузере. Проверьте доступ к хранилищу.",
          );
        setWarning(
          "Изменения сохранены на сервере, но локальные материалы, типы событий и выбор поездки сохранить не удалось.",
        );
      }
    }
    setData(next);
  }
  const initialize = useCallback(
    async (expected = generation.current) => {
      const account = await apiResult(sdk.authGetSelf());
      const trips = await loadTrips();
      const local = preferences(account);
      const covers = new Map<string, string>();
      await Promise.all(
        (local.coverIds ?? []).map(async (id) => {
          if (!trips.some((trip) => trip.id === id)) return;
          try {
            const cover = await loadRemoteCover(
              account.id ?? account.username,
              id,
            );
            if (cover) covers.set(id, cover);
          } catch {
            if (generation.current === expected)
              setWarning("Не удалось прочитать обложку из браузера.");
          }
        }),
      );
      if (generation.current !== expected) return;
      setUser(account);
      setData({
        trips: trips.map((trip) => ({
          ...trip,
          eventTypes: local.tripEventTypes?.[trip.id] ?? [],
          cover: trip.cover ?? covers.get(trip.id) ?? null,
          events: trip.events?.map((event) => ({
            ...event,
            materials: local.materials[event.id] ?? [],
            ...(local.eventTypes?.[event.id] === undefined
              ? {}
              : { customType: local.eventTypes[event.id] }),
          })),
        })),
        activeId:
          trips.find((trip) => trip.id === local.activeId)?.id ??
          trips[0]?.id ??
          null,
      });
    },
    [preferences],
  );
  useEffect(() => {
    const current = ++generation.current;
    async function restore() {
      try {
        await initialize(current);
      } catch (error) {
        if (generation.current !== current) return;
        if (!(error instanceof ApiError && error.status === 401))
          setErrorStatus(error instanceof ApiError ? error.status : 0);
      } finally {
        if (generation.current === current) setReady(true);
      }
    }
    void restore();
    return () => {
      generation.current++;
    };
  }, [initialize]);

  async function mutate<T>(operation: () => Promise<T>): Promise<T> {
    if (busy.current)
      throw new Error("Дождитесь завершения предыдущего запроса.");
    busy.current = true;
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status >= 500 &&
        error.status < 600
      ) {
        setErrorStatus(error.status);
      }
      if (error instanceof ApiError && error.status === 401) {
        setUser(undefined);
        setData(empty);
      } else if (reconcile.current && user) {
        try {
          await initialize();
        } catch {
          setWarning(
            "Часть изменений могла сохраниться. Обновите страницу, чтобы загрузить состояние сервера.",
          );
        }
      }
      throw error;
    } finally {
      busy.current = false;
      reconcile.current = false;
    }
  }
  function findTrip(id: string, requireActive = true) {
    const trip = data.trips.find((item) => item.id === id);
    if (!user || !trip || (requireActive && data.activeId !== id))
      throw new Error("Выберите путешествие.");
    return trip;
  }
  function replace(trip: Trip, requireLocalWrite = false) {
    persist(
      {
        ...data,
        trips: data.trips.map((item) => (item.id === trip.id ? trip : item)),
      },
      requireLocalWrite,
    );
  }
  async function applyCover(trip: Trip, cover: string | null): Promise<Trip> {
    if (!isUploadedCover(cover)) return trip;
    const blob = coverBlob(cover);
    return mapTrip(
      await apiResult(
        sdk.tripsPutTripCover({
          path: { trip_id: apiId(trip.id) },
          body: blob,
          headers: { "Content-Type": blob.type },
        }),
      ),
    );
  }

  const value: TravelContextValue = {
    ...data,
    user,
    remote: true,
    username: user?.username ?? null,
    ready,
    storageWarning,
    dismissStorageWarning: () => setWarning(null),
    login: (name, password = "", register = false) =>
      mutate(async () => {
        assertValidInput(
          authErrors(
            { username: name, password, confirm: password },
            true,
            register,
          ),
        );
        if (register)
          await apiResult(
            sdk.authRegister({ body: { username: name.trim(), password } }),
          );
        await apiResult(
          sdk.authLogin({
            body: { grant_type: "password", username: name.trim(), password },
          }),
        );
        await initialize();
      }),
    logout: () =>
      mutate(async () => {
        await apiResult(sdk.authLogout());
        setUser(undefined);
        setData(empty);
      }),
    renameAccount() {
      throw new Error(
        "Бэкенд пока не поддерживает изменение имени пользователя.",
      );
    },
    changePassword: (currentPassword, newPassword) =>
      mutate(async () => {
        if (!user) throw new Error("Сначала войдите в аккаунт.");
        assertValidInput(
          passwordErrors({
            currentPassword,
            newPassword,
            confirmPassword: newPassword,
          }),
        );
        try {
          await apiResult(
            sdk.authChangePassword({
              body: { currentPassword, newPassword },
            }),
          );
        } catch (error) {
          if (error instanceof ApiError && error.status === 403)
            throw new ApiError(403, "Неверный текущий пароль.");
          throw error;
        }
      }),
    selectTrip(id) {
      findTrip(id, false);
      persist({ ...data, activeId: id });
    },
    createTrip: (values) =>
      mutate(async () => {
        if (!user) throw new Error("Сначала войдите в аккаунт.");
        assertValidInput(tripErrors(values, true));
        const trip = mapTrip(
          await apiResult(sdk.tripsPostTrip({ body: tripBody(values) })),
        );
        reconcile.current = true;
        persist({
          trips: [
            ...data.trips,
            {
              ...(await applyCover(trip, values.cover)),
              eventTypes: values.eventTypes ?? [],
            },
          ],
          activeId: trip.id,
        });
      }),
    saveTrip: (id, values) =>
      mutate(async () => {
        const trip = findTrip(id, false);
        assertValidInput(tripErrors(values, true, { initial: trip }));
        const outside = [...(trip.events ?? []), ...(trip.legs ?? [])].some(
          (item) =>
            item.start.slice(0, 10) < values.startDate ||
            (item.end || item.start).slice(0, 10) > values.endDate,
        );
        if (outside)
          throw new Error(
            "Новые даты не покрывают события или перемещения поездки. Сначала перенесите их.",
          );
        const body = tripBody(values);
        // Custom types have no API endpoint yet. Keep local-only edits independent
        // of backend availability, and commit in memory only after local storage.
        if (
          JSON.stringify(body) === JSON.stringify(tripBody(trip)) &&
          values.cover === trip.cover
        ) {
          replace(
            { ...trip, eventTypes: values.eventTypes ?? trip.eventTypes ?? [] },
            true,
          );
          return;
        }
        const saved = mapTrip(
          await apiResult(
            sdk.tripsPatchTrip({
              path: { trip_id: apiId(id) },
              body,
            }),
          ),
        );
        reconcile.current = true;
        replace({
          ...(await applyCover(saved, values.cover)),
          eventTypes: values.eventTypes ?? trip.eventTypes ?? [],
          events: trip.events,
          points: trip.points,
          legs: trip.legs,
        });
      }),
    deleteTrip: (id) =>
      mutate(async () => {
        const trip = findTrip(id, false);
        reconcile.current = true;
        for (const leg of trip.legs ?? [])
          await apiResult(
            sdk.transfersRemoveTransfer({
              path: { tripId: apiId(id), transferId: apiId(leg.id) },
            }),
          );
        for (const event of trip.events ?? [])
          await apiResult(
            sdk.eventsRemoveEvent({
              path: { tripId: apiId(id), eventId: apiId(event.id) },
            }),
          );
        for (const point of trip.points ?? [])
          await apiResult(
            sdk.pointsRemovePoint({
              path: { tripId: apiId(id), pointId: apiId(point.id) },
            }),
          );
        await apiResult(sdk.tripsRemoveTrip({ path: { trip_id: apiId(id) } }));
        const trips = data.trips.filter((item) => item.id !== id);
        persist({
          trips,
          activeId:
            data.activeId === id ? (trips[0]?.id ?? null) : data.activeId,
        });
        void deleteMaterialFiles([
          remoteCoverKey(user?.id ?? user?.username ?? "", id),
          ...(trip.events ?? []).flatMap((event) =>
            event.materials.map((material) => material.id),
          ),
        ]);
      }),
    savePoint: (id, values, pointId) =>
      mutate(async () => {
        const trip = findTrip(id);
        assertValidInput(pointErrors(values));
        const body = pointBody(values);
        const point = mapPoint(
          await apiResult(
            pointId
              ? sdk.pointsPatchPoint({
                  path: { tripId: apiId(id), pointId: apiId(pointId) },
                  body,
                })
              : sdk.pointsPostPoint({ path: { tripId: apiId(id) }, body }),
          ),
        );
        replace({
          ...trip,
          points: pointId
            ? trip.points?.map((item) => (item.id === pointId ? point : item))
            : [...(trip.points ?? []), point],
        });
        return point.id;
      }),
    deletePoint: (id, pointId) =>
      mutate(async () => {
        const trip = findTrip(id);
        reconcile.current = true;
        // The backend rejects deleting points used by transfers. Remove those first.
        for (const leg of trip.legs ?? []) {
          if (leg.fromPointId !== pointId && leg.toPointId !== pointId)
            continue;
          await apiResult(
            sdk.transfersRemoveTransfer({
              path: { tripId: apiId(id), transferId: apiId(leg.id) },
            }),
          );
        }
        for (const event of trip.events ?? []) {
          if (event.pointId === pointId)
            await apiResult(
              sdk.eventsPatchEvent({
                path: { tripId: apiId(id), eventId: apiId(event.id) },
                body: { waypointId: null },
              }),
            );
        }
        await apiResult(
          sdk.pointsRemovePoint({
            path: { tripId: apiId(id), pointId: apiId(pointId) },
          }),
        );
        replace({
          ...trip,
          points: trip.points?.filter((point) => point.id !== pointId),
          legs: trip.legs?.filter(
            (leg) => leg.fromPointId !== pointId && leg.toPointId !== pointId,
          ),
          events: trip.events?.map((event) =>
            event.pointId === pointId ? { ...event, pointId: null } : event,
          ),
        });
      }),
    saveEvent: (id, values, eventId) =>
      mutate(async () => {
        const trip = findTrip(id);
        assertValidInput(
          eventErrors(values, trip, trip.points ?? [], {
            initial: trip.events?.find((event) => event.id === eventId),
          }),
        );
        const body = eventBody(values);
        const event = {
          ...mapEvent(
            await apiResult(
              eventId
                ? sdk.eventsPatchEvent({
                    path: { tripId: apiId(id), eventId: apiId(eventId) },
                    body,
                  })
                : sdk.eventsPostEvent({ path: { tripId: apiId(id) }, body }),
            ),
          ),
          materials: values.materials,
          customType: values.customType,
        };
        replace({
          ...trip,
          events: eventId
            ? trip.events?.map((item) => (item.id === eventId ? event : item))
            : [...(trip.events ?? []), event],
        });
        return event.id;
      }),
    deleteEvent: (id, eventId) =>
      mutate(async () => {
        const trip = findTrip(id);
        await apiResult(
          sdk.eventsRemoveEvent({
            path: { tripId: apiId(id), eventId: apiId(eventId) },
          }),
        );
        const materials =
          trip.events?.find((event) => event.id === eventId)?.materials ?? [];
        replace({
          ...trip,
          events: trip.events?.filter((event) => event.id !== eventId),
        });
        void deleteMaterialFiles(materials.map((material) => material.id));
      }),
    saveLeg: (id, values, legId) =>
      mutate(async () => {
        const trip = findTrip(id);
        assertValidInput(
          legErrors(values, trip, trip.points ?? [], {
            initial: trip.legs?.find((leg) => leg.id === legId),
          }),
        );
        const body = legBody(values);
        if (
          legId &&
          values.description.trim() !==
            (trip.legs?.find((leg) => leg.id === legId)?.description ?? "")
        )
          throw new Error(
            "API пока не поддерживает изменение описания перемещения.",
          );
        // PATCH currently omits description in the backend schema. Recreating would
        // change identity, so keep the server's description when editing a transfer.
        const leg = mapLeg(
          await apiResult(
            legId
              ? sdk.transfersPatchTransfer({
                  path: { tripId: apiId(id), transferId: apiId(legId) },
                  body,
                })
              : sdk.transfersPostTransfer({
                  path: { tripId: apiId(id) },
                  body,
                }),
          ),
        );
        replace({
          ...trip,
          legs: legId
            ? trip.legs?.map((item) => (item.id === legId ? leg : item))
            : [...(trip.legs ?? []), leg],
        });
        return leg.id;
      }),
    deleteLeg: (id, legId) =>
      mutate(async () => {
        const trip = findTrip(id);
        await apiResult(
          sdk.transfersRemoveTransfer({
            path: { tripId: apiId(id), transferId: apiId(legId) },
          }),
        );
        replace({
          ...trip,
          legs: trip.legs?.filter((leg) => leg.id !== legId),
        });
      }),
  };
  return (
    <TravelContext.Provider value={value}>
      {errorStatus !== null ? <ServerError status={errorStatus} /> : children}
    </TravelContext.Provider>
  );
}
