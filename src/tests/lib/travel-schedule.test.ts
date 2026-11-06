import { describe, expect, it } from "vitest";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { findScheduleIssues } from "@/lib/travel-schedule";

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
  start: "2026-05-01T11:00",
  end: "2026-05-01T12:00",
  description: "",
};
const event: TripEvent = {
  id: "event",
  title: "Заселение",
  type: "stay",
  start: "2026-05-01T13:00",
  end: "2026-05-01T13:30",
  description: "",
  pointId: "hotel",
  materials: [],
  bookingUrl: "",
};

describe("schedule check", () => {
  it("returns no issues for a consistent day", () => {
    expect(findScheduleIssues([event], [leg], [airport, hotel])).toEqual([]);
  });

  it("finds overlapping events and movements", () => {
    const overlappingEvent: TripEvent = {
      ...event,
      id: "event-two",
      title: "Экскурсия",
      start: "2026-05-01T12:30",
      end: "2026-05-01T14:00",
    };
    const overlappingLeg: TripLeg = {
      ...leg,
      id: "leg-two",
      start: "2026-05-01T11:30",
      end: "2026-05-01T12:30",
    };
    const issues = findScheduleIssues(
      [event, overlappingEvent],
      [leg, overlappingLeg],
      [airport, hotel],
    );
    expect(issues.map((issue) => issue.title)).toEqual(
      expect.arrayContaining([
        "События пересекаются",
        "Перемещения пересекаются",
        "Нарушена последовательность перемещений",
      ]),
    );
  });

  it("warns when an event starts before arrival at its point", () => {
    const early: TripEvent = {
      ...event,
      start: "2026-05-01T11:30",
      end: "2026-05-01T12:30",
    };
    const issues = findScheduleIssues([early], [leg], [airport, hotel]);
    expect(issues.map((issue) => issue.title)).toContain(
      "Событие начинается до прибытия",
    );
  });
});
