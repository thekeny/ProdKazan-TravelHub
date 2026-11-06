import { describe, expect, it } from "vitest";
import { buildDemoTrip } from "@/lib/demo-trip";
import { validateEvent } from "@/lib/travel-events";
import { validateLeg, validatePoint } from "@/lib/travel-route";
import { validateTrip } from "@/lib/travel-storage";

describe("demo trip", () => {
  const trip = buildDemoTrip(new Date(2026, 4, 1));

  it("builds a valid four-day trip with points, legs and events", () => {
    expect(validateTrip(trip)).toBeNull();
    expect(trip.startDate).toBe("2026-05-01");
    expect(trip.endDate).toBe("2026-05-04");
    expect(trip.points?.length).toBeGreaterThan(3);
    expect(trip.legs?.length).toBeGreaterThan(3);
    expect(trip.events?.length).toBeGreaterThan(3);
    for (const point of trip.points ?? [])
      expect(validatePoint(point)).toBeNull();
    const pointIds = new Set((trip.points ?? []).map((point) => point.id));
    for (const leg of trip.legs ?? [])
      expect(validateLeg(leg, trip, trip.points ?? [])).toBeNull();
    for (const event of trip.events ?? []) {
      expect(validateEvent(event, trip, pointIds)).toBeNull();
      expect(event.materials).toEqual([]);
    }
  });

  it("creates unique identifiers for every entity", () => {
    const ids = [
      trip.id,
      ...(trip.points ?? []).map((point) => point.id),
      ...(trip.legs ?? []).map((leg) => leg.id),
      ...(trip.events ?? []).map((event) => event.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
