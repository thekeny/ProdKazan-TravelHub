import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip } from "@/configs/types/travel.type";
import { TravelProvider, useTravel } from "@/providers/travel-provider";

let travel: ReturnType<typeof useTravel>;
let root: Root;
let container: HTMLDivElement;
function Probe() {
  travel = useTravel();
  return null;
}
async function mount() {
  root = createRoot(container);
  await act(async () => {
    root.render(
      <TravelProvider>
        <Probe />
      </TravelProvider>,
    );
  });
}
async function clearTrips() {
  while (travel.trips.length)
    await act(async () => travel.deleteTrip(travel.trips[0].id));
}
function getTrip(id: string) {
  return travel.trips.find((trip) => trip.id === id) as Trip;
}
const values = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-02",
  cover: null,
};
const event = {
  title: "Прогулка",
  type: "walk" as const,
  start: "2026-05-01T09:00",
  end: "",
  description: "",
  pointId: null,
  materials: [],
  bookingUrl: "",
};
const airport = {
  name: "Аэропорт",
  description: "",
  lat: 55.6,
  lng: 49.3,
};
const hotel = {
  name: "Гостиница",
  description: "",
  lat: 55.8,
  lng: 49.1,
};
const leg = {
  fromPointId: "",
  toPointId: "",
  transport: "car" as const,
  start: "2026-05-01T11:30",
  end: "2026-05-01T12:15",
  description: "",
};
beforeEach(async () => {
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("travel session flow", () => {
  it("persists event changes and isolates trips and accounts", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    await act(async () => travel.createTrip(values));
    const tripId = travel.activeId as string;
    await act(async () => travel.saveEvent(tripId, event));
    const eventId = getTrip(tripId).events?.[0].id as string;
    await act(async () =>
      travel.saveEvent(tripId, { ...event, title: "Музей" }, eventId),
    );
    await act(async () => root.unmount());
    await mount();
    expect(getTrip(tripId).events?.[0].title).toBe("Музей");
    await act(async () => travel.createTrip({ ...values, name: "Москва" }));
    expect(() => travel.saveEvent(tripId, event)).toThrow();
    expect(() =>
      travel.deleteEvent(travel.activeId as string, eventId),
    ).toThrow();
    await act(async () => travel.login("bob"));
    expect(() => travel.deleteEvent(tripId, eventId)).toThrow();
    await act(async () => travel.login("alice"));
    await act(async () => travel.selectTrip(tripId));
    const saved = travel.trips;
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(() => travel.deleteEvent(tripId, eventId)).toThrow();
    expect(() => travel.saveEvent(tripId, event, eventId)).toThrow();
    expect(() => travel.saveEvent(tripId, event)).toThrow();
    expect(travel.trips).toBe(saved);
    spy.mockRestore();
    await act(async () => travel.deleteEvent(tripId, eventId));
    expect(getTrip(tripId).events).toEqual([]);
  });
  it("stores route points and legs and keeps references consistent", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    await act(async () => travel.createTrip(values));
    const tripId = travel.activeId as string;
    await act(async () => travel.savePoint(tripId, airport));
    await act(async () => travel.savePoint(tripId, hotel));
    const [fromPointId, toPointId] = (getTrip(tripId).points ?? []).map(
      (point) => point.id,
    );
    await act(async () =>
      travel.saveLeg(tripId, { ...leg, fromPointId, toPointId }),
    );
    expect(getTrip(tripId).legs).toHaveLength(1);
    await act(async () =>
      travel.saveEvent(tripId, { ...event, pointId: toPointId }),
    );
    expect(() =>
      travel.saveLeg(tripId, {
        ...leg,
        fromPointId,
        toPointId: "missing",
      }),
    ).toThrow();
    expect(() =>
      travel.saveEvent(tripId, { ...event, pointId: "missing" }),
    ).toThrow();
    await act(async () => travel.deletePoint(tripId, toPointId));
    const trip = getTrip(tripId);
    expect(trip.points).toHaveLength(1);
    expect(trip.legs).toEqual([]);
    expect(trip.events?.[0].pointId).toBeNull();
  });
  it("creates and switches trips, and restores selection", async () => {
    await act(async () => travel.login(" Alice "));
    expect(travel.username).toBe("alice");
    expect(travel.trips).toHaveLength(0);
    await act(async () => travel.createTrip(values));
    const firstId = travel.activeId;
    await act(async () => travel.createTrip({ ...values, name: "Москва" }));
    expect(travel.trips).toHaveLength(2);
    expect(travel.activeId).not.toBe(firstId);
    await act(async () => travel.selectTrip(firstId as string));
    await act(async () => root.unmount());
    await mount();
    expect(travel.activeId).toBe(firstId);
    expect(travel.trips).toHaveLength(2);
  });
  it("isolates accounts and keeps trips after logout", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    await act(async () => travel.createTrip(values));
    const aliceTripId = travel.activeId as string;
    await act(async () => travel.logout());
    expect(travel.username).toBeNull();
    await act(async () => travel.login("bob"));
    expect(travel.trips).toHaveLength(0);
    await act(async () => travel.createTrip({ ...values, name: "Боб" }));
    expect(travel.activeId).not.toBe(aliceTripId);
    await act(async () => travel.logout());
    await act(async () => travel.login("ALICE"));
    expect(travel.trips).toHaveLength(1);
    expect(travel.trips[0].id).toBe(aliceTripId);
  });
  it("preserves in-memory data when persistence fails", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => travel.createTrip(values)).toThrow();
    expect(travel.trips).toHaveLength(0);
    expect(travel.activeId).toBeNull();
  });
  it("edits and deletes trips with cascade and active selection reset", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    await act(async () => travel.createTrip(values));
    const firstId = travel.activeId as string;
    await act(async () => travel.savePoint(firstId, airport));
    const pointId = getTrip(firstId).points?.[0].id as string;
    await act(async () => travel.saveEvent(firstId, { ...event, pointId }));
    await act(async () =>
      travel.saveTrip(firstId, {
        ...values,
        name: "Казань-2",
        description: "Обновлено",
      }),
    );
    expect(getTrip(firstId)).toMatchObject({
      name: "Казань-2",
      description: "Обновлено",
    });
    await act(async () => travel.createTrip({ ...values, name: "Вторая" }));
    const secondId = travel.activeId as string;
    await act(async () =>
      travel.saveTrip(firstId, {
        ...values,
        name: "Казань-3",
        description: "Обновлено из списка",
      }),
    );
    expect(getTrip(firstId).name).toBe("Казань-3");
    await act(async () => travel.selectTrip(firstId));
    await act(async () => travel.deleteTrip(firstId));
    expect(travel.activeId).toBe(secondId);
    expect(travel.trips.map((trip) => trip.id)).toEqual([secondId]);
  });
  it("rejects invalid booking links and date ranges that cut events", async () => {
    await act(async () => travel.login("alice"));
    await clearTrips();
    await act(async () => travel.createTrip(values));
    const tripId = travel.activeId as string;
    expect(() =>
      travel.saveEvent(tripId, {
        ...event,
        bookingUrl: "javascript:alert(1)",
      }),
    ).toThrow();
    await act(async () =>
      travel.saveEvent(tripId, {
        ...event,
        start: "2026-05-02T09:00",
        bookingUrl: "https://example.com/ticket",
      }),
    );
    expect(() =>
      travel.saveTrip(tripId, { ...values, endDate: "2026-05-01" }),
    ).toThrow();
  });
});
