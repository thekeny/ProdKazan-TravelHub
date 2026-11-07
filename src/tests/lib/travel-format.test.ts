import { describe, expect, it } from "vitest";
import { formatTripDates } from "@/lib/travel-format";

describe("formatTripDates", () => {
  it("keeps a single day with its full date", () => {
    expect(
      formatTripDates({ startDate: "2026-11-07", endDate: "2026-11-07" }),
    ).toBe("7 ноября 2026");
  });

  it("shortens a range inside one month", () => {
    expect(
      formatTripDates({ startDate: "2026-11-07", endDate: "2026-11-10" }),
    ).toBe("7–10 ноября 2026");
  });

  it("keeps both months when the range crosses one", () => {
    expect(
      formatTripDates({ startDate: "2026-11-30", endDate: "2026-12-02" }),
    ).toBe("30 ноября — 2 декабря 2026");
  });

  it("keeps both years when the range crosses one", () => {
    expect(
      formatTripDates({ startDate: "2026-12-28", endDate: "2027-01-03" }),
    ).toBe("28 декабря 2026 — 3 января 2027");
  });
});
