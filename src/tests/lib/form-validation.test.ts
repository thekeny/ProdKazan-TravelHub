import { describe, expect, it } from "vitest";
import {
  authErrors,
  eventErrors,
  legErrors,
  pointErrors,
  tripErrors,
} from "@/lib/form-validation";

const trip = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-04",
  cover: null,
};
const point = {
  id: "point",
  name: "Кремль",
  description: "",
  lat: 55,
  lng: 49,
};

describe("form validation", () => {
  it("preserves local login rules and validates remote names and registration passwords", () => {
    expect(
      authErrors(
        { username: "Путешественник", password: "", confirm: "" },
        false,
        false,
      ),
    ).toEqual({});
    expect(
      authErrors(
        { username: "Путешественник", password: "short", confirm: "other" },
        true,
        true,
      ),
    ).toHaveProperty("username");
    expect(
      authErrors(
        { username: "user", password: "short", confirm: "other" },
        true,
        true,
      ),
    ).toMatchObject({
      password: expect.any(String),
      confirm: expect.any(String),
    });
  });
  it("validates optional URLs and missing coordinates", () => {
    expect(
      tripErrors({ ...trip, cover: "javascript:alert(1)" }, true),
    ).toHaveProperty("cover");
    expect(pointErrors({ ...point, lat: Number.NaN, lng: 181 })).toMatchObject({
      lat: expect.any(String),
      lng: expect.any(String),
    });
  });
  it("accepts overnight local events and rejects stale point selections", () => {
    const event = {
      title: "Прогулка",
      type: "walk" as const,
      start: "2026-05-01T23:00",
      end: "2026-05-02T01:00",
      description: "",
      pointId: point.id,
      materials: [],
      bookingUrl: "",
    };
    expect(eventErrors(event, trip, [point])).toEqual({});
    expect(eventErrors(event, trip, [])).toHaveProperty("pointId");
    expect(
      eventErrors({ ...event, end: "2026-05-05T01:00" }, trip, [point]),
    ).toHaveProperty("end");
  });
  it("rejects identical endpoints and unknown transport", () => {
    const leg = {
      fromPointId: point.id,
      toPointId: point.id,
      transport: "car" as const,
      start: "2026-05-01T09:00",
      end: "2026-05-01T10:00",
      description: "",
    };
    expect(legErrors(leg, trip, [point])).toHaveProperty("toPointId");
  });
});
