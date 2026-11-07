import { describe, expect, it } from "vitest";
import {
  dateInputBounds,
  dateRange,
  dateRangeError,
  textError,
} from "@/lib/input-validation";

describe("input boundaries", () => {
  const now = new Date(2026, 10, 7, 18, 30);

  it("requires non-whitespace text and checks the complete input length", () => {
    expect(textError(" ", 100, true)).toBeTruthy();
    expect(textError("я", 100, true)).toBeUndefined();
    expect(textError("я".repeat(100), 100, true)).toBeUndefined();
    expect(textError("я".repeat(101), 100, true)).toBeTruthy();
    expect(textError("", 512)).toBeUndefined();
    expect(textError(" ", 512)).toBeUndefined();
  });

  it("uses inclusive calendar boundaries without restricting today's time", () => {
    expect(dateRange(now)).toEqual({ min: "2026-11-07", max: "2036-11-07" });
    expect(dateRangeError("2026-11-06", undefined, now)).toBeTruthy();
    expect(dateRangeError("2026-11-07T00:00", undefined, now)).toBeUndefined();
    expect(dateRangeError("2036-11-07T23:59", undefined, now)).toBeUndefined();
    expect(dateRangeError("2036-11-08", undefined, now)).toBeTruthy();
    expect(dateRange(new Date(2026, 10, 8, 0, 1)).min).toBe("2026-11-08");
  });

  it("clamps the leap day and uses the browser's local calendar day", () => {
    expect(dateRange(new Date(2028, 1, 29, 23, 59))).toEqual({
      min: "2028-02-29",
      max: "2038-02-28",
    });
    expect(dateRange(new Date(2026, 10, 7, 0, 1)).min).toBe("2026-11-07");
  });

  it("exempts only the exact saved value, including its time", () => {
    const initial = "2020-05-01T09:00";
    expect(dateRangeError(initial, initial, now)).toBeUndefined();
    expect(dateRangeError("2020-05-01T10:00", initial, now)).toBeTruthy();
    expect(dateRangeError("2020-05-02T09:00", initial, now)).toBeTruthy();
    expect(dateInputBounds(initial, now)).toEqual({
      min: "2020-05-01",
      max: "2036-11-07",
    });
  });

  it("intersects trip dates and keeps the original historical day selectable", () => {
    const trip = { startDate: "2020-05-01", endDate: "2020-05-04" };
    expect(dateInputBounds("2020-05-02T09:00", now, trip)).toEqual({
      min: "2020-05-02",
      max: "2020-05-04",
    });
    expect(
      dateInputBounds(undefined, now, {
        startDate: "2026-11-10",
        endDate: "2036-11-10",
      }),
    ).toEqual({ min: "2026-11-10", max: "2036-11-07" });
  });
});
