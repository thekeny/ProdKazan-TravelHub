import { describe, expect, it } from "vitest";
import type { TicketKind, TicketPreview } from "@/api/generated/types.gen";
import type { Trip } from "@/configs/types/travel.type";
import {
  ticketBody,
  ticketErrors,
  ticketTimestamp,
  ticketValues,
} from "@/lib/tickets";

const trip: Trip = {
  id: "123",
  name: "Поездка",
  description: "",
  startDate: "2020-01-01",
  endDate: "2020-01-03",
  cover: null,
};
const place = {
  name: "Казань",
  address: "Аэропорт",
  point: {
    name: "Казань",
    address: "Аэропорт",
    latitude: 55.6,
    longitude: 49.3,
  },
};
function preview(kind: TicketKind): TicketPreview {
  return {
    kind,
    departure: place,
    arrival: place,
    stay: place,
    startedAt: "2020-01-02T15:00:00+03:00",
    endedAt: "2020-01-02T13:00:00+00:00",
    readyToApply: true,
  };
}
describe("ticket confirmation", () => {
  it.each(["plane", "train", "ship", "stay"] as const)(
    "builds confirmed %s without browser timezone conversion",
    (kind) => {
      const values = ticketValues(preview(kind));
      expect(ticketErrors(values, trip)).toEqual({});
      const body = ticketBody(values);
      expect(body.startedAt).toBe("2020-01-02T15:00:00+03:00");
      expect(body.endedAt).toBe("2020-01-02T13:00:00+00:00");
      expect(
        kind === "stay"
          ? "stay" in body
          : "departure" in body && "arrival" in body,
      ).toBe(true);
      expect(body).not.toHaveProperty("point");
    },
  );
  it("requires coordinates and explicit timezone even if preview says ready", () => {
    const values = ticketValues({
      kind: "plane",
      readyToApply: true,
      startedAtHint: {
        month: 1,
        day: 2,
        localTime: "15:00",
        localDate: "2020-01-02",
        timeZone: "Europe/Moscow",
      },
    });
    expect(values.start).toBe("2020-01-02T15:00");
    expect(ticketErrors(values, trip)).toMatchObject({
      departureLatitude: expect.any(String),
      arrivalLongitude: expect.any(String),
      startOffset: expect.any(String),
    });
  });
  it("checks trip boundaries and ordering by UTC and permits historical dates", () => {
    const values = ticketValues(preview("stay"));
    expect(
      ticketErrors({ ...values, start: "2020-01-01T01:00" }, trip),
    ).toHaveProperty("start");
    expect(
      ticketErrors({ ...values, end: "2020-01-02T11:00" }, trip),
    ).toHaveProperty("end");
    expect(ticketErrors(values, trip)).toEqual({});
  });
  it("omits an absent end and rejects invalid dates and offsets", () => {
    expect(
      ticketBody({ ...ticketValues(preview("stay")), end: "" }),
    ).not.toHaveProperty("endedAt");
    expect(ticketTimestamp("2020-02-30T12:00", "+00:00")).toBeNull();
    expect(ticketTimestamp("2020-01-01T12:00", "+14:30")).toBeNull();
    expect(ticketTimestamp("2020-01-01T12:00", "")).toBeNull();
  });
});
