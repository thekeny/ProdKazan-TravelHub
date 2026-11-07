import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sdk from "@/api/generated/sdk.gen";
import type { Event, Trip, User, Waypoint } from "@/api/generated/types.gen";
import { RemoteTravelProvider } from "@/providers/remote-travel-provider";
import { useTravel } from "@/providers/travel-provider";

vi.mock("@/api/generated/sdk.gen");
const files = vi.hoisted(() => new Map<string, Blob>());
vi.mock("@/lib/material-storage", () => ({
  getMaterialFile: vi.fn(async (id: string) => files.get(id) ?? null),
  putMaterialFile: vi.fn(async (id: string, blob: Blob) => {
    files.set(id, blob);
  }),
  deleteMaterialFiles: vi.fn(async (ids: string[]) => {
    for (const id of ids) files.delete(id);
  }),
}));
const user = { id: "1568610886538672010", username: "traveler" } satisfies User;
const trip = {
  id: "1568610886538672011",
  name: "Trip",
  startedOn: "2026-11-07",
  endedOn: "2026-11-10",
} satisfies Trip;
const point = {
  id: "1568610886538672012",
  name: "Museum",
  latitude: 55,
  longitude: 49,
} satisfies Waypoint;
const event = {
  id: "1568610886538672013",
  title: "Visit",
  type: "tour",
  startedAt: "2026-11-07T10:00:00",
  waypointId: point.id,
} satisfies Event;
const values = {
  name: "Edited",
  description: "",
  startDate: trip.startedOn,
  endDate: trip.endedOn,
  cover: null,
};
const ok = <T,>(data: T) => ({
  data,
  error: undefined,
  request: new Request("https://example.com"),
  response: new Response(JSON.stringify(data), { status: 200 }),
});
const fail = (status: number) => ({
  data: undefined,
  request: new Request("https://example.com"),
  error: {},
  response: new Response(null, { status }),
});
let travel: ReturnType<typeof useTravel>;
let root: Root;
let container: HTMLDivElement;
function Probe() {
  travel = useTravel();
  return null;
}
async function mount() {
  root = createRoot(container);
  await act(async () => {
    root.render(
      <RemoteTravelProvider>
        <Probe />
      </RemoteTravelProvider>,
    );
  });
  await vi.waitFor(async () => {
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    expect(travel.ready).toBe(true);
  });
}
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
  vi.resetAllMocks();
  localStorage.clear();
  files.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // Response wrappers are intentionally mocked at the SDK boundary, while
  // provider validation, mapping, session handling and reconciliation run fully.
  vi.mocked(sdk.authGetSelf).mockResolvedValue(ok(user));
  vi.mocked(sdk.tripsGetTrips).mockResolvedValue(ok([trip]));
  vi.mocked(sdk.pointsGetPoints).mockResolvedValue(ok([point]));
  vi.mocked(sdk.eventsGetEvents).mockResolvedValue(ok([event]));
  vi.mocked(sdk.transfersGetTransfers).mockResolvedValue(ok([]));
  container = document.createElement("div");
  document.body.append(container);
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("remote travel state", () => {
  it("rejects invalid input before API calls and allows unchanged historical dates", async () => {
    const snapshot = travel.trips;
    await expect(
      travel.createTrip({ ...values, startDate: "2026-11-06" }),
    ).rejects.toThrow();
    await expect(
      travel.saveTrip(trip.id, { ...values, name: "a".repeat(101) }),
    ).rejects.toThrow();
    await expect(
      travel.savePoint(trip.id, {
        name: "a".repeat(101),
        description: "",
        lat: 55,
        lng: 49,
      }),
    ).rejects.toThrow();
    const eventValues = {
      title: event.title,
      type: event.type,
      description: "",
      start: "2026-11-07T10:00",
      end: "",
      pointId: point.id,
      materials: [],
      bookingUrl: "",
    };
    await expect(
      travel.saveEvent(trip.id, { ...eventValues, title: "a".repeat(121) }),
    ).rejects.toThrow();
    expect(sdk.tripsPostTrip).not.toHaveBeenCalled();
    expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    expect(sdk.pointsPostPoint).not.toHaveBeenCalled();
    expect(sdk.eventsPostEvent).not.toHaveBeenCalled();
    expect(travel.trips).toBe(snapshot);

    vi.setSystemTime(new Date(2027, 10, 7, 12));
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(ok(trip));
    vi.mocked(sdk.eventsPatchEvent).mockResolvedValue(ok(event));
    await act(async () => travel.saveTrip(trip.id, values));
    await act(async () => travel.saveEvent(trip.id, eventValues, event.id));
    expect(sdk.tripsPatchTrip).toHaveBeenCalledOnce();
    expect(sdk.eventsPatchEvent).toHaveBeenCalledOnce();
    await expect(
      travel.saveEvent(
        trip.id,
        { ...eventValues, start: "2026-11-07T11:00" },
        event.id,
      ),
    ).rejects.toThrow();
    expect(sdk.eventsPatchEvent).toHaveBeenCalledOnce();
  });

  it("stores uploaded covers outside the API and restores them only for the current account", async () => {
    const cover = "data:image/webp;base64,dGVzdA==";
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(
      ok({ ...trip, cover: null }),
    );
    await act(async () => travel.saveTrip(trip.id, { ...values, cover }));
    expect(sdk.tripsPatchTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ cover: null }),
      }),
    );
    expect(travel.trips[0].cover).toBe(cover);
    expect(localStorage.getItem(`travelhub.remote.${user.id}`)).not.toContain(
      "base64",
    );
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].cover).toBe(cover);
    await act(async () => root.unmount());
    vi.mocked(sdk.authGetSelf).mockResolvedValue(
      ok({ ...user, id: "1568610886538672099" }),
    );
    await mount();
    expect(travel.trips[0].cover).toBeNull();
  });

  it("does not restore an uploaded cover after it is removed", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(
      ok({ ...trip, cover: null }),
    );
    await act(async () =>
      travel.saveTrip(trip.id, {
        ...values,
        cover: "data:image/webp;base64,dGVzdA==",
      }),
    );
    await act(async () => travel.saveTrip(trip.id, values));
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].cover).toBeNull();
  });

  it("restores the server session and complete trip graph without rounding IDs", () => {
    expect(travel.ready).toBe(true);
    expect(travel.username).toBe(user.username);
    expect(travel.activeId).toBe(trip.id);
    expect(travel.trips[0].events?.[0].pointId).toBe(point.id);
    expect(
      String(vi.mocked(sdk.pointsGetPoints).mock.calls[0][0].path.tripId),
    ).toBe(trip.id);
  });
  it("leaves state intact when saving fails, and uses the server response on success", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValueOnce(fail(500));
    await act(async () => {
      await expect(travel.saveTrip(trip.id, values)).rejects.toThrow();
    });
    expect(travel.trips[0].name).toBe("Trip");
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValueOnce(
      ok({ ...trip, name: "Server value" }),
    );
    await act(async () => travel.saveTrip(trip.id, values));
    expect(travel.trips[0].name).toBe("Server value");
    expect(travel.trips[0].points?.[0].id).toBe(point.id);
  });
  it("deletes nested records before deleting a trip", async () => {
    vi.mocked(sdk.eventsRemoveEvent).mockResolvedValue(ok(undefined));
    vi.mocked(sdk.pointsRemovePoint).mockResolvedValue(ok(undefined));
    vi.mocked(sdk.tripsRemoveTrip).mockResolvedValue(ok(undefined));
    await act(async () => travel.deleteTrip(trip.id));
    expect(travel.trips).toEqual([]);
    expect(
      vi.mocked(sdk.eventsRemoveEvent).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(sdk.pointsRemovePoint).mock.invocationCallOrder[0],
    );
    expect(
      vi.mocked(sdk.pointsRemovePoint).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(sdk.tripsRemoveTrip).mock.invocationCallOrder[0]);
  });
  it("reloads the graph after a compound delete partially fails", async () => {
    vi.mocked(sdk.eventsRemoveEvent).mockResolvedValue(ok(undefined));
    vi.mocked(sdk.eventsGetEvents).mockResolvedValue(ok([]));
    vi.mocked(sdk.pointsRemovePoint).mockResolvedValue(fail(500));
    await act(async () => {
      await expect(travel.deleteTrip(trip.id)).rejects.toThrow();
    });
    expect(travel.trips[0].events).toEqual([]);
    expect(travel.trips[0].points).toHaveLength(1);
    expect(sdk.tripsRemoveTrip).not.toHaveBeenCalled();
  });
  it("preserves local material metadata when the server session is restored", async () => {
    const material = {
      id: "photo1",
      name: "Photo",
      kind: "photo" as const,
      mimeType: "image/jpeg",
      size: 10,
      createdAt: "2026-11-07T10:00:00Z",
    };
    vi.mocked(sdk.eventsPatchEvent).mockResolvedValue(ok(event));
    await act(async () =>
      travel.saveEvent(
        trip.id,
        {
          ...travel.trips[0].events?.[0],
          title: "Visit",
          type: "tour",
          start: "2026-11-07T10:00",
          end: "",
          description: "",
          pointId: point.id,
          materials: [material],
          bookingUrl: "",
        },
        event.id,
      ),
    );
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].events?.[0].materials).toEqual([material]);
  });
  it("clears server data when the session expires", async () => {
    vi.mocked(sdk.tripsPostTrip).mockResolvedValue(fail(401));
    await act(async () => {
      await expect(travel.createTrip(values)).rejects.toThrow();
    });
    expect(travel.username).toBeNull();
    expect(travel.trips).toEqual([]);
  });
  it("passes registration and passwords to the SDK without storing credentials", async () => {
    vi.mocked(sdk.authRegister).mockResolvedValue(ok(user));
    vi.mocked(sdk.authLogin).mockResolvedValue(
      ok({ access_token: "server-only", token_type: "bearer" as const }),
    );
    await act(async () => travel.login("traveler", "Secret123", true));
    expect(sdk.authRegister).toHaveBeenCalledWith({
      body: { username: "traveler", password: "Secret123" },
    });
    expect(sdk.authLogin).toHaveBeenCalledWith({
      body: {
        username: "traveler",
        password: "Secret123",
        grant_type: "password",
      },
    });
    expect(JSON.stringify(localStorage)).not.toContain("Secret123");
  });
});
