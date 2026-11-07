import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authErrors,
  eventErrors,
  legErrors,
  passwordErrors,
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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 4, 1, 12));
});
afterEach(() => vi.useRealTimers());

describe("form validation", () => {
  it("requires the current password and matching new passwords within limits", () => {
    const values = {
      currentPassword: "old",
      newPassword: "new-pass",
      confirmPassword: "new-pass",
    };
    expect(passwordErrors(values)).toEqual({});
    expect(
      passwordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }),
    ).toMatchObject({
      currentPassword: expect.any(String),
      newPassword: expect.any(String),
      confirmPassword: expect.any(String),
    });
    expect(
      passwordErrors({ ...values, confirmPassword: "different" }),
    ).toHaveProperty("confirmPassword");
    expect(passwordErrors({ ...values, newPassword: "short" })).toHaveProperty(
      "newPassword",
    );
    expect(
      passwordErrors({ ...values, newPassword: "a".repeat(65) }),
    ).toHaveProperty("newPassword");
    expect(
      passwordErrors({ ...values, currentPassword: "a".repeat(65) }),
    ).toHaveProperty("currentPassword");
  });
  it("checks text and URL boundaries using the same rules for each domain", () => {
    expect(
      tripErrors({ ...trip, name: "я", description: "я".repeat(512) }, false),
    ).toEqual({});
    expect(
      tripErrors(
        { ...trip, name: "я".repeat(101), description: "я".repeat(513) },
        false,
      ),
    ).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
    });
    expect(pointErrors({ ...point, name: "я".repeat(100) })).toEqual({});
    expect(pointErrors({ ...point, name: "я".repeat(101) })).toHaveProperty(
      "name",
    );
    const cover = `https://example.com/${"a".repeat(480)}`;
    expect(tripErrors({ ...trip, cover }, true)).toEqual({});
    expect(tripErrors({ ...trip, cover: `${cover}aa` }, true)).toHaveProperty(
      "cover",
    );
  });

  it("validates date syntax before ranges and allows only unchanged saved dates", () => {
    const now = new Date(2026, 10, 7, 12);
    expect(tripErrors(trip, false, { now })).toMatchObject({
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
    expect(tripErrors(trip, false, { now, initial: trip })).toEqual({});
    expect(
      tripErrors({ ...trip, startDate: "2026-05-02" }, false, {
        now,
        initial: trip,
      }),
    ).toHaveProperty("startDate");
    expect(
      tripErrors({ ...trip, startDate: "2026-02-30" }, false, { now }),
    ).toHaveProperty("startDate");
    expect(
      tripErrors(
        { ...trip, startDate: "2036-11-07", endDate: "2036-11-07" },
        false,
        { now },
      ),
    ).toEqual({});
    expect(
      tripErrors(
        { ...trip, startDate: "2036-11-08", endDate: "2036-11-08" },
        false,
        { now },
      ),
    ).toHaveProperty("endDate");
  });

  it("retains account minimums and checks repeated passwords at the maximum", () => {
    for (const remote of [false, true]) {
      expect(
        authErrors(
          { username: "abc", password: "short", confirm: "short" },
          remote,
          true,
        ),
      ).toMatchObject({
        password: expect.any(String),
        confirm: expect.any(String),
      });
      const max = remote ? 64 : 128;
      expect(
        authErrors(
          {
            username: "abc",
            password: "a".repeat(max),
            confirm: "a".repeat(max),
          },
          remote,
          true,
        ),
      ).toEqual({});
      expect(
        authErrors(
          {
            username: "abc",
            password: "a".repeat(max + 1),
            confirm: "a".repeat(max + 1),
          },
          remote,
          true,
        ),
      ).toMatchObject({
        password: expect.any(String),
        confirm: expect.any(String),
      });
    }
  });

  it("checks event and leg dates against today, the horizon and their trip", () => {
    const now = new Date(2026, 10, 7, 12);
    const dates = { ...trip, startDate: "2026-11-06", endDate: "2026-11-08" };
    const points = [point, { ...point, id: "other" }];
    const event = {
      title: "Я",
      type: "walk" as const,
      description: "",
      start: "2026-11-07T00:00",
      end: "",
      pointId: null,
      materials: [],
      bookingUrl: "",
    };
    const leg = {
      fromPointId: point.id,
      toPointId: "other",
      transport: "car" as const,
      description: "",
      start: event.start,
      end: "2026-11-07T01:00",
    };
    expect(eventErrors(event, dates, points, { now })).toEqual({});
    expect(
      eventErrors({ ...event, title: "я".repeat(121) }, dates, points, { now }),
    ).toHaveProperty("title");
    expect(legErrors(leg, dates, points, { now })).toEqual({});
    expect(
      legErrors({ ...leg, description: "я".repeat(513) }, dates, points, {
        now,
      }),
    ).toHaveProperty("description");

    const past = { ...leg, start: "2026-11-06T09:00", end: "2026-11-06T10:00" };
    expect(legErrors(past, dates, points, { now })).toMatchObject({
      start: expect.any(String),
      end: expect.any(String),
    });
    expect(legErrors(past, dates, points, { now, initial: past })).toEqual({});
    expect(
      legErrors({ ...past, end: "2026-11-06T11:00" }, dates, points, {
        now,
        initial: past,
      }),
    ).toHaveProperty("end");

    const futureTrip = {
      ...trip,
      startDate: "2036-11-07",
      endDate: "2036-11-08",
    };
    expect(
      eventErrors({ ...event, start: "2036-11-07T23:59" }, futureTrip, points, {
        now,
      }),
    ).toEqual({});
    expect(
      eventErrors({ ...event, start: "2036-11-08T00:00" }, futureTrip, points, {
        now,
      }),
    ).toHaveProperty("start");
    expect(
      legErrors(
        { ...leg, start: "2036-11-07T23:00", end: "2036-11-08T00:00" },
        futureTrip,
        points,
        { now },
      ),
    ).toHaveProperty("end");
    expect(
      eventErrors({ ...event, end: "2026-11-09T00:00" }, dates, points, {
        now,
      }),
    ).toHaveProperty("end");
  });

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
