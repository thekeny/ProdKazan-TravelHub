import { describe, expect, it } from "vitest";
import {
  apiId,
  apiResult,
  eventBody,
  legBody,
  mapEvent,
  mapLeg,
} from "@/lib/travel-api";

describe("backend adapters", () => {
  it("preserves every digit of int64 IDs in paths and JSON bodies", () => {
    const id = "1568610886538672011";
    expect(String(apiId(id))).toBe(id);
    expect(JSON.stringify({ waypointId: apiId(id) })).toBe(
      `{"waypointId":"${id}"}`,
    );
    expect(() => apiId("../auth/me")).toThrow();
    expect(() => apiId("9223372036854775808")).toThrow();
  });
  it("sends event and ship times in UTC without shifting the form clock", () => {
    const values = {
      title: "Museum",
      type: "tour" as const,
      start: "2026-11-07T23:30",
      end: "2026-11-08T00:30",
      description: "",
      pointId: "1568610886538672011",
      materials: [],
      bookingUrl: "",
    };
    const event = eventBody(values);
    expect(event.startedAt).toBe("2026-11-07T23:30:00Z");
    expect(event.endedAt).toBe("2026-11-08T00:30:00Z");
    expect(
      mapEvent({ ...event, id: "1", waypointId: values.pointId }).start,
    ).toBe(values.start);
    const leg = legBody({
      ...values,
      fromPointId: values.pointId,
      toPointId: "2",
      transport: "ship",
    });
    expect(leg.startedAt).toBe("2026-11-07T23:30:00Z");
    expect(
      mapLeg({
        ...leg,
        id: "3",
        startsAtWaypointId: values.pointId,
        endsAtWaypointId: "2",
      }),
    ).toMatchObject({ end: values.end, transport: "ship" });
  });
  it("turns authorization and validation failures into actionable errors", async () => {
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 401 }),
          error: {},
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      apiResult(
        Promise.resolve({
          response: new Response(null, { status: 409 }),
          error: { errorCode: "UsernameIsAlreadyInUse" },
        }),
      ),
    ).rejects.toThrow("Это имя пользователя уже занято.");
  });
});
