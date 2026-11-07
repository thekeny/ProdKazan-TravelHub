import { describe, expect, it } from "vitest";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import {
  buildTimeline,
  firstItemMinutes,
  legsForDay,
  minutesToTime,
  pointsForDay,
  positionAtTime,
  timeToMinutes,
  validateLeg,
  validatePoint,
} from "@/lib/travel-route";

const trip = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-03",
  cover: null,
};
const airport: RoutePoint = {
  id: "airport",
  name: "Аэропорт",
  description: "",
  lat: 55.6,
  lng: 49.3,
};
const hotel: RoutePoint = {
  id: "hotel",
  name: "Гостиница",
  description: "",
  lat: 55.8,
  lng: 49.1,
};
const leg: TripLeg = {
  id: "leg",
  fromPointId: "airport",
  toPointId: "hotel",
  transport: "car",
  start: "2026-05-01T11:30",
  end: "2026-05-01T12:15",
  description: "",
};
const event: TripEvent = {
  id: "event",
  title: "Заселение",
  type: "stay",
  start: "2026-05-01T13:00",
  end: "",
  description: "",
  pointId: "hotel",
  materials: [],
  bookingUrl: "",
};

describe("route points", () => {
  it("validates names and coordinates", () => {
    expect(validatePoint(airport)).toBeNull();
    expect(validatePoint({ ...airport, name: " " })).toBeTruthy();
    expect(validatePoint({ ...airport, lat: 91 })).toBeTruthy();
    expect(validatePoint({ ...airport, lng: Number.NaN })).toBeTruthy();
  });
});

describe("trip legs", () => {
  it("requires existing distinct points and valid times inside the trip", () => {
    expect(validateLeg(leg, trip, [airport, hotel])).toBeNull();
    expect(validateLeg({ ...leg, toPointId: "missing" }, trip, [airport])).toBe(
      "Выберите начальную и конечную точки маршрута.",
    );
    expect(validateLeg({ ...leg, toPointId: "airport" }, trip, [airport])).toBe(
      "Начальная и конечная точки должны различаться.",
    );
    expect(
      validateLeg({ ...leg, end: leg.start }, trip, [airport, hotel]),
    ).toBe(null);
    expect(
      validateLeg({ ...leg, end: "2026-05-01T11:00" }, trip, [airport, hotel]),
    ).toBeTruthy();
    expect(
      validateLeg({ ...leg, start: "2026-04-30T11:00" }, trip, [
        airport,
        hotel,
      ]),
    ).toBeTruthy();
  });
});

describe("day filtering", () => {
  it("keeps only points and legs of the selected day", () => {
    const farLeg = { ...leg, id: "far", start: "2026-05-02T10:00" };
    expect(
      legsForDay([leg, farLeg], "2026-05-01").map((item) => item.id),
    ).toEqual(["leg"]);
    expect(
      pointsForDay([airport, hotel], [event], [leg], "2026-05-01").map(
        (point) => point.id,
      ),
    ).toEqual(["airport", "hotel"]);
    expect(
      pointsForDay([airport, hotel], [event], [leg], "2026-05-02"),
    ).toEqual([]);
    const standalone = {
      ...hotel,
      id: "standalone",
      name: "Новая точка",
    };
    expect(
      pointsForDay(
        [airport, hotel, standalone],
        [event],
        [leg],
        "2026-05-02",
      ).map((point) => point.id),
    ).toEqual(["standalone"]);
    expect(pointsForDay([airport, hotel], [event], [leg], "")).toHaveLength(2);
  });
  it("merges events and legs into one chronological list", () => {
    expect(buildTimeline([event], [leg], "").map((item) => item.kind)).toEqual([
      "leg",
      "event",
    ]);
    expect(buildTimeline([event], [leg], "2026-05-02")).toEqual([]);
  });
});

describe("position by time", () => {
  const items = buildTimeline([event], [leg], "2026-05-01");

  it("formats and parses minutes", () => {
    expect(timeToMinutes("2026-05-01T11:30")).toBe(690);
    expect(minutesToTime(645)).toBe("10:45");
    expect(minutesToTime(1440)).toBe("24:00");
    expect(firstItemMinutes([event], [leg], "2026-05-01")).toBe(690);
    expect(firstItemMinutes([], [], "2026-05-01")).toBe(540);
  });

  it("interpolates the position inside a movement", () => {
    const position = positionAtTime(items, [airport, hotel], "2026-05-01", 713);
    expect(position.legId).toBe("leg");
    expect(position.pointId).toBeNull();
    expect(position.lat).toBeCloseTo(55.7);
    expect(position.lng).toBeCloseTo(49.2);
    expect(position.label).toContain("Аэропорт → Гостиница");
  });

  it("resolves an event point, free time and the time before the start", () => {
    expect(
      positionAtTime(items, [airport, hotel], "2026-05-01", 780),
    ).toMatchObject({ label: "Заселение", pointId: "hotel", lat: 55.8 });
    expect(
      positionAtTime(items, [airport, hotel], "2026-05-01", 900),
    ).toMatchObject({
      label: "Свободное время после «Заселение»",
      pointId: "hotel",
      item: null,
    });
    expect(
      positionAtTime(items, [airport, hotel], "2026-05-01", 480),
    ).toMatchObject({ pointId: "airport", item: null });
    expect(positionAtTime([], [airport], "2026-05-01", 480).item).toBeNull();
  });
});
