"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type {
  DemoState,
  TravelData,
  TripValues,
} from "@/configs/types/travel.type";
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
  return (
    <TravelContext.Provider
      value={{
        ...data,
        ready,
        username: state.username,
        storageWarning,
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
