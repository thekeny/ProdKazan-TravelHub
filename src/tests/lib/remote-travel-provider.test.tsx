import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sdk from "@/api/generated/sdk.gen";
import type { Event, Trip, User, Waypoint } from "@/api/generated/types.gen";
import { AuthGuard } from "@/components/layout/auth-guard";
import { COLLABORATION } from "@/configs/consts/collaboration.const";
import { setConnected } from "@/lib/connectivity";
import {
  TravelProvider as RemoteTravelProvider,
  useTravel,
} from "@/providers/travel-provider";

const offline = vi.hoisted(() => ({ snapshot: null as unknown }));
vi.mock("@/lib/offline-cache", () => ({
  saveOfflineSnapshot: async (user: unknown, data: unknown) => {
    offline.snapshot = { user, data };
  },
  readOfflineSnapshot: async (account?: string) => {
    const snapshot = offline.snapshot as { user: User } | null;
    return account === undefined ||
      (snapshot?.user.id ?? snapshot?.user.username) === account
      ? snapshot
      : null;
  },
  clearOfflineSnapshot: async () => {
    offline.snapshot = null;
  },
}));

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
  vi.stubEnv("NEXT_PUBLIC_API_URL", "");
  vi.stubEnv("API_URL", "");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
  vi.resetAllMocks();
  localStorage.clear();
  files.clear();
  offline.snapshot = null;
  setConnected(true);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // Response wrappers are intentionally mocked at the SDK boundary, while
  // provider validation, mapping, session handling and reconciliation run fully.
  vi.mocked(sdk.authGetSelf).mockResolvedValue(ok(user));
  vi.mocked(sdk.tripsGetTrips).mockResolvedValue(ok([trip]));
  vi.mocked(sdk.pointsGetPoints).mockResolvedValue(ok([point]));
  vi.mocked(sdk.eventsGetEvents).mockResolvedValue(ok([event]));
  vi.mocked(sdk.transfersGetTransfers).mockResolvedValue(ok([]));
  vi.mocked(sdk.googleDriveStatus).mockResolvedValue(
    ok({ enabled: false, status: "disabled" }),
  );
  container = document.createElement("div");
  document.body.append(container);
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  setConnected(true);
});

describe("remote travel state", () => {
  it("persists trip materials independently of events and removes their files", async () => {
    const material = {
      id: "pdf",
      name: "ticket.pdf",
      mimeType: "application/pdf",
      size: 100,
      kind: "document" as const,
      createdAt: "2026-11-08T10:00:00Z",
    };
    files.set(material.id, new Blob(["%PDF-1.7"]));
    await act(async () => travel.addTripMaterials(trip.id, [material]));
    expect(travel.trips[0].materials).toEqual([material]);
    expect(sdk.eventsPostEvent).not.toHaveBeenCalled();
    expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].materials).toEqual([material]);
    await act(async () => travel.deleteTripMaterial(trip.id, material.id));
    expect(travel.trips[0].materials).toEqual([]);
    expect(files.has(material.id)).toBe(false);
  });

  it("keeps trip materials unchanged when local metadata cannot be saved", async () => {
    const writer = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
    try {
      await act(async () => {
        await expect(
          travel.addTripMaterials(trip.id, [
            {
              id: "pdf",
              name: "ticket.pdf",
              mimeType: "application/pdf",
              size: 100,
              kind: "document",
              createdAt: "2026-11-08T10:00:00Z",
            },
          ]),
        ).rejects.toThrow("браузере");
      });
      expect(travel.trips[0].materials).toEqual([]);
    } finally {
      writer.mockRestore();
    }
  });
  it("restores the server session even without a public API URL", () => {
    expect(sdk.authGetSelf).toHaveBeenCalled();
    expect(travel.username).toBe("traveler");
    expect(travel.ready).toBe(true);
  });

  it("keeps the account signed in and does not delete it after an incorrect password", async () => {
    vi.mocked(sdk.authLogin).mockResolvedValue(fail(401));
    await act(async () => {
      await expect(travel.deleteAccount("wrong-password")).rejects.toThrow(
        "Неверный текущий пароль.",
      );
    });
    expect(sdk.authDeleteSelf).not.toHaveBeenCalled();
    expect(travel.username).toBe(user.username);
    expect(travel.trips).toHaveLength(1);
  });

  it("verifies the password before deleting and clears the account only on success", async () => {
    vi.mocked(sdk.authLogin).mockResolvedValue(
      ok({ access_token: "token", token_type: "bearer" }),
    );
    vi.mocked(sdk.authDeleteSelf).mockResolvedValueOnce(fail(409));
    await act(async () => {
      await expect(travel.deleteAccount("current-password")).rejects.toThrow();
    });
    expect(travel.username).toBe(user.username);
    vi.mocked(sdk.authDeleteSelf).mockResolvedValue(ok(undefined));
    await act(async () => travel.deleteAccount("current-password"));
    expect(sdk.authLogin).toHaveBeenLastCalledWith({
      body: {
        grant_type: "password",
        username: user.username,
        password: "current-password",
      },
    });
    expect(travel.username).toBeNull();
    expect(travel.trips).toEqual([]);
    expect(offline.snapshot).toBeNull();
  });
  it("adds types immediately without a trip PATCH and persists them across reloads", async () => {
    const before = travel.trips[0];
    await act(async () => travel.addEventType(trip.id, " Утренний кофе "));
    expect(travel.trips[0]).toEqual({
      ...before,
      eventTypes: ["Утренний кофе"],
    });
    expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].eventTypes).toEqual(["Утренний кофе"]);
    await expect(travel.addEventType(trip.id, "утренний кофе")).rejects.toThrow(
      "уже добавлен",
    );
    const writer = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    try {
      await act(async () => {
        await expect(travel.addEventType(trip.id, "Музей")).rejects.toThrow(
          "Не удалось сохранить материалы или типы событий",
        );
      });
      expect(travel.trips[0].eventTypes).toEqual(["Утренний кофе"]);
      expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    } finally {
      writer.mockRestore();
    }
  });
  it("does not restore another account's trips when the current account's loading fails", async () => {
    await act(async () => root.unmount());
    vi.mocked(sdk.authGetSelf).mockResolvedValue(
      ok({ id: "other", username: "other" }),
    );
    vi.mocked(sdk.tripsGetTrips).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await mount();
    expect(container.textContent).toContain("Не удалось загрузить страницу");
    expect(container.textContent).not.toContain("500");
  });
  it("restores cached trips offline and rejects changes without calling the API", async () => {
    await act(async () => root.unmount());
    setConnected(false);
    vi.mocked(sdk.authGetSelf).mockClear();
    await mount();
    expect(travel.username).toBe(user.username);
    expect(travel.trips[0].points?.[0].id).toBe(point.id);
    expect(travel.trips[0].events?.[0].id).toBe(event.id);
    expect(sdk.authGetSelf).not.toHaveBeenCalled();
    await expect(travel.deleteTrip(trip.id)).rejects.toThrow("Вы оффлайн");
    expect(sdk.tripsRemoveTrip).not.toHaveBeenCalled();
    expect(travel.trips).toHaveLength(1);
  });

  it("falls back to the snapshot on network failure, but never on a confirmed 401", async () => {
    await act(async () => root.unmount());
    vi.mocked(sdk.authGetSelf).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await mount();
    expect(travel.username).toBe(user.username);
    await act(async () => root.unmount());
    setConnected(true);
    vi.mocked(sdk.authGetSelf).mockResolvedValue(fail(401));
    await mount();
    expect(travel.username).toBe(null);
    expect(offline.snapshot).toBe(null);
  });

  it("does not change local trip types in memory if writing them fails", async () => {
    const previous = travel.trips;
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    try {
      await act(async () => {
        await expect(
          travel.saveTrip(trip.id, {
            name: trip.name,
            description: "",
            startDate: trip.startedOn,
            endDate: trip.endedOn,
            cover: null,
            eventTypes: ["Музей"],
          }),
        ).rejects.toThrow("Не удалось сохранить материалы или типы событий");
      });
      expect(travel.trips).toBe(previous);
      expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    } finally {
      write.mockRestore();
    }
  });
  it("saves a local-only trip type change without issuing the failing PATCH", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(fail(500));
    await act(async () =>
      travel.saveTrip(trip.id, {
        name: trip.name,
        description: "",
        startDate: trip.startedOn,
        endDate: trip.endedOn,
        cover: null,
        eventTypes: ["Музей"],
      }),
    );
    expect(sdk.tripsPatchTrip).not.toHaveBeenCalled();
    expect(travel.trips[0].eventTypes).toEqual(["Музей"]);
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].eventTypes).toEqual(["Музей"]);
  });
  it("stores custom types locally, restores them after reload and keeps them out of API requests", async () => {
    vi.mocked(sdk.tripsPatchTrip).mockResolvedValue(ok(trip));
    await act(async () =>
      travel.saveTrip(trip.id, {
        ...values,
        eventTypes: ["Утренний кофе", "Музей"],
      }),
    );
    vi.mocked(sdk.eventsPatchEvent).mockResolvedValue(ok(event));
    await act(async () =>
      travel.saveEvent(
        trip.id,
        {
          title: event.title,
          type: event.type,
          customType: "Утренний кофе",
          start: "2026-11-07T10:00",
          end: "",
          description: "",
          pointId: point.id,
          materials: [],
          bookingUrl: "",
        },
        event.id,
      ),
    );
    expect(
      vi.mocked(sdk.eventsPatchEvent).mock.calls[0]?.[0]?.body,
    ).not.toHaveProperty("customType");
    expect(
      vi.mocked(sdk.tripsPatchTrip).mock.calls[0]?.[0]?.body,
    ).not.toHaveProperty("eventTypes");
    expect(travel.trips[0].events?.[0].customType).toBe("Утренний кофе");
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].eventTypes).toEqual(["Утренний кофе", "Музей"]);
    expect(travel.trips[0].events?.[0].customType).toBe("Утренний кофе");
  });
  it("creates invite codes and loads the collaborators of a server trip", async () => {
    vi.mocked(sdk.tripsGenerateCode).mockResolvedValue(
      ok({ code: "Invite-1", uses: 5 }),
    );
    vi.mocked(sdk.tripsGetTripByIdCollaborators).mockResolvedValue(
      ok({ owner: user, collaborators: [] }),
    );
    let invite: { code: string; uses: number } | undefined;
    await act(async () => {
      invite = await travel.generateInviteCode(trip.id, 5);
    });
    expect(invite).toEqual({ code: "Invite-1", uses: 5 });
    expect(sdk.tripsGenerateCode).toHaveBeenCalledWith({
      path: { trip_id: trip.id },
      query: { max_uses: 5 },
    });
    const collaborators = await travel.loadCollaborators(trip.id);
    expect(collaborators.owner.username).toBe(user.username);
    expect(sdk.tripsGetTripByIdCollaborators).toHaveBeenCalledWith({
      path: { trip_id: trip.id },
    });
  });

  it("joins by invite code, reloads trips and selects the new trip", async () => {
    const joinedTrip = {
      ...trip,
      id: "1568610886538672099",
      name: "Joined trip",
    } satisfies Trip;
    vi.mocked(sdk.tripsJoinTrip).mockResolvedValue(ok(undefined));
    vi.mocked(sdk.tripsGetTrips).mockResolvedValue(ok([trip, joinedTrip]));
    let joinedId: string | null = null;
    await act(async () => {
      joinedId = await travel.joinTrip("  Invite-1  ");
    });
    expect(joinedId).toBe(joinedTrip.id);
    expect(sdk.tripsJoinTrip).toHaveBeenCalledWith({
      path: { code: "Invite-1" },
    });
    expect(travel.activeId).toBe(joinedTrip.id);
    expect(travel.trips.map((item) => item.id)).toEqual([
      trip.id,
      joinedTrip.id,
    ]);
  });

  it("does not report a false join failure when the follow-up reload fails", async () => {
    vi.mocked(sdk.tripsJoinTrip).mockResolvedValue(ok(undefined));
    vi.mocked(sdk.tripsGetTrips).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    let joinedId: string | null = "not-set";
    await act(async () => {
      joinedId = await travel.joinTrip("Invite-1");
    });
    expect(joinedId).toBeNull();
    expect(travel.storageWarning).toContain(
      "Вы присоединились к поездке, но не удалось обновить список",
    );
  });

  it("maps an unknown or expired invite code to a useful message", async () => {
    vi.mocked(sdk.tripsJoinTrip).mockResolvedValue(fail(404));
    await act(async () => {
      await expect(travel.joinTrip("missing")).rejects.toThrow(
        "Код приглашения не найден или больше не действует.",
      );
    });
  });

  it("maps an existing collaborator conflict to a useful message", async () => {
    vi.mocked(sdk.tripsJoinTrip).mockResolvedValue({
      data: undefined,
      request: new Request("https://example.com"),
      error: { errorCode: "UserIsAlreadyACollaborator" },
      response: new Response(null, { status: 409 }),
    });
    await act(async () => {
      await expect(travel.joinTrip("Invite-1")).rejects.toThrow(
        "Вы уже участвуете в этой поездке",
      );
    });
  });

  it("validates the invite use limit before calling the API", async () => {
    await act(async () => {
      await expect(
        travel.generateInviteCode(trip.id, COLLABORATION.MAX_USES + 1),
      ).rejects.toThrow("Количество использований");
    });
    expect(sdk.tripsGenerateCode).not.toHaveBeenCalled();
  });

  it("does not block invite generation while collaborators are loading", async () => {
    vi.mocked(sdk.tripsGetTripByIdCollaborators).mockReturnValue(
      new Promise<never>(() => {}),
    );
    vi.mocked(sdk.tripsGenerateCode).mockResolvedValue(
      ok({ code: "Invite-1", uses: 1 }),
    );
    // Intentionally left pending: the read must not take the mutation lock.
    void travel.loadCollaborators(trip.id);
    await act(async () => {
      await expect(travel.generateInviteCode(trip.id, 1)).resolves.toEqual({
        code: "Invite-1",
        uses: 1,
      });
    });
  });

  it("rejects invite codes before sending obvious traversal values", async () => {
    await act(async () => {
      await expect(travel.joinTrip("..")).rejects.toThrow();
    });
    expect(sdk.tripsJoinTrip).not.toHaveBeenCalled();
  });

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
    offline.snapshot = null;
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
    expect(travel.trips[0].cover).toBe(`/api/v1${serverTrip.cover}`);
    vi.mocked(sdk.tripsGetTrips).mockResolvedValue(ok([serverTrip]));
    await act(async () => root.unmount());
    await mount();
    expect(travel.trips[0].cover).toBe(`/api/v1${serverTrip.cover}`);
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
