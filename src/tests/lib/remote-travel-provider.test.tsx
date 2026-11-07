import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sdk from "@/api/generated/sdk.gen";
import type { Event, Trip, User, Waypoint } from "@/api/generated/types.gen";
import { AuthGuard } from "@/components/layout/auth-guard";
import { RemoteTravelProvider } from "@/providers/remote-travel-provider";
import { useTravel } from "@/providers/travel-provider";

vi.mock("@/api/generated/sdk.gen");
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
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
    expect(
      travel.ready ||
        container.textContent?.includes("Не удалось загрузить страницу"),
    ).toBe(true);
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
  it("changes the password without reloading trips or persisting passwords", async () => {
    vi.mocked(sdk.authChangePassword).mockResolvedValue({
      ...ok(undefined),
      response: new Response(null, { status: 204 }),
    });
    await act(async () => travel.changePassword("old-pass", "new-pass"));
    expect(sdk.authChangePassword).toHaveBeenCalledWith({
      body: { currentPassword: "old-pass", newPassword: "new-pass" },
    });
    expect(sdk.authGetSelf).toHaveBeenCalledTimes(1);
    expect(travel.username).toBe(user.username);
    expect(JSON.stringify(localStorage)).not.toContain("new-pass");
  });
  it("keeps the session and trip data when the current password is incorrect", async () => {
    vi.mocked(sdk.authChangePassword).mockResolvedValue(fail(403));
    await act(async () => {
      await expect(
        travel.changePassword("wrong-pass", "new-pass"),
      ).rejects.toThrow("Неверный текущий пароль.");
    });
    expect(travel.username).toBe(user.username);
    expect(travel.trips[0].id).toBe(trip.id);
  });
  it("rejects invalid passwords before sending a request", async () => {
    await act(async () => {
      await expect(travel.changePassword("", "short")).rejects.toThrow();
    });
    expect(sdk.authChangePassword).not.toHaveBeenCalled();
  });
  it("shows the server error screen if changing the password fails on the server", async () => {
    vi.mocked(sdk.authChangePassword).mockResolvedValue(fail(503));
    await act(async () => {
      await expect(
        travel.changePassword("old-pass", "new-pass"),
      ).rejects.toThrow();
    });
    expect(container.textContent).toContain("500");
  });
  it("shows the error page when loading trips fails after authentication", async () => {
    await act(async () => root.unmount());
    vi.mocked(sdk.tripsGetTrips).mockResolvedValue(fail(502));
    await mount();
    expect(container.textContent).toContain("500");
  });
  it.each([307, 400, 403, 404, 429])(
    "does not show 500 when restoring trips returns %s",
    async (status) => {
      await act(async () => root.unmount());
      vi.mocked(sdk.tripsGetTrips).mockResolvedValue(fail(status));
      await mount();
      expect(container.textContent).not.toContain("500");
      expect(container.textContent).toContain("Не удалось загрузить страницу");
      expect(navigation.replace).not.toHaveBeenCalled();
    },
  );
  it("does not show 500 on network failure", async () => {
    await act(async () => root.unmount());
    vi.mocked(sdk.authGetSelf).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await mount();
    expect(container.textContent).not.toContain("500");
    expect(container.textContent).toContain("Не удалось загрузить страницу");
  });
  it("shows the error page when a mutation returns a server error", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(fail(503));
    await act(async () => {
      await expect(travel.saveTrip(trip.id, values)).rejects.toThrow();
    });
    expect(container.textContent).toContain("500");
  });
  it.each([307, 400, 403, 404, 429])(
    "keeps the interface available when a mutation returns %s",
    async (status) => {
      vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(fail(status));
      await act(async () => {
        await expect(travel.saveTrip(trip.id, values)).rejects.toThrow();
      });
      expect(container.textContent).not.toContain("500");
      expect(travel.username).toBe(user.username);
      expect(travel.trips[0].name).toBe("Trip");
    },
  );
  it("keeps the interface available on a mutation network failure", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await act(async () => {
      await expect(travel.saveTrip(trip.id, values)).rejects.toThrow();
    });
    expect(container.textContent).not.toContain("500");
    expect(travel.username).toBe(user.username);
  });
  it("keeps unauthenticated sessions eligible for login", async () => {
    await act(async () => root.unmount());
    vi.mocked(sdk.authGetSelf).mockResolvedValue(fail(401));
    await mount();
    expect(travel.ready).toBe(true);
    expect(travel.username).toBeNull();
    expect(container.textContent).not.toContain("500");
  });
  it.each([500, 502, 503])(
    "shows the error page instead of redirecting to login on %s",
    async (status) => {
      await act(async () => root.unmount());
      vi.mocked(sdk.authGetSelf).mockResolvedValue(fail(status));
      root = createRoot(container);
      await act(async () => {
        root.render(
          <RemoteTravelProvider>
            <AuthGuard>
              <Probe />
            </AuthGuard>
          </RemoteTravelProvider>,
        );
      });
      await vi.waitFor(() =>
        expect(container.textContent).toContain(
          "Не удалось загрузить страницу",
        ),
      );
      expect(container.textContent).toContain("500");
      expect(navigation.replace).not.toHaveBeenCalled();
    },
  );
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
    expect(sdk.tripsPatchTrip).toHaveBeenLastCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ cover: null }),
      }),
    );
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

  it("uploads covers through the SDK and restores the server image path", async () => {
    const cover = "data:image/webp;base64,dGVzdA==";
    const serverTrip = { ...trip, cover: `/trips/${trip.id}/cover/photo.webp` };
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(ok(trip));
    vi.mocked(sdk.tripsPutTripCover).mockResolvedValue(ok(serverTrip));
    await act(async () => travel.saveTrip(trip.id, { ...values, cover }));
    expect(sdk.tripsPutTripCover).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { trip_id: trip.id },
        body: expect.any(Blob),
        headers: { "Content-Type": "image/webp" },
      }),
    );
    expect(travel.trips[0].cover).toBe(`/api/backend${serverTrip.cover}`);
    vi.mocked(sdk.tripsGetTrips).mockResolvedValue(ok([serverTrip]));
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].cover).toBe(`/api/backend${serverTrip.cover}`);
    await act(async () =>
      travel.saveTrip(trip.id, { ...values, cover: travel.trips[0].cover }),
    );
    expect(
      vi.mocked(sdk.tripsPatchTrip).mock.lastCall?.[0].body,
    ).not.toHaveProperty("cover");
  });

  it("does not restore an uploaded cover after it is removed", async () => {
    vi.mocked(sdk.tripsPutTripCover).mockResolvedValue(
      ok({ ...trip, cover: `/trips/${trip.id}/cover/photo.webp` }),
    );
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
    expect(sdk.tripsPatchTrip).toHaveBeenLastCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ cover: null }),
      }),
    );
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
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValueOnce(fail(409));
    await act(async () => {
      await expect(travel.saveTrip(trip.id, values)).rejects.toThrow();
    });
    expect(travel.trips[0].name).toBe("Trip");
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValueOnce(
      ok({ ...trip, name: "Server value" }),
    );
    await act(async () => travel.saveTrip(trip.id, values));
    expect(sdk.tripsPatchTrip).toHaveBeenLastCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ cover: null }),
      }),
    );
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
    vi.mocked(sdk.pointsRemovePoint).mockResolvedValue(fail(409));
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
