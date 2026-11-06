"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type {
  DemoState,
  TravelData,
  TripValues,
} from "@/configs/types/travel.type";
import { validateEvent } from "@/lib/travel-events";
import {
  emptyState,
  normalizeUsername,
  readState,
  validateTrip,
  writeState,
} from "@/lib/travel-storage";

type TravelContextValue = TravelData & {
  ready: boolean;
  username: string | null;
  storageWarning: string | null;
  login: (name: string) => void;
  logout: () => void;
  createTrip: (values: TripValues) => void;
  selectTrip: (id: string) => void;
  saveEvent: (tripId: string, values: EventValues, eventId?: string) => void;
  deleteEvent: (tripId: string, eventId: string) => void;
};
const TravelContext = createContext<TravelContextValue | null>(null);
export function TravelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  useEffect(() => {
    try {
      setState(readState());
    } catch {
      setStorageWarning(
        "Не удалось прочитать сохранённые данные. Можно начать новую демосессию.",
      );
    }
    setReady(true);
  }, []);
  const data =
    state.username && Object.hasOwn(state.accounts, state.username)
      ? state.accounts[state.username]
      : { trips: [], activeId: null };
  function commit(next: DemoState) {
    writeState(next);
    setState(next);
    setStorageWarning(null);
  }
  function updateData(next: TravelData) {
    if (!state.username) throw new Error("Сначала войдите в аккаунт.");
    commit({
      ...state,
      accounts: { ...state.accounts, [state.username]: next },
    });
  }
  function updateEvents(
    tripId: string,
    change: (events: TripEvent[]) => TripEvent[],
  ) {
    if (
      tripId !== data.activeId ||
      !data.trips.some((trip) => trip.id === tripId)
    )
      throw new Error("Выберите путешествие.");
    updateData({
      ...data,
      trips: data.trips.map((trip) =>
        trip.id === tripId
          ? { ...trip, events: change(trip.events ?? []) }
          : trip,
      ),
    });
  }
  return (
    <TravelContext.Provider
      value={{
        ...data,
        ready,
        username: state.username,
        storageWarning,
        saveEvent(tripId, values, eventId) {
          const trip = data.trips.find((trip) => trip.id === tripId);
          if (!trip) throw new Error("Путешествие не найдено.");
          const error = validateEvent(values, trip);
          if (error) throw new Error(error);
          updateEvents(tripId, (events) => {
            if (eventId && !events.some((event) => event.id === eventId))
              throw new Error("Событие не найдено.");
            const event = {
              ...values,
              title: values.title.trim(),
              description: values.description.trim(),
              place: values.place
                ? { ...values.place, name: values.place.name.trim() }
                : null,
              id: eventId ?? crypto.randomUUID(),
            };
            return eventId
              ? events.map((item) => (item.id === eventId ? event : item))
              : [...events, event];
          });
        },
        deleteEvent(tripId, eventId) {
          updateEvents(tripId, (events) => {
            if (!events.some((event) => event.id === eventId))
              throw new Error("Событие не найдено.");
            return events.filter((event) => event.id !== eventId);
          });
        },
        login(name) {
          const username = normalizeUsername(name);
          commit({
            ...state,
            username,
            accounts: {
              ...state.accounts,
              [username]: Object.hasOwn(state.accounts, username)
                ? state.accounts[username]
                : { trips: [], activeId: null },
            },
          });
        },
        logout() {
          commit({ ...state, username: null });
        },
        createTrip(values) {
          const error = validateTrip(values);
          if (error) throw new Error(error);
          const trip = {
            ...values,
            name: values.name.trim(),
            description: values.description.trim(),
            id: crypto.randomUUID(),
          };
          updateData({ trips: [...data.trips, trip], activeId: trip.id });
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
export function useTravel() {
  const value = useContext(TravelContext);
  if (!value) throw new Error("TravelProvider is required");
  return value;
}
