import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP } from "@/configs/consts/app.const";
import {
  emptyState,
  normalizeUsername,
  readState,
  readStateWithReport,
  validateTrip,
  writeState,
} from "@/lib/travel-storage";

const trip = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-03",
  cover: null,
};
const point = {
  id: "point",
  name: "Кремль",
  description: "",
  lat: 55.8,
  lng: 49.1,
};
const leg = {
  id: "leg",
  fromPointId: "point",
  toPointId: "point-two",
  transport: "car",
  start: "2026-05-01T11:30",
  end: "2026-05-01T12:15",
  description: "",
};
const pointTwo = { ...point, id: "point-two", name: "Гостиница" };
const event = {
  id: "event",
  title: "Музей",
  type: "tour",
  start: "2026-05-01T10:00",
  end: "",
  description: "",
  pointId: "point",
  materials: [],
  bookingUrl: "",
};

function save(state: unknown) {
  localStorage.setItem(APP.STORAGE_KEY, JSON.stringify(state));
}

function accountState(trips: unknown[]) {
  return {
    username: "alice",
    accounts: { alice: { trips, activeId: "trip" } },
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("travel validation", () => {
  it("restores custom types and skips damaged types without losing the event", () => {
    save(
      accountState([
        {
          ...trip,
          id: "trip",
          points: [point],
          eventTypes: ["Кофе", 123, "Музей"],
          events: [{ ...event, customType: "Кофе" }],
        },
      ]),
    );
    const result = readStateWithReport();
    expect(result.state.accounts.alice.trips[0].eventTypes).toEqual([
      "Кофе",
      "Музей",
    ]);
    expect(result.state.accounts.alice.trips[0].events?.[0].customType).toBe(
      "Кофе",
    );
    expect(result.dropped).toBe(1);
  });
  it("accepts past trips and a single day", () => {
    expect(validateTrip(trip)).toBeNull();
    expect(validateTrip({ ...trip, endDate: trip.startDate })).toBeNull();
  });
  it("rejects empty names, invalid dates and reversed dates", () => {
    expect(validateTrip({ ...trip, name: "  " })).toBeTruthy();
    expect(validateTrip({ ...trip, startDate: "2026-02-30" })).toBeTruthy();
    expect(validateTrip({ ...trip, endDate: "2026-04-30" })).toBeTruthy();
  });
});
describe("travel storage", () => {
  it("salvages valid records when part of the state is broken", () => {
    save(
      accountState([
        {
          ...trip,
          id: "trip",
          points: [point, pointTwo],
          legs: [leg],
          events: [event],
        },
      ]),
    );
    const restored = readState().accounts.alice.trips[0];
    expect(restored.events?.[0]).toMatchObject(event);
    expect(restored.points).toHaveLength(2);
    expect(restored.legs).toHaveLength(1);

    save(
      accountState([
        {
          ...trip,
          id: "trip",
          points: [{ ...point, lat: "55" }, pointTwo],
          legs: [leg],
          events: [event],
        },
      ]),
    );
    const withoutPoint = readState().accounts.alice.trips[0];
    expect(withoutPoint.points?.map((item) => item.id)).toEqual(["point-two"]);
    expect(withoutPoint.legs).toEqual([]);
    expect(withoutPoint.events?.[0].pointId).toBeNull();

    save(
      accountState([
        {
          ...trip,
          id: "trip",
          points: [point, pointTwo],
          legs: [{ ...leg, toPointId: "missing" }],
          events: [{ ...event, pointId: "missing" }],
        },
      ]),
    );
    const dangling = readState().accounts.alice.trips[0];
    expect(dangling.legs).toEqual([]);
    expect(dangling.events?.[0].pointId).toBeNull();

    save(
      accountState([
        {
          ...trip,
          id: "trip",
          points: [point, { ...point, name: "Дубль" }],
          legs: [],
          events: [event, { ...event, title: "Дубль" }],
        },
      ]),
    );
    const duplicates = readState().accounts.alice.trips[0];
    expect(duplicates.points).toHaveLength(1);
    expect(duplicates.events).toHaveLength(1);
    expect(duplicates.events?.[0].title).toBe("Музей");

    save(
      accountState([
        { ...trip, id: "trip", points: [point], legs: [], events: [] },
        { ...trip, id: "broken", name: " ", points: [] },
      ]),
    );
    const report = readStateWithReport();
    expect(report.state.accounts.alice.trips.map((item) => item.id)).toEqual([
      "trip",
    ]);
    expect(report.dropped).toBeGreaterThan(0);
  });
  it("migrates legacy event places into route points", () => {
    save(
      accountState([
        {
          ...trip,
          id: "trip",
          events: [
            {
              id: "event",
              title: "Музей",
              type: "tour",
              start: "2026-05-01T10:00",
              end: "",
              description: "",
              place: { name: "Кремль", lat: 55.8, lng: 49.1 },
            },
          ],
        },
      ]),
    );
    const state = readState();
    const saved = state.accounts.alice.trips[0];
    expect(saved.points).toHaveLength(1);
    expect(saved.points?.[0]).toMatchObject({
      name: "Кремль",
      lat: 55.8,
      lng: 49.1,
    });
    expect(saved.events?.[0].pointId).toBe(saved.points?.[0].id);
    expect(saved.events?.[0]).not.toHaveProperty("place");
    expect(saved.legs).toEqual([]);
  });
  it("normalizes missing collections and keeps empty data", () => {
    save(accountState([{ ...trip, id: "trip" }]));
    expect(readState().accounts.alice.trips[0]).toMatchObject({
      points: [],
      legs: [],
      events: [],
    });
    expect(readState()).not.toEqual(emptyState());
    localStorage.clear();
    expect(readState()).toEqual(emptyState());
    expect(normalizeUsername(" Alice ")).toBe("alice");
  });
  it("fills optional fields in older records and resets dangling selection", () => {
    save({
      username: "alice",
      accounts: {
        alice: {
          activeId: "missing",
          trips: [
            {
              id: "trip",
              name: "Поездка",
              startDate: "2026-05-01",
              endDate: "2026-05-02",
              cover: null,
              events: [
                {
                  id: "event",
                  title: "Музей",
                  type: "tour",
                  start: "2026-05-01T10:00",
                  pointId: "",
                },
              ],
            },
          ],
        },
      },
    });
    const account = readState().accounts.alice;
    expect(account.activeId).toBeNull();
    expect(account.trips[0].description).toBe("");
    expect(account.trips[0].events?.[0]).toMatchObject({
      end: "",
      description: "",
      pointId: null,
    });
  });
  it("rejects trips longer than a year", () => {
    expect(validateTrip({ ...trip, endDate: "2027-05-02" })).toBeTruthy();
  });
  it("restores separate account data and active selection", () => {
    const state = {
      username: "alice",
      accounts: {
        alice: {
          trips: [
            {
              ...trip,
              id: "one",
              points: [],
              legs: [],
              events: [],
            },
          ],
          activeId: "one",
        },
        bob: { trips: [], activeId: null },
      },
    };
    writeState(state);
    expect(readState()).toEqual(state);
  });
  it("rejects corrupt JSON and skips unrecoverable trips", () => {
    localStorage.setItem(APP.STORAGE_KEY, "{");
    expect(readState).toThrow();
    save({ username: "alice", accounts: { alice: { trips: [{}] } } });
    const report = readStateWithReport();
    expect(report.state.accounts.alice.trips).toEqual([]);
    expect(report.dropped).toBeGreaterThan(0);
  });
  it("reports unavailable reads and failed writes without losing saved data", () => {
    writeState(emptyState());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() => writeState({ username: "alice", accounts: {} })).toThrow(
      "Не хватает места",
    );
    expect(readState()).toEqual(emptyState());
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readState).toThrow();
  });
});
