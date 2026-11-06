import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP } from "@/configs/consts/app.const";
import {
  emptyState,
  normalizeUsername,
  readState,
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
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("travel validation", () => {
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
  it("starts empty and normalizes usernames", () => {
    expect(readState()).toEqual(emptyState());
    expect(normalizeUsername(" Alice ")).toBe("alice");
  });
  it("restores separate account data and active selection", () => {
    const state = {
      username: "alice",
      accounts: {
        alice: { trips: [{ ...trip, id: "one" }], activeId: "one" },
        bob: { trips: [], activeId: null },
      },
    };
    writeState(state);
    expect(readState()).toEqual(state);
  });
  it("rejects corrupt JSON and invalid trip data", () => {
    localStorage.setItem(APP.STORAGE_KEY, "{");
    expect(readState).toThrow();
    localStorage.setItem(
      APP.STORAGE_KEY,
      JSON.stringify({
        username: "alice",
        accounts: { alice: { trips: [{}], activeId: null } },
      }),
    );
    expect(readState).toThrow();
  });
  it("reports unavailable reads and failed writes without losing saved data", () => {
    writeState(emptyState());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() => writeState({ username: "alice", accounts: {} })).toThrow(
      "Не удалось сохранить",
    );
    expect(readState()).toEqual(emptyState());
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readState).toThrow();
  });
});
