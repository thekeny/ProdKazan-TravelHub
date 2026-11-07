"use client";
import { useContext, useEffect, useState } from "react";
import { API_URL } from "@/configs/consts/api.const";
import { APP } from "@/configs/consts/app.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import type {
  TravelData,
  TravelState,
  Trip,
} from "@/configs/types/travel.type";
import { isConnected } from "@/lib/connectivity";
import {
  authErrors,
  eventErrors,
  legErrors,
  pointErrors,
  tripErrors,
} from "@/lib/form-validation";
import { createId } from "@/lib/id";
import { assertValidInput } from "@/lib/input-validation";
import { deleteMaterialFiles } from "@/lib/material-storage";
import { normalizeBookingUrl } from "@/lib/materials";
import {
  emptyState,
  normalizeUsername,
  readStateWithReport,
  writeState,
} from "@/lib/travel-storage";
import { RemoteTravelProvider } from "./remote-travel-provider";
import { TravelContext } from "./travel-context";

function materialIdsOf(trip: Trip) {
  return (trip.events ?? []).flatMap((event) =>
    (event.materials ?? []).map((material) => material.id),
  );
}

function LocalTravelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TravelState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  useEffect(() => {
    try {
      const result = readStateWithReport();
      setState(result.state);
      if (result.dropped > 0)
        setStorageWarning(
          `Часть повреждённых данных не удалось восстановить (${result.dropped}). Остальные поездки загружены.`,
        );
    } catch {
      try {
        const raw = localStorage.getItem(APP.STORAGE_KEY);
        if (raw) localStorage.setItem(`${APP.STORAGE_KEY}.broken`, raw);
      } catch {
        // Резервную копию сохранить не удалось — не блокируем запуск.
      }
      setStorageWarning(
        "Не удалось прочитать сохранённые данные. Копия повреждённого состояния сохранена в браузере.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APP.STORAGE_KEY) return;
      try {
        setState(readStateWithReport().state);
      } catch {
        // Другая вкладка записала некорректные данные — оставляем текущее состояние.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const data =
    state.username && Object.hasOwn(state.accounts, state.username)
      ? state.accounts[state.username]
      : { trips: [], activeId: null };
  function commit(next: TravelState) {
    if (
      !isConnected() &&
      JSON.stringify(next.accounts) !== JSON.stringify(state.accounts)
    )
      throw new Error(
        "Вы оффлайн. Доступен только просмотр сохранённых данных.",
      );
    writeState(next);
    setState(next);
  }
  function updateData(next: TravelData) {
    if (!state.username) throw new Error("Сначала войдите в аккаунт.");
    commit({
      ...state,
      accounts: { ...state.accounts, [state.username]: next },
    });
  }
  function activeTrip(tripId: string) {
    if (
      tripId !== data.activeId ||
      !data.trips.some((trip) => trip.id === tripId)
    )
      throw new Error("Выберите путешествие.");
    return data.trips.find((trip) => trip.id === tripId) as Trip;
  }
  function updateTrip(tripId: string, change: (trip: Trip) => Trip) {
    activeTrip(tripId);
    updateTripById(tripId, change);
  }
  function updateTripById(tripId: string, change: (trip: Trip) => Trip) {
    const trip = data.trips.find((item) => item.id === tripId);
    if (!trip) throw new Error("Путешествие не найдено.");
    updateData({
      ...data,
      trips: data.trips.map((item) =>
        item.id === tripId ? change(item) : item,
      ),
    });
  }
  function updateEvents(
    tripId: string,
    change: (events: TripEvent[]) => TripEvent[],
  ) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      events: change(trip.events ?? []),
    }));
  }
  return (
    <TravelContext.Provider
      value={{
        ...data,
        ready,
        username: state.username,
        storageWarning,
        dismissStorageWarning() {
          setStorageWarning(null);
        },
        saveEvent(tripId, values, eventId) {
          const trip = activeTrip(tripId);
          assertValidInput(
            eventErrors(values, trip, trip.points ?? [], {
              initial: trip.events?.find((event) => event.id === eventId),
            }),
          );
          const id = eventId ?? createId();
          updateEvents(tripId, (events) => {
            if (eventId && !events.some((event) => event.id === eventId))
              throw new Error("Событие не найдено.");
            const event: TripEvent = {
              ...values,
              title: values.title.trim(),
              description: values.description.trim(),
              bookingUrl: normalizeBookingUrl(values.bookingUrl),
              materials: values.materials ?? [],
              id,
            };
            return eventId
              ? events.map((item) => (item.id === eventId ? event : item))
              : [...events, event];
          });
          return id;
        },
        deleteEvent(tripId, eventId) {
          const trip = activeTrip(tripId);
          const event = (trip.events ?? []).find((item) => item.id === eventId);
          if (!event) throw new Error("Событие не найдено.");
          updateEvents(tripId, (events) => {
            if (!events.some((item) => item.id === eventId))
              throw new Error("Событие не найдено.");
            return events.filter((item) => item.id !== eventId);
          });
          void deleteMaterialFiles(
            (event.materials ?? []).map((material) => material.id),
          );
        },
        savePoint(tripId, values, pointId) {
          assertValidInput(pointErrors(values));
          const id = pointId ?? createId();
          updateTrip(tripId, (trip) => {
            const points = trip.points ?? [];
            if (pointId && !points.some((point) => point.id === pointId))
              throw new Error("Точка не найдена.");
            const point: RoutePoint = {
              ...values,
              name: values.name.trim(),
              description: values.description.trim(),
              id,
            };
            return {
              ...trip,
              points: pointId
                ? points.map((item) => (item.id === pointId ? point : item))
                : [...points, point],
            };
          });
          return id;
        },
        deletePoint(tripId, pointId) {
          updateTrip(tripId, (trip) => {
            const points = trip.points ?? [];
            if (!points.some((point) => point.id === pointId))
              throw new Error("Точка не найдена.");
            return {
              ...trip,
              points: points.filter((point) => point.id !== pointId),
              events: (trip.events ?? []).map((event) =>
                event.pointId === pointId ? { ...event, pointId: null } : event,
              ),
              legs: (trip.legs ?? []).filter(
                (leg) =>
                  leg.fromPointId !== pointId && leg.toPointId !== pointId,
              ),
            };
          });
        },
        saveLeg(tripId, values, legId) {
          const trip = activeTrip(tripId);
          assertValidInput(
            legErrors(values, trip, trip.points ?? [], {
              initial: trip.legs?.find((leg) => leg.id === legId),
            }),
          );
          const id = legId ?? createId();
          updateTrip(tripId, (current) => {
            const legs = current.legs ?? [];
            if (legId && !legs.some((leg) => leg.id === legId))
              throw new Error("Перемещение не найдено.");
            const leg: TripLeg = {
              ...values,
              description: values.description.trim(),
              id,
            };
            return {
              ...current,
              legs: legId
                ? legs.map((item) => (item.id === legId ? leg : item))
                : [...legs, leg],
            };
          });
          return id;
        },
        deleteLeg(tripId, legId) {
          updateTrip(tripId, (trip) => {
            const legs = trip.legs ?? [];
            if (!legs.some((leg) => leg.id === legId))
              throw new Error("Перемещение не найдено.");
            return {
              ...trip,
              legs: legs.filter((leg) => leg.id !== legId),
            };
          });
        },
        async loadCollaborators() {
          throw new Error(
            "Совместный доступ доступен только для поездок на сервере.",
          );
        },
        async generateInviteCode() {
          throw new Error(
            "Совместный доступ доступен только для поездок на сервере.",
          );
        },
        async joinTrip() {
          throw new Error(
            "Присоединиться по коду можно только к поездке на сервере.",
          );
        },
        login(name) {
          assertValidInput(
            authErrors(
              { username: name, password: "", confirm: "" },
              false,
              false,
            ),
          );
          const username = normalizeUsername(name);
          const existing = Object.hasOwn(state.accounts, username)
            ? state.accounts[username]
            : null;
          const account = existing ?? { trips: [], activeId: null };
          commit({
            ...state,
            username,
            accounts: {
              ...state.accounts,
              [username]: account,
            },
          });
        },
        renameAccount(name) {
          if (!state.username) throw new Error("Сначала войдите в аккаунт.");
          const username = normalizeUsername(name);
          assertValidInput(
            authErrors(
              { username: name, password: "", confirm: "" },
              false,
              false,
            ),
          );
          if (username === state.username) return;
          if (Object.hasOwn(state.accounts, username))
            throw new Error("Это имя уже занято.");
          const accounts = { ...state.accounts, [username]: data };
          delete accounts[state.username];
          commit({ ...state, username, accounts });
        },
        async changePassword() {
          throw new Error(
            "Смена пароля доступна только для серверного аккаунта.",
          );
        },
        logout() {
          commit({ ...state, username: null });
        },
        createTrip(values) {
          assertValidInput(tripErrors(values, false));
          const trip: Trip = {
            ...values,
            name: values.name.trim(),
            description: values.description.trim(),
            id: createId(),
            points: [],
            legs: [],
            events: [],
          };
          updateData({ trips: [...data.trips, trip], activeId: trip.id });
        },
        saveTrip(tripId, values) {
          assertValidInput(
            tripErrors(values, false, {
              initial: data.trips.find((trip) => trip.id === tripId),
            }),
          );
          updateTripById(tripId, (trip) => {
            const outsideDates = (trip.events ?? []).some(
              (event) =>
                event.start.slice(0, 10) < values.startDate ||
                (event.end || event.start).slice(0, 10) > values.endDate,
            );
            const legOutsideDates = (trip.legs ?? []).some(
              (leg) =>
                leg.start.slice(0, 10) < values.startDate ||
                leg.end.slice(0, 10) > values.endDate,
            );
            if (outsideDates || legOutsideDates)
              throw new Error(
                "Новые даты не покрывают события или перемещения поездки. Сначала перенесите их.",
              );
            return {
              ...trip,
              ...values,
              name: values.name.trim(),
              description: values.description.trim(),
            };
          });
        },
        deleteTrip(tripId) {
          const trip = data.trips.find((item) => item.id === tripId);
          if (!trip) throw new Error("Путешествие не найдено.");
          const trips = data.trips.filter((item) => item.id !== tripId);
          updateData({
            trips,
            activeId:
              data.activeId === tripId ? (trips[0]?.id ?? null) : data.activeId,
          });
          void deleteMaterialFiles(materialIdsOf(trip));
        },
        selectTrip(id) {
          if (!data.trips.some((trip) => trip.id === id))
            throw new Error("Путешествие не найдено.");
          updateData({ ...data, activeId: id });
        },
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}
export function TravelProvider({ children }: { children: React.ReactNode }) {
  return API_URL ? (
    <RemoteTravelProvider>{children}</RemoteTravelProvider>
  ) : (
    <LocalTravelProvider>{children}</LocalTravelProvider>
  );
}
export function useTravel() {
  const value = useContext(TravelContext);
  if (!value) throw new Error("TravelProvider is required");
  return value;
}
