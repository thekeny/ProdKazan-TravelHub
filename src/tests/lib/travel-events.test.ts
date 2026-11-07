import { describe, expect, it } from "vitest";
import type { EventValues } from "@/configs/types/event.type";
import {
  eventsForDay,
  formatEventDateRange,
  tripDays,
  validateEvent,
} from "@/lib/travel-events";

const trip = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-03",
  cover: null,
};
const event: EventValues = {
  title: "Прогулка",
  type: "walk",
  start: "2026-05-01T23:00",
  end: "2026-05-02T01:00",
  description: "",
  pointId: null,
  materials: [],
  bookingUrl: "",
};

describe("trip events", () => {
  it("accepts an event across midnight and keeps it on its starting day", () => {
    expect(validateEvent(event, trip)).toBeNull();
    expect(eventsForDay([{ ...event, id: "one" }], "2026-05-01")).toHaveLength(
      1,
    );
    expect(eventsForDay([{ ...event, id: "one" }], "2026-05-02")).toHaveLength(
      0,
    );
  });
  it("rejects invalid calendar dates, times, boundaries and points", () => {
    for (const patch of [
      { title: " " },
      { start: "2026-02-30T12:00" },
      { start: "2026-05-01T24:00" },
      { start: "2026-04-30T12:00" },
      { end: "2026-05-04T01:00" },
      { end: "2026-05-01T22:00" },
    ]) {
      expect(validateEvent({ ...event, ...patch }, trip)).toBeTruthy();
    }
    expect(
      validateEvent({ ...event, pointId: "missing" }, trip, new Set(["other"])),
    ).toBeTruthy();
    expect(
      validateEvent({ ...event, pointId: "point" }, trip, new Set(["point"])),
    ).toBeNull();
  });
  it("sorts chronologically and lists inclusive trip dates", () => {
    const early = { ...event, id: "early", start: "2026-05-01T09:00" };
    expect(
      eventsForDay([{ ...event, id: "late" }, early], "").map(
        (item) => item.id,
      ),
    ).toEqual(["early", "late"]);
    expect(tripDays(trip)).toEqual(["2026-05-01", "2026-05-02", "2026-05-03"]);
  });
  it("shortens an event range that ends on the same day", () => {
    expect(formatEventDateRange("2026-05-01T13:30", "2026-05-01T14:30")).toBe(
      "1 мая в 13:30 — 14:30",
    );
    expect(formatEventDateRange("2026-05-01T23:00", "2026-05-02T01:00")).toBe(
      "1 мая в 23:00 — 2 мая в 01:00",
    );
    expect(formatEventDateRange("2026-05-01T13:30", "")).toBe("1 мая в 13:30");
  });
});
